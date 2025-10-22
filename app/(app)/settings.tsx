import { View, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from 'components/ThemedText';
import { ScrollView } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { useOnboarding } from '../../components/useOnboarding';
import { useRevenuecat, useSubscriptionStatus } from 'components/useRevenueCat';
import { useReviewPrompt } from '../../components/useReviewPrompt';

export default function SettingsPage() {
	const insets = useSafeAreaInsets();
	const { presentPaywallIfNeeded } = useRevenuecat();
	const { isSubscribed } = useSubscriptionStatus();
	const { resetOnboarding } = useOnboarding();
	const { resetReviewPrompt } = useReviewPrompt();
	return (
		<View className="flex-1">
			{/* Header */}
			<View className="bg-primary pb-8 px-6" style={{ paddingTop: insets.top + 16 }}>
				<View className="flex-row items-center gap-2">
					<TouchableOpacity
						className="flex-row items-center gap-2"
						onPress={() => router.push('/')}
					>
						<AntDesign name="double-left" size={32} color="white" />
						<ThemedText
							extraBold
							variant="title-lg"
							className="text-gray-100 uppercase flex-1 text-nowrap whitespace-nowrap"
						>
							Settings
						</ThemedText>
					</TouchableOpacity>
				</View>
			</View>
			{/* Settings Options */}
			<ScrollView className="flex-1" contentContainerClassName="bg-primary/5">
				<View className=" w-full flex flex-col ">
					<TouchableOpacity
						className="w-full"
						onPress={() => {
							presentPaywallIfNeeded();
						}}
					>
						<View className=" backdrop-blur-sm  py-6 px-4  ">
							<View className="flex-row items-center space-x-4">
								<View className="flex-1 ml-4 ">
									<ThemedText bold variant="title-lg">
										{isSubscribed ? 'SUBSCRIBED' : 'SUBSCRIBE'}
									</ThemedText>
									{isSubscribed ? (
										<ThemedText variant="body">
											You are subscribed to the premium features
										</ThemedText>
									) : (
										<ThemedText variant="body">
											Unlock premium features
										</ThemedText>
									)}
								</View>
								<View className="bg-blue-100 p-3 rounded-xl">
									<Ionicons name="star" size={48} color="#3b82f6" />
								</View>
							</View>
						</View>
					</TouchableOpacity>

					<TouchableOpacity
						className="w-full"
						onPress={() => router.push('/settings/notifications')}
					>
						<View className=" backdrop-blur-sm  py-6 px-4  border-t-4  border-blue-100 ">
							<View className="flex-row items-center space-x-4">
								<View className="flex-1 ml-4 ">
									<ThemedText bold variant="title-lg">
										NOTIFICATIONS
									</ThemedText>
									<ThemedText variant="body">
										Manage notification preferences
									</ThemedText>
								</View>
								<View className="bg-blue-100 p-3 rounded-xl">
									<Ionicons name="notifications" size={48} color="#3b82f6" />
								</View>
							</View>
						</View>
					</TouchableOpacity>

					<TouchableOpacity
						className="w-full"
						onPress={() => router.push('/settings/privacy')}
					>
						<View className=" backdrop-blur-sm  py-6 px-4  border-t-4  border-blue-100 ">
							<View className="flex-row items-center space-x-4">
								<View className="flex-1 ml-4 ">
									<ThemedText bold variant="title-lg">
										PRIVACY
									</ThemedText>
									<ThemedText variant="body">
										Control your data and privacy
									</ThemedText>
								</View>
								<View className="bg-blue-100 p-3 rounded-xl">
									<Ionicons name="shield-checkmark" size={48} color="#3b82f6" />
								</View>
							</View>
						</View>
					</TouchableOpacity>

					<TouchableOpacity
						className="w-full"
						onPress={() => router.push('/settings/storage')}
					>
						<View className=" backdrop-blur-sm border-y-4  border-blue-100 py-6 px-4 ">
							<View className="flex-row items-center space-x-4">
								<View className="flex-1 ml-4 ">
									<ThemedText bold variant="title-lg">
										STORAGE
									</ThemedText>
									<ThemedText variant="body">
										Manage your storage and cache
									</ThemedText>
								</View>
								<View className="bg-blue-100 p-3 rounded-xl">
									<Ionicons name="server" size={48} color="#3b82f6" />
								</View>
							</View>
						</View>
					</TouchableOpacity>

					<TouchableOpacity
						className="w-full"
						onPress={() => router.push('/settings/about')}
					>
						<View className=" backdrop-blur-sm o  border-blue-100 py-6 px-4 ">
							<View className="flex-row items-center space-x-4">
								<View className="flex-1 ml-4 ">
									<ThemedText bold variant="title-lg">
										ABOUT
									</ThemedText>
									<ThemedText variant="body">
										App version and information
									</ThemedText>
								</View>
								<View className="bg-blue-100 p-3 rounded-xl">
									<Ionicons name="information-circle" size={48} color="#3b82f6" />
								</View>
							</View>
						</View>
					</TouchableOpacity>

					<TouchableOpacity
						className="w-full"
						onPress={() => router.push('/settings/support')}
					>
						<View className=" backdrop-blur-sm border-t-4  border-blue-100 py-6 px-4 ">
							<View className="flex-row items-center space-x-4">
								<View className="flex-1 ml-4 ">
									<ThemedText bold variant="title-lg">
										SUPPORT
									</ThemedText>
									<ThemedText variant="body">Get help and contact us</ThemedText>
								</View>
								<View className="bg-blue-100 p-3 rounded-xl">
									<Ionicons name="help-circle" size={48} color="#3b82f6" />
								</View>
							</View>
						</View>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</View>
	);
}
