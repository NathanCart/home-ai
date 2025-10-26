import React, { useState, useRef, useEffect } from 'react';
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
import { ThemedText } from 'components/ThemedText';
import * as MediaLibrary from 'expo-media-library';
import { CustomButton } from 'components/CustomButton';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
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
	const { slug } = useLocalSearchParams();
	const insets = useSafeAreaInsets();
	const [project, setProject] = useState<Project | null>(null);
	const screenWidth = Dimensions.get('window').width - 48;
	const slideAnim = useRef(new Animated.Value(1)).current; // 0 = before (left), 1 = after (right)
	const dividerAnim = useRef(new Animated.Value(1)).current;

	// Load project data
	useEffect(() => {
		const loadProject = async () => {
			try {
				const storedProjects = await AsyncStorage.getItem('projects');
				if (storedProjects) {
					const projects = JSON.parse(storedProjects);
					const foundProject = projects.find((p: Project) =>
						p.imageUrl.includes(slug as string)
					);
					if (foundProject) {
						setProject(foundProject);
					}
				}
			} catch (error) {
				console.error('Error loading project:', error);
			}
		};

		loadProject();
	}, [slug]);

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

	const handleSaveToGallery = async () => {
		if (!project?.imageUrl) return;

		try {
			const { status } = await MediaLibrary.requestPermissionsAsync();
			if (status !== 'granted') {
				Alert.alert('Permission Denied', 'Please grant gallery access to save images.');
				return;
			}

			await MediaLibrary.saveToLibraryAsync(project.imageUrl);
			Alert.alert('Success', 'Image saved to gallery!');
		} catch (error) {
			console.error('Error saving image:', error);
			Alert.alert('Error', 'Failed to save image to gallery.');
		}
	};

	const roomName = project?.room?.name || project?.room?.label || '';
	const styleName = project?.style?.name || project?.style?.label || '';
	const hasOriginalImage = !!project?.originalImage;

	if (!project) {
		return (
			<View className="flex-1 bg-gray-50 items-center justify-center">
				<ThemedText>Loading...</ThemedText>
			</View>
		);
	}

	return (
		<View className="flex-1 bg-gray-50">
			<ScrollView
				className="flex-1"
				contentContainerStyle={{ paddingBottom: 20 }}
				showsVerticalScrollIndicator={false}
			>
				<View className="px-6" style={{ paddingTop: insets.top + 16 }}>
					{/* Header */}
					<View className="mb-6">
						<View className="flex-row items-center justify-between mb-2">
							<ThemedText variant="title-lg" className="text-gray-900" extraBold>
								{roomName || 'Design'}
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
										source={{ uri: project.imageUrl }}
										style={{
											width: '100%',
											height: '100%',
										}}
										resizeMode="cover"
									/>
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
							<View className="flex-1 rounded-2xl overflow-hidden bg-white">
								<Image
									source={{ uri: project.imageUrl }}
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
		</View>
	);
}
