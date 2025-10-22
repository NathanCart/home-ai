import React from 'react';
import { router } from 'expo-router';
import { OnboardingStep } from '../../components/OnboardingStep';

const onboardingVideo1 = require('../../assets/video-1.mp4');

export default function OnboardingStep1() {
	const handleContinue = () => {
		console.log('Step 1: Navigating to step 2');
		router.push('/onboarding/step2');
	};

	return (
		<OnboardingStep
			image={onboardingVideo1}
			title="Free Up Space in Your Camera Roll"
			description="Swipe to instantly clear clutter and reclaim space."
			buttonText="Get Started"
			onContinue={handleContinue}
		/>
	);
}
