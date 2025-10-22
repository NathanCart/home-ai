import { View, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from 'components/ThemedText';
import { ScrollView } from 'react-native-gesture-handler';
import { router } from 'expo-router';

export default function AboutPage() {
	const insets = useSafeAreaInsets();

	const handleOpenLink = (url: string) => {
		Linking.openURL(url);
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
							About
						</ThemedText>
					</TouchableOpacity>
				</View>
			</View>

			{/* Content */}
			<ScrollView className="flex-1" contentContainerClassName="bg-primary/5">
				<View className="gap-4 w-full flex flex-col p-6">
					{/* App Info */}
					<View className="bg-white rounded-3xl p-6">
						<View className="items-center mb-6">
							<View className="bg-blue-100 p-4 rounded-2xl mb-4">
								<Ionicons name="grid" size={48} color="#3b82f6" />
							</View>
							<ThemedText extraBold variant="title-xl" className="text-gray-800 mb-2">
								SWIPABLE ++
							</ThemedText>
							<ThemedText variant="body" className="text-gray-600 text-center">
								Version 1.1.0
							</ThemedText>
						</View>
						<ThemedText variant="body" className="text-gray-700 text-center leading-6">
							SWIPABLE ++ helps you organize and manage your files through an
							intuitive swipe interface. Review, keep, or delete files with ease and
							track your progress with detailed analytics.
						</ThemedText>
					</View>

					{/* Features */}
					<View className="bg-white rounded-3xl p-6">
						<ThemedText bold variant="title-md" className="text-gray-800 mb-4">
							Features
						</ThemedText>
						<View className="space-y-3">
							<View className="flex-row items-center">
								<Ionicons name="checkmark-circle" size={20} color="#10b981" />
								<ThemedText variant="body" className="text-gray-700 ml-3">
									Intuitive swipe interface
								</ThemedText>
							</View>
							<View className="flex-row items-center">
								<Ionicons name="checkmark-circle" size={20} color="#10b981" />
								<ThemedText variant="body" className="text-gray-700 ml-3">
									Multiple sorting options
								</ThemedText>
							</View>
							<View className="flex-row items-center">
								<Ionicons name="checkmark-circle" size={20} color="#10b981" />
								<ThemedText variant="body" className="text-gray-700 ml-3">
									Detailed analytics
								</ThemedText>
							</View>
							<View className="flex-row items-center">
								<Ionicons name="checkmark-circle" size={20} color="#10b981" />
								<ThemedText variant="body" className="text-gray-700 ml-3">
									File management tools
								</ThemedText>
							</View>
						</View>
					</View>

					{/* Links */}
					<View className="bg-white rounded-3xl p-6">
						<ThemedText bold variant="title-md" className="text-gray-800 mb-4">
							Links
						</ThemedText>
						<View className="space-y-3">
							<TouchableOpacity
								className="flex-row items-center justify-between py-2"
								onPress={() =>
									handleOpenLink('https://www.viralreach.org/privacy/')
								}
							>
								<View className="flex-row items-center">
									<Ionicons name="shield-checkmark" size={24} color="#6b7280" />
									<ThemedText variant="body" className="text-gray-700 ml-3">
										Privacy Policy
									</ThemedText>
								</View>
								<Ionicons name="chevron-forward" size={20} color="#6b7280" />
							</TouchableOpacity>

							<TouchableOpacity
								className="flex-row items-center justify-between py-2"
								onPress={() => handleOpenLink('https://www.viralreach.org/terms')}
							>
								<View className="flex-row items-center">
									<Ionicons name="document-text" size={24} color="#6b7280" />
									<ThemedText variant="body" className="text-gray-700 ml-3">
										Terms of Service
									</ThemedText>
								</View>
								<Ionicons name="chevron-forward" size={20} color="#6b7280" />
							</TouchableOpacity>
						</View>
					</View>

					{/* Credits */}
					<View className="bg-white rounded-3xl p-6">
						<ThemedText bold variant="title-md" className="text-gray-800 mb-4">
							Credits
						</ThemedText>
						<ThemedText variant="body" className="text-gray-700 leading-6">
							Built with React Native and Expo. Icons by Ionicons. Special thanks to
							the open source community for their contributions.
						</ThemedText>
					</View>
				</View>
			</ScrollView>
		</View>
	);
}
