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
	mode?: 'garden' | 'interior-design';
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

export function StyleStep({
	onStyleSelect,
	config,
	selectedStyle,
	compact = false,
	mode = 'interior-design',
}: StyleStepProps) {
	// Determine mode from config if not explicitly provided
	// Check if config description suggests garden (fragile, but works)
	const detectedMode: 'garden' | 'interior-design' =
		config.description?.toLowerCase().includes('garden') ||
		config.title?.toLowerCase().includes('garden')
			? 'garden'
			: mode || 'interior-design';

	const storageKey = detectedMode === 'garden' ? 'customGardenStyles' : 'customInteriorStyles';

	const [selectedStyleId, setSelectedStyleId] = useState<string | null>(
		selectedStyle?.id || null
	);
	const [customStyles, setCustomStyles] = useState<Style[]>([]);
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
	const [allStyles, setAllStyles] = useState<Style[]>(styleTypes);

	// Load custom styles from AsyncStorage on component mount
	useEffect(() => {
		loadCustomStyles();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [detectedMode]);

	// Update allStyles when customStyles change - custom styles first
	useEffect(() => {
		setAllStyles([...customStyles, ...styleTypes]);
	}, [customStyles]);

	const loadCustomStyles = async () => {
		try {
			const stored = await AsyncStorage.getItem(storageKey);
			if (stored) {
				const parsedStyles = JSON.parse(stored);
				setCustomStyles(parsedStyles);
			}
		} catch (error) {
			console.error('Error loading custom styles:', error);
		}
	};

	const saveCustomStyles = async (styles: Style[]) => {
		try {
			await AsyncStorage.setItem(storageKey, JSON.stringify(styles));
		} catch (error) {
			console.error('Error saving custom styles:', error);
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

			const updatedCustomStyles = [...customStyles, newStyle];
			setCustomStyles(updatedCustomStyles);
			saveCustomStyles(updatedCustomStyles);

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
			const updatedCustomStyles = customStyles.map((style) =>
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
			setCustomStyles(updatedCustomStyles);
			saveCustomStyles(updatedCustomStyles);

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
			const updatedCustomStyles = customStyles.filter(
				(style) => style.id !== editingStyle.id
			);
			setCustomStyles(updatedCustomStyles);
			saveCustomStyles(updatedCustomStyles);

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
					{allStyles.map((style) => {
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
			<View className="items-start mb-6">
				<ThemedText variant="title-md" className="text-gray-900 mb-2 text-center" extraBold>
					{config.title}
				</ThemedText>
				<ThemedText variant="body" className="text-gray-600">
					{config.description}
				</ThemedText>
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
					{allStyles.map((style) => {
						const isSelected = selectedStyleId === style.id;

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
