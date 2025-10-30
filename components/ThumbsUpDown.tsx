import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as StoreReview from 'expo-store-review';
import {
	getGenerationRating,
	saveGenerationRating,
	type GenerationRating,
} from '../utils/generationRating';

interface ThumbsUpDownProps {
	imageUrl: string;
	style?: any;
}

export function ThumbsUpDown({ imageUrl, style }: ThumbsUpDownProps) {
	const [rating, setRating] = useState<GenerationRating>(null);

	// Load rating when image changes
	useEffect(() => {
		const loadRating = async () => {
			if (imageUrl) {
				const savedRating = await getGenerationRating(imageUrl);
				setRating(savedRating);
			}
		};
		loadRating();
	}, [imageUrl]);

	const handleRating = async (newRating: 'thumbs-up' | 'thumbs-down') => {
		if (!imageUrl) return;

		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

		// If clicking the same rating, deselect it
		const finalRating = rating === newRating ? null : newRating;
		setRating(finalRating);
		await saveGenerationRating(imageUrl, finalRating);

		// If thumbs up, show review prompt
		if (finalRating === 'thumbs-up') {
			try {
				const isAvailable = await StoreReview.isAvailableAsync();
				if (isAvailable) {
					await StoreReview.requestReview();
				}
			} catch (error) {
				console.error('Error showing review prompt:', error);
			}
		}
	};

	return (
		<View style={[styles.container, style]}>
			<TouchableOpacity
				onPress={() => handleRating('thumbs-up')}
				style={[styles.iconButton, styles.firstButton]}
			>
				<Ionicons
					name={rating === 'thumbs-up' ? 'heart' : 'heart-outline'}
					size={24}
					color="#fff"
					style={{
						opacity: rating === 'thumbs-up' ? 1 : 0.6,
					}}
				/>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		bottom: 16,
		right: 16,
		flexDirection: 'row',
		alignItems: 'center',
	},
	iconButton: {
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		borderRadius: 20,
		padding: 8,
	},
	firstButton: {},
});
