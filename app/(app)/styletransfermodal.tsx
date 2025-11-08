import React, { useEffect, useState } from 'react';
import { View, ScrollView, Animated } from 'react-native';
import { CustomButton } from 'components/CustomButton';
import { StyleTransferPhotoStep } from 'components/generatesteps/StyleTransferPhotoStep';
import { PhotoStep } from 'components/generatesteps/PhotoStep';
import { GeneratingStep } from 'components/generatesteps/GeneratingStep';
import { ConfirmationStep } from 'components/generatesteps/ConfirmationStep';
import { ModalHeader } from 'components/generatesteps/ModalHeader';
import { getStepConfig } from 'config/stepConfig';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useGenerateModalAnimation } from 'components/useGenerateModalAnimation';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function StyleTransferModal() {
	const insets = useSafeAreaInsets();
	const { initialImageUri, initialStyleImageUri, projectSlug } = useLocalSearchParams();
	const [currentStep, setCurrentStep] = useState(1);
	const [totalSteps] = useState(2); // Style Photo, Room Photo
	const [hasStyleImageSelected, setHasStyleImageSelected] = useState(false);
	const [hasRoomImageSelected, setHasRoomImageSelected] = useState(false);
	const [selectedStyleImageUri, setSelectedStyleImageUri] = useState<string | null>(
		(initialStyleImageUri as string) || null
	);
	const [selectedRoomImageUri, setSelectedRoomImageUri] = useState<string | null>(
		(initialImageUri as string) || null
	);

	// Set initial images if provided
	useEffect(() => {
		if (initialStyleImageUri) {
			setSelectedStyleImageUri(initialStyleImageUri as string);
			setHasStyleImageSelected(true);
		}
		if (initialImageUri) {
			setSelectedRoomImageUri(initialImageUri as string);
			setHasRoomImageSelected(true);
		}
	}, [initialImageUri, initialStyleImageUri]);

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

	const handleStyleImageSelect = (imageUri?: string) => {
		setHasStyleImageSelected(true);
		if (imageUri) {
			setSelectedStyleImageUri(imageUri);
		}
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
	};

	const handleRoomImageSelect = (imageUri?: string) => {
		setHasRoomImageSelected(true);
		if (imageUri) {
			setSelectedRoomImageUri(imageUri);
		}
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
						p.imageUrl.includes(projectSlug as string)
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
		const config = getStepConfig('styletransfer', currentStep);

		switch (currentStep) {
			case 1:
				return (
					<StyleTransferPhotoStep
						onImageSelect={handleStyleImageSelect}
						config={config}
						selectedImageUri={selectedStyleImageUri}
					/>
				);
			case 2:
				return (
					<PhotoStep
						onImageSelect={handleRoomImageSelect}
						config={config}
						selectedImageUri={selectedRoomImageUri}
					/>
				);
			case 3:
				return (
					<GeneratingStep
						onComplete={() => router.back()}
						onGenerationComplete={handleGenerationComplete}
						room={null}
						style={null}
						palette={null}
						imageUri={selectedRoomImageUri}
						mode="styletransfer"
						styleImageUri={selectedStyleImageUri}
					/>
				);
			case 4:
				return generatedImageUrl ? (
					<ConfirmationStep
						imageUrl={generatedImageUrl}
						room={null}
						style={null}
						palette={null}
						mode="styletransfer"
						onComplete={() => router.back()}
						onRegenerate={handleRegenerate}
						imageUri={selectedRoomImageUri}
						onSaveComplete={handleSaveComplete}
					/>
				) : null;
			default:
				return null;
		}
	};

	return (
		<View className="bg-gray-50 flex-1" style={{ paddingTop: insets.top }}>
			{/* Header - Hide on generating and confirmation steps */}
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

			{/* Footer - Hide on generating and confirmation steps */}
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
									(currentStep === 1 && !hasStyleImageSelected) ||
									(currentStep === 2 && !hasRoomImageSelected)
								}
							/>
						</View>
					</View>
				</Animated.View>
			)}
		</View>
	);
}

