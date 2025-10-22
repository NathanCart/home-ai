import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { useOnboarding } from '../../components/useOnboarding';
import { LoadingScreen } from 'components/LoadingScreen';

export default function OnboardingIndex() {
	const { hasCompletedOnboarding, isLoading } = useOnboarding();

	useEffect(() => {
		if (hasCompletedOnboarding === true) {
			// Onboarding already completed, go to main app
			router.replace('/(app)');
		} else if (hasCompletedOnboarding === false) {
			// Start onboarding flow
			console.log('OnboardingIndex: Starting onboarding flow, redirecting to step1');
			router.replace('/onboarding/step1');
		}
	}, [hasCompletedOnboarding]);

	// Show loading screen while checking onboarding status
	if (isLoading || hasCompletedOnboarding === null) {
		return <LoadingScreen message="Initializing onboarding..." />;
	}

	return <LoadingScreen message="Initializing onboarding..." />;
}
