import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const REVIEW_REMINDERS_KEY = 'review_reminders';

async function ensureAndroidChannel() {
	if (Platform.OS === 'android') {
		await Notifications.setNotificationChannelAsync('weekly_review', {
			name: 'Weekly Review',
			importance: Notifications.AndroidImportance.DEFAULT,
			sound: 'default',
			vibrationPattern: [0, 250, 250, 250],
			lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
		});
	}
}

function getWeeklyReviewMessage() {
	return {
		title: 'Weekly Storage Review 📱',
		body: 'Time for your weekly storage cleanup! Review and organize your photos to keep them tidy.',
	};
}

async function scheduleWeeklyReviewReminder() {
	await ensureAndroidChannel();

	const { title, body } = getWeeklyReviewMessage();

	// Schedule weekly recurring notification (every 7 days)
	return Notifications.scheduleNotificationAsync({
		content: { title, body, sound: 'default' },
		trigger: {
			type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
			seconds: 7 * 24 * 60 * 60, // 7 days in seconds
			repeats: true,
		},
	});
}

async function cancelWeeklyReviewReminders() {
	const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
	const weeklyReviewNotifications = scheduledNotifications.filter(
		(notification) => notification.content.title === 'Weekly Storage Review 📱'
	);

	for (const notification of weeklyReviewNotifications) {
		await Notifications.cancelScheduledNotificationAsync(notification.identifier);
	}
}

export const useReviewReminders = () => {
	const [reviewRemindersEnabled, setReviewRemindersEnabled] = useState<boolean | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		loadReviewRemindersStatus();
	}, []);

	const loadReviewRemindersStatus = async () => {
		try {
			const status = await AsyncStorage.getItem(REVIEW_REMINDERS_KEY);
			setReviewRemindersEnabled(status === 'true');
		} catch (error) {
			console.error('Error loading review reminders status:', error);
			setReviewRemindersEnabled(false);
		} finally {
			setIsLoading(false);
		}
	};

	const toggleReviewReminders = async (enabled: boolean) => {
		try {
			await AsyncStorage.setItem(REVIEW_REMINDERS_KEY, enabled.toString());
			setReviewRemindersEnabled(enabled);

			if (enabled) {
				// Check notification permissions first
				const { status } = await Notifications.getPermissionsAsync();
				if (status === 'granted') {
					await scheduleWeeklyReviewReminder();
				}
			} else {
				// Cancel existing weekly review reminders
				await cancelWeeklyReviewReminders();
			}
		} catch (error) {
			console.error('Error toggling review reminders:', error);
		}
	};

	return {
		reviewRemindersEnabled,
		isLoading,
		toggleReviewReminders,
	};
};
