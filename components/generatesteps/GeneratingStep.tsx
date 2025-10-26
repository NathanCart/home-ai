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
}

const loadingMessages = [
	'Analyzing your space...',
	'Applying design principles...',
	'Generating color schemes...',
	'Crafting perfect aesthetics...',
	'Adding finishing touches...',
	'Almost there...',
];

export function GeneratingStep({
	onComplete,
	onGenerationComplete,
	room,
	style,
	palette,
	imageUri,
}: GeneratingStepProps) {
	const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
	const [progress, setProgress] = useState(0);
	const insets = useSafeAreaInsets();

	// Runware AI hook
	const { generateImage, isGenerating, error, generatedImageUrl } = useRunwareAI();

	// Animation values - use useRef to persist across renders
	const spinValue = useRef(new Animated.Value(0)).current;
	const pulseValue = useRef(new Animated.Value(1)).current;
	const fadeValue = useRef(new Animated.Value(1)).current;

	// Start image generation when component mounts
	useEffect(() => {
		const startGeneration = async () => {
			console.log('🎨 Starting image generation...');
			console.log('📋 Input data:', { room, style, palette });

			// Start progress at 0
			setProgress(0);

			// Get room and style names
			const roomName = room?.name || room?.label || '';
			const styleName = style?.name || style?.label || '';

			const result = await generateImage(
				{
					room: roomName,
					style: styleName,
					palette,
					imageUri: imageUri || undefined,
				},
				(progress) => {
					// Update progress from the API callback
					setProgress(progress);
				}
			);

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
	}, []);

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
