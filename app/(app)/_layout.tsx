import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useRef } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CustomTabBar } from '../../components/CustomTabBar';

import { useOnboarding } from 'components/useOnboarding';
import { useRevenuecat } from 'components/useRevenueCat';

export default function RootLayout() {
	const pathname = usePathname();
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<'home' | 'analytics' | 'settings'>('home');
	const [screenAnimation, setScreenAnimation] = useState<
		'fade' | 'slide_from_left' | 'slide_from_right'
	>('fade');
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
		if (!fromTab) return 'fade'; // Default to fade for initial load

		const fromIndex = getTabIndex(fromTab);
		const toIndex = getTabIndex(toTab);

		// Moving right: slide from left to right
		// Moving left: slide from right to left
		return toIndex > fromIndex ? 'slide_from_right' : 'slide_from_left';
	};

	// Check if current route is onboarding (no tab bar)
	const isOnboardingRoute = pathname.startsWith('/onboarding');
	const { presentPaywallIfNeeded, isInitialized, initializeRevenueCat } = useRevenuecat();
	const { hasCompletedOnboarding } = useOnboarding();

	useEffect(() => {
		// Only trigger paywall if user has completed onboarding and is actually in tabs
		if (hasCompletedOnboarding) {
			(async () => {
				await presentPaywallIfNeeded();
			})();
		}
	}, [hasCompletedOnboarding]);

	// Update active tab based on current route
	useEffect(() => {
		if (pathname === '/') {
			setActiveTab('home');
		} else if (pathname === '/analytics') {
			setActiveTab('analytics');
		} else if (pathname === '/settings') {
			setActiveTab('settings');
		}
	}, [pathname]);

	const handleTabPress = (tab: 'home' | 'analytics' | 'settings') => {
		if (tab === activeTab) return; // Don't navigate if already on the tab

		// Store previous tab for animation direction
		previousTab.current = activeTab;

		// Set animation direction based on tab movement
		const animation = getSlideDirection(previousTab.current, tab);
		setScreenAnimation(animation);

		setActiveTab(tab);

		if (tab === 'home') {
			router.replace('/');
		} else if (tab === 'analytics') {
			router.replace('/analytics');
		} else if (tab === 'settings') {
			router.replace('/settings');
		}
	};

	return (
		<SafeAreaProvider>
			<GestureHandlerRootView style={{ flex: 1 }}>
				<View style={{ flex: 1 }}>
					<View style={{ flex: 1 }}>
						<Stack
							screenOptions={{
								headerShown: false,
								contentStyle: { backgroundColor: 'white' },
								animationDuration: 250,
							}}
						>
							<Stack.Screen
								name="index"
								options={{
									animation: screenAnimation,
								}}
							/>

							<Stack.Screen
								name="settings"
								options={{
									animation: screenAnimation,
								}}
							/>
							<Stack.Screen
								name="analytics"
								options={{
									animation: screenAnimation,
								}}
							/>
							<Stack.Screen
								name="swipe"
								options={{
									animation: 'slide_from_left',
								}}
							/>
							<Stack.Screen
								name="duplicates"
								options={{
									animation: 'slide_from_right',
								}}
							/>
							<Stack.Screen
								name="gallery"
								options={{
									animation: 'slide_from_right',
								}}
							/>
							<Stack.Screen
								name="settings/notifications"
								options={{
									animation: 'slide_from_right',
								}}
							/>
							<Stack.Screen
								name="settings/privacy"
								options={{
									animation: 'slide_from_right',
								}}
							/>
							<Stack.Screen
								name="settings/storage"
								options={{
									animation: 'slide_from_right',
								}}
							/>
							<Stack.Screen
								name="settings/about"
								options={{
									animation: 'slide_from_right',
								}}
							/>
							<Stack.Screen
								name="settings/support"
								options={{
									animation: 'slide_from_right',
								}}
							/>
							<Stack.Screen
								name="onboarding"
								options={{
									animation: 'fade',
								}}
							/>
							<Stack.Screen
								name="onboarding/index"
								options={{
									animation: 'fade',
								}}
							/>
							<Stack.Screen
								name="onboarding/step1"
								options={{
									animation: 'fade',
								}}
							/>
							<Stack.Screen
								name="onboarding/step2"
								options={{
									animation: 'slide_from_right',
								}}
							/>
							<Stack.Screen
								name="onboarding/step3"
								options={{
									animation: 'slide_from_right',
								}}
							/>
						</Stack>
					</View>
					{!isOnboardingRoute && (
						<CustomTabBar activeTab={activeTab} onTabPress={handleTabPress} />
					)}
				</View>
				<StatusBar style="auto" />
			</GestureHandlerRootView>
		</SafeAreaProvider>
	);
}
