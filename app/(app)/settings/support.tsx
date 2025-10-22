import { View, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from 'components/ThemedText';
import { ScrollView } from 'react-native-gesture-handler';
import { router } from 'expo-router';

export default function SupportPage() {
	const insets = useSafeAreaInsets();

	const handleOpenLink = (url: string) => {
		Linking.openURL(url);
	};

	const handleContactSupport = () => {
		Alert.alert('Contact Support', 'How would you like to contact us?', [
			{
				text: 'Cancel',
				style: 'cancel',
			},
			{
				text: 'Email',
				onPress: () => handleOpenLink('mailto:viralreachltd@gmail.com'),
			},
			{
				text: 'Website',
				onPress: () => handleOpenLink('https://www.viralreach.org'),
			},
		]);
	};

	return (
		<View className="flex-1">
			{/* Header */}
			<View className="bg-primary pb-8 px-6" style={{ paddingTop: insets.top + 16 }}>
				<View className="flex-row items-center gap-2">
					<TouchableOpacity
						className="flex-row items-center gap-2"
						onPress={() => router.back()}
					>
						<AntDesign name="double-left" size={32} color="white" />
						<ThemedText
							extraBold
							variant="title-lg"
							className="text-gray-100 uppercase flex-1 text-nowrap whitespace-nowrap"
						>
							Support
						</ThemedText>
					</TouchableOpacity>
				</View>
			</View>

			{/* Content */}
			<ScrollView className="flex-1" contentContainerClassName="bg-primary/5">
				<View className="gap-4 w-full flex flex-col p-6">
					{/* Quick Help */}
					<View className="bg-white rounded-3xl p-6">
						<ThemedText bold variant="title-md" className="text-gray-800 mb-4">
							Quick Help
						</ThemedText>
						<View className="space-y-3">
							<View className="flex-row items-start">
								<Ionicons name="help-circle" size={20} color="#3b82f6" />
								<View className="ml-3 flex-1">
									<ThemedText
										variant="body"
										className="text-gray-700 font-semibold"
									>
										How to use the app
									</ThemedText>
									<ThemedText
										variant="body"
										className="text-gray-600 text-sm mt-1"
									>
										Swipe right to keep files, left to delete them. Use
										different sorting options to organize your files.
									</ThemedText>
								</View>
							</View>
							<View className="flex-row items-start">
								<Ionicons name="analytics" size={20} color="#3b82f6" />
								<View className="ml-3 flex-1">
									<ThemedText
										variant="body"
										className="text-gray-700 font-semibold"
									>
										Understanding Analytics
									</ThemedText>
									<ThemedText
										variant="body"
										className="text-gray-600 text-sm mt-1"
									>
										View your review statistics, files kept, and storage saved
										in the Analytics tab.
									</ThemedText>
								</View>
							</View>
						</View>
					</View>

					{/* Contact Options */}
					<View className="bg-white rounded-3xl p-6">
						<ThemedText bold variant="title-md" className="text-gray-800 mb-4">
							Get Help
						</ThemedText>
						<View className="space-y-3">
							<TouchableOpacity
								className="flex-row items-center justify-between py-3"
								onPress={handleContactSupport}
							>
								<View className="flex-row items-center">
									<Ionicons name="mail" size={24} color="#3b82f6" />
									<ThemedText variant="body" className="text-gray-700 ml-3">
										Contact Support
									</ThemedText>
								</View>
								<Ionicons name="chevron-forward" size={20} color="#6b7280" />
							</TouchableOpacity>

							{/* <TouchableOpacity
								className="flex-row items-center justify-between py-3"
								onPress={handleReportBug}
							>
								<View className="flex-row items-center">
									<Ionicons name="bug" size={24} color="#ef4444" />
									<ThemedText variant="body" className="text-gray-700 ml-3">
										Report a Bug
									</ThemedText>
								</View>
								<Ionicons name="chevron-forward" size={20} color="#6b7280" />
							</TouchableOpacity> */}

							{/* <TouchableOpacity
								className="flex-row items-center justify-between py-3"
								onPress={() => handleOpenLink('https://swipewipe.com/faq')}
							>
								<View className="flex-row items-center">
									<Ionicons
										name="help-circle-outline"
										size={24}
										color="#6b7280"
									/>
									<ThemedText variant="body" className="text-gray-700 ml-3">
										FAQ
									</ThemedText>
								</View>
								<Ionicons name="chevron-forward" size={20} color="#6b7280" />
							</TouchableOpacity> */}
						</View>
					</View>

					{/* Community
					<View className="bg-white rounded-3xl p-6">
						<ThemedText bold variant="title-md" className="text-gray-800 mb-4">
							Community
						</ThemedText>
						<View className="space-y-3">
							<TouchableOpacity
								className="flex-row items-center justify-between py-3"
								onPress={() => handleOpenLink('https://github.com/swipewipe')}
							>
								<View className="flex-row items-center">
									<Ionicons name="logo-github" size={24} color="#6b7280" />
									<ThemedText variant="body" className="text-gray-700 ml-3">
										GitHub
									</ThemedText>
								</View>
								<Ionicons name="chevron-forward" size={20} color="#6b7280" />
							</TouchableOpacity>

							<TouchableOpacity
								className="flex-row items-center justify-between py-3"
								onPress={() => handleOpenLink('https://twitter.com/swipewipe')}
							>
								<View className="flex-row items-center">
									<Ionicons name="logo-twitter" size={24} color="#1da1f2" />
									<ThemedText variant="body" className="text-gray-700 ml-3">
										Twitter
									</ThemedText>
								</View>
								<Ionicons name="chevron-forward" size={20} color="#6b7280" />
							</TouchableOpacity>

							<TouchableOpacity
								className="flex-row items-center justify-between py-3"
								onPress={() => handleOpenLink('https://discord.gg/swipewipe')}
							>
								<View className="flex-row items-center">
									<Ionicons name="logo-discord" size={24} color="#5865f2" />
									<ThemedText variant="body" className="text-gray-700 ml-3">
										Discord
									</ThemedText>
								</View>
								<Ionicons name="chevron-forward" size={20} color="#6b7280" />
							</TouchableOpacity>
						</View>
					</View> */}

					{/* App Info */}
					<View className="bg-white rounded-3xl p-6">
						<ThemedText bold variant="title-md" className="text-gray-800 mb-4">
							App Information
						</ThemedText>
						<View className="space-y-2">
							<View className="flex-row justify-between">
								<ThemedText variant="body" className="text-gray-600">
									Version
								</ThemedText>
								<ThemedText variant="body" className="text-gray-800">
									1.1.0
								</ThemedText>
							</View>
							<View className="flex-row justify-between">
								<ThemedText variant="body" className="text-gray-600">
									Build
								</ThemedText>
								<ThemedText variant="body" className="text-gray-800">
									100
								</ThemedText>
							</View>
							<View className="flex-row justify-between">
								<ThemedText variant="body" className="text-gray-600">
									Last Updated
								</ThemedText>
								<ThemedText variant="body" className="text-gray-800">
									Today
								</ThemedText>
							</View>
						</View>
					</View>
				</View>
			</ScrollView>
		</View>
	);
}
