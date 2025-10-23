import React from 'react';
import { View, TouchableOpacity, Modal, ScrollView, Image } from 'react-native';
import { Octicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { CustomButton } from 'components/CustomButton';

interface PhotoTipsModalProps {
	visible: boolean;
	onClose: () => void;
}

export function PhotoTipsModal({ visible, onClose }: PhotoTipsModalProps) {
	const insets = useSafeAreaInsets();

	const handleClose = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		onClose();
	};

	const tips = [
		{
			icon: 'light-bulb',
			title: 'Good Lighting',
			description: 'Use natural light when possible, or ensure the room is well-lit',
		},
		{
			icon: 'device-camera',
			title: 'Clear View',
			description: 'Make sure the entire room is visible and not obstructed',
		},
		{
			icon: 'zoom-in',
			title: 'High Quality',
			description: 'Take photos in high resolution for better AI analysis',
		},
		{
			icon: 'home',
			title: 'Clean Space',
			description: 'Remove clutter for a cleaner, more accurate design',
		},
	];

	return (
		<Modal
			visible={visible}
			animationType="slide"
			presentationStyle="pageSheet"
			onRequestClose={handleClose}
		>
			<View className="flex-1 bg-gray-50">
				{/* Header */}
				<View className="flex-row items-center justify-center px-6 py-5 border-b-2 border-gray-100">
					<ThemedText variant="title-md" className="text-gray-900 text-center">
						For the best results
					</ThemedText>
				</View>

				{/* Content */}
				<ScrollView className="flex-1 px-6 py-6" showsVerticalScrollIndicator={false}>
					<View className="mb-6">
						<ThemedText variant="body" className="text-gray-600 leading-6">
							Follow these tips to get the best results from your AI interior design
						</ThemedText>
					</View>

					{tips.map((tip, index) => (
						<View key={index} className="flex-row items-start mb-6">
							<View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mr-4 flex-shrink-0">
								<Octicons name={tip.icon as any} size={20} color="#111827" />
							</View>
							<View className="flex-1">
								<ThemedText
									variant="body"
									bold
									className="text-gray-900 font-semibold"
								>
									{tip.title}
								</ThemedText>
								<ThemedText variant="body" className="text-gray-600 leading-5">
									{tip.description}
								</ThemedText>
							</View>
						</View>
					))}

					{/* Example Images Section */}
					<View className="mt-8" style={{ paddingBottom: insets.bottom }}>
						<ThemedText variant="title-md" className="text-gray-900 font-semibold mb-4">
							Examples
						</ThemedText>

						{/* Good Example */}
						<View className="mb-6">
							<View className="flex-row items-center mb-3">
								<Octicons name="check-circle-fill" size={20} color="#166534" />
								<ThemedText
									variant="body"
									className="text-green-800 font-medium ml-2"
								>
									Good Example
								</ThemedText>
							</View>
							<Image
								source={{
									uri: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
								}}
								className="w-full h-60 rounded-2xl"
								resizeMode="cover"
							/>
							<ThemedText variant="body" className="text-gray-600 text-sm mt-2">
								Well-lit, clean living room with clear view of furniture and layout
							</ThemedText>
						</View>

						{/* Bad Example */}
						<View className="mb-6">
							<View className="flex-row items-center mb-3">
								<Octicons name="x-circle-fill" size={20} color="#dc2626" />
								<ThemedText
									variant="body"
									className="text-red-600 font-medium ml-2"
								>
									Bad Example
								</ThemedText>
							</View>
							<Image
								source={{
									uri: 'https://images.unsplash.com/photo-1724281946137-c637f58ecbdc?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
								}}
								className="w-full h-60 rounded-2xl"
								resizeMode="cover"
							/>
							<ThemedText variant="body" className="text-gray-600 text-sm mt-2">
								Poor lighting, cluttered space, and obstructed view of the room
							</ThemedText>
						</View>

						<CustomButton
							title="Lets go!"
							onPress={handleClose}
							variant="primary"
							size="lg"
							className="w-full mt-2"
						/>
					</View>
				</ScrollView>
			</View>
		</Modal>
	);
}
