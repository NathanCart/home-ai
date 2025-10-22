import { View, TouchableOpacity, Switch } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from 'components/ThemedText';
import { ScrollView } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { useReviewReminders } from 'components/useReviewReminders';

export default function NotificationsSettingsPage() {
	const insets = useSafeAreaInsets();
	const { reviewRemindersEnabled, isLoading, toggleReviewReminders } = useReviewReminders();

	return (
		<View className="flex-1">
			{/* Header */}
			<View className="bg-primary pb-8 px-6" style={{ paddingTop: insets.top + 16 }}>
				<View className="flex-row items-center">
					<TouchableOpacity
						className="flex-row items-center"
						onPress={() => router.back()}
					>
						<AntDesign name="double-left" size={32} color="white" />
						<View style={{ width: 8 }} />
						<ThemedText
							extraBold
							variant="title-lg"
							className="text-gray-100 uppercase flex-1 text-nowrap whitespace-nowrap"
						>
							Notifications
						</ThemedText>
					</TouchableOpacity>
				</View>
			</View>

			{/* Settings Options */}
			<ScrollView className="flex-1" contentContainerClassName="bg-primary/5 flex-1">
				<View className="gap-4 w-full flex flex-col p-6">
					{/* Push Notifications */}

					{/* Review Reminders */}
					<View className="bg-white rounded-3xl p-6">
						<View className="flex-row items-center justify-between">
							<View className="flex-1">
								<ThemedText bold variant="title-md" className="text-gray-800 mb-1">
									Weekly Review Reminders
								</ThemedText>
								<ThemedText variant="body" className="text-gray-600">
									Get weekly reminders to review and organize your photos
								</ThemedText>
							</View>
							<Switch
								value={reviewRemindersEnabled || false}
								onValueChange={toggleReviewReminders}
								disabled={isLoading}
								trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
								thumbColor={reviewRemindersEnabled ? '#ffffff' : '#f3f4f6'}
							/>
						</View>
					</View>
				</View>
			</ScrollView>
		</View>
	);
}
