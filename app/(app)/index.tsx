import { View, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from 'components/ThemedText';
import { ScrollView } from 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import { LoadingScreen } from 'components/LoadingScreen';
import { useOnboarding } from 'components/useOnboarding';
import { useSubscriptionStatus } from 'components/useRevenueCat';
import { SubscriptionBanner } from 'components/SubscriptionBanner';
import { useReviewPrompt } from 'components/useReviewPrompt';

export default function HomePage() {
	const insets = useSafeAreaInsets();
	const { hasCompletedOnboarding, isLoading: onboardingLoading } = useOnboarding();
	const { isSubscribed } = useSubscriptionStatus();
	const [showBanner, setShowBanner] = useState(true);
	const {
		showReviewPrompt,
		shouldShowReviewPrompt,
		isLoading: reviewPromptLoading,
	} = useReviewPrompt();

	useEffect(() => {
		if (hasCompletedOnboarding === false) {
			router.replace('/onboarding');
		}
	}, [hasCompletedOnboarding]);

	// Show review prompt if user has completed their first swipe session
	useEffect(() => {
		const checkAndShowReviewPrompt = async () => {
			// Wait for review prompt loading to complete
			if (reviewPromptLoading) return;

			// Check if we should show the review prompt
			if (shouldShowReviewPrompt()) {
				console.log('Homepage: Showing review prompt for first swipe session');
				// Add a small delay to ensure the page is fully loaded
				setTimeout(async () => {
					await showReviewPrompt();
				}, 1000);
			}
		};

		checkAndShowReviewPrompt();
	}, [reviewPromptLoading, shouldShowReviewPrompt, showReviewPrompt]);

	// Hide banner when user subscribes
	useEffect(() => {
		if (isSubscribed) {
			setShowBanner(false);
		}
	}, [isSubscribed]);

	// Show loading screen while checking onboarding status
	if (onboardingLoading || hasCompletedOnboarding === null) {
		return <LoadingScreen message="" />;
	}

	return (
		<View className="flex-1">
			{/* Header */}
			<View className="bg-primary pb-8 px-6" style={{ paddingTop: insets.top + 16 }}>
				<View className="flex-row items-center justify-between">
					<ThemedText extraBold className="text-gray-100" variant="title-xl">
						SWIPABLE ++
					</ThemedText>
				</View>
			</View>

			{/* Subscription Banner - Only show for non-subscribed users */}
			{!isSubscribed && showBanner && (
				<SubscriptionBanner onDismiss={() => setShowBanner(false)} />
			)}

			{/* Sorting Options */}
			<ScrollView className="flex-1" contentContainerClassName="bg-primary/5 ">
				<View className="w-full flex flex-col ">
					<TouchableOpacity
						className="w-full"
						onPress={() => router.push('/swipe?sort=recent')}
					>
						<View className=" backdrop-blur-sm  py-6 px-4  ">
							<View className="flex-row items-center space-x-4">
								<View className="flex-1 ml-4 flex">
									<ThemedText bold variant="title-lg">
										MOST RECENT
									</ThemedText>
									<ThemedText variant="body">Your most recent files</ThemedText>
								</View>
								<View className="bg-blue-100 p-3 rounded-xl">
									<Ionicons name="time" size={48} color="#3b82f6" />
								</View>
							</View>
						</View>
					</TouchableOpacity>

					<TouchableOpacity
						className="w-full"
						onPress={() => router.push('/swipe?sort=oldest')}
					>
						<View className=" backdrop-blur-sm  py-6 px-4  border-t-4  border-blue-100 ">
							<View className="flex-row items-center space-x-4">
								<View className="flex-1 ml-4 ">
									<ThemedText bold variant="title-lg">
										OLDEST PHOTOS
									</ThemedText>
									<ThemedText variant="body">Your oldest photos first</ThemedText>
								</View>
								<View className="bg-blue-100 p-3 rounded-xl">
									<Ionicons name="time-outline" size={48} color="#3b82f6" />
								</View>
							</View>
						</View>
					</TouchableOpacity>
					<TouchableOpacity className="w-full" onPress={() => router.push('/duplicates')}>
						<View className=" backdrop-blur-sm border-t-4  border-blue-100 py-6 px-4 ">
							<View className="flex-row items-center space-x-4">
								<View className="flex-1 ml-4 ">
									<ThemedText bold variant="title-lg">
										DUPLICATES
									</ThemedText>
									<ThemedText variant="body">
										Find and remove duplicate photos
									</ThemedText>
								</View>
								<View className="bg-blue-100 p-3 rounded-xl">
									<Ionicons name="copy" size={48} color="#3b82f6" />
								</View>
							</View>
						</View>
					</TouchableOpacity>
					<TouchableOpacity
						className="w-full"
						onPress={() => router.push('/swipe?sort=filesize')}
					>
						<View className=" backdrop-blur-sm o border-t-4  border-blue-100 py-6 px-4 ">
							<View className="flex-row items-center space-x-4">
								<View className="flex-1 ml-4 ">
									<ThemedText bold variant="title-lg">
										LARGEST PHOTOS
									</ThemedText>
									<ThemedText variant="body">
										Photos sorted by file size
									</ThemedText>
								</View>
								<View className="bg-blue-100 p-3 rounded-xl">
									<Ionicons name="hardware-chip" size={48} color="#3b82f6" />
								</View>
							</View>
						</View>
					</TouchableOpacity>
					<TouchableOpacity
						className="w-full"
						onPress={() => router.push('/swipe?sort=blurry')}
					>
						<View className=" backdrop-blur-sm border-t-4  border-blue-100 py-6 px-4 ">
							<View className="flex-row items-center space-x-4">
								<View className="flex-1 ml-4 ">
									<ThemedText bold variant="title-lg">
										BLURRY PHOTOS
									</ThemedText>
									<ThemedText variant="body">
										Find and remove blurry photos
									</ThemedText>
								</View>
								<View className="bg-blue-100 p-3 rounded-xl">
									<Ionicons name="eye-off" size={48} color="#3b82f6" />
								</View>
							</View>
						</View>
					</TouchableOpacity>
					<TouchableOpacity
						className="w-full "
						onPress={() => router.push('/swipe?sort=videos')}
					>
						<View className=" backdrop-blur-sm border-t-4  border-blue-100 py-6 px-4 ">
							<View className="flex-row items-center space-x-4">
								<View className="flex-1 ml-4 ">
									<ThemedText bold variant="title-lg">
										VIDEOS
									</ThemedText>
									<ThemedText variant="body">
										Swipe through your videos
									</ThemedText>
								</View>
								<View className="bg-blue-100 p-3 rounded-xl">
									<Ionicons name="videocam" size={48} color="#3b82f6" />
								</View>
							</View>
						</View>
					</TouchableOpacity>
					<TouchableOpacity
						className="w-full"
						onPress={() => router.push('/swipe?sort=random')}
					>
						<View className=" backdrop-blur-sm  py-6 px-4  border-t-4  border-blue-100 ">
							<View className="flex-row items-center space-x-4">
								<View className="flex-1 ml-4 ">
									<ThemedText bold variant="title-lg">
										RANDOM PHOTOS
									</ThemedText>
									<ThemedText variant="body">
										Discover forgotten photos
									</ThemedText>
								</View>
								<View className="bg-blue-100 p-3 rounded-xl">
									<Ionicons name="shuffle" size={48} color="#3b82f6" />
								</View>
							</View>
						</View>
					</TouchableOpacity>

					<TouchableOpacity
						className="w-full"
						onPress={() => router.push('/swipe?sort=month')}
					>
						<View className=" backdrop-blur-sm border-y-4  border-blue-100 py-6 px-4 ">
							<View className="flex-row items-center space-x-4">
								<View className="flex-1 ml-4 ">
									<ThemedText bold variant="title-lg">
										THIS MONTH
									</ThemedText>
									<ThemedText variant="body">
										Files from the current month
									</ThemedText>
								</View>
								<View className="bg-blue-100 p-3 rounded-xl">
									<Ionicons name="calendar" size={48} color="#3b82f6" />
								</View>
							</View>
						</View>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</View>
	);
}
