import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export const ONBOARDING_COMPLETE_KEY = 'onboarding_comp3l4d4d3de433te2';

export const useOnboarding = () => {
	const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		checkOnboardingStatus();
	}, []);

	const checkOnboardingStatus = async () => {
		try {
			const status = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
			setHasCompletedOnboarding(status === 'true');

			return status === 'true';
		} catch (error) {
			console.error('Error checking onboarding status:', error);
			setHasCompletedOnboarding(false);
		} finally {
			setIsLoading(false);
		}
	};

	const markOnboardingComplete = async () => {
		try {
			await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
			setHasCompletedOnboarding(true);
		} catch (error) {
			console.error('Error marking onboarding complete:', error);
		}
	};

	const resetOnboarding = async () => {
		try {
			await AsyncStorage.removeItem(ONBOARDING_COMPLETE_KEY);
			setHasCompletedOnboarding(false);
		} catch (error) {
			console.error('Error resetting onboarding:', error);
		}
	};

	return {
		hasCompletedOnboarding,
		isLoading,
		markOnboardingComplete,
		resetOnboarding,
		checkOnboardingStatus,
	};
};
