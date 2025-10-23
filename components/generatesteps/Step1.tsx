import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Octicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';

interface Step1Props {
	onImageSelect?: () => void;
}

export function Step1({ onImageSelect }: Step1Props) {
	return (
		<View className="flex-1 px-6">
			<View className="items-center mb-4">
				<View className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl items-center justify-center mb-4">
					<Octicons name="device-camera" size={40} color="white" />
				</View>
				<ThemedText variant="title-lg" className="text-gray-900 mb-2 text-center" extraBold>
					Upload Your Photo
				</ThemedText>
				<ThemedText variant="body" className="text-gray-600 text-center leading-6">
					Take a photo or upload an existing image to get started
				</ThemedText>
			</View>

			<View className="flex-1 justify-start pt-4">
				<TouchableOpacity
					className="border-2 border-dashed border-gray-300 rounded-3xl p-12 items-center mb-6"
					onPress={onImageSelect}
				>
					<Octicons name="plus" size={48} color="#9CA3AF" />
					<ThemedText variant="body" className="text-gray-500 mt-4 text-center">
						Tap to upload photo
					</ThemedText>
					<ThemedText variant="body" className="text-gray-400 text-sm mt-2 text-center">
						JPG, PNG up to 10MB
					</ThemedText>
				</TouchableOpacity>

				<View className="bg-blue-50 rounded-2xl p-4">
					<ThemedText variant="body" className="text-blue-800 text-center">
						💡 Tip: Make sure your image is clear and well-lit for best results
					</ThemedText>
				</View>
			</View>
		</View>
	);
}
