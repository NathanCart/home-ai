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
	const [activeTab, setActiveTab] = useState<'home' | 'explore' | 'projects'>('home');
	const [screenAnimation, setScreenAnimation] = useState<
		'fade' | 'slide_from_left' | 'slide_from_right'
	>('fade');
	const previousTab = useRef<'home' | 'explore' | 'projects' | null>(null);

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
		if (!fromTab) return 'fade'; // Default to fade for initial load

		const fromIndex = getTabIndex(fromTab);
		const toIndex = getTabIndex(toTab);

		// Moving right: slide from left to right
		// Moving left: slide from right to left
		return toIndex > fromIndex ? 'slide_from_right' : 'slide_from_left';
	};

	// Check if current route is onboarding or modal (no tab bar)
	const isOnboardingRoute = pathname.startsWith('/onboarding');
	const isModalRoute = pathname.includes('/generatemodal');
	const { presentPaywallIfNeeded, isInitialized, initializeRevenueCat } = useRevenuecat();
	const { hasCompletedOnboarding } = useOnboarding();

	useEffect(() => {
		// Only trigger paywall if user has completed onboarding and is actually in tabs
		if (hasCompletedOnboarding) {
			(async () => {
				// await presentPaywallIfNeeded();
			})();
		}
	}, [hasCompletedOnboarding]);

	// Update active tab based on current route
	useEffect(() => {
		if (pathname === '/') {
			setActiveTab('home');
		} else if (pathname === '/explore') {
			setActiveTab('explore');
		} else if (pathname === '/projects') {
			setActiveTab('projects');
		}
	}, [pathname]);

	const handleTabPress = (tab: 'home' | 'explore' | 'projects') => {
		if (tab === activeTab) return; // Don't navigate if already on the tab

		// Store previous tab for animation direction
		previousTab.current = activeTab;

		// Set animation direction based on tab movement
		const animation = getSlideDirection(previousTab.current, tab);
		setScreenAnimation(animation);

		setActiveTab(tab);

		if (tab === 'home') {
			router.replace('/');
		} else if (tab === 'explore') {
			router.replace('/explore');
		} else if (tab === 'projects') {
			router.replace('/projects');
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
								name="projects"
								options={{
									animation: screenAnimation,
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
							<Stack.Screen
								name="generatemodal"
								options={{
									presentation: 'fullScreenModal',
									animation: 'slide_from_bottom',
									headerShown: false,
								}}
							/>
							<Stack.Screen
								name="paintmodal"
								options={{
									presentation: 'fullScreenModal',
									animation: 'slide_from_bottom',
									headerShown: false,
								}}
							/>
							<Stack.Screen
								name="gardengeneratemodal"
								options={{
									presentation: 'fullScreenModal',
									animation: 'slide_from_bottom',
									headerShown: false,
								}}
							/>
							<Stack.Screen
								name="exteriorgeneratemodal"
								options={{
									presentation: 'fullScreenModal',
									animation: 'slide_from_bottom',
									headerShown: false,
								}}
							/>
							<Stack.Screen
								name="project/[slug]"
								options={{
									presentation: 'fullScreenModal',
									animation: 'slide_from_bottom',
									headerShown: false,
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
