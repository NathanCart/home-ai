import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { router } from 'expo-router';
import { OnboardingStep } from '../../components/OnboardingStep';
import { useReviewPrompt } from '../../components/useReviewPrompt';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OnboardingStep2() {
	const insets = useSafeAreaInsets();
	const { showReviewPrompt } = useReviewPrompt();

	// Animation values for stars
	const star1Scale = useRef(new Animated.Value(1)).current;
	const star2Scale = useRef(new Animated.Value(1)).current;
	const star3Scale = useRef(new Animated.Value(1)).current;
	const star4Scale = useRef(new Animated.Value(1)).current;
	const star5Scale = useRef(new Animated.Value(1)).current;

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

	const handleContinue = async () => {
		console.log('Step 2: Showing review prompt');
		// Trigger the review prompt
		await showReviewPrompt();
		// Wait a bit to give the user time to interact with the review dialog
		// The review dialog is non-blocking, so we add a delay before navigating
		setTimeout(() => {
			console.log('Step 2: Navigating to step 3');
			router.push('/onboarding/step3');
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
				<>
					{/* Animated Stars */}
					<View
						className="absolute top-20 left-0 right-0 flex-row items-center justify-center"
						style={{ paddingTop: insets.top, gap: 8 }}
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
				</>
			}
		/>
	);
}
