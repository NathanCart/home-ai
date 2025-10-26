import React, { useState, useEffect } from 'react';
import { View, ScrollView, Image, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from 'components/ThemedText';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LoadingScreen } from 'components/LoadingScreen';

interface Project {
	imageUrl: string;
	room?: any;
	style?: any;
	palette?: any;
	originalImage?: string;
	createdAt: string;
	type: string;
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
		// TODO: Navigate to project detail page
		console.log('Project pressed:', project);
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

	if (isLoading) {
		return <LoadingScreen message="Loading projects..." />;
	}

	return (
		<View className="flex-1 bg-gray-50">
			{/* Header */}
			<View
				className="flex-row items-center justify-between pb-4 px-6"
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
				<View className="flex-1 items-center justify-center px-6">
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
							<TouchableOpacity
								key={index}
								onPress={() => handleProjectPress(project)}
								className="bg-white rounded-lg overflow-hidden shadow-sm"
							>
								{/* Project Image */}
								<Image
									source={{ uri: project.imageUrl }}
									className="w-full h-48"
									resizeMode="cover"
								/>

								{/* Project Info */}
								<View className="p-4">
									<ThemedText
										className="text-gray-900 mb-2"
										variant="title-md"
										extraBold
									>
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
						))}
					</View>
				</ScrollView>
			)}
		</View>
	);
}
