import React, { useRef, useState } from 'react';
import { router } from 'expo-router';
import {
	View,
	Image,
	PanResponder,
	Animated as RNAnimated,
	Dimensions,
	TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const SWIPE_THRESHOLD = screenWidth * 0.15; // Reduced threshold for easier swiping

// Calculate responsive image height with better constraints
const isSmallScreen = screenHeight < 700 || screenWidth < 400;
const isVerySmallScreen = screenHeight < 600 || screenWidth < 350;

// Responsive height calculation - conservative for small screens, larger for big screens
const imageHeight = isVerySmallScreen
	? Math.min(150, screenHeight * 0.2)
	: isSmallScreen
		? Math.min(180, screenHeight * 0.25)
		: Math.min(320, screenHeight * 0.4); // Increased for larger screens

// Debug logging
console.log('Step2 image dimensions:', {
	screenWidth,
	screenHeight,
	isSmallScreen,
	isVerySmallScreen,
	imageHeight,
	cardAreaHeight: isVerySmallScreen
		? screenHeight * 0.5
		: isSmallScreen
			? screenHeight * 0.55
			: screenHeight * 0.65,
	cardMaxHeight: isVerySmallScreen
		? screenHeight * 0.25
		: isSmallScreen
			? screenHeight * 0.3
			: screenHeight * 0.45,
});

export default function OnboardingStep2() {
	const insets = useSafeAreaInsets();
	const position = useRef(new RNAnimated.ValueXY()).current;
	const scale = useRef(new RNAnimated.Value(1)).current;
	const opacity = useRef(new RNAnimated.Value(1)).current;
	const overlayOpacity = useRef(new RNAnimated.Value(0)).current;
	const overlayScale = useRef(new RNAnimated.Value(0.8)).current;
	const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

	// Demo image data
	const demoPhoto = {
		source: require('../../assets/dog.jpg'),
		fileSize: '2.4 MB',
		creationTime: Date.now() - 86400000, // 1 day ago
	};

	const panResponder = PanResponder.create({
		onStartShouldSetPanResponder: () => true,
		onPanResponderGrant: () => {
			position.setOffset({ x: 0, y: 0 });
			position.setValue({ x: 0, y: 0 });
		},
		onPanResponderMove: (_, gestureState) => {
			position.setValue({ x: gestureState.dx, y: gestureState.dy });

			// Scale down slightly during drag
			const scaleValue = 1 - Math.abs(gestureState.dx) / (screenWidth * 2);
			scale.setValue(Math.max(0.8, scaleValue));

			// Show overlay based on swipe direction
			if (gestureState.dx < 0) setSwipeDirection('left');
			else if (gestureState.dx > 0) setSwipeDirection('right');
			else setSwipeDirection(null);

			const swipeProgress = Math.min(Math.abs(gestureState.dx) / SWIPE_THRESHOLD, 1);
			overlayOpacity.setValue(swipeProgress);
			overlayScale.setValue(0.5 + swipeProgress * 0.5);
		},
		onPanResponderRelease: (_, gestureState) => {
			position.flattenOffset();
			const shouldSwipeRight = gestureState.dx > SWIPE_THRESHOLD;
			const shouldSwipeLeft = gestureState.dx < -SWIPE_THRESHOLD;

			if (shouldSwipeRight || shouldSwipeLeft) {
				// Swipe detected - animate out and navigate
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

				const direction = shouldSwipeRight ? 'right' : 'left';

				// Animate the photo off screen
				RNAnimated.parallel([
					RNAnimated.timing(position.x, {
						toValue: shouldSwipeRight ? screenWidth * 1.5 : -screenWidth * 1.5,
						duration: 200,
						useNativeDriver: false,
					}),
					RNAnimated.timing(position.y, {
						toValue: 0,
						duration: 200,
						useNativeDriver: false,
					}),
					RNAnimated.timing(scale, {
						toValue: 0.8,
						duration: 200,
						useNativeDriver: false,
					}),
					RNAnimated.timing(opacity, {
						toValue: 0,
						duration: 200,
						useNativeDriver: false,
					}),
					RNAnimated.timing(overlayOpacity, {
						toValue: 1,
						duration: 200,
						useNativeDriver: false,
					}),
					RNAnimated.timing(overlayScale, {
						toValue: 1,
						duration: 200,
						useNativeDriver: false,
					}),
				]).start(() => {
					// Navigate after animation completes
					handleSwipe(direction);
				});
			} else {
				// Reset to original position if swipe wasn't far enough
				setSwipeDirection(null);
				RNAnimated.parallel([
					RNAnimated.spring(position.x, { toValue: 0, useNativeDriver: false }),
					RNAnimated.spring(position.y, { toValue: 0, useNativeDriver: false }),
					RNAnimated.spring(scale, { toValue: 1, useNativeDriver: false }),
					RNAnimated.spring(overlayOpacity, { toValue: 0, useNativeDriver: false }),
					RNAnimated.spring(overlayScale, { toValue: 0.5, useNativeDriver: false }),
				]).start();
			}
		},
	});

	const handleSwipe = (direction: 'left' | 'right') => {
		// Navigate to next onboarding step
		handleContinue();
	};

	const handleContinue = () => {
		console.log('Step 2: Navigating to step 3');
		router.push('/onboarding/step3');
	};

	const animatedStyle = {
		transform: [{ translateX: position.x }, { translateY: position.y }, { scale: scale }],
		opacity: opacity,
	};

	return (
		<View className="flex-1 bg-white">
			{/* Photo Display Area */}
			<View
				className="justify-start items-center px-8"
				style={{
					paddingTop: insets.top + 40,
					height: isVerySmallScreen
						? screenHeight * 0.5 // Smaller area for very small screens
						: isSmallScreen
							? screenHeight * 0.55 // Medium area for small screens
							: screenHeight * 0.65, // Larger area for normal screens
				}}
			>
				{/* Photo Card */}
				<View
					className="w-full"
					style={{
						maxHeight: isVerySmallScreen
							? screenHeight * 0.25 // Much smaller card for very small screens
							: isSmallScreen
								? screenHeight * 0.3 // Smaller card for small screens
								: screenHeight * 0.45, // Larger card for normal screens
						marginTop: 20, // Add some top margin to center the card
					}}
				>
					<RNAnimated.View
						style={[
							animatedStyle,
							{
								shadowColor: '#199dfe',
								shadowOffset: { width: 0, height: 2 },
								shadowOpacity: 0.25,
								shadowRadius: 3.84,
							},
						]}
						className="w-full"
						{...panResponder.panHandlers}
					>
						<View className="bg-white rounded-3xl overflow-hidden relative">
							<Image
								source={demoPhoto.source}
								className="w-full"
								style={{ height: imageHeight }}
								resizeMode="cover"
							/>

							{/* Swipe Overlay */}
							<RNAnimated.View
								style={{
									opacity: overlayOpacity,
									transform: [{ scale: overlayScale }],
								}}
								className="absolute inset-0 items-center justify-center"
								pointerEvents="none"
							>
								{swipeDirection === 'left' && (
									<View
										className="bg-red-500 rounded-full p-6 border-4 border-white "
										style={{
											shadowColor: '#199dfe',
											shadowOffset: { width: 0, height: 2 },
											shadowOpacity: 0.25,
											shadowRadius: 3.84,
										}}
									>
										<Ionicons name="close" size={48} color="white" />
									</View>
								)}
								{swipeDirection === 'right' && (
									<View
										className="bg-green-500 rounded-full p-6 border-4 border-white"
										style={{
											shadowColor: '#199dfe',
											shadowOffset: { width: 0, height: 2 },
											shadowOpacity: 0.25,
											shadowRadius: 3.84,
										}}
									>
										<Ionicons name="heart" size={48} color="white" />
									</View>
								)}
							</RNAnimated.View>

							<View className="p-6">
								<View className="flex-row items-center justify-between mb-2">
									<ThemedText bold variant="title-lg" className="text-gray-800">
										File 1
									</ThemedText>
									<View className="bg-gray-100 px-3 py-1 rounded-full">
										<ThemedText
											variant="title-md"
											className="text-gray-800 !text-xl"
										>
											{demoPhoto.fileSize}
										</ThemedText>
									</View>
								</View>
								<ThemedText variant="body" className="text-gray-600">
									{new Date(demoPhoto.creationTime).toLocaleDateString()}
								</ThemedText>
							</View>
						</View>
					</RNAnimated.View>
				</View>
			</View>

			{/* Content Section with 3D Background */}
			<View
				className="bg-primary px-8 rounded-t-[40px] pt-10 drop-shadow-2xl"
				style={{
					paddingBottom: insets.bottom + 40,
					flex: 1, // Take remaining space
					shadowColor: '#000',
					shadowOffset: {
						width: 0,
						height: -4,
					},
					shadowOpacity: 0.1,
					shadowRadius: 8,
					elevation: 8,
				}}
			>
				{/* Title */}
				<ThemedText
					extraBold
					variant="title-lg"
					className="text-center !uppercase text-gray-100 mb-4 !px-0"
				>
					Swipe Through Your Photos
				</ThemedText>

				{/* Description */}
				<ThemedText variant="body" className="text-center text-gray-100 !text-base">
					Try swiping left or right to see how it works. On your first swipe, we&apos;ll
					continue to the next step.
				</ThemedText>

				{/* Action Buttons */}
				<View className="px-6 flex-row justify-center space-x-8 flex gap-8 mt-8">
					<TouchableOpacity
						onPress={() => handleSwipe('left')}
						className={`bg-red-500 rounded-full items-center justify-center ${
							isVerySmallScreen ? 'w-20 h-20' : 'w-24 h-24'
						}`}
						style={{
							shadowColor: '#199dfe',
							shadowOffset: { width: 0, height: 2 },
							shadowOpacity: 0.25,
							shadowRadius: 3.84,
						}}
					>
						<Ionicons name="close" size={isVerySmallScreen ? 40 : 48} color="white" />
					</TouchableOpacity>
					<TouchableOpacity
						onPress={() => handleSwipe('right')}
						className={`bg-green-500 rounded-full items-center justify-center ${
							isVerySmallScreen ? 'w-20 h-20' : 'w-24 h-24'
						}`}
						style={{
							shadowColor: '#199dfe',
							shadowOffset: { width: 0, height: 2 },
							shadowOpacity: 0.25,
							shadowRadius: 3.84,
						}}
					>
						<Ionicons name="heart" size={isVerySmallScreen ? 40 : 48} color="white" />
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
}
