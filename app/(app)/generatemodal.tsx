import React, { useState, useRef } from 'react';
import { View, ScrollView, Animated } from 'react-native';
import { Octicons } from '@expo/vector-icons';
import { ThemedText } from 'components/ThemedText';
import { CustomButton } from 'components/CustomButton';
import { PhotoStep } from 'components/generatesteps/PhotoStep';
import { RoomStep } from 'components/generatesteps/RoomStep';
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
	const [hasImageSelected, setHasImageSelected] = useState(false);
	const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
	const [selectedRoom, setSelectedRoom] = useState<any>(null);
	const [isTransitioning, setIsTransitioning] = useState(false);
	const slideAnimation = useRef(new Animated.Value(0)).current;
	const opacityAnimation = useRef(new Animated.Value(1)).current;

	const handleClose = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		router.back();
	};

	const handleNextStep = () => {
		if (currentStep < totalSteps && !isTransitioning) {
			setIsTransitioning(true);
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

			// Fade out and slide left
			Animated.parallel([
				Animated.timing(opacityAnimation, {
					toValue: 0,
					duration: 200,
					useNativeDriver: true,
				}),
				Animated.timing(slideAnimation, {
					toValue: -50,
					duration: 200,
					useNativeDriver: true,
				}),
			]).start(() => {
				// Change step when fade out completes
				setCurrentStep(currentStep + 1);
				// Reset animation values for next step
				slideAnimation.setValue(50);
				opacityAnimation.setValue(0);

				// Small delay to ensure state update
				setTimeout(() => {
					// Animate in new content
					Animated.parallel([
						Animated.timing(opacityAnimation, {
							toValue: 1,
							duration: 200,
							useNativeDriver: true,
						}),
						Animated.timing(slideAnimation, {
							toValue: 0,
							duration: 200,
							useNativeDriver: true,
						}),
					]).start(() => {
						setIsTransitioning(false);
					});
				}, 10);
			});
		}
	};

	const handlePreviousStep = () => {
		if (currentStep > 1 && !isTransitioning) {
			setIsTransitioning(true);
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

			// Fade out and slide right
			Animated.parallel([
				Animated.timing(opacityAnimation, {
					toValue: 0,
					duration: 200,
					useNativeDriver: true,
				}),
				Animated.timing(slideAnimation, {
					toValue: 50,
					duration: 200,
					useNativeDriver: true,
				}),
			]).start(() => {
				// Change step when fade out completes
				setCurrentStep(currentStep - 1);
				// Reset animation values for previous step
				slideAnimation.setValue(-50);
				opacityAnimation.setValue(0);

				// Small delay to ensure state update
				setTimeout(() => {
					// Animate in new content
					Animated.parallel([
						Animated.timing(opacityAnimation, {
							toValue: 1,
							duration: 200,
							useNativeDriver: true,
						}),
						Animated.timing(slideAnimation, {
							toValue: 0,
							duration: 200,
							useNativeDriver: true,
						}),
					]).start(() => {
						setIsTransitioning(false);
					});
				}, 10);
			});
		}
	};

	const handleImageSelect = (imageUri?: string) => {
		setHasImageSelected(true);
		if (imageUri) {
			setSelectedImageUri(imageUri);
		}
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		console.log('Image select pressed');
	};

	const handleRoomSelect = (room: any) => {
		setSelectedRoom(room);
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
	};

	const renderStepContent = () => {
		const config = getStepConfig(mode as string, currentStep);

		switch (currentStep) {
			case 1:
				return (
					<PhotoStep
						onImageSelect={handleImageSelect}
						config={config}
						selectedImageUri={selectedImageUri}
					/>
				);
			case 2:
				return (
					<RoomStep
						onRoomSelect={handleRoomSelect}
						config={config}
						selectedRoom={selectedRoom}
					/>
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
		<View className=" bg-gray-50 flex-1 pb" style={{ paddingTop: insets.top }}>
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
				style={{
					transform: [{ translateX: slideAnimation }],
					opacity: opacityAnimation,
				}}
			>
				<ScrollView
					className=""
					contentContainerClassName="mt-4"
					contentContainerStyle={{ paddingBottom: 24 }}
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
						disabled={
							(currentStep === 1 && !hasImageSelected) ||
							(currentStep === 2 && !selectedRoom)
						}
					/>
				</View>
			</View>
		</View>
	);
}
