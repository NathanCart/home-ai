import { AntDesign, Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
	ActivityIndicator,
	Image,
	ScrollView,
	TouchableOpacity,
	View,
	Platform,
} from 'react-native';
import { Video } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/ThemedText';
import {
	getKeptFiles,
	getDeletedFiles,
	getReviewedFilesStats,
	ReviewedFile,
} from '../../components/reviewedFiles';
import * as MediaLibrary from 'expo-media-library';
import { router } from 'expo-router';

// const { width: screenWidth } = Dimensions.get('window');

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
	const [resolvedUri, setResolvedUri] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;

		const resolveUri = async () => {
			setIsLoading(true);

			try {
				// If it's already a file:// URI, use it directly
				if (uri.startsWith('file://')) {
					if (!cancelled) {
						setResolvedUri(uri);
						setIsLoading(false);
					}
					return;
				}

				// For iOS ph:// URIs, get the local file URI
				if (Platform.OS === 'ios' && uri.startsWith('ph://') && assetId) {
					const info = await MediaLibrary.getAssetInfoAsync(assetId);
					if (!cancelled && info.localUri) {
						setResolvedUri(info.localUri);
					} else if (!cancelled) {
						console.log('No localUri found for video:', assetId);
						setResolvedUri(null);
					}
				} else {
					// For other cases, try the original URI
					if (!cancelled) {
						setResolvedUri(uri);
					}
				}
			} catch (error) {
				console.error('Error resolving video URI:', error);
				if (!cancelled) {
					setResolvedUri(null);
				}
			} finally {
				if (!cancelled) {
					setIsLoading(false);
				}
			}
		};

		resolveUri();

		return () => {
			cancelled = true;
		};
	}, [uri, assetId]);

	// Show loading state while resolving URI
	if (isLoading || !resolvedUri) {
		return (
			<View
				className={`${className} bg-white rounded-3xl overflow-hidden relative justify-center items-center`}
			>
				<ActivityIndicator size="large" color="#3b82f6" />
				<ThemedText className="text-gray-700 mt-2">Loading video...</ThemedText>
			</View>
		);
	}

	return (
		<View className={`${className} bg-[#0285f8]/20 overflow-hidden relative`}>
			<Video
				source={{ uri: resolvedUri }}
				style={{ width: '100%', height: '100%' }}
				shouldPlay={shouldPlay}
				isLooping={true}
				isMuted={true}
				onError={(error) => {
					console.error('Video error:', error);
				}}
				onLoad={() => {
					console.log('Video loaded successfully');
				}}
			/>
		</View>
	);
};

export default function AnalyticsPage() {
	const insets = useSafeAreaInsets();
	const [keptFiles, setKeptFiles] = useState<ReviewedFile[]>([]);
	const [deletedFiles, setDeletedFiles] = useState<ReviewedFile[]>([]);
	const [stats, setStats] = useState<any>(null);
	const [isInitialLoading, setIsInitialLoading] = useState(true);
	const [fileDetails, setFileDetails] = useState<Map<string, any>>(new Map());
	const [loadedFiles, setLoadedFiles] = useState<Set<string>>(new Set());
	const [loadedCount, setLoadedCount] = useState(0);
	const [loadingMore, setLoadingMore] = useState(false);
	const ITEMS_PER_PAGE = 20;

	const loadMoreFileDetails = useCallback(
		async (files: ReviewedFile[], startIndex: number) => {
			try {
				setLoadingMore(true);
				const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, files.length);

				console.log(`Loading files ${startIndex} to ${endIndex} (total: ${files.length})`);

				// Load details for the current batch
				for (let i = startIndex; i < endIndex; i++) {
					const file = files[i];
					try {
						const assetInfo = await MediaLibrary.getAssetInfoAsync(file.id);
						const fileDetail = {
							uri: assetInfo.uri,
							width: assetInfo.width,
							height: assetInfo.height,
							mediaType: assetInfo.mediaType,
							duration: assetInfo.duration,
						};

						// Use functional updates to avoid dependency issues
						setFileDetails((prev) => new Map(prev.set(file.id, fileDetail)));
						setLoadedFiles((prev) => new Set(prev.add(file.id)));
					} catch (error) {
						console.error('Error loading file details for:', file.id, error);
					}
				}

				setLoadedCount(endIndex);
				console.log(`Loaded ${endIndex} files total`);
			} catch (error) {
				console.error('Error loading more file details:', error);
			} finally {
				setLoadingMore(false);
			}
		},
		[] // No dependencies to avoid infinite loops
	);

	const loadAnalyticsData = useCallback(async () => {
		try {
			setIsInitialLoading(true);

			// Reset loaded count when starting fresh
			setLoadedCount(0);
			setFileDetails(new Map());
			setLoadedFiles(new Set());

			// Get kept files, deleted files, and stats
			const [kept, deleted, analyticsStats] = await Promise.all([
				getKeptFiles(),
				getDeletedFiles(),
				getReviewedFilesStats(),
			]);

			setKeptFiles(kept);
			setDeletedFiles(deleted);
			setStats(analyticsStats);

			// Load file details for first batch of kept files
			await loadMoreFileDetails(kept, 0);
		} catch (error) {
			console.error('Error loading analytics data:', error);
		} finally {
			setIsInitialLoading(false);
		}
	}, [loadMoreFileDetails]);

	useEffect(() => {
		loadAnalyticsData();
	}, [loadAnalyticsData]);

	const handleLoadMore = () => {
		console.log(
			`handleLoadMore: loadingMore=${loadingMore}, loadedCount=${loadedCount}, totalFiles=${keptFiles.length}`
		);
		if (!loadingMore && loadedCount < keptFiles.length) {
			loadMoreFileDetails(keptFiles, loadedCount);
		}
	};

	if (isInitialLoading) {
		return (
			<View className="flex-1 bg-primary/5 justify-center items-center px-6">
				<ActivityIndicator size="large" color="#3b82f6" />
				<ThemedText variant="title-lg" className="mt-4 text-gray-700 text-center">
					Loading Analytics...
				</ThemedText>
			</View>
		);
	}

	return (
		<View className="flex-1 bg-primary/5">
			{/* Header */}
			<View className="bg-primary pb-8 px-6" style={{ paddingTop: insets.top + 16 }}>
				<View className="flex-row items-center gap-2">
					<TouchableOpacity
						className="flex-row items-center gap-2"
						onPress={() => router.push('/')}
					>
						<AntDesign name="double-left" size={32} color="white" />
						<ThemedText
							extraBold
							variant="title-lg"
							className="text-gray-100 uppercase flex-1 text-nowrap whitespace-nowrap"
						>
							Analytics
						</ThemedText>
					</TouchableOpacity>
				</View>
			</View>

			<ScrollView
				className="flex-1 px-6"
				contentContainerClassName="pb-6"
				onScroll={({ nativeEvent }) => {
					const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
					const isCloseToBottom =
						layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
					if (isCloseToBottom) {
						handleLoadMore();
					}
				}}
				scrollEventThrottle={400}
			>
				{/* <TouchableOpacity
					onPress={handleClearStorage}
					className="px-3 py-1 rounded-full bg-red-500/20 border border-red-400/30"
				>
					<ThemedText variant="body" className="text-red-200 text-xs font-bold">
						hello
					</ThemedText>
				</TouchableOpacity> */}
				{/* Stats Overview */}
				{stats && (
					<View
						className="bg-white rounded-3xl p-6 mt-6 mb-4"
						style={{
							shadowColor: '#199dfe',
							shadowOffset: { width: 0, height: 4 },
							shadowOpacity: 0.15,
							shadowRadius: 8,
						}}
					>
						{/* Header with icon */}

						<ThemedText variant="title-md" extraBold className="text-gray-800 mb-2">
							REVIEW STATISTICS
						</ThemedText>

						{/* Main stats grid */}
						<View className="flex-row flex-wrap gap-3 mb-6">
							{/* Total Files Reviewed */}
							<View className="flex-1 min-w-[110px] bg-gray-50 rounded-xl p-3">
								<View className="flex-row items-center gap-1.5 mb-1.5">
									<View className="bg-blue-100 p-1.5 rounded-md">
										<Ionicons name="images" size={12} color="#3b82f6" />
									</View>
									<ThemedText
										variant="body"
										className="text-gray-600 text-xs font-medium"
									>
										Reviewed
									</ThemedText>
								</View>
								<ThemedText variant="title-lg" extraBold className="text-gray-800">
									{stats.total}
								</ThemedText>
							</View>

							{/* Files Kept */}
							<View className="flex-1 min-w-[110px] bg-green-50 rounded-xl p-3">
								<View className="flex-row items-center gap-1.5 mb-1.5">
									<View className="bg-green-100 p-1.5 rounded-md">
										<Ionicons name="heart" size={12} color="#10b981" />
									</View>
									<ThemedText
										variant="body"
										className="text-gray-600 text-xs font-medium"
									>
										Kept
									</ThemedText>
								</View>
								<ThemedText variant="title-lg" extraBold className="text-green-600">
									{keptFiles.length}
								</ThemedText>
							</View>

							{/* Files Deleted */}
							<View className="flex-1 min-w-[110px] bg-red-50 rounded-xl p-3">
								<View className="flex-row items-center gap-1.5 mb-1.5">
									<View className="bg-red-100 p-1.5 rounded-md">
										<Ionicons name="trash" size={12} color="#ef4444" />
									</View>
									<ThemedText
										variant="body"
										className="text-gray-600 text-xs font-medium"
									>
										Deleted
									</ThemedText>
								</View>
								<ThemedText variant="title-lg" extraBold className="text-red-600">
									{deletedFiles.length}
								</ThemedText>
							</View>

							{/* Total Reviews */}
							<View className="flex-1 min-w-[110px] bg-purple-50 rounded-xl p-3">
								<View className="flex-row items-center gap-1.5 mb-1.5">
									<View className="bg-purple-100 p-1.5 rounded-md">
										<Ionicons name="refresh" size={12} color="#8b5cf6" />
									</View>
									<ThemedText
										variant="body"
										className="text-gray-600 text-xs font-medium"
									>
										Reviews
									</ThemedText>
								</View>
								<ThemedText
									variant="title-lg"
									extraBold
									className="text-purple-600"
								>
									{stats.totalReviews}
								</ThemedText>
							</View>
						</View>

						{/* Storage saved - prominent display */}
						<View className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 mb-4 border border-green-200">
							<View className="flex-row items-center justify-between">
								<View className="flex-row items-center gap-3">
									<View className="bg-green-500 p-3 rounded-xl">
										<Ionicons name="save" size={20} color="white" />
									</View>
									<View>
										<ThemedText
											variant="body"
											className="text-gray-600 text-sm font-medium"
										>
											Storage Saved
										</ThemedText>
										<ThemedText
											variant="title-lg"
											extraBold
											className="text-green-700"
										>
											{formatFileSize(stats.totalKbSaved)}
										</ThemedText>
									</View>
								</View>
							</View>
						</View>

						{/* Decision ratio */}
						{stats.total > 0 && (
							<View className="bg-gray-50 rounded-2xl p-4 mb-4">
								<ThemedText
									variant="body"
									className="text-gray-600 text-sm font-medium mb-3"
								>
									Decision Breakdown
								</ThemedText>
								<View className="flex-row items-center gap-4">
									{/* Keep percentage */}
									<View className="flex-1">
										<View className="flex-row items-center justify-between mb-1">
											<ThemedText
												variant="body"
												className="text-green-600 text-sm font-medium"
											>
												Kept
											</ThemedText>
											<ThemedText
												variant="body"
												className="text-gray-800 text-sm font-bold"
											>
												{Math.round((keptFiles.length / stats.total) * 100)}
												%
											</ThemedText>
										</View>
										<View className="bg-gray-200 rounded-full h-2">
											<View
												className="bg-green-500 h-2 rounded-full"
												style={{
													width: `${(keptFiles.length / stats.total) * 100}%`,
												}}
											/>
										</View>
									</View>

									{/* Delete percentage */}
									<View className="flex-1">
										<View className="flex-row items-center justify-between mb-1">
											<ThemedText
												variant="body"
												className="text-red-600 text-sm font-medium"
											>
												Deleted
											</ThemedText>
											<ThemedText
												variant="body"
												className="text-gray-800 text-sm font-bold"
											>
												{Math.round(
													(deletedFiles.length / stats.total) * 100
												)}
												%
											</ThemedText>
										</View>
										<View className="bg-gray-200 rounded-full h-2">
											<View
												className="bg-red-500 h-2 rounded-full"
												style={{
													width: `${(deletedFiles.length / stats.total) * 100}%`,
												}}
											/>
										</View>
									</View>
								</View>
							</View>
						)}

						{/* First review date */}
						{stats.oldestReview && (
							<View className="flex-row items-center justify-between bg-gray-50 rounded-2xl p-4">
								<View className="flex-row items-center gap-3">
									<View className="bg-gray-200 p-2 rounded-lg">
										<Ionicons name="calendar" size={16} color="#6b7280" />
									</View>
									<ThemedText
										variant="body"
										className="text-gray-600 font-medium"
									>
										First Review
									</ThemedText>
								</View>
								<ThemedText variant="body" className="text-gray-800 font-bold">
									{stats.oldestReview.toLocaleDateString()}
								</ThemedText>
							</View>
						)}
					</View>
				)}

				{/* Sort Type Dropdown */}

				{/* Kept Files Section */}
				<View
					className="bg-white rounded-3xl p-6"
					style={{
						shadowColor: '#199dfe',
						shadowOffset: { width: 0, height: 4 },
						shadowOpacity: 0.15,
						shadowRadius: 8,
					}}
				>
					<ThemedText variant="title-md" extraBold className="text-gray-800 mb-4">
						FILES YOU KEPT
					</ThemedText>

					{keptFiles.length === 0 ? (
						<View className="items-center py-8">
							<Ionicons name="heart-outline" size={64} color="#d1d5db" />
							<ThemedText variant="body" className="text-gray-500 text-center mt-4">
								No files kept yet. Start reviewing to see your kept files here!
							</ThemedText>
						</View>
					) : (
						<>
							<ThemedText variant="body" className="text-gray-600 mb-4">
								{keptFiles.length} file{keptFiles.length === 1 ? '' : 's'} kept
							</ThemedText>

							{/* Show files with infinite scroll */}
							<View className="flex-row flex-wrap justify-between gap-3">
								{keptFiles.slice(0, loadedCount).map((file) => {
									const details = fileDetails.get(file.id);
									if (!details || !loadedFiles.has(file.id)) return null;

									return (
										<TouchableOpacity
											key={file.id}
											className="w-[48%] aspect-square rounded-2xl overflow-hidden relative"
											style={{
												shadowColor: '#199dfe',
												shadowOffset: { width: 0, height: 2 },
												shadowOpacity: 0.25,
												shadowRadius: 3.84,
											}}
										>
											{details.mediaType === 'video' ? (
												<VideoComponent
													uri={details.uri}
													assetId={file.id}
													shouldPlay={false}
													className="w-full h-full"
												/>
											) : (
												<Image
													source={{ uri: details.uri }}
													className="w-full h-full"
													resizeMode="cover"
												/>
											)}

											{/* Video indicator */}
											{details.mediaType === 'video' && (
												<View className="absolute top-2 left-2 bg-black/70 rounded-full p-1">
													<Ionicons name="play" size={16} color="white" />
												</View>
											)}

											{/* Video duration */}
											{details.mediaType === 'video' && details.duration && (
												<View className="absolute bottom-2 right-2 bg-black/70 rounded px-2 py-1">
													<ThemedText className="text-white text-xs">
														{formatDuration(details.duration)}
													</ThemedText>
												</View>
											)}

											{/* Keep indicator */}
											<View className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
												<Ionicons name="heart" size={16} color="white" />
											</View>

											{/* Review date */}
											<View className="absolute bottom-2 left-2 bg-white/90 rounded px-2 py-1">
												<ThemedText className="text-gray-800 text-xs">
													{file.reviewedAt.toLocaleDateString()}
												</ThemedText>
											</View>
										</TouchableOpacity>
									);
								})}
							</View>

							{/* Loading More Indicator */}
							{loadingMore && (
								<View className="py-4 items-center">
									<ActivityIndicator size="small" color="#3b82f6" />
									<ThemedText variant="body" className="text-gray-600 mt-2">
										Loading more files...
									</ThemedText>
								</View>
							)}

							{/* End of List Indicator */}
							{!loadingMore &&
								loadedCount >= keptFiles.length &&
								keptFiles.length > 0 && (
									<View className="py-4 items-center">
										<ThemedText variant="body" className="text-gray-500">
											No more files to see
										</ThemedText>
									</View>
								)}
						</>
					)}
				</View>
			</ScrollView>
		</View>
	);
}
