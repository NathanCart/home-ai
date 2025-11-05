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

export interface Room {
	id: string;
	name: string;
	icon: string;
	iconType?: 'octicons' | 'material' | 'material-community' | 'ionicons';
	description: string;
	imageUrl: string;
	count: number;
}

export const roomTypes: Room[] = [
	{
		id: 'living-room',
		name: 'Living Room',
		icon: 'home',
		description: 'Main gathering space for relaxation and entertainment',
		imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
		count: 24,
	},
	{
		id: 'bedroom',
		name: 'Bedroom',
		icon: 'bed',
		iconType: 'material',
		description: 'Personal space for rest and relaxation',
		imageUrl: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800',
		count: 18,
	},
	{
		id: 'kitchen',
		name: 'Kitchen',
		icon: 'kitchen',
		iconType: 'material',
		description: 'Cooking and dining area',
		imageUrl: 'https://images.unsplash.com/photo-1556912167-f556f1f39fdf?w=800',
		count: 22,
	},
	{
		id: 'bathroom',
		name: 'Bathroom',
		icon: 'shower',
		iconType: 'material-community',
		description: 'Personal hygiene and grooming space',
		imageUrl: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800',
		count: 15,
	},
	{
		id: 'dining-room',
		name: 'Dining Room',
		icon: 'table',
		description: 'Formal dining and meal space',
		imageUrl: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800',
		count: 12,
	},
	{
		id: 'office',
		name: 'Home Office',
		icon: 'briefcase',
		description: 'Work and productivity space',
		imageUrl: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800',
		count: 16,
	},
	{
		id: 'nursery',
		name: 'Nursery',
		icon: 'heart',
		description: 'Baby and child room',
		imageUrl: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800',
		count: 10,
	},
	{
		id: 'basement',
		name: 'Basement',
		icon: 'arrow-down',
		description: 'Lower level storage and utility space',
		imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
		count: 8,
	},
	{
		id: 'attic',
		name: 'Attic',
		icon: 'home-roof',
		iconType: 'material-community',
		description: 'Upper storage and additional space',
		imageUrl: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800',
		count: 7,
	},
	{
		id: 'garage',
		name: 'Garage',
		icon: 'car-outline',
		iconType: 'ionicons',
		description: 'Vehicle storage and workshop space',
		imageUrl: 'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800',
		count: 9,
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

const RoomTypeListItem = ({ room, onViewAll }: { room: Room; onViewAll: (room: Room) => void }) => {
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
						source={{ uri: room.imageUrl }}
						style={{
							width: '100%',
							height: '100%',
						}}
						resizeMode="cover"
					/>
					<View className="absolute inset-0 bg-black/20" />
					<View className="absolute bottom-0 left-0 right-0 p-4">
						<ThemedText variant="title-sm" extraBold className="text-white mb-1">
							{room.name}
						</ThemedText>
						<ThemedText variant="body" className="text-gray-100 text-sm">
							{room.count} designs available
						</ThemedText>
					</View>
				</View>
				<TouchableOpacity
					onPress={() => {
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
						onViewAll(room);
					}}
					onPressIn={handlePressIn}
					onPressOut={handlePressOut}
					className="p-4 bg-gray-50"
				>
					<View className="flex-row items-center justify-between">
						<ThemedText variant="body" className="text-gray-600">
							View all {room.count} designs
						</ThemedText>
						<Ionicons name="chevron-forward" size={20} color="#6B7280" />
					</View>
				</TouchableOpacity>
			</View>
		</Animated.View>
	);
};

interface ViewAllInteriorModalProps {
	visible: boolean;
	onClose: () => void;
	onRoomViewAll?: (room: Room) => void;
}

export function ViewAllInteriorModal({
	visible,
	onClose,
	onRoomViewAll,
}: ViewAllInteriorModalProps) {
	const insets = useSafeAreaInsets();
	const [viewMode, setViewMode] = useState<'list' | 'gallery'>('list');
	const [galleryData, setGalleryData] = useState<{ title: string; images: string[] }>({
		title: '',
		images: [],
	});
	const slideAnim = useRef(new Animated.Value(0)).current;

	const handleRoomViewAll = (room: Room) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		const images = generateSampleImages(room.id, room.count);
		setGalleryData({ title: room.name, images });

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
							{viewMode === 'gallery' ? galleryData.title : 'Interior Designs'}
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
							data={roomTypes}
							renderItem={({ item }) => (
								<RoomTypeListItem room={item} onViewAll={handleRoomViewAll} />
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

