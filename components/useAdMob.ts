import { useEffect, useState, useCallback, useRef } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import {
	RewardedAd,
	RewardedAdEventType,
	AdEventType,
	TestIds,
} from 'react-native-google-mobile-ads';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSubscriptionStatus } from './useRevenueCat';
import { addDays, isToday } from 'date-fns';

// AdMob Ad Unit IDs (replace with your actual IDs)
const AD_UNIT_IDS = {
	ios: __DEV__ ? TestIds.REWARDED : 'ca-app-pub-4272728413119527/4123398949', // 'ca-app-pub-4272728413119527/4123398949', // Replace with your iOS rewarded ad unit ID
	android: __DEV__ ? TestIds.REWARDED : 'ca-app-pub-4272728413119527/1752348489', // 'ca-app-pub-4272728413119527/1752348489', // Replace with your Android rewarded ad unit ID
};
// const AD_UNIT_IDS = {
// 	ios: 'ca-app-pub-4272728413119527/4123398949', // 'ca-app-pub-4272728413119527/4123398949', // Replace with your iOS rewarded ad unit ID
// 	android: 'ca-app-pub-4272728413119527/1752348489', // 'ca-app-pub-4272728413119527/1752348489', // Replace with your Android rewarded ad unit ID
// };

export const SESSION_COUNT_KEY = 'daily_swipe_sessions';
export const LAST_SESSION_DATE_KEY = 'last_session_date';

export function useAdMob() {
	const [isAdLoaded, setIsAdLoaded] = useState(false);
	const [isAdLoading, setIsAdLoading] = useState(false);
	const [sessionCount, setSessionCount] = useState(0);
	const [shouldShowAd, setShouldShowAd] = useState(false);
	const [rewardedAd, setRewardedAd] = useState<RewardedAd | null>(null);
	const [hasNoFillError, setHasNoFillError] = useState(false);
	const { isSubscribed } = useSubscriptionStatus();

	console.log('isSubscribed data', isSubscribed);

	// App state management
	const appState = useRef(AppState.currentState);
	const [isAdShowing, setIsAdShowing] = useState(false);
	const adTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const adEventListenersRef = useRef<(() => void)[]>([]);

	// Get the appropriate ad unit ID based on platform
	const adUnitId = Platform.OS === 'ios' ? AD_UNIT_IDS.ios : AD_UNIT_IDS.android;

	// Check if ad should be shown when session count or subscription status changes
	const checkIfShouldShowAd = useCallback(() => {
		// Show ad if user is not subscribed and this is their second session of the day

		console.log('sessionCount', sessionCount);
		const shouldShow = !isSubscribed && sessionCount >= 1;
		console.log('shouldShowdadada', shouldShow);
		setShouldShowAd(shouldShow);
	}, [isSubscribed, sessionCount]);

	// Load daily session count on mount
	useEffect(() => {
		loadSessionCount();
	}, []);

	// Check if ad should be shown when session count or subscription status changes
	useEffect(() => {
		checkIfShouldShowAd();
	}, [checkIfShouldShowAd]);

	// App state change handler
	useEffect(() => {
		const handleAppStateChange = (nextAppState: AppStateStatus) => {
			console.log('App state changed from', appState.current, 'to', nextAppState);

			// If app is going to background while ad is showing, mark it as not showing
			if (
				appState.current === 'active' &&
				nextAppState.match(/inactive|background/) &&
				isAdShowing
			) {
				console.log('App went to background while ad was showing - cleaning up');
				setIsAdShowing(false);
				setIsAdLoading(false);
				// Clear any pending timeouts
				if (adTimeoutRef.current) {
					clearTimeout(adTimeoutRef.current);
					adTimeoutRef.current = null;
				}
			}

			// If app is coming back to foreground, always reset ad states to prevent stuck states
			if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
				console.log('App returned to foreground - resetting ad states');
				setIsAdShowing(false);
				setIsAdLoading(false);
				// Clear any pending timeouts
				if (adTimeoutRef.current) {
					clearTimeout(adTimeoutRef.current);
					adTimeoutRef.current = null;
				}
			}

			appState.current = nextAppState;
		};

		const subscription = AppState.addEventListener('change', handleAppStateChange);
		return () => subscription?.remove();
	}, [isAdShowing]);

	// Cleanup effect to ensure proper state reset on unmount
	useEffect(() => {
		return () => {
			console.log('useAdMob cleanup - resetting all ad states');
			setIsAdShowing(false);
			setIsAdLoading(false);
			if (adTimeoutRef.current) {
				clearTimeout(adTimeoutRef.current);
				adTimeoutRef.current = null;
			}
		};
	}, []);

	// Initialize rewarded ad
	useEffect(() => {
		const ad = RewardedAd.createForAdRequest(adUnitId, {
			requestNonPersonalizedAdsOnly: false,
		});
		setRewardedAd(ad);

		// Set up event listeners with proper cleanup tracking
		const unsubscribeLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
			console.log('Rewarded ad loaded successfully');
			setIsAdLoaded(true);
			setIsAdLoading(false);
			setHasNoFillError(false); // Reset no-fill error when ad loads successfully
			// Clear any loading timeout
			if (adTimeoutRef.current) {
				clearTimeout(adTimeoutRef.current);
				adTimeoutRef.current = null;
			}
		});

		const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, (error) => {
			console.error('Rewarded ad error:', error);
			setIsAdLoaded(false);
			setIsAdLoading(false);
			setIsAdShowing(false);

			// Check for no-fill error specifically
			if (error.message && error.message.includes('no-fill')) {
				console.log('No-fill error detected - no ads available');
				// Store the error to be thrown when showRewardedAd is called
				setHasNoFillError(true);
			}

			// Clear any loading timeout
			if (adTimeoutRef.current) {
				clearTimeout(adTimeoutRef.current);
				adTimeoutRef.current = null;
			}
		});

		// Track event listeners for cleanup
		adEventListenersRef.current = [unsubscribeLoaded, unsubscribeError];

		// Load the ad with timeout protection
		console.log('Loading rewarded ad...');
		setIsAdLoading(true);

		// Set a timeout for ad loading
		adTimeoutRef.current = setTimeout(() => {
			console.log('Ad loading timeout - marking as failed');
			setIsAdLoaded(false);
			setIsAdLoading(false);
		}, 15000); // 15 second timeout

		ad.load();

		return () => {
			// Clean up all event listeners
			adEventListenersRef.current.forEach((unsubscribe) => unsubscribe());
			adEventListenersRef.current = [];

			// Clear any pending timeouts
			if (adTimeoutRef.current) {
				clearTimeout(adTimeoutRef.current);
				adTimeoutRef.current = null;
			}
		};
	}, [adUnitId]);

	const loadSessionCount = async () => {
		try {
			const today = new Date();
			const lastSessionDate = await AsyncStorage.getItem(LAST_SESSION_DATE_KEY);

			console.log('lastSessionDate', lastSessionDate);

			if (isToday(lastSessionDate ?? addDays(new Date(), -10))) {
				console.log('Same day');

				// Same day, use stored count
				setSessionCount(1);
			} else {
				// New day, reset count
				setSessionCount(0);
			}
		} catch (error) {
			console.error('Error loading session count:', error);
			setSessionCount(0);
		}
	};

	const incrementSessionCount = async () => {
		try {
			const newCount = sessionCount + 1;
			setSessionCount(newCount);
			await AsyncStorage.setItem(SESSION_COUNT_KEY, newCount.toString());
		} catch (error) {
			console.error('Error incrementing session count:', error);
		}
	};

	const loadRewardedAd = useCallback(async (): Promise<boolean> => {
		if (isAdLoaded || isAdLoading) {
			return isAdLoaded;
		}

		setIsAdLoading(true);

		try {
			if (rewardedAd) {
				console.log('Reloading rewarded ad...');
				rewardedAd.load();

				// Only set timeout if one doesn't already exist
				if (!adTimeoutRef.current) {
					adTimeoutRef.current = setTimeout(() => {
						console.log('Ad loading timeout - marking as failed');
						setIsAdLoaded(false);
						setIsAdLoading(false);
					}, 15000); // 15 second timeout
				}

				return true;
			}
			return false;
		} catch (error) {
			console.error('Error loading rewarded ad:', error);
			setIsAdLoaded(false);
			setIsAdLoading(false);
			return false;
		}
	}, [isAdLoaded, isAdLoading, rewardedAd]);

	const preloadNewAd = () => {
		if (rewardedAd) {
			console.log('Preloading new rewarded ad...');
			rewardedAd.load();
		}
	};

	const forceResetAdState = useCallback(() => {
		console.log('Force resetting ad state');
		setIsAdShowing(false);
		setIsAdLoading(false);
		setIsAdLoaded(false); // Reset loaded state to force fresh ad load
		setHasNoFillError(false); // Reset no-fill error flag
		if (adTimeoutRef.current) {
			clearTimeout(adTimeoutRef.current);
			adTimeoutRef.current = null;
		}
	}, []);

	const resetAdForNewSession = useCallback(() => {
		console.log('Resetting ad state for new session');
		setIsAdShowing(false);
		setIsAdLoading(false);
		setIsAdLoaded(false); // Reset loaded state for new session
		setHasNoFillError(false); // Reset no-fill error flag
		if (adTimeoutRef.current) {
			clearTimeout(adTimeoutRef.current);
			adTimeoutRef.current = null;
		}
	}, []);

	const retryAdLoad = useCallback(
		async (maxRetries = 3): Promise<boolean> => {
			for (let attempt = 1; attempt <= maxRetries; attempt++) {
				console.log(`Ad load retry attempt ${attempt}/${maxRetries}`);

				// Check if ad is already loaded before trying to load
				if (isAdLoaded) {
					console.log(`Ad already loaded on attempt ${attempt}`);
					return true;
				}

				try {
					const success = await loadRewardedAd();
					if (success) {
						console.log(`Ad loaded successfully on attempt ${attempt}`);
						return true;
					}
				} catch (error) {
					console.error(`Ad load attempt ${attempt} failed:`, error);
				}

				// Wait before retrying (exponential backoff)
				if (attempt < maxRetries) {
					const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
					console.log(`Waiting ${delay}ms before retry...`);
					await new Promise((resolve) => setTimeout(resolve, delay));
				}
			}

			console.log('All ad load retry attempts failed');
			return false;
		},
		[loadRewardedAd, isAdLoaded]
	);

	const showRewardedAd = async (): Promise<boolean> => {
		// Prevent multiple ad shows
		if (isAdShowing) {
			console.log('Ad already showing, ignoring request');
			return false;
		}

		// Check if we have a no-fill error from loading
		if (hasNoFillError) {
			console.log('No-fill error detected - throwing error');
			setHasNoFillError(false); // Reset the flag
			throw new Error('no-fill');
		}

		// Always check if we need to reload the ad
		if (!isAdLoaded || !rewardedAd) {
			console.log('Ad not loaded or no ad instance, attempting to load...');
			setIsAdLoading(true);

			// Create a new ad instance if needed
			if (!rewardedAd) {
				const ad = RewardedAd.createForAdRequest(adUnitId, {
					requestNonPersonalizedAdsOnly: false,
				});
				setRewardedAd(ad);
			}

			if (rewardedAd) {
				rewardedAd.load();

				// Wait for the ad to load with a reasonable timeout
				const maxWaitTime = 10000; // 10 seconds max wait
				const checkInterval = 500; // Check every 500ms
				let waited = 0;

				while (!isAdLoaded && waited < maxWaitTime) {
					await new Promise((resolve) => setTimeout(resolve, checkInterval));
					waited += checkInterval;
				}

				if (!isAdLoaded) {
					console.log('Ad failed to load within timeout');
					setIsAdLoading(false);
					return false;
				}
			} else {
				console.log('No rewarded ad instance available for loading');
				setIsAdLoading(false);
				return false;
			}
		}

		if (!rewardedAd) {
			console.log('No rewarded ad instance available');
			return false;
		}

		// Double-check that ad is actually loaded before showing
		if (!isAdLoaded) {
			console.log('Ad still not loaded after retry attempts');
			return false;
		}

		// Mark ad as showing
		setIsAdShowing(true);

		// Clear any existing timeout before showing ad
		if (adTimeoutRef.current) {
			clearTimeout(adTimeoutRef.current);
			adTimeoutRef.current = null;
		}

		// Safety timeout to prevent permanent stuck state
		const safetyTimeout = setTimeout(() => {
			console.log('Safety timeout - forcing ad state reset');
			setIsAdShowing(false);
			setIsAdLoading(false);
		}, 30000); // 30 second safety timeout

		return new Promise((resolve, reject) => {
			let isResolved = false;

			const cleanup = () => {
				if (adTimeoutRef.current) {
					clearTimeout(adTimeoutRef.current);
					adTimeoutRef.current = null;
				}
				clearTimeout(safetyTimeout);
				setIsAdShowing(false);
				setIsAdLoading(false);
				// Reset ad loaded state to force reload on next attempt
				setIsAdLoaded(false);
			};

			const unsubscribeEarned = rewardedAd.addAdEventListener(
				RewardedAdEventType.EARNED_REWARD,
				(reward) => {
					if (isResolved) return;
					isResolved = true;
					console.log('User earned reward:', reward);
					unsubscribeEarned();
					cleanup();
					// Preload a new ad for next time
					setTimeout(() => preloadNewAd(), 1000);
					resolve(true);
				}
			);

			const unsubscribeClosed = rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
				if (isResolved) return;
				isResolved = true;
				console.log('Ad was closed without reward');
				unsubscribeEarned();
				unsubscribeClosed();
				cleanup();
				resolve(false);
			});

			// Set up a timeout to resolve false if ad doesn't show
			adTimeoutRef.current = setTimeout(() => {
				if (isResolved) return;
				isResolved = true;
				console.log('Ad show timeout');
				unsubscribeEarned();
				unsubscribeClosed();
				cleanup();
				resolve(false);
			}, 10000); // 10 second timeout for showing

			// Show the ad
			rewardedAd
				.show()
				.then(() => {
					console.log('Ad show started - user can now watch the ad');
					// Clear any loading timeout since ad is now showing
					if (adTimeoutRef.current) {
						clearTimeout(adTimeoutRef.current);
						adTimeoutRef.current = null;
					}
				})
				.catch((error) => {
					if (isResolved) return;
					isResolved = true;
					console.error('Error showing ad:', error);

					// Check for no-fill error specifically
					if (error.message && error.message.includes('no-fill')) {
						console.log('No ad available (no-fill) - throwing error');
						unsubscribeEarned();
						unsubscribeClosed();
						cleanup();
						reject(new Error('no-fill'));
						return;
					}

					unsubscribeEarned();
					unsubscribeClosed();
					cleanup();
					resolve(false);
				});
		});
	};

	const startSwipeSession = async (): Promise<boolean> => {
		console.log(
			'startSwipeSession called - isSubscribed:',
			isSubscribed,
			'sessionCount:',
			sessionCount
		);

		let shouldShowAd = false;

		const lastSessionDate = await AsyncStorage.getItem(LAST_SESSION_DATE_KEY);

		console.log('lastSessionDate', lastSessionDate);

		if (isToday(lastSessionDate ?? addDays(new Date(), -10))) {
			console.log('Same day');

			// Same day, use stored count
			shouldShowAd = true;
		} else {
			// New day, reset count
			shouldShowAd = false;
		}

		// If user is subscribed, allow session without ad
		if (isSubscribed) {
			console.log('User is subscribed - allowing session without ad');
			await incrementSessionCount();
			return true;
		}

		// If this is the first session of the day, allow without ad
		if (sessionCount === 0) {
			console.log('First session of the day - allowing without ad');
			await incrementSessionCount();
			return true;
		}

		// For second+ session, show ad first
		if (shouldShowAd) {
			console.log('User needs to watch ad for second session');
			const adWatched = await showRewardedAd();
			if (adWatched) {
				console.log('Ad watched successfully, starting session');
				await incrementSessionCount();
				return true;
			} else {
				console.log('Ad not watched or failed to load - blocking session');
				// User must watch the ad to continue (only if ad was available but not watched)
				return false;
			}
		}

		// Fallback - shouldn't reach here
		console.log('Fallback - allowing session');
		await incrementSessionCount();
		return true;
	};

	return {
		isAdLoaded,
		isAdLoading,
		isAdShowing,
		sessionCount,
		shouldShowAd,
		isSubscribed,
		loadRewardedAd,
		showRewardedAd,
		startSwipeSession,
		incrementSessionCount,
		preloadNewAd,
		retryAdLoad,
		forceResetAdState,
		resetAdForNewSession,
	};
}
