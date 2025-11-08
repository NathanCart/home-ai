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
import { ThemedText } from 'components/ThemedText';
import * as MediaLibrary from 'expo-media-library';
import { CustomButton } from 'components/CustomButton';
import { Ionicons, Octicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GenerateHalfModal } from 'components/GenerateHalfModal';
import { GenerateGardenHalfModal } from 'components/GenerateGardenHalfModal';
import { GenerateExteriorHalfModal } from 'components/GenerateExteriorHalfModal';
import { RestyleSelectionHalfModal } from 'components/RestyleSelectionHalfModal';
import { ThumbsUpDown } from 'components/ThumbsUpDown';

interface AlternativeGeneration {
	imageUrl: string;
	style?: any;
	room?: any;
}

interface Project {
	imageUrl: string;
	room?: any;
	style?: any;
	palette?: any;
	originalImage?: string;
	createdAt: string;
	type: string;
	mode?: string;
	alternativeGenerations?: AlternativeGeneration[];
}

export default function ProjectDetailPage() {
	const { slug, newVariant } = useLocalSearchParams();
	const insets = useSafeAreaInsets();
	const [project, setProject] = useState<Project | null>(null);
	const [imageUrl, setImageUrl] = useState<string>('');
	const [alternativeGenerations, setAlternativeGenerations] = useState<AlternativeGeneration[]>(
		[]
	);
	const [showRestyleSelection, setShowRestyleSelection] = useState(false);
	const [showModal, setShowModal] = useState(false);
	const [selectedRestyleMode, setSelectedRestyleMode] = useState<string | null>(null);
	const screenWidth = Dimensions.get('window').width - 48;
	const slideAnim = useRef(new Animated.Value(1)).current; // 0 = before (left), 1 = after (right)
	const dividerAnim = useRef(new Animated.Value(1)).current;

	// Create variants array that includes the original image + alternatives
	const allVariants: Array<{ imageUrl: string; style?: any; room?: any }> = project
		? [
				{ imageUrl: project.imageUrl, style: project.style, room: project.room },
				...alternativeGenerations,
			]
		: [];

	// Load project data
	const loadProject = useCallback(
		async (selectVariant?: string) => {
			try {
				const storedProjects = await AsyncStorage.getItem('projects');
				if (storedProjects) {
					const projects = JSON.parse(storedProjects);
					const foundProject = projects.find((p: Project) =>
						p.imageUrl.includes(slug as string)
					);
					if (foundProject) {
						setProject(foundProject);
						// Load alternative generations if they exist
						if (foundProject.alternativeGenerations) {
							// Handle backward compatibility: convert string[] to AlternativeGeneration[]
							const alternatives = foundProject.alternativeGenerations.map(
								(alt: any) => (typeof alt === 'string' ? { imageUrl: alt } : alt)
							);
							setAlternativeGenerations(alternatives);

							// Select the new variant if provided, otherwise default to project imageUrl
							if (selectVariant) {
								setImageUrl(selectVariant);
							} else {
								setImageUrl(foundProject.imageUrl);
							}
						} else {
							// Select the new variant if provided, otherwise default to project imageUrl
							if (selectVariant) {
								setImageUrl(selectVariant);
							} else {
								setImageUrl(foundProject.imageUrl);
							}
						}
					}
				}
			} catch (error) {
				console.error('Error loading project:', error);
			}
		},
		[slug]
	);

	useEffect(() => {
		loadProject();
	}, [loadProject]);

	// Reload project when screen comes into focus (e.g., returning from paint modal)
	useFocusEffect(
		useCallback(() => {
			const checkForNewVariant = async () => {
				// Check if there's a new variant saved from paint modal
				const newVariantKey = `newVariant_${slug}`;
				const savedNewVariant = await AsyncStorage.getItem(newVariantKey);

				if (savedNewVariant) {
					// Clear the flag
					await AsyncStorage.removeItem(newVariantKey);
					// Reload and select the new variant
					loadProject(savedNewVariant);
				} else if (newVariant && typeof newVariant === 'string') {
					// Fallback to param-based approach
					loadProject(newVariant);
				} else {
					loadProject();
				}
			};

			checkForNewVariant();
		}, [loadProject, slug, newVariant])
	);

	// Auto-save project when alternative generations change
	useEffect(() => {
		if (!project || alternativeGenerations.length === 0) return;

		const saveAlternativeGenerations = async () => {
			try {
				const storedProjects = await AsyncStorage.getItem('projects');
				if (storedProjects) {
					const projects = JSON.parse(storedProjects);
					const projectIndex = projects.findIndex((p: Project) =>
						p.imageUrl.includes(slug as string)
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
	}, [alternativeGenerations, project, slug]);

	// Add regenerate handlers
	const handleGenerationComplete = (newImageUrl: string, newStyle?: any, newRoom?: any) => {
		setShowModal(false);
		// Add to alternative generations with style and room info
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
					initialImageUri: project?.originalImage || imageUrl || '',
					projectSlug: slug as string,
				},
			});
		} else if (restyleMode === 'styletransfer') {
			// Navigate to style transfer modal
			router.push({
				pathname: '/styletransfermodal',
				params: {
					initialImageUri: project?.originalImage || imageUrl || '',
					projectSlug: slug as string,
				},
			});
		} else {
			// Open the appropriate half-modal
			setShowModal(true);
		}
	};

	const toggleView = (targetValue: number) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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

	const beforeLabelOpacity = slideAnim.interpolate({
		inputRange: [0, 0.2, 1],
		outputRange: [1, 0, 0],
	});

	const afterLabelOpacity = slideAnim.interpolate({
		inputRange: [0, 0.8, 1],
		outputRange: [0, 0, 1],
	});

	const beforeImageOpacity = slideAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [1, 0],
	});

	const afterImageOpacity = slideAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [0, 1],
	});

	const revealWidth = dividerAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [0, screenWidth],
	});

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

	const roomName = project?.room?.name || project?.room?.label || '';
	const styleName = project?.style?.name || project?.style?.label || '';
	const hasOriginalImage = !!project?.originalImage;

	// Determine the title based on mode
	const getProjectTitle = () => {
		if (project?.mode === 'garden') {
			return 'Garden Design';
		}
		if (project?.mode === 'exterior-design') {
			return 'Exterior Design';
		}
		if (project?.mode === 'repaint') {
			return 'Repaint';
		}
		if (project?.mode === 'refloor') {
			return 'Refloor';
		}
		if (project?.mode === 'paint' || project?.type === 'painting') {
			return 'Replace objects';
		}
		// For interior design, use room name or fallback to 'Design'
		return roomName || 'Design';
	};

	if (!project) {
		return (
			<View className="flex-1 bg-gray-50 items-center justify-center">
				<ThemedText>Loading...</ThemedText>
			</View>
		);
	}

	return (
		<View className="flex-1 bg-gray-50">
			{/* Sticky Header */}
			<View
				className="bg-gray-50 border-b border-gray-200"
				style={{ paddingTop: insets.top + 16, paddingBottom: 8, paddingHorizontal: 24 }}
			>
				<View className="flex-row items-center justify-between mb-2">
					<ThemedText variant="title-lg" className="text-gray-900" extraBold>
						{getProjectTitle()}
					</ThemedText>
					<TouchableOpacity onPress={() => router.back()}>
						<Ionicons name="close" size={28} color="#111827" />
					</TouchableOpacity>
				</View>
				{styleName && (
					<ThemedText variant="body" className="text-gray-600">
						{styleName}
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

					{/* Image Display */}
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
										source={{ uri: project.originalImage }}
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
									<View className="bg-gray-200 px-3 py-1 rounded-full">
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
									<View className="bg-gray-200 px-3 py-1 rounded-full">
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
					<View className="flex-row items-center mt-4 gap-3">
						<View className="items-center">
							<TouchableOpacity
								onPress={() => {
									Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
									router.push({
										pathname: '/paintmodal',
										params: {
											initialImageUri: imageUrl,
											projectSlug: slug as string,
										},
									});
								}}
								className="bg-gray-200 w-fit rounded-2xl p-3 mb-1"
								activeOpacity={0.7}
							>
								<Octicons name="paintbrush" size={24} color="#111827" />
							</TouchableOpacity>
							<ThemedText variant="body" className="text-gray-600 text-xs">
								Replace
							</ThemedText>
						</View>
						<View className="items-center">
							<TouchableOpacity
								onPress={() => {
									Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
									router.push({
										pathname: '/repaintmodal',
										params: {
											initialImageUri: imageUrl,
											projectSlug: slug as string,
										},
									});
								}}
								className="bg-gray-200 w-fit rounded-2xl p-3 mb-1"
								activeOpacity={0.7}
							>
								<MaterialCommunityIcons name="format-paint" size={24} color="#111827" />
							</TouchableOpacity>
							<ThemedText variant="body" className="text-gray-600 text-xs">
								Repaint
							</ThemedText>
						</View>
						<View className="items-center">
							<TouchableOpacity
								onPress={() => {
									Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
									router.push({
										pathname: '/refloormodal',
										params: {
											initialImageUri: imageUrl,
											projectSlug: slug as string,
										},
									});
								}}
								className="bg-gray-200 w-fit rounded-2xl p-3 mb-1"
								activeOpacity={0.7}
							>
								<MaterialCommunityIcons name="texture-box" size={24} color="#111827" />
							</TouchableOpacity>
							<ThemedText variant="body" className="text-gray-600 text-xs">
								Refloor
							</ThemedText>
						</View>
					</View>
					{/* Variants Section */}
					{allVariants.length > 1 && (
						<View className="mt-6 mb-6 -mx-6">
							<View className="flex-row items-center justify-between mb-3 px-6">
								<ThemedText variant="title-md" className="text-gray-900" bold>
									Variants
								</ThemedText>
							</View>
							<FlatList
								horizontal
								data={allVariants}
								keyExtractor={(item, index) => `variant-${index}`}
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
				initialImageUri={project?.originalImage || imageUrl}
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
					initialImageUri={project?.originalImage}
					initialStyle={project?.style}
				/>
			) : selectedRestyleMode === 'exterior-design' ? (
				<GenerateExteriorHalfModal
					visible={showModal}
					onClose={() => {
						setShowModal(false);
						setSelectedRestyleMode(null);
					}}
					onGenerationComplete={handleGenerationComplete}
					initialImageUri={project?.originalImage}
					initialHouseType={project?.room}
					initialStyle={project?.style}
				/>
			) : selectedRestyleMode === 'interior-design' ? (
				<GenerateHalfModal
					visible={showModal}
					onClose={() => {
						setShowModal(false);
						setSelectedRestyleMode(null);
					}}
					onGenerationComplete={handleGenerationComplete}
					initialImageUri={project?.originalImage}
					initialRoom={project?.room}
					initialStyle={project?.style}
				/>
			) : null}
		</View>
	);
}
