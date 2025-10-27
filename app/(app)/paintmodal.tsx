import React, { useState } from 'react';
import { View, ScrollView, Animated } from 'react-native';
import { CustomButton } from 'components/CustomButton';
import { PhotoStep } from 'components/generatesteps/PhotoStep';
import { ColorStep } from 'components/generatesteps/ColorStep';
import { GeneratingStep } from 'components/generatesteps/GeneratingStep';
import { ConfirmationStep } from 'components/generatesteps/ConfirmationStep';
import { ModalHeader } from 'components/generatesteps/ModalHeader';
import { getStepConfig } from 'config/stepConfig';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useGenerateModalAnimation } from 'components/useGenerateModalAnimation';

export default function PaintModal() {
	const insets = useSafeAreaInsets();
	const [currentStep, setCurrentStep] = useState(1);
	const [totalSteps] = useState(2); // Photo, Color
	const [hasImageSelected, setHasImageSelected] = useState(false);
	const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
	const [selectedPalette, setSelectedPalette] = useState<any>(null);
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

	const handleColorSelect = (color: any | null) => {
		setSelectedPalette(color);
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
		const config = getStepConfig('paint', currentStep);

		switch (currentStep) {
			case 1:
				return (
					<PhotoStep
						onImageSelect={handleImageSelect}
						config={config}
						selectedImageUri={selectedImageUri}
						customExampleImages={[
							{
								id: 'living-room-1',
								source: {
									uri: 'https://images.unsplash.com/photo-1759722668385-90006d9c7aa7?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1354',
								},
								name: 'Modern Living',
							},

							{
								id: 'living-room-2',
								source: {
									uri: 'https://plus.unsplash.com/premium_photo-1661699082515-24e99b178ff7?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8c29mYSUyMGRlc2lnbnxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&q=60&w=800',
								},
								name: 'Modern Living',
							},
							{
								id: 'living-room-3',
								source: {
									uri: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1558',
								},
								name: 'Modern Living',
							},
							{
								id: 'living-room-4',
								source: {
									uri: 'https://images.unsplash.com/photo-1618220179428-22790b461013?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=927',
								},
								name: 'Modern Living',
							},
							{
								id: 'living-room-5',
								source: {
									uri: 'https://plus.unsplash.com/premium_photo-1661765778256-169bf5e561a6?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8aW50ZXJpb3IlMjBkZXNpZ258ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&q=60&w=800',
								},
								name: 'Modern Living',
							},
							{
								id: 'living-room-6',
								source: {
									uri: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=987',
								},
								name: 'Modern Living',
							},
						]}
					/>
				);
			case 2:
				return (
					<ColorStep
						onColorSelect={handleColorSelect}
						config={config}
						selectedColor={selectedPalette}
					/>
				);
			case 3:
				return (
					<GeneratingStep
						onComplete={() => router.back()}
						onGenerationComplete={handleGenerationComplete}
						room={null}
						style={null}
						palette={selectedPalette}
						imageUri={selectedImageUri}
					/>
				);
			case 4:
				return generatedImageUrl ? (
					<ConfirmationStep
						imageUrl={generatedImageUrl}
						room={null}
						style={null}
						palette={selectedPalette}
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
									(currentStep === 2 && !selectedPalette)
								}
							/>
						</View>
					</View>
				</Animated.View>
			)}
		</View>
	);
}
