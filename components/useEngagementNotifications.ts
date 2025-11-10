import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const APP_FIRST_LAUNCH_KEY = 'app_first_launch_date';
const WEEKLY_NOTIFICATIONS_SCHEDULED_KEY = 'weekly_engagement_notifications_scheduled';
const DAY1_NOTIFICATION_SCHEDULED_KEY = 'day1_engagement_notification_scheduled';
const DAY2_NOTIFICATION_SCHEDULED_KEY = 'day2_engagement_notification_scheduled';

// Android channel for engagement notifications
async function ensureAndroidChannel() {
	if (Platform.OS === 'android') {
		await Notifications.setNotificationChannelAsync('engagement', {
			name: 'Engagement Reminders',
			importance: Notifications.AndroidImportance.DEFAULT,
			sound: 'default',
			vibrationPattern: [0, 250, 250, 250],
			lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
		});
	}
}

// Get or set the first launch date
async function getFirstLaunchDate(): Promise<Date | null> {
	try {
		const storedDate = await AsyncStorage.getItem(APP_FIRST_LAUNCH_KEY);
		if (storedDate) {
			return new Date(storedDate);
		}
		// First launch - store current date
		const now = new Date();
		await AsyncStorage.setItem(APP_FIRST_LAUNCH_KEY, now.toISOString());
		return now;
	} catch (error) {
		console.error('Error getting first launch date:', error);
		return null;
	}
}

// Calculate days since first launch
function getDaysSinceFirstLaunch(firstLaunchDate: Date): number {
	const now = new Date();
	const diffTime = now.getTime() - firstLaunchDate.getTime();
	return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

// Schedule weekly engagement notification
async function scheduleWeeklyEngagementNotification() {
	await ensureAndroidChannel();

	const messages = [
		'✨ Ready to transform your space? Open the app and create something amazing!',
		'🏠 Your home design ideas are waiting! Come back and bring them to life.',
		'🎨 New design inspiration is just a tap away. Open the app now!',
		'💡 Have a room that needs a makeover? Let AI help you design it!',
		'🌟 Discover new ways to transform your living space today!',
	];

	// Pick a random message
	const randomMessage = messages[Math.floor(Math.random() * messages.length)];

	return Notifications.scheduleNotificationAsync({
		content: {
			title: 'Design Your Dream Home 🏡',
			body: randomMessage,
			sound: 'default',
		},
		trigger: {
			type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
			seconds: 7 * 24 * 60 * 60, // 7 days in seconds
			repeats: true,
		},
	});
}

// Schedule day 1 notification
async function scheduleDay1Notification(firstLaunchDate: Date) {
	await ensureAndroidChannel();

	const now = new Date();
	const day1Date = new Date(firstLaunchDate);
	day1Date.setDate(day1Date.getDate() + 1);
	day1Date.setHours(10, 0, 0, 0); // 10 AM on day 1

	// If day 1 has already passed, don't schedule
	if (day1Date.getTime() <= now.getTime()) {
		return null;
	}

	const secondsUntilDay1 = Math.floor((day1Date.getTime() - now.getTime()) / 1000);

	return Notifications.scheduleNotificationAsync({
		content: {
			title: 'Welcome Back! 👋',
			body: 'Ready to create your first AI design? Open the app and transform your space!',
			sound: 'default',
		},
		trigger: {
			type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
			seconds: secondsUntilDay1,
		},
	});
}

// Schedule day 2 notification
async function scheduleDay2Notification(firstLaunchDate: Date) {
	await ensureAndroidChannel();

	const now = new Date();
	const day2Date = new Date(firstLaunchDate);
	day2Date.setDate(day2Date.getDate() + 2);
	day2Date.setHours(14, 0, 0, 0); // 2 PM on day 2

	// If day 2 has already passed, don't schedule
	if (day2Date.getTime() <= now.getTime()) {
		return null;
	}

	const secondsUntilDay2 = Math.floor((day2Date.getTime() - now.getTime()) / 1000);

	return Notifications.scheduleNotificationAsync({
		content: {
			title: 'Keep Creating! 🎨',
			body: "You're on a roll! Continue designing amazing spaces with AI.",
			sound: 'default',
		},
		trigger: {
			type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
			seconds: secondsUntilDay2,
		},
	});
}

// Cancel all engagement notifications
export async function cancelEngagementNotifications() {
	try {
		const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
		const engagementNotifications = scheduledNotifications.filter(
			(notification) =>
				notification.content.title === 'Design Your Dream Home 🏡' ||
				notification.content.title === 'Welcome Back! 👋' ||
				notification.content.title === 'Keep Creating! 🎨'
		);

		for (const notification of engagementNotifications) {
			await Notifications.cancelScheduledNotificationAsync(notification.identifier);
		}

		// Mark as cancelled in storage
		await AsyncStorage.setItem(WEEKLY_NOTIFICATIONS_SCHEDULED_KEY, 'cancelled');
		await AsyncStorage.setItem(DAY1_NOTIFICATION_SCHEDULED_KEY, 'cancelled');
		await AsyncStorage.setItem(DAY2_NOTIFICATION_SCHEDULED_KEY, 'cancelled');
	} catch (error) {
		console.error('Error cancelling engagement notifications:', error);
	}
}

// Schedule all engagement notifications if needed
export async function scheduleEngagementNotificationsIfNeeded() {
	try {
		// Check notification permissions
		const { status } = await Notifications.getPermissionsAsync();
		if (status !== 'granted') {
			// Request permissions
			const { status: newStatus } = await Notifications.requestPermissionsAsync();
			if (newStatus !== 'granted') {
				console.log('Notification permissions not granted for engagement notifications');
				return;
			}
		}

		// Get first launch date
		const firstLaunchDate = await getFirstLaunchDate();
		if (!firstLaunchDate) {
			console.log('Could not determine first launch date');
			return;
		}

		const daysSinceLaunch = getDaysSinceFirstLaunch(firstLaunchDate);

		// Schedule weekly notifications (if not already scheduled)
		const weeklyScheduled = await AsyncStorage.getItem(WEEKLY_NOTIFICATIONS_SCHEDULED_KEY);
		if (weeklyScheduled !== 'scheduled' && weeklyScheduled !== 'cancelled') {
			await scheduleWeeklyEngagementNotification();
			await AsyncStorage.setItem(WEEKLY_NOTIFICATIONS_SCHEDULED_KEY, 'scheduled');
			console.log('✅ Weekly engagement notifications scheduled');
		}

		// Schedule day 1 notification (if not already scheduled and we're still on day 0)
		const day1Scheduled = await AsyncStorage.getItem(DAY1_NOTIFICATION_SCHEDULED_KEY);
		if (day1Scheduled !== 'scheduled' && day1Scheduled !== 'cancelled' && daysSinceLaunch < 1) {
			const notificationId = await scheduleDay1Notification(firstLaunchDate);
			if (notificationId) {
				await AsyncStorage.setItem(DAY1_NOTIFICATION_SCHEDULED_KEY, 'scheduled');
				console.log('✅ Day 1 engagement notification scheduled');
			}
		}

		// Schedule day 2 notification (if not already scheduled and we're still on day 0 or 1)
		const day2Scheduled = await AsyncStorage.getItem(DAY2_NOTIFICATION_SCHEDULED_KEY);
		if (day2Scheduled !== 'scheduled' && day2Scheduled !== 'cancelled' && daysSinceLaunch < 2) {
			const notificationId = await scheduleDay2Notification(firstLaunchDate);
			if (notificationId) {
				await AsyncStorage.setItem(DAY2_NOTIFICATION_SCHEDULED_KEY, 'scheduled');
				console.log('✅ Day 2 engagement notification scheduled');
			}
		}
	} catch (error) {
		console.error('Error scheduling engagement notifications:', error);
	}
}

// Hook to use in components
export function useEngagementNotifications() {
	useEffect(() => {
		// Schedule notifications when component mounts (if needed)
		scheduleEngagementNotificationsIfNeeded();
	}, []);

	return {
		cancelEngagementNotifications,
		scheduleEngagementNotificationsIfNeeded,
	};
}
