import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const ONE_TIME_OFFER_SCHEDULED_KEY = 'one_time_offer_scheduled';
const ONE_TIME_OFFER_FIRST_NOTIFICATION_KEY = 'one_time_offer_first_notification';
const ONE_TIME_OFFER_LAST_CHANCE_KEY = 'one_time_offer_last_chance';

// Android channel for one-time offer notifications
async function ensureAndroidChannel() {
	if (Platform.OS === 'android') {
		await Notifications.setNotificationChannelAsync('one_time_offer', {
			name: 'One-Time Offer',
			importance: Notifications.AndroidImportance.HIGH,
			sound: 'default',
			vibrationPattern: [0, 250, 250, 250],
			lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
		});
	}
}

// Schedule the first notification (immediate or short delay)
async function scheduleFirstNotification() {
	await ensureAndroidChannel();

	return Notifications.scheduleNotificationAsync({
		content: {
			title: '🎉 One-Time Offer!',
			body: 'Get premium access at a special price - limited time only!',
			sound: 'default',
		},
		trigger: {
			type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
			seconds: 60, // 1 minute delay (can be adjusted)
		},
	});
}

// Schedule the "last chance" notification (4 hours later)
async function scheduleLastChanceNotification() {
	await ensureAndroidChannel();

	return Notifications.scheduleNotificationAsync({
		content: {
			title: '⏰ Last Chance!',
			body: "Your one-time offer expires soon - don't miss out!",
			sound: 'default',
		},
		trigger: {
			type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
			seconds: 4 * 60 * 60, // 4 hours in seconds
		},
	});
}

// Cancel all one-time offer notifications
export async function cancelOneTimeOfferNotifications() {
	try {
		const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
		const oneTimeOfferNotifications = scheduledNotifications.filter(
			(notification) =>
				notification.content.title === '🎉 One-Time Offer!' ||
				notification.content.title === '⏰ Last Chance!'
		);

		for (const notification of oneTimeOfferNotifications) {
			await Notifications.cancelScheduledNotificationAsync(notification.identifier);
		}

		// Mark as cancelled in storage
		await AsyncStorage.setItem(ONE_TIME_OFFER_SCHEDULED_KEY, 'cancelled');
	} catch (error) {
		console.error('Error cancelling one-time offer notifications:', error);
	}
}

// Check if user is a new user and schedule notifications
export async function scheduleOneTimeOfferNotificationsIfNeeded() {
	try {
		// Check if notifications have already been scheduled or cancelled
		const scheduledStatus = await AsyncStorage.getItem(ONE_TIME_OFFER_SCHEDULED_KEY);
		if (scheduledStatus === 'scheduled' || scheduledStatus === 'cancelled') {
			return; // Already scheduled or cancelled
		}

		// Check if user is already subscribed - if so, don't schedule
		try {
			const Purchases = (await import('react-native-purchases')).default;
			const customerInfo = await Purchases.getCustomerInfo();
			const hasActiveSubscription = customerInfo.entitlements?.active?.['pro'] !== undefined;
			if (hasActiveSubscription) {
				console.log('User already subscribed, skipping one-time offer notifications');
				await AsyncStorage.setItem(ONE_TIME_OFFER_SCHEDULED_KEY, 'cancelled');
				return;
			}
		} catch (error) {
			// If RevenueCat isn't initialized yet, continue anyway
			console.log(
				'Could not check subscription status, continuing with notification scheduling'
			);
		}

		// Check notification permissions
		const { status } = await Notifications.getPermissionsAsync();
		if (status !== 'granted') {
			// Request permissions
			const { status: newStatus } = await Notifications.requestPermissionsAsync();
			if (newStatus !== 'granted') {
				console.log('Notification permissions not granted');
				return;
			}
		}

		// Schedule both notifications
		await scheduleFirstNotification();
		await scheduleLastChanceNotification();

		// Mark as scheduled
		await AsyncStorage.setItem(ONE_TIME_OFFER_SCHEDULED_KEY, 'scheduled');
		console.log('✅ One-time offer notifications scheduled');
	} catch (error) {
		console.error('Error scheduling one-time offer notifications:', error);
	}
}

// Hook to use in components
export function useOneTimeOfferNotifications() {
	useEffect(() => {
		// Schedule notifications when component mounts (if needed)
		scheduleOneTimeOfferNotificationsIfNeeded();
	}, []);

	return {
		cancelOneTimeOfferNotifications,
		scheduleOneTimeOfferNotificationsIfNeeded,
	};
}
