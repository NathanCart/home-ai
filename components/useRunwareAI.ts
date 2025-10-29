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
	stylePrompt?: string; // Custom prompt for custom styles
	palette?: string | ColorPalette;
	imageUri?: string;
	styleImageUri?: string;
	mode?: string; // 'interior-design' | 'garden' | etc.
}

interface InpaintingParams {
	maskImageUri: string;
	seedImageUri: string;
	prompt: string;
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

				// Reset progress for retry attempts
				if (attempt > 1) {
					setGenerationProgress(0);
					if (onProgress) {
						onProgress(0);
					}
				}

				const result = await attemptGeneration(params, onProgress);
				return result;
			} catch (error) {
				lastError = error;
				console.error(`❌ Attempt ${attempt} failed:`, error);

				if (attempt < MAX_RETRIES) {
					console.log(`⏳ Retrying in ${attempt} second(s)...`);
					// Reset progress before waiting
					setGenerationProgress(0);
					if (onProgress) {
						onProgress(0);
					}
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
					CFGScale: 9, // High CFG for strong prompt influence
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

	const generateInpainting = async (
		params: InpaintingParams,
		onProgress?: (progress: number) => void
	): Promise<RunwareResponse> => {
		const MAX_RETRIES = 3;
		let lastError: any = null;

		for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
			try {
				console.log(`🔄 Inpainting attempt ${attempt}/${MAX_RETRIES}`);

				// Reset progress for retry attempts
				if (attempt > 1) {
					setGenerationProgress(0);
					if (onProgress) {
						onProgress(0);
					}
				}

				const result = await attemptInpainting(params, onProgress);
				return result;
			} catch (error) {
				lastError = error;
				console.error(`❌ Attempt ${attempt} failed:`, error);

				if (attempt < MAX_RETRIES) {
					console.log(`⏳ Retrying in ${attempt} second(s)...`);
					setGenerationProgress(0);
					if (onProgress) {
						onProgress(0);
					}
					await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
				}
			}
		}

		setIsGenerating(false);
		const errorMessage = lastError instanceof Error ? lastError.message : 'Unknown error';
		let userFriendlyError = errorMessage;
		if (errorMessage.includes('Network request failed')) {
			userFriendlyError =
				'Unable to reach Runware API after 3 attempts. Please check your internet connection and try again.';
		}

		console.error(`❌ All ${MAX_RETRIES} attempts failed. Final error:`, userFriendlyError);
		setError(userFriendlyError);
		return { success: false, error: userFriendlyError };
	};

	const attemptInpainting = async (
		params: InpaintingParams,
		onProgress?: (progress: number) => void
	): Promise<RunwareResponse> => {
		setIsGenerating(true);
		setError(null);
		setGeneratedImageUrl(null);

		const RUNWARE_API_KEY = process.env.EXPO_PUBLIC_RUNWARE_API_KEY;
		const RUNWARE_API_URL = 'https://api.runware.ai/v1';

		let progressInterval: ReturnType<typeof setInterval> | null = null;

		try {
			console.log('🎨 Generating inpainting with Runware API...');
			console.log('📝 Prompt:', params.prompt);

			if (!RUNWARE_API_KEY || RUNWARE_API_KEY === 'undefined') {
				throw new Error(
					'API key not configured. Please set EXPO_PUBLIC_RUNWARE_API_KEY in your .env file'
				);
			}

			const taskUUID = generateUUID();

			const requestBody = [
				{
					taskType: 'imageInference',
					taskUUID,
					positivePrompt: params.prompt,
					seedImage: params.seedImageUri,
					maskImage: params.maskImageUri,
					model: 'runware:102@1', // Standard inpainting model from docs
					width: 1024,
					height: 1024,
					steps: 40,
					CFGScale: 50,
					numberResults: 1,
				},
			];

			console.log('📤 Inpainting request body:', JSON.stringify(requestBody, null, 2));

			const startTime = Date.now();

			progressInterval = setInterval(() => {
				const elapsed = Date.now() - startTime;
				let estimatedProgress = 0;

				if (elapsed < 3000) {
					estimatedProgress = (elapsed / 3000) * 30;
				} else if (elapsed < 15000) {
					estimatedProgress = 30 + ((elapsed - 3000) / 12000) * 50;
				} else if (elapsed < 45000) {
					estimatedProgress = 80 + ((elapsed - 15000) / 30000) * 15;
				} else {
					estimatedProgress = Math.min(95 + ((elapsed - 45000) / 60000) * 3, 98);
				}

				estimatedProgress = Math.floor(estimatedProgress);

				if (onProgress) {
					onProgress(estimatedProgress);
				}
				setGenerationProgress(estimatedProgress);
			}, 200);

			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 60000);

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
				if (fetchError.name === 'AbortError') {
					throw new Error(
						'Request timed out. The image generation is taking longer than expected. Please try again.'
					);
				}
				throw new Error(`Network error: ${fetchError.message || 'Connection failed'}`);
			}

			clearTimeout(timeoutId);

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
			console.log('✅ Inpainting API Response:', JSON.stringify(data, null, 2));

			clearInterval(progressInterval);

			const imageUrl =
				data.data?.[0]?.imageURL ||
				data.imageURLs?.[0]?.imageURL ||
				data.imageUrl ||
				data.images?.[0]?.url;

			if (!imageUrl) {
				console.error('❌ No image URL in response. Full response:', data);
				throw new Error('No image URL in response. Response format may have changed.');
			}

			if (onProgress) {
				onProgress(100);
			}
			setGenerationProgress(100);

			setGeneratedImageUrl(imageUrl);
			console.log('✅ Inpainting completed successfully:', imageUrl);

			return { success: true, imageUrl };
		} catch (err) {
			if (typeof progressInterval !== 'undefined' && progressInterval) {
				clearInterval(progressInterval);
			}
			const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
			console.error('❌ Error in inpainting attempt:', errorMessage);
			throw err;
		}
	};

	return {
		generateImage,
		generateInpainting,
		isGenerating,
		error,
		generatedImageUrl,
		generationProgress,
		reset,
	};
}

function buildPrompt(params: GenerateImageParams): string {
	const parts: string[] = [];
	const isGardenMode = params.mode === 'garden';

	// Different prompt structure for garden vs interior
	if (isGardenMode) {
		// Garden mode - outdoor space
		parts.push('A beautiful outdoor garden space');
		parts.push('exterior garden design, outdoor landscaping, natural outdoor environment');

		// Add garden-specific elements
		parts.push('plants, flowers, trees, and natural garden elements');
		parts.push('outdoor garden space with landscaping');
	} else {
		// Interior mode - room design
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
	}

	// Style emphasis with detailed descriptions
	if (params.style) {
		const styleName = params.style.toLowerCase();
		let styleId = styleName.replace(/\s+/g, '-');

		console.log('🌱 Style processing:', {
			styleName,
			styleId,
			isGardenMode,
			hasCustomPrompt: !!params.stylePrompt,
		});

		// Use custom prompt if provided (for custom styles)
		if (params.stylePrompt) {
			console.log('🌱 Using custom style prompt');
			parts.push(`${styleName} style`);
			parts.push(params.stylePrompt);
		} else {
			// For garden mode, prepend 'garden-' prefix to get garden-specific prompts
			if (isGardenMode && !styleId.startsWith('garden-')) {
				const gardenStyleId = 'garden-' + styleId;
				console.log(
					'🌱 Checking garden prompt:',
					gardenStyleId,
					hasStylePrompt(gardenStyleId)
				);
				if (hasStylePrompt(gardenStyleId)) {
					styleId = gardenStyleId;
					console.log('🌱 Using garden prompt:', styleId);
				}
			}

			// Add style name first for anchoring
			parts.push(`${styleName} style`);

			// Add detailed style-specific elements if available
			// For garden mode, only use prompts that are explicitly garden-themed
			console.log('🌱 Final lookup:', {
				styleId,
				hasPrompt: hasStylePrompt(styleId),
				isGardenMode,
				startsWithGarden: styleId.startsWith('garden-'),
			});

			if (hasStylePrompt(styleId)) {
				const styleDetails = getStylePrompt(styleId);
				console.log('🌱 Got style details, length:', styleDetails.length);
				// In garden mode, only use this if it's a garden-specific prompt or we're in interior mode
				if (!isGardenMode || styleId.startsWith('garden-')) {
					console.log('🌱 Using detailed garden prompt');
					parts.push(styleDetails);
				} else {
					console.log('🌱 Interior prompt in garden mode - using fallback');
					// We have an interior prompt but we're in garden mode - use garden fallback instead
					if (isGardenMode) {
						parts.push(
							`${styleName} garden aesthetic, ${styleName} inspired landscaping, diverse plants and flowers`
						);
					} else {
						parts.push(styleDetails);
					}
				}
			} else {
				console.log('🌱 No detailed prompt found - using fallback');
				// Fallback for custom or unknown styles
				if (isGardenMode) {
					// Generic garden fallback for unmapped styles
					parts.push(
						`${styleName} garden aesthetic, ${styleName} inspired landscaping, diverse plants and flowers`
					);
				} else {
					parts.push(`${styleName} aesthetic, ${styleName} design elements`);
				}
			}
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
			if (isGardenMode) {
				parts.push(`flowers and plants in ${colorDescription} tones`);
				parts.push(`garden features with ${colorDescription} colors`);
			} else {
				parts.push(`walls and surfaces in ${colorDescription} tones`);
				parts.push(`furniture and decor featuring ${colorDescription} colors`);
			}
			parts.push(`dominant ${colorDescription} palette throughout`);
		}
	}

	// Quality and preservation descriptors
	if (isGardenMode) {
		parts.push('professional outdoor photography, high quality, realistic natural lighting');
		parts.push('preserve garden layout, maintain outdoor space structure and perspective');
		parts.push('realistic outdoor garden environment with natural elements');
	} else {
		parts.push('professional interior photography, high quality, realistic lighting');
		parts.push('preserve room structure, maintain layout and perspective');
		parts.push('Windows must remain windows and not be replaced with any other object');
		parts.push('Doors must remain doors and not be replaced with any other object');
	}

	return parts.join(', ');
}
