import React, { useState, useEffect } from 'react';
import {
	View,
	TouchableOpacity,
	ScrollView,
	ImageBackground,
	Modal,
	TextInput,
	Alert,
	Image,
} from 'react-native';
import { ThemedText } from '../ThemedText';
import { CustomButton } from '../CustomButton';
import { Octicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { StepConfig } from '../../config/stepConfig';

interface StyleStepProps {
	onStyleSelect?: (style: Style | null) => void;
	config: StepConfig;
	selectedStyle?: Style | null;
	compact?: boolean;
	mode?: 'garden' | 'interior-design' | 'exterior-design';
}

interface Style {
	id: string;
	name: string;
	description: string;
	imageUrl: string;
	prompt?: string;
	isCustom?: boolean;
}

const styleTypes: Style[] = [
	{
		id: 'modern',
		name: 'Modern',
		description: 'Clean lines and minimal design',
		imageUrl:
			'https://plus.unsplash.com/premium_photo-1661882126637-5b2ba33aab27?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&?w=400&h=300&fit=crop&crop=center',
	},
	{
		id: 'bohemian',
		name: 'Bohemian',
		description: 'Eclectic and artistic flair',
		imageUrl:
			'https://lh3.googleusercontent.com/yy7xrn8b_jjQ_2uMBm6blAp10PtcrtPb3wjbQMZR0PX8OSlXjPPR-Yl-OPnnfP2lyD6RTAdYOx-tREZRkg7TFsMX944quW40b36O6E_PYfG9lfe7p3HusBcWqYqa-zakrlbPG0TiA0ZDw0hV2fM',
	},
	{
		id: 'dark-academia',
		name: 'Dark Academia',
		description: 'Dark and mysterious Academia vibes',
		imageUrl:
			'https://www.marthastewart.com/thmb/TCjkhYwNm-ouWesF20NSKcDSGFc=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/marthastewart-darkacademia-ryanmatthewcohn-a93eec0e984643c9bdbf1d5cdd66537c.jpg',
	},
	{
		id: 'dark-behemian',
		name: 'Dark Bohemian',
		description: 'Dark and mysterious Bohemian vibes',
		imageUrl: 'https://s3.amazonaws.com/ideas-after/ac868352-43de-40d8-9fe2-b0d1d1887487.jpeg',
	},
	{
		id: 'scandinavian',
		name: 'Scandinavian',
		description: 'Light, airy, and functional',
		imageUrl:
			'https://www.mydomaine.com/thmb/KhcOIhDFlUNcxugQvwspAreI95E=/1920x0/filters:no_upscale():strip_icc()/cocolapinescandinavianlivingroom-c602a303414341fb932f2d31e8769699.jpeg',
	},
	{
		id: 'industrial',
		name: 'Industrial',
		description: 'Raw materials and urban feel',
		imageUrl:
			'https://cdn.home-designing.com/wp-content/uploads/2017/06/concrete-panel-walls-industrial-style-bedroom.jpg',
	},
	{
		id: 'traditional',
		name: 'Traditional',
		description: 'Classic and timeless elegance',
		imageUrl:
			'https://buildifyltd.co.uk/wp-content/uploads/2025/03/Traditional-Living-Room-Design.png',
	},
	{
		id: 'minimalist',
		name: 'Minimalist',
		description: 'Less is more philosophy',
		imageUrl: 'https://www.dormeo.co.uk/media/wysiwyg/blog/minimalist-bedroom.jpg',
	},
	{
		id: 'rustic',
		name: 'Rustic',
		description: 'Natural materials and warmth',
		imageUrl:
			'https://blog.canadianloghomes.com/wp-content/uploads/2018/01/rustic-style-interior-design-ideas.jpg',
	},
	{
		id: 'contemporary',
		name: 'Contemporary',
		description: 'Current trends and fresh design',
		imageUrl:
			'https://www.marthastewart.com/thmb/lxfu2-95SWCS0jwciHs1mkbsGUM=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/modern-living-rooms-wb-1-bc45b0dc70e541f0ba40364ae6bd8421.jpg',
	},
	{
		id: 'tropical',
		name: 'Tropical',
		description: 'Relaxing and refreshing tropical vibes',
		imageUrl: 'https://app.dropinblog.com/uploaded/blogs/34241141/files/Tropical.png',
	},
	{
		id: 'art-deco',
		name: 'Art Deco',
		description: 'Classic and timeless elegance',
		imageUrl:
			'https://hemmingandwills.co.uk/cdn/shop/articles/art_deco_bedroom_1074x.jpg?v=1712660661',
	},
	{
		id: 'modern-farmhouse',
		name: 'Modern Farmhouse',
		description: 'Modern and farmhouse vibes',
		imageUrl:
			'https://images.ctfassets.net/wlzmdirin2hy/1kiccSjRbi7653tKGEpUAe/22a4573a905a8ec150b8f227019fd2ec/lx_southeast17_hom_hager_01?w=3840&q=75',
	},
	{
		id: 'coastal',
		name: 'Coastal',
		description: 'Relaxing and refreshing coastal vibes',
		imageUrl: 'https://st.hzcdn.com/simgs/f8b1869e09a96bf7_14-3445/_.jpg',
	},
	{
		id: 'japandi',
		name: 'Japanese',
		description: 'Relaxing and refreshing Japanese vibes',
		imageUrl:
			'https://www.porcelanosa.com/trendbook/app/uploads/2021/11/Japandi-bedroom-ideas-7.jpg',
	},
	{
		id: 'french-country',
		name: 'French Country',
		description: 'Relaxing and refreshing French country vibes',
		imageUrl:
			'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQk7wGuWolcrIZMWxkK1DsBNVV2tqohynxJWg&s',
	},
	{
		id: 'shabby-chic',
		name: 'Shabby Chic',
		description: 'Relaxing and refreshing Shabby Chic vibes',
		imageUrl: 'https://i.pinimg.com/564x/45/82/92/4582924db95a00f44804f4fba6431527.jpg',
	},
	{
		id: 'transitional',
		name: 'Transitional',
		description: 'Relaxing and refreshing Transitional vibes',
		imageUrl:
			'https://eu-central-1.graphassets.com/ALdVU93uSfuiaR3RsZgFXz/wG2wBXtSUWg9HuSMq1JJ',
	},
];

// Seasonal style definitions with their relevant months
const seasonalStyles: Style[] = [
	{
		id: 'christmas',
		name: 'Christmas',
		description: 'Festive holiday decorations and warm Christmas vibes',
		imageUrl: 'https://pingu-app.s3.eu-west-2.amazonaws.com/christmas.webp',
	},
	{
		id: 'easter',
		name: 'Easter',
		description: 'Fresh springtime pastels and Easter decorations',
		imageUrl: 'https://pingu-app.s3.eu-west-2.amazonaws.com/easter.webp',
	},
	{
		id: 'halloween',
		name: 'Halloween',
		description: 'Spooky decorations and Halloween atmosphere',
		imageUrl: 'https://pingu-app.s3.eu-west-2.amazonaws.com/halloween.webp',
	},
	{
		id: 'thanksgiving',
		name: 'Thanksgiving',
		description: 'Warm autumn harvest decorations and cozy fall vibes',
		imageUrl: 'https://pingu-app.s3.eu-west-2.amazonaws.com/thanksgiving.webp',
	},
	{
		id: 'valentines',
		name: "Valentine's Day",
		description: 'Romantic red and pink hearts and love-themed decor',
		imageUrl: 'https://pingu-app.s3.eu-west-2.amazonaws.com/valentines.webp',
	},
	{
		id: 'st-patricks',
		name: "St. Patrick's Day",
		description: 'Green shamrocks and Irish-themed festive decorations',
		imageUrl: 'https://pingu-app.s3.eu-west-2.amazonaws.com/stpatricks.webp',
	},
	{
		id: 'summer',
		name: 'Summer',
		description: 'Bright sunny beach vibes and tropical summer decorations',
		imageUrl: 'https://pingu-app.s3.eu-west-2.amazonaws.com/summer.webp',
	},
	{
		id: 'autumn',
		name: 'Autumn',
		description: 'Warm fall colors with pumpkins, leaves, and cozy harvest decor',
		imageUrl: 'https://pingu-app.s3.eu-west-2.amazonaws.com/autumn.webp',
	},
	{
		id: 'winter',
		name: 'Winter',
		description: 'Cozy winter wonderland with snow, icicles, and warm fireside atmosphere',
		imageUrl: 'https://pingu-app.s3.eu-west-2.amazonaws.com/winter.webp',
	},
];

// Map seasonal styles to their relevant months (0-indexed, 0 = January, 11 = December)
const seasonalMonths: Record<string, number[]> = {
	christmas: [11, 0], // December, January
	easter: [2, 3], // March, April (varies by year, but typically these months)
	halloween: [9], // October
	thanksgiving: [10], // November
	valentines: [1], // February
	'st-patricks': [2], // March
	summer: [5, 6, 7], // June, July, August
	autumn: [8, 9, 10], // September, October, November
	winter: [11, 0, 1], // December, January, February
};

// Function to check if a seasonal style is within a month of the current date
const isSeasonalUpcoming = (styleId: string): boolean => {
	const now = new Date();
	const currentMonth = now.getMonth(); // 0-11
	const months = seasonalMonths[styleId] || [];

	// Check if current month is in the relevant months
	if (months.includes(currentMonth)) {
		return true;
	}

	// Check if next month is in the relevant months (within a month)
	const nextMonth = (currentMonth + 1) % 12;
	if (months.includes(nextMonth)) {
		return true;
	}

	return false;
};

const imaginaryStyles: Style[] = [
	{
		id: 'fluffy-pink',
		name: 'Fluffy Pink',
		description: 'Ultra-soft pink dreamy fantasy interior',
		imageUrl: 'https://pingu-app.s3.eu-west-2.amazonaws.com/fluffypink.webp',
	},
	{
		id: 'space-themed',
		name: 'Space Themed',
		description: 'Futuristic cosmic space-inspired design',
		imageUrl: 'https://pingu-app.s3.eu-west-2.amazonaws.com/space.webp',
	},
	{
		id: 'underwater',
		name: 'Underwater',
		description: 'Aquatic ocean theme with flowing water elements and marine life',
		imageUrl: 'https://pingu-app.s3.eu-west-2.amazonaws.com/underwater.webp',
	},
	{
		id: 'clouds',
		name: 'Clouds',
		description: 'Ethereal floating cloud aesthetic with soft white and sky blues',
		imageUrl: 'https://pingu-app.s3.eu-west-2.amazonaws.com/clouds.webp',
	},
	{
		id: 'candy-land',
		name: 'Candy Land',
		description: 'Sweet candy-inspired design with lollipops, gumdrops, and vibrant colors',
		imageUrl: 'https://pingu-app.s3.eu-west-2.amazonaws.com/candyland.webp',
	},
	{
		id: 'medieval',
		name: 'Medieval',
		description:
			'Fantasy medieval castle interior with stone, tapestries, and heraldic elements',
		imageUrl: 'https://pingu-app.s3.eu-west-2.amazonaws.com/medieval.webp',
	},
	{
		id: 'steampunk',
		name: 'Steampunk',
		description: 'Victorian industrial fantasy with brass, gears, and mechanical elements',
		imageUrl: 'https://pingu-app.s3.eu-west-2.amazonaws.com/steampunk.webp',
	},
	{
		id: 'cyberpunk',
		name: 'Cyberpunk',
		description:
			'Neon-lit futuristic dystopian aesthetic with digital and holographic elements',
		imageUrl: 'https://pingu-app.s3.eu-west-2.amazonaws.com/cyberpunk.webp',
	},
	{
		id: 'neon-glow',
		name: 'Neon Glow',
		description: 'Vibrant neon lighting with glowing colors and electric atmosphere',
		imageUrl: 'https://pingu-app.s3.eu-west-2.amazonaws.com/neonglow.webp',
	},
	{
		id: 'jungle',
		name: 'Jungle',
		description: 'Tropical rainforest paradise with lush greenery and exotic plants',
		imageUrl: 'https://pingu-app.s3.eu-west-2.amazonaws.com/jungle.webp',
	},
	{
		id: 'fairy-tale',
		name: 'Fairy Tale',
		description: 'Enchanted forest fairy tale with magical elements and whimsical decor',
		imageUrl: 'https://pingu-app.s3.eu-west-2.amazonaws.com/fairytale.webp',
	},
	{
		id: 'retro-future',
		name: 'Retro Future',
		description: '1950s-60s vision of the future with atomic age and space age aesthetics',
		imageUrl: 'https://pingu-app.s3.eu-west-2.amazonaws.com/retrofuture.webp',
	},
];

export function StyleStep({
	onStyleSelect,
	config,
	selectedStyle,
	compact = false,
	mode = 'interior-design',
}: StyleStepProps) {
	// Determine mode from config if not explicitly provided
	// Check if config description suggests garden or exterior (fragile, but works)
	const detectedMode: 'garden' | 'interior-design' | 'exterior-design' =
		config.description?.toLowerCase().includes('garden') ||
		config.title?.toLowerCase().includes('garden')
			? 'garden'
			: config.description?.toLowerCase().includes('exterior') ||
				  config.title?.toLowerCase().includes('exterior')
				? 'exterior-design'
				: mode || 'interior-design';

	const baseStorageKey =
		detectedMode === 'garden'
			? 'customGardenStyles'
			: detectedMode === 'exterior-design'
				? 'customExteriorStyles'
				: 'customInteriorStyles';

	const [selectedStyleId, setSelectedStyleId] = useState<string | null>(
		selectedStyle?.id || null
	);

	// Track if we're setting a seasonal style to prevent clearing
	const settingSeasonalStyleRef = React.useRef<string | null>(null);

	// Update selectedStyleId when selectedStyle prop changes
	useEffect(() => {
		if (selectedStyle?.id) {
			// If it's a seasonal style, switch to seasonal category first
			const seasonalStyleIds = seasonalStyles.map((s) => s.id);
			if (seasonalStyleIds.includes(selectedStyle.id)) {
				settingSeasonalStyleRef.current = selectedStyle.id;
				setSelectedCategory('seasonal');
			} else {
				// For non-seasonal styles, set immediately
				setSelectedStyleId(selectedStyle.id);
				onStyleSelect?.(selectedStyle);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedStyle?.id]);

	// When category changes to seasonal and we have a pending style, set it
	useEffect(() => {
		if (selectedCategory === 'seasonal' && settingSeasonalStyleRef.current && selectedStyle?.id === settingSeasonalStyleRef.current) {
			const styles = getFilteredStyles();
			const styleExists = styles.some((style) => style.id === settingSeasonalStyleRef.current);
			if (styleExists) {
				setSelectedStyleId(settingSeasonalStyleRef.current);
				onStyleSelect?.(selectedStyle);
				settingSeasonalStyleRef.current = null;
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedCategory, customSeasonalStyles]);

	const [customRegularStyles, setCustomRegularStyles] = useState<Style[]>([]);
	const [customSeasonalStyles, setCustomSeasonalStyles] = useState<Style[]>([]);
	const [customImaginaryStyles, setCustomImaginaryStyles] = useState<Style[]>([]);
	const [showAddModal, setShowAddModal] = useState<boolean>(false);
	const [newStyleName, setNewStyleName] = useState<string>('');
	const [newStylePrompt, setNewStylePrompt] = useState<string>('');
	const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
	const [showEditModal, setShowEditModal] = useState<boolean>(false);
	const [editingStyle, setEditingStyle] = useState<Style | null>(null);
	const [editStyleName, setEditStyleName] = useState<string>('');
	const [editStylePrompt, setEditStylePrompt] = useState<string>('');
	const [editImageUri, setEditImageUri] = useState<string | null>(null);
	const [isLoadingImage, setIsLoadingImage] = useState<boolean>(false);
	const [isLoadingEditImage, setIsLoadingEditImage] = useState<boolean>(false);
	const [selectedCategory, setSelectedCategory] = useState<'regular' | 'seasonal' | 'imaginary'>(
		'regular'
	);
	const [allStyles, setAllStyles] = useState<Style[]>(styleTypes);

	// Get storage key for current category
	const getStorageKey = (category: 'regular' | 'seasonal' | 'imaginary'): string => {
		return `${baseStorageKey}-${category}`;
	};

	// Load custom styles from AsyncStorage on component mount and when category changes
	useEffect(() => {
		loadAllCustomStyles();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [detectedMode]);

	// Filter styles based on selected category
	const getFilteredStyles = (): Style[] => {
		switch (selectedCategory) {
			case 'seasonal':
				// Sort seasonal styles to feature upcoming ones first
				const sortedSeasonalStyles = [...seasonalStyles].sort((a, b) => {
					const aUpcoming = isSeasonalUpcoming(a.id);
					const bUpcoming = isSeasonalUpcoming(b.id);

					// Upcoming styles come first
					if (aUpcoming && !bUpcoming) return -1;
					if (!aUpcoming && bUpcoming) return 1;

					// If both are upcoming or both are not, maintain original order
					return 0;
				});

				return [...customSeasonalStyles, ...sortedSeasonalStyles];
			case 'imaginary':
				return [...customImaginaryStyles, ...imaginaryStyles];
			case 'regular':
			default:
				return [...customRegularStyles, ...styleTypes];
		}
	};

	const filteredStyles = getFilteredStyles();

	// Load custom styles when category changes
	useEffect(() => {
		loadCustomStylesForCategory(selectedCategory);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedCategory]);

	// Clear selection when category changes if selected style doesn't exist in new category
	// But don't clear if we're setting a seasonal style
	useEffect(() => {
		if (selectedStyleId && !settingSeasonalStyleRef.current && selectedStyle?.id !== selectedStyleId) {
			const styles = getFilteredStyles();
			const styleExists = styles.some((style) => style.id === selectedStyleId);
			if (!styleExists) {
				setSelectedStyleId(null);
				onStyleSelect?.(null);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		customRegularStyles,
		customSeasonalStyles,
		customImaginaryStyles,
		selectedCategory,
		selectedStyleId,
	]);

	const loadAllCustomStyles = async () => {
		await loadCustomStylesForCategory('regular');
		await loadCustomStylesForCategory('seasonal');
		await loadCustomStylesForCategory('imaginary');
	};

	const loadCustomStylesForCategory = async (category: 'regular' | 'seasonal' | 'imaginary') => {
		try {
			const storageKey = getStorageKey(category);
			const stored = await AsyncStorage.getItem(storageKey);
			if (stored) {
				const parsedStyles = JSON.parse(stored);
				switch (category) {
					case 'regular':
						setCustomRegularStyles(parsedStyles);
						break;
					case 'seasonal':
						setCustomSeasonalStyles(parsedStyles);
						break;
					case 'imaginary':
						setCustomImaginaryStyles(parsedStyles);
						break;
				}
			} else {
				// Initialize empty array if no styles exist
				switch (category) {
					case 'regular':
						setCustomRegularStyles([]);
						break;
					case 'seasonal':
						setCustomSeasonalStyles([]);
						break;
					case 'imaginary':
						setCustomImaginaryStyles([]);
						break;
				}
			}
		} catch (error) {
			console.error(`Error loading custom ${category} styles:`, error);
		}
	};

	const saveCustomStyles = async (
		styles: Style[],
		category: 'regular' | 'seasonal' | 'imaginary'
	) => {
		try {
			const storageKey = getStorageKey(category);
			await AsyncStorage.setItem(storageKey, JSON.stringify(styles));
			// Update the state for the specific category
			switch (category) {
				case 'regular':
					setCustomRegularStyles(styles);
					break;
				case 'seasonal':
					setCustomSeasonalStyles(styles);
					break;
				case 'imaginary':
					setCustomImaginaryStyles(styles);
					break;
			}
		} catch (error) {
			console.error(`Error saving custom ${category} styles:`, error);
		}
	};

	const getCurrentCustomStyles = (): Style[] => {
		switch (selectedCategory) {
			case 'regular':
				return customRegularStyles;
			case 'seasonal':
				return customSeasonalStyles;
			case 'imaginary':
				return customImaginaryStyles;
			default:
				return customRegularStyles;
		}
	};

	const handleStyleSelect = (style: Style) => {
		setSelectedStyleId(style.id);
		onStyleSelect?.(style);
	};

	const handleImageSelect = async () => {
		try {
			setIsLoadingImage(true);

			// Request permissions first
			const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
			if (permissionResult.status !== 'granted') {
				Alert.alert(
					'Permission Required',
					'Please grant camera roll permissions to select an image.'
				);
				return;
			}

			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: [4, 3],
				quality: 0.8,
			});

			if (!result.canceled && result.assets[0]) {
				setSelectedImageUri(result.assets[0].uri);
			}
		} catch (error) {
			console.error('Error picking image:', error);
			Alert.alert('Error', 'Failed to pick image. Please try again.');
		} finally {
			setIsLoadingImage(false);
		}
	};

	const handleAddStyle = () => {
		if (newStyleName.trim() && selectedImageUri) {
			const newStyle: Style = {
				id: `custom-${Date.now()}`,
				name: newStyleName.trim(),
				description: '', // Empty description
				imageUrl:
					selectedImageUri ||
					'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop&crop=center', // Use selected image or default
				prompt: newStylePrompt.trim() || undefined,
				isCustom: true,
			};

			const currentCustomStyles = getCurrentCustomStyles();
			const updatedCustomStyles = [...currentCustomStyles, newStyle];
			saveCustomStyles(updatedCustomStyles, selectedCategory);

			// Auto-select the newly added style
			setSelectedStyleId(newStyle.id);
			onStyleSelect?.(newStyle);

			setNewStyleName('');
			setNewStylePrompt('');
			setSelectedImageUri(null);
			setShowAddModal(false);
		}
	};

	const handleCancelAdd = () => {
		setNewStyleName('');
		setNewStylePrompt('');
		setSelectedImageUri(null);
		setIsLoadingImage(false);
		setShowAddModal(false);
	};

	const handleLongPress = (style: Style) => {
		if (style.isCustom) {
			setEditingStyle(style);
			setEditStyleName(style.name);
			setEditStylePrompt(style.prompt || '');
			setEditImageUri(style.imageUrl);
			setShowEditModal(true);
		}
	};

	const handleEditImageSelect = async () => {
		try {
			setIsLoadingEditImage(true);

			// Request permissions first
			const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
			if (permissionResult.status !== 'granted') {
				Alert.alert(
					'Permission Required',
					'Please grant camera roll permissions to select an image.'
				);
				return;
			}

			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: [4, 3],
				quality: 0.8,
			});

			if (!result.canceled && result.assets[0]) {
				setEditImageUri(result.assets[0].uri);
			}
		} catch (error) {
			console.error('Error picking image:', error);
			Alert.alert('Error', 'Failed to pick image. Please try again.');
		} finally {
			setIsLoadingEditImage(false);
		}
	};

	const handleEditStyle = () => {
		if (editingStyle && editStyleName.trim()) {
			const currentCustomStyles = getCurrentCustomStyles();
			const updatedCustomStyles = currentCustomStyles.map((style: Style) =>
				style.id === editingStyle.id
					? {
							...style,
							name: editStyleName.trim(),
							description: '', // Empty description
							imageUrl: editImageUri || style.imageUrl,
							prompt: editStylePrompt.trim() || undefined,
						}
					: style
			);
			saveCustomStyles(updatedCustomStyles, selectedCategory);

			// Update selected style if it was the one being edited
			if (selectedStyleId === editingStyle.id) {
				const updatedStyle = {
					...editingStyle,
					name: editStyleName.trim(),
					description: '', // Empty description
					imageUrl: editImageUri || editingStyle.imageUrl,
					prompt: editStylePrompt.trim() || undefined,
				};
				onStyleSelect?.(updatedStyle);
			}

			setEditStyleName('');
			setEditStylePrompt('');
			setEditImageUri(null);
			setEditingStyle(null);
			setShowEditModal(false);
		}
	};

	const handleDeleteStyle = () => {
		if (editingStyle) {
			const currentCustomStyles = getCurrentCustomStyles();
			const updatedCustomStyles = currentCustomStyles.filter(
				(style: Style) => style.id !== editingStyle.id
			);
			saveCustomStyles(updatedCustomStyles, selectedCategory);

			// Clear selection if the deleted style was selected
			if (selectedStyleId === editingStyle.id) {
				setSelectedStyleId(null);
				onStyleSelect?.(null);
			}

			setEditStyleName('');
			setEditImageUri(null);
			setEditingStyle(null);
			setShowEditModal(false);
		}
	};

	const handleCancelEdit = () => {
		setEditStyleName('');
		setEditStylePrompt('');
		setEditImageUri(null);
		setIsLoadingEditImage(false);
		setEditingStyle(null);
		setShowEditModal(false);
	};

	// Compact horizontal layout
	if (compact) {
		return (
			<View className="flex-1 items-center justify-center">
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
				>
					{filteredStyles.map((style) => {
						const isSelected = selectedStyleId === style.id;

						return (
							<TouchableOpacity
								key={style.id}
								onPress={() => handleStyleSelect(style)}
								className={`w-40 h-40 rounded-2xl overflow-hidden border-2 ${
									isSelected ? 'border-blue-500' : 'border-gray-200'
								}`}
								activeOpacity={0.8}
							>
								<ImageBackground
									source={{ uri: style.imageUrl }}
									className="flex-1"
									resizeMode="cover"
								>
									<View className="flex-1 bg-black/30 justify-end p-2">
										<ThemedText
											variant="body"
											className="text-white font-bold text-xs"
											extraBold
										>
											{style.name}
										</ThemedText>
									</View>
								</ImageBackground>
							</TouchableOpacity>
						);
					})}
				</ScrollView>
			</View>
		);
	}

	// Default grid layout
	return (
		<View className="flex-1 px-6">
			<View className="items-start mb-4">
				<ThemedText variant="title-md" className="text-gray-900 mb-2 text-center" extraBold>
					{config.title}
				</ThemedText>
				<ThemedText variant="body" className="text-gray-600">
					{config.description}
				</ThemedText>
			</View>

			{/* Category Filter Buttons */}
			<View className="flex-row gap-2 mb-4">
				<TouchableOpacity
					onPress={() => setSelectedCategory('regular')}
					className={`flex-1 px-4 py-2 rounded-xl border-2 ${
						selectedCategory === 'regular'
							? 'bg-gray-900 border-gray-900'
							: 'bg-white border-gray-200'
					}`}
					activeOpacity={0.7}
				>
					<ThemedText
						variant="body"
						className={`text-center ${selectedCategory === 'regular' ? 'text-white' : 'text-gray-700'}`}
						bold={selectedCategory === 'regular'}
					>
						Regular
					</ThemedText>
				</TouchableOpacity>
				<TouchableOpacity
					onPress={() => setSelectedCategory('seasonal')}
					className={`flex-1 px-4 py-2 rounded-xl border-2 ${
						selectedCategory === 'seasonal'
							? 'bg-gray-900 border-gray-900'
							: 'bg-white border-gray-200'
					}`}
					activeOpacity={0.7}
				>
					<ThemedText
						variant="body"
						className={`text-center ${selectedCategory === 'seasonal' ? 'text-white' : 'text-gray-700'}`}
						bold={selectedCategory === 'seasonal'}
					>
						Seasonal
					</ThemedText>
				</TouchableOpacity>
				<TouchableOpacity
					onPress={() => setSelectedCategory('imaginary')}
					className={`flex-1 px-4 py-2 rounded-xl border-2 ${
						selectedCategory === 'imaginary'
							? 'bg-gray-900 border-gray-900'
							: 'bg-white border-gray-200'
					}`}
					activeOpacity={0.7}
				>
					<ThemedText
						variant="body"
						className={`text-center ${selectedCategory === 'imaginary' ? 'text-white' : 'text-gray-700'}`}
						bold={selectedCategory === 'imaginary'}
					>
						Imaginary
					</ThemedText>
				</TouchableOpacity>
			</View>

			<ScrollView
				className="flex-1"
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: 100 }}
			>
				<View className="flex-row flex-wrap justify-between gap-3">
					{/* Add Style Button */}
					<TouchableOpacity
						onPress={() => {
							setShowAddModal(true);
							setNewStyleName('');
							setNewStylePrompt('');
							setSelectedImageUri(null);
							setIsLoadingImage(false);
						}}
						className="w-[48%] h-32 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50"
						activeOpacity={0.7}
					>
						<View className="flex-1 items-center justify-center">
							<View className="w-12 h-12 rounded-full items-center justify-center mb-3 bg-gray-100">
								<Octicons name="plus" size={24} color="#6B7280" />
							</View>
							<ThemedText
								variant="body"
								className="font-semibold text-center text-gray-600"
							>
								Add Style
							</ThemedText>
						</View>
					</TouchableOpacity>
					{filteredStyles.map((style) => {
						const isSelected = selectedStyleId === style.id;
						const isUpcoming =
							selectedCategory === 'seasonal' && isSeasonalUpcoming(style.id);

						return (
							<TouchableOpacity
								key={style.id}
								onPress={() => handleStyleSelect(style)}
								onLongPress={() => handleLongPress(style)}
								className={`w-[48%] h-32 rounded-2xl overflow-hidden border-2 border-gray-200 ${
									isSelected ? '!border-blue-500' : ''
								}`}
								activeOpacity={0.8}
							>
								<ImageBackground
									source={{ uri: style.imageUrl }}
									className="flex-1"
									resizeMode="cover"
								>
									<View className="flex-1 bg-black/30 justify-end p-3">
										{isUpcoming && (
											<View className="absolute top-2 right-2 z-10 bg-gray-50 rounded-full px-2 py-1">
												<ThemedText
													variant="body"
													className="text-gray-900 font-bold text-xs"
													bold
												>
													Featured
												</ThemedText>
											</View>
										)}
										<ThemedText
											variant="body"
											className="text-white font-bold"
											extraBold
										>
											{style.name}
										</ThemedText>
									</View>
								</ImageBackground>
							</TouchableOpacity>
						);
					})}
				</View>
			</ScrollView>

			{/* Add Style Modal */}
			<Modal
				visible={showAddModal}
				transparent={true}
				animationType="fade"
				onRequestClose={handleCancelAdd}
			>
				<View className="flex-1 bg-black/50 justify-center items-center px-6">
					<TouchableOpacity
						className="absolute inset-0"
						activeOpacity={1}
						onPress={handleCancelAdd}
					/>
					<View className="bg-white rounded-2xl p-4 w-full relative">
						<TouchableOpacity
							onPress={handleCancelAdd}
							className="absolute top-4 right-4 z-10"
							activeOpacity={0.7}
						>
							<Octicons name="x" size={20} color="#6B7280" />
						</TouchableOpacity>
						<ThemedText variant="title-md" className="text-gray-900" extraBold>
							Add New Style
						</ThemedText>
						<ThemedText variant="body" className="text-gray-600 mb-3">
							Enter the name and upload an image for the style you want to add
						</ThemedText>

						{/* Image Upload Section */}
						<View className="mb-4">
							<TouchableOpacity
								onPress={handleImageSelect}
								className="bg-gray-100 h-48 w-full flex justify-center border-dashed border-gray-300 rounded-3xl p-12 items-center overflow-hidden"
								activeOpacity={0.7}
							>
								{selectedImageUri ? (
									<View className="absolute inset-0">
										<Image
											source={{ uri: selectedImageUri }}
											className="w-full h-full"
											resizeMode="cover"
										/>
										{/* Overlay for changing photo */}
										<View className="absolute inset-0 bg-black/20 items-center justify-center">
											<View className="bg-white/90 rounded-full p-3">
												<Octicons name="pencil" size={24} color="#111827" />
											</View>
										</View>
									</View>
								) : (
									<View className="items-center">
										<Octicons
											name="image"
											size={60}
											color="#D1D5DB"
											className="mb-4"
										/>

										<CustomButton
											title={isLoadingImage ? 'Loading...' : 'Select image'}
											onPress={handleImageSelect}
											icon={isLoadingImage ? undefined : 'plus'}
											iconPosition="left"
											className="!w-fit"
											variant="primary"
											size="sm"
											disabled={isLoadingImage}
											loading={isLoadingImage}
										/>
									</View>
								)}
							</TouchableOpacity>
						</View>

						<TextInput
							value={newStyleName}
							onChangeText={setNewStyleName}
							placeholder="e.g., Art Deco, Mid-Century, etc."
							className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 mb-4 text-gray-900"
							placeholderTextColor="#9CA3AF"
							autoFocus
						/>

						<TextInput
							value={newStylePrompt}
							onChangeText={setNewStylePrompt}
							placeholder={
								detectedMode === 'garden'
									? 'e.g., lush green foliage, colorful flower beds, winding stone pathways, decorative garden ornaments, peaceful water features, organic shapes and natural textures'
									: detectedMode === 'exterior-design'
										? 'e.g., sleek contemporary architecture with clean geometric lines, flat roofs, large windows, neutral color palette, smooth exterior materials like stucco or metal panels'
										: 'e.g., clean lines, minimalist furniture, neutral color palette with white and grey, sleek surfaces, geometric shapes, open floor plan'
							}
							multiline
							numberOfLines={4}
							className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 mb-4 text-gray-900"
							placeholderTextColor="#9CA3AF"
							textAlignVertical="top"
						/>
						<ThemedText variant="body" className="text-gray-600 text-sm mb-4 -mt-2">
							This prompt will be used when generating images with this style
						</ThemedText>
						<View className="flex-row gap-2 mb-8">
							<CustomButton
								title="Cancel"
								onPress={handleCancelAdd}
								variant="ghost"
								size="sm"
								className="flex-1"
							/>
							<CustomButton
								title="Add"
								onPress={handleAddStyle}
								variant="primary"
								size="sm"
								className="flex-1"
								disabled={!newStyleName.trim() || !selectedImageUri}
							/>
						</View>
					</View>
				</View>
			</Modal>

			{/* Edit Style Modal */}
			<Modal
				visible={showEditModal}
				transparent={true}
				animationType="fade"
				onRequestClose={handleCancelEdit}
			>
				<View className="flex-1 bg-black/50 justify-center items-center px-6">
					<TouchableOpacity
						className="absolute inset-0"
						activeOpacity={1}
						onPress={handleCancelEdit}
					/>
					<View className="bg-white rounded-2xl p-4 w-full relative">
						<TouchableOpacity
							onPress={handleCancelEdit}
							className="absolute top-4 right-4 z-10"
							activeOpacity={0.7}
						>
							<Octicons name="x" size={20} color="#6B7280" />
						</TouchableOpacity>
						<ThemedText variant="title-md" className="text-gray-900" extraBold>
							Edit Style
						</ThemedText>
						<ThemedText variant="body" className="text-gray-600 mb-3">
							Update the name and image for this style
						</ThemedText>

						{/* Image Upload Section */}
						<View className="mb-4">
							<TouchableOpacity
								onPress={handleEditImageSelect}
								className="bg-gray-100 h-48 w-full flex justify-center border-dashed border-gray-300 rounded-3xl p-12 items-center overflow-hidden"
								activeOpacity={0.7}
							>
								{editImageUri ? (
									<View className="absolute inset-0">
										<Image
											source={{ uri: editImageUri }}
											className="w-full h-full"
											resizeMode="cover"
										/>
										{/* Overlay for changing photo */}
										<View className="absolute inset-0 bg-black/20 items-center justify-center">
											<View className="bg-white/90 rounded-full p-3">
												<Octicons name="pencil" size={24} color="#111827" />
											</View>
										</View>
									</View>
								) : (
									<View className="items-center">
										<Octicons
											name="image"
											size={60}
											color="#D1D5DB"
											className="mb-4"
										/>

										<CustomButton
											title={
												isLoadingEditImage ? 'Loading...' : 'Select image'
											}
											onPress={handleEditImageSelect}
											icon={isLoadingEditImage ? undefined : 'plus'}
											iconPosition="left"
											className="!w-fit"
											variant="primary"
											size="sm"
											disabled={isLoadingEditImage}
											loading={isLoadingEditImage}
										/>
									</View>
								)}
							</TouchableOpacity>
						</View>

						<TextInput
							value={editStyleName}
							onChangeText={setEditStyleName}
							placeholder="e.g., Art Deco, Mid-Century, etc."
							className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 mb-4 text-gray-900"
							placeholderTextColor="#9CA3AF"
							autoFocus
						/>

						<TextInput
							value={editStylePrompt}
							onChangeText={setEditStylePrompt}
							placeholder={
								detectedMode === 'garden'
									? 'e.g., lush green foliage, colorful flower beds, winding stone pathways, decorative garden ornaments, peaceful water features, organic shapes and natural textures'
									: detectedMode === 'exterior-design'
										? 'e.g., sleek contemporary architecture with clean geometric lines, flat roofs, large windows, neutral color palette, smooth exterior materials like stucco or metal panels'
										: 'e.g., clean lines, minimalist furniture, neutral color palette with white and grey, sleek surfaces, geometric shapes, open floor plan'
							}
							multiline
							numberOfLines={4}
							className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 mb-4 text-gray-900"
							placeholderTextColor="#9CA3AF"
							textAlignVertical="top"
						/>
						<ThemedText variant="body" className="text-gray-600 text-sm mb-4 -mt-2">
							This prompt will be used when generating images with this style
						</ThemedText>

						<View className="flex-row gap-2 mb-8">
							<CustomButton
								title="Delete"
								onPress={handleDeleteStyle}
								variant="ghost"
								size="sm"
								className="flex-1"
							/>
							<CustomButton
								title="Save"
								onPress={handleEditStyle}
								variant="primary"
								size="sm"
								className="flex-1"
								disabled={!editStyleName.trim()}
							/>
						</View>
					</View>
				</View>
			</Modal>
		</View>
	);
}
