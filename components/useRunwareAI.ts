import { useState } from 'react';
import { getStylePrompt, hasStylePrompt } from '../utils/stylePrompts';
import { getRoomPrompt, hasRoomPrompt } from '../utils/roomPrompts';

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

export function useRunwareAI() {
	const [isGenerating, setIsGenerating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
	const [generationProgress, setGenerationProgress] = useState(0);

	const generateImage = async (
		params: GenerateImageParams,
		onProgress?: (progress: number) => void
	): Promise<RunwareResponse> => {
		const MAX_RETRIES = 3;
		let lastError: any = null;

		for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
			try {
				console.log(`🔄 Generation attempt ${attempt}/${MAX_RETRIES}`);
				const result = await attemptGeneration(params, onProgress);
				return result;
			} catch (error) {
				lastError = error;
				console.error(`❌ Attempt ${attempt} failed:`, error);

				if (attempt < MAX_RETRIES) {
					console.log(`⏳ Retrying in ${attempt} second(s)...`);
					await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
				}
			}
		}

		// All retries failed
		setIsGenerating(false);
		const errorMessage = lastError instanceof Error ? lastError.message : 'Unknown error';

		// More helpful error messages after all retries
		let userFriendlyError = errorMessage;
		if (errorMessage.includes('Network request failed')) {
			userFriendlyError =
				'Unable to reach Runware API after 3 attempts. Please check your internet connection and try again.';
		} else if (errorMessage.includes('API key not configured')) {
			userFriendlyError = errorMessage;
		}

		console.error(`❌ All ${MAX_RETRIES} attempts failed. Final error:`, userFriendlyError);
		setError(userFriendlyError);
		return { success: false, error: userFriendlyError };
	};

	const attemptGeneration = async (
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

			// Convert style reference image to base64 if provided for IP-Adapter

			console.log('🖼️ Seed image URI:', params.imageUri);

			const useIpAdapter = !!params.styleImageUri;

			const requestBody: any = [
				{
					taskType: 'imageInference',
					taskUUID,
					model: 'runware:104@1',
					positivePrompt: buildPrompt(params),
					// negativePrompt:
					// 	'low quality, blurry, distorted, bad anatomy, poorly drawn, cartoon, illustration, unrealistic',
					width: 1024,
					height: 1024,
					strength: 0.7, // Higher strength for stronger style transformation
					CFGScale: 10, // High CFG for strong prompt influence
					steps: 40, // More steps for better quality
					numberResults: 1,
					seedImage: params.imageUri,
					// Add IP-Adapter with base64 image directly
					// ...(useIpAdapter
					// 	? {
					// 			ipAdapters: [
					// 				{
					// 					model: 'runware:105@1',
					// 					guideImage: params.styleImageUri, // Base64 data URI
					// 					weight: 0.9, // Strong style influence (0-1 scale)
					// 				},
					// 			],
					// 		}
					// 	: {}),
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

			// Create fetch with timeout (60 seconds for image generation)
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

			let response;
			try {
				response = await fetch(RUNWARE_API_URL, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${RUNWARE_API_KEY}`,
					},
					body: JSON.stringify(requestBody),
					signal: controller.signal,
				});
			} catch (fetchError: any) {
				clearTimeout(timeoutId);
				console.error('❌ Fetch error details:', fetchError);

				if (fetchError.name === 'AbortError') {
					throw new Error(
						'Request timed out. The image generation is taking longer than expected. Please try again.'
					);
				}

				throw new Error(`Network error: ${fetchError.message || 'Connection failed'}`);
			}

			clearTimeout(timeoutId);

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
			console.error('❌ Error in generation attempt:', errorMessage);

			// Don't set error state here - let the retry logic handle it
			// Just throw the error so the retry wrapper can catch it
			throw err;
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

	// Add room-specific requirements (essential elements for the room type)
	if (params.room) {
		const roomId = roomType.replace(/\s+/g, '-');
		if (hasRoomPrompt(roomId)) {
			const roomDetails = getRoomPrompt(roomId);
			parts.push(roomDetails);
		}
	}

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

	// Color palette - make it VERY prominent and specific
	if (params.palette) {
		let colorDescription = '';

		if (typeof params.palette === 'string') {
			colorDescription = params.palette;
		} else if (params.palette.colors) {
			const colors = Array.isArray(params.palette.colors)
				? params.palette.colors
				: [params.palette.colors];
			colorDescription = colors.join(' and ');
		}

		if (colorDescription) {
			// Emphasize colors multiple times for stronger adherence
			parts.push(`${colorDescription} color scheme`);
			parts.push(`walls and surfaces in ${colorDescription} tones`);
			parts.push(`furniture and decor featuring ${colorDescription} colors`);
			parts.push(`dominant ${colorDescription} palette throughout`);
		}
	}

	// Quality and preservation descriptors
	parts.push('professional interior photography, high quality, realistic lighting');
	parts.push('preserve room structure, maintain layout and perspective');
	parts.push('Windows must remain windows and not be replaced with any other object');
	parts.push('Doors must remain doors and not be replaced with any other object');

	return parts.join(', ');
}
