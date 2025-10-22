import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CustomTabBarProps {
	activeTab: 'home' | 'analytics' | 'settings';
	onTabPress: (tab: 'home' | 'analytics' | 'settings') => void;
}

export function CustomTabBar({ activeTab, onTabPress }: CustomTabBarProps) {
	const insets = useSafeAreaInsets();
	const screenWidth = Dimensions.get('window').width;
	const tabWidth = screenWidth / 3;

	// Animation values
	const slideAnimation = useRef(new Animated.Value(0)).current;
	const scaleAnimation = useRef(new Animated.Value(1)).current;
	const previousTab = useRef<'home' | 'analytics' | 'settings' | null>(null);

	// Get tab index for animation calculations
	const getTabIndex = (tab: 'home' | 'analytics' | 'settings') => {
		switch (tab) {
			case 'home':
				return 0;
			case 'analytics':
				return 1;
			case 'settings':
				return 2;
			default:
				return 0;
		}
	};

	// Get slide direction based on tab positions
	const getSlideDirection = (
		fromTab: 'home' | 'analytics' | 'settings' | null,
		toTab: 'home' | 'analytics' | 'settings'
	) => {
		if (!fromTab) return 'right'; // Default direction for initial load

		const fromIndex = getTabIndex(fromTab);
		const toIndex = getTabIndex(toTab);

		// Moving right: slide from left to right
		// Moving left: slide from right to left
		return toIndex > fromIndex ? 'right' : 'left';
	};

	// Animate tab change
	useEffect(() => {
		const currentIndex = getTabIndex(activeTab);
		const targetPosition = currentIndex * tabWidth;
		const slideDirection = getSlideDirection(previousTab.current, activeTab);

		// Reset scale and position for slide effect
		scaleAnimation.setValue(0.8);

		// Calculate start position based on direction
		const startOffset = tabWidth * 0.4;
		let startPosition;

		if (slideDirection === 'right') {
			// Moving right: start from left of target, slide right
			startPosition = targetPosition - startOffset;
		} else {
			// Moving left: start from right of target, slide left
			startPosition = targetPosition + startOffset;
		}

		slideAnimation.setValue(startPosition);

		// Animate to final position
		Animated.parallel([
			Animated.timing(slideAnimation, {
				toValue: targetPosition,
				duration: 300,
				useNativeDriver: true,
			}),
			Animated.spring(scaleAnimation, {
				toValue: 1,
				tension: 100,
				friction: 8,
				useNativeDriver: true,
			}),
		]).start();

		previousTab.current = activeTab;
	}, [activeTab, tabWidth, slideAnimation, scaleAnimation]);

	const handleTabPress = (tab: 'home' | 'analytics' | 'settings') => {
		onTabPress(tab);
	};

	return (
		<View className="bg-primary" style={{ paddingBottom: insets.bottom }}>
			<View className="flex-row relative">
				{/* Animated sliding indicator */}
				<Animated.View
					className="absolute top-0 left-0 bg-white/20 rounded-full"
					style={{
						width: 80,
						height: 80,
						transform: [{ translateX: slideAnimation }, { scale: scaleAnimation }],
						marginLeft: (tabWidth - 80) / 2,
						marginTop: 4,
					}}
				/>

				{/* Home Tab */}
				<TouchableOpacity
					className="flex-1 flex-col items-center justify-center py-4"
					onPress={() => handleTabPress('home')}
					activeOpacity={0.7}
				>
					<View className="p-4 rounded-full">
						<Ionicons
							name={activeTab === 'home' ? 'grid' : 'grid-outline'}
							size={32}
							color={activeTab === 'home' ? 'white' : '#d1d5db'}
						/>
					</View>
				</TouchableOpacity>

				{/* Analytics Tab */}
				<TouchableOpacity
					className="flex-1 flex-col items-center justify-center py-4"
					onPress={() => handleTabPress('analytics')}
					activeOpacity={0.7}
				>
					<View className="p-4 rounded-full">
						<Ionicons
							name={activeTab === 'analytics' ? 'pie-chart' : 'pie-chart-outline'}
							size={32}
							color={activeTab === 'analytics' ? 'white' : '#d1d5db'}
						/>
					</View>
				</TouchableOpacity>

				{/* Settings Tab */}
				<TouchableOpacity
					className="flex-1 flex-col items-center justify-center py-4"
					onPress={() => handleTabPress('settings')}
					activeOpacity={0.7}
				>
					<View className="p-4 rounded-full">
						<Ionicons
							name={activeTab === 'settings' ? 'settings' : 'settings-outline'}
							size={32}
							color={activeTab === 'settings' ? 'white' : '#d1d5db'}
						/>
					</View>
				</TouchableOpacity>
			</View>
		</View>
	);
}
