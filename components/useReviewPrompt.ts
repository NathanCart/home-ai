import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import * as StoreReview from 'expo-store-review';

const FIRST_SWIPE_SESSION_KEY = 'first_swipe_session_completed2';
const REVIEW_PROMPT_SHOWN_KEY = 'review_prompt_shown2';

export const useReviewPrompt = () => {
	const [hasCompletedFirstSession, setHasCompletedFirstSession] = useState<boolean | null>(null);
	const [hasShownReviewPrompt, setHasShownReviewPrompt] = useState<boolean | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		loadReviewPromptStatus();
	}, []);

	const loadReviewPromptStatus = async () => {
		try {
			const [firstSessionCompleted, reviewPromptShown] = await Promise.all([
				AsyncStorage.getItem(FIRST_SWIPE_SESSION_KEY),
				AsyncStorage.getItem(REVIEW_PROMPT_SHOWN_KEY),
			]);

			console.log('Review prompt status loaded:', {
				firstSessionCompleted: firstSessionCompleted === 'true',
				reviewPromptShown: reviewPromptShown === 'true',
			});

			setHasCompletedFirstSession(firstSessionCompleted === 'true');
			setHasShownReviewPrompt(reviewPromptShown === 'true');
		} catch (error) {
			console.error('Error loading review prompt status:', error);
			setHasCompletedFirstSession(false);
			setHasShownReviewPrompt(false);
		} finally {
			setIsLoading(false);
		}
	};

	const markFirstSwipeSessionCompleted = async () => {
		try {
			await AsyncStorage.setItem(FIRST_SWIPE_SESSION_KEY, 'true');
			setHasCompletedFirstSession(true);
		} catch (error) {
			console.error('Error marking first swipe session as completed:', error);
		}
	};

	const showReviewPrompt = async () => {
		try {
			// Check if store review is available
			const isAvailable = await StoreReview.isAvailableAsync();

			if (!isAvailable) {
				console.log('Store review is not available on this device');
				return false;
			}

			// Show the review prompt
			await StoreReview.requestReview();

			// Mark that we've shown the review prompt
			await AsyncStorage.setItem(REVIEW_PROMPT_SHOWN_KEY, 'true');
			setHasShownReviewPrompt(true);

			console.log('Review prompt shown successfully');
			return true;
		} catch (error) {
			console.error('Error showing review prompt:', error);
			return false;
		}
	};

	const shouldShowReviewPrompt = () => {
		const shouldShow = hasCompletedFirstSession && !hasShownReviewPrompt;
		console.log('Should show review prompt:', shouldShow, {
			hasCompletedFirstSession,
			hasShownReviewPrompt,
		});
		return shouldShow;
	};

	const resetReviewPrompt = async () => {
		try {
			await Promise.all([
				AsyncStorage.removeItem(FIRST_SWIPE_SESSION_KEY),
				AsyncStorage.removeItem(REVIEW_PROMPT_SHOWN_KEY),
			]);
			setHasCompletedFirstSession(false);
			setHasShownReviewPrompt(false);
		} catch (error) {
			console.error('Error resetting review prompt:', error);
		}
	};

	return {
		hasCompletedFirstSession,
		hasShownReviewPrompt,
		isLoading,
		markFirstSwipeSessionCompleted,
		showReviewPrompt,
		shouldShowReviewPrompt,
		resetReviewPrompt,
	};
};
