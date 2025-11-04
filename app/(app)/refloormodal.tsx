import React, { useState, useEffect } from 'react';
import { View, ScrollView, Animated } from 'react-native';
import { CustomButton } from 'components/CustomButton';
import { PhotoStep } from 'components/generatesteps/PhotoStep';
import { FloorStyleStep } from 'components/generatesteps/FloorStyleStep';
import { GeneratingStep } from 'components/generatesteps/GeneratingStep';
import { ConfirmationStep } from 'components/generatesteps/ConfirmationStep';
import { ModalHeader } from 'components/generatesteps/ModalHeader';
import { getStepConfig } from 'config/stepConfig';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useGenerateModalAnimation } from 'components/useGenerateModalAnimation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FloorStyle } from 'utils/floorStylePrompts';

export default function RefloorModal() {
	const { initialImageUri, projectSlug } = useLocalSearchParams<{
		initialImageUri?: string;
		projectSlug?: string;
	}>();
	const insets = useSafeAreaInsets();
	const [currentStep, setCurrentStep] = useState(1);
	const [totalSteps] = useState(2); // Photo, Floor Style
	const [hasImageSelected, setHasImageSelected] = useState(false);
	const [selectedImageUri, setSelectedImageUri] = useState<string | null>(
		initialImageUri || null
	);
	const [selectedFloorStyle, setSelectedFloorStyle] = useState<FloorStyle | null>(null);
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

	const handleFloorStyleSelect = (floorStyle: FloorStyle | null) => {
		setSelectedFloorStyle(floorStyle);
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
	};

	const handleGenerationComplete = async (imageUrl: string) => {
		// If we came from project page, save to project and go back immediately
		if (initialImageUri && projectSlug) {
			try {
				const storedProjects = await AsyncStorage.getItem('projects');
				if (storedProjects) {
					const projects = JSON.parse(storedProjects);
					// Find project by slug (matching imageUrl with slug)
					const projectIndex = projects.findIndex((p: any) =>
						p.imageUrl.includes(projectSlug)
					);

					if (projectIndex !== -1) {
						// Add to alternative generations
						if (!projects[projectIndex].alternativeGenerations) {
							projects[projectIndex].alternativeGenerations = [];
						}
						const alternatives = projects[projectIndex].alternativeGenerations.map(
							(alt: any) => (typeof alt === 'string' ? { imageUrl: alt } : alt)
						);
						alternatives.push({ imageUrl });
						projects[projectIndex].alternativeGenerations = alternatives;
						await AsyncStorage.setItem('projects', JSON.stringify(projects));
					}
				}

				// Store the new variant URL in AsyncStorage with a timestamp so project page can detect it
				await AsyncStorage.setItem(`newVariant_${projectSlug}`, imageUrl);

				// Navigate back to project page immediately - don't set state first
				router.back();
				return; // Exit early, don't proceed to confirmation step
			} catch (error) {
				console.error('Error saving to project:', error);
				// Fall through to normal confirmation flow
			}
		}

		// Normal flow: go to confirmation step
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
		const config = getStepConfig('refloor', currentStep);

		switch (currentStep) {
			case 1:
				return (
					<PhotoStep
						onImageSelect={handleImageSelect}
						config={config}
						selectedImageUri={selectedImageUri}
						hideExamples={!!initialImageUri}
					/>
				);
			case 2:
				return (
					<FloorStyleStep
						onFloorStyleSelect={handleFloorStyleSelect}
						config={config}
						selectedFloorStyle={selectedFloorStyle}
					/>
				);
			case 3:
				return (
					<GeneratingStep
						onComplete={() => router.back()}
						onGenerationComplete={handleGenerationComplete}
						room={null}
						style={selectedFloorStyle}
						palette={null}
						imageUri={selectedImageUri}
						mode="refloor"
					/>
				);
			case 4:
				return generatedImageUrl ? (
					<ConfirmationStep
						imageUrl={generatedImageUrl}
						room={null}
						style={selectedFloorStyle}
						palette={null}
						mode="refloor"
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
			{currentStep <= 2 && (
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
					contentContainerClassName={`mt-4 ${currentStep >= 3 ? 'flex-1' : ''}`}
					contentContainerStyle={{ paddingBottom: 24 }}
					showsVerticalScrollIndicator={false}
				>
					{renderStepContent()}
				</ScrollView>
			</Animated.View>

			{/* Footer - Hide on confirmation step */}
			{currentStep <= 2 && (
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
									(currentStep === 2 && !selectedFloorStyle)
								}
							/>
						</View>
					</View>
				</Animated.View>
			)}
		</View>
	);
}

