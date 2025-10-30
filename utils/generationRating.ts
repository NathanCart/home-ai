import AsyncStorage from '@react-native-async-storage/async-storage';

const GENERATION_RATINGS_KEY = 'generation_ratings';

export type GenerationRating = 'thumbs-up' | 'thumbs-down' | null;

/**
 * Get rating for a specific generation image URL
 */
export const getGenerationRating = async (imageUrl: string): Promise<GenerationRating> => {
	try {
		const ratingsJson = await AsyncStorage.getItem(GENERATION_RATINGS_KEY);
		if (!ratingsJson) return null;

		const ratings: Record<string, GenerationRating> = JSON.parse(ratingsJson);
		return ratings[imageUrl] || null;
	} catch (error) {
		console.error('Error getting generation rating:', error);
		return null;
	}
};

/**
 * Save rating for a specific generation image URL
 */
export const saveGenerationRating = async (
	imageUrl: string,
	rating: GenerationRating
): Promise<void> => {
	try {
		const ratingsJson = await AsyncStorage.getItem(GENERATION_RATINGS_KEY);
		const ratings: Record<string, GenerationRating> = ratingsJson
			? JSON.parse(ratingsJson)
			: {};

		if (rating === null) {
			// Remove rating if null
			delete ratings[imageUrl];
		} else {
			ratings[imageUrl] = rating;
		}

		await AsyncStorage.setItem(GENERATION_RATINGS_KEY, JSON.stringify(ratings));
	} catch (error) {
		console.error('Error saving generation rating:', error);
	}
};
