import { View, TouchableOpacity, Animated } from 'react-native';
import { router } from 'expo-router';
import { Octicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from 'components/ThemedText';
import { ScrollView } from 'react-native-gesture-handler';
import { useEffect, useState, useRef } from 'react';
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
	const sharedAnimation = useRef(new Animated.Value(1)).current; // Shared animation for all cards
	const animationRef = useRef<Animated.CompositeAnimation | null>(null);

	// Before and after images
	const beforeImage = 'https://leafly-app.s3.eu-west-2.amazonaws.com/garden-bad.webp';
	const afterImage = 'https://leafly-app.s3.eu-west-2.amazonaws.com/garden-good.webp';

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

	// Start the shared animation loop once when component mounts
	useEffect(() => {
		const animation = Animated.loop(
			Animated.sequence([
				Animated.delay(500),
				Animated.timing(sharedAnimation, {
					toValue: 0,
					duration: 1500,
					useNativeDriver: false,
				}),
				Animated.delay(500),
				Animated.timing(sharedAnimation, {
					toValue: 1,
					duration: 1500,
					useNativeDriver: false,
				}),
			])
		);

		animationRef.current = animation;
		animation.start();

		return () => {
			if (animationRef.current) {
				animationRef.current.stop();
			}
		};
	}, []);

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
						image={'https://leafly-app.s3.eu-west-2.amazonaws.com/interior-good.webp'}
						originalImage={
							'https://leafly-app.s3.eu-west-2.amazonaws.com/interior-bad.webp'
						}
						sharedAnimation={sharedAnimation}
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
						image={afterImage}
						originalImage={beforeImage}
						sharedAnimation={sharedAnimation}
						showButton={true}
						buttonText="Design Garden"
						onPress={() => {
							router.push('/gardengeneratemodal');
						}}
					/>
					<ToolCard
						title="Exterior design"
						description="Transform your building's exterior with AI-powered design!"
						materialIcon="office-building"
						image={'https://leafly-app.s3.eu-west-2.amazonaws.com/exterior-good.webp'}
						originalImage={
							'https://leafly-app.s3.eu-west-2.amazonaws.com/exterior-bad.webp'
						}
						sharedAnimation={sharedAnimation}
						showButton={true}
						buttonText="Design Exterior"
						onPress={() => {
							router.push('/exteriorgeneratemodal');
						}}
					/>
					<ToolCard
						title="Style transfer"
						description="Transfer the style from one image to your room!"
						materialIcon="palette-outline"
						image={'https://pingu-app.s3.eu-west-2.amazonaws.com/restyle-old.webp'}
						originalImage={
							'https://pingu-app.s3.eu-west-2.amazonaws.com/restyle-before.webp'
						}
						sharedAnimation={sharedAnimation}
						showButton={true}
						buttonText="Transfer Style"
						onPress={() => {
							router.push('/styletransfermodal');
						}}
					/>
					<ToolCard
						title="Repaint"
						description="Repaint parts of your image with AI using custom colors!"
						materialIcon="format-paint"
						image={'https://leafly-app.s3.eu-west-2.amazonaws.com/repaint-new.webp'}
						originalImage={
							'https://leafly-app.s3.eu-west-2.amazonaws.com/repaint-old.webp'
						}
						sharedAnimation={sharedAnimation}
						showButton={true}
						buttonText="Start Repainting"
						onPress={() => {
							router.push('/repaintmodal');
						}}
					/>
					<ToolCard
						title="Refloor"
						description="Transform your floor with AI-powered flooring design!"
						materialIcon="texture-box"
						image={'https://leafly-app.s3.eu-west-2.amazonaws.com/refloor-new.webp'}
						originalImage={
							'https://leafly-app.s3.eu-west-2.amazonaws.com/refloor-old.webp'
						}
						sharedAnimation={sharedAnimation}
						showButton={true}
						buttonText="Change Floor"
						onPress={() => {
							router.push('/refloormodal');
						}}
					/>
					<ToolCard
						title="Replace objects"
						description="Replace objects in your photo with AI-generated ones!"
						icon="paintbrush"
						image={'https://leafly-app.s3.eu-west-2.amazonaws.com/replace-after.webp'}
						originalImage={
							'https://leafly-app.s3.eu-west-2.amazonaws.com/replace-before.webp'
						}
						sharedAnimation={sharedAnimation}
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
