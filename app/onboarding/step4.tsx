import React from 'react';
import { router } from 'expo-router';
import { View, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/ThemedText';
import * as Haptics from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Calculate responsive image height with better constraints
const isSmallScreen = screenHeight < 700 || screenWidth < 400;
const isVerySmallScreen = screenHeight < 600 || screenWidth < 350;

// Responsive height calculation - conservative for small screens, larger for big screens
const imageHeight = isVerySmallScreen
	? Math.min(150, screenHeight * 0.2)
	: isSmallScreen
		? Math.min(180, screenHeight * 0.25)
		: Math.min(320, screenHeight * 0.4); // Increased for larger screens

const celebrationImage = require('../../assets/celebration.jpg');

export default function OnboardingStep4() {
	const insets = useSafeAreaInsets();

	const handleContinue = () => {
		console.log('Step 4: Navigating to step 5');
		try {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		} catch (error) {
			console.log('Haptic feedback error:', error);
		}
		// Navigate to step 5
		router.push('/onboarding/step5');
	};

	return (
		<View className="flex-1 bg-white">
			{/* Photo Display Area */}
			<View
				className="justify-start items-center px-8"
				style={{
					paddingTop: insets.top + 16,
					height: isVerySmallScreen
						? screenHeight * 0.5 // Smaller area for very small screens
						: isSmallScreen
							? screenHeight * 0.55 // Medium area for small screens
							: screenHeight * 0.65, // Larger area for normal screens
				}}
			>
				{/* Celebration Card */}
				<View
					className="w-full"
					style={{
						maxHeight: isVerySmallScreen
							? screenHeight * 0.25 // Much smaller card for very small screens
							: isSmallScreen
								? screenHeight * 0.3 // Smaller card for small screens
								: screenHeight * 0.45, // Larger card for normal screens
						marginTop: 20, // Add some top margin to center the card
					}}
				>
					<View
						className="w-full"
						style={{
							shadowColor: '#199dfe',
							shadowOffset: { width: 0, height: 2 },
							shadowOpacity: 0.25,
							shadowRadius: 3.84,
						}}
					>
						<View className="bg-white rounded-3xl overflow-hidden relative">
							<Image
								source={celebrationImage}
								className="w-full"
								style={{ height: imageHeight }}
								resizeMode="cover"
							/>
							<View className="p-6">
								<View className="flex-row items-center justify-between mb-2">
									<ThemedText bold variant="title-lg" className="text-gray-800">
										Free Trial
									</ThemedText>
									<View className="bg-green-100 px-3 py-1 rounded-full">
										<ThemedText
											variant="title-md"
											className="text-green-800 !text-xl font-bold"
										>
											$0.00
										</ThemedText>
									</View>
								</View>
								<ThemedText variant="body" className="text-gray-600">
									Experience the full power of Swipeable++
								</ThemedText>
							</View>
						</View>
					</View>
				</View>
			</View>

			{/* Content Section with 3D Background */}
			<View
				className="bg-primary px-8 rounded-t-[40px] pt-10 drop-shadow-2xl"
				style={{
					paddingBottom: insets.bottom + 40,
					flex: 1, // Take remaining space
					shadowColor: '#000',
					shadowOffset: {
						width: 0,
						height: -4,
					},
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
					We Want You to Try for Free
				</ThemedText>

				{/* Description */}
				<ThemedText variant="body" className="text-center text-gray-100 !text-base">
					Experience the full power of Swipeable++ at no cost. Clean up your photos, free
					up space, and organize your memories - completely free to try.
				</ThemedText>

				{/* Continue Button */}
				<TouchableOpacity
					onPress={handleContinue}
					className="bg-white py-4 mt-8 px-6 rounded-full flex-row items-center justify-center min-h-[40px]"
					activeOpacity={0.7}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
					style={{
						shadowColor: '#3b82f6',
						shadowOffset: {
							width: 0,
							height: 6,
						},
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
						Start for $0.00
					</ThemedText>
				</TouchableOpacity>
			</View>
		</View>
	);
}
