import { View, TouchableOpacity, Switch, Linking, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from 'components/ThemedText';
import { ScrollView } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { useSubscriptionStatus } from 'components/useRevenueCat';
import { useRevenuecat } from 'components/useRevenueCat';
import { useReviewReminders } from 'components/useReviewReminders';
import * as StoreReview from 'expo-store-review';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ONBOARDING_COMPLETE_KEY } from 'components/useOnboarding';

export default function SettingsPage() {
	const insets = useSafeAreaInsets();
	const { isSubscribed } = useSubscriptionStatus();
	const { presentPaywallIfNeeded } = useRevenuecat();
	const {
		reviewRemindersEnabled,
		isLoading: notificationsLoading,
		toggleReviewReminders,
	} = useReviewReminders();

	const handleSubscribe = async () => {
		try {
			await presentPaywallIfNeeded();
		} catch (error) {
			console.error('Error presenting paywall:', error);
		}
	};

	const handleSupport = async () => {
		try {
			const url = 'mailto:viralreachltd@gmail.com?subject=Support Request';
			const canOpen = await Linking.canOpenURL(url);
			if (canOpen) {
				await Linking.openURL(url);
			} else {
				Alert.alert('Error', 'Unable to open email client.');
			}
		} catch (error) {
			console.error('Error opening support email:', error);
			Alert.alert('Error', 'Failed to open email client.');
		}
	};

	const handleRateUs = async () => {
		try {
			const isAvailable = await StoreReview.isAvailableAsync();
			if (isAvailable) {
				await StoreReview.requestReview();
			} else {
				Alert.alert(
					'Review Not Available',
					'Store review is not available on this device.'
				);
			}
		} catch (error) {
			console.error('Error showing review prompt:', error);
			Alert.alert('Error', 'Failed to open review.');
		}
	};

	const handleShareApp = async () => {
		try {
			const result = await Share.share({
				message: 'Check out Home AI - Transform your home with AI-powered design!',
			});

			if (result.action === Share.sharedAction) {
				console.log('App shared successfully');
			}
		} catch (error) {
			console.error('Error sharing app:', error);
			Alert.alert('Error', 'Failed to share app.');
		}
	};

	const handleClearStorage = () => {
		Alert.alert(
			'Clear Storage',
			'This will delete all your saved projects, preferences, and app data. This action cannot be undone. Onboarding status will be preserved.',
			[
				{
					text: 'Cancel',
					style: 'cancel',
				},
				{
					text: 'Clear',
					style: 'destructive',
					onPress: async () => {
						try {
							// Get all keys from AsyncStorage
							const allKeys = await AsyncStorage.getAllKeys();

							// Filter out the onboarding key
							const keysToRemove = allKeys.filter(
								(key) => key !== ONBOARDING_COMPLETE_KEY
							);

							// Remove all keys except onboarding
							if (keysToRemove.length > 0) {
								await AsyncStorage.multiRemove(keysToRemove);
							}

							Alert.alert('Success', 'Storage cleared successfully.');
						} catch (error) {
							console.error('Error clearing storage:', error);
							Alert.alert('Error', 'Failed to clear storage.');
						}
					},
				},
			]
		);
	};

	const appVersion = Constants.expoConfig?.version || '1.1.0';

	return (
		<View className="flex-1 bg-gray-100">
			{/* Header */}
			<View className="pb-4 px-6" style={{ paddingTop: insets.top + 16 }}>
				<View className="flex-row items-center justify-between">
					<TouchableOpacity onPress={() => router.back()} className="p-2">
						<Ionicons name="close" size={28} color="#1f2937" />
					</TouchableOpacity>
					<View className="flex-1 items-center">
						<ThemedText extraBold className="text-gray-900" variant="title-lg">
							Settings
						</ThemedText>
					</View>
					<View className="w-10" />
				</View>
			</View>

			{/* Content */}
			<ScrollView
				className="flex-1"
				contentContainerClassName="px-6 pb-8"
				showsVerticalScrollIndicator={false}
			>
				<View className="w-full flex flex-col gap-4">
					{/* Subscription CTA - Only show if not subscribed */}
					{!isSubscribed && (
						<View className="bg-white rounded-3xl p-5 border-2 border-gray-200">
							<View className="flex-row items-center mb-4">
								<View className="bg-gray-200 p-2.5 rounded-xl mr-3">
									<Ionicons name="star" size={22} color="#1f2937" />
								</View>
								<View className="flex-1">
									<ThemedText
										extraBold
										variant="title-md"
										className="text-gray-900 mb-1"
									>
										Go pro
									</ThemedText>
									<ThemedText variant="body" className="text-gray-600 ">
										Unlimited AI home design
									</ThemedText>
								</View>
							</View>
							<TouchableOpacity
								onPress={handleSubscribe}
								className="bg-gray-900 rounded-xl py-3.5 px-4 items-center"
							>
								<ThemedText extraBold className="text-white" variant="title-md">
									Subscribe Now
								</ThemedText>
							</TouchableOpacity>
						</View>
					)}

					{/* All Settings in One Card */}
					<View className="bg-white rounded-3xl p-4 border-2 border-gray-200">
						{/* Support */}
						<TouchableOpacity
							className="flex-row items-center justify-between py-3 border-b border-gray-200"
							onPress={handleSupport}
						>
							<View className="flex-row items-center">
								<Ionicons name="help-circle" size={20} color="#6b7280" />
								<ThemedText variant="body" className="text-gray-700 ml-3">
									Help
								</ThemedText>
							</View>
							<Ionicons name="chevron-forward" size={18} color="#6b7280" />
						</TouchableOpacity>

						{/* Notifications */}
						<View className="flex-row items-center justify-between py-3 border-b border-gray-200">
							<View className="flex-row items-center flex-1">
								<Ionicons name="notifications-outline" size={20} color="#6b7280" />
								<View className="ml-3 flex-1">
									<ThemedText variant="body" className="text-gray-700">
										Notifications
									</ThemedText>
								</View>
							</View>
							<Switch
								value={reviewRemindersEnabled || false}
								onValueChange={toggleReviewReminders}
								disabled={notificationsLoading}
								trackColor={{ false: '#e5e7eb', true: '#199dfe' }}
								thumbColor={reviewRemindersEnabled ? '#ffffff' : '#f3f4f6'}
							/>
						</View>

						{/* Rate Us */}
						<TouchableOpacity
							className="flex-row items-center justify-between py-3 border-b border-gray-200"
							onPress={handleRateUs}
						>
							<View className="flex-row items-center">
								<Ionicons name="star" size={20} color="#6b7280" />
								<ThemedText variant="body" className="text-gray-700 ml-3">
									Rate Us
								</ThemedText>
							</View>
							<Ionicons name="chevron-forward" size={18} color="#6b7280" />
						</TouchableOpacity>

						{/* Share App */}
						<TouchableOpacity
							className="flex-row items-center justify-between py-3 border-b border-gray-200"
							onPress={handleShareApp}
						>
							<View className="flex-row items-center">
								<Ionicons name="share-outline" size={20} color="#6b7280" />
								<ThemedText variant="body" className="text-gray-700 ml-3">
									Share Our App
								</ThemedText>
							</View>
							<Ionicons name="chevron-forward" size={18} color="#6b7280" />
						</TouchableOpacity>

						{/* Clear Storage */}
						<TouchableOpacity
							className="flex-row items-center justify-between py-3 border-b border-gray-200"
							onPress={handleClearStorage}
						>
							<View className="flex-row items-center">
								<Ionicons name="trash-outline" size={20} color="#ef4444" />
								<ThemedText variant="body" className="text-gray-700 ml-3">
									Clear Storage
								</ThemedText>
							</View>
							<Ionicons name="chevron-forward" size={18} color="#6b7280" />
						</TouchableOpacity>

						{/* App Version */}
						<View className="flex-row items-center justify-between py-3">
							<View className="flex-row items-center">
								<Ionicons
									name="information-circle-outline"
									size={20}
									color="#6b7280"
								/>
								<ThemedText variant="body" className="text-gray-600 ml-3">
									Version
								</ThemedText>
							</View>
							<ThemedText variant="body" className="text-gray-800">
								{appVersion}
							</ThemedText>
						</View>
					</View>
				</View>
			</ScrollView>
		</View>
	);
}
