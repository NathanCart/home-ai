import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { ThemedText } from '../ThemedText';
import { CustomButton } from '../CustomButton';
import { Octicons } from '@expo/vector-icons';
import { StepConfig } from '../../config/stepConfig';
import colorPalettesData from '../../data/colorPalettes.json';

interface ColorPaletteStepProps {
	onPaletteSelect?: (palette: ColorPalette | null) => void;
	config: StepConfig;
	selectedPalette?: ColorPalette | null;
	selectedStyle?: string | null;
}

interface ColorPalette {
	id: string;
	title: string;
	userName: string;
	numViews: number;
	numVotes: number;
	numComments: number;
	colors: string[];
	description?: string;
	recommendedFor?: string[];
}

interface ColourLoversPalette {
	id: number;
	title: string;
	userName: string;
	numViews: number;
	numVotes: number;
	numComments: number;
	colors: string[];
	description: string;
	dateCreated: string;
	apiUrl: string;
	imageUrl: string;
	badgeUrl: string;
	tags: Array<{
		id: number;
		tag: string;
	}>;
}

export function ColorPaletteStep({
	onPaletteSelect,
	config,
	selectedPalette,
	selectedStyle,
}: ColorPaletteStepProps) {
	const [palettes, setPalettes] = useState<ColorPalette[]>([]);
	const [filteredPalettes, setFilteredPalettes] = useState<ColorPalette[]>([]);
	const [recommendedPalettes, setRecommendedPalettes] = useState<ColorPalette[]>([]);
	const [selectedPaletteId, setSelectedPaletteId] = useState<string | null>(
		selectedPalette?.id || null
	);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedCategory, setSelectedCategory] = useState<string>('all');

	// Load color palettes from JSON file
	useEffect(() => {
		loadColorPalettes();
	}, []);

	const loadColorPalettes = async () => {
		try {
			setIsLoading(true);
			setError(null);

			// Load palettes from JSON file
			const allPalettes: ColorPalette[] = [];

			// Flatten all color categories into a single array
			Object.values(colorPalettesData).forEach((categoryPalettes: any[]) => {
				allPalettes.push(...categoryPalettes);
			});

			setPalettes(allPalettes);
			setFilteredPalettes(allPalettes);
		} catch (error) {
			console.error('Error loading color palettes:', error);
			setError('Failed to load color palettes. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	// Filter recommended palettes based on selected style and category
	useEffect(() => {
		if (selectedStyle && palettes.length > 0) {
			let recommended = palettes.filter((palette) =>
				palette.recommendedFor?.includes(selectedStyle.toLowerCase())
			);

			// If a specific category is selected (not "all"), filter recommended palettes by that category
			if (selectedCategory !== 'all') {
				const categoryPalettes =
					colorPalettesData[selectedCategory as keyof typeof colorPalettesData] || [];
				const categoryPaletteIds = categoryPalettes.map((p) => p.id);
				recommended = recommended.filter((palette) =>
					categoryPaletteIds.includes(palette.id)
				);
			}

			setRecommendedPalettes(recommended);
		} else {
			setRecommendedPalettes([]);
		}
	}, [selectedStyle, palettes, selectedCategory]);

	// Filter palettes by category
	useEffect(() => {
		if (selectedCategory === 'all') {
			setFilteredPalettes(palettes);
		} else {
			const categoryPalettes =
				colorPalettesData[selectedCategory as keyof typeof colorPalettesData] || [];
			setFilteredPalettes(categoryPalettes);
		}
	}, [selectedCategory, palettes]);

	const handlePalettePress = (palette: ColorPalette) => {
		setSelectedPaletteId(palette.id);
		onPaletteSelect?.(palette);
	};

	// Convert style id to display name
	const getStyleDisplayName = (styleId: string) => {
		const styleMap: { [key: string]: string } = {
			modern: 'Modern',
			bohemian: 'Bohemian',
			'dark-academia': 'Dark Academia',
			'dark-behemian': 'Dark Bohemian',
			scandinavian: 'Scandinavian',
			industrial: 'Industrial',
			traditional: 'Traditional',
			minimalist: 'Minimalist',
			rustic: 'Rustic',
			contemporary: 'Contemporary',
			tropical: 'Tropical',
			'art-deco': 'Art Deco',
			'modern-farmhouse': 'Modern Farmhouse',
			coastal: 'Coastal',
			japandi: 'Japanese',
			'french-country': 'French Country',
			'shabby-chic': 'Shabby Chic',
			transitional: 'Transitional',
		};
		return styleMap[styleId] || styleId;
	};

	const renderPaletteCard = (palette: ColorPalette, isRecommended: boolean = false) => {
		const isSelected = selectedPaletteId === palette.id;

		return (
			<TouchableOpacity
				key={palette.id}
				onPress={() => handlePalettePress(palette)}
				className={`w-full mb-4 rounded-2xl overflow-hidden border-2 ${
					isSelected ? 'border-blue-500' : 'border-gray-200'
				}`}
				activeOpacity={0.8}
			>
				<View className="bg-white">
					{/* Color Palette Bar - Traditional Design Tool Style */}
					<View className="flex-row h-24">
						{palette.colors.map((color, index) => (
							<View
								key={index}
								className="flex-1"
								style={{ backgroundColor: color }}
							/>
						))}
						{isRecommended && (
							<View className="absolute top-2 right-2 z-10 flex-row items-center bg-gray-50 border border-gray-200 rounded-full px-2 py-1">
								<ThemedText
									variant="body"
									className="text-gray-900 font-medium text-xs"
								>
									Recommended
								</ThemedText>
							</View>
						)}
					</View>

					{/* Palette Info */}
					<View className="p-4">
						<View className="flex-row items-center justify-between">
							<View className="flex-row items-center flex-1">
								<ThemedText variant="title-md" className="!text-lg" extraBold>
									{palette.title}
								</ThemedText>
							</View>

							{isSelected && (
								<View className="w-6 h-6 bg-blue-500 rounded-full items-center justify-center">
									<Octicons name="check" size={14} color="white" />
								</View>
							)}
						</View>

						{palette.description && (
							<ThemedText variant="body" className="text-gray-600 !text-base">
								{palette.description}
							</ThemedText>
						)}
					</View>
				</View>
			</TouchableOpacity>
		);
	};

	if (isLoading) {
		return (
			<View className="flex-1 px-6 items-center justify-center">
				<ActivityIndicator size="large" color="#3B82F6" />
				<ThemedText variant="body" className="text-gray-600 mt-4">
					Loading color palettes...
				</ThemedText>
			</View>
		);
	}

	return (
		<View className="flex-1">
			<View className="items-start mb-6  px-6">
				<ThemedText variant="title-md" className="text-gray-900 mb-2 text-center" extraBold>
					{config.title}
				</ThemedText>
				<ThemedText variant="body" className="text-gray-600">
					{config.description}
				</ThemedText>
			</View>

			{error && (
				<View className="bg-orange-100 rounded-2xl p-4 mb-6  px-6">
					<View className="flex-row items-center">
						<Octicons name="alert" size={20} color="#F59E0B" />
						<ThemedText variant="body" className="text-orange-800 ml-2 flex-1">
							{error}
						</ThemedText>
						<TouchableOpacity
							onPress={loadColorPalettes}
							className="ml-2 p-2"
							activeOpacity={0.7}
						>
							<Octicons name="sync" size={16} color="#F59E0B" />
						</TouchableOpacity>
					</View>
				</View>
			)}

			{/* Category Filter */}
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				className="mb-4"
				contentContainerStyle={{ paddingLeft: 18, paddingRight: 24 }}
			>
				<View className="flex-row gap-2">
					{[
						'all',
						'classic',
						'blues',
						'greens',
						'purples',
						'pinks',
						'oranges',
						'yellows',
						'reds',
						'grays',
						'browns',
						'teals',
						'multicolor',
					].map((category) => (
						<TouchableOpacity
							key={category}
							onPress={() => setSelectedCategory(category)}
							className={`px-4 py-2 rounded-full ${
								selectedCategory === category ? 'bg-gray-900' : 'bg-gray-200'
							}`}
							activeOpacity={0.7}
						>
							<ThemedText
								variant="body"
								className={`text-sm font-medium ${
									selectedCategory === category ? 'text-white' : 'text-gray-700'
								}`}
							>
								{category === 'all'
									? 'All'
									: category.charAt(0).toUpperCase() + category.slice(1)}
							</ThemedText>
						</TouchableOpacity>
					))}
				</View>
			</ScrollView>

			<ScrollView
				className="flex-1  px-6"
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: 100 }}
			>
				{/* Recommended Palettes Section */}
				{recommendedPalettes.length > 0 && (
					<View className="mb-6">
						<ThemedText variant="title-md" className="text-gray-900 mb-4" extraBold>
							Recommended for{' '}
							{selectedStyle ? getStyleDisplayName(selectedStyle) : ''}
						</ThemedText>
						{recommendedPalettes.map((palette) => renderPaletteCard(palette, true))}
					</View>
				)}

				{/* All Palettes Section */}
				{recommendedPalettes.length > 0 && (
					<ThemedText variant="title-sm" className="!text-gray-900 mb-2" bold>
						All Palettes
					</ThemedText>
				)}
				{filteredPalettes.map((palette) => renderPaletteCard(palette, false))}
			</ScrollView>
		</View>
	);
}
