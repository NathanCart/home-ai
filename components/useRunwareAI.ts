import { useState } from 'react';
import { getStylePrompt, hasStylePrompt } from '../utils/stylePrompts';
import { getRoomPrompt, hasRoomPrompt } from '../utils/roomPrompts';
import { getHouseTypePrompt, hasHouseTypePrompt } from '../utils/houseTypePrompts';
import { getExteriorStylePrompt, hasExteriorStylePrompt } from '../utils/exteriorStylePrompts';
import { getFloorStylePrompt, hasFloorStylePrompt } from '../utils/floorStylePrompts';

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

interface GenerateExteriorParams {
	houseType?: string; // apartment, house, office-building
	style?: string;
	stylePrompt?: string; // Custom prompt for custom styles
	imageUri?: string;
	styleImageUri?: string;
}

interface InpaintingParams {
	maskImageUri: string;
	seedImageUri: string;
	prompt: string;
}

interface RepaintParams {
	imageUri: string;
	color: {
		id: string;
		name: string;
		hex: string;
	};
	prompt: string;
}

interface RefloorParams {
	imageUri: string;
	floorStyle: {
		id: string;
		name: string;
		prompt: string;
	};
}

interface StyleTransferParams {
	imageUri: string; // Room image
	styleImageUri: string; // Style reference image
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
					width: 1280,
					height: 832,
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
					referenceImages: [params.seedImageUri, params.maskImageUri], // Pass both seed and mask as reference images
					model: 'runware:108@22',
					width: 1248,
					height: 832,
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

	const generateExterior = async (
		params: GenerateExteriorParams,
		onProgress?: (progress: number) => void
	): Promise<RunwareResponse> => {
		const MAX_RETRIES = 3;
		let lastError: any = null;

		for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
			try {
				console.log(`🔄 Exterior generation attempt ${attempt}/${MAX_RETRIES}`);

				// Reset progress for retry attempts
				if (attempt > 1) {
					setGenerationProgress(0);
					if (onProgress) {
						onProgress(0);
					}
				}

				const result = await attemptExteriorGeneration(params, onProgress);
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

	const attemptExteriorGeneration = async (
		params: GenerateExteriorParams,
		onProgress?: (progress: number) => void
	): Promise<RunwareResponse> => {
		setIsGenerating(true);
		setError(null);
		setGeneratedImageUrl(null);

		const RUNWARE_API_KEY = process.env.EXPO_PUBLIC_RUNWARE_API_KEY;
		const RUNWARE_API_URL = 'https://api.runware.ai/v1';

		let progressInterval: ReturnType<typeof setInterval> | null = null;

		try {
			// Build prompt from the form inputs
			const prompt = buildExteriorPrompt(params);

			console.log('🏛️ Generating exterior with Runware API...');
			console.log('📝 Prompt:', prompt);
			console.log('🔑 API Key exists:', !!RUNWARE_API_KEY);

			// Check if API key is set
			if (!RUNWARE_API_KEY || RUNWARE_API_KEY === 'undefined') {
				throw new Error(
					'API key not configured. Please set EXPO_PUBLIC_RUNWARE_API_KEY in your .env file'
				);
			}

			const taskUUID = generateUUID();

			const requestBody: any = [
				{
					taskType: 'imageInference',
					taskUUID,
					model: 'runware:104@1',
					positivePrompt: prompt,
					width: 1280,
					height: 832,
					strength: 0.7,
					CFGScale: 9,
					steps: 40,
					numberResults: 1,
					seedImage: params.imageUri,
				},
			];

			console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));

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
			console.log('✅ Exterior API Response:', JSON.stringify(data, null, 2));

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
			console.log('✅ Exterior generation completed successfully:', imageUrl);

			return { success: true, imageUrl };
		} catch (err) {
			if (typeof progressInterval !== 'undefined' && progressInterval) {
				clearInterval(progressInterval);
			}
			const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
			console.error('❌ Error in exterior generation attempt:', errorMessage);
			throw err;
		}
	};

	const generateRepaint = async (
		params: RepaintParams,
		onProgress?: (progress: number) => void
	): Promise<RunwareResponse> => {
		const MAX_RETRIES = 3;
		let lastError: any = null;

		for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
			try {
				console.log(`🔄 Repaint generation attempt ${attempt}/${MAX_RETRIES}`);

				if (attempt > 1) {
					setGenerationProgress(0);
					if (onProgress) {
						onProgress(0);
					}
				}

				const result = await attemptRepaint(params, onProgress);
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
			userFriendlyError = 'Network connection failed. Please check your internet connection.';
		} else if (errorMessage.includes('timeout')) {
			userFriendlyError = 'Request timed out. Please try again.';
		}

		setError(userFriendlyError);
		return { success: false, error: userFriendlyError };
	};

	const attemptRepaint = async (
		params: RepaintParams,
		onProgress?: (progress: number) => void
	): Promise<RunwareResponse> => {
		setIsGenerating(true);
		setError(null);
		setGeneratedImageUrl(null);

		const RUNWARE_API_KEY = process.env.EXPO_PUBLIC_RUNWARE_API_KEY;
		const RUNWARE_API_URL = 'https://api.runware.ai/v1';

		let progressInterval: ReturnType<typeof setInterval> | null = null;

		try {
			const repaintPrompt = buildRepaintPrompt(params);
			console.log('🎨 Generating repaint with Runware API...');
			console.log('📝 Repaint Prompt:', repaintPrompt);

			if (!RUNWARE_API_KEY || RUNWARE_API_KEY === 'undefined') {
				throw new Error('API key is not configured');
			}

			const requestId = generateUUID();

			const payload = {
				taskType: 'imageInference',
				taskUUID: requestId,
				positivePrompt: repaintPrompt,
				negativePrompt:
					'blurry, low quality, distorted, artifacts, watermark, text, logo, bad composition',
				width: 1248,
				height: 832,
				// model: 'runware:108@22',
				model: 'runware:108@22',
				// steps: 30,
				outputFormat: 'WEBP',
				uploadEndpoint: 'https://api.runware.ai/upload-image',
				includeCost: true,
				referenceImages: [params.imageUri], // Array of image URIs for reference
			};

			console.log('📤 Sending request to Runware API...');

			const startTime = Date.now();

			// Simulate progress updates during the request
			progressInterval = setInterval(() => {
				const elapsed = Date.now() - startTime;
				let estimatedProgress = 0;

				// Estimate progress based on typical generation time (10-30 seconds)
				if (elapsed < 3000) {
					// First 3 seconds: 0-30%
					estimatedProgress = (elapsed / 3000) * 30;
				} else if (elapsed < 15000) {
					// Next 12 seconds: 30-85%
					estimatedProgress = 30 + ((elapsed - 3000) / 12000) * 55;
				} else {
					// After 15 seconds: 85-95% (slow progress)
					estimatedProgress = 85 + Math.min(((elapsed - 15000) / 10000) * 10, 10);
				}

				// Cap at 95% until we get the actual response
				estimatedProgress = Math.min(Math.floor(estimatedProgress), 95);

				if (onProgress) {
					onProgress(estimatedProgress);
				}
				setGenerationProgress(estimatedProgress);
			}, 200); // Update every 200ms

			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

			const response = await fetch(RUNWARE_API_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${RUNWARE_API_KEY}`,
				},
				body: JSON.stringify([payload]),
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			if (progressInterval) {
				clearInterval(progressInterval);
			}

			if (!response.ok) {
				const errorText = await response.text();
				console.error('❌ API Error Response:', errorText);
				throw new Error(`API request failed: ${response.status} - ${errorText}`);
			}

			const data = await response.json();
			console.log('✅ Repaint API Response:', JSON.stringify(data, null, 2));

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

			setIsGenerating(false);
			setGeneratedImageUrl(imageUrl);
			console.log('✅ Repaint generation completed successfully:', imageUrl);

			return { success: true, imageUrl };
		} catch (err) {
			if (typeof progressInterval !== 'undefined' && progressInterval) {
				clearInterval(progressInterval);
			}
			const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
			console.error('❌ Error in repaint attempt:', errorMessage);
			throw err;
		}
	};

	// runware:108@22

	//civitai:38784@44876
	function buildRepaintPrompt(params: RepaintParams): string {
		const parts: string[] = [];

		// Main instruction - keep everything identical except specified element
		parts.push(
			'Create an exact replica of the reference image, maintaining all original elements, composition, lighting, and perspective'
		);

		// Specify what to change
		if (params.prompt) {
			parts.push(
				`ONLY change the ${params.prompt} to be ${params.color.name} (${params.color.hex})`
			);
		}

		// Add detailed color description
		parts.push(
			`The ${params.color.name} should appear as a rich, realistic ${params.color.hex} color with natural lighting and texture appropriate for the surface`
		);

		// Preservation instructions
		parts.push(
			'Keep all other colors, objects, textures, and details exactly as they appear in the reference image'
		);
		parts.push('Maintain the exact same perspective, angle, and composition');
		parts.push('Preserve all shadows, highlights, and lighting conditions');

		// Quality descriptors
		parts.push(
			'professional interior photography, photorealistic, high detail, sharp focus, natural lighting'
		);

		return parts.join(', ');
	}

	const generateRefloor = async (
		params: RefloorParams,
		onProgress?: (progress: number) => void
	): Promise<RunwareResponse> => {
		const MAX_RETRIES = 3;
		let lastError: any = null;

		for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
			try {
				console.log(`🔄 Refloor attempt ${attempt}/${MAX_RETRIES}`);

				if (attempt > 1) {
					setGenerationProgress(0);
					if (onProgress) {
						onProgress(0);
					}
				}

				const result = await attemptRefloor(params, onProgress);
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

		// All retries failed
		console.error('❌ All refloor attempts failed');
		setIsGenerating(false);
		const errorMessage = lastError instanceof Error ? lastError.message : 'Unknown error';

		let userFriendlyError = errorMessage;
		if (errorMessage.includes('Network request failed')) {
			userFriendlyError = 'Network connection failed. Please check your internet connection.';
		} else if (errorMessage.includes('timeout')) {
			userFriendlyError = 'Request timed out. Please try again.';
		}

		setError(userFriendlyError);
		return { success: false, error: userFriendlyError };
	};

	const attemptRefloor = async (
		params: RefloorParams,
		onProgress?: (progress: number) => void
	): Promise<RunwareResponse> => {
		setIsGenerating(true);
		setError(null);
		setGeneratedImageUrl(null);

		const RUNWARE_API_KEY = process.env.EXPO_PUBLIC_RUNWARE_API_KEY;
		const RUNWARE_API_URL = 'https://api.runware.ai/v1';

		let progressInterval: ReturnType<typeof setInterval> | null = null;

		try {
			const refloorPrompt = buildRefloorPrompt(params);
			console.log('🏠 Generating refloor with Runware API...');
			console.log('📝 Refloor Prompt:', refloorPrompt);

			if (!RUNWARE_API_KEY || RUNWARE_API_KEY === 'undefined') {
				throw new Error('API key is not configured');
			}

			const requestId = generateUUID();

			const payload = {
				taskType: 'imageInference',
				taskUUID: requestId,
				positivePrompt: refloorPrompt,
				negativePrompt:
					'blurry, low quality, distorted, artifacts, watermark, text, logo, bad composition, walls changed, furniture changed, ceiling changed',
				width: 1248,
				height: 832,
				model: 'runware:108@22',
				outputFormat: 'WEBP',
				uploadEndpoint: 'https://api.runware.ai/upload-image',
				includeCost: true,
				referenceImages: [params.imageUri],
			};

			console.log('📤 Sending request to Runware API...');

			const startTime = Date.now();

			// Simulate progress updates during the request
			progressInterval = setInterval(() => {
				const elapsed = Date.now() - startTime;
				let estimatedProgress = 0;

				if (elapsed < 3000) {
					estimatedProgress = (elapsed / 3000) * 30;
				} else if (elapsed < 15000) {
					estimatedProgress = 30 + ((elapsed - 3000) / 12000) * 55;
				} else {
					estimatedProgress = 85 + Math.min(((elapsed - 15000) / 10000) * 10, 10);
				}

				estimatedProgress = Math.min(Math.floor(estimatedProgress), 95);

				if (onProgress) {
					onProgress(estimatedProgress);
				}
				setGenerationProgress(estimatedProgress);
			}, 200);

			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 60000);

			const response = await fetch(RUNWARE_API_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${RUNWARE_API_KEY}`,
				},
				body: JSON.stringify([payload]),
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			if (progressInterval) {
				clearInterval(progressInterval);
				progressInterval = null;
			}

			if (!response.ok) {
				const errorText = await response.text();
				console.error('❌ API error response:', errorText);
				throw new Error(`API request failed: ${response.status} ${response.statusText}`);
			}

			const data = await response.json();
			console.log('📦 API Response:', JSON.stringify(data, null, 2));

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

			setIsGenerating(false);
			setGeneratedImageUrl(imageUrl);
			console.log('✅ Refloor generation completed successfully:', imageUrl);

			return { success: true, imageUrl };
		} catch (err) {
			if (typeof progressInterval !== 'undefined' && progressInterval) {
				clearInterval(progressInterval);
			}
			const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
			console.error('❌ Error in refloor attempt:', errorMessage);
			throw err;
		}
	};

	function buildRefloorPrompt(params: RefloorParams): string {
		const parts: string[] = [];

		// Main instruction - keep everything identical except floor
		parts.push(
			'Create an exact replica of the reference image, maintaining all original elements, composition, lighting, and perspective'
		);

		// Specify what to change - the floor
		parts.push(`ONLY change the floor to be ${params.floorStyle.name}`);

		// Add detailed floor description from the floor style prompt
		if (params.floorStyle.prompt) {
			parts.push(params.floorStyle.prompt);
		}

		// Preservation instructions - be very specific about what NOT to change
		parts.push(
			'Keep all walls, ceiling, furniture, decor, objects, and architectural elements exactly as they appear in the reference image'
		);
		parts.push('ONLY modify the floor surface, nothing else');
		parts.push('Maintain the exact same perspective, angle, and composition');
		parts.push('Preserve all shadows, highlights, and lighting conditions');
		parts.push('Keep all room boundaries and architectural features unchanged');
		parts.push('Furniture placement and arrangement must remain identical');

		// Quality descriptors
		parts.push(
			'professional interior photography, photorealistic, high detail, sharp focus, natural lighting'
		);

		return parts.join(', ');
	}

	function buildExteriorPrompt(params: GenerateExteriorParams): string {
		const parts: string[] = [];

		// Start with building exterior context
		parts.push('A beautiful building exterior');

		// Add house type details
		if (params.houseType) {
			const houseTypeName = params.houseType.toLowerCase();
			const houseTypeId = houseTypeName.replace(/\s+/g, '-');

			parts.push(`${houseTypeName} building facade`);

			// Add detailed house type-specific requirements if available
			if (hasHouseTypePrompt(houseTypeId)) {
				const houseTypeDetails = getHouseTypePrompt(houseTypeId);
				parts.push(houseTypeDetails);
			}
		}

		// Style emphasis with detailed descriptions
		if (params.style) {
			const styleName = params.style.toLowerCase();
			let styleId = styleName.replace(/\s+/g, '-');

			// Handle common misspellings/variations
			// Map the correctly spelled name to the file's misspelled ID
			if (styleId === 'dark-bohemian') {
				styleId = 'dark-behemian'; // Match the file's ID spelling
			}

			console.log('🏛️ Exterior style processing:', {
				styleName,
				styleId,
				hasCustomPrompt: !!params.stylePrompt,
			});

			// Use custom prompt if provided (for custom styles)
			if (params.stylePrompt) {
				console.log('🏛️ Using custom exterior style prompt');
				parts.push(`${styleName} exterior style`);
				parts.push(params.stylePrompt);
			} else {
				// Try to get exterior-specific style prompt
				const exteriorStyleId = styleId;
				console.log(
					'🏛️ Looking up exterior style:',
					exteriorStyleId,
					hasExteriorStylePrompt(exteriorStyleId)
				);

				if (hasExteriorStylePrompt(exteriorStyleId)) {
					const styleDetails = getExteriorStylePrompt(exteriorStyleId);
					console.log(
						'🏛️ Using detailed exterior style prompt, length:',
						styleDetails.length
					);
					parts.push(`${styleName} exterior style`);
					parts.push(styleDetails);
				} else {
					console.log('🏛️ No exterior style prompt found, using fallback');
					// Fallback for unmapped styles
					parts.push(`${styleName} exterior aesthetic, ${styleName} architectural style`);
				}
			}
		}

		// Add professional photography context
		parts.push(
			'professional architectural photography, exterior building facade, sharp detail, high quality'
		);

		return parts.join(', ');
	}

	const generateStyleTransfer = async (
		params: StyleTransferParams,
		onProgress?: (progress: number) => void
	): Promise<RunwareResponse> => {
		const MAX_RETRIES = 3;
		let lastError: any = null;

		for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
			try {
				console.log(`🔄 Style transfer attempt ${attempt}/${MAX_RETRIES}`);

				if (attempt > 1) {
					setGenerationProgress(0);
					if (onProgress) {
						onProgress(0);
					}
				}

				const result = await attemptStyleTransfer(params, onProgress);
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
			userFriendlyError = 'Network connection failed. Please check your internet connection.';
		} else if (errorMessage.includes('timeout')) {
			userFriendlyError = 'Request timed out. Please try again.';
		}

		setError(userFriendlyError);
		return { success: false, error: userFriendlyError };
	};

	const attemptStyleTransfer = async (
		params: StyleTransferParams,
		onProgress?: (progress: number) => void
	): Promise<RunwareResponse> => {
		setIsGenerating(true);
		setError(null);
		setGeneratedImageUrl(null);

		const RUNWARE_API_KEY = process.env.EXPO_PUBLIC_RUNWARE_API_KEY;
		const RUNWARE_API_URL = 'https://api.runware.ai/v1';

		let progressInterval: ReturnType<typeof setInterval> | null = null;

		try {
			const styleTransferPrompt = buildStyleTransferPrompt();
			console.log('🎨 Generating style transfer with Runware API...');
			console.log('📝 Style Transfer Prompt:', styleTransferPrompt);

			if (!RUNWARE_API_KEY || RUNWARE_API_KEY === 'undefined') {
				throw new Error('API key is not configured');
			}

			const requestId = generateUUID();

			const payload = {
				taskType: 'imageInference',
				taskUUID: requestId,
				positivePrompt: styleTransferPrompt,
				width: 1280,
				height: 832,
				model: 'runware:104@1',
				strength: 0.8,
				CFGScale: 9,
				steps: 40,
				numberResults: 1,
				seedImage: params.imageUri, // Room image as base
				ipAdapters: [
					{
						model: 'runware:105@1',
						guideImage: params.styleImageUri, // Style reference image
						weight: 0.9, // Strong style influence
					},
				],
			};

			console.log('📤 Sending style transfer request to Runware API...');

			const startTime = Date.now();

			progressInterval = setInterval(() => {
				const elapsed = Date.now() - startTime;
				let estimatedProgress = 0;

				if (elapsed < 3000) {
					estimatedProgress = (elapsed / 3000) * 30;
				} else if (elapsed < 15000) {
					estimatedProgress = 30 + ((elapsed - 3000) / 12000) * 55;
				} else {
					estimatedProgress = 85 + Math.min(((elapsed - 15000) / 10000) * 10, 10);
				}

				estimatedProgress = Math.min(Math.floor(estimatedProgress), 95);

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
					body: JSON.stringify([payload]),
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

			if (progressInterval) {
				clearInterval(progressInterval);
				progressInterval = null;
			}

			if (!response.ok) {
				const errorText = await response.text();
				console.error('❌ API error response:', errorText);
				throw new Error(`API request failed: ${response.status} ${response.statusText}`);
			}

			const data = await response.json();
			console.log('📦 Style Transfer API Response:', JSON.stringify(data, null, 2));

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

			setIsGenerating(false);
			setGeneratedImageUrl(imageUrl);
			console.log('✅ Style transfer completed successfully:', imageUrl);

			return { success: true, imageUrl };
		} catch (err) {
			if (typeof progressInterval !== 'undefined' && progressInterval) {
				clearInterval(progressInterval);
			}
			const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
			console.error('❌ Error in style transfer attempt:', errorMessage);
			throw err;
		}
	};

	function buildStyleTransferPrompt(): string {
		const parts: string[] = [];

		parts.push('Apply the artistic style and aesthetic from the reference style image');
		parts.push('Transfer the color palette, textures, and visual style');
		parts.push('Maintain the room structure, layout, and perspective');
		parts.push(
			'Keep strucutral elements such as windows, doors, and walls positioned exactly as they are in the reference image'
		);
		parts.push('Preserve all architectural elements and furniture placement');
		parts.push('Blend the style seamlessly with the room composition');
		parts.push(
			'professional interior photography, photorealistic, high detail, sharp focus, natural lighting'
		);

		return parts.join(', ');
	}

	interface FreeformParams {
		imageUri: string;
		customPrompt: string;
	}

	const generateFreeform = async (
		params: FreeformParams,
		onProgress?: (progress: number) => void
	): Promise<RunwareResponse> => {
		const MAX_RETRIES = 3;
		let lastError: any = null;

		for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
			try {
				console.log(`🔄 Freeform generation attempt ${attempt}/${MAX_RETRIES}`);

				if (attempt > 1) {
					setGenerationProgress(0);
					if (onProgress) {
						onProgress(0);
					}
				}

				const result = await attemptFreeformGeneration(params, onProgress);
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
		} else if (errorMessage.includes('API key not configured')) {
			userFriendlyError = errorMessage;
		}

		console.error(`❌ All ${MAX_RETRIES} attempts failed. Final error:`, userFriendlyError);

		return { success: false, error: userFriendlyError };
	};

	const attemptFreeformGeneration = async (
		params: FreeformParams,
		onProgress?: (progress: number) => void
	): Promise<RunwareResponse> => {
		setIsGenerating(true);
		setError(null);
		setGeneratedImageUrl(null);

		const RUNWARE_API_KEY = process.env.EXPO_PUBLIC_RUNWARE_API_KEY;
		const RUNWARE_API_URL = 'https://api.runware.ai/v1';

		let progressInterval: ReturnType<typeof setInterval> | null = null;

		try {
			// Build prompt that emphasizes preserving everything except the requested change
			const prompt = buildFreeformPrompt(params.customPrompt);

			console.log('🎨 Generating freeform image with Runware API...');
			console.log('📝 Prompt:', prompt);
			console.log('🔑 API Key exists:', !!RUNWARE_API_KEY);

			if (!RUNWARE_API_KEY || RUNWARE_API_KEY === 'undefined') {
				throw new Error(
					'API key not configured. Please set EXPO_PUBLIC_RUNWARE_API_KEY in your .env file'
				);
			}

			const taskUUID = generateUUID();

			console.log('🖼️ Seed image URI:', params.imageUri);

			const payload = {
				taskType: 'imageInference',
				taskUUID,
				positivePrompt: prompt,
				width: 1248,
				height: 832,
				model: 'runware:108@22',
				outputFormat: 'WEBP',
				uploadEndpoint: 'https://api.runware.ai/upload-image',
				includeCost: true,
				referenceImages: [params.imageUri, params.imageUri], // Use same image twice for better preservation
			};

			console.log('📤 Sending request to Runware API...');

			const startTime = Date.now();

			progressInterval = setInterval(() => {
				const elapsed = Date.now() - startTime;
				let estimatedProgress = 0;

				if (elapsed < 3000) {
					estimatedProgress = (elapsed / 3000) * 30;
				} else if (elapsed < 15000) {
					estimatedProgress = 30 + ((elapsed - 3000) / 12000) * 55;
				} else {
					estimatedProgress = 85 + Math.min(((elapsed - 15000) / 10000) * 10, 10);
				}

				estimatedProgress = Math.min(Math.floor(estimatedProgress), 95);

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
					body: JSON.stringify([payload]),
					signal: controller.signal,
				});
			} finally {
				clearTimeout(timeoutId);
			}

			if (progressInterval) {
				clearInterval(progressInterval);
				progressInterval = null;
			}

			if (!response.ok) {
				const errorText = await response.text();
				console.error('❌ API Error Response:', errorText);
				throw new Error(`Runware API error: ${response.status} ${response.statusText}`);
			}

			const data = await response.json();
			console.log('✅ Runware API Response:', JSON.stringify(data, null, 2));

			if (onProgress) {
				onProgress(100);
			}
			setGenerationProgress(100);

			const imageUrl =
				data.data?.[0]?.imageURL ||
				data.imageURLs?.[0]?.imageURL ||
				data.imageUrl ||
				data.images?.[0]?.url;

			if (!imageUrl) {
				console.error('❌ No image URL in response:', data);
				throw new Error('No image URL returned from Runware API');
			}

			setIsGenerating(false);
			setGeneratedImageUrl(imageUrl);
			console.log('✅ Freeform generation completed successfully:', imageUrl);

			return { success: true, imageUrl };
		} catch (err) {
			if (typeof progressInterval !== 'undefined' && progressInterval) {
				clearInterval(progressInterval);
			}
			const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
			console.error('❌ Error in freeform generation attempt:', errorMessage);
			throw err;
		}
	};

	function buildFreeformPrompt(userPrompt: string): string {
		const parts: string[] = [];

		// Emphasize preserving the original image
		parts.push('Keep the exact same room layout, furniture arrangement, and perspective');
		parts.push(
			'Preserve all existing elements, objects, and architectural features exactly as they are'
		);
		parts.push('Maintain the same camera angle, lighting, and composition');
		parts.push(
			'Keep windows, doors, walls, and structural elements in the exact same positions'
		);

		// Add the user's requested change
		parts.push(`Apply the following change: ${userPrompt}`);

		// Emphasize minimal changes
		parts.push('Only modify what was specifically requested, keep everything else identical');
		parts.push(
			'Make subtle, minimal changes that preserve the original character of the space'
		);

		// Quality descriptors
		parts.push('professional interior photography, high quality, realistic lighting');
		parts.push('preserve room structure, maintain layout and perspective');

		return parts.join(', ');
	}

	return {
		generateImage,
		generateInpainting,
		generateExterior,
		generateRepaint,
		generateRefloor,
		generateStyleTransfer,
		generateFreeform,
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
	const isFreeformMode = params.mode === 'freeform';

	// Freeform mode - use custom prompt directly
	if (isFreeformMode && params.stylePrompt) {
		parts.push(
			'Keep everything identical in the image except for the described changes below.'
		);
		parts.push(params.stylePrompt);
		parts.push('professional photography, high quality, realistic lighting');
		parts.push('preserve room structure, maintain layout and perspective');
		return parts.join(', ');
	}

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
