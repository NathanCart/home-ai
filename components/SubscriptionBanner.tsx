import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View, Animated } from 'react-native';
import { ThemedText } from './ThemedText';
import { useRevenuecat } from './useRevenueCat';
import { useEffect, useRef } from 'react';

interface SubscriptionBannerProps {
	onDismiss?: () => void;
}

export function SubscriptionBanner({ onDismiss }: SubscriptionBannerProps) {
	const { presentPaywallIfNeeded } = useRevenuecat();
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const scaleAnim = useRef(new Animated.Value(0.95)).current;
	const pulseAnim = useRef(new Animated.Value(1)).current;

	useEffect(() => {
		// Animate banner in
		Animated.parallel([
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 500,
				useNativeDriver: true,
			}),
			Animated.spring(scaleAnim, {
				toValue: 1,
				tension: 100,
				friction: 8,
				useNativeDriver: true,
			}),
		]).start();

		// Start pulsing animation for star icon
		const startPulse = () => {
			Animated.sequence([
				Animated.timing(pulseAnim, {
					toValue: 1.2,
					duration: 1000,
					useNativeDriver: true,
				}),
				Animated.timing(pulseAnim, {
					toValue: 1,
					duration: 1000,
					useNativeDriver: true,
				}),
			]).start(() => startPulse());
		};

		// Start pulsing after banner animation
		const pulseTimeout = setTimeout(startPulse, 500);
		return () => clearTimeout(pulseTimeout);
	}, [fadeAnim, scaleAnim, pulseAnim]);

	const handleUpgrade = async () => {
		try {
			await presentPaywallIfNeeded();
		} catch (error) {
			console.error('Error presenting paywall:', error);
		}
	};

	return (
		<Animated.View
			className="mx-4 mb-4 rounded-2xl overflow-hidden !mt-4 bg-primary/80"
			style={{
				opacity: fadeAnim,
				transform: [{ scale: scaleAnim }],
			}}
		>
			<View className="p-4">
				<View className="flex-col flex gap-2">
					{/* Left side - Content */}
					<View className="">
						<View className="flex-row items-center gap-2 mb-2">
							<Animated.View
								style={{
									transform: [{ scale: pulseAnim }],
								}}
							>
								<Ionicons name="star" size={20} color="white" />
							</Animated.View>
							<ThemedText extraBold className="text-white text-lg">
								GO PREMIUM
							</ThemedText>
						</View>
						<ThemedText
							className="text-white text-sm leading-5"
							style={{ opacity: 0.9 }}
						>
							Unlimited swiping sessions • No ads • Premium features
						</ThemedText>
					</View>

					{onDismiss && (
						<TouchableOpacity
							onPress={onDismiss}
							style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
							className="p-2 absolute top-0 right-0 rounded-full"
						>
							<Ionicons name="close" size={16} color="white" />
						</TouchableOpacity>
					)}

					{/* Right side - Actions */}
					<View className="flex-row items-center gap-2">
						<TouchableOpacity
							onPress={handleUpgrade}
							style={{ backgroundColor: 'white' }}
							className="px-4 py-2 rounded-xl flex-row items-center gap-2 w-full"
						>
							<Ionicons name="arrow-forward" size={16} color="#3b82f6" />
							<ThemedText extraBold className="text-primary text-sm">
								UPGRADE
							</ThemedText>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</Animated.View>
	);
}
