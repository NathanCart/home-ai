import React, { useRef, useState } from 'react';
import {
	View,
	ScrollView,
	TouchableOpacity,
	Image,
	Animated,
	Alert,
	Dimensions,
	Modal,
	FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from 'components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface HouseType {
	id: string;
	name: string;
	description: string;
	imageUrl: string;
	count: number;
}

export const houseTypes: HouseType[] = [
	{
		id: 'house',
		name: 'House',
		description: 'Single-family home exterior',
		imageUrl: 'https://leafly-app.s3.eu-west-2.amazonaws.com/exterior-good.webp',
		count: 32,
	},
	{
		id: 'apartment',
		name: 'Apartment',
		description: 'Multi-unit residential building',
		imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
		count: 28,
	},
	{
		id: 'villa',
		name: 'Villa',
		description: 'Luxury detached home',
		imageUrl: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800',
		count: 19,
	},
	{
		id: 'townhouse',
		name: 'Townhouse',
		description: 'Multi-story attached home',
		imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
		count: 15,
	},
	{
		id: 'cottage',
		name: 'Cottage',
		description: 'Charming country home',
		imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
		count: 14,
	},
	{
		id: 'mansion',
		name: 'Mansion',
		description: 'Grand estate home',
		imageUrl: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800',
		count: 12,
	},
	{
		id: 'office-building',
		name: 'Office Building',
		description: 'Commercial office exterior',
		imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
		count: 21,
	},
	{
		id: 'retail-building',
		name: 'Retail Building',
		description: 'Commercial storefront',
		imageUrl: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800',
		count: 17,
	},
];

const generateSampleImages = (typeId: string, count: number): string[] => {
	const baseImages = [
		'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
		'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800',
		'https://images.unsplash.com/photo-1556912167-f556f1f39fdf?w=800',
		'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800',
		'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=800',
		'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800',
		'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800',
		'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
		'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800',
		'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800',
		'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
		'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
		'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800',
		'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
		'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800',
	];
	return Array.from({ length: count }, (_, i) => baseImages[i % baseImages.length]);
};

const HouseTypeListItem = ({
	houseType,
	onViewAll,
}: {
	houseType: HouseType;
	onViewAll: (houseType: HouseType) => void;
}) => {
	const scaleAnim = useRef(new Animated.Value(1)).current;

	const handlePressIn = () => {
		Animated.spring(scaleAnim, {
			toValue: 0.98,
			useNativeDriver: true,
		}).start();
	};

	const handlePressOut = () => {
		Animated.spring(scaleAnim, {
			toValue: 1,
			friction: 3,
			tension: 40,
			useNativeDriver: true,
		}).start();
	};

	return (
		<Animated.View
			style={{
				transform: [{ scale: scaleAnim }],
			}}
			className="mb-4"
		>
			<View className="bg-white rounded-2xl overflow-hidden border-2 border-gray-200">
				<View className="relative" style={{ height: 200 }}>
					<Image
						source={{ uri: houseType.imageUrl }}
						style={{
							width: '100%',
							height: '100%',
						}}
						resizeMode="cover"
					/>
					<View className="absolute inset-0 bg-black/20" />
					<View className="absolute bottom-0 left-0 right-0 p-4">
						<ThemedText variant="title-sm" extraBold className="text-white mb-1">
							{houseType.name}
						</ThemedText>
						<ThemedText variant="body" className="text-gray-100 text-sm">
							{houseType.count} designs available
						</ThemedText>
					</View>
				</View>
				<TouchableOpacity
					onPress={() => {
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
						onViewAll(houseType);
					}}
					onPressIn={handlePressIn}
					onPressOut={handlePressOut}
					className="p-4 bg-gray-50"
				>
					<View className="flex-row items-center justify-between">
						<ThemedText variant="body" className="text-gray-600">
							View all {houseType.count} designs
						</ThemedText>
						<Ionicons name="chevron-forward" size={20} color="#6B7280" />
					</View>
				</TouchableOpacity>
			</View>
		</Animated.View>
	);
};

interface ViewAllExteriorModalProps {
	visible: boolean;
	onClose: () => void;
	onHouseTypeViewAll?: (houseType: HouseType) => void;
}

export function ViewAllExteriorModal({
	visible,
	onClose,
	onHouseTypeViewAll,
}: ViewAllExteriorModalProps) {
	const insets = useSafeAreaInsets();
	const [viewMode, setViewMode] = useState<'list' | 'gallery'>('list');
	const [galleryData, setGalleryData] = useState<{ title: string; images: string[] }>({
		title: '',
		images: [],
	});
	const slideAnim = useRef(new Animated.Value(0)).current;

	const handleHouseTypeViewAll = (houseType: HouseType) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		const images = generateSampleImages(houseType.id, houseType.count);
		setGalleryData({ title: houseType.name, images });

		// Animate to gallery view
		Animated.timing(slideAnim, {
			toValue: 1,
			duration: 300,
			useNativeDriver: true,
		}).start();
		setViewMode('gallery');
	};

	const handleBack = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		// Animate back to list view
		Animated.timing(slideAnim, {
			toValue: 0,
			duration: 300,
			useNativeDriver: true,
		}).start(() => {
			setViewMode('list');
		});
	};

	const handleClose = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		if (viewMode === 'gallery') {
			handleBack();
			setTimeout(() => {
				onClose();
				setViewMode('list');
				slideAnim.setValue(0);
			}, 300);
		} else {
			onClose();
		}
	};

	const columnWidth = (SCREEN_WIDTH - 48) / 2;
	const getImageHeight = (index: number) => {
		const heights = [200, 250, 180, 220, 190, 240];
		return heights[index % heights.length];
	};

	const listTranslateX = slideAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [0, -SCREEN_WIDTH],
	});

	const galleryTranslateX = slideAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [SCREEN_WIDTH, 0],
	});

	return (
		<Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
			<View className="flex-1 bg-gray-50">
				<View
					className="flex-row items-center justify-between pb-4 px-6 bg-white border-b border-gray-200"
					style={{ paddingTop: insets.top + 16 }}
				>
					<View className="flex-row items-center flex-1">
						{viewMode === 'gallery' && (
							<TouchableOpacity onPress={handleBack} className="mr-3 p-2">
								<Ionicons name="arrow-back" size={24} color="#111827" />
							</TouchableOpacity>
						)}
						<ThemedText extraBold className="text-gray-900" variant="title-lg">
							{viewMode === 'gallery' ? galleryData.title : 'Exterior Designs'}
						</ThemedText>
					</View>
					<TouchableOpacity onPress={handleClose} className="p-2">
						<Ionicons name="close" size={28} color="#111827" />
					</TouchableOpacity>
				</View>

				<View className="flex-1" style={{ overflow: 'hidden' }}>
					{/* List View */}
					<Animated.View
						style={{
							position: 'absolute',
							width: SCREEN_WIDTH,
							height: '100%',
							transform: [{ translateX: listTranslateX }],
						}}
					>
						<FlatList
							data={houseTypes}
							renderItem={({ item }) => (
								<HouseTypeListItem houseType={item} onViewAll={handleHouseTypeViewAll} />
							)}
							keyExtractor={(item) => item.id}
							contentContainerStyle={{ padding: 24 }}
							showsVerticalScrollIndicator={false}
						/>
					</Animated.View>

					{/* Gallery View */}
					<Animated.View
						style={{
							position: 'absolute',
							width: SCREEN_WIDTH,
							height: '100%',
							transform: [{ translateX: galleryTranslateX }],
						}}
					>
						<ScrollView
							contentContainerStyle={{ padding: 16 }}
							showsVerticalScrollIndicator={false}
						>
							<View className="flex-row flex-wrap justify-between">
								{galleryData.images.map((imageUrl, index) => {
									const height = getImageHeight(index);
									return (
										<TouchableOpacity
											key={index}
											onPress={() => {
												Haptics.impactAsync(
													Haptics.ImpactFeedbackStyle.Medium
												);
												Alert.alert(
													'Coming Soon',
													'Style transfer feature is coming soon! 🎨'
												);
											}}
											className="mb-3 rounded-2xl overflow-hidden"
											style={{
												width: columnWidth,
												height: height,
											}}
										>
											<Image
												source={{ uri: imageUrl }}
												style={{
													width: '100%',
													height: '100%',
												}}
												resizeMode="cover"
											/>
										</TouchableOpacity>
									);
								})}
							</View>
						</ScrollView>
					</Animated.View>
				</View>
			</View>
		</Modal>
	);
}

