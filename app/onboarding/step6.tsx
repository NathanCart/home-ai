import React from 'react';
import { router } from 'expo-router';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/ThemedText';
import { useOnboarding } from '../../components/useOnboarding';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function OnboardingStep6() {
	const insets = useSafeAreaInsets();
	const { markOnboardingComplete } = useOnboarding();

	const handleContinue = async () => {
		console.log('Step 6: Completing onboarding and navigating to main app');
		try {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
		} catch (error) {
			console.log('Haptic feedback error:', error);
		}
		// Mark onboarding as completed
		console.log('Step 6: Setting onboarding as completed...');
		await markOnboardingComplete();
		console.log('Step 6: Onboarding marked as completed, navigating to main app');
		// Navigate to main app
		router.replace('/');
	};

	const trialDays = [
		{
			day: 1,
			title: 'Day 1: Get Unlimited Swipes',
			icon: 'infinite-outline',
			features: [
				'Unlimited photo swipes',
				'Full access to all features',
				'Start organizing your photos',
				'No restrictions or limits',
			],
			color: 'bg-green-100',
			iconColor: 'text-green-600',
		},
		{
			day: 2,
			title: 'Day 2: Still Completely Free',
			icon: 'gift-outline',
			features: [
				'Continue enjoying full access',
				'Delete as many photos as you want',
				'See your storage savings grow',
				'Still no charges or fees',
			],
			color: 'bg-blue-100',
			iconColor: 'text-blue-600',
		},
		{
			day: 3,
			title: "Day 3: You Won't Be Charged",
			icon: 'shield-checkmark-outline',
			features: [
				'No automatic charges',
				'Cancel anytime before trial ends',
				'Keep all your progress',
				'Decide if you want to continue',
			],
			color: 'bg-purple-100',
			iconColor: 'text-purple-600',
		},
	];

	return (
		<View className="flex-1 bg-white ">
			{/* Header */}
			<View className="px-8 pt-4" style={{ paddingTop: insets.top + 20 }}>
				{/* Icon */}

				{/* Title */}
				<ThemedText
					extraBold
					variant="title-lg"
					className="text-center uppercase text-gray-800 mb-2"
				>
					How Your Free Trial Works
				</ThemedText>
			</View>

			{/* Scrollable Content */}
			<ScrollView
				className="flex-1 px-8 mt-8"
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					flexGrow: 1,
					justifyContent: 'center',
					paddingBottom: 20,
				}}
			>
				{/* Vertical Progress Bar */}
				<View className="flex-row items-start mb-8">
					{/* Progress Line */}

					{/* Progress Steps */}
					<View className="flex-1">
						{/* Unlock */}
						<View className="flex-row items-start mb-8">
							<View className="w-14 h-14 bg-blue-500 rounded-full items-center justify-center mr-4">
								<Ionicons name="lock-open-outline" size={32} color="white" />
							</View>
							<View className="flex-1">
								<ThemedText
									extraBold
									variant="title-md"
									className="text-gray-800 mb-1 uppercase"
								>
									Day 1
								</ThemedText>
								<ThemedText variant="body" className="text-gray-600">
									Get unlimited swipes, analytics and all features
								</ThemedText>
							</View>
						</View>

						{/* Notifications */}
						<View className="flex-row items-start mb-8">
							<View className="w-14 h-14 bg-blue-500 rounded-full items-center justify-center mr-4">
								<Ionicons name="notifications-outline" size={32} color="white" />
							</View>
							<View className="flex-1">
								<ThemedText
									extraBold
									variant="title-md"
									className="text-gray-800 mb-1 uppercase"
								>
									On Day 2
								</ThemedText>
								<ThemedText variant="body" className="text-gray-600">
									Get notified before your trial ends
								</ThemedText>
							</View>
						</View>

						{/* Check */}
						<View className="flex-row items-start">
							<View className="w-14 h-14 bg-blue-500 rounded-full items-center justify-center mr-4">
								<Ionicons name="checkmark-circle-outline" size={32} color="white" />
							</View>
							<View className="flex-1">
								<ThemedText
									extraBold
									variant="title-md"
									className="text-gray-800 mb-1 uppercase"
								>
									The Final Day
								</ThemedText>
								<ThemedText variant="body" className="text-gray-600">
									Cancel anytime, no automatic billing
								</ThemedText>
							</View>
						</View>
					</View>
				</View>

				{/* Bottom Spacer */}
				<View className="h-4" />
			</ScrollView>

			{/* Content Section with 3D Background */}
			<View
				className="bg-primary px-8 rounded-t-[40px] pt-10 drop-shadow-2xl"
				style={{
					paddingBottom: insets.bottom + 40,
					shadowColor: '#000',
					shadowOffset: { width: 0, height: -4 },
					shadowOpacity: 0.1,
					shadowRadius: 8,
					elevation: 8,
				}}
			>
				{/* Title */}
				<ThemedText
					extraBold
					variant="title-lg"
					className="text-center !uppercase text-gray-100 mb-4 !px-0"
				>
					Ready to Start?
				</ThemedText>

				{/* Description */}
				<ThemedText variant="body" className="text-center text-gray-100 !text-base">
					Your free trial starts now. No credit card required, cancel anytime.
				</ThemedText>

				{/* Continue Button */}
				<TouchableOpacity
					onPress={handleContinue}
					className="bg-white py-4 mt-8 px-6 rounded-full flex-row items-center justify-center min-h-[40px]"
					activeOpacity={0.7}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
					style={{
						shadowColor: '#3b82f6',
						shadowOffset: { width: 0, height: 6 },
						shadowOpacity: 0.2,
						shadowRadius: 12,
						elevation: 8,
						borderWidth: 1,
						borderColor: 'rgba(59, 130, 246, 0.1)',
					}}
				>
					<ThemedText
						extraBold
						variant="title-md"
						className="text-primary mr-3 !uppercase tracking-wide"
					>
						Start Free Trial
					</ThemedText>
				</TouchableOpacity>
			</View>
		</View>
	);
}
