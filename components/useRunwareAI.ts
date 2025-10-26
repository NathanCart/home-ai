import { useState } from 'react';
import { getStylePrompt, hasStylePrompt } from '../utils/stylePrompts';

interface ColorPalette {
	colors?: string[] | string;
	[id: string]: any;
}

interface GenerateImageParams {
	room?: string;
	style?: string;
	palette?: string | ColorPalette;
	imageUri?: string;
	styleImageUri?: string;
}

interface RunwareResponse {
	success: boolean;
	imageUrl?: string;
	error?: string;
}

// Simple UUID v4 generator
function generateUUID(): string {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

// Upload an image to Runware and return its UUID
async function uploadImageToRunware(imageUrl: string, apiKey: string): Promise<string> {
	const RUNWARE_API_URL = 'https://api.runware.ai/v1';

	try {
		console.log('📤 Uploading style reference image to Runware...');
		console.log('🔗 Image URL:', imageUrl);

		const taskUUID = generateUUID();
		const requestBody = [
			{
				taskType: 'imageUpload',
				taskUUID,
				image: imageUrl, // Can be: UUID, data URI, base64, or public URL
			},
		];

		console.log('📤 Upload request:', JSON.stringify(requestBody, null, 2));

		const response = await fetch(RUNWARE_API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify(requestBody),
		}).catch((fetchError) => {
			console.error('❌ Network error during upload:', fetchError);
			throw new Error(`Network error: ${fetchError.message}`);
		});

		console.log('📥 Upload response status:', response.status);

		if (!response.ok) {
			const errorText = await response.text();
			console.error('❌ Image upload error response:', errorText);
			throw new Error(`Failed to upload image: ${response.status}`);
		}

		const data = await response.json();
		console.log('✅ Image upload response:', JSON.stringify(data, null, 2));

		// Extract the image UUID from the response
		const imageUUID = data.data?.[0]?.imageUUID;

		if (!imageUUID) {
			console.error('❌ No imageUUID in upload response:', data);
			throw new Error('No imageUUID returned from upload');
		}

		console.log('✅ Style image uploaded successfully. UUID:', imageUUID);
		return imageUUID;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error('❌ Error uploading image to Runware:', errorMessage);
		throw error;
	}
}

export function useRunwareAI() {
	const [isGenerating, setIsGenerating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
	const [generationProgress, setGenerationProgress] = useState(0);

	const generateImage = async (
		params: GenerateImageParams,
		onProgress?: (progress: number) => void
	): Promise<RunwareResponse> => {
		setIsGenerating(true);
		setError(null);
		setGeneratedImageUrl(null);

		const RUNWARE_API_KEY = process.env.EXPO_PUBLIC_RUNWARE_API_KEY;
		const RUNWARE_API_URL = 'https://api.runware.ai/v1';

		// Declare progress interval variable at function scope
		let progressInterval: ReturnType<typeof setInterval> | null = null;

		try {
			// Build prompt from the form inputs
			const prompt = buildPrompt(params);

			console.log('🎨 Generating image with Runware API...');
			console.log('📝 Prompt:', prompt);
			console.log('🔑 API Key exists:', !!RUNWARE_API_KEY);

			// Check if API key is set
			if (!RUNWARE_API_KEY || RUNWARE_API_KEY === 'undefined') {
				throw new Error(
					'API key not configured. Please set EXPO_PUBLIC_RUNWARE_API_KEY in your .env file'
				);
			}

			// Runware API expects an array with task objects
			const taskUUID = generateUUID();

			console.log(params.imageUri, 'image uri data');

			console.log(buildPrompt(params), 'runway prompt');

			// Try to upload style reference image if provided to get UUID for IP-Adapter
			// If upload fails, try using the URL directly as fallback
			let styleImageReference: string | null = null;
			if (params.styleImageUri) {
				try {
					console.log('📸 Uploading style reference image:', params.styleImageUri);
					styleImageReference = await uploadImageToRunware(
						params.styleImageUri,
						RUNWARE_API_KEY
					);
					console.log('✅ Style image UUID:', styleImageReference);
				} catch (uploadError) {
					console.warn(
						'⚠️ Image upload failed, trying direct URL as fallback:',
						uploadError
					);
					// Try using the URL directly as fallback (if it's a public URL)
					if (params.styleImageUri.startsWith('http')) {
						styleImageReference = params.styleImageUri;
						console.log('🔗 Using direct URL for IP-Adapter:', styleImageReference);
					} else {
						console.error('❌ Cannot use IP-Adapter: not a valid URL or UUID');
					}
				}
			}

			console.log('🖼️ Seed image URI:', params.imageUri);

			// Use SDXL model when we have IP-Adapter, FLUX otherwise
			const useIpAdapter = !!styleImageReference;

			const requestBody: any = [
				{
					taskType: 'imageInference',
					taskUUID,
					model: 'runware:101@1',

					positivePrompt: buildPrompt(params),
					negativePrompt:
						'low quality, blurry, distorted, bad anatomy, poorly drawn, cartoon, illustration, unrealistic',
					width: 1024,
					height: 1024,
					strength: 0.8, // Higher strength for stronger style transformation
					CFGScale: 10, // High CFG for strong prompt influence
					steps: 40, // More steps for better quality
					numberResults: 1,
					seedImage: params.imageUri,
					// Add IP-Adapter if we have a style image reference (UUID or URL)
					...(useIpAdapter
						? {
								ipAdapters: [
									{
										model: 'runware:105@1',
										guideImage: styleImageReference,
										weight: 0.85, // Strong style influence (0-1 scale)
									},
								],
							}
						: {}),
				},
			];

			console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));
			console.log('🌐 Making request to:', RUNWARE_API_URL);

			// Track request start time
			const startTime = Date.now();

			// Simulate progress updates during the request
			progressInterval = setInterval(() => {
				const elapsed = Date.now() - startTime;
				// Estimate progress based on typical generation time (10-30 seconds)
				// Start with quick initial progress, then slow down
				let estimatedProgress = 0;

				if (elapsed < 3000) {
					// First 3 seconds: 0-30%
					estimatedProgress = (elapsed / 3000) * 30;
				} else if (elapsed < 15000) {
					// 3-15 seconds: 30-80%
					estimatedProgress = 30 + ((elapsed - 3000) / 12000) * 50;
				} else if (elapsed < 45000) {
					// 15-45 seconds: 80-95%
					estimatedProgress = 80 + ((elapsed - 15000) / 30000) * 15;
				} else {
					// After 45 seconds: 95-98% (keep it loading)
					estimatedProgress = Math.min(95 + ((elapsed - 45000) / 60000) * 3, 98);
				}

				estimatedProgress = Math.floor(estimatedProgress);

				if (onProgress) {
					onProgress(estimatedProgress);
				}
				setGenerationProgress(estimatedProgress);
			}, 200); // Update every 200ms

			const response = await fetch(RUNWARE_API_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${RUNWARE_API_KEY}`,
				},
				body: JSON.stringify(requestBody),
			}).catch((fetchError) => {
				console.error('❌ Fetch error details:', fetchError);
				throw new Error(`Network error: ${fetchError.message}`);
			});

			console.log('📥 Response status:', response.status);

			if (!response.ok) {
				const errorText = await response.text();
				console.error('❌ API Error Response:', errorText);

				let errorData;
				try {
					errorData = JSON.parse(errorText);
				} catch {
					errorData = { message: errorText };
				}

				throw new Error(
					errorData.message || errorData.error || `API error: ${response.status}`
				);
			}

			const data = await response.json();
			console.log('✅ API Response:', JSON.stringify(data, null, 2));

			// Clear the progress interval
			clearInterval(progressInterval);

			// Extract the image URL from the response
			// Runware returns: { data: [{ taskUUID: "...", imageURL: "..." }] }
			const imageUrl =
				data.data?.[0]?.imageURL ||
				data.imageURLs?.[0]?.imageURL ||
				data.imageUrl ||
				data.images?.[0]?.url;

			if (!imageUrl) {
				console.error('❌ No image URL in response. Full response:', data);
				throw new Error('No image URL in response. Response format may have changed.');
			}

			// Set progress to 100%
			if (onProgress) {
				onProgress(100);
			}
			setGenerationProgress(100);

			setGeneratedImageUrl(imageUrl);
			console.log('✅ Image generated successfully:', imageUrl);

			return { success: true, imageUrl };
		} catch (err) {
			// Clear the progress interval in case of error
			if (typeof progressInterval !== 'undefined' && progressInterval) {
				clearInterval(progressInterval);
			}

			const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
			console.error('❌ Error generating image:', errorMessage);

			// More helpful error messages
			if (errorMessage.includes('Network request failed')) {
				setError(
					'Unable to reach Runware API. Please check your internet connection and try again.'
				);
			} else if (errorMessage.includes('API key not configured')) {
				setError(errorMessage);
			} else {
				setError(errorMessage);
			}

			return { success: false, error: errorMessage };
		} finally {
			setIsGenerating(false);
		}
	};

	const reset = () => {
		setError(null);
		setGeneratedImageUrl(null);
		setGenerationProgress(0);
		setIsGenerating(false);
	};

	return {
		generateImage,
		isGenerating,
		error,
		generatedImageUrl,
		generationProgress,
		reset,
	};
}

function buildPrompt(params: GenerateImageParams): string {
	const parts: string[] = [];

	// Prompt anchoring: Explicitly describe all major elements to preserve
	const roomType = params.room ? params.room.toLowerCase() : 'room';
	parts.push(`A ${roomType} interior`);

	// Style emphasis with detailed descriptions
	if (params.style) {
		const styleName = params.style.toLowerCase();
		const styleId = styleName.replace(/\s+/g, '-');

		// Add style name first for anchoring
		parts.push(`${styleName} style`);

		// Add detailed style-specific elements if available
		if (hasStylePrompt(styleId)) {
			const styleDetails = getStylePrompt(styleId);
			parts.push(styleDetails);
		} else {
			// Fallback for custom or unknown styles
			parts.push(`${styleName} aesthetic, ${styleName} design elements`);
		}
	}

	// Color palette - be specific about colors
	if (params.palette) {
		if (typeof params.palette === 'string') {
			parts.push(`color palette: ${params.palette}`);
		} else if (params.palette.colors) {
			const colors = Array.isArray(params.palette.colors)
				? params.palette.colors.join(', ')
				: params.palette.colors;
			parts.push(`featuring ${colors} colors throughout the space`);
		}
	}

	// Quality descriptors
	parts.push(
		'professional interior design photography, high resolution, realistic lighting, detailed textures'
	);

	return parts.join(', ');
}
