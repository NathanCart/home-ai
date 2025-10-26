import { useState } from 'react';

interface ColorPalette {
	colors?: string[] | string;
	[id: string]: any;
}

interface GenerateImageParams {
	room?: string;
	style?: string;
	palette?: string | ColorPalette;
	imageUri?: string;
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

	const generateImage = async (params: GenerateImageParams): Promise<RunwareResponse> => {
		setIsGenerating(true);
		setError(null);
		setGeneratedImageUrl(null);

		const RUNWARE_API_KEY = process.env.EXPO_PUBLIC_RUNWARE_API_KEY;
		const RUNWARE_API_URL = 'https://api.runware.ai/v1';

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
			const requestBody = [
				{
					taskType: 'imageInference',
					taskUUID: taskUUID,
					positivePrompt: prompt,
					negativePrompt: 'low quality, blurry, distorted, bad anatomy, poorly drawn',
					width: 1024,
					height: 1024,
					model: 'runware:101@1', // FLUX model
					numberResults: 1,
					...(params.imageUri ? { seedImage: params.imageUri } : {}),
				},
			];

			console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));
			console.log('🌐 Making request to:', RUNWARE_API_URL);

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

			setGeneratedImageUrl(imageUrl);
			console.log('✅ Image generated successfully:', imageUrl);

			return { success: true, imageUrl };
		} catch (err) {
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
		setIsGenerating(false);
	};

	return {
		generateImage,
		isGenerating,
		error,
		generatedImageUrl,
		reset,
	};
}

function buildPrompt(params: GenerateImageParams): string {
	const parts: string[] = [];

	// Room type
	if (params.room) {
		parts.push(`a ${params.room}`);
	} else {
		parts.push('a room');
	}

	// Style
	if (params.style) {
		parts.push(`in ${params.style} style`);
	}

	// Color palette
	if (params.palette) {
		if (typeof params.palette === 'string') {
			parts.push(`with ${params.palette} color scheme`);
		} else if (params.palette.colors) {
			const colors = Array.isArray(params.palette.colors)
				? params.palette.colors.join(', ')
				: params.palette.colors;
			parts.push(`featuring ${colors} colors`);
		}
	}

	// Base style
	parts.push('modern interior design, professional photography, high quality, detailed');

	return parts.join(', ');
}
