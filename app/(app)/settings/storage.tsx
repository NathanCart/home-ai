import { View, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from 'components/ThemedText';
import { ScrollView } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { clearReviewedFiles } from '../../../components/reviewedFiles';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function StorageSettingsPage() {
	const insets = useSafeAreaInsets();

	const handleClearCache = () => {
		Alert.alert(
			'Clear Cache',
			'This will clear all cached data and temporary files. The app may take longer to load next time.',
			[
				{
					text: 'Cancel',
					style: 'cancel',
				},
				{
					text: 'Clear',
					onPress: () => {
						Alert.alert('Success', 'Cache cleared successfully');
					},
				},
			]
		);
	};

	const handleClearAnalytics = async () => {
		Alert.alert(
			'Clear Analytics Data',
			'This will permanently delete all your review analytics and statistics.',
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
							await clearReviewedFiles();
							Alert.alert('Success', 'Analytics data cleared successfully');
						} catch (error) {
							Alert.alert('Error', 'Failed to clear analytics data');
						}
					},
				},
			]
		);
	};

	const handleClearAllData = () => {
		Alert.alert(
			'Clear All Data',
			'This will permanently delete all your data including reviews, analytics, and preferences.',
			[
				{
					text: 'Cancel',
					style: 'cancel',
				},
				{
					text: 'Clear All',
					style: 'destructive',
					onPress: async () => {
						try {
							await AsyncStorage.clear();
							await clearReviewedFiles();
							Alert.alert('Success', 'All data cleared successfully');
						} catch (error) {
							Alert.alert('Error', 'Failed to clear data');
						}
					},
				},
			]
		);
	};

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
							Storage
						</ThemedText>
					</TouchableOpacity>
				</View>
			</View>

			{/* Settings Options */}
			<ScrollView className="flex-1" contentContainerClassName="bg-primary/5 ">
				<View className="gap-4 w-full flex flex-col p-6">
					{/* Storage Usage */}
					<View className="bg-white rounded-3xl p-6">
						<View className="flex-row items-center justify-between mb-4">
							<ThemedText bold variant="title-md" className="text-gray-800">
								Storage Usage
							</ThemedText>
							<Ionicons name="server" size={24} color="#3b82f6" />
						</View>
						<View className="space-y-2">
							<View className="flex-row justify-between">
								<ThemedText variant="body" className="text-gray-600">
									Analytics Data
								</ThemedText>
								<ThemedText variant="body" className="text-gray-800">
									2.4 MB
								</ThemedText>
							</View>
							<View className="flex-row justify-between">
								<ThemedText variant="body" className="text-gray-600">
									Cache
								</ThemedText>
								<ThemedText variant="body" className="text-gray-800">
									15.8 MB
								</ThemedText>
							</View>
							<View className="flex-row justify-between">
								<ThemedText variant="body" className="text-gray-600">
									Total
								</ThemedText>
								<ThemedText variant="body" className="text-gray-800 font-semibold">
									18.2 MB
								</ThemedText>
							</View>
						</View>
					</View>

					{/* Clear Analytics */}
					<TouchableOpacity
						className="bg-white rounded-3xl p-6"
						onPress={handleClearAnalytics}
					>
						<View className="flex-row items-center justify-between">
							<View className="flex-1">
								<ThemedText bold variant="title-md" className="text-gray-800 mb-1">
									Clear Analytics Data
								</ThemedText>
								<ThemedText variant="body" className="text-gray-600">
									Delete all review statistics and analytics
								</ThemedText>
							</View>
							<Ionicons name="analytics" size={24} color="#6b7280" />
						</View>
					</TouchableOpacity>

					{/* Clear All Data */}
					<TouchableOpacity
						className="bg-red-50 border border-red-200 rounded-3xl p-6"
						onPress={handleClearAllData}
					>
						<View className="flex-row items-center justify-between">
							<View className="flex-1">
								<ThemedText bold variant="title-md" className="text-red-800 mb-1">
									Clear All Data
								</ThemedText>
								<ThemedText variant="body" className="text-red-600">
									Delete all app data and reset to defaults
								</ThemedText>
							</View>
							<Ionicons name="warning" size={24} color="#dc2626" />
						</View>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</View>
	);
}
