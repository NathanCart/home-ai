import React, { useRef, useEffect, useState } from 'react';
import { View, TouchableOpacity, Modal, Animated, ScrollView, Dimensions } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { PhotoStep } from './generatesteps/PhotoStep';
import { HouseTypeStep } from './generatesteps/HouseTypeStep';
import { StyleStep } from './generatesteps/StyleStep';
import { GeneratingStep } from './generatesteps/GeneratingStep';
import { CustomButton } from './CustomButton';
import { getStepConfig } from 'config/stepConfig';

interface GenerateExteriorHalfModalProps {
	visible: boolean;
	onClose: () => void;
	onGenerationComplete: (imageUrl: string, style?: any, houseType?: any) => void;
	initialImageUri?: string | null;
	initialHouseType?: any;
	initialStyle?: any;
}

export function GenerateExteriorHalfModal({
	visible,
	onClose,
	onGenerationComplete,
	initialImageUri,
	initialHouseType,
	initialStyle,
}: GenerateExteriorHalfModalProps) {
	const insets = useSafeAreaInsets();
	const translateY = useRef(new Animated.Value(1000)).current;
	const backgroundOpacity = useRef(new Animated.Value(0)).current;
	const panGestureRef = useRef<PanGestureHandler>(null);
	const screenWidth = Dimensions.get('window').width;

	const [currentStep, setCurrentStep] = useState(0);
	const [isGenerating, setIsGenerating] = useState(false);
	const [selectedImageUri, setSelectedImageUri] = useState<string | null>(
		initialImageUri || null
	);
	const [selectedHouseType, setSelectedHouseType] = useState<any>(initialHouseType);
	const [selectedStyle, setSelectedStyle] = useState<any>(initialStyle);

	const scrollViewRef = useRef<ScrollView>(null);
	const config = getStepConfig('exterior-design', 1); // Pass mode and step

	// Slide up animation when modal opens
	useEffect(() => {
		if (visible) {
			Animated.parallel([
				Animated.timing(translateY, {
					toValue: 0,
					duration: 300,
					useNativeDriver: true,
				}),
				Animated.timing(backgroundOpacity, {
					toValue: 1,
					duration: 300,
					useNativeDriver: true,
				}),
			]).start();
		} else {
			translateY.setValue(1000);
			backgroundOpacity.setValue(0);
		}
	}, [visible]);

	const onGestureEvent = Animated.event([{ nativeEvent: { translationY: translateY } }], {
		useNativeDriver: true,
	});

	const onHandlerStateChange = (event: PanGestureHandlerGestureEvent) => {
		if (event.nativeEvent.state === 5) {
			// END state
			const { translationY, velocityY } = event.nativeEvent;

			if (translationY > 120 || velocityY > 600) {
				onClose();
			} else {
				Animated.timing(translateY, {
					toValue: 0,
					duration: 200,
					useNativeDriver: true,
				}).start();
			}
		}
	};

	const handleClose = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		Animated.parallel([
			Animated.timing(translateY, {
				toValue: 1000,
				duration: 200,
				useNativeDriver: true,
			}),
			Animated.timing(backgroundOpacity, {
				toValue: 0,
				duration: 200,
				useNativeDriver: true,
			}),
		]).start(() => {
			onClose();
		});
	};

	const handleNext = () => {
		if (currentStep < 2) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			const nextStep = currentStep + 1;
			setCurrentStep(nextStep);
			scrollViewRef.current?.scrollTo({ x: nextStep * screenWidth, animated: true });
		}
	};

	const handlePrevious = () => {
		if (currentStep > 0) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			const prevStep = currentStep - 1;
			setCurrentStep(prevStep);
			scrollViewRef.current?.scrollTo({ x: prevStep * screenWidth, animated: true });
		}
	};

	const handleImageSelect = (imageUri?: string) => {
		if (imageUri) {
			setSelectedImageUri(imageUri);
		}
	};

	const handleHouseTypeSelect = (houseType: any) => {
		setSelectedHouseType(houseType);
	};

	const handleStyleSelect = (style: any) => {
		setSelectedStyle(style);
	};

	const handleGenerate = () => {
		if (!selectedImageUri || !selectedHouseType || !selectedStyle) {
			return;
		}

		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		setIsGenerating(true);
		setCurrentStep(3); // Move to generating step
		scrollViewRef.current?.scrollTo({ x: 3 * screenWidth, animated: true });
	};

	const handleGenerationComplete = (imageUrl: string) => {
		setIsGenerating(false);
		onGenerationComplete(imageUrl, selectedStyle, selectedHouseType);

		// Reset state for next time
		setTimeout(() => {
			setCurrentStep(0);
			scrollViewRef.current?.scrollTo({ x: 0, animated: false });
		}, 300);
	};

	const canGenerate = selectedImageUri && selectedHouseType && selectedStyle;

	return (
		<Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
			<Animated.View
				className="flex-1 justify-end"
				style={{
					backgroundColor: 'rgba(0, 0, 0, 0.5)',
					opacity: backgroundOpacity,
				}}
			>
				<TouchableOpacity className="flex-1" activeOpacity={1} onPress={handleClose} />
				<PanGestureHandler
					ref={panGestureRef}
					onGestureEvent={onGestureEvent}
					onHandlerStateChange={onHandlerStateChange}
					activeOffsetY={10}
				>
					<Animated.View
						style={{
							transform: [{ translateY }],
							backgroundColor: '#f9fafb',
							borderTopLeftRadius: 24,
							borderTopRightRadius: 24,
							paddingBottom: insets.bottom,
							minHeight: 340,
						}}
					>
						{/* Handle */}
						<View className="pt-4 pb-2 items-center">
							<View className="w-12 h-1.5 bg-gray-300 rounded-full" />
						</View>

						{/* Header */}
						{!isGenerating && (
							<View className="flex-row items-center justify-between px-6">
								<ThemedText variant="title-lg" className="text-gray-900" extraBold>
									{currentStep === 0
										? 'Set a Photo'
										: currentStep === 1
											? 'Select House Type'
											: 'Select a Style'}
								</ThemedText>
								<TouchableOpacity onPress={handleClose}>
									<Ionicons name="close" size={28} color="#111827" />
								</TouchableOpacity>
							</View>
						)}

						{/* Horizontal Scroll Content */}
						<ScrollView
							ref={scrollViewRef as any}
							horizontal
							pagingEnabled
							showsHorizontalScrollIndicator={false}
							scrollEnabled={false}
							style={{ paddingVertical: 16 }}
						>
							{/* Photo Step */}
							<View
								className="flex-1"
								style={{
									width: screenWidth,
								}}
							>
								<PhotoStep
									onImageSelect={handleImageSelect}
									config={config}
									selectedImageUri={selectedImageUri}
									compact
									customExampleImages={[
										{
											id: 'house-1',
											source: {
												uri: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
											},
											name: 'Modern House',
										},
										{
											id: 'house-2',
											source: {
												uri: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=2071&q=80',
											},
											name: 'Traditional House',
										},
										{
											id: 'house-3',
											source: {
												uri: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
											},
											name: 'Contemporary House',
										},
										{
											id: 'apartment-1',
											source: {
												uri: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80',
											},
											name: 'Modern Apartment',
										},
										{
											id: 'office-1',
											source: {
												uri: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
											},
											name: 'Office Building',
										},
									]}
								/>
							</View>

							{/* House Type Step */}
							<View
								className="flex-1"
								style={{
									width: screenWidth,
								}}
							>
								<HouseTypeStep
									onHouseTypeSelect={handleHouseTypeSelect}
									config={getStepConfig('exterior-design', 2)}
									selectedHouseType={selectedHouseType}
									compact
								/>
							</View>

							{/* Style Step */}
							<View
								className="flex-1"
								style={{
									width: screenWidth,
								}}
							>
								<StyleStep
									onStyleSelect={handleStyleSelect}
									config={getStepConfig('exterior-design', 3)}
									selectedStyle={selectedStyle}
									compact
									mode="exterior-design"
								/>
							</View>

							{/* Generating Step */}
							<View
								className="flex-1"
								style={{
									width: screenWidth,
								}}
							>
								<GeneratingStep
									onComplete={onClose}
									onGenerationComplete={handleGenerationComplete}
									room={selectedHouseType} // Using room prop for houseType
									style={selectedStyle}
									palette={null}
									imageUri={selectedImageUri}
									mode="exterior-design"
									compact
									shouldStart={isGenerating}
								/>
							</View>
						</ScrollView>

						{/* Footer Navigation */}
						{!isGenerating && (
							<View className="px-6 pt-4 border-t border-gray-200">
								<View className="flex-row gap-3">
									{currentStep > 0 && (
										<View className="flex-1">
											<CustomButton
												title="Back"
												onPress={handlePrevious}
												icon="arrow-left"
												variant="outline"
												size="lg"
											/>
										</View>
									)}
									<View className={currentStep > 0 ? 'flex-1' : 'flex-1 ml-auto'}>
										{currentStep < 2 ? (
											<CustomButton
												title="Continue"
												onPress={handleNext}
												icon="arrow-right"
												iconPosition="right"
												variant="primary"
												size="lg"
											/>
										) : (
											<CustomButton
												title="Generate"
												onPress={handleGenerate}
												icon="sync"
												variant="primary"
												size="lg"
												disabled={!canGenerate}
											/>
										)}
									</View>
								</View>
							</View>
						)}
					</Animated.View>
				</PanGestureHandler>
			</Animated.View>
		</Modal>
	);
}
