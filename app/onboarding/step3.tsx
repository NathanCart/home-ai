import React from 'react';
import { router } from 'expo-router';
import { OnboardingStep } from '../../components/OnboardingStep';

const onboardingVideo2 = require('../../assets/video-2.mp4');

export default function OnboardingStep3() {
	const handleContinue = () => {
		console.log('Step 3: Navigating to step 4');
		router.push('/onboarding/step4');
	};

	return (
		<OnboardingStep
			image={onboardingVideo2}
			title="Celebrate Your storage Savings"
			description="See the storage you've reclaimed and the photos you've freed."
			buttonText="Continue"
			onContinue={handleContinue}
		/>
		// <OnboardingStep
		// 	image={onboardingVideo2}
		// 	title="Optimise your storage space"
		// 	description="Never worry about running out of storage again."
		// 	buttonText="Continue"
		// 	onContinue={handleContinue}
		// />
	);
}
