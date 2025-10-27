import React, { useRef, useEffect, useState } from 'react';
import { View, TouchableOpacity, Modal, Animated, ScrollView, Dimensions } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { Octicons, Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { PhotoStep } from './generatesteps/PhotoStep';
import { RoomStep } from './generatesteps/RoomStep';
import { StyleStep } from './generatesteps/StyleStep';
import { GeneratingStep } from './generatesteps/GeneratingStep';
import { CustomButton } from './CustomButton';
import { getStepConfig } from 'config/stepConfig';

interface GenerateHalfModalProps {
	visible: boolean;
	onClose: () => void;
	onGenerationComplete: (imageUrl: string, style?: any, room?: any) => void;
	initialImageUri?: string | null;
	initialRoom?: any;
	initialStyle?: any;
}

export function GenerateHalfModal({
	visible,
	onClose,
	onGenerationComplete,
	initialImageUri,
	initialRoom,
	initialStyle,
}: GenerateHalfModalProps) {
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
	const [selectedRoom, setSelectedRoom] = useState<any>(initialRoom);
	const [selectedStyle, setSelectedStyle] = useState<any>(initialStyle);

	const scrollViewRef = useRef<ScrollView>(null);
	const config = getStepConfig('interior-design', 1); // Pass mode and step

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

	const handleRoomSelect = (room: any) => {
		setSelectedRoom(room);
	};

	const handleStyleSelect = (style: any) => {
		setSelectedStyle(style);
	};

	const handleGenerate = () => {
		if (!selectedImageUri || !selectedRoom || !selectedStyle) {
			return;
		}

		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		setIsGenerating(true);
		setCurrentStep(3); // Move to generating step
		scrollViewRef.current?.scrollTo({ x: 3 * screenWidth, animated: true });
	};

	const handleGenerationComplete = (imageUrl: string) => {
		setIsGenerating(false);
		onGenerationComplete(imageUrl, selectedStyle, selectedRoom);

		// Reset state for next time
		setTimeout(() => {
			setCurrentStep(0);
			scrollViewRef.current?.scrollTo({ x: 0, animated: false });
		}, 300);
	};

	const canGenerate = selectedImageUri && selectedRoom && selectedStyle;

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
											? 'Select a Room'
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
								style={{
									width: screenWidth,
								}}
							>
								<PhotoStep
									onImageSelect={handleImageSelect}
									config={config}
									selectedImageUri={selectedImageUri}
									compact
								/>
							</View>

							{/* Room Step */}
							<View
								style={{
									width: screenWidth,
								}}
							>
								<RoomStep
									onRoomSelect={handleRoomSelect}
									config={config}
									selectedRoom={selectedRoom}
									compact
								/>
							</View>

							{/* Style Step */}
							<View
								style={{
									width: screenWidth,
								}}
							>
								<StyleStep
									onStyleSelect={handleStyleSelect}
									config={config}
									selectedStyle={selectedStyle}
									compact
								/>
							</View>

							{/* Generating Step */}
							<View
								style={{
									width: screenWidth,
								}}
							>
								<GeneratingStep
									onComplete={onClose}
									onGenerationComplete={handleGenerationComplete}
									room={selectedRoom}
									style={selectedStyle}
									palette={null}
									imageUri={selectedImageUri}
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
