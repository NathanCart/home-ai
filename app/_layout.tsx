import { Stack } from 'expo-router';
import { useEffect } from 'react';
import '../global.css';

import { useFonts } from '@expo-google-fonts/montserrat';
import { Montserrat_100Thin } from '@expo-google-fonts/montserrat/100Thin';
import { Montserrat_100Thin_Italic } from '@expo-google-fonts/montserrat/100Thin_Italic';
import { Montserrat_200ExtraLight } from '@expo-google-fonts/montserrat/200ExtraLight';
import { Montserrat_200ExtraLight_Italic } from '@expo-google-fonts/montserrat/200ExtraLight_Italic';
import { Montserrat_300Light } from '@expo-google-fonts/montserrat/300Light';
import { Montserrat_300Light_Italic } from '@expo-google-fonts/montserrat/300Light_Italic';
import { Montserrat_400Regular } from '@expo-google-fonts/montserrat/400Regular';
import { Montserrat_400Regular_Italic } from '@expo-google-fonts/montserrat/400Regular_Italic';
import { Montserrat_500Medium } from '@expo-google-fonts/montserrat/500Medium';
import { Montserrat_500Medium_Italic } from '@expo-google-fonts/montserrat/500Medium_Italic';
import { Montserrat_600SemiBold } from '@expo-google-fonts/montserrat/600SemiBold';
import { Montserrat_600SemiBold_Italic } from '@expo-google-fonts/montserrat/600SemiBold_Italic';
import { Montserrat_700Bold } from '@expo-google-fonts/montserrat/700Bold';
import { Montserrat_700Bold_Italic } from '@expo-google-fonts/montserrat/700Bold_Italic';
import { Montserrat_800ExtraBold } from '@expo-google-fonts/montserrat/800ExtraBold';
import { Montserrat_800ExtraBold_Italic } from '@expo-google-fonts/montserrat/800ExtraBold_Italic';
import { Montserrat_900Black } from '@expo-google-fonts/montserrat/900Black';
import { Montserrat_900Black_Italic } from '@expo-google-fonts/montserrat/900Black_Italic';
import { useRevenuecat } from 'components/useRevenueCat';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useOnboarding } from 'components/useOnboarding';
import mobileAds from 'react-native-google-mobile-ads';

export default function RootLayout() {
	const { initializeRevenueCat } = useRevenuecat();
	const { isLoading } = useOnboarding();
	const [fontsLoaded] = useFonts({
		Montserrat_100Thin,
		Montserrat_200ExtraLight,
		Montserrat_300Light,
		Montserrat_400Regular,
		Montserrat_500Medium,
		Montserrat_600SemiBold,
		Montserrat_700Bold,
		Montserrat_800ExtraBold,
		Montserrat_900Black,
		Montserrat_100Thin_Italic,
		Montserrat_200ExtraLight_Italic,
		Montserrat_300Light_Italic,
		Montserrat_400Regular_Italic,
		Montserrat_500Medium_Italic,
		Montserrat_600SemiBold_Italic,
		Montserrat_700Bold_Italic,
		Montserrat_800ExtraBold_Italic,
		Montserrat_900Black_Italic,
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
