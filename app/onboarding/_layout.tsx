import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CustomTabBar } from '../../components/CustomTabBar';

import { useOnboarding } from 'components/useOnboarding';
import { useRevenuecat } from 'components/useRevenueCat';

export default function OnboardingLayout() {
	return (
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
					animation: 'slide_from_left',
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
	);
}
