import React, { useEffect, useState } from 'react';
import { View, ScrollView, Animated } from 'react-native';
import { CustomButton } from 'components/CustomButton';
import { PhotoStep } from 'components/generatesteps/PhotoStep';
import { TextInputStep } from 'components/generatesteps/TextInputStep';
import { GeneratingStep } from 'components/generatesteps/GeneratingStep';
import { ConfirmationStep } from 'components/generatesteps/ConfirmationStep';
import { ModalHeader } from 'components/generatesteps/ModalHeader';
import { getStepConfig } from 'config/stepConfig';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useGenerateModalAnimation } from 'components/useGenerateModalAnimation';

// Deterministic shuffle function (same as explore page)
const deterministicShuffle = <T,>(array: T[], seed: string): T[] => {
	const shuffled = [...array];
	let hash = 0;
	for (let i = 0; i < seed.length; i++) {
		const char = seed.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}

	let random = Math.abs(Math.sin(hash)) * 10000;
	const seededRandom = () => {
		random = Math.abs(Math.sin(random)) * 10000;
		return random - Math.floor(random);
	};

	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(seededRandom() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}

	return shuffled;
};

// Get example images from explore page - using the same images as the explore page
const getExampleImages = () => {
	// Get all interior images (same logic as explore page)
	const allLivingRoomImages = Array.from(
		{ length: 79 },
		(_, i) =>
			`https://pingu-app.s3.eu-west-2.amazonaws.com/livingroom${i === 0 ? '1' : i + 1}.jpg`
	);
	const allBedroomImages = Array.from(
		{ length: 36 },
		(_, i) => `https://pingu-app.s3.eu-west-2.amazonaws.com/bedroom${i === 0 ? '1' : i + 1}.jpg`
	);
	const allKitchenImages = Array.from(
		{ length: 36 },
		(_, i) => `https://pingu-app.s3.eu-west-2.amazonaws.com/kitchen${i === 0 ? '1' : i + 1}.jpg`
	);

	// Shuffle and take first few from each
	const shuffledLivingRoom = deterministicShuffle(allLivingRoomImages, 'freeform-living-room');
	const shuffledBedroom = deterministicShuffle(allBedroomImages, 'freeform-bedroom');
	const shuffledKitchen = deterministicShuffle(allKitchenImages, 'freeform-kitchen');

	const images = [];

	// Add 8 living room images
	for (let i = 0; i < 8; i++) {
		images.push({
			id: `living-room-${i + 1}`,
			source: { uri: shuffledLivingRoom[i] },
			name: 'Living Room',
		});
	}

	// Add 4 bedroom images
	for (let i = 0; i < 4; i++) {
		images.push({
			id: `bedroom-${i + 1}`,
			source: { uri: shuffledBedroom[i] },
			name: 'Bedroom',
		});
	}

	// Add 4 kitchen images
	for (let i = 0; i < 4; i++) {
		images.push({
			id: `kitchen-${i + 1}`,
			source: { uri: shuffledKitchen[i] },
			name: 'Kitchen',
		});
	}

	return images;
};

export default function FreeformModal() {
	const insets = useSafeAreaInsets();
	const { initialImageUri } = useLocalSearchParams();
	const [currentStep, setCurrentStep] = useState(1);
	const [totalSteps] = useState(2); // Photo, Text Input (Generate is step 3 but not shown in header)
	const [hasImageSelected, setHasImageSelected] = useState(false);
	const [selectedImageUri, setSelectedImageUri] = useState<string | null>(
		(initialImageUri as string) || null
	);
	const [customPrompt, setCustomPrompt] = useState<string>('');
	const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
	const [isTransitioning, setIsTransitioning] = useState(false);

	// Example images from explore page - get them inside component
	const exampleImages = getExampleImages();

	// Set initial image if provided
	useEffect(() => {
		if (initialImageUri) {
			setSelectedImageUri(initialImageUri as string);
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

	const handleSaveComplete = () => {
		router.back();
	};

	const renderStepContent = () => {
		const config = getStepConfig('freeform', currentStep);

		switch (currentStep) {
			case 1:
				return (
					<PhotoStep
						onImageSelect={handleImageSelect}
						config={config}
						selectedImageUri={selectedImageUri}
						customExampleImages={exampleImages}
					/>
				);
			case 2:
				return (
					<TextInputStep
						onTextSubmit={handleTextSubmit}
						config={config}
						initialText={customPrompt}
						placeholder="Describe any changes you want to make to your space..."
						examples={[
							'Transform the walls to a warm terracotta color with subtle texture',
							'Replace the flooring with dark hardwood planks in a herringbone pattern',
							'Add floor-to-ceiling windows with natural light and modern black frames',
							'Introduce a minimalist fireplace with a marble surround and built-in shelving',
							'Redesign the lighting with recessed ceiling lights and a statement pendant fixture',
							'Update the furniture to mid-century modern pieces with velvet upholstery',
							'Create an accent wall with exposed brick and industrial-style wall sconces',
						]}
					/>
				);
			case 3:
				return (
					<GeneratingStep
						onComplete={() => router.back()}
						onGenerationComplete={handleGenerationComplete}
						imageUri={selectedImageUri}
						customPrompt={customPrompt}
						mode="freeform"
					/>
				);
			case 4:
				return generatedImageUrl ? (
					<ConfirmationStep
						imageUrl={generatedImageUrl}
						mode="freeform"
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
			{/* Header - Hide on generating and confirmation steps */}
			{currentStep !== 3 && currentStep !== 4 && (
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

			{/* Footer - Hide on generating and confirmation steps */}
			{currentStep !== 3 && currentStep !== 4 && (
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
								title={
									currentStep === 1
										? hasImageSelected
											? 'Next'
											: 'Select Photo'
										: currentStep === 2
											? customPrompt.trim()
												? 'Generate'
												: 'Enter Request'
											: 'Next'
								}
								onPress={handleNextStep}
								icon="arrow-right"
								iconPosition="right"
								variant="primary"
								size="lg"
								className="flex-1"
								disabled={
									(currentStep === 1 && !hasImageSelected) ||
									(currentStep === 2 && !customPrompt.trim())
								}
							/>
						</View>
					</View>
				</Animated.View>
			)}
		</View>
	);
}
