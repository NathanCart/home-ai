import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Octicons from '@expo/vector-icons/Octicons';
import { ThemedText } from './ThemedText';
import * as Haptics from 'expo-haptics';

interface CustomTabBarProps {
	activeTab: 'home' | 'explore' | 'projects';
	onTabPress: (tab: 'home' | 'explore' | 'projects') => void;
}

export function CustomTabBar({ activeTab, onTabPress }: CustomTabBarProps) {
	const insets = useSafeAreaInsets();
	const screenWidth = Dimensions.get('window').width;
	const tabWidth = screenWidth / 3;

	// Animation values
	const slideAnimation = useRef(new Animated.Value(0)).current;
	const scaleAnimation = useRef(new Animated.Value(1)).current;
	const previousTab = useRef<'home' | 'explore' | 'projects' | null>(null);

	// Individual tab scale animations
	const homeScaleAnimation = useRef(new Animated.Value(1)).current;
	const exploreScaleAnimation = useRef(new Animated.Value(1)).current;
	const projectsScaleAnimation = useRef(new Animated.Value(1)).current;

	// Get tab index for animation calculations
	const getTabIndex = (tab: 'home' | 'explore' | 'projects') => {
		switch (tab) {
			case 'home':
				return 0;
			case 'explore':
				return 1;
			case 'projects':
				return 2;
			default:
				return 0;
		}
	};

	// Get slide direction based on tab positions
	const getSlideDirection = (
		fromTab: 'home' | 'explore' | 'projects' | null,
		toTab: 'home' | 'explore' | 'projects'
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

	// Press animation functions
	const handlePressIn = (scaleAnimation: Animated.Value) => {
		Animated.spring(scaleAnimation, {
			toValue: 0.9,
			useNativeDriver: true,
			tension: 300,
			friction: 10,
		}).start();
	};

	const handlePressOut = (scaleAnimation: Animated.Value) => {
		Animated.spring(scaleAnimation, {
			toValue: 1,
			useNativeDriver: true,
			tension: 300,
			friction: 10,
		}).start();
	};

	const handleTabPress = (tab: 'home' | 'explore' | 'projects') => {
		// Haptic feedback
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		onTabPress(tab);
	};

	return (
		<View
			className="bg-gray-50 border-t-2 border-gray-100"
			style={{ paddingBottom: insets.bottom }}
		>
			<View className="flex-row relative">
				{/* Animated sliding indicator */}
				<Animated.View
					className="absolute top-0 left-0  rounded-full"
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
					className="flex-1 flex-col items-center justify-center "
					onPress={() => handleTabPress('home')}
					onPressIn={() => handlePressIn(homeScaleAnimation)}
					onPressOut={() => handlePressOut(homeScaleAnimation)}
					activeOpacity={1}
				>
					<Animated.View
						className="p-4 rounded-full items-center justify-center"
						style={{ transform: [{ scale: homeScaleAnimation }] }}
					>
						<Octicons
							name="home-fill"
							className={activeTab === 'home' ? 'opacity-100' : 'opacity-60'}
							size={28}
							color={'#111827'}
						/>
						<ThemedText
							variant="body"
							className={`${activeTab === 'home' ? 'opacity-100' : 'opacity-60'} text-gray-900 !text-base mt-1`}
						>
							Generate
						</ThemedText>
					</Animated.View>
				</TouchableOpacity>

				{/* Analytics Tab */}
				<TouchableOpacity
					className="flex-1 flex-col items-center justify-center "
					onPress={() => handleTabPress('explore')}
					onPressIn={() => handlePressIn(exploreScaleAnimation)}
					onPressOut={() => handlePressOut(exploreScaleAnimation)}
					activeOpacity={1}
				>
					<Animated.View
						className="p-4 rounded-full items-center justify-center"
						style={{ transform: [{ scale: exploreScaleAnimation }] }}
					>
						<Octicons
							name="sparkles-fill"
							className={activeTab === 'explore' ? 'opacity-100' : 'opacity-60'}
							size={28}
							color={'#111827'}
						/>
						<ThemedText
							variant="body"
							className={`${activeTab === 'explore' ? 'opacity-100' : 'opacity-60'} text-gray-900 !text-base mt-1 ml-1`}
						>
							Explore
						</ThemedText>
					</Animated.View>
				</TouchableOpacity>

				{/* Settings Tab */}
				<TouchableOpacity
					className="flex-1 flex-col items-center justify-center "
					onPress={() => handleTabPress('projects')}
					onPressIn={() => handlePressIn(projectsScaleAnimation)}
					onPressOut={() => handlePressOut(projectsScaleAnimation)}
					activeOpacity={1}
				>
					<Animated.View
						className="p-4 rounded-full items-center justify-center"
						style={{ transform: [{ scale: projectsScaleAnimation }] }}
					>
						<Octicons
							name="bookmark-filled"
							className={activeTab === 'projects' ? 'opacity-100' : 'opacity-60'}
							size={28}
							color={'#111827'}
						/>
						<ThemedText
							variant="body"
							className={`${activeTab === 'projects' ? 'opacity-100' : 'opacity-60'} text-gray-900 !text-base mt-1`}
						>
							Projects
						</ThemedText>
					</Animated.View>
				</TouchableOpacity>
			</View>
		</View>
	);
}
