import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, useWindowDimensions, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from './ThemedText';
import { CustomButton } from './CustomButton';
import { Video, ResizeMode } from 'expo-av';

interface ImagePair {
	before: string;
	after: string;
	title?: string;
}

interface OnboardingStepProps {
	image?: any; // Image or video source
	beforeImage?: string; // Before image URL for before/after effect (single pair)
	afterImage?: string; // After image URL for before/after effect (single pair)
	imagePairs?: ImagePair[]; // Array of before/after image pairs to cycle through
	title: string;
	description: string;
	buttonText: string;
	onContinue: () => void;
	isLastStep?: boolean;
	backgroundColor?: string; // Custom background color
	overlayElements?: React.ReactNode; // Custom overlay elements
}

export function OnboardingStep({
	image,
	beforeImage,
	afterImage,
	imagePairs,
	title,
	description,
	buttonText,
	onContinue,
	isLastStep = false,
	backgroundColor,
	overlayElements,
}: OnboardingStepProps) {
	const insets = useSafeAreaInsets();
	const { width: screenWidth } = useWindowDimensions();
	const sharedAnimation = useRef(new Animated.Value(0)).current;
	const animationRef = useRef<Animated.CompositeAnimation | null>(null);
	const imageWidth = screenWidth; // Full width, no padding

	// Normalize image pairs - use imagePairs if provided, otherwise use single beforeImage/afterImage
	const normalizedPairs: ImagePair[] = imagePairs
		? imagePairs
		: beforeImage && afterImage
			? [{ before: beforeImage, after: afterImage }]
			: [];

	const [beforeImageIndex, setBeforeImageIndex] = React.useState(0);
	const [afterImageIndex, setAfterImageIndex] = React.useState(0);
	const [titleIndex, setTitleIndex] = React.useState(0);
	const beforeImageIndexRef = useRef(0);
	const afterImageIndexRef = useRef(0);
	const currentBeforeImage = normalizedPairs[beforeImageIndex]?.before;
	const currentAfterImage = normalizedPairs[afterImageIndex]?.after;
	const currentTitle = normalizedPairs[titleIndex]?.title;
	const hasBeforeAfterAnimation = normalizedPairs.length > 0;

	// Keep refs in sync with state
	React.useEffect(() => {
		beforeImageIndexRef.current = beforeImageIndex;
		afterImageIndexRef.current = afterImageIndex;
	}, [beforeImageIndex, afterImageIndex]);

	// Preload next images
	React.useEffect(() => {
		const nextBeforeIdx = (beforeImageIndex + 1) % normalizedPairs.length;
		const nextAfterIdx = (afterImageIndex + 1) % normalizedPairs.length;
		const nextBeforeImg = normalizedPairs[nextBeforeIdx]?.before;
		const nextAfterImg = normalizedPairs[nextAfterIdx]?.after;
		if (nextBeforeImg) {
			Image.prefetch(nextBeforeImg);
		}
		if (nextAfterImg) {
			Image.prefetch(nextAfterImg);
		}
	}, [beforeImageIndex, afterImageIndex, normalizedPairs]);

	// Sparkle animations
	const sparkleAnimations = useRef(
		Array.from({ length: 8 }, () => ({
			opacity: new Animated.Value(0),
			scale: new Animated.Value(0),
			translateX: new Animated.Value(0),
			translateY: new Animated.Value(0),
		}))
	).current;

	// Start the shared animation loop for before/after effect
	useEffect(() => {
		if (hasBeforeAfterAnimation && normalizedPairs.length > 0) {
			// Listen to animation value to switch pairs and preload images
			const listenerId = sharedAnimation.addListener(({ value }) => {
				const prevValue = prevValueRef.current;
				prevValueRef.current = value;

				// When after is at 100% (value >= 0.99), switch before image to next pair
				if (prevValue < 0.99 && value >= 0.99 && !hasSwitchedRef.current) {
					hasSwitchedRef.current = true;
					// Switch to next pair's before image instantly
					setBeforeImageIndex((prev) => {
						const next = (prev + 1) % normalizedPairs.length;
						beforeImageIndexRef.current = next;
						return next;
					});
					// Preload next before image
					const nextBeforeIdx =
						(beforeImageIndexRef.current + 1) % normalizedPairs.length;
					const nextBeforeImg = normalizedPairs[nextBeforeIdx]?.before;
					if (nextBeforeImg) {
						Image.prefetch(nextBeforeImg);
					}
				}

				// When animation is going back (from 1 to 0), fade title and update text content at the same time
				// Trigger when crossing from above 0.5 to below 0.5 (halfway through the swipe back)
				if (
					prevValue > 0.9 &&
					value <= 0.9 &&
					hasSwitchedRef.current &&
					!titleFadeTriggeredRef.current
				) {
					titleFadeTriggeredRef.current = true;
					// Fade out current title
					Animated.timing(titleOpacity, {
						toValue: 0,
						duration: 300,
						useNativeDriver: true,
					}).start(() => {
						// Update text content to match the current before image index and fade in new title
						setTitleIndex(beforeImageIndexRef.current);
						// Fade in new title
						Animated.timing(titleOpacity, {
							toValue: 1,
							duration: 300,
							useNativeDriver: true,
						}).start();
					});
				}

				// Reset fade trigger when animation goes back to 0
				if (value <= 0.01) {
					titleFadeTriggeredRef.current = false;
				}

				// When before is at 100% (value <= 0.01, after fully hidden), switch after image to next pair
				if (prevValue > 0.01 && value <= 0.01 && hasSwitchedRef.current) {
					hasSwitchedRef.current = false;
					setAfterImageIndex((prev) => {
						const next = (prev + 1) % normalizedPairs.length;
						afterImageIndexRef.current = next;
						return next;
					});
					// Preload next after image
					const nextAfterIdx = (afterImageIndexRef.current + 1) % normalizedPairs.length;
					const nextAfterImg = normalizedPairs[nextAfterIdx]?.after;
					if (nextAfterImg) {
						Image.prefetch(nextAfterImg);
					}
				}
			});

			const createAnimationSequence = () => {
				return Animated.sequence([
					// Reveal to 30%
					Animated.timing(sharedAnimation, {
						toValue: 0.3,
						duration: 600,
						easing: Easing.out(Easing.quad),
						useNativeDriver: false,
					}),
					// Bounce back a little (more subtle)
					Animated.spring(sharedAnimation, {
						toValue: 0.27,
						tension: 80,
						friction: 7,
						useNativeDriver: false,
					}),
					// Continue to full reveal
					Animated.timing(sharedAnimation, {
						toValue: 1, // Show after
						duration: 1400,
						easing: Easing.bezier(0.4, 0.0, 0.2, 1),
						useNativeDriver: false,
					}),
					Animated.delay(1000),

					Animated.timing(sharedAnimation, {
						toValue: 0, // Swipe back to before (this triggers next pair switch)
						duration: 2000,
						easing: Easing.bezier(0.4, 0.0, 0.2, 1),
						useNativeDriver: false,
					}),
					// No delay here - immediately start next cycle for seamless transition
				]);
			};

			const animation = Animated.loop(createAnimationSequence());
			animationRef.current = animation;
			animation.start();

			return () => {
				sharedAnimation.removeListener(listenerId);
				if (animationRef.current) {
					animationRef.current.stop();
				}
			};
		}
	}, [hasBeforeAfterAnimation, normalizedPairs.length, sharedAnimation]);

	// Track previous animation value to detect direction
	const prevValueRef = useRef(0);
	const sparkleTriggeredRef = useRef(false);
	const hasSwitchedRef = useRef(false);
	const titleFadeTriggeredRef = useRef(false);
	const titleOpacity = useRef(new Animated.Value(1)).current;

	// Sparkle effect when revealing after image - only when going from 0 to 1
	useEffect(() => {
		if (hasBeforeAfterAnimation) {
			const createSparkleAnimation = (
				sparkle: (typeof sparkleAnimations)[0],
				index: number
			) => {
				const randomX = (Math.random() - 0.5) * 80;
				const randomY = (Math.random() - 0.5) * 80;

				return Animated.sequence([
					Animated.delay(index * 100), // Stagger sparkles
					Animated.parallel([
						Animated.timing(sparkle.opacity, {
							toValue: 1,
							duration: 150,
							useNativeDriver: true,
						}),
						Animated.timing(sparkle.scale, {
							toValue: 1.5,
							duration: 150,
							useNativeDriver: true,
						}),
						Animated.timing(sparkle.translateX, {
							toValue: randomX,
							duration: 600,
							easing: Easing.out(Easing.quad),
							useNativeDriver: true,
						}),
						Animated.timing(sparkle.translateY, {
							toValue: randomY,
							duration: 600,
							easing: Easing.out(Easing.quad),
							useNativeDriver: true,
						}),
					]),
					Animated.parallel([
						Animated.timing(sparkle.opacity, {
							toValue: 0,
							duration: 400,
							useNativeDriver: true,
						}),
						Animated.timing(sparkle.scale, {
							toValue: 0,
							duration: 400,
							useNativeDriver: true,
						}),
					]),
				]);
			};

			// Listen to sharedAnimation changes and trigger sparkles only when revealing after (0 -> 1)
			const listenerId = sharedAnimation.addListener(({ value }) => {
				const prevValue = prevValueRef.current;
				prevValueRef.current = value;

				// Trigger sparkles when crossing from below 0.05 to above 0.05 (revealing after)
				if (prevValue <= 0.05 && value > 0.05 && !sparkleTriggeredRef.current) {
					sparkleTriggeredRef.current = true;

					// Reset sparkle positions for new animation
					sparkleAnimations.forEach((sparkle) => {
						sparkle.translateX.setValue(0);
						sparkle.translateY.setValue(0);
					});

					// Start sparkle animations
					Animated.parallel(
						sparkleAnimations.map((sparkle, index) =>
							createSparkleAnimation(sparkle, index)
						)
					).start();
				}

				// Reset trigger flag when animation goes back to 0
				if (value < 0.05) {
					sparkleTriggeredRef.current = false;
				}
			});

			return () => {
				sharedAnimation.removeListener(listenerId);
				// Reset sparkle values
				sparkleAnimations.forEach((sparkle) => {
					sparkle.opacity.setValue(0);
					sparkle.scale.setValue(0);
					sparkle.translateX.setValue(0);
					sparkle.translateY.setValue(0);
				});
				prevValueRef.current = 1;
				sparkleTriggeredRef.current = false;
			};
		}
	}, [hasBeforeAfterAnimation, sharedAnimation]);

	const handlePress = () => {
		console.log('OnboardingStep: Button pressed, calling onContinue');
		onContinue();
	};

	// Before/After animation interpolations with smoother curves
	const revealPosition = hasBeforeAfterAnimation
		? sharedAnimation.interpolate({
				inputRange: [0, 0.1, 0.9, 1],
				outputRange: [0, imageWidth * 0.05, imageWidth * 0.95, imageWidth],
				extrapolate: 'clamp',
			})
		: undefined;

	// Title opacity - controlled by titleOpacity ref, stays visible during reveal, fades only when switching pairs

	return (
		<View className="flex-1 relative" style={{ backgroundColor }}>
			{/* Media Section */}
			<View className="flex-1">
				{hasBeforeAfterAnimation &&
				revealPosition &&
				currentBeforeImage &&
				currentAfterImage ? (
					<View className="w-full h-full overflow-hidden">
						{/* Before Image (Full Width - Base Layer) */}
						<Image
							key={`before-${beforeImageIndex}`}
							source={{ uri: currentBeforeImage }}
							style={{
								width: '100%',
								height: '100%',
								position: 'absolute',
							}}
							resizeMode="cover"
							fadeDuration={0}
						/>

						{/* After Image (Clipped by Width - Top Layer) */}
						<Animated.View
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								bottom: 0,
								width: revealPosition,
								overflow: 'hidden',
							}}
						>
							<Image
								key={`after-${afterImageIndex}`}
								source={{ uri: currentAfterImage }}
								style={{
									width: imageWidth,
									height: '100%',
								}}
								resizeMode="cover"
								fadeDuration={0}
							/>
						</Animated.View>

						{/* Animated Divider Line */}
						<Animated.View
							style={{
								position: 'absolute',
								top: 0,
								bottom: 0,
								left: revealPosition,
								width: 3,
								backgroundColor: '#fff',
								shadowColor: '#fff',
								shadowOffset: { width: 0, height: 0 },
								shadowOpacity: 0.8,
								shadowRadius: 8,
								elevation: 10,
							}}
						/>

						{/* Sparkle Effects */}
						{sparkleAnimations.map((sparkle, index) => {
							// Position sparkles along the reveal line, distributed vertically
							const sparkleYPercent = 20 + (index % 4) * 20; // Distribute across 20-80% of height
							// Use static positioning based on center, then animate with transforms
							const baseX = imageWidth * 0.5;

							return (
								<Animated.View
									key={index}
									style={{
										position: 'absolute',
										left: baseX,
										top: `${sparkleYPercent}%`,
										width: 10,
										height: 10,
										transform: [
											{ translateX: sparkle.translateX },
											{ translateY: sparkle.translateY },
											{ scale: sparkle.scale },
										],
										opacity: sparkle.opacity,
									}}
								>
									<View
										style={{
											width: 10,
											height: 10,
											borderRadius: 5,
											backgroundColor: '#FFD700',
											shadowColor: '#FFD700',
											shadowOffset: { width: 0, height: 0 },
											shadowOpacity: 1,
											shadowRadius: 6,
											elevation: 8,
										}}
									/>
								</Animated.View>
							);
						})}

						{/* Title Label - shows current design type, fades only when switching pairs */}
						<Animated.View
							style={{
								position: 'absolute',
								top: insets.top + 16,
								left: 0,
								right: 0,
								bottom: 0,
								alignItems: 'center',
								opacity: titleOpacity,
							}}
						>
							<View className="bg-gray-50 px-6 py-4 rounded-2xl items-center">
								{currentTitle && (
									<ThemedText
										variant="title-lg"
										className="text-gray-900"
										extraBold
									>
										{currentTitle}
									</ThemedText>
								)}
							</View>
						</Animated.View>
					</View>
				) : typeof image === 'object' && image.uri && image.uri.includes('.mp4') ? (
					<View className={`w-full h-full scale-[1.4] mb-8`}>
						<Video
							source={image}
							style={{ width: '100%', height: '100%' }}
							shouldPlay={true}
							isLooping={true}
							isMuted={true}
							resizeMode={ResizeMode.CONTAIN}
						/>
					</View>
				) : typeof image === 'number' || (typeof image === 'object' && !image.uri) ? (
					// Local video asset (require() result) - larger size
					<View className={`w-full h-full scale-[1.4] mb-8`}>
						<Video
							source={image}
							style={{ width: '100%', height: '100%' }}
							shouldPlay={true}
							isLooping={true}
							isMuted={true}
							resizeMode={ResizeMode.CONTAIN}
						/>
					</View>
				) : image ? (
					// Image - smaller size
					<View className={`w-80 h-80 mb-8`}>
						<Image source={image} className="w-full h-full" resizeMode="contain" />
					</View>
				) : null}
			</View>

			{/* Content Section - Overlay on entire screen */}
			<View
				className="absolute inset-0 justify-end px-4"
				style={{
					paddingBottom: 16,
					paddingTop: insets.top,
				}}
			>
				{/* Dark gradient overlay from bottom to top */}
				<LinearGradient
					colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,1)']}
					locations={[0.55, 0.73, 1]}
					style={{
						position: 'absolute',
						bottom: 0,
						left: 0,
						right: 0,
						top: 0,
					}}
					pointerEvents="none"
				/>

				{/* Content */}
				<View style={{ paddingBottom: insets.bottom }}>
					{/* Title */}
					<ThemedText
						extraBold
						variant="title-lg"
						className="!text-4xl text-center mb-4 !px-0 text-white"
					>
						{title}
					</ThemedText>

					{/* Description */}
					<ThemedText variant="body" bold className="text-center !text-xl text-gray-200">
						{description}
					</ThemedText>

					{/* Continue Button */}
					<View className="mt-6">
						<CustomButton
							title={buttonText}
							onPress={handlePress}
							size="lg"
							buttonTextClassName="!text-2xl"
							variant="white"
							hapticFeedback={true}
						/>
					</View>
				</View>
			</View>
			{overlayElements && (
				<View className="absolute inset-0 pointer-events-none">{overlayElements}</View>
			)}
		</View>
	);
}
