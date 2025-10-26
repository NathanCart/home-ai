import React, { useState } from 'react';
import { View, Image, TouchableOpacity, Share, Alert, ScrollView } from 'react-native';
import { ThemedText } from 'components/ThemedText';
import * as MediaLibrary from 'expo-media-library';
import { CustomButton } from 'components/CustomButton';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Project {
	imageUrl: string;
	room?: any;
	style?: any;
	palette?: any;
	originalImage?: string;
	createdAt: string;
	type: string;
}

export default function ProjectDetailPage() {
	const insets = useSafeAreaInsets();
	const [project, setProject] = useState<Project | null>(null);

	// TODO: Load project data based on slug
	// For now, just render the ConfirmationStep-like UI

	const handleShare = async () => {
		if (!project?.imageUrl) return;

		try {
			const result = await Share.share({
				message: 'Check out my AI-generated design!',
				url: project.imageUrl,
			});

			if (result.action === Share.sharedAction) {
				console.log('Shared successfully');
			}
		} catch (error) {
			console.error('Error sharing:', error);
			Alert.alert('Error', 'Failed to share image.');
		}
	};

	const roomName = project?.room?.name || project?.room?.label || '';
	const styleName = project?.style?.name || project?.style?.label || '';
	const hasOriginalImage = !!project?.originalImage;

	return (
		<View className="flex-1 bg-gray-50">
			<ScrollView
				className="flex-1"
				contentContainerStyle={{ paddingBottom: 20 }}
				showsVerticalScrollIndicator={false}
			>
				<View className="px-6">
					{/* Header */}
					<View className="mb-6" style={{ marginTop: insets.top + 16 }}>
						<View className="flex-row items-center justify-between mb-2">
							<ThemedText variant="title-lg" className="text-gray-900" extraBold>
								{roomName || 'Design'}
							</ThemedText>
							<TouchableOpacity
								onPress={() => {
									/* Navigate back */
								}}
							>
								<Ionicons name="close" size={28} color="#111827" />
							</TouchableOpacity>
						</View>
						{styleName && (
							<ThemedText variant="body" className="text-gray-600">
								{styleName}
							</ThemedText>
						)}
					</View>

					{/* Placeholder content - will show generated image */}
					<View style={{ height: 450 }}>
						<View className="flex-1 rounded-2xl overflow-hidden bg-gray-200 items-center justify-center">
							<ThemedText className="text-gray-500">Project Detail</ThemedText>
						</View>
					</View>
				</View>
			</ScrollView>

			{/* Sticky Action Buttons */}
			<View
				className="px-6 pt-4 bg-gray-50 border-t border-gray-200"
				style={{ paddingBottom: insets.bottom + 16 }}
			>
				<View className="flex-row gap-3">
					<View className="flex-1">
						<CustomButton
							title="Share"
							onPress={handleShare}
							icon="share"
							variant="secondary"
							size="lg"
							vertical
						/>
					</View>
					<View className="flex-1">
						<CustomButton
							title="Save"
							onPress={() => {}}
							icon="fold-down"
							variant="secondary"
							size="lg"
							vertical
						/>
					</View>
				</View>
			</View>
		</View>
	);
}
