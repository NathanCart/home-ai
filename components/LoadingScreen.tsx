import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { ThemedText } from './ThemedText';

interface LoadingScreenProps {
	message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
	return (
		<View className="flex-1 justify-center items-center bg-white">
			<ActivityIndicator size="large" color="#111827" />
		</View>
	);
}
