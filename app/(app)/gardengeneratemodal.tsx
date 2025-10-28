import React, { useState } from 'react';
import { View, ScrollView, Animated } from 'react-native';
import { CustomButton } from 'components/CustomButton';
import { PhotoStep } from 'components/generatesteps/PhotoStep';
import { StyleStep } from 'components/generatesteps/StyleStep';
import { GeneratingStep } from 'components/generatesteps/GeneratingStep';
import { ConfirmationStep } from 'components/generatesteps/ConfirmationStep';
import { ModalHeader } from 'components/generatesteps/ModalHeader';
import { getStepConfig } from 'config/stepConfig';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useGenerateModalAnimation } from 'components/useGenerateModalAnimation';

export default function GardenGenerateModal() {
	const insets = useSafeAreaInsets();
	const [currentStep, setCurrentStep] = useState(1);
	const [totalSteps] = useState(2); // Photo, Style (no room type step)
	const [hasImageSelected, setHasImageSelected] = useState(false);
	const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
	const [selectedRoom, setSelectedRoom] = useState<any>(null); // Keep for compatibility but won't be used
	const [selectedStyle, setSelectedStyle] = useState<any>(null);
	const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
	const [isTransitioning, setIsTransitioning] = useState(false);

	const {
		slideAnimation,
		opacityAnimation,
		headerAnimation,
		footerAnimation,
		handleNextStep: handleNextStepAnimation,
		handlePreviousStep: handlePreviousStepAnimation,
	} = useGenerateModalAnimation({
		currentStep,
		totalSteps,
		isTransitioning,
		setIsTransitioning,
		setCurrentStep,
	});

	const handleClose = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		router.back();
	};

	const handleNextStep = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		handleNextStepAnimation();
	};

	const handlePreviousStep = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		handlePreviousStepAnimation();
	};

	const handleImageSelect = (imageUri?: string) => {
		setHasImageSelected(true);
		if (imageUri) {
			setSelectedImageUri(imageUri);
		}
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		console.log('Image select pressed');
	};

	const handleStyleSelect = (style: any) => {
		setSelectedStyle(style);
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
	};

	const handleGenerationComplete = (imageUrl: string) => {
		setGeneratedImageUrl(imageUrl);

		// Trigger the animation to transition to the next step
		setIsTransitioning(true);

		Animated.parallel([
			Animated.timing(slideAnimation, {
				toValue: -1,
				duration: 300,
				useNativeDriver: true,
			}),
			Animated.timing(opacityAnimation, {
				toValue: 0,
				duration: 300,
				useNativeDriver: true,
			}),
		]).start(() => {
			// Navigate to confirmation step (step 4)
			setCurrentStep(4);

			// Reset animations for the next step
			slideAnimation.setValue(1);
			opacityAnimation.setValue(0);

			Animated.parallel([
				Animated.timing(slideAnimation, {
					toValue: 0,
					duration: 300,
					useNativeDriver: true,
				}),
				Animated.timing(opacityAnimation, {
					toValue: 1,
					duration: 300,
					useNativeDriver: true,
				}),
			]).start(() => {
				setIsTransitioning(false);
			});
		});
	};

	const handleSaveComplete = () => {
		// Navigate to projects page
		router.replace('/projects');
	};

	const handleRegenerate = () => {
		// Clear the generated image
		setGeneratedImageUrl(null);

		// Trigger the animation to transition back to generating step
		setIsTransitioning(true);

		Animated.parallel([
			Animated.timing(slideAnimation, {
				toValue: 1,
				duration: 300,
				useNativeDriver: true,
			}),
			Animated.timing(opacityAnimation, {
				toValue: 0,
				duration: 300,
				useNativeDriver: true,
			}),
		]).start(() => {
			// Navigate back to generating step (step 3)
			setCurrentStep(3);

			// Reset animations for the next step
			slideAnimation.setValue(-1);
			opacityAnimation.setValue(0);

			Animated.parallel([
				Animated.timing(slideAnimation, {
					toValue: 0,
					duration: 300,
					useNativeDriver: true,
				}),
				Animated.timing(opacityAnimation, {
					toValue: 1,
					duration: 300,
					useNativeDriver: true,
				}),
			]).start(() => {
				setIsTransitioning(false);
			});
		});
	};

	const renderStepContent = () => {
		const config = getStepConfig('garden', currentStep);

		switch (currentStep) {
			case 1:
				return (
					<PhotoStep
						onImageSelect={handleImageSelect}
						config={config}
						selectedImageUri={selectedImageUri}
						customExampleImages={[
							{
								id: 'garden-1',
								source: {
									uri: 'https://images.unsplash.com/photo-1594498653385-d5172c532c00?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8Z2FyZGVufGVufDB8fDB8fHww&auto=format&fit=crop&q=60&w=900',
								},
								name: 'Modern Garden',
							},
							{
								id: 'garden-2',
								source: {
									uri: 'https://images.unsplash.com/photo-1696846911635-83b97e53fb65?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGhvbWUlMjBnYXJkZW58ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&q=60&w=900',
								},
								name: 'Botanical',
							},
							{
								id: 'garden-3',
								source: {
									uri: 'https://images.unsplash.com/photo-1715934514075-06f0dbda1c09?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fGhvbWUlMjBnYXJkZW58ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&q=60&w=900',
								},
								name: 'Lush Garden',
							},
							{
								id: 'garden-4',
								source: {
									uri: 'https://images.unsplash.com/photo-1576897955702-24ad19680db3?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fGhvbWUlMjBnYXJkZW58ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&q=60&w=900',
								},
								name: 'Zen Garden',
							},
							{
								id: 'garden-5',
								source: {
									uri: 'https://images.unsplash.com/photo-1715934514077-4684c381f05a?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjZ8fGhvbWUlMjBnYXJkZW58ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&q=60&w=900',
								},
								name: 'Country Garden',
							},
						]}
					/>
				);
			case 2:
				return (
					<StyleStep
						onStyleSelect={handleStyleSelect}
						config={config}
						selectedStyle={selectedStyle}
					/>
				);
			case 3:
				return (
					<GeneratingStep
						onComplete={() => router.back()}
						onGenerationComplete={handleGenerationComplete}
						room={selectedRoom}
						style={selectedStyle}
						palette={null}
						imageUri={selectedImageUri}
						mode="garden"
					/>
				);
			case 4:
				return generatedImageUrl ? (
					<ConfirmationStep
						imageUrl={generatedImageUrl}
						room={selectedRoom}
						style={selectedStyle}
						palette={null}
						onComplete={() => router.back()}
						onRegenerate={handleRegenerate}
						imageUri={selectedImageUri}
						onSaveComplete={handleSaveComplete}
					/>
				) : null;
			default:
				return null;
		}
	};

	return (
		<View className=" bg-gray-50 flex-1 pb" style={{ paddingTop: insets.top }}>
			{/* Header - Hide on confirmation step */}
			{currentStep !== 4 && (
				<Animated.View
					style={{
						transform: [{ translateY: headerAnimation }],
					}}
				>
					<ModalHeader
						currentStep={currentStep}
						totalSteps={totalSteps}
						onClose={handleClose}
						onPrevious={handlePreviousStep}
						showPrevious={currentStep > 1}
					/>
				</Animated.View>
			)}

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
					contentContainerClassName={`mt-4 ${currentStep >= totalSteps + 1 ? 'flex-1' : ''}`}
					contentContainerStyle={{ paddingBottom: 24 }}
					showsVerticalScrollIndicator={false}
				>
					{renderStepContent()}
				</ScrollView>
			</Animated.View>

			{/* Footer - Hide on confirmation step */}
			{currentStep !== 4 && (
				<Animated.View
					style={{
						transform: [{ translateY: footerAnimation }],
					}}
				>
					<View
						className="px-6 py-6 bg-gray-50/50"
						style={{ paddingBottom: insets.bottom + 8 }}
					>
						<View className="flex-row justify-between items-center">
							<CustomButton
								title={currentStep === 2 ? 'Generate' : 'Continue'}
								onPress={handleNextStep}
								icon="arrow-right"
								iconPosition="right"
								variant="primary"
								size="lg"
								className="flex-1"
								disabled={
									(currentStep === 1 && !hasImageSelected) ||
									(currentStep === 2 && !selectedStyle)
								}
							/>
						</View>
					</View>
				</Animated.View>
			)}
		</View>
	);
}
