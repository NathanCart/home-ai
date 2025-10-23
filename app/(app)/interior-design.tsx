import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, Animated, Dimensions, SafeAreaView } from 'react-native';
import { Octicons } from '@expo/vector-icons';
import { ThemedText } from 'components/ThemedText';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { height: screenHeight } = Dimensions.get('window');

interface InteriorDesignModalProps {
	mode: string;
}

export default function InteriorDesignModal({ mode }: InteriorDesignModalProps) {
	const [currentStep, setCurrentStep] = useState(1);
	const [totalSteps] = useState(3);
	const slideAnimation = useRef(new Animated.Value(screenHeight)).current;
	const fadeAnimation = useRef(new Animated.Value(0)).current;

	React.useEffect(() => {
		// Slide in animation
		Animated.parallel([
			Animated.timing(slideAnimation, {
				toValue: 0,
				duration: 300,
				useNativeDriver: true,
			}),
			Animated.timing(fadeAnimation, {
				toValue: 1,
				duration: 300,
				useNativeDriver: true,
			}),
		]).start();
	}, []);

	const handleClose = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		Animated.parallel([
			Animated.timing(slideAnimation, {
				toValue: screenHeight,
				duration: 250,
				useNativeDriver: true,
			}),
			Animated.timing(fadeAnimation, {
				toValue: 0,
				duration: 250,
				useNativeDriver: true,
			}),
		]).start(() => {
			router.back();
		});
	};

	const handleNextStep = () => {
		if (currentStep < totalSteps) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			setCurrentStep(currentStep + 1);
		}
	};

	const handlePreviousStep = () => {
		if (currentStep > 1) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			setCurrentStep(currentStep - 1);
		}
	};

	const renderStepContent = () => {
		switch (currentStep) {
			case 1:
				return (
					<View className="flex-1 px-6">
						<View className="items-center mb-8">
							<View className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl items-center justify-center mb-6">
								<Octicons name="camera" size={40} color="white" />
							</View>
							<ThemedText variant="title-lg" className="text-gray-900 mb-3 text-center" extraBold>
								Upload Your Room Photo
							</ThemedText>
							<ThemedText variant="body" className="text-gray-600 text-center leading-6">
								Take a photo or upload an existing image of the room you'd like to redesign
							</ThemedText>
						</View>

						<View className="flex-1 justify-center">
							<TouchableOpacity className="border-2 border-dashed border-gray-300 rounded-3xl p-12 items-center mb-6">
								<Octicons name="plus" size={48} color="#9CA3AF" />
								<ThemedText variant="body" className="text-gray-500 mt-4 text-center">
									Tap to upload photo
								</ThemedText>
								<ThemedText variant="body" className="text-gray-400 text-sm mt-2 text-center">
									JPG, PNG up to 10MB
								</ThemedText>
							</TouchableOpacity>

							<View className="bg-blue-50 rounded-2xl p-4">
								<ThemedText variant="body" className="text-blue-800 text-center">
									💡 Tip: Make sure the room is well-lit and you can see the full space
								</ThemedText>
							</View>
						</View>
					</View>
				);
			case 2:
				return (
					<View className="flex-1 px-6">
						<View className="items-center mb-8">
							<View className="w-24 h-24 bg-gradient-to-br from-green-500 to-blue-600 rounded-3xl items-center justify-center mb-6">
								<Octicons name="paintbrush" size={40} color="white" />
							</View>
							<ThemedText variant="title-lg" className="text-gray-900 mb-3 text-center" extraBold>
								Choose Your Style
							</ThemedText>
							<ThemedText variant="body" className="text-gray-600 text-center leading-6">
								Select the design style you'd like for your room
							</ThemedText>
						</View>
					</View>
				);
			case 3:
				return (
					<View className="flex-1 px-6">
						<View className="items-center mb-8">
							<View className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl items-center justify-center mb-6">
								<Octicons name="sparkles" size={40} color="white" />
							</View>
							<ThemedText variant="title-lg" className="text-gray-900 mb-3 text-center" extraBold>
								Generate Design
							</ThemedText>
							<ThemedText variant="body" className="text-gray-600 text-center leading-6">
								Review your preferences and generate your AI-powered interior design
							</ThemedText>
						</View>
					</View>
				);
			default:
				return null;
		}
	};

	return (
		<View className="flex-1 bg-black/50">
			<Animated.View
				className="flex-1 justify-end"
				style={{
					opacity: fadeAnimation,
				}}
			>
				<Animated.View
					className="bg-white rounded-t-3xl"
					style={{
						height: screenHeight * 0.9,
						transform: [{ translateY: slideAnimation }],
					}}
				>
					<SafeAreaView className="flex-1">
						{/* Header */}
						<View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
							<TouchableOpacity onPress={handleClose}>
								<Octicons name="x" size={24} color="#6B7280" />
							</TouchableOpacity>
							
							<View className="flex-row items-center">
								<ThemedText variant="body" className="text-gray-600">
									Step {currentStep} of {totalSteps}
								</ThemedText>
							</View>

							<View className="w-6" />
						</View>

						{/* Progress Bar */}
						<View className="px-6 py-4">
							<View className="bg-gray-200 rounded-full h-2">
								<View 
									className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full h-2"
									style={{ width: `${(currentStep / totalSteps) * 100}%` }}
								/>
							</View>
						</View>

						{/* Content */}
						{renderStepContent()}

						{/* Footer */}
						<View className="px-6 py-6 border-t border-gray-100">
							<View className="flex-row justify-between">
								{currentStep > 1 ? (
									<TouchableOpacity 
										onPress={handlePreviousStep}
										className="flex-1 bg-gray-100 rounded-2xl p-4 mr-3 items-center"
									>
										<ThemedText variant="body" className="text-gray-700 font-semibold">
											Previous
										</ThemedText>
									</TouchableOpacity>
								) : (
									<View className="flex-1" />
								)}

								<LinearGradient
									colors={['#3B82F6', '#8B5CF6']}
									start={{ x: 0, y: 0 }}
									end={{ x: 1, y: 0 }}
									className={`${currentStep > 1 ? 'flex-1' : 'flex-1'} rounded-2xl p-4 items-center shadow-lg`}
								>
									<TouchableOpacity onPress={handleNextStep}>
										<ThemedText variant="body" className="text-white font-bold text-lg">
											{currentStep === totalSteps ? 'Generate Design' : 'Next'}
										</ThemedText>
									</TouchableOpacity>
								</LinearGradient>
							</View>
						</View>
					</SafeAreaView>
				</Animated.View>
			</Animated.View>
		</View>
	);
}
