import React, { useState, useRef } from 'react';
import { View, ScrollView, Animated } from 'react-native';
import { CustomButton } from 'components/CustomButton';
import { PhotoStep } from 'components/generatesteps/PhotoStep';
import { MaskStep } from 'components/generatesteps/MaskStep';
import { TextInputStep } from 'components/generatesteps/TextInputStep';
import { GeneratingStep } from 'components/generatesteps/GeneratingStep';
import { ConfirmationStep } from 'components/generatesteps/ConfirmationStep';
import { ModalHeader } from 'components/generatesteps/ModalHeader';
import { getStepConfig } from 'config/stepConfig';
import { MaskStepRef } from 'components/generatesteps/MaskStep';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useGenerateModalAnimation } from 'components/useGenerateModalAnimation';

export default function PaintModal() {
	const insets = useSafeAreaInsets();
	const maskStepRef = useRef<MaskStepRef>(null);
	const [currentStep, setCurrentStep] = useState(1);
	const [totalSteps] = useState(3); // Photo, Mask, Text Input
	const [hasImageSelected, setHasImageSelected] = useState(false);
	const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
	const [maskImageUri, setMaskImageUri] = useState<string | null>(null);
	const [hasMaskContent, setHasMaskContent] = useState(false);
	const [replacementText, setReplacementText] = useState<string>('');
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

	const handleNextStep = async () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

		// If we're on the mask step, save the mask before advancing
		if (currentStep === 2 && hasMaskContent) {
			const maskDataUri = await maskStepRef.current?.exportMask();
			if (maskDataUri) {
				setMaskImageUri(maskDataUri);
			}
		}

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

	const handleMaskComplete = (maskDataUri: string) => {
		setMaskImageUri(maskDataUri);
		// Auto-advance to next step
		handleNextStep();
	};

	const handleTextSubmit = (text: string) => {
		setReplacementText(text);
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
				return selectedImageUri ? (
					<MaskStep
						ref={maskStepRef}
						onMaskComplete={handleMaskComplete}
						config={config}
						imageUri={selectedImageUri}
						onHasMaskContentChange={setHasMaskContent}
						initialMaskUri={maskImageUri || undefined}
					/>
				) : null;
			case 3:
				return (
					<TextInputStep
						onTextSubmit={handleTextSubmit}
						config={config}
						initialText={replacementText}
					examples={[
						'a tall oak bookshelf filled with books',
						'a large monstera plant in a terracotta pot',
						'a minimalist abstract painting in a black frame',
						'a floor-to-ceiling window with natural light',
						'a white fireplace mantel with decorative accents',
						'a vintage leather armchair',
						'a modern glass coffee table',
						'a cozy reading nook with cushions',
					]}
					/>
				);
			case 4:
				return (
					<GeneratingStep
						onComplete={() => router.back()}
						onGenerationComplete={handleGenerationComplete}
						room={null}
						style={null}
						imageUri={selectedImageUri}
						maskImageUri={maskImageUri}
						customPrompt={replacementText}
					/>
				);
			case 5:
				return generatedImageUrl ? (
					<ConfirmationStep
						imageUrl={generatedImageUrl}
						room={null}
						style={null}
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
			{currentStep !== 5 && (
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
				{currentStep !== 2 ? (
					<ScrollView
						className=""
						contentContainerClassName={` ${currentStep >= totalSteps + 1 ? 'flex-1' : ''}`}
						contentContainerStyle={{ paddingBottom: 24 }}
						showsVerticalScrollIndicator={false}
					>
						{renderStepContent()}
					</ScrollView>
				) : (
					<View className="flex-1">{renderStepContent()}</View>
				)}
			</Animated.View>

			{/* Footer - Hide on confirmation step */}
			{currentStep !== 5 && (
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
								title={currentStep === 3 ? 'Replace' : 'Continue'}
								onPress={handleNextStep}
								icon="arrow-right"
								iconPosition="right"
								variant="primary"
								size="lg"
								className="flex-1"
								disabled={
									(currentStep === 1 && !hasImageSelected) ||
									(currentStep === 2 && !hasMaskContent) ||
									(currentStep === 3 && !replacementText.trim())
								}
							/>
						</View>
					</View>
				</Animated.View>
			)}
		</View>
	);
}
