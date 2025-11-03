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
	description?: string;
}

// Curated colors for interior painting - walls, floors, ceilings
const paintColors: Color[] = [
	// Neutrals & Whites
	{ id: 'white', name: 'Pure White', hex: '#FFFFFF', category: 'neutrals', description: 'Crisp, clean white with bright, reflective finish' },
	{ id: 'off-white', name: 'Off White', hex: '#F8F8F8', category: 'neutrals', description: 'Soft white with subtle warmth, less stark than pure white' },
	{ id: 'warm-white', name: 'Warm White', hex: '#FFF8F0', category: 'neutrals', description: 'Creamy white with gentle yellow undertones, cozy and inviting' },
	{ id: 'cool-white', name: 'Cool White', hex: '#F0F8FF', category: 'neutrals', description: 'Fresh white with blue undertones, crisp and modern' },
	{ id: 'ivory', name: 'Ivory', hex: '#FFFFF0', category: 'neutrals', description: 'Classic off-white with subtle yellow warmth, elegant and timeless' },
	{ id: 'cream', name: 'Cream', hex: '#FFFDD0', category: 'neutrals', description: 'Rich, warm neutral with butter-like quality, soft and luxurious' },

	// Grays
	{ id: 'light-gray', name: 'Light Gray', hex: '#E0E0E0', category: 'grays', description: 'Soft, pale gray with clean appearance, versatile neutral' },
	{ id: 'medium-gray', name: 'Medium Gray', hex: '#9E9E9E', category: 'grays', description: 'Balanced mid-tone gray, sophisticated and contemporary' },
	{ id: 'charcoal', name: 'Charcoal', hex: '#424242', category: 'grays', description: 'Deep, dark gray with rich depth, dramatic yet refined' },
	{ id: 'slate', name: 'Slate', hex: '#616161', category: 'grays', description: 'Cool stone-like gray with blue undertones, strong and stable' },
	{ id: 'greige', name: 'Greige', hex: '#808080', category: 'grays', description: 'Perfect blend of gray and beige, warm neutral with sophistication' },
	{ id: 'taupe', name: 'Taupe', hex: '#A9A9A9', category: 'grays', description: 'Warm gray-brown hybrid, earthy and versatile' },

	// Beiges & Tans
	{ id: 'beige', name: 'Beige', hex: '#F5E6D3', category: 'beiges', description: 'Soft, warm neutral with sandy undertones, natural and calming' },
	{ id: 'sand', name: 'Sand', hex: '#E6D7C3', category: 'beiges', description: 'Light tan with desert-inspired warmth, airy and peaceful' },
	{ id: 'tan', name: 'Tan', hex: '#D4C4B0', category: 'beiges', description: 'Medium brown-beige, grounded and earthy with gentle warmth' },
	{ id: 'camel', name: 'Camel', hex: '#C19A6B', category: 'beiges', description: 'Rich tan with golden brown depth, luxurious and warm' },

	// Blues
	{ id: 'sky-blue', name: 'Sky Blue', hex: '#87CEEB', category: 'blues', description: 'Bright, cheerful blue like a clear summer sky, uplifting and fresh' },
	{ id: 'powder-blue', name: 'Powder Blue', hex: '#B0E0E6', category: 'blues', description: 'Soft, pale blue with gentle appearance, serene and calming' },
	{ id: 'navy', name: 'Navy', hex: '#000080', category: 'blues', description: 'Deep, rich blue with sophisticated depth, classic and bold' },
	{ id: 'steel-blue', name: 'Steel Blue', hex: '#4682B4', category: 'blues', description: 'Cool medium blue with gray undertones, modern and strong' },
	{ id: 'cerulean', name: 'Cerulean', hex: '#2E86AB', category: 'blues', description: 'Vibrant teal-blue with clarity and depth, energizing yet calm' },
	{ id: 'peacock', name: 'Peacock', hex: '#004958', category: 'blues', description: 'Dark teal-blue with jewel-like richness, dramatic and luxurious' },

	// Greens
	{ id: 'sage', name: 'Sage', hex: '#9CCC65', category: 'greens', description: 'Muted green with gray undertones, natural and soothing' },
	{ id: 'mint', name: 'Mint', hex: '#98FB98', category: 'greens', description: 'Fresh, light green with cool clarity, refreshing and airy' },
	{ id: 'forest', name: 'Forest', hex: '#228B22', category: 'greens', description: 'Deep, rich green like woodland foliage, grounding and organic' },
	{ id: 'sage-dark', name: 'Dark Sage', hex: '#689F38', category: 'greens', description: 'Muted olive-green with depth, sophisticated and earthy' },
	{ id: 'olive', name: 'Olive', hex: '#808000', category: 'greens', description: 'Warm yellow-green with natural depth, rustic and organic' },
	{ id: 'emerald', name: 'Emerald', hex: '#50C878', category: 'greens', description: 'Bright jewel-toned green with vibrancy, luxurious and bold' },

	// Earth Tones
	{ id: 'terracotta', name: 'Terracotta', hex: '#E07B5F', category: 'earth', description: 'Warm clay-orange with Mediterranean charm, earthy and inviting' },
	{ id: 'rust', name: 'Rust', hex: '#B7410E', category: 'earth', description: 'Deep reddish-brown with aged patina, rich and organic' },
	{ id: 'cocoa', name: 'Cocoa', hex: '#8D6E63', category: 'earth', description: 'Warm chocolate brown, cozy and grounding with natural depth' },
	{ id: 'espresso', name: 'Espresso', hex: '#3E2723', category: 'earth', description: 'Dark, rich brown like coffee beans, sophisticated and bold' },
	{ id: 'burnt-orange', name: 'Burnt Orange', hex: '#CC5500', category: 'earth', description: 'Deep orange with warmth and energy, vibrant yet grounded' },

	// Yellows & Oranges
	{ id: 'butter', name: 'Butter', hex: '#FFF700', category: 'warm', description: 'Soft, creamy yellow with gentle warmth, cheerful and bright' },
	{ id: 'champagne', name: 'Champagne', hex: '#F7E7CE', category: 'warm', description: 'Pale gold with elegant shimmer quality, luxurious and refined' },
	{ id: 'golden', name: 'Golden', hex: '#FFD700', category: 'warm', description: 'Rich yellow-gold with luminous quality, warm and opulent' },
	{ id: 'peach', name: 'Peach', hex: '#FFE5B4', category: 'warm', description: 'Soft orange-pink with gentle warmth, welcoming and sweet' },
	{ id: 'coral', name: 'Coral', hex: '#FF7F50', category: 'warm', description: 'Vibrant orange-pink with tropical energy, lively and warm' },

	// Purples & Pinks
	{ id: 'lavender', name: 'Lavender', hex: '#E6E6FA', category: 'soft', description: 'Pale purple with floral softness, calming and romantic' },
	{ id: 'lilac', name: 'Lilac', hex: '#C8A2C8', category: 'soft', description: 'Soft purple with gentle warmth, dreamy and delicate' },
	{ id: 'blush', name: 'Blush', hex: '#DE5D83', category: 'soft', description: 'Rosy pink with subtle sophistication, warm and feminine' },
	{ id: 'rose', name: 'Rose', hex: '#FF69B4', category: 'soft', description: 'Vibrant pink with romantic intensity, bold and cheerful' },

	// Reds
	{ id: 'brick', name: 'Brick', hex: '#8B4513', category: 'reds', description: 'Deep reddish-brown with earthy warmth, solid and traditional' },
	{ id: 'burgundy', name: 'Burgundy', hex: '#800020', category: 'reds', description: 'Deep wine red with luxurious depth, rich and elegant' },
	{ id: 'crimson', name: 'Crimson', hex: '#DC143C', category: 'reds', description: 'Bold, bright red with intensity and drama, passionate and striking' },

	// Blacks & Dark
	{ id: 'black', name: 'Black', hex: '#000000', category: 'dark', description: 'Pure, deep black with maximum contrast, dramatic and modern' },
	{ id: 'jet-black', name: 'Jet Black', hex: '#0C0C0C', category: 'dark', description: 'Rich, deep black with subtle depth, sophisticated and bold' },
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
					<ThemedText variant="body" className="text-gray-500 text-xs mb-1">
						{item.hex}
					</ThemedText>
					{item.description && (
						<ThemedText variant="body" className="text-gray-600 text-sm">
							{item.description}
						</ThemedText>
					)}
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
