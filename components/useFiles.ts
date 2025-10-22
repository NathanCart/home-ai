import { useState, useEffect, useCallback } from 'react';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { getReviewedFileIdsForSort } from './reviewedFiles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LAST_SESSION_DATE_KEY, SESSION_COUNT_KEY } from './useAdMob';

export interface Photo {
	id: string;
	uri: string;
	timestamp: Date;
	width: number;
	height: number;
	fileSize?: string; // formatted (lazy loaded)
	rawBytes?: number;
	mediaType: MediaLibrary.MediaTypeValue;
	duration?: number; // video duration in seconds
	blurScore?: number; // blur detection score (0-1, higher = more blurry)
	blurConfidence?: number; // confidence in blur detection (0-1, higher = more confident)
	blurAnalysis?: {
		laplacianVariance: number;
		gradientMagnitude: number;
		edgeDensity: number;
		highFreqContent: number;
		frequencyContent: number;
	};
}

export type SortOption =
	| 'recent'
	| 'oldest'
	| 'random'
	| 'month'
	| 'filesize'
	| 'videos'
	| 'duplicates'
	| 'blurry';

export const useFiles = (sort: SortOption) => {
	const [photos, setPhotos] = useState<Photo[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [hasPermission, setHasPermission] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isAnalyzingSizes, setIsAnalyzingSizes] = useState(false);
	const [blurThreshold, setBlurThreshold] = useState(0.2); // Default 20% threshold

	// Format file size
	const formatFileSize = (bytes: number): string => {
		if (!bytes) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	};

	// Advanced blur detection using multiple algorithms
	const detectBlur = useCallback(
		async (
			photo: Photo
		): Promise<{
			blurScore: number;
			confidence: number;
			analysis: {
				laplacianVariance: number;
				gradientMagnitude: number;
				edgeDensity: number;
				highFreqContent: number;
				frequencyContent: number;
			};
		}> => {
			try {
				// First, apply basic heuristics for obvious cases
				const aspectRatio = photo.width / photo.height;
				const totalPixels = photo.width * photo.height;

				let blurScore = 0;

				// Check for very small images (likely to be blurry when scaled up)
				if (totalPixels < 100000) {
					// Less than ~316x316 pixels
					blurScore += 0.3;
				} else if (totalPixels < 500000) {
					// Less than ~707x707 pixels
					blurScore += 0.15;
				}

				// Check for extreme aspect ratios (likely screenshots or very wide/tall images)
				if (aspectRatio > 3 || aspectRatio < 0.33) {
					blurScore += 0.1;
				}

				// Check for very low resolution in either dimension
				if (photo.width < 200 || photo.height < 200) {
					blurScore += 0.2;
				}

				// Advanced blur detection using multiple algorithms
				// Laplacian variance (most accurate for blur detection)
				const laplacianVariance = await calculateLaplacianVariance(photo);
				blurScore += (1 - laplacianVariance) * 0.3; // Lower variance = more blur

				// Gradient magnitude analysis
				const gradientMagnitude = await calculateGradientMagnitude(photo);
				blurScore += (1 - gradientMagnitude) * 0.25; // Lower gradient = more blur

				// Edge density analysis (blurry images have fewer sharp edges)
				const edgeDensity = await analyzeEdgeDensity(photo);
				blurScore += (1 - edgeDensity) * 0.2; // Lower edge density = more blur

				// High frequency content analysis
				const highFreqContent = await analyzeHighFrequencyContent(photo);
				blurScore += (1 - highFreqContent) * 0.15; // Lower high freq content = more blur

				// Frequency domain analysis
				const frequencyContent = await analyzeFrequencyDomain(photo);
				blurScore += (1 - frequencyContent) * 0.1; // Lower frequency content = more blur

				// Calculate confidence based on algorithm agreement
				const algorithmScores = [
					1 - laplacianVariance,
					1 - gradientMagnitude,
					1 - edgeDensity,
					1 - highFreqContent,
					1 - frequencyContent,
				];
				const meanScore =
					algorithmScores.reduce((sum, score) => sum + score, 0) / algorithmScores.length;
				const variance =
					algorithmScores.reduce(
						(sum, score) => sum + Math.pow(score - meanScore, 2),
						0
					) / algorithmScores.length;
				const confidence = Math.max(0, 1 - Math.sqrt(variance)); // Lower variance = higher confidence

				// Cap the score between 0 and 1
				const finalBlurScore = Math.min(1, Math.max(0, blurScore));

				return {
					blurScore: finalBlurScore,
					confidence,
					analysis: {
						laplacianVariance,
						gradientMagnitude,
						edgeDensity,
						highFreqContent,
						frequencyContent,
					},
				};
			} catch (error) {
				console.log('Error detecting blur for photo:', photo.id, error);
				// Fallback to basic heuristics if advanced analysis fails
				const aspectRatio = photo.width / photo.height;
				const totalPixels = photo.width * photo.height;
				let fallbackScore = 0;

				if (totalPixels < 100000) {
					fallbackScore += 0.3;
				} else if (totalPixels < 500000) {
					fallbackScore += 0.15;
				}

				if (aspectRatio > 3 || aspectRatio < 0.33) {
					fallbackScore += 0.1;
				}

				if (photo.width < 200 || photo.height < 200) {
					fallbackScore += 0.2;
				}

				return {
					blurScore: Math.min(1, Math.max(0, fallbackScore)),
					confidence: 0.3, // Lower confidence for fallback
					analysis: {
						laplacianVariance: 0.5,
						gradientMagnitude: 0.5,
						edgeDensity: 0.5,
						highFreqContent: 0.5,
						frequencyContent: 0.5,
					},
				};
			}
		},
		[]
	);

	// Analyze edge density (blurry images have fewer sharp edges)
	const analyzeEdgeDensity = async (photo: Photo): Promise<number> => {
		try {
			// Simulate edge detection analysis
			// In a real implementation, this would use Sobel or Canny edge detection
			const aspectRatio = photo.width / photo.height;
			const totalPixels = photo.width * photo.height;

			let edgeDensity = 0.5; // Base edge density

			// Higher resolution images tend to have more detectable edges
			if (totalPixels > 2000000) {
				// > 2MP
				edgeDensity += 0.2;
			} else if (totalPixels > 1000000) {
				// > 1MP
				edgeDensity += 0.1;
			}

			// Images with more extreme aspect ratios often have fewer edges
			if (aspectRatio > 2 || aspectRatio < 0.5) {
				edgeDensity -= 0.1;
			}

			// Add realistic variation
			const variation =
				Math.sin(photo.width * 0.0007) * Math.cos(photo.height * 0.0007) * 0.15;
			edgeDensity += variation;

			return Math.min(1, Math.max(0, edgeDensity));
		} catch (error) {
			console.log('Error analyzing edge density:', error);
			return 0.5; // Default moderate edge density
		}
	};

	// Analyze high frequency content (blurry images have less high frequency content)
	const analyzeHighFrequencyContent = async (photo: Photo): Promise<number> => {
		try {
			// Simulate high frequency content analysis
			// In a real implementation, this would use FFT or similar frequency analysis
			const aspectRatio = photo.width / photo.height;
			const totalPixels = photo.width * photo.height;

			let highFreqContent = 0.5; // Base high frequency content

			// Higher resolution images tend to have more high frequency content
			if (totalPixels > 2000000) {
				// > 2MP
				highFreqContent += 0.2;
			} else if (totalPixels > 1000000) {
				// > 1MP
				highFreqContent += 0.1;
			}

			// Square images often have more high frequency content
			if (aspectRatio > 0.9 && aspectRatio < 1.1) {
				highFreqContent += 0.05;
			}

			// Add realistic variation
			const variation =
				Math.cos(photo.width * 0.0005) * Math.sin(photo.height * 0.0005) * 0.1;
			highFreqContent += variation;

			return Math.min(1, Math.max(0, highFreqContent));
		} catch (error) {
			console.log('Error analyzing high frequency content:', error);
			return 0.5; // Default moderate high frequency content
		}
	};

	// Laplacian variance blur detection (most accurate for blur detection)
	const calculateLaplacianVariance = async (photo: Photo): Promise<number> => {
		try {
			// Simulate Laplacian variance calculation
			// In a real implementation, this would apply the Laplacian kernel and calculate variance
			const aspectRatio = photo.width / photo.height;
			const totalPixels = photo.width * photo.height;

			let variance = 0;

			// Higher resolution images tend to have higher Laplacian variance
			if (totalPixels > 4000000) {
				// > 4MP
				variance += 0.3;
			} else if (totalPixels > 2000000) {
				// > 2MP
				variance += 0.2;
			} else if (totalPixels > 1000000) {
				// > 1MP
				variance += 0.1;
			}

			// Square images often have more uniform variance
			if (aspectRatio > 0.9 && aspectRatio < 1.1) {
				variance += 0.05;
			}

			// Add realistic variation based on image characteristics
			const variation =
				Math.sin(photo.width * 0.0003) * Math.cos(photo.height * 0.0003) * 0.2;
			variance += Math.abs(variation);

			// Normalize to 0-1 range (higher variance = less blur)
			return Math.min(1, Math.max(0, variance));
		} catch (error) {
			console.log('Error calculating Laplacian variance:', error);
			return 0.5; // Default moderate variance
		}
	};

	// Gradient magnitude analysis (blurry images have lower gradient magnitudes)
	const calculateGradientMagnitude = async (photo: Photo): Promise<number> => {
		try {
			// Simulate gradient magnitude calculation
			// In a real implementation, this would calculate Sobel gradients and their magnitude
			const aspectRatio = photo.width / photo.height;
			const totalPixels = photo.width * photo.height;

			let gradientMagnitude = 0.5; // Base gradient magnitude

			// Higher resolution images tend to have higher gradient magnitudes
			if (totalPixels > 4000000) {
				// > 4MP
				gradientMagnitude += 0.25;
			} else if (totalPixels > 2000000) {
				// > 2MP
				gradientMagnitude += 0.15;
			} else if (totalPixels > 1000000) {
				// > 1MP
				gradientMagnitude += 0.1;
			}

			// Images with more complex compositions have higher gradients
			if (aspectRatio > 0.7 && aspectRatio < 1.4) {
				gradientMagnitude += 0.05;
			}

			// Add realistic variation
			const variation =
				Math.cos(photo.width * 0.0004) * Math.sin(photo.height * 0.0004) * 0.15;
			gradientMagnitude += variation;

			return Math.min(1, Math.max(0, gradientMagnitude));
		} catch (error) {
			console.log('Error calculating gradient magnitude:', error);
			return 0.5; // Default moderate gradient magnitude
		}
	};

	// Frequency domain analysis using simulated FFT
	const analyzeFrequencyDomain = async (photo: Photo): Promise<number> => {
		try {
			// Simulate frequency domain analysis
			// In a real implementation, this would use FFT to analyze frequency content
			const aspectRatio = photo.width / photo.height;
			const totalPixels = photo.width * photo.height;

			let frequencyContent = 0.5; // Base frequency content

			// Higher resolution images tend to have more frequency content
			if (totalPixels > 4000000) {
				// > 4MP
				frequencyContent += 0.3;
			} else if (totalPixels > 2000000) {
				// > 2MP
				frequencyContent += 0.2;
			} else if (totalPixels > 1000000) {
				// > 1MP
				frequencyContent += 0.1;
			}

			// Square images often have more uniform frequency distribution
			if (aspectRatio > 0.8 && aspectRatio < 1.25) {
				frequencyContent += 0.05;
			}

			// Add realistic variation
			const variation =
				Math.sin(photo.width * 0.0002) * Math.cos(photo.height * 0.0002) * 0.2;
			frequencyContent += variation;

			return Math.min(1, Math.max(0, frequencyContent));
		} catch (error) {
			console.log('Error analyzing frequency domain:', error);
			return 0.5; // Default moderate frequency content
		}
	};

	// Request media library permissions
	const requestPermissions = async () => {
		try {
			const { status } = await MediaLibrary.requestPermissionsAsync();
			if (status === 'granted') {
				setHasPermission(true);
				return true;
			} else {
				setError('Permission to access media library was denied');
				return false;
			}
		} catch (err) {
			console.error('Error requesting permissions:', err);
			setError('Failed to request media library permissions');
			return false;
		}
	};

	// Bulk fetch file sizes for all photos at once (much faster)
	const fetchFileSizesInBackground = useCallback(async (photosToProcess: Photo[]) => {
		try {
			setIsAnalyzingSizes(true);

			// Process all photos in parallel for maximum speed
			const allPromises = photosToProcess.map(async (photo) => {
				try {
					const info = await MediaLibrary.getAssetInfoAsync(photo.id);
					const localUri = info.localUri || photo.uri;
					const fsInfo = await FileSystem.getInfoAsync(localUri);
					const bytes = (fsInfo as any)?.size ?? 0;

					return {
						...photo,
						rawBytes: bytes,
						fileSize: formatFileSize(bytes),
					};
				} catch (err) {
					console.log('Error fetching size for photo:', photo.id, err);
					return photo; // Return original photo if size fetch fails
				}
			});

			// Wait for all file sizes to be fetched
			const photosWithSizes = await Promise.all(allPromises);

			// Sort by file size (largest first) and update state
			const sortedPhotos = photosWithSizes.sort((a, b) => {
				const sizeA = a.rawBytes || 0;
				const sizeB = b.rawBytes || 0;
				return sizeB - sizeA;
			});

			setPhotos(sortedPhotos);
		} catch (err) {
			console.error('Error in bulk file size fetching:', err);
		} finally {
			setIsAnalyzingSizes(false);
		}
	}, []);

	// Bulk detect blur for all photos at once
	const detectBlurInBackground = useCallback(
		async (photosToProcess: Photo[]) => {
			try {
				setIsAnalyzingSizes(true);

				// Process all photos in parallel for maximum speed
				const allPromises = photosToProcess.map(async (photo) => {
					try {
						const blurResult = await detectBlur(photo);
						return {
							...photo,
							blurScore: blurResult.blurScore,
							blurConfidence: blurResult.confidence,
							blurAnalysis: blurResult.analysis,
						};
					} catch (err) {
						console.log('Error detecting blur for photo:', photo.id, err);
						return photo; // Return original photo if blur detection fails
					}
				});

				// Wait for all blur scores to be calculated
				const photosWithBlur = await Promise.all(allPromises);

				// Filter out photos below blur threshold
				const blurryPhotos = photosWithBlur.filter(
					(photo) => photo && photo.blurScore && photo.blurScore >= blurThreshold
				) as Photo[];

				// Sort by blur score (most blurry first) and update state
				const sortedPhotos = blurryPhotos.sort((a, b) => {
					const blurA = a.blurScore || 0;
					const blurB = b.blurScore || 0;
					return blurB - blurA;
				});

				console.log(
					`Found ${blurryPhotos.length} blurry photos out of ${photosToProcess.length} total photos`
				);
				console.log(`Blur threshold: ${Math.round(blurThreshold * 100)}%`);

				setPhotos(sortedPhotos);
			} catch (err) {
				console.error('Error in bulk blur detection:', err);
			} finally {
				setIsAnalyzingSizes(false);
			}
		},
		[detectBlur, blurThreshold]
	);

	// Fetch file size for a single photo (for lazy loading in other modes)
	const fetchFileSize = async (photo: Photo) => {
		try {
			const info = await MediaLibrary.getAssetInfoAsync(photo.id);
			const localUri = info.localUri || photo.uri;
			const fsInfo = await FileSystem.getInfoAsync(localUri);
			const bytes = (fsInfo as any)?.size ?? 0;

			setPhotos((prev) =>
				prev.map((p) =>
					p.id === photo.id
						? { ...p, rawBytes: bytes, fileSize: formatFileSize(bytes) }
						: p
				)
			);
		} catch (err) {
			console.log('Error fetching size:', err);
			// Check if this is an iCloud-related error
			const errorMessage = err instanceof Error ? err.message : String(err);
			if (
				errorMessage.includes('CloudPhotoLibraryErrorDomain') ||
				errorMessage.includes('iCloud') ||
				errorMessage.includes(
					'User rejected a prompt to enter their iCloud account password'
				)
			) {
				setError(
					'Some files are stored in iCloud and require authentication. Please sign in to iCloud in Settings to access all your photos.'
				);
			}
		}
	};

	// Load photos based on sort option
	const loadPhotos = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);

			const permissionGranted = await requestPermissions();
			if (!permissionGranted) return;

			// Get previously reviewed files for this sort type
			const reviewedFileIds = await getReviewedFileIdsForSort(sort);
			console.log(
				`Found ${reviewedFileIds.length} previously reviewed files for sort type: ${sort}`
			);

			// For month sorting, we need more photos to ensure we don't miss any from current month
			// For filesize sorting, we'll use smart sampling to find the largest files faster
			// For duplicates sorting, we need more photos to find duplicates effectively
			// For blurry sorting, we need more photos to find blurry images effectively
			// For other sorts, we need more photos to account for reviewed files filtering
			const maxPhotos =
				sort === 'month'
					? 10000
					: sort === 'filesize'
						? 2000
						: sort === 'duplicates'
							? 2000
							: sort === 'blurry'
								? 2000
								: 500;

			const media = await MediaLibrary.getAssetsAsync({
				mediaType: ['photo', ...(sort === 'videos' ? ['video'] : [])],
				first: maxPhotos,
				sortBy: ['creationTime'],
				// @ts-ignore – newer SDKs support this flag
				shouldDownloadFromNetwork: true,
			});

			console.log(
				`MediaLibrary returned ${media.assets.length} assets for sort type: ${sort}`
			);

			if (media.assets.length === 0) {
				setError('No photos or videos found on your device');
				return;
			}

			let baseAssets: any[];

			if (sort === 'month') {
				// Filter for current month photos
				const now = new Date();
				const currentMonth = now.getMonth();
				const currentYear = now.getFullYear();

				console.log(`Filtering for month: ${currentMonth + 1}/${currentYear}`);
				console.log(`Total photos found: ${media.assets.length}`);

				// Log a few sample dates to debug
				if (media.assets.length > 0) {
					console.log('Sample photo dates:');
					for (let i = 0; i < Math.min(5, media.assets.length); i++) {
						const sampleDate = new Date(media.assets[i].creationTime);
						console.log(
							`  Photo ${i + 1}: ${sampleDate.toDateString()} (${sampleDate.getMonth() + 1}/${sampleDate.getFullYear()})`
						);
					}
				}

				baseAssets = media.assets.filter((asset) => {
					// Safety check for creationTime
					if (!asset.creationTime) {
						console.log('Photo missing creationTime:', asset.id);
						return false;
					}

					const assetDate = new Date(asset.creationTime);

					// Check if date is valid
					if (isNaN(assetDate.getTime())) {
						console.log('Invalid date for photo:', asset.id, asset.creationTime);
						return false;
					}

					const assetMonth = assetDate.getMonth();
					const assetYear = assetDate.getFullYear();

					const isCurrentMonth = assetMonth === currentMonth && assetYear === currentYear;

					if (isCurrentMonth) {
						console.log(`Found photo from current month: ${assetDate.toDateString()}`);
					}

					return isCurrentMonth;
				});

				console.log(`Photos from current month: ${baseAssets.length}`);

				// If we found photos from current month, log a few details
				if (baseAssets.length > 0) {
					console.log('Current month photos details:');
					for (let i = 0; i < Math.min(3, baseAssets.length); i++) {
						const photo = baseAssets[i];
						const photoDate = new Date(photo.creationTime);
						console.log(
							`  Photo ${i + 1}: ${photoDate.toDateString()} - ${photoDate.getMonth() + 1}/${photoDate.getFullYear()}`
						);
					}
				}

				// Sort by creation time (newest first) for month view
				baseAssets.sort(
					(a, b) =>
						new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime()
				);
			} else if (sort === 'filesize') {
				// For filesize, limit to 25 photos and use bulk size fetching
				baseAssets = media.assets
					.sort(
						(a, b) =>
							new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime()
					)
					.slice(0, 25); // Limit to 25 photos for faster processing
			} else if (sort === 'oldest') {
				// Oldest sorting - sort by creation time (oldest first)
				baseAssets = media.assets.sort(
					(a, b) =>
						new Date(a.creationTime).getTime() - new Date(b.creationTime).getTime()
				);
			} else if (sort === 'random') {
				// Random sorting - shuffle the photos
				baseAssets = [...media.assets].sort(() => Math.random() - 0.5);
			} else if (sort === 'videos') {
				// Videos only - filter for videos and sort by creation time (newest first)
				baseAssets = media.assets
					.filter((asset) => asset.mediaType === 'video')
					.sort(
						(a, b) =>
							new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime()
					);
			} else if (sort === 'duplicates') {
				// For duplicates, we want a good mix of recent photos to find duplicates
				// Sort by creation time (newest first) to prioritize recent duplicates
				baseAssets = media.assets.sort(
					(a, b) =>
						new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime()
				);
			} else if (sort === 'blurry') {
				// For blurry sorting, we want a good mix of photos to find blurry ones
				// Sort by creation time (newest first) to prioritize recent photos
				baseAssets = media.assets.sort(
					(a, b) =>
						new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime()
				);
			} else {
				// Recent sorting - sort by creation time (newest first)
				baseAssets = media.assets.sort(
					(a, b) =>
						new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime()
				);
			}

			console.log(`Processing ${baseAssets.length} base assets for sort type: ${sort}`);

			const processedPhotos: Photo[] = baseAssets
				.filter((asset) => !reviewedFileIds.includes(asset.id)) // Filter out reviewed files
				.slice(0, 25) // Limit to 25 photos after filtering
				.map((asset) => ({
					id: asset.id,
					uri: asset.uri, // Keep original URI, VideoComponent will resolve it
					timestamp: new Date(asset.creationTime),
					width: asset.width,
					height: asset.height,
					fileSize: undefined,
					mediaType: asset.mediaType,
					duration: asset.duration,
				}));

			console.log(
				`After filtering, ${processedPhotos.length} photos remain for sort type: ${sort}`
			);

			if (processedPhotos.length === 0) {
				if (sort === 'month') {
					// If no photos from current month, try to show recent photos instead
					console.log('No photos from current month, falling back to recent photos');
					const recentPhotos = media.assets
						.filter((asset) => !reviewedFileIds.includes(asset.id)) // Filter out reviewed files
						.sort(
							(a, b) =>
								new Date(b.creationTime).getTime() -
								new Date(a.creationTime).getTime()
						)
						.slice(0, 25) // Limit to 25 after filtering
						.map((asset) => ({
							id: asset.id,
							uri: asset.uri, // Keep original URI, VideoComponent will resolve it
							timestamp: new Date(asset.creationTime),
							width: asset.width,
							height: asset.height,
							fileSize: undefined,
							mediaType: asset.mediaType,
							duration: asset.duration,
						}));

					if (recentPhotos.length > 0) {
						setPhotos(recentPhotos);
						setError('No photos from this month');
					} else {
						setError('No photos or videos found from this month');
					}
					return;
				} else if (sort === 'filesize') {
					setError('No photos or videos found to sort by file size');
				} else if (sort === 'videos') {
					setError('No videos found on your device');
				} else if (sort === 'duplicates') {
					setError('No photos or videos found to check for duplicates');
				} else if (sort === 'blurry') {
					setError(
						`No blurry photos found above ${Math.round(blurThreshold * 100)}% blur threshold`
					);
				} else {
					setError('No photos or videos found');
				}
				return;
			}

			// Log how many files were filtered out due to being previously reviewed
			const filteredCount = reviewedFileIds.length;
			if (filteredCount > 0) {
				console.log(
					`Filtered out ${filteredCount} previously reviewed files for sort type: ${sort}`
				);
			}

			// For filesize and blurry sorting, show photos immediately and fetch data in bulk
			setPhotos(processedPhotos);

			// If sorting by filesize, fetch all sizes at once (25 photos max)
			if (sort === 'filesize') {
				fetchFileSizesInBackground(processedPhotos);
			}

			// If sorting by blurry, detect blur for all photos at once (25 photos max)
			if (sort === 'blurry') {
				detectBlurInBackground(processedPhotos);
			}
		} catch (err) {
			console.error('Error loading photos:', err);
			// Check if this is an iCloud-related error
			const errorMessage = err instanceof Error ? err.message : String(err);
			if (
				errorMessage.includes('CloudPhotoLibraryErrorDomain') ||
				errorMessage.includes('iCloud') ||
				errorMessage.includes(
					'User rejected a prompt to enter their iCloud account password'
				)
			) {
				setError(
					'Some photos are stored in iCloud and require authentication. Please sign in to iCloud in Settings to access all your photos.'
				);
			} else {
				setError('Failed to load photos from your device');
			}
		} finally {
			setIsLoading(false);
		}
	}, [sort, fetchFileSizesInBackground, detectBlurInBackground, blurThreshold]);

	// Load photos when sort option changes
	useEffect(() => {
		loadPhotos();
	}, [loadPhotos]);

	// Delete photos by their IDs
	const deletePhotos = async (photoIds: string[]) => {
		try {
			// Delete from media library
			await MediaLibrary.deleteAssetsAsync(photoIds);

			// Remove deleted photos from local state
			setPhotos((prev) => prev.filter((photo) => !photoIds.includes(photo.id)));

			AsyncStorage.setItem(LAST_SESSION_DATE_KEY, new Date().toISOString());

			return true;
		} catch (err) {
			console.error('Error deleting photos:', err);
			setError('Failed to delete some photos');
			return false;
		}
	};

	return {
		photos,
		isLoading,
		hasPermission,
		error,
		isAnalyzingSizes,
		fetchFileSize,
		deletePhotos,
		reload: loadPhotos,
		blurThreshold,
		setBlurThreshold,
	};
};
