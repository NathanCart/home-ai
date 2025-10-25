import React, { useState, useEffect } from 'react';
import {
	View,
	TouchableOpacity,
	ScrollView,
	Alert,
	ActivityIndicator,
	Modal,
	TextInput,
} from 'react-native';
import { ThemedText } from '../ThemedText';
import { CustomButton } from '../CustomButton';
import { Octicons } from '@expo/vector-icons';
import { StepConfig } from '../../config/stepConfig';
import colorPalettesData from '../../data/colorPalettes.json';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ColorPicker, { Panel1, HueSlider } from 'reanimated-color-picker';
import { runOnJS } from 'react-native-reanimated';

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

	// Custom palette states
	const [customPalettes, setCustomPalettes] = useState<ColorPalette[]>([]);
	const [showAddModal, setShowAddModal] = useState<boolean>(false);
	const [showEditModal, setShowEditModal] = useState<boolean>(false);
	const [newPaletteName, setNewPaletteName] = useState<string>('');
	const [newPaletteColors, setNewPaletteColors] = useState<string[]>([
		'#FFFFFF',
		'#CCCCCC',
		'#999999',
		'#666666',
		'#000000',
	]);
	const [editingPalette, setEditingPalette] = useState<ColorPalette | null>(null);
	const [editPaletteName, setEditPaletteName] = useState<string>('');
	const [editPaletteColors, setEditPaletteColors] = useState<string[]>([]);

	// Color picker states - default to first color selected
	const [editingColorIndex, setEditingColorIndex] = useState<number | null>(0);
	const [isEditMode, setIsEditMode] = useState<boolean>(false);

	// Load color palettes from JSON file
	useEffect(() => {
		loadColorPalettes();
		loadCustomPalettes();
	}, []);

	const loadCustomPalettes = async () => {
		try {
			const stored = await AsyncStorage.getItem('customColorPalettes');
			if (stored) {
				const custom = JSON.parse(stored);
				setCustomPalettes(custom);
			}
		} catch (error) {
			console.error('Error loading custom palettes:', error);
		}
	};

	const saveCustomPalettes = async (palettes: ColorPalette[]) => {
		try {
			await AsyncStorage.setItem('customColorPalettes', JSON.stringify(palettes));
			setCustomPalettes(palettes);
		} catch (error) {
			console.error('Error saving custom palettes:', error);
			Alert.alert('Error', 'Failed to save custom palette');
		}
	};

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

	// Custom palette functions
	const handleAddCustomPalette = () => {
		if (!newPaletteName.trim()) {
			Alert.alert('Error', 'Please enter a palette name');
			return;
		}

		const newPalette: ColorPalette = {
			id: `custom-${Date.now()}`,
			title: newPaletteName.trim(),
			userName: 'You',
			numViews: 0,
			numVotes: 0,
			numComments: 0,
			colors: newPaletteColors,
			description: 'Custom palette',
		};

		const updated = [...customPalettes, newPalette];
		saveCustomPalettes(updated);
		setNewPaletteName('');
		setNewPaletteColors(['#FFFFFF', '#CCCCCC', '#999999', '#666666', '#000000']);
		setEditingColorIndex(null);
		setShowAddModal(false);
	};

	const handleUpdatePalette = () => {
		if (!editPaletteName.trim() || !editingPalette) {
			Alert.alert('Error', 'Please enter a palette name');
			return;
		}

		const updated = customPalettes.map((p) =>
			p.id === editingPalette.id
				? { ...p, title: editPaletteName.trim(), colors: editPaletteColors }
				: p
		);

		saveCustomPalettes(updated);
		setEditingColorIndex(null);
		setShowEditModal(false);
		setEditingPalette(null);
	};

	const handleLongPress = (palette: ColorPalette) => {
		if (palette.id.startsWith('custom-')) {
			setEditingPalette(palette);
			setEditPaletteName(palette.title);
			setEditPaletteColors([...palette.colors]);
			setEditingColorIndex(0);
			setIsEditMode(true);
			setShowEditModal(true);
		}
	};

	const handleDeletePalette = () => {
		if (!editingPalette) return;

		Alert.alert(
			'Delete Palette',
			`Are you sure you want to delete "${editingPalette.title}"?`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: () => {
						const updated = customPalettes.filter((p) => p.id !== editingPalette.id);
						saveCustomPalettes(updated);
						if (selectedPaletteId === editingPalette.id) {
							setSelectedPaletteId(null);
							onPaletteSelect?.(null);
						}
						setShowEditModal(false);
						setEditingPalette(null);
					},
				},
			]
		);
	};

	const handleColorSelect = (index: number) => {
		setEditingColorIndex(index);
	};

	const updateColorInPlace = (hex: string) => {
		if (editingColorIndex === null) return;

		if (isEditMode) {
			const updated = [...editPaletteColors];
			updated[editingColorIndex] = hex;
			setEditPaletteColors(updated);
		} else {
			const updated = [...newPaletteColors];
			updated[editingColorIndex] = hex;
			setNewPaletteColors(updated);
		}
	};

	const handleColorChange = ({ hex }: { hex: string }) => {
		'worklet';
		runOnJS(updateColorInPlace)(hex);
	};

	const renderPaletteCard = (palette: ColorPalette, isRecommended: boolean = false) => {
		const isSelected = selectedPaletteId === palette.id;
		const isCustom = palette.id.startsWith('custom-');

		return (
			<TouchableOpacity
				key={palette.id}
				onPress={() => handlePalettePress(palette)}
				onLongPress={() => handleLongPress(palette)}
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

			{/* Add Custom Palette Button */}
			<View className="px-6 mb-4">
				<CustomButton
					title="Custom Palette"
					onPress={() => {
						setEditingColorIndex(0);
						setIsEditMode(false);
						setShowAddModal(true);
					}}
					variant="primary"
					size="sm"
					icon="plus"
				/>
			</View>

			<ScrollView
				className="flex-1  px-6"
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: 100 }}
			>
				{/* Custom Palettes Section */}
				{customPalettes.length > 0 && (
					<View className="mb-6">
						<ThemedText variant="title-sm" className="text-gray-900 mb-2" extraBold>
							Your Custom Palettes
						</ThemedText>
						{customPalettes.map((palette) => renderPaletteCard(palette, false))}
					</View>
				)}

				{/* Recommended Palettes Section */}
				{recommendedPalettes.length > 0 && (
					<View className="mb-6">
						<ThemedText variant="title-sm" className="text-gray-900 mb-2" extraBold>
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

			{/* Add Palette Modal */}
			<Modal
				visible={showAddModal}
				transparent={true}
				animationType="fade"
				onRequestClose={() => setShowAddModal(false)}
			>
				<View className="flex-1 bg-black/50 justify-center items-center px-6">
					<TouchableOpacity
						className="absolute inset-0"
						activeOpacity={1}
						onPress={() => setShowAddModal(false)}
					/>
					<View className="bg-white rounded-2xl p-4 w-full relative">
						<TouchableOpacity
							onPress={() => setShowAddModal(false)}
							className="absolute top-4 right-4 z-10"
							activeOpacity={0.7}
						>
							<Octicons name="x" size={20} color="#6B7280" />
						</TouchableOpacity>
						<ThemedText variant="title-md" className="text-gray-900" extraBold>
							Add Custom Palette
						</ThemedText>
						<ThemedText variant="body" className="text-gray-600 mb-3">
							Enter the name and colors for the palette you want to add
						</ThemedText>

						<TextInput
							value={newPaletteName}
							onChangeText={setNewPaletteName}
							placeholder="e.g., Warm Neutrals, Ocean Blues, etc."
							className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 mb-4 text-gray-900"
							placeholderTextColor="#9CA3AF"
							autoFocus
						/>
						<ThemedText variant="body" className="text-gray-600 mb-2">
							Colors (tap to select color to edit)
						</ThemedText>

						<View className="mb-4 rounded-xl overflow-hidden border-2 border-gray-200">
							<View className="flex-row h-20">
								{newPaletteColors.map((color, index) => (
									<TouchableOpacity
										key={index}
										className="flex-1 relative"
										style={{ backgroundColor: color }}
										activeOpacity={0.7}
										onPress={() => {
											setIsEditMode(false);
											handleColorSelect(index);
										}}
									>
										{editingColorIndex === index && !isEditMode && (
											<View className="absolute inset-0 border-4 border-blue-500" />
										)}
									</TouchableOpacity>
								))}
							</View>
						</View>

						{editingColorIndex !== null && !isEditMode && (
							<View className="mb-4">
								<ThemedText variant="body" className="text-gray-600 mb-2">
									Adjust Color
								</ThemedText>
								<View style={{ width: '100%' }}>
									<ColorPicker
										style={{ width: '100%' }}
										value={newPaletteColors[editingColorIndex]}
										onComplete={handleColorChange}
									>
										<Panel1
											style={{ width: '100%', height: 200, marginBottom: 12 }}
										/>
										<HueSlider style={{ width: '100%', height: 40 }} />
									</ColorPicker>
								</View>
							</View>
						)}

						<View className="flex-row gap-2 mb-8">
							<CustomButton
								title="Cancel"
								onPress={() => setShowAddModal(false)}
								variant="ghost"
								size="sm"
								className="flex-1"
							/>
							<CustomButton
								title="Add"
								onPress={handleAddCustomPalette}
								variant="primary"
								size="sm"
								className="flex-1"
								disabled={!newPaletteName.trim()}
							/>
						</View>
					</View>
				</View>
			</Modal>

			{/* Edit Palette Modal */}
			<Modal
				visible={showEditModal}
				transparent={true}
				animationType="fade"
				onRequestClose={() => setShowEditModal(false)}
			>
				<View className="flex-1 bg-black/50 justify-center items-center px-6">
					<TouchableOpacity
						className="absolute inset-0"
						activeOpacity={1}
						onPress={() => setShowEditModal(false)}
					/>
					<View className="bg-white rounded-2xl p-4 w-full relative">
						<TouchableOpacity
							onPress={() => setShowEditModal(false)}
							className="absolute top-4 right-4 z-10"
							activeOpacity={0.7}
						>
							<Octicons name="x" size={20} color="#6B7280" />
						</TouchableOpacity>

						<ThemedText variant="title-md" className="text-gray-900" extraBold>
							Edit Palette
						</ThemedText>
						<ThemedText variant="body" className="text-gray-600 mb-3">
							Update the name and colors for this palette
						</ThemedText>

						<TextInput
							value={editPaletteName}
							onChangeText={setEditPaletteName}
							placeholder="e.g., Warm Neutrals, Ocean Blues, etc."
							className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 mb-4 text-gray-900"
							placeholderTextColor="#9CA3AF"
							autoFocus
						/>

						<ThemedText variant="body" className="text-gray-600 mb-2">
							Colors (tap to select color to edit)
						</ThemedText>
						<View className="mb-4 rounded-xl overflow-hidden border-2 border-gray-200">
							<View className="flex-row h-20">
								{editPaletteColors.map((color, index) => (
									<TouchableOpacity
										key={index}
										className="flex-1 relative"
										style={{ backgroundColor: color }}
										activeOpacity={0.7}
										onPress={() => {
											setIsEditMode(true);
											handleColorSelect(index);
										}}
									>
										{editingColorIndex === index && isEditMode && (
											<View className="absolute inset-0 border-4 border-blue-500" />
										)}
									</TouchableOpacity>
								))}
							</View>
						</View>

						{editingColorIndex !== null && isEditMode && (
							<View className="mb-4">
								<ThemedText variant="body" className="text-gray-600 mb-2">
									Adjust Color
								</ThemedText>
								<View style={{ width: '100%' }}>
									<ColorPicker
										style={{ width: '100%' }}
										value={editPaletteColors[editingColorIndex]}
										onComplete={handleColorChange}
									>
										<Panel1
											style={{ width: '100%', height: 200, marginBottom: 12 }}
										/>
										<HueSlider style={{ width: '100%', height: 40 }} />
									</ColorPicker>
								</View>
							</View>
						)}

						<View className="flex-row gap-2 mb-8">
							<CustomButton
								title="Delete"
								onPress={handleDeletePalette}
								variant="ghost"
								size="sm"
								className="flex-1"
							/>
							<CustomButton
								title="Save"
								onPress={handleUpdatePalette}
								variant="primary"
								size="sm"
								className="flex-1"
								disabled={!editPaletteName.trim()}
							/>
						</View>
					</View>
				</View>
			</Modal>
		</View>
	);
}
