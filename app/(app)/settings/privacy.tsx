import { View, TouchableOpacity, Switch, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from 'components/ThemedText';
import { ScrollView } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
export default function PrivacySettingsPage() {
	const insets = useSafeAreaInsets();
	const [dataCollection, setDataCollection] = useState(true);
	const [analytics, setAnalytics] = useState(true);
	const [crashReports, setCrashReports] = useState(false);

	const handleOpenLink = (url: string) => {
		Linking.openURL(url);
	};

	const handleDeleteData = () => {
		Alert.alert(
			'Delete All Data',
			'This will permanently delete all your review data, analytics, and preferences. This action cannot be undone.',
			[
				{
					text: 'Cancel',
					style: 'cancel',
				},
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						await AsyncStorage.clear();
						Alert.alert('Success', 'All data has been deleted');
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
							Privacy
						</ThemedText>
					</TouchableOpacity>
				</View>
			</View>

			{/* Settings Options */}
			<ScrollView className="flex-1" contentContainerClassName="bg-primary/5 flex-1">
				<View className="space-y-4 w-full flex flex-col gap-4 p-6">
					{/* Privacy Policy */}
					<TouchableOpacity
						className="bg-white rounded-3xl p-6"
						onPress={() => handleOpenLink('https://www.viralreach.org/privacy/')}
					>
						<View className="flex-row items-center justify-between">
							<View className="flex-1">
								<ThemedText bold variant="title-md" className="text-gray-800 mb-1">
									Privacy Policy
								</ThemedText>
								<ThemedText variant="body" className="text-gray-600">
									Read our privacy policy
								</ThemedText>
							</View>
							<Ionicons name="chevron-forward" size={24} color="#6b7280" />
						</View>
					</TouchableOpacity>

					{/* Terms of Service */}
					<TouchableOpacity
						className="bg-white rounded-3xl p-6"
						onPress={() => handleOpenLink('https://www.viralreach.org/terms')}
					>
						<View className="flex-row items-center justify-between">
							<View className="flex-1">
								<ThemedText bold variant="title-md" className="text-gray-800 mb-1">
									Terms of Service
								</ThemedText>
								<ThemedText variant="body" className="text-gray-600">
									Read our terms of service
								</ThemedText>
							</View>
							<Ionicons name="chevron-forward" size={24} color="#6b7280" />
						</View>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</View>
	);
}
