import React from 'react';
import { View, Image, TouchableOpacity, Share, Alert } from 'react-native';
import { ThemedText } from '../ThemedText';
import * as MediaLibrary from 'expo-media-library';
import { CustomButton } from '../CustomButton';

interface ConfirmationStepProps {
	imageUrl: string;
	room?: any;
	style?: any;
	palette?: any;
	onComplete: () => void;
}

export function ConfirmationStep({
	imageUrl,
	room,
	style,
	palette,
	onComplete,
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

	const roomName = room?.name || room?.label || '';
	const styleName = style?.name || style?.label || '';

	return (
		<View className="flex-1 bg-gray-50 px-6">
			{/* Header */}
			<View className="mb-6">
				<ThemedText variant="title-lg" className="text-gray-900 mb-2" extraBold>
					Your Design is Ready!
				</ThemedText>
				{(roomName || styleName) && (
					<ThemedText variant="body" className="text-gray-600">
						{roomName && styleName
							? `${roomName} · ${styleName}`
							: roomName || styleName}
					</ThemedText>
				)}
			</View>

			{/* Generated Image */}
			<View className="flex-1 mb-6">
				<Image
					source={{ uri: imageUrl }}
					className="w-full h-full rounded-lg"
					resizeMode="cover"
				/>
			</View>

			{/* Action Buttons */}
			<View className="mb-6 gap-3">
				<CustomButton
					title="Save to Gallery"
					onPress={handleSaveToGallery}
					icon="download"
					variant="secondary"
					size="lg"
				/>
				<CustomButton
					title="Share"
					onPress={handleShare}
					icon="share"
					variant="secondary"
					size="lg"
				/>
			</View>

			{/* Done Button */}
			<CustomButton
				title="Done"
				onPress={onComplete}
				icon="check"
				iconPosition="right"
				variant="primary"
				size="lg"
			/>
		</View>
	);
}
