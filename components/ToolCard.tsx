import React, { useRef } from 'react';
import { View, TouchableOpacity, Animated, Pressable, Image } from 'react-native';
import { Octicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { CustomButton } from './CustomButton';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

interface ToolCardProps {
	title: string;
	description: string;
	icon: keyof typeof Octicons.glyphMap;
	onPress: () => void;
	image?: string;
	gradient?: string;
	iconColor?: string;
	badge?: string;
	disabled?: boolean;
	loading?: boolean;
	hapticFeedback?: boolean;
	showButton?: boolean;
	buttonText?: string;
}

export function ToolCard({
	title,
	description,
	icon,
	onPress,
	image,
	gradient = 'from-blue-500 to-purple-600',
	iconColor = '#ffffff',
	badge,
	disabled = false,
	loading = false,
	hapticFeedback = true,
	showButton = true,
	buttonText = 'Try it!',
}: ToolCardProps) {
	const scaleAnimation = useRef(new Animated.Value(1)).current;

	const handlePressIn = () => {
		Animated.spring(scaleAnimation, {
			toValue: 0.98,
			useNativeDriver: true,
			tension: 300,
			friction: 12,
		}).start();
	};

	const handlePressOut = () => {
		Animated.spring(scaleAnimation, {
			toValue: 1,
			useNativeDriver: true,
			tension: 300,
			friction: 12,
		}).start();
	};

	const handlePress = () => {
		if (disabled || loading) return;

		if (hapticFeedback) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		}

		onPress();
	};

	return (
		<Animated.View
			style={{
				transform: [{ scale: scaleAnimation }],
			}}
			className="mb-8"
		>
			<Pressable
				onPress={handlePress}
				onPressIn={handlePressIn}
				onPressOut={handlePressOut}
				disabled={disabled || loading}
				className={`${disabled ? 'opacity-50' : ''}`}
			>
				<View
					className="bg-white rounded-3xl overflow-hidden"
					style={{
						shadowColor: '#000',
						shadowOffset: {
							width: 0,
							height: 12,
						},
						shadowOpacity: 0.15,
						shadowRadius: 32,
						elevation: 20,
					}}
				>
					{/* Image Header */}
					{image && (
						<View className="relative h-72">
							<Image
								source={{ uri: image }}
								className="w-full h-full"
								resizeMode="cover"
							/>
							{/* Dark Overlay */}
							<View className="absolute inset-0 bg-black/60" />
							<LinearGradient
								colors={['transparent', 'rgba(0,0,0,0.7)']}
								locations={[0, 1]}
								className="absolute inset-0"
							/>

							{/* Badge */}
							{badge && (
								<View className="absolute top-5 right-5 bg-white rounded-full px-4 py-2">
									<ThemedText
										extraBold
										variant="body"
										className="text-gray-900 !text-sm "
									>
										{badge}
									</ThemedText>
								</View>
							)}

							{/* Title Overlay */}
							<View className="absolute bottom-6 left-6 right-6">
								<ThemedText
									variant="title-md"
									className="text-white mb-2 leading-tight"
									extraBold
								>
									{title}
								</ThemedText>
								<ThemedText
									variant="body"
									className="text-gray-100 text-base leading-6"
								>
									{description}
								</ThemedText>
							</View>

							{/* Icon Overlay */}
							<View
								className="absolute top-5 left-5 w-14 h-14 rounded-2xl items-center justify-center"
								style={{
									backgroundColor: 'rgba(255, 255, 255, 0.15)',
									borderWidth: 1,
									borderColor: 'rgba(255, 255, 255, 0.25)',
									shadowColor: '#000',
									shadowOffset: {
										width: 0,
										height: 4,
									},
									shadowOpacity: 0.25,
									shadowRadius: 8,
									elevation: 8,
								}}
							>
								<Octicons name={icon} size={28} color="white" />
							</View>
						</View>
					)}

					{/* Content - Only show if no image */}
					{!image && (
						<View className="p-8">
							<View className="flex-row items-center mb-4">
								<View className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl items-center justify-center mr-4">
									<Octicons name={icon} size={32} color="white" />
								</View>
								<View className="flex-1">
									<ThemedText
										variant="title-lg"
										className="text-gray-900 mb-2 leading-tight"
										extraBold
									>
										{title}
									</ThemedText>
									{badge && (
										<View className="bg-blue-100 rounded-full px-3 py-1 self-start">
											<ThemedText
												variant="body"
												className="text-blue-700 text-sm font-semibold"
											>
												{badge}
											</ThemedText>
										</View>
									)}
								</View>
							</View>

							<ThemedText
								variant="body"
								className="text-gray-600 text-base leading-7 mb-6"
							>
								{description}
							</ThemedText>

							{/* Action Button */}
							{showButton && (
								<LinearGradient
									colors={['#3B82F6', '#8B5CF6']}
									start={{ x: 0, y: 0 }}
									end={{ x: 1, y: 0 }}
									className="rounded-2xl p-5 items-center shadow-lg"
								>
									<ThemedText
										variant="body"
										className="text-white font-bold text-lg"
									>
										{buttonText}
									</ThemedText>
								</LinearGradient>
							)}
						</View>
					)}
				</View>
			</Pressable>
		</Animated.View>
	);
}
