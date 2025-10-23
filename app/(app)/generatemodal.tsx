import React, { useState, useRef } from 'react';
import { View, ScrollView, Animated } from 'react-native';
import { Octicons } from '@expo/vector-icons';
import { ThemedText } from 'components/ThemedText';
import { CustomButton } from 'components/CustomButton';
import { Step1 } from 'components/generatesteps/Step1';
import { ModalHeader } from 'components/generatesteps/ModalHeader';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

export default function GenerateModal() {
	const insets = useSafeAreaInsets();
	const [currentStep, setCurrentStep] = useState(1);
	const [totalSteps] = useState(4);
	const slideAnimation = useRef(new Animated.Value(0)).current;

	const handleClose = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		router.back();
	};

	const handleNextStep = () => {
		if (currentStep < totalSteps) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			// Slide left animation for next step
			Animated.timing(slideAnimation, {
				toValue: -300,
				duration: 200,
				useNativeDriver: true,
			}).start(() => {
				setCurrentStep(currentStep + 1);
				slideAnimation.setValue(300);
				Animated.timing(slideAnimation, {
					toValue: 0,
					duration: 200,
					useNativeDriver: true,
				}).start();
			});
		}
	};

	const handlePreviousStep = () => {
		if (currentStep > 1) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			// Slide right animation for previous step
			Animated.timing(slideAnimation, {
				toValue: 300,
				duration: 200,
				useNativeDriver: true,
			}).start(() => {
				setCurrentStep(currentStep - 1);
				slideAnimation.setValue(-300);
				Animated.timing(slideAnimation, {
					toValue: 0,
					duration: 200,
					useNativeDriver: true,
				}).start();
			});
		}
	};

	const handleImageSelect = () => {
		// TODO: Implement image picker functionality
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		console.log('Image select pressed');
	};

	const renderStepContent = () => {
		switch (currentStep) {
			case 1:
				return <Step1 onImageSelect={handleImageSelect} />;
			case 2:
				return (
					<View className="flex-1 px-6">
						<View className="items-center mb-8">
							<View className="w-24 h-24 bg-gradient-to-br from-green-500 to-blue-600 rounded-3xl items-center justify-center mb-6">
								<Octicons name="gear" size={40} color="white" />
							</View>
							<ThemedText
								variant="title-lg"
								className="text-gray-900 mb-3 text-center"
								extraBold
							>
								Choose Your Options
							</ThemedText>
							<ThemedText
								variant="body"
								className="text-gray-600 text-center leading-6"
							>
								Select your preferences and customize your generation
							</ThemedText>
						</View>
					</View>
				);
			case 3:
				return (
					<View className="flex-1 px-6">
						<View className="items-center mb-8">
							<View className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl items-center justify-center mb-6">
								<Octicons name="sparkle" size={40} color="white" />
							</View>
							<ThemedText
								variant="title-lg"
								className="text-gray-900 mb-3 text-center"
								extraBold
							>
								Generate Content
							</ThemedText>
							<ThemedText
								variant="body"
								className="text-gray-600 text-center leading-6"
							>
								Review your preferences and generate your AI-powered content
							</ThemedText>
						</View>
					</View>
				);
			case 4:
				return (
					<View className="flex-1 px-6">
						<View className="items-center mb-8">
							<View className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl items-center justify-center mb-6">
								<Octicons name="check-circle" size={40} color="white" />
							</View>
							<ThemedText
								variant="title-lg"
								className="text-gray-900 mb-3 text-center"
								extraBold
							>
								Complete
							</ThemedText>
							<ThemedText
								variant="body"
								className="text-gray-600 text-center leading-6"
							>
								Your content has been generated successfully
							</ThemedText>
						</View>
					</View>
				);
			default:
				return null;
		}
	};

	return (
		<View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
			{/* Header */}
			<ModalHeader
				currentStep={currentStep}
				totalSteps={totalSteps}
				onClose={handleClose}
				onPrevious={handlePreviousStep}
				showPrevious={currentStep > 1}
			/>

			{/* Content */}
			<Animated.View
				className="flex-1"
				style={{ transform: [{ translateX: slideAnimation }] }}
			>
				<ScrollView
					className="flex-1"
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ flexGrow: 1 }}
				>
					{renderStepContent()}
				</ScrollView>
			</Animated.View>

			{/* Footer */}
			<View className="px-6 py-6 bg-gray-50/50" style={{ paddingBottom: insets.bottom + 8 }}>
				<View className="flex-row justify-between items-center">
					<CustomButton
						title={currentStep === totalSteps ? 'Finish' : 'Continue'}
						onPress={handleNextStep}
						icon="arrow-right"
						iconPosition="right"
						variant="primary"
						size="lg"
						className="flex-1"
					/>
				</View>
			</View>
		</View>
	);
}
