import React from 'react';
import { router } from 'expo-router';
import { OnboardingStep } from '../../components/OnboardingStep';

export default function OnboardingStep1() {
	const handleContinue = () => {
		console.log('Step 1: Navigating to step 2');
		router.push('/onboarding/step2');
	};

	const imagePairs = [
		{
			before: 'https://pingu-app.s3.eu-west-2.amazonaws.com/before1.jpg',
			after: 'https://pingu-app.s3.eu-west-2.amazonaws.com/after1.jpg',
			title: 'Interior design',
		},
		{
			before: 'https://pingu-app.s3.eu-west-2.amazonaws.com/before2.jpg',
			after: 'https://pingu-app.s3.eu-west-2.amazonaws.com/after2.jpg',
			title: 'Garden design',
		},
		{
			before: 'https://pingu-app.s3.eu-west-2.amazonaws.com/before3.jpg',
			after: 'https://pingu-app.s3.eu-west-2.amazonaws.com/after3.jpg',
			title: 'Exterior design',
		},
		{
			before: 'https://pingu-app.s3.eu-west-2.amazonaws.com/before4.jpg',
			after: 'https://pingu-app.s3.eu-west-2.amazonaws.com/after4.jpg',
			title: 'Style transfer',
		},
		{
			before: 'https://pingu-app.s3.eu-west-2.amazonaws.com/before5.jpg',
			after: 'https://pingu-app.s3.eu-west-2.amazonaws.com/after5.jpg',
			title: 'Repaint',
		},
		{
			before: 'https://pingu-app.s3.eu-west-2.amazonaws.com/before6.jpg',
			after: 'https://pingu-app.s3.eu-west-2.amazonaws.com/after6.jpg',
			title: 'Refloor',
		},
		{
			before: 'https://pingu-app.s3.eu-west-2.amazonaws.com/before7.jpg',
			after: 'https://pingu-app.s3.eu-west-2.amazonaws.com/after7.jpg',
			title: 'Replace objects',
		},
	];

	return (
		<OnboardingStep
			imagePairs={imagePairs}
			title="Reimagine your home with the power of AI"
			description="Instantly design your dream interior, garden, and exterior spaces with AI."
			buttonText="Continue"
			onContinue={handleContinue}
		/>
	);
}
