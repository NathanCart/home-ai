import React, { useState, useEffect } from 'react';
import { View, ScrollView, Animated } from 'react-native';
import { CustomButton } from 'components/CustomButton';
import { PhotoStep } from 'components/generatesteps/PhotoStep';
import { ColorStep } from 'components/generatesteps/ColorStep';
import { TextInputStep } from 'components/generatesteps/TextInputStep';
import { GeneratingStep } from 'components/generatesteps/GeneratingStep';
import { ConfirmationStep } from 'components/generatesteps/ConfirmationStep';
import { ModalHeader } from 'components/generatesteps/ModalHeader';
import { getStepConfig } from 'config/stepConfig';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useGenerateModalAnimation } from 'components/useGenerateModalAnimation';

interface Color {
	id: string;
	name: string;
	hex: string;
	category?: string;
}

export default function RepaintModal() {
	const { initialImageUri, projectSlug } = useLocalSearchParams<{
		initialImageUri?: string;
		projectSlug?: string;
	}>();
	const insets = useSafeAreaInsets();
	const [currentStep, setCurrentStep] = useState(1);
	const [totalSteps] = useState(3); // Photo, Color, Text Input
	const [hasImageSelected, setHasImageSelected] = useState(false);
	const [selectedImageUri, setSelectedImageUri] = useState<string | null>(
		initialImageUri || null
	);
	const [selectedColor, setSelectedColor] = useState<Color | null>(null);
	const [customPrompt, setCustomPrompt] = useState<string>('');
	const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
	const [isTransitioning, setIsTransitioning] = useState(false);

	// Set initial image if provided
	useEffect(() => {
		if (initialImageUri) {
			setSelectedImageUri(initialImageUri);
			setHasImageSelected(true);
		}
	}, [initialImageUri]);

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

	const handleColorSelect = (color: Color | null) => {
		setSelectedColor(color);
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
	};

	const handleTextSubmit = (text: string) => {
		setCustomPrompt(text);
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
			// Navigate to confirmation step (step 5)
			setCurrentStep(5);

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
			// Navigate back to generating step (step 4)
			setCurrentStep(4);

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
		const config = getStepConfig('repaint', currentStep);

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
					<ColorStep
						onColorSelect={handleColorSelect}
						config={config}
						selectedColor={selectedColor}
					/>
				);
			case 3:
				return (
					<TextInputStep
						onTextSubmit={handleTextSubmit}
						config={config}
						initialText={customPrompt}
						examples={[
							'walls',
							'floor',
							'sofa',
							'carpet',
							'cabinets',
							'door',
							'ceiling',
							'curtains',
						]}
					/>
				);
			case 4:
				return (
					<GeneratingStep
						onComplete={() => router.back()}
						onGenerationComplete={handleGenerationComplete}
						room={null}
						style={selectedColor}
						palette={null}
						imageUri={selectedImageUri}
						customPrompt={customPrompt}
						mode="repaint"
					/>
				);
			case 5:
				return generatedImageUrl ? (
					<ConfirmationStep
						imageUrl={generatedImageUrl}
						room={null}
						style={selectedColor}
						palette={null}
						mode="repaint"
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
		<View className="bg-gray-50 flex-1" style={{ paddingTop: insets.top }}>
			{/* Header - Hide on confirmation step */}
			{currentStep <= 3 && (
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
					contentContainerClassName={`mt-4 ${currentStep >= 4 ? 'flex-1' : ''}`}
					contentContainerStyle={{ paddingBottom: 24 }}
					showsVerticalScrollIndicator={false}
				>
					{renderStepContent()}
				</ScrollView>
			</Animated.View>

			{/* Footer - Hide on confirmation step */}
			{currentStep <= 3 && (
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
								title={currentStep === 3 ? 'Generate' : 'Continue'}
								onPress={handleNextStep}
								icon="arrow-right"
								iconPosition="right"
								variant="primary"
								size="lg"
								className="flex-1"
								disabled={
									(currentStep === 1 && !hasImageSelected) ||
									(currentStep === 2 && !selectedColor) ||
									(currentStep === 3 && customPrompt.trim().length === 0)
								}
							/>
						</View>
					</View>
				</Animated.View>
			)}
		</View>
	);
}

