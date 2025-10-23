import { Stack } from 'expo-router';
import { useEffect } from 'react';
import '../global.css';

import { useFonts } from '@expo-google-fonts/orbitron';
import { Urbanist_400Regular } from '@expo-google-fonts/urbanist/400Regular';
import { Urbanist_700Bold } from '@expo-google-fonts/urbanist/700Bold';
import { Urbanist_800ExtraBold } from '@expo-google-fonts/urbanist/800ExtraBold';
import { useRevenuecat } from 'components/useRevenueCat';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useOnboarding } from 'components/useOnboarding';
import mobileAds from 'react-native-google-mobile-ads';

export default function RootLayout() {
	const { initializeRevenueCat } = useRevenuecat();
	const { isLoading } = useOnboarding();
	const [fontsLoaded] = useFonts({
		Urbanist_400Regular,
		Urbanist_700Bold,
		Urbanist_800ExtraBold,
	});

	useEffect(() => {
		if (fontsLoaded) {
			initializeRevenueCat();
			// Initialize AdMob
			console.log('=== INITIALIZING ADMOB ===');
			mobileAds()
				.initialize()
				.then(() => {
					console.log('✅ AdMob initialized successfully');
				})
				.catch((error) => {
					console.error('❌ AdMob initialization failed:', error);
				});
		}
	}, [fontsLoaded, initializeRevenueCat]);

	if (!fontsLoaded || isLoading) {
		return null; // or a loading screen
	}

	return (
		<SafeAreaProvider>
			<GestureHandlerRootView style={{ flex: 1 }}>
				<Stack
					screenOptions={{
						headerShown: false,
						contentStyle: { backgroundColor: 'white' },
						animationDuration: 250,
					}}
				>
					<Stack.Screen
						name="onboarding"
						options={{
							animation: 'fade',
							animationDuration: 300,
						}}
					/>
				</Stack>
			</GestureHandlerRootView>
		</SafeAreaProvider>
	);
}
