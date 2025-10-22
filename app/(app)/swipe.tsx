import { Ionicons } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	Dimensions,
	Image,
	Linking,
	PanResponder,
	Animated as RNAnimated,
	TouchableOpacity,
	View,
	Platform,
} from 'react-native';
import { Video } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/ThemedText';
import { useFiles } from '../../components/useFiles';
import { ScrollView } from 'react-native-gesture-handler';
import * as MediaLibrary from 'expo-media-library';
import {
	addReviewedFiles,
	incrementTotalReviews,
	addKbSaved,
} from '../../components/reviewedFiles';
import { useAdMob } from '../../components/useAdMob';
import { AdPromptOverlay } from '../../components/AdPromptOverlay';
import { useReviewPrompt } from '../../components/useReviewPrompt';
import { useSubscriptionStatus } from '../../components/useRevenueCat';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const SWIPE_THRESHOLD = screenWidth * 0.25;

// Calculate responsive image height with better constraints
const isSmallScreen = screenHeight < 700 || screenWidth < 400;
const isVerySmallScreen = screenHeight < 600 || screenWidth < 350;

// Hybrid approach - conservative for small screens, larger for big screens
const imageHeight = isVerySmallScreen
	? 120 // Very small for very small screens
	: isSmallScreen
		? 190 // Small for small screens
		: Math.min(320, screenHeight * 0.4); // Larger for normal screens, but capped

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

// Helper function to parse file size string to bytes
const parseFileSizeToBytes = (fileSizeStr: string): number => {
	if (!fileSizeStr) return 0;

	const match = fileSizeStr.match(/^([\d.]+)\s*(B|KB|MB|GB)$/i);
	if (!match) return 0;

	const value = parseFloat(match[1]);
	const unit = match[2].toUpperCase();

	switch (unit) {
		case 'B':
			return value;
		case 'KB':
			return value * 1024;
		case 'MB':
			return value * 1024 * 1024;
		case 'GB':
			return value * 1024 * 1024 * 1024;
		default:
			return 0;
	}
};

// Calculate total KB saved from deleted files
const calculateKbSaved = (photos: any[], swipeDecisions: Map<number, 'left' | 'right'>): number => {
	let totalBytes = 0;
	let deletedCount = 0;
	let photosWithRawBytes = 0;
	let photosWithFileSize = 0;

	photos.forEach((photo, index) => {
		if (swipeDecisions.get(index) === 'left') {
			deletedCount++;
			if (photo.rawBytes) {
				totalBytes += photo.rawBytes;
				photosWithRawBytes++;
			} else if (photo.fileSize) {
				// Fallback to parsing fileSize string
				const bytes = parseFileSizeToBytes(photo.fileSize);
				if (bytes > 0) {
					totalBytes += bytes;
					photosWithFileSize++;
				}
				console.log(`Photo ${index} using fileSize fallback:`, {
					id: photo.id,
					fileSize: photo.fileSize,
					parsedBytes: bytes,
				});
			} else {
				console.log(`Photo ${index} marked for deletion but no size data available:`, {
					id: photo.id,
					fileSize: photo.fileSize,
					hasRawBytes: !!photo.rawBytes,
				});
			}
		}
	});

	const kbSaved = totalBytes / 1024; // Convert bytes to KB
	console.log(
		`Storage calculation: ${deletedCount} deleted, ${photosWithRawBytes} with rawBytes, ${photosWithFileSize} with fileSize, ${kbSaved.toFixed(2)} KB saved`
	);

	return kbSaved;
};

const VideoComponent = ({
	uri,
	assetId,
	shouldPlay,
	className,
	style,
}: {
	uri: string;
	assetId?: string;
	shouldPlay: boolean;
	className: string;
	style?: any;
}) => {
	const [resolvedUri, setResolvedUri] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [hasError, setHasError] = useState(false);

	useEffect(() => {
		let cancelled = false;
		let timeoutId: NodeJS.Timeout;

		const resolveUri = async () => {
			setIsLoading(true);
			setHasError(false);

			timeoutId = setTimeout(() => {
				if (!cancelled) {
					console.log('Video URI resolution timeout for:', uri);
					setHasError(true);
					setIsLoading(false);
				}
			}, 10000); // 10 second timeout

			try {
				// If it's already a file:// URI, use it directly
				if (uri.startsWith('file://')) {
					if (!cancelled) {
						clearTimeout(timeoutId);
						setResolvedUri(uri);
						setIsLoading(false);
					}
					return;
				}

				// For iOS ph:// URIs, get the local file URI
				if (Platform.OS === 'ios' && uri.startsWith('ph://') && assetId) {
					try {
						console.log('Attempting to resolve ph:// URI for video:', assetId);
						const info = await MediaLibrary.getAssetInfoAsync(assetId);
						if (!cancelled) {
							clearTimeout(timeoutId);
							if (info.localUri) {
								console.log('Successfully resolved video URI:', info.localUri);
								setResolvedUri(info.localUri);
							} else {
								console.log(
									'No localUri found for video - likely iCloud storage:',
									assetId
								);
								console.log('Video info:', {
									id: info.id,
									filename: info.filename,
									mediaType: info.mediaType,
									width: info.width,
									height: info.height,
									duration: info.duration,
									creationTime: info.creationTime,
									modificationTime: info.modificationTime,
									localUri: info.localUri,
								});
								setHasError(true);
							}
							setIsLoading(false);
						}
					} catch (mediaError) {
						console.error('MediaLibrary error for video:', assetId, mediaError);
						console.error('Error details:', {
							message:
								mediaError instanceof Error
									? mediaError.message
									: String(mediaError),
							code: (mediaError as any)?.code || 'unknown',
							stack: mediaError instanceof Error ? mediaError.stack : undefined,
						});
						if (!cancelled) {
							clearTimeout(timeoutId);
							setHasError(true);
							setIsLoading(false);
						}
					}
				} else {
					// For other cases, try the original URI
					if (!cancelled) {
						clearTimeout(timeoutId);
						setResolvedUri(uri);
						setIsLoading(false);
					}
				}
			} catch (error) {
				console.error('Error resolving video URI:', error);
				if (!cancelled) {
					clearTimeout(timeoutId);
					setHasError(true);
					setIsLoading(false);
				}
			}
		};

		resolveUri();

		return () => {
			cancelled = true;
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	}, [uri, assetId]);

	// Show loading state while resolving URI
	if (isLoading) {
		return (
			<View
				className={`${className} bg-gray-100 overflow-hidden relative justify-center items-center`}
				style={style}
			>
				<ActivityIndicator size="large" color="#3b82f6" />
				<ThemedText className="text-gray-700 mt-2">Loading video...</ThemedText>
			</View>
		);
	}

	// Show error state if URI resolution failed
	if (hasError || !resolvedUri) {
		return (
			<View
				className={`${className} bg-gray-100 overflow-hidden relative justify-center items-center`}
				style={style}
			>
				<Ionicons name="videocam-off" size={48} color="#6b7280" />
				<ThemedText className="text-gray-600 mt-2 text-center px-4">
					Video unavailable
				</ThemedText>
				<ThemedText className="text-gray-500 mt-1 text-center px-4 text-xs">
					{Platform.OS === 'ios' && uri.startsWith('ph://')
						? 'May be stored in iCloud'
						: 'Unable to load video'}
				</ThemedText>
				<TouchableOpacity
					onPress={() => {
						setHasError(false);
						setIsLoading(true);
						setResolvedUri(null);
						// Trigger re-resolution by updating the effect
					}}
					className="mt-3 bg-primary/20 px-4 py-2 rounded-lg"
				>
					<ThemedText className="text-primary text-sm">Retry</ThemedText>
				</TouchableOpacity>
			</View>
		);
	}

	console.log('Rendering video with URI:', resolvedUri, 'shouldPlay:', shouldPlay);

	return (
		<View className={`${className} bg-gray-100 overflow-hidden relative`} style={style}>
			<Video
				source={{ uri: resolvedUri }}
				style={{ width: '100%', height: '100%' }}
				shouldPlay={shouldPlay}
				isLooping={true}
				isMuted={true}
				onError={(error) => {
					console.error('Video playback error:', error);
					setHasError(true);
					// Don't set error state here as it might be a temporary playback issue
				}}
				onLoad={() => {
					console.log('Video loaded successfully');
				}}
				onLoadStart={() => {
					console.log('Video load started');
				}}
			/>
		</View>
	);
};

export default function SwipePage() {
	const params = useLocalSearchParams();
	const sort = params.sort as
		| 'recent'
		| 'oldest'
		| 'random'
		| 'month'
		| 'filesize'
		| 'videos'
		| 'duplicates'
		| 'blurry'
		| undefined;
	const insets = useSafeAreaInsets();
	const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
	const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
	const [preloadedImages, setPreloadedImages] = useState<Set<number>>(new Set());
	const [swipeDecisions, setSwipeDecisions] = useState<Map<number, 'left' | 'right'>>(new Map());
	const [imageLoadErrors, setImageLoadErrors] = useState<Set<number>>(new Set());

	const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
	const [deletedCount, setDeletedCount] = useState(0);
	const [sessionStorageSaved, setSessionStorageSaved] = useState(0);
	const [sessionCompleted, setSessionCompleted] = useState(false);
	const [showDecisionWarning, setShowDecisionWarning] = useState(false);
	const [isProcessingDecision, setIsProcessingDecision] = useState(false);

	// Ad-related state
	const [showAdPrompt, setShowAdPrompt] = useState(false);
	const [sessionStarted, setSessionStarted] = useState(false);
	const [adLoading, setAdLoading] = useState(false);
	const [adShowing, setAdShowing] = useState(false);
	const [adWatched, setAdWatched] = useState(false);
	const [adError, setAdError] = useState(false);

	// AdMob hook
	const { sessionCount, startSwipeSession, showRewardedAd, isAdShowing, forceResetAdState } =
		useAdMob();

	// Review prompt hook
	const { markFirstSwipeSessionCompleted } = useReviewPrompt();

	// Subscription status hook
	const { isSubscribed } = useSubscriptionStatus();

	// Animation state tracking
	const isAnimating = useRef<boolean>(false);
	const currentPhotoIndexRef = useRef<number>(0);
	const swipeDecisionsRef = useRef<Map<number, 'left' | 'right'>>(new Map());

	// Animation values for confirmation screen
	const confirmationOpacity = useRef(new RNAnimated.Value(0)).current;
	const confirmationTranslateY = useRef(new RNAnimated.Value(50)).current;

	// Animation values for success screen
	const successOpacity = useRef(new RNAnimated.Value(0)).current;
	const successScale = useRef(new RNAnimated.Value(0.3)).current;
	const checkmarkOpacity = useRef(new RNAnimated.Value(0)).current;
	const checkmarkScale = useRef(new RNAnimated.Value(0)).current;

	// Use the custom hook for file management
	const { photos, isLoading, error, isAnalyzingSizes, fetchFileSize, deletePhotos, reload } =
		useFiles(sort || 'recent');

	// Initialize the swipe session
	const initializeSession = useCallback(async () => {
		if (sessionStarted) return;

		// If user is subscribed, start session immediately without ads
		if (isSubscribed) {
			console.log('User is subscribed - starting session immediately');
			setSessionStarted(true);
			setShowAdPrompt(false);
			return;
		}

		try {
			const sessionAllowed = await startSwipeSession();

			if (sessionAllowed) {
				setSessionStarted(true);
				setAdError(false);
				console.log('Session started successfully');
			} else {
				// Show ad prompt if session not allowed
				setShowAdPrompt(true);
				setAdError(false);
				console.log('Session requires ad - showing prompt');
			}
		} catch (error) {
			console.error('Error initializing session:', error);
			// Show error state instead of blocking
			setShowAdPrompt(true);
			setAdError(true);
			console.log('Session error - showing error prompt');
		}
	}, [sessionStarted, startSwipeSession, isSubscribed]);

	// Track if we've already processed the subscription status
	const hasProcessedSubscription = useRef(false);

	// Re-initialize session if subscription status changes
	useEffect(() => {
		// If user just subscribed, close any open ad prompts and allow immediate access
		if (isSubscribed && !hasProcessedSubscription.current) {
			console.log('User subscribed - closing ad modal and resetting session');
			hasProcessedSubscription.current = true;
			setShowAdPrompt(false);
			setSessionStarted(false);
			setAdLoading(false);
			setAdShowing(false);
			setAdWatched(false);
			setAdError(false);
			// Re-initialize session to start without ads
			initializeSession();
		} else if (!isSubscribed) {
			// Reset the flag when user is not subscribed
			hasProcessedSubscription.current = false;
		}
	}, [isSubscribed]);

	// Initialize session when component mounts
	useEffect(() => {
		initializeSession();
	}, [initializeSession]);

	// Handle app state restoration after ad closes
	useEffect(() => {
		// If ad was showing but is no longer showing, reset local state
		if (adShowing && !isAdShowing) {
			console.log('Ad closed - resetting local ad state');
			setAdShowing(false);
			setAdLoading(false);
		}
	}, [isAdShowing, adShowing]);

	// Handle ad completion - close overlay when ad is actually done
	useEffect(() => {
		// If ad was watched and is no longer showing, close the overlay
		if (showAdPrompt && adWatched && !isAdShowing && !adLoading) {
			console.log('Ad completed - closing overlay and starting session');
			setShowAdPrompt(false);
			setAdLoading(false);
			setAdShowing(false);
			setAdWatched(false);
			setSessionStarted(true);
		}
	}, [isAdShowing, showAdPrompt, adLoading, adWatched]);

	// Safety effect to prevent stuck ad states
	useEffect(() => {
		const safetyTimeout = setTimeout(() => {
			if (adShowing || adLoading || isAdShowing) {
				console.log('Safety timeout - forcing ad state reset');
				forceResetAdState();
				setAdShowing(false);
				setAdLoading(false);
				setAdWatched(false);
			}
		}, 45000); // 45 second safety timeout

		return () => clearTimeout(safetyTimeout);
	}, [adShowing, adLoading, isAdShowing, forceResetAdState]);

	// Reset session completion flag when photos change or sort changes (new review session)
	useEffect(() => {
		setSessionCompleted(false);
		console.log('New photos/sort loaded - session completion flag reset');
	}, [photos, sort]);

	// Handle watching ad
	const handleWatchAd = async () => {
		if (adLoading || adShowing || isAdShowing) return; // Prevent multiple clicks

		setAdLoading(true);
		setAdShowing(true);
		setAdWatched(false);

		try {
			const adWatchedResult = await showRewardedAd();

			if (adWatchedResult) {
				// Ad was watched successfully - set the state and let effect handle closing
				console.log('Ad watched successfully - setting watched state');
				setAdWatched(true);
			} else {
				// Ad failed or was skipped, keep overlay open and reset states for retry
				console.log('Ad not watched - keeping prompt open for retry');
				setAdLoading(false);
				setAdShowing(false);
				setAdWatched(false);
			}
		} catch (error) {
			console.error('Error showing ad:', error);
			// Show error state for any errors (including no-fill)
			setAdError(true);
			setAdLoading(false);
			setAdShowing(false);
			setAdWatched(false);
		}
	};

	// Handle skipping ad
	const handleSkipAd = () => {
		setShowAdPrompt(false);
		setAdError(false);
		// Navigate back to home
		router.push('/');
	};

	// Handle continuing after ad error
	const handleContinueAfterError = () => {
		console.log('Continuing after ad error');
		setShowAdPrompt(false);
		setAdError(false);
		setSessionStarted(true);
	};

	// Debug: Track swipeDecisions changes
	useEffect(() => {
		console.log('=== STATE CHANGED ===');
		console.log('SWIPE DECISIONS CHANGED:', Array.from(swipeDecisions.entries()));
		console.log('Current photo index:', currentPhotoIndex);
		console.log('Decision for current photo:', swipeDecisions.get(currentPhotoIndex));
		console.log('isProcessingDecision:', isProcessingDecision);
		console.log('isAnimating.current:', isAnimating.current);
		console.log('========================');

		// Keep ref in sync with state
		swipeDecisionsRef.current = swipeDecisions;
	}, [swipeDecisions, currentPhotoIndex, isProcessingDecision]);

	// Keep ref in sync with state
	useEffect(() => {
		currentPhotoIndexRef.current = currentPhotoIndex;
		console.log('PHOTO INDEX REF UPDATED:', currentPhotoIndexRef.current);
	}, [currentPhotoIndex]);

	// Save reviewed files function
	const saveReviewedFiles = useCallback(async () => {
		try {
			// Only save files that have been reviewed (have decisions)
			const reviewedFileIds: string[] = [];
			const reviewedDecisions = new Map<number, 'left' | 'right'>();

			photos.forEach((photo, index) => {
				if (swipeDecisions.has(index)) {
					reviewedFileIds.push(photo.id);
					reviewedDecisions.set(reviewedFileIds.length - 1, swipeDecisions.get(index)!);
				}
			});

			if (reviewedFileIds.length > 0) {
				await addReviewedFiles(reviewedFileIds, sort || 'recent', reviewedDecisions);
				console.log(
					`Saved ${reviewedFileIds.length} reviewed files to AsyncStorage for sort type: ${sort}`
				);
			}
		} catch (error) {
			console.error('Error saving reviewed files:', error);
		}
	}, [photos, sort, swipeDecisions]);

	const completeReviewSession = useCallback(async () => {
		const callId = Math.random().toString(36).substr(2, 9);
		console.log(`[${callId}] completeReviewSession called`);

		// Prevent multiple completions of the same session
		if (sessionCompleted) {
			console.log(`[${callId}] Session already completed, skipping...`);
			return;
		}

		try {
			// Mark session as completed first to prevent race conditions
			setSessionCompleted(true);
			console.log(`[${callId}] Session marked as completed, preventing duplicate increments`);

			// Save reviewed files first
			await saveReviewedFiles();

			// Then increment total reviews count (only once per session)
			await incrementTotalReviews();
			console.log(`[${callId}] Review session completed - incremented total reviews count`);

			// Mark first swipe session as completed for review prompt
			await markFirstSwipeSessionCompleted();
			console.log(`[${callId}] First swipe session marked as completed`);
		} catch (error) {
			console.error(`[${callId}] Error completing review session:`, error);
			// Reset session completed flag on error so it can be retried
			setSessionCompleted(false);
		}
	}, [saveReviewedFiles, sessionCompleted, markFirstSwipeSessionCompleted]);

	// No longer saving files on navigation away - only save on actual deletion

	// Function to open app settings
	const openAppSettings = () => {
		if (Platform.OS === 'ios') {
			// On iOS, open the app's specific settings page which will show Photos permission
			Linking.openURL('app-settings:');
		} else {
			// On Android, open the app's info page in settings where Photos permission can be managed
			Linking.openSettings();
		}
	};

	const pan = useRef(new RNAnimated.ValueXY()).current;
	const scale = useRef(new RNAnimated.Value(1)).current;
	const rotation = useRef(new RNAnimated.Value(0)).current;
	const cardOpacity = useRef(new RNAnimated.Value(1)).current;
	const cardScale = useRef(new RNAnimated.Value(1)).current;
	const overlayOpacity = useRef(new RNAnimated.Value(0)).current;
	const overlayScale = useRef(new RNAnimated.Value(0.5)).current;

	// Fetch size for current + next 2 (for non-filesize sorting modes)
	useEffect(() => {
		if (sort !== 'filesize') {
			// For other sorting modes, use lazy loading
			const photo = photos[currentPhotoIndex];
			if (photo && !photo.fileSize) fetchFileSize(photo);
			for (let i = 1; i <= 2; i++) {
				const nextPhoto = photos[currentPhotoIndex + i];
				if (nextPhoto && !nextPhoto.fileSize) fetchFileSize(nextPhoto);
			}
		}
		// For filesize sorting, sizes are loaded in bulk, so no lazy loading needed
	}, [currentPhotoIndex, photos, sort, fetchFileSize]);

	// Animate confirmation screen when it appears
	useEffect(() => {
		if (currentPhotoIndex >= photos.length && photos.length > 0) {
			RNAnimated.parallel([
				RNAnimated.timing(confirmationOpacity, {
					toValue: 1,
					duration: 400,
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
	}, [currentPhotoIndex, photos.length, confirmationOpacity, confirmationTranslateY]);

	// Preload next 2 images/videos
	const preloadNextImages = useCallback(
		(currentIndex: number) => {
			const nextIndices = [];
			for (let i = 1; i <= 2; i++) {
				const nextIndex = currentIndex + i;
				if (nextIndex < photos.length) {
					nextIndices.push(nextIndex);
				}
			}
			nextIndices.forEach((index) => {
				if (!preloadedImages.has(index)) {
					// Only prefetch images, videos will load when needed
					if (photos[index].mediaType === 'photo') {
						Image.prefetch(photos[index].uri)
							.then(() => setPreloadedImages((prev) => new Set([...prev, index])))
							.catch(() => {});
					} else {
						// For videos, just mark as "preloaded" since we can't prefetch them
						setPreloadedImages((prev) => new Set([...prev, index]));
					}
				}
			});
		},
		[photos, preloadedImages]
	);

	useEffect(() => {
		if (photos.length > 0) preloadNextImages(currentPhotoIndex);
	}, [currentPhotoIndex, photos.length, preloadNextImages]);

	useEffect(() => {
		if (photos.length > 0) preloadNextImages(0);
	}, [photos.length, preloadNextImages]);

	// PanResponder (same as your original)
	const panResponder = useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => true,
			onPanResponderGrant: () => {
				pan.setOffset({ x: 0, y: 0 });
				pan.setValue({ x: 0, y: 0 });
			},
			onPanResponderMove: (_, gestureState) => {
				pan.setValue({ x: gestureState.dx, y: gestureState.dy });
				if (gestureState.dx < 0) setSwipeDirection('left');
				else if (gestureState.dx > 0) setSwipeDirection('right');
				rotation.setValue((gestureState.dx / screenWidth) * 10);
				const progress = Math.abs(gestureState.dx) / screenWidth;
				scale.setValue(1 - progress * 0.1);
				const swipeProgress = Math.min(Math.abs(gestureState.dx) / SWIPE_THRESHOLD, 1);
				overlayOpacity.setValue(swipeProgress);
				overlayScale.setValue(0.5 + swipeProgress * 0.5);
			},
			onPanResponderRelease: (_, gestureState) => {
				pan.flattenOffset();
				const shouldSwipeRight = gestureState.dx > SWIPE_THRESHOLD;
				const shouldSwipeLeft = gestureState.dx < -SWIPE_THRESHOLD;

				if (shouldSwipeRight || shouldSwipeLeft) {
					// Prevent multiple gestures during animation
					if (isProcessingDecision || isAnimating.current) {
						// Reset to original position if already processing
						RNAnimated.parallel([
							RNAnimated.spring(pan.x, { toValue: 0, useNativeDriver: false }),
							RNAnimated.spring(pan.y, { toValue: 0, useNativeDriver: false }),
							RNAnimated.spring(scale, { toValue: 1, useNativeDriver: false }),
							RNAnimated.spring(rotation, { toValue: 0, useNativeDriver: false }),
							RNAnimated.spring(overlayOpacity, {
								toValue: 0,
								useNativeDriver: false,
							}),
							RNAnimated.spring(overlayScale, {
								toValue: 0.5,
								useNativeDriver: false,
							}),
						]).start();
						return;
					}

					// Check if current photo already has a decision
					const photoIndex = currentPhotoIndexRef.current;
					if (swipeDecisionsRef.current.has(photoIndex)) {
						console.log('SWIPE GESTURE: Photo already has decision, resetting');
						// Reset to original position if already decided
						RNAnimated.parallel([
							RNAnimated.spring(pan.x, { toValue: 0, useNativeDriver: false }),
							RNAnimated.spring(pan.y, { toValue: 0, useNativeDriver: false }),
							RNAnimated.spring(scale, { toValue: 1, useNativeDriver: false }),
							RNAnimated.spring(rotation, { toValue: 0, useNativeDriver: false }),
							RNAnimated.spring(overlayOpacity, {
								toValue: 0,
								useNativeDriver: false,
							}),
							RNAnimated.spring(overlayScale, {
								toValue: 0.5,
								useNativeDriver: false,
							}),
						]).start();
						return;
					}

					const decision = shouldSwipeRight ? 'right' : 'left';

					console.log(
						`SWIPE GESTURE: Processing ${decision} swipe for photo ${photoIndex}`
					);

					// Set processing flag to prevent multiple gestures
					setIsProcessingDecision(true);
					isAnimating.current = true;

					// Record the decision immediately and ensure it's saved
					setSwipeDirection(decision);
					setSwipeDecisions((prev) => {
						const newMap = new Map(prev);
						newMap.set(photoIndex, decision);
						console.log(`SWIPE GESTURE: Photo ${photoIndex} -> ${decision}`);
						console.log(`SWIPE GESTURE: All decisions:`, Array.from(newMap.entries()));
						return newMap;
					});

					// Animate the swipe without throttling to ensure smooth experience
					RNAnimated.parallel([
						RNAnimated.timing(pan.x, {
							toValue: shouldSwipeRight ? screenWidth * 1.5 : -screenWidth * 1.5,
							duration: 200,
							useNativeDriver: false,
						}),
						RNAnimated.timing(pan.y, {
							toValue: 0,
							duration: 200,
							useNativeDriver: false,
						}),
						RNAnimated.timing(scale, {
							toValue: 0.8,
							duration: 200,
							useNativeDriver: false,
						}),
						RNAnimated.timing(rotation, {
							toValue: shouldSwipeRight ? 20 : -20,
							duration: 200,
							useNativeDriver: false,
						}),
						RNAnimated.timing(overlayOpacity, {
							toValue: 1,
							duration: 200,
							useNativeDriver: false,
						}),
						RNAnimated.timing(overlayScale, {
							toValue: 1,
							duration: 200,
							useNativeDriver: false,
						}),
					]).start(() => {
						// Always proceed after swipe gesture since decision is made
						proceedToNextPhoto();
					});
				} else {
					// Reset to original position if swipe wasn't far enough
					RNAnimated.parallel([
						RNAnimated.spring(pan.x, { toValue: 0, useNativeDriver: false }),
						RNAnimated.spring(pan.y, { toValue: 0, useNativeDriver: false }),
						RNAnimated.spring(scale, { toValue: 1, useNativeDriver: false }),
						RNAnimated.spring(rotation, { toValue: 0, useNativeDriver: false }),
						RNAnimated.spring(overlayOpacity, { toValue: 0, useNativeDriver: false }),
						RNAnimated.spring(overlayScale, { toValue: 0.5, useNativeDriver: false }),
					]).start();
				}
			},
		})
	).current;

	const animateNextPhoto = () => {
		console.log('=== ANIMATE NEXT PHOTO CALLED ===');
		console.log(`ANIMATE NEXT: Starting animation from photo ${currentPhotoIndex}`);
		console.log(`ANIMATE NEXT: Total photos: ${photos.length}`);

		RNAnimated.parallel([
			RNAnimated.timing(cardOpacity, { toValue: 0, duration: 100, useNativeDriver: false }),
			RNAnimated.timing(cardScale, { toValue: 0.95, duration: 100, useNativeDriver: false }),
		]).start(() => {
			console.log('ANIMATE NEXT: First animation phase completed');
			pan.setValue({ x: 0, y: 0 });
			overlayOpacity.setValue(0);
			overlayScale.setValue(0.5);
			setSwipeDirection(null);
			setCurrentPhotoIndex((prev) => {
				const newIndex = prev + 1;
				console.log(`ANIMATE NEXT: Photo index changed from ${prev} to ${newIndex}`);
				console.log(
					`ANIMATE NEXT: New index will be ${newIndex}, total photos: ${photos.length}`
				);
				return newIndex;
			});
			console.log('ANIMATE NEXT: Starting second animation phase');
			RNAnimated.parallel([
				RNAnimated.timing(cardOpacity, {
					toValue: 1,
					duration: 150,
					useNativeDriver: false,
				}),
				RNAnimated.spring(cardScale, {
					toValue: 1,
					tension: 120,
					friction: 6,
					useNativeDriver: false,
				}),
			]).start(() => {
				console.log('ANIMATE NEXT: Second animation phase completed');
			});
		});
	};

	const proceedToNextPhoto = () => {
		console.log('=== PROCEED TO NEXT PHOTO CALLED ===');
		console.log('currentPhotoIndex:', currentPhotoIndex);
		console.log('isProcessingDecision:', isProcessingDecision);
		console.log('isAnimating.current:', isAnimating.current);

		// Check if current photo has a decision before allowing progression
		const photoIndex = currentPhotoIndexRef.current;
		const hasDecision = swipeDecisionsRef.current.has(photoIndex);

		console.log(`PROCEEDING: Checking decision for photo ${photoIndex}`);
		console.log(`PROCEEDING: Has decision: ${hasDecision}`);
		console.log(
			`PROCEEDING: All decisions from ref:`,
			Array.from(swipeDecisionsRef.current.entries())
		);
		console.log(`PROCEEDING: All decisions from state:`, Array.from(swipeDecisions.entries()));

		if (!hasDecision) {
			console.log('PROCEEDING: No decision found, showing warning');
			// Show warning and don't proceed
			setShowDecisionWarning(true);
			setTimeout(() => setShowDecisionWarning(false), 2000);
			return;
		}

		console.log('PROCEEDING: Decision found, proceeding to next photo');

		// Direct progression when we know a decision has been made
		console.log(
			`PROCEEDING: Moving from photo ${currentPhotoIndex} to ${currentPhotoIndex + 1}`
		);
		console.log(
			`PROCEEDING: Current decision for photo ${currentPhotoIndex}:`,
			swipeDecisionsRef.current.get(currentPhotoIndex)
		);

		console.log('PROCEEDING: Resetting animation values');
		scale.setValue(1);
		rotation.setValue(0);

		console.log('PROCEEDING: Calling animateNextPhoto');
		animateNextPhoto();

		// Reset animation flag after a short delay to allow the next photo animation to complete
		setTimeout(() => {
			console.log('PROCEEDING: Resetting animation flags');
			isAnimating.current = false;
			setIsProcessingDecision(false);
		}, 300);
	};

	const handleSwipeLeft = () => {
		console.log('=== LEFT BUTTON CLICKED ===');
		console.log('isProcessingDecision:', isProcessingDecision);
		console.log('isAnimating.current:', isAnimating.current);
		console.log('currentPhotoIndex:', currentPhotoIndex);

		// Prevent multiple clicks during animation
		if (isProcessingDecision || isAnimating.current) {
			console.log('LEFT BUTTON: Blocked - already processing or animating');
			return;
		}

		// Check if current photo already has a decision
		const photoIndex = currentPhotoIndexRef.current;
		if (swipeDecisionsRef.current.has(photoIndex)) {
			console.log(
				'LEFT BUTTON: Blocked - photo already has decision:',
				swipeDecisionsRef.current.get(photoIndex)
			);
			return;
		}

		console.log('LEFT BUTTON: Proceeding with decision');

		// Set processing flag to prevent multiple clicks
		setIsProcessingDecision(true);
		isAnimating.current = true;

		// Record the decision immediately
		setSwipeDirection('left');
		setSwipeDecisions((prev) => {
			const newMap = new Map(prev);
			newMap.set(photoIndex, 'left');
			console.log(`LEFT BUTTON: Photo ${photoIndex} -> left`);
			console.log(`LEFT BUTTON: All decisions:`, Array.from(newMap.entries()));
			return newMap;
		});

		console.log('LEFT BUTTON: Starting animation...');
		RNAnimated.parallel([
			RNAnimated.timing(pan.x, {
				toValue: -screenWidth * 1.5,
				duration: 200,
				useNativeDriver: false,
			}),
			RNAnimated.timing(pan.y, { toValue: 0, duration: 200, useNativeDriver: false }),
			RNAnimated.timing(scale, { toValue: 0.8, duration: 200, useNativeDriver: false }),
			RNAnimated.timing(rotation, {
				toValue: -20,
				duration: 200,
				useNativeDriver: false,
			}),
			RNAnimated.timing(overlayOpacity, {
				toValue: 1,
				duration: 200,
				useNativeDriver: false,
			}),
			RNAnimated.timing(overlayScale, {
				toValue: 1,
				duration: 200,
				useNativeDriver: false,
			}),
		]).start(() => {
			console.log('LEFT BUTTON: Animation completed, calling proceedToNextPhoto');
			// Always proceed after button tap since decision is made
			proceedToNextPhoto();
		});
	};

	const handleSwipeRight = () => {
		console.log('=== RIGHT BUTTON CLICKED ===');
		console.log('isProcessingDecision:', isProcessingDecision);
		console.log('isAnimating.current:', isAnimating.current);
		console.log('currentPhotoIndex:', currentPhotoIndex);

		// Prevent multiple clicks during animation
		if (isProcessingDecision || isAnimating.current) {
			console.log('RIGHT BUTTON: Blocked - already processing or animating');
			return;
		}

		// Check if current photo already has a decision
		const photoIndex = currentPhotoIndexRef.current;
		if (swipeDecisionsRef.current.has(photoIndex)) {
			console.log(
				'RIGHT BUTTON: Blocked - photo already has decision:',
				swipeDecisionsRef.current.get(photoIndex)
			);
			return;
		}

		console.log('RIGHT BUTTON: Proceeding with decision');

		// Set processing flag to prevent multiple clicks
		setIsProcessingDecision(true);
		isAnimating.current = true;

		// Record the decision immediately
		setSwipeDirection('right');
		setSwipeDecisions((prev) => {
			const newMap = new Map(prev);
			newMap.set(photoIndex, 'right');
			console.log(`RIGHT BUTTON: Photo ${photoIndex} -> right`);
			console.log(`RIGHT BUTTON: All decisions:`, Array.from(newMap.entries()));
			return newMap;
		});

		RNAnimated.parallel([
			RNAnimated.timing(pan.x, {
				toValue: screenWidth * 1.5,
				duration: 200,
				useNativeDriver: false,
			}),
			RNAnimated.timing(pan.y, { toValue: 0, duration: 200, useNativeDriver: false }),
			RNAnimated.timing(scale, { toValue: 0.8, duration: 200, useNativeDriver: false }),
			RNAnimated.timing(rotation, { toValue: 20, duration: 200, useNativeDriver: false }),
			RNAnimated.timing(overlayOpacity, {
				toValue: 1,
				duration: 200,
				useNativeDriver: false,
			}),
			RNAnimated.timing(overlayScale, {
				toValue: 1,
				duration: 200,
				useNativeDriver: false,
			}),
		]).start(() => {
			console.log('RIGHT BUTTON: Animation completed, calling proceedToNextPhoto');
			// Always proceed after button tap since decision is made
			proceedToNextPhoto();
		});
	};

	const toggleDecision = (photoIndex: number) => {
		const currentDecision = swipeDecisions.get(photoIndex);
		let newDecision: 'left' | 'right';

		if (currentDecision === 'left') {
			newDecision = 'right';
		} else if (currentDecision === 'right') {
			newDecision = 'left';
		} else {
			newDecision = 'left';
		}

		setSwipeDecisions((prev) => {
			const newMap = new Map(prev);
			newMap.set(photoIndex, newDecision);
			return newMap;
		});
	};

	const goBackToPhotos = () => {
		Alert.alert(
			'Discard Decisions?',
			'Are you sure you want to go back? All your swipe decisions will be lost.',
			[
				{
					text: 'Keep Reviewing',
					style: 'cancel',
				},
				{
					text: 'Discard',
					style: 'destructive',
					onPress: async () => {
						// No longer saving files on navigation away

						// Reset animation values for smooth transition back to photos
						confirmationOpacity.setValue(0);
						confirmationTranslateY.setValue(50);

						// Reset photo card animations
						cardOpacity.setValue(1);
						cardScale.setValue(1);
						pan.setValue({ x: 0, y: 0 });
						scale.setValue(1);
						rotation.setValue(0);
						overlayOpacity.setValue(0);
						overlayScale.setValue(0.5);

						// Reset swipe direction state
						setSwipeDirection(null);

						// Use setTimeout to ensure state updates before animation reset
						setTimeout(() => {
							setCurrentPhotoIndex(0);
							setImageLoadErrors(new Set()); // Clear image load errors
						}, 50);
					},
				},
			]
		);
	};

	const showSuccessAnimationSequence = (count: number, storageSaved: number) => {
		console.log(
			`Success animation: ${count} files deleted, ${storageSaved.toFixed(2)} KB saved`
		);
		setDeletedCount(count);
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
						router.push('/');
					}, 1500);
				});
			}, 200);
		});
	};

	const handleDeletePhotos = async () => {
		const callId = Math.random().toString(36).substr(2, 9);
		console.log(`[${callId}] handleDeletePhotos called`);

		// Get photos marked for deletion (swipe left)
		const photosToDelete = photos.filter((_, index) => swipeDecisions.get(index) === 'left');

		try {
			const photoIds = photosToDelete.map((photo) => photo.id);
			const success = await deletePhotos(photoIds);

			if (success) {
				console.log(`[${callId}] Deletion successful, calling completeReviewSession`);
				// Complete the review session (saves files and increments total reviews)
				await completeReviewSession();

				// Calculate and save KB saved from deleted files
				const kbSaved = calculateKbSaved(photos, swipeDecisions);
				if (kbSaved > 0) {
					await addKbSaved(kbSaved);
					console.log(`Saved ${kbSaved.toFixed(2)} KB to total saved storage`);
				}

				showSuccessAnimationSequence(photosToDelete.length, kbSaved);
			} else {
				Alert.alert('Error', 'Failed to delete some files. Please try again.', [
					{ text: 'OK' },
				]);
			}
		} catch (error) {
			console.error('Error deleting photos:', error);
			Alert.alert('Error', 'An unexpected error occurred while deleting files.', [
				{ text: 'OK' },
			]);
		}
	};

	const animatedStyle = {
		opacity: cardOpacity,
		transform: [
			{ translateX: pan.x },
			{ translateY: pan.y },
			{ scale: RNAnimated.multiply(scale, cardScale) },
			{
				rotate: rotation.interpolate({
					inputRange: [-20, 0, 20],
					outputRange: ['-20deg', '0deg', '20deg'],
				}),
			},
		],
	};

	// Loading state
	if (isLoading) {
		return (
			<View className="flex-1 bg-primary/5 justify-center items-center px-6">
				<ActivityIndicator size="large" color="#3b82f6" />
				<ThemedText variant="title-lg" className="mt-4 text-gray-700 text-center">
					{sort === 'filesize'
						? 'Finding your largest photos...'
						: sort === 'videos'
							? 'Loading your videos...'
							: sort === 'duplicates'
								? 'Loading photos for duplicate detection...'
								: sort === 'blurry'
									? 'Finding your blurry photos...'
									: 'Loading your photos...'}
				</ThemedText>
				{sort === 'filesize' && (
					<ThemedText variant="body" className="mt-2 text-gray-600 text-center">
						Analyzing 25 photos for file sizes
					</ThemedText>
				)}
				{sort === 'blurry' && (
					<ThemedText variant="body" className="mt-2 text-gray-600 text-center">
						Analyzing 25 photos for blur detection
					</ThemedText>
				)}
			</View>
		);
	}

	// Session initialization loading state
	if (!sessionStarted && !showAdPrompt) {
		return (
			<View className="flex-1 bg-primary/5 justify-center items-center px-6">
				<ActivityIndicator size="large" color="#3b82f6" />
				<ThemedText variant="title-lg" className="mt-4 text-gray-700 text-center">
					Preparing your session...
				</ThemedText>
			</View>
		);
	}

	// Show analysis state when photos are loaded but sizes are being analyzed
	if ((sort === 'filesize' || sort === 'blurry') && isAnalyzingSizes && photos.length > 0) {
		return (
			<View className="flex-1 bg-primary/5 justify-center items-center px-6">
				<ActivityIndicator size="large" color="#3b82f6" />
				<ThemedText variant="title-lg" className="mt-4 text-gray-700 text-center">
					{sort === 'filesize' ? 'Analyzing file sizes...' : 'Analyzing blur levels...'}
				</ThemedText>
				<ThemedText variant="body" className="mt-2 text-gray-600 text-center">
					{sort === 'filesize'
						? `Sorting ${photos.length} files by size`
						: `Analyzing ${photos.length} files for blur detection`}
				</ThemedText>
			</View>
		);
	}

	// Error state
	if (error) {
		const isPermissionError =
			error.toLowerCase().includes('permission') || error.toLowerCase().includes('denied');
		const isICloudError =
			error.toLowerCase().includes('icloud') ||
			error.toLowerCase().includes('cloudphotolibrary');

		return (
			<View className="flex-1 bg-primary/5 justify-center items-center px-6">
				<View
					className="bg-white rounded-3xl p-8 items-center"
					style={{
						shadowColor: '#199dfe',
						shadowOffset: { width: 0, height: 2 },
						shadowOpacity: 0.25,
						shadowRadius: 3.84,
					}}
				>
					<Ionicons name="alert-circle" size={64} color="#ef4444" />
					<ThemedText variant="title-lg" bold className="mt-4 text-gray-800 text-center">
						{error}
					</ThemedText>

					{isICloudError && (
						<ThemedText variant="body" className="mt-4 text-gray-600 text-center">
							To fix this, go to Settings → [Your Name] → iCloud → Photos and make
							sure you&apos;re signed in.
						</ThemedText>
					)}

					{isPermissionError && (
						<TouchableOpacity
							onPress={openAppSettings}
							className="bg-blue-500 mt-6 px-6 py-3 rounded-xl w-full"
						>
							<ThemedText className="text-white font-semibold text-center">
								Open Settings
							</ThemedText>
						</TouchableOpacity>
					)}

					{isICloudError && (
						<TouchableOpacity
							onPress={reload}
							className="bg-blue-500 mt-6 px-6 py-3 rounded-xl w-full"
						>
							<ThemedText className="text-white font-semibold text-center">
								Try Again
							</ThemedText>
						</TouchableOpacity>
					)}

					<TouchableOpacity
						onPress={() => router.back()}
						className={`bg-gray-200 ${isPermissionError || isICloudError ? 'mt-4' : 'mt-6'} px-6 py-3 rounded-xl w-full`}
					>
						<ThemedText className="text-gray-700 font-semibold text-center">
							Go Back
						</ThemedText>
					</TouchableOpacity>
				</View>
			</View>
		);
	}

	// Check if too many images failed to load (indicating iCloud issue)
	const failedImageCount = imageLoadErrors.size;
	const totalPhotos = photos.length;
	const failureRate = totalPhotos > 0 ? failedImageCount / totalPhotos : 0;

	if (totalPhotos > 0 && failureRate > 0.5) {
		return (
			<View className="flex-1 bg-primary/5 justify-center items-center px-6">
				<View
					className="bg-white rounded-3xl p-8 items-center"
					style={{
						shadowColor: '#199dfe',
						shadowOffset: { width: 0, height: 2 },
						shadowOpacity: 0.25,
						shadowRadius: 3.84,
					}}
				>
					<Ionicons name="cloud-offline" size={64} color="#ef4444" />
					<ThemedText variant="title-lg" bold className="mt-4 text-gray-800 text-center">
						iCloud Files Detected
					</ThemedText>
					<ThemedText variant="body" className="mt-4 text-gray-600 text-center">
						Many of your files are stored in iCloud and require authentication. Please
						sign in to iCloud in Settings to access all your files.
					</ThemedText>
					<ThemedText variant="body" className="mt-2 text-gray-500 text-center text-sm">
						To fix this, go to Settings → [Your Name] → iCloud → Photos and make sure
						you&apos;re signed in.
					</ThemedText>

					<TouchableOpacity
						onPress={reload}
						className="bg-blue-500 mt-6 px-6 py-3 rounded-xl w-full"
					>
						<ThemedText className="text-white font-semibold text-center">
							Try Again
						</ThemedText>
					</TouchableOpacity>

					<TouchableOpacity
						onPress={() => router.back()}
						className="bg-gray-200 mt-4 px-6 py-3 rounded-xl w-full"
					>
						<ThemedText className="text-gray-700 font-semibold text-center">
							Go Back
						</ThemedText>
					</TouchableOpacity>
				</View>
			</View>
		);
	}

	// Check if we have photos and current index is valid
	if (photos.length === 0) {
		return (
			<View className="flex-1 bg-primary/5 justify-center items-center px-6">
				<View
					className="bg-white rounded-3xl p-8 items-center"
					style={{
						shadowColor: '#199dfe',
						shadowOffset: { width: 0, height: 2 },
						shadowOpacity: 0.25,
						shadowRadius: 3.84,
					}}
				>
					<Ionicons name="images-outline" size={64} color="#6b7280" />
					<ThemedText variant="title-lg" bold className="mt-4 text-gray-800 text-center">
						No files found
					</ThemedText>
					<TouchableOpacity
						onPress={() => router.back()}
						className="bg-gray-200 mt-6 px-6 py-3 rounded-xl w-full"
					>
						<ThemedText className="text-gray-700 font-semibold text-center">
							Go Back
						</ThemedText>
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

	// Ensure currentPhotoIndex is within bounds
	if (currentPhotoIndex >= photos.length) {
		// Debug: Log all decisions when showing confirmation screen
		console.log('=== CONFIRMATION SCREEN ===');
		console.log('Total photos:', photos.length);
		console.log('Current photo index:', currentPhotoIndex);
		console.log('All decisions:', Array.from(swipeDecisions.entries()));
		console.log('Decisions count:', swipeDecisions.size);
		photos.forEach((_, index) => {
			const decision = swipeDecisions.get(index);
			console.log(`Photo ${index}: ${decision || 'NO DECISION'}`);
		});
		console.log('========================');

		// Return confirmation screen directly instead of setting state
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
						{photos.map((photo, index) => {
							const decision = swipeDecisions.get(index);
							return (
								<TouchableOpacity
									key={index}
									onPress={() => toggleDecision(index)}
									className="w-[48%] aspect-square rounded-2xl overflow-hidden relative"
									style={{
										shadowColor: '#199dfe',
										shadowOffset: { width: 0, height: 2 },
										shadowOpacity: 0.25,
										shadowRadius: 3.84,
									}}
								>
									{imageLoadErrors.has(index) ? (
										<View className="w-full h-full bg-gray-200 items-center justify-center">
											<Ionicons
												name="cloud-offline"
												size={32}
												color="#6b7280"
											/>
											<ThemedText
												variant="body"
												className="mt-1 text-gray-600 text-center text-xs px-2"
											>
												iCloud Photo
											</ThemedText>
										</View>
									) : photo.mediaType === 'video' ? (
										<VideoComponent
											uri={photo.uri}
											assetId={photo.id}
											shouldPlay={index === currentPhotoIndex}
											className="w-full h-full"
										/>
									) : (
										<Image
											source={{ uri: photo.uri }}
											className="w-full h-full bg-gray-100"
											resizeMode="contain"
											onError={() => {
												setImageLoadErrors(
													(prev) => new Set([...prev, index])
												);
											}}
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
											decision === 'left' ? 'bg-black/60' : 'bg-black/10'
										}`}
									/>

									{/* Decision Indicator */}
									<View className="absolute top-2 right-2">
										{decision === 'left' && (
											<View className="bg-red-500 rounded-full p-2">
												<Ionicons name="close" size={16} color="white" />
											</View>
										)}
										{decision === 'right' && (
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
							onPress={handleDeletePhotos}
							className="flex-1 bg-primary py-4 rounded-xl"
						>
							<ThemedText extraBold className="text-white font-semibold text-center">
								Delete Files (
								{
									Array.from(swipeDecisions.values()).filter(
										(decision) => decision === 'left'
									).length
								}
								)
							</ThemedText>
						</TouchableOpacity>
					</View>
				</View>
			</RNAnimated.View>
		);
	}

	const currentPhoto = photos[currentPhotoIndex];

	// Final safety check
	if (!currentPhoto) {
		return (
			<View className="flex-1 bg-primary/5 justify-center items-center">
				<ActivityIndicator size="large" color="#3b82f6" />
				<ThemedText variant="title-lg" className="mt-4 text-gray-700">
					Loading photo...
				</ThemedText>
			</View>
		);
	}

	const sortText =
		sort === 'month'
			? 'This Month'
			: sort === 'filesize'
				? 'Largest Files'
				: sort === 'videos'
					? 'Videos Only'
					: sort === 'duplicates'
						? 'Duplicates'
						: sort === 'blurry'
							? 'Blurry Files'
							: sort === 'oldest'
								? 'Oldest Files'
								: sort === 'random'
									? 'Random Files'
									: 'Most Recent';

	return (
		<View className="flex-1 bg-primary/5">
			{/* Header */}
			<View className="bg-primary pb-8 px-6" style={{ paddingTop: insets.top + 16 }}>
				<View className="flex-row items-center gap-2">
					<TouchableOpacity
						className="flex-row items-center gap-2"
						onPress={async () => {
							// No longer saving files on navigation away
							router.push('/');
						}}
					>
						<AntDesign name="double-left" size={32} color="white" />
						<ThemedText
							extraBold
							variant="title-lg"
							className="text-gray-100 uppercase flex-1 text-nowrap whitespace-nowrap"
						>
							{sortText}
						</ThemedText>
					</TouchableOpacity>
				</View>
			</View>

			{/* Photo Counter */}
			<View className="px-6 pt-10">
				<ThemedText variant="title-lg" extraBold className="text-center text-gray-700">
					{currentPhotoIndex + 1} of {photos.length}
				</ThemedText>
			</View>

			{/* Photo Card */}
			<View className="flex-1 px-6 justify-center">
				<RNAnimated.View
					style={[
						animatedStyle,
						{
							shadowColor: '#199dfe',
							shadowOffset: { width: 0, height: 2 },
							shadowOpacity: 0.25,
							shadowRadius: 3.84,
						},
					]}
					className="w-full"
					{...panResponder.panHandlers}
				>
					<View className="bg-white rounded-3xl overflow-hidden relative">
						{imageLoadErrors.has(currentPhotoIndex) ? (
							<View
								className="w-full bg-gray-200 items-center justify-center"
								style={{ height: imageHeight }}
							>
								<Ionicons name="cloud-offline" size={64} color="#6b7280" />
								<ThemedText
									variant="body"
									className="mt-2 text-gray-600 text-center px-4"
								>
									Photo stored in iCloud{'\n'}Sign in to iCloud to view
								</ThemedText>
							</View>
						) : currentPhoto.mediaType === 'video' ? (
							<VideoComponent
								uri={currentPhoto.uri}
								assetId={currentPhoto.id}
								shouldPlay={true}
								className="w-full"
								style={{ height: imageHeight }}
							/>
						) : (
							<Image
								source={{ uri: currentPhoto.uri }}
								className="w-full bg-gray-100"
								style={{ height: imageHeight }}
								resizeMode="contain"
								onError={() => {
									setImageLoadErrors(
										(prev) => new Set([...prev, currentPhotoIndex])
									);
								}}
							/>
						)}

						{/* Video indicator for current photo */}
						{currentPhoto.mediaType === 'video' && (
							<View className="absolute top-4 left-4 bg-black/70 rounded-full p-2">
								<Ionicons name="play" size={20} color="white" />
							</View>
						)}

						{/* Video duration for current photo */}
						{currentPhoto.mediaType === 'video' && currentPhoto.duration && (
							<View className="absolute bottom-4 right-4 bg-black/70 rounded px-3 py-1">
								<ThemedText className="text-white text-sm">
									{formatDuration(currentPhoto.duration)}
								</ThemedText>
							</View>
						)}

						{/* Swipe Overlay */}
						<RNAnimated.View
							style={{
								opacity: overlayOpacity,
								transform: [{ scale: overlayScale }],
							}}
							className="absolute inset-0 items-center justify-center"
						>
							{swipeDirection === 'left' && (
								<View
									className="bg-red-500 rounded-full p-6 border-4 border-white "
									style={{
										shadowColor: '#199dfe',
										shadowOffset: { width: 0, height: 2 },
										shadowOpacity: 0.25,
										shadowRadius: 3.84,
									}}
								>
									<Ionicons name="close" size={48} color="white" />
								</View>
							)}
							{swipeDirection === 'right' && (
								<View
									className="bg-green-500 rounded-full p-6 border-4 border-white"
									style={{
										shadowColor: '#199dfe',
										shadowOffset: { width: 0, height: 2 },
										shadowOpacity: 0.25,
										shadowRadius: 3.84,
									}}
								>
									<Ionicons name="checkmark" size={48} color="white" />
								</View>
							)}
						</RNAnimated.View>

						{/* Decision Warning */}
						{showDecisionWarning && (
							<View className="absolute inset-0 items-center justify-center bg-black/50">
								<View className="bg-white rounded-2xl p-6 mx-8 items-center">
									<Ionicons name="warning" size={48} color="#f59e0b" />
									<ThemedText
										bold
										variant="title-lg"
										className="text-gray-800 mt-4 text-center"
									>
										Make a Decision First!
									</ThemedText>
									<ThemedText
										variant="body"
										className="text-gray-600 mt-2 text-center"
									>
										Swipe left to delete or right to keep this photo
									</ThemedText>
								</View>
							</View>
						)}

						<View className="p-6">
							<View className="flex-row items-center justify-between mb-2">
								<ThemedText bold variant="title-lg" className="text-gray-800">
									File {currentPhotoIndex + 1}
								</ThemedText>
								<View className="flex-row gap-2">
									{currentPhoto.fileSize && (
										<View className="bg-gray-100 px-3 py-1 rounded-full">
											<ThemedText
												variant="title-md"
												className="text-gray-800 !text-xl"
											>
												{currentPhoto.fileSize}
											</ThemedText>
										</View>
									)}
									{sort === 'blurry' && currentPhoto.blurScore !== undefined && (
										<View className="bg-orange-100 px-3 py-1 rounded-full">
											<ThemedText
												variant="title-md"
												className="text-orange-800 !text-xl"
											>
												{Math.round(currentPhoto.blurScore * 100)}% blur
											</ThemedText>
										</View>
									)}
								</View>
							</View>
							<ThemedText variant="body" className="text-gray-600">
								{currentPhoto.timestamp.toLocaleDateString()}
							</ThemedText>
						</View>
					</View>
				</RNAnimated.View>
			</View>

			{/* Action Buttons */}
			<View
				style={{ paddingBottom: insets.bottom + 8 }}
				className="px-6 flex-row justify-center space-x-8 flex gap-8"
			>
				<TouchableOpacity
					onPress={handleSwipeLeft}
					className={`bg-red-500 rounded-full items-center justify-center ${
						isVerySmallScreen ? 'w-20 h-20' : 'w-24 h-24'
					}`}
					style={{
						shadowColor: '#199dfe',
						shadowOffset: { width: 0, height: 2 },
						shadowOpacity: 0.25,
						shadowRadius: 3.84,
					}}
				>
					<Ionicons name="close" size={isVerySmallScreen ? 40 : 48} color="white" />
				</TouchableOpacity>
				<TouchableOpacity
					onPress={handleSwipeRight}
					className={`bg-green-500 rounded-full items-center justify-center ${
						isVerySmallScreen ? 'w-20 h-20' : 'w-24 h-24'
					}`}
					style={{
						shadowColor: '#199dfe',
						shadowOffset: { width: 0, height: 2 },
						shadowOpacity: 0.25,
						shadowRadius: 3.84,
					}}
				>
					<Ionicons name="heart" size={isVerySmallScreen ? 40 : 48} color="white" />
				</TouchableOpacity>
			</View>

			{/* Ad Prompt Overlay */}
			<AdPromptOverlay
				visible={showAdPrompt}
				onWatchAd={handleWatchAd}
				onSkip={handleSkipAd}
				isLoading={adLoading || adShowing || isAdShowing}
				sessionCount={sessionCount}
				hasError={adError}
				onContinue={handleContinueAfterError}
			/>
		</View>
	);
}
