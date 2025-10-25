import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, Animated } from 'react-native';
import { Octicons } from '@expo/vector-icons';
import { ThemedText } from 'components/ThemedText';
import { CustomButton } from 'components/CustomButton';
import { PhotoStep } from 'components/generatesteps/PhotoStep';
import { RoomStep } from 'components/generatesteps/RoomStep';
import { StyleStep } from 'components/generatesteps/StyleStep';
import { ColorPaletteStep } from 'components/generatesteps/ColorPaletteStep';
import { GeneratingStep } from 'components/generatesteps/GeneratingStep';
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
	const [selectedStyle, setSelectedStyle] = useState<any>(null);
	const [selectedPalette, setSelectedPalette] = useState<any>(null);
	const [isTransitioning, setIsTransitioning] = useState(false);
	const slideAnimation = useRef(new Animated.Value(0)).current;
	const opacityAnimation = useRef(new Animated.Value(1)).current;
	const headerAnimation = useRef(new Animated.Value(0)).current;
	const footerAnimation = useRef(new Animated.Value(0)).current;

	// Animate header and footer when reaching generating step
	useEffect(() => {
		if (currentStep >= totalSteps + 1) {
			// Animate header up and footer down
			Animated.parallel([
				Animated.timing(headerAnimation, {
					toValue: -200,
					duration: 300,
					useNativeDriver: true,
				}),
				Animated.timing(footerAnimation, {
					toValue: 100,
					duration: 300,
					useNativeDriver: true,
				}),
			]).start();
		} else {
			// Reset animations when not on generating step
			headerAnimation.setValue(0);
			footerAnimation.setValue(0);
		}
	}, [currentStep]);

	const handleClose = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		router.back();
	};

	const handleNextStep = () => {
		if (currentStep < totalSteps + 1 && !isTransitioning) {
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

	const handleStyleSelect = (style: any) => {
		setSelectedStyle(style);
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
	};

	const handlePaletteSelect = (palette: any) => {
		setSelectedPalette(palette);
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
					<StyleStep
						onStyleSelect={handleStyleSelect}
						config={config}
						selectedStyle={selectedStyle}
					/>
				);
			case 4:
				return (
					<ColorPaletteStep
						onPaletteSelect={handlePaletteSelect}
						config={config}
						selectedPalette={selectedPalette}
						selectedStyle={selectedStyle?.id}
					/>
				);
			case 5:
				return <GeneratingStep onComplete={() => router.back()} />;
			default:
				return null;
		}
	};

	return (
		<View className=" bg-gray-50 flex-1 pb" style={{ paddingTop: insets.top }}>
			{/* Header - Animate up on generating step */}
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

			{/* Footer - Animate down on generating step */}
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
							title={currentStep === 4 ? 'Generate' : 'Continue'}
							onPress={handleNextStep}
							icon="arrow-right"
							iconPosition="right"
							variant="primary"
							size="lg"
							className="flex-1"
							disabled={
								(currentStep === 1 && !hasImageSelected) ||
								(currentStep === 2 && !selectedRoom) ||
								(currentStep === 3 && !selectedStyle) ||
								(currentStep === 4 && !selectedPalette)
							}
						/>
					</View>
				</View>
			</Animated.View>
		</View>
	);
}
