import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

interface UseGenerateModalAnimationProps {
	currentStep: number;
	totalSteps: number;
	isTransitioning: boolean;
	setIsTransitioning: (value: boolean) => void;
	setCurrentStep: (step: number | ((prev: number) => number)) => void;
}

export function useGenerateModalAnimation({
	currentStep,
	totalSteps,
	isTransitioning,
	setIsTransitioning,
	setCurrentStep,
}: UseGenerateModalAnimationProps) {
	const slideAnimation = useRef(new Animated.Value(0)).current;
	const opacityAnimation = useRef(new Animated.Value(1)).current;
	const headerAnimation = useRef(new Animated.Value(0)).current;
	const footerAnimation = useRef(new Animated.Value(0)).current;

	// Animate header and footer when reaching generating step
	useEffect(() => {
		if (currentStep >= totalSteps + 1) {
			// Animate header up and footer down
			Animated.parallel([
				Animated.timing(headerAnimation, {
					toValue: -200,
					duration: 300,
					useNativeDriver: true,
				}),
				Animated.timing(footerAnimation, {
					toValue: 100,
					duration: 300,
					useNativeDriver: true,
				}),
			]).start();
		} else {
			// Reset animations when not on generating step
			headerAnimation.setValue(0);
			footerAnimation.setValue(0);
		}
	}, [currentStep]);

	const handleNextStep = () => {
		if (currentStep < totalSteps + 1 && !isTransitioning) {
			setIsTransitioning(true);

			// Fade out and slide left
			Animated.parallel([
				Animated.timing(opacityAnimation, {
					toValue: 0,
					duration: 200,
					useNativeDriver: true,
				}),
				Animated.timing(slideAnimation, {
					toValue: -50,
					duration: 200,
					useNativeDriver: true,
				}),
			]).start(() => {
				// Change step when fade out completes
				setCurrentStep(currentStep + 1);
				// Reset animation values for next step
				slideAnimation.setValue(50);
				opacityAnimation.setValue(0);

				// Small delay to ensure state update
				setTimeout(() => {
					// Animate in new content
					Animated.parallel([
						Animated.timing(opacityAnimation, {
							toValue: 1,
							duration: 200,
							useNativeDriver: true,
						}),
						Animated.timing(slideAnimation, {
							toValue: 0,
							duration: 200,
							useNativeDriver: true,
						}),
					]).start(() => {
						setIsTransitioning(false);
					});
				}, 10);
			});
		}
	};

	const handlePreviousStep = () => {
		if (currentStep > 1 && !isTransitioning) {
			setIsTransitioning(true);

			// Fade out and slide right
			Animated.parallel([
				Animated.timing(opacityAnimation, {
					toValue: 0,
					duration: 200,
					useNativeDriver: true,
				}),
				Animated.timing(slideAnimation, {
					toValue: 50,
					duration: 200,
					useNativeDriver: true,
				}),
			]).start(() => {
				// Change step when fade out completes
				setCurrentStep(currentStep - 1);
				// Reset animation values for previous step
				slideAnimation.setValue(-50);
				opacityAnimation.setValue(0);

				// Small delay to ensure state update
				setTimeout(() => {
					// Animate in new content
					Animated.parallel([
						Animated.timing(opacityAnimation, {
							toValue: 1,
							duration: 200,
							useNativeDriver: true,
						}),
						Animated.timing(slideAnimation, {
							toValue: 0,
							duration: 200,
							useNativeDriver: true,
						}),
					]).start(() => {
						setIsTransitioning(false);
					});
				}, 10);
			});
		}
	};

	return {
		slideAnimation,
		opacityAnimation,
		headerAnimation,
		footerAnimation,
		handleNextStep,
		handlePreviousStep,
	};
}
