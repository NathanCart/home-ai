import React, { useState } from 'react';
import { Platform, View, Switch, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '../../components/ThemedText';
import { useOnboarding } from '../../components/useOnboarding';

// ====== Config ======
const REMINDER_OFFSET_DAYS = 2; // schedule 2 days after permission is granted

// Foreground presentation (so you see banners while app is open)
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: true,
		shouldSetBadge: false,
		shouldShowBanner: true,
		shouldShowList: true,
	}),
});

async function ensureAndroidChannel() {
	if (Platform.OS === 'android') {
		await Notifications.setNotificationChannelAsync('default', {
			name: 'Default',
			importance: Notifications.AndroidImportance.DEFAULT,
			sound: 'default',
			vibrationPattern: [0, 250, 250, 250],
			lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
		});
	}
}

function getTwoDayMessage() {
	return {
		title: 'Free Trial Ending Tomorrow 🚨',
		body: "Your Swipeable++ free trial ends tomorrow. Don't miss out on keeping your photos organized!",
	};
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

async function scheduleTwoDayReminder() {
	await ensureAndroidChannel();

	const triggerTime = new Date(Date.now() + REMINDER_OFFSET_DAYS * 24 * 60 * 60 * 1000);
	const { title, body } = getTwoDayMessage();

	return Notifications.scheduleNotificationAsync({
		content: { title, body, sound: 'default' },
		trigger: {
			type: Notifications.SchedulableTriggerInputTypes.DATE,
			date: triggerTime,
		},
	});
}

export default function OnboardingStep5() {
	const insets = useSafeAreaInsets();
	const [reminderEnabled, setReminderEnabled] = useState(true);
	const [isLoading, setIsLoading] = useState(false);
	const { markOnboardingComplete } = useOnboarding();

	const handleContinue = async () => {
		setIsLoading(true);
		try {
			// Set review_reminders to true in AsyncStorage
			await AsyncStorage.setItem('review_reminders', 'true');

			if (reminderEnabled) {
				let { status } = await Notifications.getPermissionsAsync();
				if (status !== 'granted') {
					const req = await Notifications.requestPermissionsAsync();
					status = req.status;
				}

				if (status === 'granted') {
					await scheduleTwoDayReminder();
					// Also schedule the weekly review reminder
					await scheduleWeeklyReviewReminder();
				} else {
					Alert.alert(
						'Notifications Disabled',
						'You can enable notifications later in Settings to receive reminders about your free trial and weekly storage reviews.',
						[{ text: 'OK' }]
					);
				}
			}

			await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
			// Navigate to step 6
			router.push('/onboarding/step6');
		} catch (error) {
			console.error('Error setting up reminder:', error);
			await markOnboardingComplete();
			router.replace('/');
		} finally {
			setIsLoading(false);
		}
	};

	const toggleReminder = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setReminderEnabled((v) => !v);
	};

	return (
		<View className="flex-1 bg-white">
			{/* Scrollable Content */}
			<ScrollView
				className="flex-1"
				contentContainerStyle={{ flexGrow: 1 }}
				showsVerticalScrollIndicator={false}
			>
				{/* Header */}
				<View
					className="justify-center items-center px-8"
					style={{ paddingTop: insets.top + 40, paddingBottom: 40 }}
				>
					{/* Icon */}
					<View className="w-32 h-32 bg-primary rounded-full items-center justify-center mb-8">
						<Ionicons name="notifications" size={64} color="white" />
					</View>

					{/* Title */}
					<ThemedText
						extraBold
						variant="title-md"
						className="text-center  text-gray-800 mb-12"
					>
						SET A REMINDER BEFORE YOUR FREE TRIAL ENDS
					</ThemedText>

					{/* Reminder Toggle */}
					<View className="w-full bg-gray-50 rounded-2xl p-6 mb-8">
						<View className="flex-row items-center justify-between">
							<View className="flex-1 mr-4">
								<ThemedText bold variant="title-md" className="text-gray-800 mb-1">
									Remind me before trial ends
								</ThemedText>
								<ThemedText variant="body" className="text-gray-600">
									Get a notification during your trial to keep you on track
								</ThemedText>
							</View>
							<Switch
								value={reminderEnabled}
								onValueChange={toggleReminder}
								trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
								thumbColor={reminderEnabled ? '#ffffff' : '#f3f4f6'}
							/>
						</View>
					</View>
				</View>
			</ScrollView>

			{/* Fixed Footer */}
			<View
				className="bg-primary px-8 rounded-t-[40px] pt-10 drop-shadow-2xl"
				style={{
					paddingBottom: insets.bottom + 40,
					shadowColor: '#000',
					shadowOffset: { width: 0, height: -4 },
					shadowOpacity: 0.1,
					shadowRadius: 8,
					elevation: 8,
				}}
			>
				{/* Title */}
				<ThemedText
					extraBold
					variant="title-lg"
					className="text-center !uppercase text-gray-100 mb-4 !px-0"
				>
					Set a Reminder
				</ThemedText>

				{/* Description */}
				<ThemedText variant="body" className="text-center text-gray-100 !text-base">
					Get notified during your free trial so you don&apos;t miss out on keeping your
					photos organized.
				</ThemedText>

				{/* Continue Button */}
				<TouchableOpacity
					onPress={handleContinue}
					disabled={isLoading}
					className="bg-white py-4 mt-8 px-6 rounded-full flex-row items-center justify-center min-h-[40px]"
					activeOpacity={0.7}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
					style={{
						shadowColor: '#3b82f6',
						shadowOffset: { width: 0, height: 6 },
						shadowOpacity: 0.2,
						shadowRadius: 12,
						elevation: 8,
						borderWidth: 1,
						borderColor: 'rgba(59, 130, 246, 0.1)',
						opacity: isLoading ? 0.7 : 1,
					}}
				>
					<ThemedText
						extraBold
						variant="title-md"
						className="text-primary mr-3 !uppercase tracking-wide"
					>
						{isLoading ? 'Setting Up...' : 'Continue'}
					</ThemedText>
				</TouchableOpacity>
			</View>
		</View>
	);
}
