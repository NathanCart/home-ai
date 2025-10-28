import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';
import { Octicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';

interface ModalHeaderProps {
	currentStep: number;
	totalSteps: number;
	onClose: () => void;
	onPrevious?: () => void;
	showPrevious?: boolean;
}

export function ModalHeader({
	currentStep,
	totalSteps,
	onClose,
	onPrevious,
	showPrevious = false,
}: ModalHeaderProps) {
	const progressAnimation = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		Animated.timing(progressAnimation, {
			toValue: currentStep,
			duration: 300,
			useNativeDriver: false,
		}).start();
	}, [currentStep, progressAnimation]);

	return (
		<View className="px-6 py-4">
			{/* Top Row */}
			<View className="flex-row items-center justify-between mb-4">
				{showPrevious ? (
					<TouchableOpacity
						onPress={onPrevious}
						className="w-10 h-10 items-center justify-center"
					>
						<Octicons name="chevron-left" size={24} color="#111827" />
					</TouchableOpacity>
				) : (
					<View className="w-10" />
				)}

				<ThemedText variant="title-md" className="text-gray-900 !text-xl">
					Step {currentStep} / {totalSteps}
				</ThemedText>

				<TouchableOpacity
					onPress={onClose}
					className="w-10 h-10 items-center justify-center"
				>
					<Octicons name="x" size={24} color="#111827" />
				</TouchableOpacity>
			</View>

			{/* Progress Steps */}
			<View className="flex-row items-center justify-between w-full">
				{Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
					<Animated.View
						key={step}
						className="h-1 rounded-full flex-1"
						style={{
							marginRight: step < totalSteps ? 8 : 0,
							backgroundColor: progressAnimation.interpolate({
								inputRange: [step - 1, step],
								outputRange: ['rgba(17, 24, 39, 0.3)', 'rgba(17, 24, 39, 1)'],
								extrapolate: 'clamp',
							}),
						}}
					/>
				))}
			</View>
		</View>
	);
}
