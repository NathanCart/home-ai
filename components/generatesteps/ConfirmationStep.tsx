import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
	View,
	Image,
	TouchableOpacity,
	Share,
	Alert,
	ScrollView,
	Animated,
	Dimensions,
	FlatList,
} from 'react-native';
import { ThemedText } from '../ThemedText';
import * as MediaLibrary from 'expo-media-library';
import { CustomButton } from '../CustomButton';
import { Ionicons, Octicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GenerateHalfModal } from '../GenerateHalfModal';
import { GenerateGardenHalfModal } from '../GenerateGardenHalfModal';
import { GenerateExteriorHalfModal } from '../GenerateExteriorHalfModal';
import { RestyleSelectionHalfModal } from '../RestyleSelectionHalfModal';
import { useRunwareAI } from '../useRunwareAI';
import { ThumbsUpDown } from '../ThumbsUpDown';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

interface AlternativeGeneration {
	imageUrl: string;
	style?: any;
	room?: any;
}

interface ConfirmationStepProps {
	imageUrl: string;
	room?: any;
	style?: any;
	palette?: any;
	mode?: string; // 'garden' | 'interior-design' | etc.
	onComplete: () => void;
	onRegenerate?: () => void;
	imageUri?: string | null;
	onSaveComplete?: () => void;
}

export function ConfirmationStep({
	imageUrl: initialImageUrl,
	room,
	style,
	palette,
	mode,
	onComplete,
	onRegenerate,
	imageUri,
	onSaveComplete,
}: ConfirmationStepProps) {
	const slideAnim = useRef(new Animated.Value(1)).current; // 0 = before (left), 1 = after (right)
	const dividerAnim = useRef(new Animated.Value(1)).current; // Separate animation for divider
	const insets = useSafeAreaInsets();
	const screenWidth = Dimensions.get('window').width - 48; // Account for padding

	const [imageUrl, setImageUrl] = useState(initialImageUrl);
	const [alternativeGenerations, setAlternativeGenerations] = useState<AlternativeGeneration[]>(
		[]
	);
	const [showRestyleSelection, setShowRestyleSelection] = useState(false);
	const [showModal, setShowModal] = useState(false);
	const [selectedRestyleMode, setSelectedRestyleMode] = useState<string | null>(null);
	const [projectSlug, setProjectSlug] = useState<string | null>(null);
	const [hasAutoSaved, setHasAutoSaved] = useState(false);

	// Create variants array that includes the original image + alternatives
	const allVariants: Array<{ imageUrl: string; style?: any; room?: any }> = [
		{ imageUrl: initialImageUrl, style, room },
		...alternativeGenerations,
	];

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
		if (!imageUrl) return;

		try {
			const { status } = await MediaLibrary.requestPermissionsAsync();
			if (status !== 'granted') {
				Alert.alert('Permission Denied', 'Please grant gallery access to save images.');
				return;
			}

			await MediaLibrary.saveToLibraryAsync(imageUrl);
			Alert.alert('Success', 'Image saved to gallery!');
		} catch (error) {
			console.error('Error saving image:', error);
			Alert.alert('Error', 'Failed to save image to gallery.');
		}
	};

	// Auto-save project on mount
	useEffect(() => {
		const autoSaveProject = async () => {
			if (hasAutoSaved) return; // Only save once

			try {
				const projectData = {
					imageUrl: initialImageUrl,
					room,
					style,
					palette,
					originalImage: imageUri,
					createdAt: new Date().toISOString(),
					type: mode || 'ai-generated',
					mode: mode || 'interior-design',
					alternativeGenerations: undefined, // Will be populated as variants are added
				};

				// Get existing projects
				const existingProjects = await AsyncStorage.getItem('projects');
				const projects = existingProjects ? JSON.parse(existingProjects) : [];

				// Add new project to the beginning
				projects.unshift(projectData);

				// Keep only the last 100 projects
				const trimmedProjects = projects.slice(0, 100);

				await AsyncStorage.setItem('projects', JSON.stringify(trimmedProjects));

				// Generate slug from imageUrl (filename without extension and query params)
				const slug = initialImageUrl.substring(
					initialImageUrl.lastIndexOf('/') + 1,
					initialImageUrl.indexOf('?') > 0
						? initialImageUrl.indexOf('?')
						: initialImageUrl.length
				);
				setProjectSlug(slug);
				setHasAutoSaved(true);
				console.log('✅ Project auto-saved with slug:', slug);
			} catch (error) {
				console.error('Error auto-saving project:', error);
			}
		};

		autoSaveProject();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // Only run once on mount

	// Reload variants when screen comes into focus (e.g., returning from paint/repaint modal)
	useFocusEffect(
		useCallback(() => {
			const checkForNewVariant = async () => {
				if (!projectSlug) return;

				// Check if there's a new variant saved from paint/repaint modal
				const newVariantKey = `newVariant_${projectSlug}`;
				const savedNewVariant = await AsyncStorage.getItem(newVariantKey);

				if (savedNewVariant) {
					// Clear the flag
					await AsyncStorage.removeItem(newVariantKey);
					// Add to alternative generations
					setAlternativeGenerations((prev) => [...prev, { imageUrl: savedNewVariant }]);
					// Auto-select the new image
					setImageUrl(savedNewVariant);
				}
			};

			checkForNewVariant();
		}, [projectSlug])
	);

	// Auto-save alternative generations to the project when they change
	useEffect(() => {
		if (!hasAutoSaved || !projectSlug || alternativeGenerations.length === 0) return;

		const saveAlternativeGenerations = async () => {
			try {
				const storedProjects = await AsyncStorage.getItem('projects');
				if (storedProjects) {
					const projects = JSON.parse(storedProjects);
					const projectIndex = projects.findIndex((p: any) =>
						p.imageUrl.includes(projectSlug)
					);

					if (projectIndex !== -1) {
						// Update the project with new alternative generations
						projects[projectIndex] = {
							...projects[projectIndex],
							alternativeGenerations: alternativeGenerations,
						};

						await AsyncStorage.setItem('projects', JSON.stringify(projects));
						console.log('✅ Alternative generations saved to project');
					}
				}
			} catch (error) {
				console.error('Error saving alternative generations:', error);
			}
		};

		saveAlternativeGenerations();
	}, [alternativeGenerations, projectSlug, hasAutoSaved]);

	const handleGenerationComplete = (newImageUrl: string, newStyle?: any, newRoom?: any) => {
		setShowModal(false);
		// Add to alternative generations with style and room info
		// This will trigger the useEffect to auto-save to the project
		setAlternativeGenerations((prev) => [
			...prev,
			{ imageUrl: newImageUrl, style: newStyle, room: newRoom },
		]);
		// Auto-select the new image
		setImageUrl(newImageUrl);
	};

	const handleOpenRestyleSelection = () => {
		setShowRestyleSelection(true);
	};

	const handleRestyleModeSelect = (restyleMode: string) => {
		setSelectedRestyleMode(restyleMode);

		if (restyleMode === 'repaint') {
			// Navigate to repaint modal
			router.push({
				pathname: '/repaintmodal',
				params: {
					initialImageUri: imageUri || '',
					projectSlug: projectSlug || '',
				},
			});
		} else {
			// Open the appropriate half-modal
			setShowModal(true);
		}
	};

	const handleShare = async () => {
		if (!imageUrl) return;

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
			{/* Sticky Header */}
			<View
				className="bg-gray-50 border-b border-gray-200"
				style={{ paddingBottom: 8, paddingHorizontal: 24 }}
			>
				<View className="flex-row items-center justify-between">
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

			<ScrollView
				className="flex-1"
				contentContainerStyle={{ paddingBottom: 20 }}
				showsVerticalScrollIndicator={false}
			>
				<View className="px-6" style={{ paddingTop: 16 }}>
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
					<View style={{ height: 270 }}>
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
									{/* Rating Icons Overlay */}
									<ThumbsUpDown imageUrl={imageUrl} />
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
							<View className="flex-1 rounded-2xl overflow-hidden bg-white relative">
								<Image
									source={{ uri: imageUrl }}
									className="w-full h-full"
									resizeMode="cover"
								/>
								{/* Rating Icons Overlay */}
								<ThumbsUpDown imageUrl={imageUrl} />
							</View>
						)}
					</View>
					<View className="flex-row items-center justify-between mt-4 gap-3">
						<View className="flex-col items-center gap-2">
							<TouchableOpacity
								onPress={() => {
									Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
									router.push({
										pathname: '/paintmodal',
										params: {
											initialImageUri: imageUrl,
											projectSlug: projectSlug || '',
										},
									});
								}}
								className="bg-gray-200 w-fit rounded-2xl p-3"
							>
								<Octicons name="paintbrush" size={24} color="#111827" />
							</TouchableOpacity>
						</View>
						<View className="flex-col items-center gap-2">
							<TouchableOpacity
								onPress={() => {
									Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
									router.push({
										pathname: '/repaintmodal',
										params: {
											initialImageUri: imageUrl,
											projectSlug: projectSlug || '',
										},
									});
								}}
								className="bg-gray-200 w-fit rounded-2xl p-3"
							>
								<MaterialCommunityIcons
									name="format-paint"
									size={24}
									color="#111827"
								/>
							</TouchableOpacity>
						</View>
					</View>

					{/* Variants Section */}
					{allVariants.length > 1 && (
						<View className="mt-6 mb-6 -mx-6">
							<ThemedText variant="title-md" className="text-gray-900 mb-3 px-6" bold>
								Variants
							</ThemedText>
							<FlatList
								horizontal
								data={allVariants}
								keyExtractor={(item, index) => item.imageUrl || `variant-${index}`}
								showsHorizontalScrollIndicator={false}
								contentContainerStyle={{ gap: 12, paddingHorizontal: 24 }}
								renderItem={({ item, index }) => {
									const variantStyleName =
										item.style?.name || item.style?.label || '';
									return (
										<View>
											<TouchableOpacity
												onPress={() => {
													// Swap the main image with this variant
													setImageUrl(item.imageUrl);
													Haptics.impactAsync(
														Haptics.ImpactFeedbackStyle.Medium
													);
												}}
												className="rounded-2xl bg-transparent"
												style={{ width: 120, height: 120 }}
											>
												<Image
													source={{ uri: item.imageUrl }}
													className="w-full h-full rounded-2xl"
													resizeMode="cover"
												/>
												{imageUrl === item.imageUrl && (
													<View className="absolute rounded-2xl inset-0  border-2 border-blue-500" />
												)}
											</TouchableOpacity>
											<ThemedText
												variant="body"
												className="text-gray-900 text-center"
											>
												{variantStyleName}
											</ThemedText>
										</View>
									);
								}}
							/>
						</View>
					)}
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
							title="Restyle"
							onPress={handleOpenRestyleSelection}
							icon="sync"
							variant="secondary"
							size="lg"
							vertical
						/>
					</View>
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
							onPress={handleSaveToGallery}
							icon="fold-down"
							variant="secondary"
							size="lg"
							vertical
						/>
					</View>
				</View>
			</View>

			{/* Restyle Selection Modal */}
			<RestyleSelectionHalfModal
				visible={showRestyleSelection}
				onClose={() => setShowRestyleSelection(false)}
				onSelect={handleRestyleModeSelect}
				initialImageUri={imageUri}
			/>

			{/* Generate Half Modal */}
			{selectedRestyleMode === 'garden' ? (
				<GenerateGardenHalfModal
					visible={showModal}
					onClose={() => {
						setShowModal(false);
						setSelectedRestyleMode(null);
					}}
					onGenerationComplete={handleGenerationComplete}
					initialImageUri={imageUri}
					initialStyle={style}
				/>
			) : selectedRestyleMode === 'exterior-design' ? (
				<GenerateExteriorHalfModal
					visible={showModal}
					onClose={() => {
						setShowModal(false);
						setSelectedRestyleMode(null);
					}}
					onGenerationComplete={handleGenerationComplete}
					initialImageUri={imageUri}
					initialHouseType={room}
					initialStyle={style}
				/>
			) : selectedRestyleMode === 'interior-design' ? (
				<GenerateHalfModal
					visible={showModal}
					onClose={() => {
						setShowModal(false);
						setSelectedRestyleMode(null);
					}}
					onGenerationComplete={handleGenerationComplete}
					initialImageUri={imageUri}
					initialRoom={room}
					initialStyle={style}
				/>
			) : null}
		</View>
	);
}
