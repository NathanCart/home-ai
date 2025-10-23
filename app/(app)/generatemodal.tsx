import React, { useState, useRef } from 'react';
import { View, ScrollView, Animated } from 'react-native';
import { Octicons } from '@expo/vector-icons';
import { ThemedText } from 'components/ThemedText';
import { CustomButton } from 'components/CustomButton';
import { Step1 } from 'components/generatesteps/Step1';
import { ModalHeader } from 'components/generatesteps/ModalHeader';
import { getStepConfig } from 'config/stepConfig';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

export default function GenerateModal() {
	const insets = useSafeAreaInsets();
	const { mode } = useLocalSearchParams();
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
		const config = getStepConfig(mode as string, currentStep);

		switch (currentStep) {
			case 1:
				return <Step1 onImageSelect={handleImageSelect} config={config} />;
			case 2:
				return (
					<View className="flex-1 px-6">
						<View className="items-center mb-8">
							<View className="w-24 h-24 bg-gradient-to-br from-green-500 to-blue-600 rounded-3xl items-center justify-center mb-6">
								<Octicons name={config.icon as any} size={40} color="white" />
							</View>
							<ThemedText
								variant="title-lg"
								className="text-gray-900 mb-3 text-center"
								extraBold
							>
								{config.title}
							</ThemedText>
							<ThemedText
								variant="body"
								className="text-gray-600 text-center leading-6"
							>
								{config.subtitle}
							</ThemedText>
						</View>
					</View>
				);
			case 3:
				return (
					<View className="flex-1 px-6">
						<View className="items-center mb-8">
							<View className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl items-center justify-center mb-6">
								<Octicons name={config.icon as any} size={40} color="white" />
							</View>
							<ThemedText
								variant="title-lg"
								className="text-gray-900 mb-3 text-center"
								extraBold
							>
								{config.title}
							</ThemedText>
							<ThemedText
								variant="body"
								className="text-gray-600 text-center leading-6"
							>
								{config.subtitle}
							</ThemedText>
						</View>
					</View>
				);
			case 4:
				return (
					<View className="flex-1 px-6">
						<View className="items-center mb-8">
							<View className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl items-center justify-center mb-6">
								<Octicons name={config.icon as any} size={40} color="white" />
							</View>
							<ThemedText
								variant="title-lg"
								className="text-gray-900 mb-3 text-center"
								extraBold
							>
								{config.title}
							</ThemedText>
							<ThemedText
								variant="body"
								className="text-gray-600 text-center leading-6"
							>
								{config.subtitle}
							</ThemedText>
						</View>
					</View>
				);
			default:
				return null;
		}
	};

	return (
		<View className=" bg-gray-50 flex-1" style={{ paddingTop: insets.top }}>
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
					className=""
					contentContainerClassName="flex-1 mt-4"
					showsVerticalScrollIndicator={false}
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
