import AsyncStorage from '@react-native-async-storage/async-storage';

const REVIEWED_FILES_KEY = 'reviewed_files';
const REVIEWED_DUPLICATE_GROUPS_KEY = 'reviewed_duplicate_groups';
const TOTAL_REVIEWS_KEY = 'total_reviews';
const TOTAL_KB_SAVED_KEY = 'total_kb_saved';

export interface ReviewedFile {
	id: string;
	reviewedAt: Date;
	sortType: string;
	decision: 'keep' | 'delete';
}

export interface ReviewedDuplicateGroup {
	groupId: string;
	photoIds: string[];
	reviewedAt: Date;
	decisions: Map<string, 'keep' | 'delete'>;
}

/**
 * Get all reviewed files from AsyncStorage
 */
export const getReviewedFiles = async (): Promise<ReviewedFile[]> => {
	try {
		const stored = await AsyncStorage.getItem(REVIEWED_FILES_KEY);
		if (!stored) {
			console.log('No reviewed files found in AsyncStorage');
			return [];
		}

		const parsed = JSON.parse(stored);
		console.log(`Found ${parsed.length} reviewed files in AsyncStorage`);
		// Convert date strings back to Date objects
		return parsed.map((file: any) => ({
			...file,
			reviewedAt: new Date(file.reviewedAt),
		}));
	} catch (error) {
		console.error('Error getting reviewed files:', error);
		return [];
	}
};

/**
 * Add files to the reviewed files list with their decisions
 */
export const addReviewedFiles = async (
	fileIds: string[],
	sortType: string,
	decisions?: Map<number, 'left' | 'right'>
): Promise<void> => {
	try {
		const existingFiles = await getReviewedFiles();
		const newFiles: ReviewedFile[] = fileIds.map((id, index) => {
			// If no decisions provided, default to 'keep' (user navigated away without making decisions)
			// If decisions provided, use the actual decision
			const decision = decisions
				? decisions.get(index) === 'left'
					? 'delete'
					: 'keep'
				: 'keep';

			return {
				id,
				reviewedAt: new Date(),
				sortType,
				decision,
			};
		});

		// Combine existing and new files, avoiding duplicates
		const allFiles = [...existingFiles, ...newFiles];
		const uniqueFiles = allFiles.filter(
			(file, index, self) => index === self.findIndex((f) => f.id === file.id)
		);

		await AsyncStorage.setItem(REVIEWED_FILES_KEY, JSON.stringify(uniqueFiles));
	} catch (error) {
		console.error('Error adding reviewed files:', error);
	}
};

/**
 * Check if a file has been reviewed
 */
export const isFileReviewed = async (fileId: string): Promise<boolean> => {
	try {
		const reviewedFiles = await getReviewedFiles();
		return reviewedFiles.some((file) => file.id === fileId);
	} catch (error) {
		console.error('Error checking if file is reviewed:', error);
		return false;
	}
};

/**
 * Get reviewed file IDs for a specific sort type
 */
export const getReviewedFileIdsForSort = async (sortType: string): Promise<string[]> => {
	try {
		const reviewedFiles = await getReviewedFiles();
		return reviewedFiles.filter((file) => file.sortType === sortType).map((file) => file.id);
	} catch (error) {
		console.error('Error getting reviewed files for sort:', error);
		return [];
	}
};

/**
 * Get kept files (files that were reviewed and kept)
 */
export const getKeptFiles = async (): Promise<ReviewedFile[]> => {
	try {
		const reviewedFiles = await getReviewedFiles();
		return reviewedFiles.filter((file) => file.decision === 'keep');
	} catch (error) {
		console.error('Error getting kept files:', error);
		return [];
	}
};

/**
 * Get kept files for a specific sort type
 */
export const getKeptFilesForSort = async (sortType: string): Promise<ReviewedFile[]> => {
	try {
		const reviewedFiles = await getReviewedFiles();
		return reviewedFiles.filter(
			(file) => file.sortType === sortType && file.decision === 'keep'
		);
	} catch (error) {
		console.error('Error getting kept files for sort:', error);
		return [];
	}
};

/**
 * Get deleted files (files that were reviewed and deleted)
 */
export const getDeletedFiles = async (): Promise<ReviewedFile[]> => {
	try {
		const reviewedFiles = await getReviewedFiles();
		return reviewedFiles.filter((file) => file.decision === 'delete');
	} catch (error) {
		console.error('Error getting deleted files:', error);
		return [];
	}
};

/**
 * Get total number of reviews completed
 */
export const getTotalReviews = async (): Promise<number> => {
	try {
		const stored = await AsyncStorage.getItem(TOTAL_REVIEWS_KEY);
		const value = stored ? parseInt(stored, 10) : 0;
		console.log(`getTotalReviews: returning ${value}`);
		return value;
	} catch (error) {
		console.error('Error getting total reviews:', error);
		return 0;
	}
};

/**
 * Increment total reviews count
 */
export const incrementTotalReviews = async (): Promise<void> => {
	try {
		const current = await getTotalReviews();
		const newValue = current + 1;
		await AsyncStorage.setItem(TOTAL_REVIEWS_KEY, newValue.toString());
		console.log(`incrementTotalReviews: ${current} -> ${newValue}`);
	} catch (error) {
		console.error('Error incrementing total reviews:', error);
	}
};

/**
 * Get total KB saved from deleted files
 */
export const getTotalKbSaved = async (): Promise<number> => {
	try {
		const stored = await AsyncStorage.getItem(TOTAL_KB_SAVED_KEY);
		return stored ? parseFloat(stored) : 0;
	} catch (error) {
		console.error('Error getting total KB saved:', error);
		return 0;
	}
};

/**
 * Add KB saved to the total
 */
export const addKbSaved = async (kbSaved: number): Promise<void> => {
	try {
		const current = await getTotalKbSaved();
		await AsyncStorage.setItem(TOTAL_KB_SAVED_KEY, (current + kbSaved).toString());
	} catch (error) {
		console.error('Error adding KB saved:', error);
	}
};

/**
 * Clear all reviewed files (useful for testing or reset)
 */
export const clearReviewedFiles = async (): Promise<void> => {
	try {
		await AsyncStorage.removeItem(REVIEWED_FILES_KEY);
		await AsyncStorage.removeItem(TOTAL_REVIEWS_KEY);
		await AsyncStorage.removeItem(TOTAL_KB_SAVED_KEY);
	} catch (error) {
		console.error('Error clearing reviewed files:', error);
	}
};

/**
 * Get statistics about reviewed files
 */
export const getReviewedFilesStats = async (): Promise<{
	total: number;
	bySortType: Record<string, number>;
	oldestReview: Date | null;
	newestReview: Date | null;
	totalReviews: number;
	totalKbSaved: number;
}> => {
	try {
		const [reviewedFiles, totalReviews, totalKbSaved] = await Promise.all([
			getReviewedFiles(),
			getTotalReviews(),
			getTotalKbSaved(),
		]);

		const bySortType: Record<string, number> = {};
		let oldestReview: Date | null = null;
		let newestReview: Date | null = null;

		reviewedFiles.forEach((file) => {
			bySortType[file.sortType] = (bySortType[file.sortType] || 0) + 1;

			if (!oldestReview || file.reviewedAt < oldestReview) {
				oldestReview = file.reviewedAt;
			}
			if (!newestReview || file.reviewedAt > newestReview) {
				newestReview = file.reviewedAt;
			}
		});

		return {
			total: reviewedFiles.length,
			bySortType,
			oldestReview,
			newestReview,
			totalReviews,
			totalKbSaved,
		};
	} catch (error) {
		console.error('Error getting reviewed files stats:', error);
		return {
			total: 0,
			bySortType: {},
			oldestReview: null,
			newestReview: null,
			totalReviews: 0,
			totalKbSaved: 0,
		};
	}
};

/**
 * Get all reviewed duplicate groups from AsyncStorage
 */
export const getReviewedDuplicateGroups = async (): Promise<ReviewedDuplicateGroup[]> => {
	try {
		const stored = await AsyncStorage.getItem(REVIEWED_DUPLICATE_GROUPS_KEY);
		if (!stored) {
			console.log('No reviewed duplicate groups found in AsyncStorage');
			return [];
		}

		const parsed = JSON.parse(stored);
		console.log(`Found ${parsed.length} reviewed duplicate groups in AsyncStorage`);
		// Convert date strings back to Date objects and Map objects
		return parsed.map((group: any) => ({
			...group,
			reviewedAt: new Date(group.reviewedAt),
			decisions: new Map(group.decisions),
		}));
	} catch (error) {
		console.error('Error getting reviewed duplicate groups:', error);
		return [];
	}
};

/**
 * Add a duplicate group to the reviewed groups list
 */
export const addReviewedDuplicateGroup = async (
	groupId: string,
	photoIds: string[],
	decisions: Map<string, 'keep' | 'delete'>
): Promise<void> => {
	try {
		const existingGroups = await getReviewedDuplicateGroups();
		const newGroup: ReviewedDuplicateGroup = {
			groupId,
			photoIds,
			reviewedAt: new Date(),
			decisions,
		};

		// Combine existing and new groups, avoiding duplicates by groupId
		const allGroups = [...existingGroups, newGroup];
		const uniqueGroups = allGroups.filter(
			(group, index, self) => index === self.findIndex((g) => g.groupId === group.groupId)
		);

		// Convert Map objects to arrays for JSON storage
		const groupsForStorage = uniqueGroups.map((group) => ({
			...group,
			decisions: Array.from(group.decisions.entries()),
		}));

		await AsyncStorage.setItem(REVIEWED_DUPLICATE_GROUPS_KEY, JSON.stringify(groupsForStorage));
		console.log(`Added duplicate group ${groupId} to reviewed groups`);
	} catch (error) {
		console.error('Error adding reviewed duplicate group:', error);
	}
};

/**
 * Check if a duplicate group has been reviewed
 */
export const isDuplicateGroupReviewed = async (groupId: string): Promise<boolean> => {
	try {
		const reviewedGroups = await getReviewedDuplicateGroups();
		return reviewedGroups.some((group) => group.groupId === groupId);
	} catch (error) {
		console.error('Error checking if duplicate group is reviewed:', error);
		return false;
	}
};

/**
 * Get reviewed photo IDs from duplicate groups
 */
export const getReviewedPhotoIdsFromDuplicates = async (): Promise<string[]> => {
	try {
		const reviewedGroups = await getReviewedDuplicateGroups();
		const allPhotoIds = new Set<string>();

		reviewedGroups.forEach((group) => {
			group.photoIds.forEach((photoId) => allPhotoIds.add(photoId));
		});

		return Array.from(allPhotoIds);
	} catch (error) {
		console.error('Error getting reviewed photo IDs from duplicates:', error);
		return [];
	}
};

/**
 * Clear all reviewed duplicate groups (useful for testing or reset)
 */
export const clearReviewedDuplicateGroups = async (): Promise<void> => {
	try {
		await AsyncStorage.removeItem(REVIEWED_DUPLICATE_GROUPS_KEY);
		console.log('Cleared all reviewed duplicate groups');
	} catch (error) {
		console.error('Error clearing reviewed duplicate groups:', error);
	}
};
