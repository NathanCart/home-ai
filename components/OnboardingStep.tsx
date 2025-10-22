import React from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from './ThemedText';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Video, ResizeMode } from 'expo-av';

interface OnboardingStepProps {
	image: any; // Image or video source
	title: string;
	description: string;
	buttonText: string;
	onContinue: () => void;
	isLastStep?: boolean;
}

export function OnboardingStep({
	image,
	title,
	description,
	buttonText,
	onContinue,
	isLastStep = false,
}: OnboardingStepProps) {
	const insets = useSafeAreaInsets();

	const handlePress = () => {
		console.log('OnboardingStep: Button pressed, calling onContinue');
		try {
			// Provide haptic feedback - stronger for final step (non-blocking)
			if (isLastStep) {
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
			} else {
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
			}
		} catch (error) {
			console.log('Haptic feedback error:', error);
		}
		onContinue();
	};

	return (
		<View className="flex-1 bg-white">
			{/* Media Section */}
			<View
				className="flex-1 justify-center items-center px-8"
				style={{ paddingTop: insets.top + 40 }}
			>
				{/* Check if it's a video (has .mp4 extension or is a require() result) */}
				{typeof image === 'object' && image.uri && image.uri.includes('.mp4') ? (
					<View className={`w-full h-full scale-[1.4] mb-8`}>
						{' '}
						<Video
							source={image}
							style={{ width: '100%', height: '100%' }}
							shouldPlay={true}
							isLooping={true}
							isMuted={true}
							resizeMode={ResizeMode.CONTAIN}
						/>
					</View>
				) : typeof image === 'number' || (typeof image === 'object' && !image.uri) ? (
					// Local video asset (require() result) - larger size
					<View className={`w-full h-full scale-[1.4] mb-8`}>
						<Video
							source={image}
							style={{ width: '100%', height: '100%' }}
							shouldPlay={true}
							isLooping={true}
							isMuted={true}
							resizeMode={ResizeMode.CONTAIN}
						/>
					</View>
				) : (
					// Image - smaller size
					<View className={`w-80 h-80 mb-8`}>
						<Image source={image} className="w-full h-full" resizeMode="contain" />
					</View>
				)}
			</View>

			{/* Content Section with 3D Background */}
			<View
				className="bg-primary px-8 rounded-t-[40px] pt-10 drop-shadow-2xl"
				style={{
					paddingBottom: insets.bottom + 40,
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
					{title}
				</ThemedText>

				{/* Description */}
				<ThemedText variant="body" className="text-center text-gray-100 !text-base">
					{description}
				</ThemedText>

				{/* Continue Button */}
				<TouchableOpacity
					onPress={handlePress}
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
						{buttonText}
					</ThemedText>
				</TouchableOpacity>
			</View>
		</View>
	);
}
