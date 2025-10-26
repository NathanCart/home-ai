import React, { useState } from 'react';
import { View, Image, TouchableOpacity, Share, Alert, ScrollView } from 'react-native';
import { ThemedText } from '../ThemedText';
import * as MediaLibrary from 'expo-media-library';
import { CustomButton } from '../CustomButton';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ConfirmationStepProps {
	imageUrl: string;
	room?: any;
	style?: any;
	palette?: any;
	onComplete: () => void;
	onRegenerate?: () => void;
	imageUri?: string | null;
	onSaveComplete?: () => void;
}

export function ConfirmationStep({
	imageUrl,
	room,
	style,
	palette,
	onComplete,
	onRegenerate,
	imageUri,
	onSaveComplete,
}: ConfirmationStepProps) {
	const handleSaveToGallery = async () => {
		try {
			// Request permissions
			const { status } = await MediaLibrary.requestPermissionsAsync();

			if (status !== 'granted') {
				Alert.alert(
					'Permission Required',
					'Please grant photo library access to save the image.'
				);
				return;
			}

			// Download and save the image
			const downloadResult = await fetch(imageUrl);
			const blob = await downloadResult.blob();
			const uri = URL.createObjectURL(blob);

			await MediaLibrary.saveToLibraryAsync(uri);

			Alert.alert('Success', 'Image saved to gallery!');
		} catch (error) {
			console.error('Error saving image:', error);
			Alert.alert('Error', 'Failed to save image to gallery.');
		}
	};

	const handleSaveToProjects = async () => {
		try {
			const { default: AsyncStorage } = await import(
				'@react-native-async-storage/async-storage'
			);

			const projectData = {
				imageUrl,
				room,
				style,
				palette,
				originalImage: imageUri,
				createdAt: new Date().toISOString(),
				type: 'ai-generated',
			};

			// Get existing projects
			const existingProjects = await AsyncStorage.getItem('projects');
			const projects = existingProjects ? JSON.parse(existingProjects) : [];

			// Add new project to the beginning
			projects.unshift(projectData);

			// Keep only the last 100 projects
			const trimmedProjects = projects.slice(0, 100);

			await AsyncStorage.setItem('projects', JSON.stringify(trimmedProjects));

			// Navigate to projects page after saving
			if (onSaveComplete) {
				onSaveComplete();
			}
		} catch (error) {
			console.error('Error saving to projects:', error);
			Alert.alert('Error', 'Failed to save project.');
		}
	};

	const handleShare = async () => {
		try {
			const result = await Share.share({
				message: 'Check out my AI-generated design!',
				url: imageUrl,
			});

			if (result.action === Share.sharedAction) {
				console.log('Shared successfully');
			}
		} catch (error) {
			console.error('Error sharing:', error);
			Alert.alert('Error', 'Failed to share image.');
		}
	};

	const [showComparison, setShowComparison] = useState(true);
	const roomName = room?.name || room?.label || '';
	const styleName = style?.name || style?.label || '';
	const hasOriginalImage = !!imageUri;
	const insets = useSafeAreaInsets();

	return (
		<View className="flex-1 bg-gray-50">
			<ScrollView
				className="flex-1"
				contentContainerStyle={{ paddingBottom: 20 }}
				showsVerticalScrollIndicator={false}
			>
				<View className="px-6">
					{/* Header */}
					<View className="mb-6">
						<View className="flex-row items-center justify-between mb-2">
							<ThemedText variant="title-lg" className="text-gray-900" extraBold>
								Your Design is Ready!
							</ThemedText>
							<TouchableOpacity onPress={onComplete}>
								<Ionicons name="close" size={28} color="#111827" />
							</TouchableOpacity>
						</View>
						{(roomName || styleName) && (
							<ThemedText variant="body" className="text-gray-600">
								{roomName && styleName
									? `${roomName} · ${styleName}`
									: roomName || styleName}
							</ThemedText>
						)}
					</View>

					{/* Comparison Toggle */}
					{hasOriginalImage && (
						<View className="flex-row mb-4 bg-white rounded-xl p-1 ">
							<TouchableOpacity
								onPress={() => setShowComparison(true)}
								className={`flex-1 py-3 rounded-lg ${showComparison ? 'bg-gray-900' : 'bg-transparent'}`}
							>
								<ThemedText
									variant="body"
									className={`text-center ${showComparison ? 'text-white' : 'text-gray-600'}`}
									extraBold={showComparison}
								>
									Comparison
								</ThemedText>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={() => setShowComparison(false)}
								className={`flex-1 py-3 rounded-lg ${!showComparison ? 'bg-gray-900' : 'bg-transparent'}`}
							>
								<ThemedText
									variant="body"
									className={`text-center ${!showComparison ? 'text-white' : 'text-gray-600'}`}
									extraBold={!showComparison}
								>
									After Only
								</ThemedText>
							</TouchableOpacity>
						</View>
					)}

					{/* Image Display */}
					<View style={{ height: 600 }}>
						{showComparison && hasOriginalImage ? (
							<View className="flex-1">
								{/* Before Image */}
								<View className="flex-1 mb-3">
									<View className="flex-row items-center mb-2">
										<View className="bg-gray-200 px-3 py-1 rounded-full">
											<ThemedText
												variant="body"
												className="text-gray-700 text-xs"
												extraBold
											>
												Before
											</ThemedText>
										</View>
									</View>
									<View className="flex-1 rounded-2xl overflow-hidden  bg-white">
										<Image
											source={{ uri: imageUri }}
											className="w-full h-full"
											resizeMode="cover"
										/>
									</View>
								</View>

								{/* After Image */}
								<View className="flex-1">
									<View className="flex-row items-center mb-2">
										<View className="bg-green-500 px-3 py-1 rounded-full">
											<ThemedText
												variant="body"
												className="text-white text-xs"
												extraBold
											>
												After
											</ThemedText>
										</View>
									</View>
									<View className="flex-1 rounded-2xl overflow-hidden  bg-white">
										<Image
											source={{ uri: imageUrl }}
											className="w-full h-full"
											resizeMode="cover"
										/>
									</View>
								</View>
							</View>
						) : (
							<View className="flex-1 rounded-2xl overflow-hidden  bg-white">
								<Image
									source={{ uri: imageUrl }}
									className="w-full h-full"
									resizeMode="cover"
								/>
							</View>
						)}
					</View>
				</View>
			</ScrollView>

			{/* Sticky Action Buttons */}
			<View
				className="px-6 pt-4 bg-gray-50 border-t border-gray-200"
				style={{ paddingBottom: insets.bottom + 16 }}
			>
				<View className="flex-row gap-2 mb-2">
					{onRegenerate && (
						<View className="flex-1">
							<CustomButton
								title="Regenerate"
								onPress={onRegenerate}
								icon="sync"
								variant="secondary"
								size="lg"
							/>
						</View>
					)}
					<View className="flex-1">
						<CustomButton
							title="Share"
							onPress={handleShare}
							icon="share"
							variant="secondary"
							size="lg"
						/>
					</View>
				</View>
				<CustomButton
					title="Save to Projects"
					onPress={handleSaveToProjects}
					icon="download"
					variant="primary"
					size="lg"
				/>
			</View>
		</View>
	);
}
