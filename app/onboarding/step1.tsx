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
			before: 'https://leafly-app.s3.eu-west-2.amazonaws.com/interior-bad.webp',
			after: 'https://leafly-app.s3.eu-west-2.amazonaws.com/interior-good.webp',
			title: 'Interior design',
		},
		{
			before: 'https://leafly-app.s3.eu-west-2.amazonaws.com/garden-bad.webp',
			after: 'https://leafly-app.s3.eu-west-2.amazonaws.com/garden-good.webp',
			title: 'Garden design',
		},
		{
			before: 'https://leafly-app.s3.eu-west-2.amazonaws.com/exterior-bad.webp',
			after: 'https://leafly-app.s3.eu-west-2.amazonaws.com/exterior-good.webp',
			title: 'Exterior design',
		},
		{
			before: 'https://pingu-app.s3.eu-west-2.amazonaws.com/restyle-before.webp',
			after: 'https://pingu-app.s3.eu-west-2.amazonaws.com/restyle-old.webp',
			title: 'Style transfer',
		},
		{
			before: 'https://leafly-app.s3.eu-west-2.amazonaws.com/repaint-old.webp',
			after: 'https://leafly-app.s3.eu-west-2.amazonaws.com/repaint-new.webp',
			title: 'Repaint',
		},
		{
			before: 'https://leafly-app.s3.eu-west-2.amazonaws.com/refloor-old.webp',
			after: 'https://leafly-app.s3.eu-west-2.amazonaws.com/refloor-new.webp',
			title: 'Refloor',
		},
		{
			before: 'https://leafly-app.s3.eu-west-2.amazonaws.com/replace-before.webp',
			after: 'https://leafly-app.s3.eu-west-2.amazonaws.com/replace-after.webp',
			title: 'Replace objects',
		},
	];

	return (
		<OnboardingStep
			imagePairs={imagePairs}
			title="Transform Your Home with AI"
			description="Design your dream interior, garden, and exterior spaces with the power of artificial intelligence."
			buttonText="Get Started"
			onContinue={handleContinue}
		/>
	);
}
