import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, TouchableOpacity, View, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from './ThemedText';
import { useRevenuecat } from './useRevenueCat';
import { useEffect, useRef } from 'react';

interface AdPromptOverlayProps {
	visible: boolean;
	onWatchAd: () => void;
	onSkip: () => void;
	isLoading: boolean;
	sessionCount: number;
	hasError?: boolean;
	onContinue?: () => void;
}

export function AdPromptOverlay({
	visible,
	onWatchAd,
	onSkip,
	isLoading,
	sessionCount,
	hasError = false,
	onContinue,
}: AdPromptOverlayProps) {
	const insets = useSafeAreaInsets();
	const { presentPaywallIfNeeded } = useRevenuecat();
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const scaleAnim = useRef(new Animated.Value(0.8)).current;

	// Auto-continue after showing error message
	useEffect(() => {
		if (hasError && onContinue) {
			const timer = setTimeout(() => {
				onContinue();
			}, 3000); // Show message for 3 seconds then continue
			return () => clearTimeout(timer);
		}
	}, [hasError, onContinue]);

	// Animate in when visible
	useEffect(() => {
		if (visible) {
			Animated.parallel([
				Animated.timing(fadeAnim, {
					toValue: 1,
					duration: 300,
					useNativeDriver: true,
				}),
				Animated.spring(scaleAnim, {
					toValue: 1,
					tension: 100,
					friction: 8,
					useNativeDriver: true,
				}),
			]).start();
		}
	}, [visible, fadeAnim, scaleAnim]);

	if (!visible) return null;

	return (
		<View
			className="absolute inset-0 bg-black/50 justify-center items-center px-6 z-[9999]"
			style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
		>
			<Animated.View
				className="bg-white rounded-3xl p-8 items-center w-full max-w-sm"
				style={{
					shadowColor: '#199dfe',
					shadowOffset: { width: 0, height: 4 },
					shadowOpacity: 0.3,
					shadowRadius: 8,
					opacity: fadeAnim,
					transform: [{ scale: scaleAnim }],
				}}
			>
				{/* Icon */}
				<View
					className={`rounded-full p-4 mb-6 ${hasError ? 'bg-orange-100' : 'bg-primary/10'}`}
				>
					<Ionicons
						name={hasError ? 'warning' : 'play-circle'}
						size={48}
						color={hasError ? '#f59e0b' : '#3b82f6'}
					/>
				</View>

				{/* Title */}
				<ThemedText variant="title-lg" extraBold className="text-gray-800 text-center mb-2">
					{hasError ? 'No Ads Available' : 'Watch an Ad to Continue'}
				</ThemedText>

				{/* Description */}
				<ThemedText variant="body" className="text-gray-600 text-center mb-6 leading-6">
					{hasError
						? "We couldn't load an ad right now. Don't worry, we'll continue your session anyway!"
						: isLoading
							? 'Loading your ad... Please wait while we prepare the video.'
							: "You've used your free session for today. Watch a short video ad to continue swiping."}
				</ThemedText>

				{/* Session Info */}
				{!hasError && (
					<View className="bg-gray-100 rounded-2xl px-4 py-3 mb-6 w-full">
						<View className="flex-row items-center justify-center gap-2">
							<Ionicons name="refresh" size={20} color="#6b7280" />
							<ThemedText variant="body" className="text-gray-700 font-medium">
								Watch ad to continue
							</ThemedText>
						</View>
					</View>
				)}

				{/* Countdown for error state */}
				{hasError && (
					<View className="bg-orange-100 rounded-2xl px-4 py-3 mb-6 w-full">
						<View className="flex-row items-center justify-center gap-2">
							<ActivityIndicator size="small" color="#f59e0b" />
							<ThemedText variant="body" className="text-orange-800 font-medium">
								Continuing in 3 seconds...
							</ThemedText>
						</View>
					</View>
				)}

				{/* Buttons - only show if not error state */}
				{!hasError && (
					<>
						<View className="flex-row gap-4 w-full">
							<TouchableOpacity
								onPress={onSkip}
								className="flex-1 bg-gray-200 py-4 rounded-xl"
								disabled={isLoading}
							>
								<ThemedText
									extraBold
									className={`text-center ${isLoading ? 'text-gray-400' : 'text-gray-700'}`}
								>
									Maybe Later
								</ThemedText>
							</TouchableOpacity>

							<TouchableOpacity
								onPress={onWatchAd}
								className="flex-1 bg-primary py-4 rounded-xl flex-row items-center justify-center gap-2"
								disabled={isLoading}
							>
								{isLoading ? (
									<>
										<ActivityIndicator size="small" color="white" />
										<ThemedText extraBold className="text-white">
											{isLoading ? 'Loading Ad...' : 'Showing Ad...'}
										</ThemedText>
									</>
								) : (
									<>
										<Ionicons name="play" size={20} color="white" />
										<ThemedText extraBold className="text-white">
											Watch Ad
										</ThemedText>
									</>
								)}
							</TouchableOpacity>
						</View>

						{/* Premium Option */}
						<TouchableOpacity
							onPress={() => {
								presentPaywallIfNeeded();
							}}
							className="mt-4"
						>
							<ThemedText variant="body" className="text-primary font-medium">
								Go Premium to skip ads
							</ThemedText>
						</TouchableOpacity>
					</>
				)}
			</Animated.View>
		</View>
	);
}
