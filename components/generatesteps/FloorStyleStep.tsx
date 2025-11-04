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
import { FLOOR_STYLES, FloorStyle } from '../../utils/floorStylePrompts';

interface FloorStyleStepProps {
	onFloorStyleSelect?: (floorStyle: FloorStyle | null) => void;
	config: StepConfig;
	selectedFloorStyle?: FloorStyle | null;
}

export function FloorStyleStep({
	onFloorStyleSelect,
	config,
	selectedFloorStyle,
}: FloorStyleStepProps) {
	const storageKey = 'customFloorStyles';

	const [selectedFloorStyleId, setSelectedFloorStyleId] = useState<string | null>(
		selectedFloorStyle?.id || null
	);
	const [customFloorStyles, setCustomFloorStyles] = useState<FloorStyle[]>([]);
	const [showAddModal, setShowAddModal] = useState<boolean>(false);
	const [newStyleName, setNewStyleName] = useState<string>('');
	const [newStylePrompt, setNewStylePrompt] = useState<string>('');
	const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
	const [showEditModal, setShowEditModal] = useState<boolean>(false);
	const [editingStyle, setEditingStyle] = useState<FloorStyle | null>(null);
	const [editStyleName, setEditStyleName] = useState<string>('');
	const [editStylePrompt, setEditStylePrompt] = useState<string>('');
	const [editImageUri, setEditImageUri] = useState<string | null>(null);
	const [isLoadingImage, setIsLoadingImage] = useState<boolean>(false);
	const [isLoadingEditImage, setIsLoadingEditImage] = useState<boolean>(false);
	const [allFloorStyles, setAllFloorStyles] = useState<FloorStyle[]>(FLOOR_STYLES);

	// Load custom floor styles from AsyncStorage on component mount
	useEffect(() => {
		loadCustomFloorStyles();
	}, []);

	// Update allFloorStyles when customFloorStyles change - custom styles first
	useEffect(() => {
		setAllFloorStyles([...customFloorStyles, ...FLOOR_STYLES]);
	}, [customFloorStyles]);

	const loadCustomFloorStyles = async () => {
		try {
			const stored = await AsyncStorage.getItem(storageKey);
			if (stored) {
				const parsedStyles = JSON.parse(stored);
				setCustomFloorStyles(parsedStyles);
			}
		} catch (error) {
			console.error('Error loading custom floor styles:', error);
		}
	};

	const saveCustomFloorStyles = async (styles: FloorStyle[]) => {
		try {
			await AsyncStorage.setItem(storageKey, JSON.stringify(styles));
		} catch (error) {
			console.error('Error saving custom floor styles:', error);
		}
	};

	const handleFloorStyleSelect = (floorStyle: FloorStyle) => {
		setSelectedFloorStyleId(floorStyle.id);
		onFloorStyleSelect?.(floorStyle);
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
			const newStyle: FloorStyle = {
				id: `custom-floor-${Date.now()}`,
				name: newStyleName.trim(),
				description: 'Custom floor style',
				imageUrl: selectedImageUri,
				prompt: newStylePrompt.trim() || 'custom floor style',
			};

			const updatedCustomStyles = [...customFloorStyles, newStyle];
			setCustomFloorStyles(updatedCustomStyles);
			saveCustomFloorStyles(updatedCustomStyles);

			// Auto-select the newly added style
			setSelectedFloorStyleId(newStyle.id);
			onFloorStyleSelect?.(newStyle);

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

	const handleLongPress = (style: FloorStyle) => {
		// Only allow editing custom styles
		if (style.id.startsWith('custom-floor-')) {
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
			const updatedCustomStyles = customFloorStyles.map((style) =>
				style.id === editingStyle.id
					? {
							...style,
							name: editStyleName.trim(),
							description: 'Custom floor style',
							imageUrl: editImageUri || style.imageUrl,
							prompt: editStylePrompt.trim() || 'custom floor style',
						}
					: style
			);
			setCustomFloorStyles(updatedCustomStyles);
			saveCustomFloorStyles(updatedCustomStyles);

			// Update selected style if it was the one being edited
			if (selectedFloorStyleId === editingStyle.id) {
				const updatedStyle = {
					...editingStyle,
					name: editStyleName.trim(),
					description: 'Custom floor style',
					imageUrl: editImageUri || editingStyle.imageUrl,
					prompt: editStylePrompt.trim() || 'custom floor style',
				};
				onFloorStyleSelect?.(updatedStyle);
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
			const updatedCustomStyles = customFloorStyles.filter(
				(style) => style.id !== editingStyle.id
			);
			setCustomFloorStyles(updatedCustomStyles);
			saveCustomFloorStyles(updatedCustomStyles);

			// Clear selection if the deleted style was selected
			if (selectedFloorStyleId === editingStyle.id) {
				setSelectedFloorStyleId(null);
				onFloorStyleSelect?.(null);
			}

			setEditStyleName('');
			setEditStylePrompt('');
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

					{allFloorStyles.map((floorStyle) => {
						const isSelected = selectedFloorStyleId === floorStyle.id;

						return (
							<TouchableOpacity
								key={floorStyle.id}
								onPress={() => handleFloorStyleSelect(floorStyle)}
								onLongPress={() => handleLongPress(floorStyle)}
								className={`w-[48%] h-32 rounded-2xl overflow-hidden border-2 border-gray-200 ${
									isSelected ? '!border-blue-500' : ''
								}`}
								activeOpacity={0.8}
							>
								<ImageBackground
									source={{ uri: floorStyle.imageUrl }}
									className="flex-1"
									resizeMode="cover"
								>
									<View className="flex-1 bg-black/40 justify-end p-3">
										<ThemedText
											variant="body"
											className="text-white font-bold text-sm"
											extraBold
										>
											{floorStyle.name}
										</ThemedText>
										<ThemedText variant="body" className="text-white text-xs">
											{floorStyle.description}
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
							Add New Floor Style
						</ThemedText>
						<ThemedText variant="body" className="text-gray-600 mb-3">
							Enter the name and upload an image for the floor style
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
							placeholder="e.g., Cherry Wood, Blue Tile, etc."
							className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 mb-4 text-gray-900"
							placeholderTextColor="#9CA3AF"
							autoFocus
						/>

						<TextInput
							value={newStylePrompt}
							onChangeText={setNewStylePrompt}
							placeholder="e.g., rich cherry hardwood with deep red-brown tones, smooth polished finish, natural wood grain, elegant appearance"
							multiline
							numberOfLines={4}
							className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 mb-4 text-gray-900"
							placeholderTextColor="#9CA3AF"
							textAlignVertical="top"
						/>
						<ThemedText variant="body" className="text-gray-600 text-sm mb-4 -mt-2">
							This prompt will be used when generating floors with this style
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
							Edit Floor Style
						</ThemedText>
						<ThemedText variant="body" className="text-gray-600 mb-3">
							Update the name and image for this floor style
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
							placeholder="e.g., Cherry Wood, Blue Tile, etc."
							className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 mb-4 text-gray-900"
							placeholderTextColor="#9CA3AF"
							autoFocus
						/>

						<TextInput
							value={editStylePrompt}
							onChangeText={setEditStylePrompt}
							placeholder="e.g., rich cherry hardwood with deep red-brown tones, smooth polished finish, natural wood grain, elegant appearance"
							multiline
							numberOfLines={4}
							className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 mb-4 text-gray-900"
							placeholderTextColor="#9CA3AF"
							textAlignVertical="top"
						/>
						<ThemedText variant="body" className="text-gray-600 text-sm mb-4 -mt-2">
							This prompt will be used when generating floors with this style
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

