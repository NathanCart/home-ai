import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
	View,
	FlatList,
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
	alternativeGenerations?: string[];
}

// Simple Project Card Component (memoized for performance)
const AnimatedProjectCard = React.memo(
	({
		project,
		onPress,
		sharedAnimation,
	}: {
		project: Project;
		onPress: () => void;
		sharedAnimation: Animated.Value;
	}) => {
		const pressAnim = useRef(new Animated.Value(1)).current; // For press animation
		const { width: screenWidth } = useWindowDimensions();
		const cardWidth = screenWidth - 48; // Account for px-6 padding (24px each side)

		// Always use shared animation - it's more performant and smoother
		const revealPosition = sharedAnimation.interpolate({
			inputRange: [0, 1],
			outputRange: [0, cardWidth],
		});

		// Label opacities
		const beforeLabelOpacity = sharedAnimation.interpolate({
			inputRange: [0, 0.25, 0.95],
			outputRange: [1, 0, 0],
		});

		const afterLabelOpacity = sharedAnimation.interpolate({
			inputRange: [0, 0.5, 0.95],
			outputRange: [0, 0, 1],
		});

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
									<ThemedText
										variant="body"
										className="text-gray-900 text-xs"
										bold
									>
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
						<Image
							source={{ uri: project.imageUrl }}
							className="w-full h-48"
							resizeMode="cover"
						/>
					)}

					{/* Project Info */}
					<View className="p-4">
						<ThemedText className="text-gray-900 " variant="title-sm" extraBold>
							{project.room?.name || project.room?.label || 'Design'}
						</ThemedText>

						{project.style && (
							<View className="flex-row items-center">
								<ThemedText className="text-gray-600" variant="body">
									{project.style?.name || project.style?.label}
								</ThemedText>
							</View>
						)}

						<ThemedText className="text-gray-600 absolute top-4 right-4" variant="body">
							{formatDate(project.createdAt)}
						</ThemedText>
					</View>
				</TouchableOpacity>
			</Animated.View>
		);
	}
);

export default function ProjectsPage() {
	const insets = useSafeAreaInsets();
	const [projects, setProjects] = useState<Project[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const sharedAnimation = useRef(new Animated.Value(1)).current; // Shared animation for all cards
	const animationRef = useRef<Animated.CompositeAnimation | null>(null);

	useEffect(() => {
		loadProjects();
	}, []);

	// Start the shared animation loop once when component mounts
	useEffect(() => {
		const animation = Animated.loop(
			Animated.sequence([
				Animated.delay(500),
				Animated.timing(sharedAnimation, {
					toValue: 0,
					duration: 1500,
					useNativeDriver: false,
				}),
				Animated.delay(500),
				Animated.timing(sharedAnimation, {
					toValue: 1,
					duration: 1500,
					useNativeDriver: false,
				}),
			])
		);

		animationRef.current = animation;
		animation.start();

		return () => {
			if (animationRef.current) {
				animationRef.current.stop();
			}
		};
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

	const handleRefresh = useCallback(() => {
		setRefreshing(true);
		loadProjects();
	}, []);

	const handleProjectPress = useCallback((project: Project) => {
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
	}, []);

	const renderItem = useCallback(
		({ item, index }: { item: Project; index: number }) => (
			<AnimatedProjectCard
				project={item}
				onPress={() => handleProjectPress(item)}
				sharedAnimation={sharedAnimation}
			/>
		),
		[handleProjectPress, sharedAnimation]
	);

	const keyExtractor = useCallback((item: Project, index: number) => index.toString(), []);

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
				<FlatList<Project>
					data={projects}
					renderItem={renderItem}
					keyExtractor={keyExtractor}
					contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32, gap: 16 }}
					ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
					showsVerticalScrollIndicator={false}
					refreshControl={
						<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
					}
					removeClippedSubviews={false}
					maxToRenderPerBatch={10}
					windowSize={1.5}
					initialNumToRender={4}
				/>
			)}
		</View>
	);
}
