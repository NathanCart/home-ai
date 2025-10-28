import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { ThemedText } from '../ThemedText';
import { StepConfig } from '../../config/stepConfig';

interface ColorStepProps {
	onColorSelect?: (color: Color | null) => void;
	config: StepConfig;
	selectedColor?: Color | null;
	compact?: boolean;
}

interface Color {
	id: string;
	name: string;
	hex: string;
	category?: string;
}

// Curated colors for interior painting - walls, floors, ceilings
const paintColors: Color[] = [
	// Neutrals & Whites
	{ id: 'white', name: 'Pure White', hex: '#FFFFFF', category: 'neutrals' },
	{ id: 'off-white', name: 'Off White', hex: '#F8F8F8', category: 'neutrals' },
	{ id: 'warm-white', name: 'Warm White', hex: '#FFF8F0', category: 'neutrals' },
	{ id: 'cool-white', name: 'Cool White', hex: '#F0F8FF', category: 'neutrals' },
	{ id: 'ivory', name: 'Ivory', hex: '#FFFFF0', category: 'neutrals' },
	{ id: 'cream', name: 'Cream', hex: '#FFFDD0', category: 'neutrals' },

	// Grays
	{ id: 'light-gray', name: 'Light Gray', hex: '#E0E0E0', category: 'grays' },
	{ id: 'medium-gray', name: 'Medium Gray', hex: '#9E9E9E', category: 'grays' },
	{ id: 'charcoal', name: 'Charcoal', hex: '#424242', category: 'grays' },
	{ id: 'slate', name: 'Slate', hex: '#616161', category: 'grays' },
	{ id: 'greige', name: 'Greige', hex: '#808080', category: 'grays' },
	{ id: 'taupe', name: 'Taupe', hex: '#A9A9A9', category: 'grays' },

	// Beiges & Tans
	{ id: 'beige', name: 'Beige', hex: '#F5E6D3', category: 'beiges' },
	{ id: 'sand', name: 'Sand', hex: '#E6D7C3', category: 'beiges' },
	{ id: 'tan', name: 'Tan', hex: '#D4C4B0', category: 'beiges' },
	{ id: 'camel', name: 'Camel', hex: '#C19A6B', category: 'beiges' },

	// Blues
	{ id: 'sky-blue', name: 'Sky Blue', hex: '#87CEEB', category: 'blues' },
	{ id: 'powder-blue', name: 'Powder Blue', hex: '#B0E0E6', category: 'blues' },
	{ id: 'navy', name: 'Navy', hex: '#000080', category: 'blues' },
	{ id: 'steel-blue', name: 'Steel Blue', hex: '#4682B4', category: 'blues' },
	{ id: 'cerulean', name: 'Cerulean', hex: '#2E86AB', category: 'blues' },
	{ id: 'peacock', name: 'Peacock', hex: '#004958', category: 'blues' },

	// Greens
	{ id: 'sage', name: 'Sage', hex: '#9CCC65', category: 'greens' },
	{ id: 'mint', name: 'Mint', hex: '#98FB98', category: 'greens' },
	{ id: 'forest', name: 'Forest', hex: '#228B22', category: 'greens' },
	{ id: 'sage-dark', name: 'Dark Sage', hex: '#689F38', category: 'greens' },
	{ id: 'olive', name: 'Olive', hex: '#808000', category: 'greens' },
	{ id: 'emerald', name: 'Emerald', hex: '#50C878', category: 'greens' },

	// Earth Tones
	{ id: 'terracotta', name: 'Terracotta', hex: '#E07B5F', category: 'earth' },
	{ id: 'rust', name: 'Rust', hex: '#B7410E', category: 'earth' },
	{ id: 'cocoa', name: 'Cocoa', hex: '#8D6E63', category: 'earth' },
	{ id: 'espresso', name: 'Espresso', hex: '#3E2723', category: 'earth' },
	{ id: 'burnt-orange', name: 'Burnt Orange', hex: '#CC5500', category: 'earth' },

	// Yellows & Oranges
	{ id: 'butter', name: 'Butter', hex: '#FFF700', category: 'warm' },
	{ id: 'champagne', name: 'Champagne', hex: '#F7E7CE', category: 'warm' },
	{ id: 'golden', name: 'Golden', hex: '#FFD700', category: 'warm' },
	{ id: 'peach', name: 'Peach', hex: '#FFE5B4', category: 'warm' },
	{ id: 'coral', name: 'Coral', hex: '#FF7F50', category: 'warm' },

	// Purples & Pinks
	{ id: 'lavender', name: 'Lavender', hex: '#E6E6FA', category: 'soft' },
	{ id: 'lilac', name: 'Lilac', hex: '#C8A2C8', category: 'soft' },
	{ id: 'blush', name: 'Blush', hex: '#DE5D83', category: 'soft' },
	{ id: 'rose', name: 'Rose', hex: '#FF69B4', category: 'soft' },

	// Reds
	{ id: 'brick', name: 'Brick', hex: '#8B4513', category: 'reds' },
	{ id: 'burgundy', name: 'Burgundy', hex: '#800020', category: 'reds' },
	{ id: 'crimson', name: 'Crimson', hex: '#DC143C', category: 'reds' },

	// Blacks & Dark
	{ id: 'black', name: 'Black', hex: '#000000', category: 'dark' },
	{ id: 'jet-black', name: 'Jet Black', hex: '#0C0C0C', category: 'dark' },
];

const categories = [
	'all',
	'neutrals',
	'grays',
	'beiges',
	'blues',
	'greens',
	'earth',
	'warm',
	'soft',
	'reds',
	'dark',
];

export function ColorStep({
	onColorSelect,
	config,
	selectedColor,
	compact = false,
}: ColorStepProps) {
	const [selectedCategory, setSelectedCategory] = useState<string>('all');

	const filteredColors =
		selectedCategory === 'all'
			? paintColors
			: paintColors.filter((color) => color.category === selectedCategory);

	const handleSelect = (color: Color) => {
		if (onColorSelect) {
			onColorSelect(color);
		}
	};

	const renderColor = ({ item }: { item: Color }) => (
		<TouchableOpacity
			onPress={() => handleSelect(item)}
			className={`mb-3 rounded-2xl overflow-hidden border-2 ${
				selectedColor?.id === item.id ? 'border-blue-500' : 'border-gray-200'
			}`}
		>
			<View className="bg-white">
				{/* Color Preview */}
				<View className="h-32" style={{ backgroundColor: item.hex }} />

				{/* Color Info */}
				<View className="p-4">
					<ThemedText variant="title-sm" className="text-gray-900" bold>
						{item.name}
					</ThemedText>
					<ThemedText variant="body" className="text-gray-600">
						{item.hex}
					</ThemedText>
				</View>
			</View>
		</TouchableOpacity>
	);

	if (compact) {
		return (
			<View className="flex-1 px-6 pt-4">
				<ThemedText variant="title-md" className="text-gray-900 mb-6" bold>
					Select a Color
				</ThemedText>

				{/* Category Tabs */}
				<ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
					<View className="flex-row gap-2">
						{categories.map((category) => (
							<TouchableOpacity
								key={category}
								onPress={() => setSelectedCategory(category)}
								className={`px-4 py-2 rounded-full ${
									selectedCategory === category ? 'bg-blue-500' : 'bg-gray-200'
								}`}
							>
								<ThemedText
									variant="body"
									className={
										selectedCategory === category
											? 'text-white'
											: 'text-gray-700'
									}
									bold
								>
									{category === 'all'
										? 'All'
										: category.charAt(0).toUpperCase() + category.slice(1)}
								</ThemedText>
							</TouchableOpacity>
						))}
					</View>
				</ScrollView>

				{/* Colors Grid */}
				<FlatList
					data={filteredColors}
					keyExtractor={(item) => item.id}
					renderItem={renderColor}
					numColumns={1}
					showsVerticalScrollIndicator={false}
				/>
			</View>
		);
	}

	return (
		<View className="flex-1 px-6">
			<View className="items-start mb-4">
				<ThemedText variant="title-md" className="text-gray-900  text-center" extraBold>
					{config.title}
				</ThemedText>

				<ThemedText variant="body" className="text-gray-600 leading-6">
					{config.subtitle}
				</ThemedText>
			</View>

			{/* Category Tabs */}
			<ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
				<View className="flex-row gap-2">
					{categories.map((category) => (
						<TouchableOpacity
							key={category}
							onPress={() => setSelectedCategory(category)}
							className={`px-4 py-2 rounded-full ${
								selectedCategory === category ? 'bg-gray-900' : 'bg-gray-200'
							}`}
						>
							<ThemedText
								variant="body"
								className={
									selectedCategory === category ? 'text-white' : 'text-gray-700'
								}
								bold
							>
								{category === 'all'
									? 'All'
									: category.charAt(0).toUpperCase() + category.slice(1)}
							</ThemedText>
						</TouchableOpacity>
					))}
				</View>
			</ScrollView>

			{/* Colors Grid */}
			<FlatList
				data={filteredColors}
				keyExtractor={(item) => item.id}
				renderItem={renderColor}
				numColumns={1}
				showsVerticalScrollIndicator={false}
			/>
		</View>
	);
}
