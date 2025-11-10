import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, ScrollView, Image, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { OnboardingStep } from '../../components/OnboardingStep';
import { useReviewPrompt } from '../../components/useReviewPrompt';
import { useOnboarding } from '../../components/useOnboarding';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/ThemedText';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function OnboardingStep2() {
	const insets = useSafeAreaInsets();
	const { showReviewPrompt } = useReviewPrompt();
	const { markOnboardingComplete } = useOnboarding();

	// Animation values for stars
	const star1Scale = useRef(new Animated.Value(1)).current;
	const star2Scale = useRef(new Animated.Value(1)).current;
	const star3Scale = useRef(new Animated.Value(1)).current;
	const star4Scale = useRef(new Animated.Value(1)).current;
	const star5Scale = useRef(new Animated.Value(1)).current;

	// Review messages to cycle through
	const reviewMessages = [
		{ text: 'Love this app! So easy to use', author: 'Sarah M.' },
		{ text: 'Amazing results every time', author: 'James T.' },
		{ text: "Best design app I've tried", author: 'Emma L.' },
		{ text: 'Incredible AI technology', author: 'Mike R.' },
		{ text: 'Transformed my home ideas', author: 'Lisa K.' },
	];

	const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
	const reviewOpacity = useRef(new Animated.Value(1)).current;
	const reviewTranslateY = useRef(new Animated.Value(0)).current;

	// Sample images from explore page (mix of interior, exterior, and garden)
	const exploreImages = [
		'https://pingu-app.s3.eu-west-2.amazonaws.com/livingroom1.jpg',
		'https://pingu-app.s3.eu-west-2.amazonaws.com/bedroom1.jpg',
		'https://pingu-app.s3.eu-west-2.amazonaws.com/kitchen1.jpg',
		'https://pingu-app.s3.eu-west-2.amazonaws.com/house1.jpg',
		'https://pingu-app.s3.eu-west-2.amazonaws.com/apartment1.jpg',
		'https://pingu-app.s3.eu-west-2.amazonaws.com/garden1.jpg',
		'https://pingu-app.s3.eu-west-2.amazonaws.com/villa1.jpg',
		'https://pingu-app.s3.eu-west-2.amazonaws.com/bathroom1.jpg',
		'https://pingu-app.s3.eu-west-2.amazonaws.com/diningroom1.jpg',
		'https://pingu-app.s3.eu-west-2.amazonaws.com/homeoffice1.jpg',
		'https://pingu-app.s3.eu-west-2.amazonaws.com/townhouse1.jpg',
		'https://pingu-app.s3.eu-west-2.amazonaws.com/cottage1.jpg',
		'https://pingu-app.s3.eu-west-2.amazonaws.com/mansion1.jpg',
		'https://pingu-app.s3.eu-west-2.amazonaws.com/nursery1.jpg',
		'https://pingu-app.s3.eu-west-2.amazonaws.com/garage1.jpg',
	];

	// Duplicate images for seamless loop
	const duplicatedImages = [...exploreImages, ...exploreImages, ...exploreImages];

	const scrollViewRef = useRef<ScrollView>(null);

	// Animate stars with staggered timing
	useEffect(() => {
		const createStarAnimation = (star: Animated.Value, delay: number) => {
			return Animated.loop(
				Animated.sequence([
					Animated.delay(delay),
					Animated.timing(star, {
						toValue: 1.3,
						duration: 800,
						useNativeDriver: true,
					}),
					Animated.timing(star, {
						toValue: 1,
						duration: 800,
						useNativeDriver: true,
					}),
				])
			);
		};

		const animations = [
			createStarAnimation(star1Scale, 0),
			createStarAnimation(star2Scale, 200),
			createStarAnimation(star3Scale, 400),
			createStarAnimation(star4Scale, 600),
			createStarAnimation(star5Scale, 800),
		];

		animations.forEach((anim) => anim.start());

		return () => {
			animations.forEach((anim) => anim.stop());
		};
	}, []);

	// Cycle through review messages
	useEffect(() => {
		const interval = setInterval(() => {
			// Fade out and slide up
			Animated.parallel([
				Animated.timing(reviewOpacity, {
					toValue: 0,
					duration: 300,
					useNativeDriver: true,
				}),
				Animated.timing(reviewTranslateY, {
					toValue: -20,
					duration: 300,
					useNativeDriver: true,
				}),
			]).start(() => {
				// Change review message
				setCurrentReviewIndex((prev) => (prev + 1) % reviewMessages.length);
				// Reset position
				reviewTranslateY.setValue(20);
				// Fade in and slide up
				Animated.parallel([
					Animated.timing(reviewOpacity, {
						toValue: 1,
						duration: 300,
						useNativeDriver: true,
					}),
					Animated.timing(reviewTranslateY, {
						toValue: 0,
						duration: 300,
						useNativeDriver: true,
					}),
				]).start();
			});
		}, 3000); // Change every 3 seconds

		return () => clearInterval(interval);
	}, []);

	// Auto-scroll the image carousel continuously
	useEffect(() => {
		let offset = 0;
		const imageWidth = 152; // Width of each image (140) + margin (12)
		const scrollSpeed = 0.3; // pixels per frame
		const totalWidth = imageWidth * exploreImages.length;

		const scrollInterval = setInterval(() => {
			offset += scrollSpeed;
			if (scrollViewRef.current) {
				scrollViewRef.current.scrollTo({
					x: offset,
					animated: false,
				});
			}
			// Reset to beginning when we've scrolled through one set of images
			// Since we have duplicated images, this creates seamless loop
			if (offset >= totalWidth) {
				offset = 0;
				if (scrollViewRef.current) {
					scrollViewRef.current.scrollTo({
						x: 0,
						animated: false,
					});
				}
			}
		}, 16); // ~60fps

		return () => clearInterval(scrollInterval);
	}, []);

	const handleContinue = async () => {
		console.log('Step 2: Showing review prompt');
		// Trigger the review prompt
		await showReviewPrompt();
		// Wait a bit to give the user time to interact with the review dialog
		// The review dialog is non-blocking, so we add a delay before navigating
		setTimeout(async () => {
			console.log('Step 2: Completing onboarding');
			// Mark onboarding as complete
			await markOnboardingComplete();
			// Navigate to main app
			router.replace('/');
		}, 2000); // 2 second delay to allow user to interact with review dialog
	};

	return (
		<OnboardingStep
			title="Show us some love"
			description="Leave a quick review on the store and help us keep improving"
			buttonText="Continue"
			onContinue={handleContinue}
			backgroundColor="#030712"
			overlayElements={
				<View className="flex-1 flex">
					{/* Animated Stars */}
					<View
						className="flex-row items-center justify-center mb-14"
						style={{ gap: 8, paddingTop: insets.top + 32 }}
					>
						<Animated.View
							style={{
								transform: [{ scale: star1Scale }],
								shadowColor: '#FFD700',
								shadowOffset: { width: 0, height: 0 },
								shadowOpacity: 0.8,
								shadowRadius: 8,
								elevation: 10,
							}}
						>
							<Ionicons name="star" size={32} color="#FFD700" />
						</Animated.View>
						<Animated.View
							style={{
								transform: [{ scale: star2Scale }],
								shadowColor: '#FFD700',
								shadowOffset: { width: 0, height: 0 },
								shadowOpacity: 0.8,
								shadowRadius: 8,
								elevation: 10,
							}}
						>
							<Ionicons name="star" size={32} color="#FFD700" />
						</Animated.View>
						<Animated.View
							style={{
								transform: [{ scale: star3Scale }],
								shadowColor: '#FFD700',
								shadowOffset: { width: 0, height: 0 },
								shadowOpacity: 0.8,
								shadowRadius: 8,
								elevation: 10,
							}}
						>
							<Ionicons name="star" size={32} color="#FFD700" />
						</Animated.View>
						<Animated.View
							style={{
								transform: [{ scale: star4Scale }],
								shadowColor: '#FFD700',
								shadowOffset: { width: 0, height: 0 },
								shadowOpacity: 0.8,
								shadowRadius: 8,
								elevation: 10,
							}}
						>
							<Ionicons name="star" size={32} color="#FFD700" />
						</Animated.View>
						<Animated.View
							style={{
								transform: [{ scale: star5Scale }],
								shadowColor: '#FFD700',
								shadowOffset: { width: 0, height: 0 },
								shadowOpacity: 0.8,
								shadowRadius: 8,
								elevation: 10,
							}}
						>
							<Ionicons name="star" size={32} color="#FFD700" />
						</Animated.View>
					</View>
					<View
						className="flex-1 flex justify-end"
						style={{ paddingBottom: insets.bottom + 225 }}
					>
						{/* Dynamic Review Messages */}
						<Animated.View
							className="items-center px-8 mb-14"
							style={{
								opacity: reviewOpacity,
								transform: [{ translateY: reviewTranslateY }],
							}}
						>
							<View className="bg-gray-800/80 rounded-2xl px-6 py-4 max-w-md">
								<ThemedText
									bold
									variant="body"
									className="text-center text-white !text-xl mb-2"
								>
									"{reviewMessages[currentReviewIndex].text}"
								</ThemedText>
								<ThemedText
									variant="body"
									className="text-center text-gray-400 !text-lg"
								>
									- {reviewMessages[currentReviewIndex].author}
								</ThemedText>
							</View>
						</Animated.View>

						{/* Continuous Horizontal Image Scroller */}
						<View style={{ height: 160, marginHorizontal: -16 }}>
							<ScrollView
								ref={scrollViewRef}
								horizontal
								showsHorizontalScrollIndicator={false}
								scrollEventThrottle={16}
								decelerationRate={0}
								scrollEnabled={false}
								contentContainerStyle={{
									paddingLeft: 16,
									paddingRight: 16,
								}}
								style={{ flex: 1 }}
							>
								{duplicatedImages.map((imageUrl, index) => (
									<View
										key={`${imageUrl}-${index}`}
										style={{
											width: 140,
											height: 140,
											marginRight: 12,
											borderRadius: 16,
											overflow: 'hidden',
										}}
									>
										<Image
											source={{ uri: imageUrl }}
											style={{
												width: '100%',
												height: '100%',
											}}
											resizeMode="cover"
										/>
									</View>
								))}
							</ScrollView>
						</View>
					</View>
				</View>
			}
		/>
	);
}
