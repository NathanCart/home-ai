import React, { useState, useEffect, useRef } from 'react';
import {
	View,
	ScrollView,
	Image,
	TouchableOpacity,
	RefreshControl,
	Alert,
	Animated,
	useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from 'components/ThemedText';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LoadingScreen } from 'components/LoadingScreen';
import * as Haptics from 'expo-haptics';

interface Project {
	imageUrl: string;
	room?: any;
	style?: any;
	palette?: any;
	originalImage?: string;
	createdAt: string;
	type: string;
}

// Animated Project Card Component
function AnimatedProjectCard({ project, onPress }: { project: Project; onPress: () => void }) {
	const slideAnim = useRef(new Animated.Value(1)).current; // Start at after state (100%)
	const pressAnim = useRef(new Animated.Value(1)).current; // For press animation
	const { width: screenWidth } = useWindowDimensions();
	const cardWidth = screenWidth - 48; // Account for px-6 padding (24px each side)

	const handlePress = () => {
		// Haptic feedback
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

		// Scale down animation
		Animated.sequence([
			Animated.timing(pressAnim, {
				toValue: 0.95,
				duration: 100,
				useNativeDriver: true,
			}),
			Animated.timing(pressAnim, {
				toValue: 1,
				duration: 100,
				useNativeDriver: true,
			}),
		]).start();

		// Call the onPress after animation
		setTimeout(() => {
			onPress();
		}, 150);
	};

	useEffect(() => {
		// Create looping animation (starts at 100%, goes to 0, then back to 100%)
		const animation = Animated.loop(
			Animated.sequence([
				// Wait 0.5 seconds
				Animated.delay(500),
				// Slide back to reveal before (1.5 seconds)
				Animated.timing(slideAnim, {
					toValue: 0,
					duration: 1500,
					useNativeDriver: false,
				}),
				// Wait 0.5 seconds
				Animated.delay(500),
				// Slide to reveal after (1.5 seconds, goes to 100%)
				Animated.timing(slideAnim, {
					toValue: 1,
					duration: 1500,
					useNativeDriver: false,
				}),
			])
		);

		animation.start();

		return () => animation.stop();
	}, [slideAnim]);

	// Interpolate reveal position for divider (0 = show before, 1 = show after)
	const revealPosition = slideAnim.interpolate({
		inputRange: [0, 1],
		outputRange: ['0%', '100%'],
	});

	// Label opacities (adjusted for 0-0.8 range)
	const beforeLabelOpacity = slideAnim.interpolate({
		inputRange: [0, 0.25, 0.95],
		outputRange: [1, 0, 0],
	});

	const afterLabelOpacity = slideAnim.interpolate({
		inputRange: [0, 0.5, 0.95],
		outputRange: [0, 0, 1],
	});

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffTime = Math.abs(now.getTime() - date.getTime());
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays === 0) return 'Today';
		if (diffDays === 1) return 'Yesterday';
		if (diffDays < 7) return `${diffDays} days ago`;
		if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
		if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
		return `${Math.floor(diffDays / 365)} years ago`;
	};

	return (
		<Animated.View
			style={{
				transform: [{ scale: pressAnim }],
			}}
		>
			<TouchableOpacity
				onPress={handlePress}
				className="bg-white rounded-3xl overflow-hidden border-2 border-gray-200"
			>
				{/* Project Image - Animated Split View */}
				{project.originalImage ? (
					<View className="w-full h-48 relative">
						{/* Before Image (Full Width - Base Layer) */}
						<Image
							source={{ uri: project.originalImage }}
							style={{
								width: '100%',
								height: '100%',
							}}
							resizeMode="cover"
						/>

						{/* After Image (Clipped by Width - Top Layer) */}
						<Animated.View
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								bottom: 0,
								width: revealPosition,
								overflow: 'hidden',
							}}
						>
							<Image
								source={{ uri: project.imageUrl }}
								style={{
									width: cardWidth,
									height: '100%',
								}}
								resizeMode="cover"
							/>
						</Animated.View>

						{/* Animated Divider Line */}
						<Animated.View
							style={{
								position: 'absolute',
								top: 0,
								bottom: 0,
								left: revealPosition,
								width: 2,
								backgroundColor: '#fff',
								shadowColor: '#000',
								shadowOffset: { width: 0, height: 0 },
								shadowOpacity: 0.3,
								shadowRadius: 4,
								elevation: 5,
							}}
						/>

						{/* Before Label */}
						<Animated.View
							style={{
								position: 'absolute',
								top: 8,
								right: 8,
								opacity: beforeLabelOpacity,
							}}
						>
							<View className="bg-gray-50 px-2 py-1 rounded-full">
								<ThemedText variant="body" className="text-gray-900 text-xs" bold>
									Before
								</ThemedText>
							</View>
						</Animated.View>

						{/* After Label */}
						<Animated.View
							style={{
								position: 'absolute',
								top: 8,
								right: 8,
								opacity: afterLabelOpacity,
							}}
						>
							<View className="bg-gray-50 px-2 py-1 rounded-full">
								<ThemedText variant="body" className="text-gray-900 text-xs" bold>
									After
								</ThemedText>
							</View>
						</Animated.View>
					</View>
				) : (
					<Image
						source={{ uri: project.imageUrl }}
						className="w-full h-48"
						resizeMode="cover"
					/>
				)}

				{/* Project Info */}
				<View className="p-4">
					<ThemedText className="text-gray-900 mb-2" variant="title-md" extraBold>
						{project.room?.name || project.room?.label || 'Design'}
					</ThemedText>

					{project.style && (
						<View className="flex-row items-center mb-2">
							<ThemedText className="text-gray-600" variant="body">
								{project.style?.name || project.style?.label}
							</ThemedText>
						</View>
					)}

					<ThemedText className="text-gray-500" variant="body">
						{formatDate(project.createdAt)}
					</ThemedText>
				</View>
			</TouchableOpacity>
		</Animated.View>
	);
}

export default function ProjectsPage() {
	const insets = useSafeAreaInsets();
	const [projects, setProjects] = useState<Project[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	useEffect(() => {
		loadProjects();
	}, []);

	const loadProjects = async () => {
		try {
			const storedProjects = await AsyncStorage.getItem('projects');
			if (storedProjects) {
				setProjects(JSON.parse(storedProjects));
			}
		} catch (error) {
			console.error('Error loading projects:', error);
			Alert.alert('Error', 'Failed to load projects.');
		} finally {
			setIsLoading(false);
			setRefreshing(false);
		}
	};

	const handleRefresh = () => {
		setRefreshing(true);
		loadProjects();
	};

	const handleProjectPress = (project: Project) => {
		// Generate a slug from the project
		const slug = project.imageUrl.substring(
			project.imageUrl.lastIndexOf('/') + 1,
			project.imageUrl.indexOf('?') > 0
				? project.imageUrl.indexOf('?')
				: project.imageUrl.length
		);

		// Navigate to project detail page
		router.push({
			pathname: '/project/[slug]',
			params: { slug },
		});
	};

	if (isLoading) {
		return <LoadingScreen message="Loading projects..." />;
	}

	return (
		<View className="flex-1 bg-gray-50">
			{/* Header */}
			<View
				className="flex-row items-center justify-between pb-4 px-4"
				style={{ paddingTop: insets.top + 16 }}
			>
				<View style={{ width: 24 }} />
				<ThemedText extraBold className="text-gray-900" variant="title-lg">
					Projects
				</ThemedText>
				<View style={{ width: 24 }} />
			</View>

			{/* Projects List */}
			{projects.length === 0 ? (
				<View className="flex-1 items-center justify-center px-4">
					<Ionicons name="folder-open-outline" size={64} color="#9CA3AF" />
					<ThemedText className="text-gray-500 text-center mt-4" variant="body">
						No projects yet.{'\n'}Save your AI designs to see them here.
					</ThemedText>
				</View>
			) : (
				<ScrollView
					className="flex-1"
					contentContainerClassName="px-6 pb-8"
					showsVerticalScrollIndicator={false}
					refreshControl={
						<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
					}
				>
					<View className="gap-4">
						{projects.map((project, index) => (
							<AnimatedProjectCard
								key={index}
								project={project}
								onPress={() => handleProjectPress(project)}
							/>
						))}
					</View>
				</ScrollView>
			)}
		</View>
	);
}
