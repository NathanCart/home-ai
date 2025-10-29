import React, { useState, useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import { ThemedText } from '../ThemedText';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRunwareAI } from '../useRunwareAI';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface GeneratingStepProps {
	onComplete?: () => void;
	onGenerationComplete?: (imageUrl: string) => void;
	room?: any;
	style?: any;
	palette?: any;
	imageUri?: string | null;
	maskImageUri?: string | null;
	type?: string;
	customPrompt?: string;
	mode?: string;
	compact?: boolean;
	shouldStart?: boolean;
}

const loadingMessages = [
	'Analyzing the selected area...',
	'Understanding the replacement...',
	'Generating the replacement...',
	'Blending with the scene...',
	'Adding final details...',
	'Almost there...',
];

export function GeneratingStep({
	onComplete,
	onGenerationComplete,
	room,
	style,
	palette,
	imageUri,
	maskImageUri,
	type,
	customPrompt,
	mode,
	compact = false,
	shouldStart = true, // Default to true for backward compatibility
}: GeneratingStepProps) {
	const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
	const [progress, setProgress] = useState(0);
	const insets = useSafeAreaInsets();

	// Runware AI hook
	const {
		generateImage,
		generateInpainting,
		generateExterior,
		isGenerating,
		error,
		generatedImageUrl,
	} = useRunwareAI();

	// Animation values - use useRef to persist across renders
	const spinValue = useRef(new Animated.Value(0)).current;
	const pulseValue = useRef(new Animated.Value(1)).current;
	const fadeValue = useRef(new Animated.Value(1)).current;

	// Start image generation when shouldStart is true
	useEffect(() => {
		if (!shouldStart) {
			return;
		}

		const startGeneration = async () => {
			console.log('🎨 Starting image generation...');
			console.log('📋 Input data:', { room, style, palette, type });

			// Start progress at 0
			setProgress(0);

			let result;

			// Handle inpainting (replacement) with mask
			if (maskImageUri && imageUri) {
				// Use custom prompt if provided, otherwise use painting prompt or fallback
				let prompt = customPrompt;

				if (!prompt && type === 'painting') {
					prompt = buildPaintingPrompt(palette);
				}

				if (!prompt) {
					prompt = 'replaced with matching surface';
				}

				result = await generateInpainting(
					{
						maskImageUri,
						seedImageUri: imageUri,
						prompt: prompt,
					},
					(progress) => {
						setProgress(progress);
					}
				);
			} else if (mode === 'exterior-design') {
				// Exterior design generation
				const houseTypeName = room?.name || room?.label || '';
				const styleName = style?.name || style?.label || '';

				result = await generateExterior(
					{
						houseType: houseTypeName,
						style: styleName,
						stylePrompt: style?.prompt || undefined,
						imageUri: imageUri || undefined,
						styleImageUri: style?.imageUrl || undefined,
					},
					(progress) => {
						setProgress(progress);
					}
				);
			} else {
				// Standard image-to-image generation
				const roomName = room?.name || room?.label || '';
				const styleName = style?.name || style?.label || '';

				result = await generateImage(
					{
						room: roomName,
						style: styleName,
						stylePrompt: style?.prompt || undefined,
						palette,
						imageUri: imageUri || undefined,
						styleImageUri: style?.imageUrl || undefined,
						mode: mode || undefined,
					},
					(progress) => {
						setProgress(progress);
					}
				);
			}

			if (result.success && result.imageUrl) {
				console.log('✅ Image generated successfully');

				// Save to AsyncStorage
				try {
					const imageData = {
						imageUrl: result.imageUrl,
						room: room,
						style: style,
						palette: palette,
						createdAt: new Date().toISOString(),
					};

					// Get existing saved images
					const existingImages = await AsyncStorage.getItem('generated_images');
					const images = existingImages ? JSON.parse(existingImages) : [];

					// Add new image to the beginning
					images.unshift(imageData);

					// Keep only the last 50 images
					const trimmedImages = images.slice(0, 50);

					await AsyncStorage.setItem('generated_images', JSON.stringify(trimmedImages));
					console.log('✅ Image saved to AsyncStorage');
				} catch (storageError) {
					console.error('❌ Error saving to AsyncStorage:', storageError);
				}

				// Call onGenerationComplete callback to navigate to confirmation step
				setTimeout(() => {
					if (onGenerationComplete && result.imageUrl) {
						onGenerationComplete(result.imageUrl);
					} else if (onComplete) {
						onComplete();
					}
				}, 2000);
			} else {
				console.error('❌ Image generation failed:', result.error);
				// Still complete after a delay to show error state
				setTimeout(() => {
					if (onComplete) {
						onComplete();
					}
				}, 3000);
			}
		};

		startGeneration();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [shouldStart]);

	// Spinning animation
	useEffect(() => {
		Animated.loop(
			Animated.timing(spinValue, {
				toValue: 1,
				duration: 2000,
				easing: Easing.linear,
				useNativeDriver: true,
			})
		).start();
	}, []);

	// Pulsing animation
	useEffect(() => {
		Animated.loop(
			Animated.sequence([
				Animated.timing(pulseValue, {
					toValue: 1.2,
					duration: 1000,
					easing: Easing.inOut(Easing.ease),
					useNativeDriver: true,
				}),
				Animated.timing(pulseValue, {
					toValue: 1,
					duration: 1000,
					easing: Easing.inOut(Easing.ease),
					useNativeDriver: true,
				}),
			])
		).start();
	}, []);

	// Message rotation
	useEffect(() => {
		const messageInterval = setInterval(() => {
			setCurrentMessageIndex((prev) => {
				if (prev < loadingMessages.length - 1) {
					return prev + 1;
				}
				return prev;
			});
		}, 3000);

		return () => {
			clearInterval(messageInterval);
		};
	}, []);

	// Fade animation for message changes
	useEffect(() => {
		fadeValue.setValue(0);
		Animated.timing(fadeValue, {
			toValue: 1,
			duration: 500,
			useNativeDriver: true,
		}).start();
	}, [currentMessageIndex]);

	const spin = spinValue.interpolate({
		inputRange: [0, 1],
		outputRange: ['0deg', '360deg'],
	});

	// Compact version for half modal
	if (compact) {
		return (
			<View className="flex-1 justify-center items-center px-6">
				{/* Compact Spinning circles */}
				<View className="relative w-32 h-32 mb-6 mx-auto justify-center items-center">
					{/* Outer ring */}
					<Animated.View
						style={{
							position: 'absolute',
							width: 128,
							height: 128,
							top: 0,
							transform: [{ rotate: spin }],
						}}
					>
						<View className="w-full h-full rounded-full border-4 border-gray-600 border-t-transparent" />
					</Animated.View>

					{/* Inner circle with pulse */}
					<Animated.View
						style={{
							position: 'absolute',
							width: 64,
							height: 64,
							top: 32,
							transform: [{ scale: pulseValue }],
						}}
					>
						<LinearGradient
							colors={['#374151', '#111827']}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 1 }}
							style={{
								width: '100%',
								height: '100%',
								borderRadius: 32,
								justifyContent: 'center',
								alignItems: 'center',
							}}
						>
							<ThemedText variant="title-md" className="text-white" extraBold>
								{progress}%
							</ThemedText>
						</LinearGradient>
					</Animated.View>
				</View>

				{/* Loading message */}
				<Animated.View style={{ opacity: fadeValue, marginBottom: 8 }}>
					<ThemedText variant="body" className="text-gray-900 text-center" bold>
						{loadingMessages[currentMessageIndex]}
					</ThemedText>
				</Animated.View>

				{error && (
					<View className="mt-4 px-4 py-2 bg-red-100 rounded-lg">
						<ThemedText variant="body" className="text-red-600 text-center text-sm">
							Error: {error}
						</ThemedText>
					</View>
				)}
			</View>
		);
	}

	// Full version for regular modal
	return (
		<View className="flex-1 bg-gray-50 justify-center items-center px-6 h-full">
			{/* Spinning circles */}
			<View className="relative w-full h-52 mb-12  mx-auto justify-center items-center">
				{/* Outer ring */}
				<Animated.View
					style={{
						position: 'absolute',
						width: 192,
						height: 192,
						top: 0,
						transform: [{ rotate: spin }],
					}}
				>
					<View className="w-full h-full rounded-full border-4 border-gray-600 border-t-transparent" />
				</Animated.View>

				{/* Middle ring */}
				<Animated.View
					style={{
						position: 'absolute',
						width: 144,
						height: 144,
						top: 24,
						transform: [{ rotate: spin }],
						opacity: 0.6,
					}}
				>
					<View className="w-full h-full rounded-full border-4 border-gray-700 border-b-transparent" />
				</Animated.View>

				{/* Inner circle with pulse */}
				<Animated.View
					style={{
						position: 'absolute',
						width: 72,
						height: 72,
						top: 60,
						transform: [{ scale: pulseValue }],
					}}
				>
					<LinearGradient
						colors={['#374151', '#111827']}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 1 }}
						style={{
							width: '100%',
							height: '100%',
							borderRadius: 36,
							justifyContent: 'center',
							alignItems: 'center',
						}}
					>
						<ThemedText variant="title-md" className="text-white" extraBold>
							{progress}%
						</ThemedText>
					</LinearGradient>
				</Animated.View>
			</View>

			{/* Loading message */}
			<Animated.View style={{ opacity: fadeValue, marginBottom: 16 }}>
				<ThemedText variant="title-md" className="text-gray-900 text-center" extraBold>
					{loadingMessages[currentMessageIndex]}
				</ThemedText>
			</Animated.View>

			{error && (
				<View className="mt-4 px-4 py-2 bg-red-100 rounded-lg">
					<ThemedText variant="body" className="text-red-600 text-center">
						Error: {error}
					</ThemedText>
				</View>
			)}

			{/* Warning text - absolute positioned at bottom */}
			<View
				style={{
					position: 'absolute',
					bottom: insets.bottom + 24,
					left: 0,
					right: 0,
					paddingHorizontal: 24,
				}}
			>
				<ThemedText variant="body" className="text-gray-600 text-center">
					Please keep the app open and don't lock your device
				</ThemedText>
			</View>
		</View>
	);
}

function buildPaintingPrompt(palette: any): string {
	if (!palette) return 'a wall painted with realistic texture and shading';

	// Extract the hex color
	let hexColor = '';
	if (palette.hex) {
		hexColor = palette.hex.toUpperCase();
	} else if (palette.colors && Array.isArray(palette.colors) && palette.colors.length > 0) {
		// Get the main color (usually the darkest or middle one)
		hexColor = palette.colors[Math.floor(palette.colors.length / 2)];
	}

	// Extract name for context
	const colorName = palette.name || palette.title || 'color';

	// Convert hex to a descriptive color description
	const colorDescription = getColorDescriptionFromHex(hexColor, colorName);

	// Build very direct prompt for inpainting - focus only on what to paint
	const parts = [
		`painted wall in ${colorDescription} color`,
		`solid ${colorDescription} painted surface`,
	];

	return parts.join(', ');
}

function getColorDescriptionFromHex(hex: string, fallbackName: string): string {
	if (!hex) return fallbackName;

	// Remove # if present
	const hexColor = hex.replace('#', '');
	const r = parseInt(hexColor.substring(0, 2), 16);
	const g = parseInt(hexColor.substring(2, 4), 16);
	const b = parseInt(hexColor.substring(4, 6), 16);

	// Return descriptive color based on RGB values
	if (r > 200 && g > 200 && b > 200) return 'bright white or very light';
	if (r + g + b < 100) return 'very dark or black';

	// Color dominant analysis
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);

	if (r > g && r > b) {
		if (r > 200) return 'red or coral';
		if (r > 150) return 'bright red or crimson';
		return 'burgundy or dark red';
	}

	if (g > r && g > b) {
		if (g > 200) return 'bright green or lime';
		if (g > 150) return 'green or emerald';
		return 'dark green or forest green';
	}

	if (b > r && b > g) {
		if (b > 200) return 'bright blue or sky blue';
		if (b > 150) return 'blue or navy blue';
		return 'dark blue or navy';
	}

	// Gray scale
	if (max - min < 30) {
		if (r > 200) return 'light gray or silver';
		if (r > 100) return 'medium gray';
		return 'dark gray or charcoal';
	}

	return fallbackName;
}
