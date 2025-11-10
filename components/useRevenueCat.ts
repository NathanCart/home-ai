import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useRef } from 'react';
import { Platform, UIManager } from 'react-native';
import Purchases from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

// Global subscription state that components can listen to
let globalSubscriptionStatus = false;
let subscriptionListeners: ((status: boolean) => void)[] = [];

// Helper function to check if user has any active subscription
function hasActiveSubscription(customerInfo: any): boolean {
	// Check for pro entitlement first (if configured)
	if (customerInfo.entitlements?.active?.['pro']) {
		return true;
	}

	// Check for any active subscriptions
	const activeSubscriptions = customerInfo.activeSubscriptions || [];
	return activeSubscriptions.length > 0;
}

// Function to notify all listeners of subscription status changes
const notifySubscriptionListeners = (status: boolean) => {
	// Only log when status actually changes
	if (globalSubscriptionStatus !== status) {
		console.log(
			'notifySubscriptionListeners: Notifying',
			subscriptionListeners.length,
			'listeners of subscription status:',
			status
		);
	}
	globalSubscriptionStatus = status;
	subscriptionListeners.forEach((listener) => listener(status));
};

// Function to add a subscription listener
export const addSubscriptionListener = (listener: (status: boolean) => void) => {
	subscriptionListeners.push(listener);
	// Immediately call with current status
	listener(globalSubscriptionStatus);

	// Return cleanup function
	return () => {
		subscriptionListeners = subscriptionListeners.filter((l) => l !== listener);
	};
};

export function useRevenuecat(
	{
		offering,
		ignorePro,
		t,
	}: { offering?: 'default' | 'pips'; ignorePro?: boolean; t?: (key: string) => string } = {
		offering: 'default',
		ignorePro: false,
		t: () => '',
	}
) {
	const [isInitialized, setIsInitialized] = useState(false);

	async function initializeRevenueCat() {
		if (isInitialized) {
			console.log('RevenueCat already initialized, skipping...');
			return;
		}

		console.log('🚀 Initializing RevenueCat...');

		// Initialize RevenueCat with your API key
		if (Platform.OS === 'ios') {
			Purchases.configure({ apiKey: 'appl_NGiyBxAVNxrsjXuhmyEQvXHoFrQ' });
		} else if (Platform.OS === 'android') {
			Purchases.configure({ apiKey: 'goog_TtLXYbDyqHxYKfpByltTYtFnolK' });
		}

		if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
			UIManager.setLayoutAnimationEnabledExperimental(true);
		}

		// Set up subscription listener
		Purchases.addCustomerInfoUpdateListener((customerInfo) => {
			const isPro = hasActiveSubscription(customerInfo);
			notifySubscriptionListeners(isPro);
		});

		// Get initial subscription status
		try {
			console.log('📡 Getting customer info...');
			// Mark as initialized first, then get customer info in background
			setIsInitialized(true);
			console.log('✅ RevenueCat initialized successfully');

			// Get customer info in background
			const customerInfo = await Purchases.getCustomerInfo();
			const isPro = hasActiveSubscription(customerInfo);
			notifySubscriptionListeners(isPro);
		} catch (error) {
			console.error('❌ Error getting initial subscription status:', error);
			// Still mark as initialized even if there's an error to prevent infinite retries
			setIsInitialized(true);
			console.log('⚠️ RevenueCat marked as initialized despite error');
		}
	}

	async function presentPaywallIfNeeded() {
		// If NOT forcing offer, you want experiments → omit 'offering'
		const options: Parameters<typeof RevenueCatUI.presentPaywallIfNeeded>[0] = {
			requiredEntitlementIdentifier: 'pro',
		};

		// Check user's current subscription status
		try {
			const info = await Purchases.getCustomerInfo();

			console.log('presentPaywallIfNeeded: Customer info:', info);
			const isPro = hasActiveSubscription(info);
			console.log('presentPaywallIfNeeded: User isPro status:', isPro);
			console.log('presentPaywallIfNeeded: User entitlements:', info.entitlements);
			console.log(
				'presentPaywallIfNeeded: User activeSubscriptions:',
				info.activeSubscriptions
			);

			// If user is already subscribed, don't show paywall
			if (isPro) {
				console.log('presentPaywallIfNeeded: User is already subscribed, skipping paywall');
				return PAYWALL_RESULT.PURCHASED;
			}
		} catch (error) {
			console.log('presentPaywallIfNeeded: Error checking subscription status:', error);
		}

		console.log(
			'presentPaywallIfNeeded: Calling RevenueCatUI.presentPaywallIfNeeded with options:',
			options
		);

		const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywallIfNeeded(options);

		// On success (or restore), cancel the upsell right away
		if (
			paywallResult === PAYWALL_RESULT.PURCHASED ||
			paywallResult === PAYWALL_RESULT.RESTORED
		) {
			// Cancel one-time offer notifications
			const { cancelOneTimeOfferNotifications } = await import(
				'./useOneTimeOfferNotifications'
			);
			await cancelOneTimeOfferNotifications();
		}

		// --- your existing logic unchanged below ---
		if (paywallResult === PAYWALL_RESULT.PURCHASED) {
			const reviewTourCompleted = await AsyncStorage.getItem('review_tour_completed');
			if (!reviewTourCompleted) await AsyncStorage.setItem('show_review_tour', 'true');
			await AsyncStorage.setItem('just_purchased', 'true');
		}

		if (paywallResult === PAYWALL_RESULT.RESTORED) {
			const reviewTourCompleted = await AsyncStorage.getItem('review_tour_completed');
			if (!reviewTourCompleted) await AsyncStorage.setItem('show_review_tour', 'true');
		}

		return paywallResult;
	}

	async function isSubscribed() {
		if (ignorePro) return true;
		try {
			const purchaserInfo = await Purchases.getCustomerInfo();
			return hasActiveSubscription(purchaserInfo);
		} catch (error) {
			console.error('Error checking subscription status:', error);
			return false;
		}
	}

	/** Gate a premium action and return true if the user is allowed. */
	async function requireProChat(sendChat: (t: string) => void, delay = 2200) {
		if (ignorePro) return true;
		if (await isSubscribed()) return true;
		if (t) {
			sendChat?.(t('chat.premiumMessage'));
		}
		await new Promise((r) => setTimeout(r, delay));

		const res = await presentPaywallIfNeeded();
		return res === PAYWALL_RESULT.PURCHASED || (await isSubscribed());
	}

	async function proAction(action: () => Promise<any> | any) {
		if (ignorePro) return await action();
		const subscribed = await isSubscribed();
		if (!subscribed) {
			await presentPaywallIfNeeded();
		} else {
			return await action();
		}
	}

	return {
		presentPaywallIfNeeded,
		initializeRevenueCat,
		isSubscribed,
		requireProChat,
		proAction,
		isInitialized,
	};
}

// Custom hook for components to get real-time subscription updates
export function useSubscriptionStatus() {
	const [isSubscribed, setIsSubscribed] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const previousStatusRef = useRef<boolean | null>(null);

	useEffect(() => {
		// Add listener for subscription status changes
		const cleanup = addSubscriptionListener(async (status: boolean) => {
			// Only log when status actually changes
			if (previousStatusRef.current !== status) {
				console.log('useSubscriptionStatus: Subscription status changed to:', status);
				previousStatusRef.current = status;

				// Cancel one-time offer notifications when user subscribes
				if (status) {
					const { cancelOneTimeOfferNotifications } = await import(
						'./useOneTimeOfferNotifications'
					);
					await cancelOneTimeOfferNotifications();
				}
			}
			setIsSubscribed(status);
			setIsLoading(false);
		});

		// Fetch current subscription status on mount
		const fetchCurrentStatus = async (retryCount = 0) => {
			const maxRetries = 5;
			const retryDelay = 1000;

			try {
				console.log('useSubscriptionStatus: Fetching current subscription status...');
				const customerInfo = await Purchases.getCustomerInfo();
				const isPro = hasActiveSubscription(customerInfo);
				console.log('useSubscriptionStatus: Current subscription status:', isPro);
				setIsSubscribed(isPro);
				setIsLoading(false);
			} catch (error) {
				console.error('useSubscriptionStatus: Error fetching subscription status:', error);
				// If RevenueCat isn't initialized yet, retry with exponential backoff
				const errorMessage = error instanceof Error ? error.message : String(error);
				if (
					(errorMessage?.includes('not configured') ||
						errorMessage?.includes('not initialized')) &&
					retryCount < maxRetries
				) {
					console.log(
						`useSubscriptionStatus: RevenueCat not initialized yet, retrying in ${retryDelay}ms (attempt ${retryCount + 1}/${maxRetries})...`
					);
					setTimeout(() => {
						fetchCurrentStatus(retryCount + 1);
					}, retryDelay);
					return;
				}
				// Fall back to global status if available or max retries reached
				console.log(
					'useSubscriptionStatus: Using fallback status:',
					globalSubscriptionStatus
				);
				setIsSubscribed(globalSubscriptionStatus);
				setIsLoading(false);
			}
		};

		fetchCurrentStatus();

		// Cleanup on unmount
		return cleanup;
	}, []);

	return { isSubscribed, isLoading };
}
