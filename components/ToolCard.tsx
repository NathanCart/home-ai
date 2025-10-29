import React, { useRef } from 'react';
import {
	View,
	TouchableOpacity,
	Animated,
	Pressable,
	Image,
	useWindowDimensions,
} from 'react-native';
import { Octicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ThemedText } from './ThemedText';
import { CustomButton } from './CustomButton';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

interface ToolCardProps {
	title: string;
	description: string;
	icon?: keyof typeof Octicons.glyphMap;
	materialIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
	onPress: () => void;
	image?: string;
	originalImage?: string; // Before image for animation
	sharedAnimation?: Animated.Value; // Shared animation for before/after reveal
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
	materialIcon,
	onPress,
	image,
	originalImage,
	sharedAnimation,
	gradient = 'from-blue-500 to-purple-600',
	iconColor = '#ffffff',
	badge,
	disabled = false,
	loading = false,
	hapticFeedback = true,
	showButton = true,
	buttonText = 'Try it!',
}: ToolCardProps) {
	// Determine which icon to use
	const IconComponent = materialIcon ? MaterialCommunityIcons : Octicons;
	const iconName = materialIcon || icon;
	const scaleAnimation = useRef(new Animated.Value(1)).current;
	const { width: screenWidth } = useWindowDimensions();
	const cardWidth = screenWidth - 48; // Account for px-6 padding (24px each side)

	// Before/After animation interpolations
	const hasBeforeAfterAnimation = originalImage && image && sharedAnimation;
	const revealPosition = hasBeforeAfterAnimation
		? sharedAnimation.interpolate({
				inputRange: [0, 1],
				outputRange: [0, cardWidth],
			})
		: undefined;

	const beforeLabelOpacity = hasBeforeAfterAnimation
		? sharedAnimation.interpolate({
				inputRange: [0, 0.25, 0.95],
				outputRange: [1, 0, 0],
			})
		: undefined;

	const afterLabelOpacity = hasBeforeAfterAnimation
		? sharedAnimation.interpolate({
				inputRange: [0, 0.5, 0.95],
				outputRange: [0, 0, 1],
			})
		: undefined;

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
			className=""
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
						<View className="relative h-60">
							{hasBeforeAfterAnimation &&
							revealPosition &&
							beforeLabelOpacity &&
							afterLabelOpacity ? (
								<>
									{/* Before Image (Full Width - Base Layer) */}
									<Image
										source={{ uri: originalImage! }}
										style={{
											width: '100%',
											height: '100%',
										}}
										resizeMode="cover"
									/>

									{/* After Image (Clipped by Width - Top Layer) */}
									<Animated.View
										style={{
											position: 'absolute',
											top: 0,
											left: 0,
											bottom: 0,
											width: revealPosition,
											overflow: 'hidden',
										}}
									>
										<Image
											source={{ uri: image }}
											style={{
												width: cardWidth,
												height: '100%',
											}}
											resizeMode="cover"
										/>
									</Animated.View>

									{/* Animated Divider Line */}
									<Animated.View
										style={{
											position: 'absolute',
											top: 0,
											bottom: 0,
											left: revealPosition,
											width: 2,
											backgroundColor: '#fff',
											shadowColor: '#000',
											shadowOffset: { width: 0, height: 0 },
											shadowOpacity: 0.3,
											shadowRadius: 4,
											elevation: 5,
										}}
									/>

									{/* Before Label */}
									<Animated.View
										style={{
											position: 'absolute',
											top: 8,
											right: 8,
											opacity: beforeLabelOpacity,
										}}
									>
										<View className="bg-gray-50 px-2 py-1 rounded-full">
											<ThemedText
												variant="body"
												className="text-gray-900 text-xs"
												bold
											>
												Before
											</ThemedText>
										</View>
									</Animated.View>

									{/* After Label */}
									<Animated.View
										style={{
											position: 'absolute',
											top: 8,
											right: 8,
											opacity: afterLabelOpacity,
										}}
									>
										<View className="bg-gray-50 px-2 py-1 rounded-full">
											<ThemedText
												variant="body"
												className="text-gray-900 text-xs"
												bold
											>
												After
											</ThemedText>
										</View>
									</Animated.View>
								</>
							) : (
								<Image
									source={{ uri: image }}
									className="w-full h-full"
									resizeMode="cover"
								/>
							)}
							{/* Dark Overlay */}
							<View className="absolute inset-0 bg-black/25" />
							<LinearGradient
								colors={['transparent', 'rgba(0,0,0,0.1)']}
								locations={[0, 1]}
								className="absolute inset-0"
							/>

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
							{iconName && (
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
									<IconComponent name={iconName as any} size={28} color="white" />
								</View>
							)}
						</View>
					)}

					{/* Content - Only show if no image */}
					{!image && (
						<View className="p-8">
							<View className="flex-row items-center mb-4">
								{iconName && (
									<View className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl items-center justify-center mr-4">
										<IconComponent
											name={iconName as any}
											size={32}
											color="white"
										/>
									</View>
								)}
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
