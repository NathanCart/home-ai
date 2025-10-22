import * as FileSystem from 'expo-file-system';
import { Photo } from './useFiles';
import { getReviewedPhotoIdsFromDuplicates } from './reviewedFiles';

export interface DuplicateGroup {
	id: string;
	photos: Photo[];
	similarity: number;
}

export interface DuplicateDetectionOptions {
	similarityThreshold?: number; // 0-1, higher = more strict
	maxPhotos?: number; // Maximum photos to analyze
	minGroupSize?: number; // Minimum photos in a group to be considered duplicates
}

// Calculate file hash for exact duplicate detection
const calculateFileHash = async (uri: string): Promise<string | null> => {
	try {
		const fileInfo = await FileSystem.getInfoAsync(uri);
		if (!fileInfo.exists) return null;

		// For now, we'll use a combination of file size and modification time as a simple hash
		// In a production app, you'd want to use a proper hash like MD5 or SHA-256
		const size = (fileInfo as any)?.size || 0;
		const modificationTime = (fileInfo as any)?.modificationTime || 0;
		return `${size}-${modificationTime}`;
	} catch (error) {
		console.error('Error calculating file hash:', error);
		return null;
	}
};

// Calculate visual similarity based on dimensions and creation time proximity
const calculateVisualSimilarity = (photo1: Photo, photo2: Photo): number => {
	// Check if dimensions are similar (within 10% tolerance)
	const widthDiff = Math.abs(photo1.width - photo2.width) / Math.max(photo1.width, photo2.width);
	const heightDiff =
		Math.abs(photo1.height - photo2.height) / Math.max(photo1.height, photo2.height);
	const dimensionSimilarity = 1 - (widthDiff + heightDiff) / 2;

	// Check if creation times are close (within 5 minutes)
	const timeDiff = Math.abs(photo1.timestamp.getTime() - photo2.timestamp.getTime());
	const timeSimilarity =
		timeDiff < 5 * 60 * 1000 ? 1 : Math.max(0, 1 - timeDiff / (60 * 60 * 1000)); // Decay over 1 hour

	// Check if media types match
	const typeSimilarity = photo1.mediaType === photo2.mediaType ? 1 : 0;

	// Weighted combination
	return dimensionSimilarity * 0.4 + timeSimilarity * 0.4 + typeSimilarity * 0.2;
};

// Find duplicate groups using multiple detection methods
export const findDuplicates = async (
	photos: Photo[],
	options: DuplicateDetectionOptions = {},
	excludeReviewedGroups: boolean = true
): Promise<DuplicateGroup[]> => {
	const { similarityThreshold = 0.7, maxPhotos = 1000, minGroupSize = 2 } = options;

	console.log(`Starting duplicate detection for ${photos.length} photos`);

	// Limit photos for performance
	let photosToAnalyze = photos.slice(0, maxPhotos);

	// Filter out photos that have already been reviewed in duplicate groups
	if (excludeReviewedGroups) {
		try {
			const reviewedPhotoIds = await getReviewedPhotoIdsFromDuplicates();
			const reviewedSet = new Set(reviewedPhotoIds);

			photosToAnalyze = photosToAnalyze.filter((photo) => !reviewedSet.has(photo.id));
			console.log(
				`Filtered out ${photos.slice(0, maxPhotos).length - photosToAnalyze.length} already reviewed photos`
			);
		} catch (error) {
			console.error('Error filtering reviewed photos:', error);
		}
	}

	console.log(`Analyzing ${photosToAnalyze.length} photos for duplicates`);

	const duplicateGroups: DuplicateGroup[] = [];
	const processedPhotos = new Set<string>();

	// First pass: Find exact duplicates by file hash
	const hashGroups = new Map<string, Photo[]>();

	for (const photo of photosToAnalyze) {
		if (processedPhotos.has(photo.id)) continue;

		try {
			const hash = await calculateFileHash(photo.uri);
			if (!hash) continue;

			if (!hashGroups.has(hash)) {
				hashGroups.set(hash, []);
			}
			hashGroups.get(hash)!.push(photo);
		} catch (error) {
			console.error('Error processing photo for hash:', photo.id, error);
		}
	}

	// Add exact duplicate groups
	for (const [hash, groupPhotos] of hashGroups) {
		if (groupPhotos.length >= minGroupSize) {
			// Sort photos by creation time for consistent group ID
			const sortedPhotos = groupPhotos.sort(
				(a, b) => a.timestamp.getTime() - b.timestamp.getTime()
			);
			const photoIds = sortedPhotos.map((p) => p.id).sort();
			const groupId = `exact-${photoIds.join('-')}`;

			duplicateGroups.push({
				id: groupId,
				photos: sortedPhotos,
				similarity: 1.0,
			});
			groupPhotos.forEach((photo) => processedPhotos.add(photo.id));
		}
	}

	console.log(`Found ${duplicateGroups.length} exact duplicate groups`);

	// Second pass: Find visual duplicates
	for (let i = 0; i < photosToAnalyze.length; i++) {
		const photo1 = photosToAnalyze[i];
		if (processedPhotos.has(photo1.id)) continue;

		const similarPhotos: Photo[] = [photo1];

		for (let j = i + 1; j < photosToAnalyze.length; j++) {
			const photo2 = photosToAnalyze[j];
			if (processedPhotos.has(photo2.id)) continue;

			const similarity = calculateVisualSimilarity(photo1, photo2);

			if (similarity >= similarityThreshold) {
				similarPhotos.push(photo2);
			}
		}

		// If we found similar photos, create a group
		if (similarPhotos.length >= minGroupSize) {
			// Sort by creation time (newest first) for better UX
			similarPhotos.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

			// Create stable group ID based on all photo IDs
			const photoIds = similarPhotos.map((p) => p.id).sort();
			const groupId = `visual-${photoIds.join('-')}`;

			duplicateGroups.push({
				id: groupId,
				photos: similarPhotos,
				similarity: similarityThreshold,
			});

			similarPhotos.forEach((photo) => processedPhotos.add(photo.id));
		}
	}

	console.log(`Found ${duplicateGroups.length} total duplicate groups`);

	// Sort groups by similarity and group size
	duplicateGroups.sort((a, b) => {
		if (a.similarity !== b.similarity) {
			return b.similarity - a.similarity; // Higher similarity first
		}
		return b.photos.length - a.photos.length; // Larger groups first
	});

	return duplicateGroups;
};

// Get photos that are not in any duplicate group
export const getNonDuplicatePhotos = (
	photos: Photo[],
	duplicateGroups: DuplicateGroup[]
): Photo[] => {
	const duplicatePhotoIds = new Set<string>();

	duplicateGroups.forEach((group) => {
		group.photos.forEach((photo) => {
			duplicatePhotoIds.add(photo.id);
		});
	});

	return photos.filter((photo) => !duplicatePhotoIds.has(photo.id));
};

// Calculate storage savings from removing duplicates
export const calculateStorageSavings = (duplicateGroups: DuplicateGroup[]): number => {
	let totalBytes = 0;

	duplicateGroups.forEach((group) => {
		// Keep the first photo (newest), remove the rest
		const photosToRemove = group.photos.slice(1);
		photosToRemove.forEach((photo) => {
			totalBytes += photo.rawBytes || 0;
		});
	});

	return totalBytes;
};
