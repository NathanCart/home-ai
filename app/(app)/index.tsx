import { View, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Octicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from 'components/ThemedText';
import { ScrollView } from 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import { LoadingScreen } from 'components/LoadingScreen';
import { useOnboarding } from 'components/useOnboarding';
import { useSubscriptionStatus } from 'components/useRevenueCat';
import { SubscriptionBanner } from 'components/SubscriptionBanner';
import { useReviewPrompt } from 'components/useReviewPrompt';
import { ToolCard } from 'components/ToolCard';
import { CustomButton } from 'components/CustomButton';

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
		<View className="flex-1 bg-gray-50">
			{/* Header */}
			<View className=" pb-4 px-6" style={{ paddingTop: insets.top + 16 }}>
				<View className="flex-row items-center justify-center">
					<ThemedText extraBold className="text-gray-900" variant="title-lg">
						housi ai
					</ThemedText>
				</View>
			</View>

			{/* Subscription Banner - Only show for non-subscribed users
			{!isSubscribed && showBanner && (
				<SubscriptionBanner onDismiss={() => setShowBanner(false)} />
			)} */}

			{/* Main Content */}
			<ScrollView
				className="flex-1"
				contentContainerClassName="px-6 pb-8"
				showsVerticalScrollIndicator={false}
			>
				<View className="w-full flex flex-col gap-6">
					{/* Design Tools */}
					<ToolCard
						title="Interior design"
						description="Upload a photo of your space and let AI design it for you!"
						icon="home"
						image="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
						badge="Popular"
						showButton={true}
						buttonText="Start Designing"
						onPress={() => {
							router.push('/generatemodal?mode=interior-design');
						}}
					/>
					<ToolCard
						title="Garden design"
						description="Transform your outdoor space with AI-powered garden design!"
						materialIcon="flower-tulip-outline"
						image="https://images.unsplash.com/photo-1594498653385-d5172c532c00?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8Z2FyZGVufGVufDB8fDB8fHww&auto=format&fit=crop&q=60&w=900"
						showButton={true}
						buttonText="Design Garden"
						onPress={() => {
							router.push('/gardengeneratemodal');
						}}
					/>
					<ToolCard
						title="Replace objects"
						description="Replace objects in your photo with AI-generated ones!"
						icon="paintbrush"
						image="https://images.unsplash.com/photo-1759722668385-90006d9c7aa7?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1354"
						showButton={true}
						buttonText="Start Painting"
						onPress={() => {
							router.push('/paintmodal');
						}}
					/>
				</View>
			</ScrollView>
		</View>
	);
}
