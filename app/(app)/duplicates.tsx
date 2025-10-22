import { Ionicons } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Video, ResizeMode } from 'expo-av';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	Image,
	Animated as RNAnimated,
	ScrollView,
	TouchableOpacity,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
	DuplicateGroup,
	calculateStorageSavings,
	findDuplicates,
} from '../../components/duplicateDetection';
import {
	addKbSaved,
	incrementTotalReviews,
	addReviewedDuplicateGroup,
} from '../../components/reviewedFiles';
import { ThemedText } from '../../components/ThemedText';
import { useFiles } from '../../components/useFiles';

// Format video duration
const formatDuration = (seconds: number): string => {
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Format file size
const formatFileSize = (kb: number): string => {
	if (kb < 1024) {
		return `${kb.toFixed(1)} KB`;
	} else if (kb < 1024 * 1024) {
		return `${(kb / 1024).toFixed(1)} MB`;
	} else {
		return `${(kb / (1024 * 1024)).toFixed(1)} GB`;
	}
};

const VideoComponent = ({
	uri,
	assetId,
	shouldPlay,
	className,
}: {
	uri: string;
	assetId?: string;
	shouldPlay: boolean;
	className: string;
}) => {
	const [isLoading, setIsLoading] = useState(true);
	const [hasError, setHasError] = useState(false);
	const [resolvedUri, setResolvedUri] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		let timeoutId: NodeJS.Timeout;

		const resolveUri = async () => {
			try {
				if (!cancelled) {
					setResolvedUri(uri);
					setIsLoading(false);
				}
			} catch (error) {
				console.error('Error resolving video URI:', error);
				if (!cancelled) {
					setHasError(true);
					setIsLoading(false);
				}
			}
		};

		// Add a timeout to prevent hanging
		timeoutId = setTimeout(() => {
			if (isLoading) {
				setHasError(true);
				setIsLoading(false);
			}
		}, 5000);

		resolveUri();

		return () => {
			cancelled = true;
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	}, [uri, assetId, isLoading]);

	if (isLoading) {
		return (
			<View
				className={`${className} bg-white rounded-3xl overflow-hidden relative justify-center items-center`}
			>
				<ActivityIndicator size="large" color="#3b82f6" />
				<ThemedText className="text-gray-700 mt-2">Loading video...</ThemedText>
			</View>
		);
	}

	if (hasError || !resolvedUri) {
		return (
			<View
				className={`${className} bg-gray-200 rounded-3xl overflow-hidden relative justify-center items-center`}
			>
				<ThemedText className="text-gray-600 mt-2 text-center px-4">
					Unable to load video
				</ThemedText>
			</View>
		);
	}

	return (
		<View className={`${className} bg-[#0285f8]/20 overflow-hidden relative`}>
			<Video
				source={{ uri: resolvedUri }}
				style={{ width: '100%', height: '100%' }}
				shouldPlay={shouldPlay}
				isLooping={false}
				resizeMode={ResizeMode.COVER}
				onLoad={() => {
					setIsLoading(false);
				}}
			/>
		</View>
	);
};

export default function DuplicatesPage() {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
	const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
	const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
	const [isDetecting, setIsDetecting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
	const [showConfirmation, setShowConfirmation] = useState(false);
	const [deletedCount, setDeletedCount] = useState(0);
	const [sessionStorageSaved, setSessionStorageSaved] = useState(0);

	// Animation values for success screen
	const successOpacity = useRef(new RNAnimated.Value(0)).current;
	const successScale = useRef(new RNAnimated.Value(0.3)).current;
	const checkmarkOpacity = useRef(new RNAnimated.Value(0)).current;
	const checkmarkScale = useRef(new RNAnimated.Value(0)).current;

	// Animation values for confirmation screen
	const confirmationOpacity = useRef(new RNAnimated.Value(0)).current;
	const confirmationTranslateY = useRef(new RNAnimated.Value(50)).current;

	// Use the custom hook for file management
	const {
		photos,
		isLoading: photosLoading,
		error: photosError,
		deletePhotos,
	} = useFiles('duplicates');

	// Load and detect duplicates
	useEffect(() => {
		const detectDuplicates = async () => {
			if (photosLoading || photos.length === 0) return;

			setIsDetecting(true);
			setError(null);

			try {
				console.log('Starting duplicate detection...');
				const groups = await findDuplicates(
					photos,
					{
						similarityThreshold: 0.7,
						maxPhotos: 500,
						minGroupSize: 2,
					},
					true
				); // Exclude already reviewed groups

				console.log(`Found ${groups.length} duplicate groups`);
				setDuplicateGroups(groups);
			} catch (error) {
				console.error('Error detecting duplicates:', error);
				setError(error instanceof Error ? error.message : 'Unknown error');
			} finally {
				setIsDetecting(false);
			}
		};

		detectDuplicates();
	}, [photos, photosLoading]);

	// Get current group
	const currentGroup = duplicateGroups[currentGroupIndex];

	// Toggle photo selection
	const togglePhotoSelection = (photoId: string) => {
		setSelectedPhotos((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(photoId)) {
				newSet.delete(photoId);
			} else {
				newSet.add(photoId);
			}
			return newSet;
		});
	};

	// Select all photos in current group for deletion
	const selectGroupForDeletion = () => {
		if (!currentGroup) return;
		setSelectedPhotos((prev) => {
			const newSet = new Set(prev);
			// Remove any existing selections from this group first
			currentGroup.photos.forEach((photo) => newSet.delete(photo.id));
			// Then add all photos from this group for deletion
			currentGroup.photos.forEach((photo) => newSet.add(photo.id));
			return newSet;
		});
	};

	// Deselect all photos in current group (keep all photos)
	const deselectGroup = () => {
		if (!currentGroup) return;
		setSelectedPhotos((prev) => {
			const newSet = new Set(prev);
			// Remove all photos from this group from selection (keep them all)
			currentGroup.photos.forEach((photo) => newSet.delete(photo.id));
			return newSet;
		});
	};

	// Check if all photos in current group are selected for deletion
	const isGroupSelected = () => {
		if (!currentGroup) return false;
		return currentGroup.photos.every((photo) => selectedPhotos.has(photo.id));
	};

	// Handle continue to next group
	const handleContinue = () => {
		if (currentGroupIndex < duplicateGroups.length - 1) {
			setCurrentGroupIndex((prev) => prev + 1);
		} else {
			// Last group, show confirmation screen
			setShowConfirmation(true);
			// Animate confirmation screen
			RNAnimated.parallel([
				RNAnimated.timing(confirmationOpacity, {
					toValue: 1,
					duration: 300,
					useNativeDriver: false,
				}),
				RNAnimated.spring(confirmationTranslateY, {
					toValue: 0,
					tension: 100,
					friction: 8,
					useNativeDriver: false,
				}),
			]).start();
		}
	};

	// Handle go back
	const handleGoBack = () => {
		if (currentGroupIndex > 0) {
			setCurrentGroupIndex((prev) => prev - 1);
		} else {
			router.back();
		}
	};

	// Handle go back to photos (with confirmation)
	const goBackToPhotos = () => {
		Alert.alert(
			'Discard Changes',
			'Are you sure you want to go back? Your selections will be lost.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Discard',
					style: 'destructive',
					onPress: () => {
						setSelectedPhotos(new Set());
						setCurrentGroupIndex(0);
						setShowConfirmation(false);
						router.back();
					},
				},
			]
		);
	};

	// Handle delete selected photos
	const handleDeleteSelected = async () => {
		const photosToDelete = Array.from(selectedPhotos);

		// Validate that all selected photos exist in the current photos array
		const validPhotoIds = photosToDelete.filter((photoId) =>
			photos.some((photo) => photo.id === photoId)
		);

		if (validPhotoIds.length !== photosToDelete.length) {
			console.warn(
				`Some photos were not found: ${photosToDelete.length - validPhotoIds.length} missing`
			);
		}

		try {
			console.log('Deleting photos:', validPhotoIds);
			const success = await deletePhotos(validPhotoIds);
			console.log('Delete result:', success);

			if (success) {
				// Save reviewed duplicate groups to AsyncStorage
				for (const group of duplicateGroups) {
					const decisions = new Map<string, 'keep' | 'delete'>();
					group.photos.forEach((photo) => {
						decisions.set(photo.id, selectedPhotos.has(photo.id) ? 'delete' : 'keep');
					});

					await addReviewedDuplicateGroup(
						group.id,
						group.photos.map((p) => p.id),
						decisions
					);
				}

				// Calculate storage savings
				const storageSaved = calculateStorageSavings(duplicateGroups);
				const kbSaved = storageSaved / 1024; // Convert to KB
				await addKbSaved(kbSaved);
				await incrementTotalReviews();

				setDeletedCount(validPhotoIds.length);
				setSessionStorageSaved(kbSaved);
				showSuccessAnimationSequence(validPhotoIds.length, kbSaved);
			} else {
				Alert.alert('Error', 'Failed to delete some files. Please try again.');
			}
		} catch (error) {
			console.error('Error deleting photos:', error);
			Alert.alert('Error', 'An unexpected error occurred while deleting files.');
		}
	};

	// Show success animation sequence
	const showSuccessAnimationSequence = (deletedCount: number, storageSaved: number) => {
		setDeletedCount(deletedCount);
		setSessionStorageSaved(storageSaved);
		setShowSuccessAnimation(true);

		// Reset animation values
		successOpacity.setValue(0);
		successScale.setValue(0.3);
		checkmarkOpacity.setValue(0);
		checkmarkScale.setValue(0);

		// Animate success screen in
		RNAnimated.parallel([
			RNAnimated.timing(successOpacity, {
				toValue: 1,
				duration: 300,
				useNativeDriver: false,
			}),
			RNAnimated.spring(successScale, {
				toValue: 1,
				tension: 100,
				friction: 8,
				useNativeDriver: false,
			}),
		]).start(() => {
			// Animate checkmark in after a short delay
			setTimeout(() => {
				RNAnimated.parallel([
					RNAnimated.timing(checkmarkOpacity, {
						toValue: 1,
						duration: 200,
						useNativeDriver: false,
					}),
					RNAnimated.spring(checkmarkScale, {
						toValue: 1,
						tension: 150,
						friction: 6,
						useNativeDriver: false,
					}),
				]).start(() => {
					// Auto navigate back after animation completes
					setTimeout(() => {
						router.back();
					}, 1500);
				});
			}, 200);
		});
	};

	// Loading state
	if (photosLoading) {
		return (
			<View className="flex-1 bg-primary/5 justify-center items-center px-6">
				<ActivityIndicator size="large" color="#3b82f6" />
				<ThemedText variant="title-lg" className="mt-4 text-gray-700 text-center">
					Loading photos...
				</ThemedText>
			</View>
		);
	}

	// Detecting duplicates state
	if (isDetecting) {
		return (
			<View className="flex-1 bg-primary/5 justify-center items-center px-6">
				<ActivityIndicator size="large" color="#3b82f6" />
				<ThemedText variant="title-lg" className="mt-4 text-gray-700 text-center">
					Finding duplicates...
				</ThemedText>
			</View>
		);
	}

	// Error state
	if (error || photosError) {
		return (
			<View className="flex-1 bg-primary/5 justify-center items-center px-6">
				<View
					className="bg-white rounded-3xl p-8 items-center shadow-lg"
					style={{
						shadowColor: '#199dfe',
						shadowOffset: { width: 0, height: 2 },
						shadowOpacity: 0.25,
						shadowRadius: 3.84,
					}}
				>
					<AntDesign name="exclamation-circle" size={64} color="#ef4444" />
					<ThemedText variant="title-lg" className="mt-4 text-gray-700 text-center">
						Error
					</ThemedText>
					<ThemedText className="mt-2 text-gray-600 text-center">
						{error || photosError}
					</ThemedText>
					<TouchableOpacity
						className="bg-primary py-3 px-6 rounded-xl mt-6"
						onPress={() => router.back()}
					>
						<ThemedText className="text-white font-semibold">Go Back</ThemedText>
					</TouchableOpacity>
				</View>
			</View>
		);
	}

	// No duplicates found
	if (duplicateGroups.length === 0 && !showSuccessAnimation) {
		return (
			<View className="flex-1 bg-primary/5 justify-center items-center px-6">
				<View
					className="bg-white rounded-3xl p-8 items-center shadow-lg"
					style={{
						shadowColor: '#199dfe',
						shadowOffset: { width: 0, height: 2 },
						shadowOpacity: 0.25,
						shadowRadius: 3.84,
					}}
				>
					<AntDesign name="check-circle" size={64} color="#10b981" />
					<ThemedText variant="title-lg" className="mt-4 text-gray-700 text-center">
						No Duplicates Found
					</ThemedText>
					<ThemedText className="mt-2 text-gray-600 text-center">
						Great! Your photo library is clean.
					</ThemedText>
					<TouchableOpacity
						className="bg-primary py-3 px-6 rounded-xl mt-6"
						onPress={() => router.back()}
					>
						<ThemedText className="text-white font-semibold">Go Back</ThemedText>
					</TouchableOpacity>
				</View>
			</View>
		);
	}

	// Show success animation if deletion was successful
	if (showSuccessAnimation) {
		return (
			<RNAnimated.View
				className="flex-1 bg-primary"
				style={{
					opacity: successOpacity,
					transform: [{ scale: successScale }],
				}}
			>
				<View className="flex-1 justify-center items-center">
					{/* Animated Checkmark Circle */}
					<RNAnimated.View
						className="w-32 h-32 bg-white rounded-full items-center justify-center mb-8"
						style={{
							opacity: checkmarkOpacity,
							transform: [{ scale: checkmarkScale }],
						}}
					>
						<Ionicons name="checkmark" size={64} color="#3b82f6" />
					</RNAnimated.View>

					{/* Success Text */}
					<ThemedText
						extraBold
						variant="title-xl"
						className="text-white text-center mb-2"
					>
						SUCCESS!
					</ThemedText>
					<ThemedText variant="title-lg" className="text-white/90 text-center mb-2">
						Deleted {deletedCount} file{deletedCount === 1 ? '' : 's'}
					</ThemedText>

					{/* Storage Saved */}
					<View className="bg-white/20 rounded-2xl px-6 py-4 mt-4">
						<View className="flex-row items-center gap-3">
							<View className="bg-green-500 p-2 rounded-xl">
								<Ionicons name="save" size={20} color="white" />
							</View>
							<View>
								<ThemedText
									variant="body"
									className="text-white/80 text-sm font-medium"
								>
									Storage Freed
								</ThemedText>
								<ThemedText variant="title-lg" extraBold className="text-white">
									{sessionStorageSaved > 0
										? formatFileSize(sessionStorageSaved)
										: '0 B'}
								</ThemedText>
							</View>
						</View>
					</View>
				</View>
			</RNAnimated.View>
		);
	}

	// Show confirmation screen
	if (showConfirmation) {
		return (
			<RNAnimated.View
				className="flex-1 bg-primary/5"
				style={{
					opacity: confirmationOpacity,
					transform: [{ translateY: confirmationTranslateY }],
				}}
			>
				{/* Header */}
				<View className="bg-primary pb-8 px-6" style={{ paddingTop: insets.top + 16 }}>
					<View className="flex-row items-center gap-2">
						<TouchableOpacity
							className="flex-row items-center gap-2"
							onPress={goBackToPhotos}
						>
							<AntDesign name="double-left" size={32} color="white" />
							<ThemedText
								extraBold
								variant="title-lg"
								className="text-gray-100 uppercase flex-1 text-nowrap whitespace-nowrap"
							>
								Confirmation
							</ThemedText>
						</TouchableOpacity>
					</View>
				</View>

				{/* Confirmation Grid */}
				<View className="flex-1 px-6">
					<ScrollView contentContainerClassName="flex-row flex-wrap justify-between gap-3 pb-6">
						{/* Legend */}
						<View className="flex-row justify-center gap-8 mb-3 mt-6 mx-auto">
							<View className="flex-row items-center gap-2">
								<View className="bg-red-500 rounded-full p-2">
									<Ionicons name="close" size={16} color="white" />
								</View>
								<ThemedText bold variant="body" className="text-gray-700">
									DELETE
								</ThemedText>
							</View>
							<View className="flex-row items-center gap-2">
								<View className="bg-green-500 rounded-full p-2">
									<Ionicons name="checkmark" size={16} color="white" />
								</View>
								<ThemedText bold variant="body" className="text-gray-700">
									KEEP
								</ThemedText>
							</View>
						</View>

						{/* Photos Grid - Show all photos from all groups */}
						{duplicateGroups
							.flatMap((group) => group.photos)
							.map((photo, index) => {
								const isSelected = selectedPhotos.has(photo.id);

								return (
									<TouchableOpacity
										key={photo.id}
										onPress={() => togglePhotoSelection(photo.id)}
										className="w-[48%] aspect-square rounded-2xl overflow-hidden relative"
										style={{
											shadowColor: '#199dfe',
											shadowOffset: { width: 0, height: 2 },
											shadowOpacity: 0.25,
											shadowRadius: 3.84,
										}}
									>
										{photo.mediaType === 'photo' ? (
											<Image
												source={{ uri: photo.uri }}
												className="w-full h-full"
												resizeMode="cover"
											/>
										) : (
											<VideoComponent
												uri={photo.uri}
												assetId={photo.id}
												shouldPlay={false}
												className="w-full h-full"
											/>
										)}

										{/* Video indicator */}
										{photo.mediaType === 'video' && (
											<View className="absolute top-2 left-2 bg-black/70 rounded-full p-1">
												<Ionicons name="play" size={16} color="white" />
											</View>
										)}

										{/* Video duration */}
										{photo.mediaType === 'video' && photo.duration && (
											<View className="absolute bottom-2 right-2 bg-black/70 rounded px-2 py-1">
												<ThemedText className="text-white text-xs">
													{formatDuration(photo.duration)}
												</ThemedText>
											</View>
										)}

										{/* Dark overlay - darker for photos marked for deletion */}
										<View
											className={`absolute inset-0 ${
												isSelected ? 'bg-black/60' : 'bg-black/10'
											}`}
										/>

										{/* Decision Indicator */}
										<View className="absolute top-2 right-2">
											{isSelected ? (
												<View className="bg-red-500 rounded-full p-2">
													<Ionicons
														name="close"
														size={16}
														color="white"
													/>
												</View>
											) : (
												<View className="bg-green-500 rounded-full p-2">
													<Ionicons
														name="checkmark"
														size={16}
														color="white"
													/>
												</View>
											)}
										</View>

										{/* Photo Number */}
										<View className="absolute bottom-2 left-2 bg-white/90 rounded-full px-2 py-1">
											<ThemedText
												variant="body"
												bold
												className="text-gray-800 text-xs"
											>
												{index + 1}
											</ThemedText>
										</View>
									</TouchableOpacity>
								);
							})}
					</ScrollView>
				</View>

				{/* Sticky Bottom Buttons */}
				<View
					className="px-6 py-4 !pb-4 bg-white border-t border-gray-200"
					style={{ paddingBottom: insets.bottom + 16 }}
				>
					<View className="flex-row gap-4">
						<TouchableOpacity
							onPress={goBackToPhotos}
							className="flex-1 bg-gray-200 py-4 rounded-xl"
						>
							<ThemedText
								extraBold
								className="text-gray-700 font-semibold text-center"
							>
								Cancel
							</ThemedText>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={handleDeleteSelected}
							className="flex-1 bg-primary py-4 rounded-xl"
						>
							<ThemedText extraBold className="text-white font-semibold text-center">
								Delete Files ({selectedPhotos.size})
							</ThemedText>
						</TouchableOpacity>
					</View>
				</View>
			</RNAnimated.View>
		);
	}

	// Main step-by-step duplicate review interface
	return (
		<View className="flex-1 bg-primary/5">
			{/* Header */}
			<View className="bg-primary pb-8 px-6" style={{ paddingTop: insets.top + 16 }}>
				<View className="flex-row items-center gap-2">
					<TouchableOpacity
						className="flex-row items-center gap-2"
						onPress={handleGoBack}
					>
						<AntDesign name="double-left" size={32} color="white" />
						<ThemedText
							extraBold
							variant="title-lg"
							className="text-gray-100 uppercase flex-1 text-nowrap whitespace-nowrap"
						>
							Duplicates
						</ThemedText>
					</TouchableOpacity>
				</View>
			</View>

			{/* Current Group Photos */}
			<View className="flex-1 px-6">
				<ScrollView contentContainerClassName="flex-row flex-wrap justify-between gap-3 pb-6">
					{/* Group Info */}
					<View className="w-full items-center mb-4 mt-6">
						<ThemedText variant="title-md" bold className="text-gray-700 text-center">
							Group {currentGroupIndex + 1} of {duplicateGroups.length}
						</ThemedText>
					</View>

					{/* Legend */}
					<View className="flex-row justify-center gap-8 mb-3 mx-auto">
						<View className="flex-row items-center gap-2">
							<View className="bg-red-500 rounded-full p-2">
								<Ionicons name="close" size={16} color="white" />
							</View>
							<ThemedText bold variant="body" className="text-gray-700">
								DELETE
							</ThemedText>
						</View>
						<View className="flex-row items-center gap-2">
							<View className="bg-green-500 rounded-full p-2">
								<Ionicons name="checkmark" size={16} color="white" />
							</View>
							<ThemedText bold variant="body" className="text-gray-700">
								KEEP
							</ThemedText>
						</View>
					</View>

					{/* Group Actions */}
					<View className="w-full flex-row gap-3 mb-6">
						<TouchableOpacity
							className={`flex-1 py-3 px-4 rounded-xl ${
								!isGroupSelected() ? 'bg-red-500' : 'bg-gray-200'
							}`}
							onPress={isGroupSelected() ? deselectGroup : selectGroupForDeletion}
						>
							<ThemedText
								className={`font-semibold text-center ${
									!isGroupSelected() ? 'text-white' : 'text-gray-700'
								}`}
							>
								{isGroupSelected() ? 'Keep All ' : 'Delete All'}
							</ThemedText>
						</TouchableOpacity>
					</View>

					{/* Photos Grid */}
					{currentGroup?.photos.map((photo, index) => (
						<TouchableOpacity
							key={photo.id}
							onPress={() => togglePhotoSelection(photo.id)}
							className="w-[48%] aspect-square rounded-2xl overflow-hidden relative"
							style={{
								shadowColor: '#199dfe',
								shadowOffset: { width: 0, height: 2 },
								shadowOpacity: 0.25,
								shadowRadius: 3.84,
							}}
						>
							{photo.mediaType === 'photo' ? (
								<Image
									source={{ uri: photo.uri }}
									className="w-full h-full"
									resizeMode="cover"
								/>
							) : (
								<VideoComponent
									uri={photo.uri}
									assetId={photo.id}
									shouldPlay={false}
									className="w-full h-full"
								/>
							)}

							{/* Video indicator */}
							{photo.mediaType === 'video' && (
								<View className="absolute top-2 left-2 bg-black/70 rounded-full p-1">
									<Ionicons name="play" size={16} color="white" />
								</View>
							)}

							{/* Video duration */}
							{photo.mediaType === 'video' && photo.duration && (
								<View className="absolute bottom-2 right-2 bg-black/70 rounded px-2 py-1">
									<ThemedText className="text-white text-xs">
										{formatDuration(photo.duration)}
									</ThemedText>
								</View>
							)}

							{/* Dark overlay - darker for photos marked for deletion */}
							<View
								className={`absolute inset-0 ${
									selectedPhotos.has(photo.id) ? 'bg-black/60' : 'bg-black/10'
								}`}
							/>

							{/* Decision Indicator */}
							<View className="absolute top-2 right-2">
								{selectedPhotos.has(photo.id) ? (
									<View className="bg-red-500 rounded-full p-2">
										<Ionicons name="close" size={16} color="white" />
									</View>
								) : (
									<View className="bg-green-500 rounded-full p-2">
										<Ionicons name="checkmark" size={16} color="white" />
									</View>
								)}
							</View>

							{/* Photo Number */}
							<View className="absolute bottom-2 left-2 bg-white/90 rounded-full px-2 py-1">
								<ThemedText variant="body" bold className="text-gray-800 text-xs">
									{index + 1}
								</ThemedText>
							</View>
						</TouchableOpacity>
					))}
				</ScrollView>
			</View>

			{/* Sticky Bottom Buttons */}
			<View
				className="px-6 py-4 !pb-4 bg-white border-t border-gray-200"
				style={{ paddingBottom: insets.bottom + 16 }}
			>
				<TouchableOpacity onPress={handleContinue} className="bg-primary py-4 rounded-xl">
					<ThemedText extraBold className="text-white font-semibold text-center">
						{currentGroupIndex < duplicateGroups.length - 1
							? 'Continue'
							: 'Review Selection'}
					</ThemedText>
				</TouchableOpacity>
			</View>
		</View>
	);
}
