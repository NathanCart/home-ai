import React, { useState, useRef } from 'react';
import {
	View,
	Image,
	TouchableOpacity,
	Share,
	Alert,
	ScrollView,
	Animated,
	Dimensions,
} from 'react-native';
import { ThemedText } from '../ThemedText';
import * as MediaLibrary from 'expo-media-library';
import { CustomButton } from '../CustomButton';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

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
	const slideAnim = useRef(new Animated.Value(1)).current; // 0 = before (left), 1 = after (right)
	const dividerAnim = useRef(new Animated.Value(1)).current; // Separate animation for divider
	const insets = useSafeAreaInsets();
	const screenWidth = Dimensions.get('window').width - 48; // Account for padding

	const toggleView = (targetValue: number) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

		// Animate both together
		Animated.parallel([
			Animated.spring(slideAnim, {
				toValue: targetValue,
				useNativeDriver: true,
			}),
			Animated.spring(dividerAnim, {
				toValue: targetValue,
				useNativeDriver: false,
				tension: 50,
				friction: 8,
			}),
		]).start();
	};

	// Derive opacity for labels from slideAnim position
	const beforeLabelOpacity = slideAnim.interpolate({
		inputRange: [0, 0.2, 1],
		outputRange: [1, 0, 0],
	});

	const afterLabelOpacity = slideAnim.interpolate({
		inputRange: [0, 0.8, 1],
		outputRange: [0, 0, 1],
	});

	// Image opacities for crossfade
	const beforeImageOpacity = slideAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [1, 0],
	});

	const afterImageOpacity = slideAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [0, 1],
	});

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

	const roomName = room?.name || room?.label || '';
	const styleName = style?.name || style?.label || '';
	const hasOriginalImage = !!imageUri;

	// Interpolate the reveal width based on dividerAnim (separate from opacity)
	const revealWidth = dividerAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [0, screenWidth],
	});

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

					{/* Toggle Buttons */}
					{hasOriginalImage && (
						<View className="flex-row mb-4 bg-gray-200 rounded-full p-1">
							<Animated.View
								className="flex-1"
								style={{
									backgroundColor: slideAnim.interpolate({
										inputRange: [0, 1],
										outputRange: [
											'rgba(255, 255, 255, 1)',
											'rgba(255, 255, 255, 0)',
										],
									}),
									borderRadius: 9999,
								}}
							>
								<TouchableOpacity onPress={() => toggleView(0)} className="py-3">
									<Animated.Text
										style={{
											textAlign: 'center',
											fontWeight: slideAnim.interpolate({
												inputRange: [0, 1],
												outputRange: ['700' as any, '400' as any],
											}),
											color: slideAnim.interpolate({
												inputRange: [0, 1],
												outputRange: [
													'rgb(17, 24, 39)',
													'rgb(107, 114, 128)',
												],
											}),
										}}
									>
										Before
									</Animated.Text>
								</TouchableOpacity>
							</Animated.View>
							<Animated.View
								className="flex-1"
								style={{
									backgroundColor: slideAnim.interpolate({
										inputRange: [0, 1],
										outputRange: [
											'rgba(255, 255, 255, 0)',
											'rgba(255, 255, 255, 1)',
										],
									}),
									borderRadius: 9999,
								}}
							>
								<TouchableOpacity onPress={() => toggleView(1)} className="py-3">
									<Animated.Text
										style={{
											textAlign: 'center',
											fontWeight: slideAnim.interpolate({
												inputRange: [0, 1],
												outputRange: ['400' as any, '700' as any],
											}),
											color: slideAnim.interpolate({
												inputRange: [0, 1],
												outputRange: [
													'rgb(107, 114, 128)',
													'rgb(17, 24, 39)',
												],
											}),
										}}
									>
										After
									</Animated.Text>
								</TouchableOpacity>
							</Animated.View>
						</View>
					)}

					{/* Image Display with Sliding Reveal */}
					<View style={{ height: 450 }}>
						{hasOriginalImage ? (
							<View className="flex-1 rounded-2xl overflow-hidden bg-white relative">
								{/* Before Image with crossfade */}
								<Animated.View
									style={{
										position: 'absolute',
										top: 0,
										left: 0,
										right: 0,
										bottom: 0,
										opacity: beforeImageOpacity,
									}}
								>
									<Image
										source={{ uri: imageUri }}
										style={{
											width: '100%',
											height: '100%',
										}}
										resizeMode="cover"
									/>
								</Animated.View>

								{/* After Image with crossfade */}
								<Animated.View
									style={{
										position: 'absolute',
										top: 0,
										left: 0,
										right: 0,
										bottom: 0,
										opacity: afterImageOpacity,
									}}
								>
									<Image
										source={{ uri: imageUrl }}
										style={{
											width: '100%',
											height: '100%',
										}}
										resizeMode="cover"
									/>
								</Animated.View>

								{/* Sliding Reveal Overlay (visual effect only) */}
								<Animated.View
									style={{
										position: 'absolute',
										top: 0,
										left: 0,
										bottom: 0,
										width: revealWidth,
										backgroundColor: 'transparent',
										pointerEvents: 'none',
									}}
								/>

								{/* Divider Line */}
								<Animated.View
									style={{
										position: 'absolute',
										top: 0,
										bottom: 0,
										left: revealWidth,
										width: 3,
										backgroundColor: '#fff',
										shadowColor: '#000',
										shadowOffset: { width: 0, height: 0 },
										shadowOpacity: 0.3,
										shadowRadius: 4,
										elevation: 5,
										pointerEvents: 'none',
									}}
								>
									{/* Handle Circle */}
									<View
										style={{
											position: 'absolute',
											top: '50%',
											left: -12,
											width: 24,
											height: 24,
											borderRadius: 12,
											backgroundColor: '#fff',
											shadowColor: '#000',
											shadowOffset: { width: 0, height: 2 },
											shadowOpacity: 0.25,
											shadowRadius: 3,
											elevation: 5,
											justifyContent: 'center',
											alignItems: 'center',
										}}
									>
										<Ionicons
											name="swap-horizontal"
											size={14}
											color="#111827"
										/>
									</View>
								</Animated.View>

								{/* Labels */}
								<Animated.View
									style={{
										position: 'absolute',
										top: 16,
										left: 16,
										opacity: beforeLabelOpacity,
										pointerEvents: 'none',
									}}
								>
									<View className="bg-gray-50 px-3 py-1 rounded-full">
										<ThemedText
											variant="body"
											className="text-gray-900 text-xs"
											bold
										>
											Before
										</ThemedText>
									</View>
								</Animated.View>
								<Animated.View
									style={{
										position: 'absolute',
										top: 16,
										right: 16,
										opacity: afterLabelOpacity,
										pointerEvents: 'none',
									}}
								>
									<View className="bg-gray-50 px-3 py-1 rounded-full">
										<ThemedText
											variant="body"
											className="text-gray-900 text-xs"
											bold
										>
											After
										</ThemedText>
									</View>
								</Animated.View>
							</View>
						) : (
							<View className="flex-1 rounded-2xl overflow-hidden bg-white">
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
				<View className="flex-row gap-3">
					{onRegenerate && (
						<View className="flex-1">
							<CustomButton
								title="Retry"
								onPress={onRegenerate}
								icon="sync"
								variant="secondary"
								size="lg"
								vertical
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
							vertical
						/>
					</View>

					<View className="flex-1">
						<CustomButton
							title="Save"
							onPress={handleSaveToProjects}
							icon="download"
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
