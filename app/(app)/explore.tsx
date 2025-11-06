import React, { useRef, useState } from 'react';
import {
	View,
	ScrollView,
	TouchableOpacity,
	Image,
	Animated,
	Alert,
	Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from 'components/ThemedText';
import { Octicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_WIDTH = (SCREEN_WIDTH - 48) / 2; // 2 columns with padding

// Deterministic shuffle function - produces same random order every time
const deterministicShuffle = <T,>(array: T[], seed: string): T[] => {
	const shuffled = [...array];
	let hash = 0;
	for (let i = 0; i < seed.length; i++) {
		const char = seed.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32bit integer
	}

	// Simple seeded random number generator
	let random = Math.abs(Math.sin(hash)) * 10000;
	const seededRandom = () => {
		random = Math.abs(Math.sin(random)) * 10000;
		return random - Math.floor(random);
	};

	// Fisher-Yates shuffle with seeded random
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(seededRandom() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}

	return shuffled;
};

// Types
interface Room {
	id: string;
	name: string;
	icon: string;
	iconType?: 'octicons' | 'material' | 'material-community' | 'ionicons';
	description: string;
	images: string[];
	count: number;
}

interface HouseType {
	id: string;
	name: string;
	description: string;
	images: string[];
	count: number;
}

// Room types
const roomTypes: Room[] = [
	{
		id: 'living-room',
		name: 'Living Room',
		icon: 'home',
		description: 'Main gathering space for relaxation and entertainment',
		images: deterministicShuffle(
			Array.from(
				{ length: 79 },
				(_, i) =>
					`https://pingu-app.s3.eu-west-2.amazonaws.com/livingroom${i === 0 ? '1' : i + 1}.jpg`
			),
			'living-room'
		),
		count: 79,
	},
	{
		id: 'bedroom',
		name: 'Bedroom',
		icon: 'bed',
		iconType: 'material',
		description: 'Personal space for rest and relaxation',
		images: ['https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800'],
		count: 18,
	},
	{
		id: 'kitchen',
		name: 'Kitchen',
		icon: 'kitchen',
		iconType: 'material',
		description: 'Cooking and dining area',
		images: ['https://images.unsplash.com/photo-1556912167-f556f1f39fdf?w=800'],
		count: 22,
	},
	{
		id: 'bathroom',
		name: 'Bathroom',
		icon: 'shower',
		iconType: 'material-community',
		description: 'Personal hygiene and grooming space',
		images: ['https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800'],
		count: 15,
	},
	{
		id: 'dining-room',
		name: 'Dining Room',
		icon: 'table',
		description: 'Formal dining and meal space',
		images: ['https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800'],
		count: 12,
	},
	{
		id: 'office',
		name: 'Home Office',
		icon: 'briefcase',
		description: 'Work and productivity space',
		images: ['https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800'],
		count: 16,
	},
	{
		id: 'nursery',
		name: 'Nursery',
		icon: 'heart',
		description: 'Baby and child room',
		images: ['https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800'],
		count: 10,
	},
	{
		id: 'basement',
		name: 'Basement',
		icon: 'arrow-down',
		description: 'Lower level storage and utility space',
		images: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'],
		count: 8,
	},
	{
		id: 'attic',
		name: 'Attic',
		icon: 'home-roof',
		iconType: 'material-community',
		description: 'Upper storage and additional space',
		images: ['https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800'],
		count: 7,
	},
	{
		id: 'garage',
		name: 'Garage',
		icon: 'car-outline',
		iconType: 'ionicons',
		description: 'Vehicle storage and workshop space',
		images: ['https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800'],
		count: 9,
	},
];

// House types
const houseTypes: HouseType[] = [
	{
		id: 'house',
		name: 'House',
		description: 'Single-family home exterior',
		images: ['https://leafly-app.s3.eu-west-2.amazonaws.com/house.png'],
		count: 32,
	},
	{
		id: 'apartment',
		name: 'Apartment',
		description: 'Multi-unit residential building',
		images: ['https://leafly-app.s3.eu-west-2.amazonaws.com/apartment.png'],
		count: 28,
	},
	{
		id: 'villa',
		name: 'Villa',
		description: 'Large luxury detached home',
		images: ['https://leafly-app.s3.eu-west-2.amazonaws.com/villa.png'],
		count: 19,
	},
	{
		id: 'townhouse',
		name: 'Townhouse',
		description: 'Multi-story attached home',
		images: ['https://leafly-app.s3.eu-west-2.amazonaws.com/townhouse.png'],
		count: 15,
	},
	{
		id: 'cottage',
		name: 'Cottage',
		description: 'Small charming rural home',
		images: ['https://leafly-app.s3.eu-west-2.amazonaws.com/cottage.png'],
		count: 14,
	},
	{
		id: 'mansion',
		name: 'Mansion',
		description: 'Large prestigious estate home',
		images: ['https://leafly-app.s3.eu-west-2.amazonaws.com/mansion.png'],
		count: 12,
	},
	{
		id: 'office-building',
		name: 'Office Building',
		description: 'Commercial office building',
		images: ['https://leafly-app.s3.eu-west-2.amazonaws.com/office.png'],
		count: 21,
	},
	{
		id: 'retail-building',
		name: 'Retail Building',
		description: 'Commercial retail or shop building',
		images: ['https://leafly-app.s3.eu-west-2.amazonaws.com/retail.png'],
		count: 17,
	},
];

// Garden images
const gardenImages = ['https://leafly-app.s3.eu-west-2.amazonaws.com/garden-good.webp'];

// Get all images for interior (all rooms combined)
const getAllInteriorImages = (): string[] => {
	const allImages: string[] = [];
	roomTypes.forEach((room) => {
		allImages.push(...room.images);
	});
	return allImages;
};

// Get all images for exterior (all house types combined)
const getAllExteriorImages = (): string[] => {
	const allImages: string[] = [];
	houseTypes.forEach((houseType) => {
		allImages.push(...houseType.images);
	});
	return allImages;
};

// Get images for a specific room type
const getInteriorImagesByRoom = (roomId: string | null): string[] => {
	if (!roomId) return getAllInteriorImages();
	const room = roomTypes.find((r) => r.id === roomId);
	if (!room) return [];
	return room.images;
};

// Get images for a specific house type
const getExteriorImagesByHouseType = (houseTypeId: string | null): string[] => {
	if (!houseTypeId) return getAllExteriorImages();
	const houseType = houseTypes.find((h) => h.id === houseTypeId);
	if (!houseType) return [];
	return houseType.images;
};

// Get random heights for masonry layout
const getImageHeight = (index: number) => {
	const heights = [200, 250, 180, 220, 190, 240, 210, 230, 195, 225];
	return heights[index % heights.length];
};

// Distribute images into two columns for proper masonry layout
const distributeImages = (images: string[]) => {
	const leftColumn: { imageUrl: string; index: number; height: number }[] = [];
	const rightColumn: { imageUrl: string; index: number; height: number }[] = [];
	let leftHeight = 0;
	let rightHeight = 0;

	images.forEach((imageUrl, index) => {
		const height = getImageHeight(index);
		if (leftHeight <= rightHeight) {
			leftColumn.push({ imageUrl, index, height });
			leftHeight += height + 12; // 12px for margin-bottom
		} else {
			rightColumn.push({ imageUrl, index, height });
			rightHeight += height + 12;
		}
	});

	return { leftColumn, rightColumn };
};

type TabType = 'interior' | 'exterior' | 'garden';

export default function ExplorePage() {
	const insets = useSafeAreaInsets();
	const [activeTab, setActiveTab] = useState<TabType>('interior');
	const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
	const [selectedHouseTypeId, setSelectedHouseTypeId] = useState<string | null>(null);

	const handleTabChange = (tab: TabType) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setActiveTab(tab);
		setSelectedRoomId(null);
		setSelectedHouseTypeId(null);
	};

	const handleRoomFilter = (roomId: string | null) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setSelectedRoomId(roomId);
	};

	const handleHouseTypeFilter = (houseTypeId: string | null) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setSelectedHouseTypeId(houseTypeId);
	};

	const getCurrentImages = (): string[] => {
		switch (activeTab) {
			case 'interior':
				return getInteriorImagesByRoom(selectedRoomId);
			case 'exterior':
				return getExteriorImagesByHouseType(selectedHouseTypeId);
			case 'garden':
				return gardenImages;
			default:
				return [];
		}
	};

	const handleImagePress = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		Alert.alert('Coming Soon', 'Style transfer feature is coming soon! 🎨');
	};

	const images = getCurrentImages();
	const { leftColumn, rightColumn } = distributeImages(images);

	return (
		<View className="flex-1 bg-gray-50">
			{/* Header */}
			<View className="pb-4 px-6" style={{ paddingTop: insets.top + 16 }}>
				<View className="flex-row items-center justify-center">
					<ThemedText extraBold className="text-gray-900" variant="title-lg">
						Explore
					</ThemedText>
				</View>
			</View>

			{/* Tabs */}
			<View
				className={`flex-row px-4 border-b border-gray-200 ${activeTab === 'garden' ? 'mb-0' : 'mb-4'}`}
			>
				<TouchableOpacity
					onPress={() => handleTabChange('interior')}
					className="flex-1 items-center pb-3"
					style={{
						borderBottomWidth: activeTab === 'interior' ? 2 : 0,
						borderBottomColor: activeTab === 'interior' ? '#111827' : 'transparent',
					}}
				>
					<View className="flex-row items-center">
						<Octicons
							name="home"
							size={20}
							color={activeTab === 'interior' ? '#111827' : '#9CA3AF'}
						/>
						<ThemedText
							variant="body"
							bold
							className={
								activeTab === 'interior'
									? 'text-gray-900 ml-2'
									: 'text-gray-400 ml-2'
							}
						>
							Interior
						</ThemedText>
					</View>
				</TouchableOpacity>
				<TouchableOpacity
					onPress={() => handleTabChange('exterior')}
					className="flex-1 items-center pb-3"
					style={{
						borderBottomWidth: activeTab === 'exterior' ? 2 : 0,
						borderBottomColor: activeTab === 'exterior' ? '#111827' : 'transparent',
					}}
				>
					<View className="flex-row items-center">
						<MaterialCommunityIcons
							name="office-building"
							size={20}
							color={activeTab === 'exterior' ? '#111827' : '#9CA3AF'}
						/>
						<ThemedText
							variant="body"
							bold
							className={
								activeTab === 'exterior'
									? 'text-gray-900 ml-2'
									: 'text-gray-400 ml-2'
							}
						>
							Exterior
						</ThemedText>
					</View>
				</TouchableOpacity>
				<TouchableOpacity
					onPress={() => handleTabChange('garden')}
					className="flex-1 items-center pb-3"
					style={{
						borderBottomWidth: activeTab === 'garden' ? 2 : 0,
						borderBottomColor: activeTab === 'garden' ? '#111827' : 'transparent',
					}}
				>
					<View className="flex-row items-center">
						<MaterialCommunityIcons
							name="flower-tulip-outline"
							size={20}
							color={activeTab === 'garden' ? '#111827' : '#9CA3AF'}
						/>
						<ThemedText
							variant="body"
							bold
							className={
								activeTab === 'garden' ? 'text-gray-900 ml-2' : 'text-gray-400 ml-2'
							}
						>
							Garden
						</ThemedText>
					</View>
				</TouchableOpacity>
			</View>

			{/* Filter Chips */}
			{(activeTab === 'interior' || activeTab === 'exterior') && (
				<View className="px-4 mb-4">
					<ScrollView horizontal showsHorizontalScrollIndicator={false}>
						<TouchableOpacity
							onPress={() =>
								activeTab === 'interior'
									? handleRoomFilter(null)
									: handleHouseTypeFilter(null)
							}
							className={`px-4 py-2 rounded-full mr-2 ${
								(activeTab === 'interior' && selectedRoomId === null) ||
								(activeTab === 'exterior' && selectedHouseTypeId === null)
									? 'bg-gray-900'
									: 'bg-gray-200'
							}`}
						>
							<ThemedText
								variant="body"
								bold
								className={
									(activeTab === 'interior' && selectedRoomId === null) ||
									(activeTab === 'exterior' && selectedHouseTypeId === null)
										? 'text-white'
										: 'text-gray-700'
								}
							>
								All
							</ThemedText>
						</TouchableOpacity>
						{activeTab === 'interior'
							? roomTypes.map((room) => (
									<TouchableOpacity
										key={room.id}
										onPress={() => handleRoomFilter(room.id)}
										className={`px-4 py-2 rounded-full mr-2 ${
											selectedRoomId === room.id
												? 'bg-gray-900'
												: 'bg-gray-200'
										}`}
									>
										<ThemedText
											variant="body"
											bold
											className={
												selectedRoomId === room.id
													? 'text-white'
													: 'text-gray-700'
											}
										>
											{room.name}
										</ThemedText>
									</TouchableOpacity>
								))
							: houseTypes.map((houseType) => (
									<TouchableOpacity
										key={houseType.id}
										onPress={() => handleHouseTypeFilter(houseType.id)}
										className={`px-4 py-2 rounded-full mr-2 ${
											selectedHouseTypeId === houseType.id
												? 'bg-gray-900'
												: 'bg-gray-200'
										}`}
									>
										<ThemedText
											variant="body"
											bold
											className={
												selectedHouseTypeId === houseType.id
													? 'text-white'
													: 'text-gray-700'
											}
										>
											{houseType.name}
										</ThemedText>
									</TouchableOpacity>
								))}
					</ScrollView>
				</View>
			)}

			{/* Masonry Grid */}
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					padding: 16,
					paddingBottom: 32,
					paddingTop: activeTab === 'garden' ? 16 : 0,
				}}
			>
				<View className="flex-row" style={{ gap: 12 }}>
					{/* Left Column */}
					<View style={{ width: COLUMN_WIDTH }}>
						{leftColumn.map((item) => (
							<TouchableOpacity
								key={item.index}
								onPress={handleImagePress}
								className="mb-3 rounded-3xl overflow-hidden"
								style={{
									width: '100%',
									height: item.height,
								}}
							>
								<Image
									source={{ uri: item.imageUrl }}
									style={{
										width: '100%',
										height: '100%',
									}}
									resizeMode="cover"
								/>
							</TouchableOpacity>
						))}
					</View>

					{/* Right Column */}
					<View style={{ width: COLUMN_WIDTH }}>
						{rightColumn.map((item) => (
							<TouchableOpacity
								key={item.index}
								onPress={handleImagePress}
								className="mb-3 rounded-3xl overflow-hidden"
								style={{
									width: '100%',
									height: item.height,
								}}
							>
								<Image
									source={{ uri: item.imageUrl }}
									style={{
										width: '100%',
										height: '100%',
									}}
									resizeMode="cover"
								/>
							</TouchableOpacity>
						))}
					</View>
				</View>
			</ScrollView>
		</View>
	);
}
