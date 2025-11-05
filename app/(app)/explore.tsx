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
import { Ionicons, Octicons } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.5; // 70% of screen width for horizontal cards
const MODAL_CARD_WIDTH = (SCREEN_WIDTH - 60) / 2; // For modal grid view

// Room types (from RoomStep)
interface Room {
	id: string;
	name: string;
	icon: string;
	iconType?: 'octicons' | 'material' | 'material-community' | 'ionicons';
	description: string;
	imageUrl: string;
	count: number;
}

const roomTypes: Room[] = [
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

// House types (from houseTypePrompts)
interface HouseType {
	id: string;
	name: string;
	description: string;
	imageUrl: string;
	count: number;
}

const houseTypes: HouseType[] = [
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

// Garden inspiration images
interface InspirationImage {
	id: string;
	imageUrl: string;
	title: string;
	style?: string;
}

const gardenImages: InspirationImage[] = [
	{
		id: 'gard-1',
		imageUrl: 'https://leafly-app.s3.eu-west-2.amazonaws.com/garden-good.webp',
		title: 'Lush Garden',
		style: 'Natural',
	},
	{
		id: 'gard-2',
		imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800',
		title: 'Modern Landscaping',
		style: 'Modern',
	},
	{
		id: 'gard-3',
		imageUrl: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=800',
		title: 'Zen Garden',
		style: 'Zen',
	},
	{
		id: 'gard-4',
		imageUrl: 'https://images.unsplash.com/photo-1600298881974-6be191ceeda1?w=800',
		title: 'English Garden',
		style: 'Traditional',
	},
	{
		id: 'gard-5',
		imageUrl: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=800',
		title: 'Tropical Paradise',
		style: 'Tropical',
	},
	{
		id: 'gard-6',
		imageUrl: 'https://images.unsplash.com/photo-1599619865309-e2e42cd1d9e1?w=800',
		title: 'Desert Landscape',
		style: 'Desert',
	},
];

// Room Card Component
const RoomCard = ({ room, width }: { room: Room; width: number }) => {
	const scaleAnim = useRef(new Animated.Value(1)).current;

	const handlePressIn = () => {
		Animated.spring(scaleAnim, {
			toValue: 0.95,
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

	const handlePress = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		// TODO: Navigate to style transfer modal when built
		Alert.alert('Coming Soon', 'Style transfer feature is coming soon! 🎨');
	};

	return (
		<Animated.View
			style={{
				transform: [{ scale: scaleAnim }],
				width: width,
				marginRight: 12,
			}}
		>
			<TouchableOpacity
				onPress={handlePress}
				onPressIn={handlePressIn}
				onPressOut={handlePressOut}
				activeOpacity={1}
				className="bg-white rounded-2xl overflow-hidden border-2 border-gray-200"
			>
				<View className="relative" style={{ height: width * 0.75 }}>
					<Image
						source={{ uri: room.imageUrl }}
						style={{
							width: '100%',
							height: '100%',
						}}
						resizeMode="cover"
					/>
					{/* Dark overlay gradient */}
					<View className="absolute inset-0 bg-black/20" />
					{/* Count text overlay at bottom center */}
					<View className="absolute bottom-0 left-0 right-0 items-center pb-3">
						<View className="bg-white/90 backdrop-blur-sm px-4 py-1 rounded-full">
							<ThemedText variant="body" bold className="text-gray-900">
								{room.count} designs
							</ThemedText>
						</View>
					</View>
				</View>
				{/* Room name below image */}
				<View className="p-3">
					<ThemedText variant="title-sm" bold className="text-gray-900 text-center">
						{room.name}
					</ThemedText>
				</View>
			</TouchableOpacity>
		</Animated.View>
	);
};

// House Type Card Component
const HouseTypeCard = ({ houseType, width }: { houseType: HouseType; width: number }) => {
	const scaleAnim = useRef(new Animated.Value(1)).current;

	const handlePressIn = () => {
		Animated.spring(scaleAnim, {
			toValue: 0.95,
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

	const handlePress = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		// TODO: Navigate to style transfer modal when built
		Alert.alert('Coming Soon', 'Style transfer feature is coming soon! 🎨');
	};

	return (
		<Animated.View
			style={{
				transform: [{ scale: scaleAnim }],
				width: width,
				marginRight: 12,
			}}
		>
			<TouchableOpacity
				onPress={handlePress}
				onPressIn={handlePressIn}
				onPressOut={handlePressOut}
				activeOpacity={1}
				className="bg-white rounded-2xl overflow-hidden border-2 border-gray-200"
			>
				<View className="relative" style={{ height: width * 0.75 }}>
					<Image
						source={{ uri: houseType.imageUrl }}
						style={{
							width: '100%',
							height: '100%',
						}}
						resizeMode="cover"
					/>
					{/* Dark overlay gradient */}
					<View className="absolute inset-0 bg-black/20" />
					{/* Count text overlay at bottom center */}
					<View className="absolute bottom-0 left-0 right-0 items-center pb-3">
						<View className="bg-white/90 backdrop-blur-sm px-4 py-1 rounded-full">
							<ThemedText variant="body" bold className="text-gray-900">
								{houseType.count} designs
							</ThemedText>
						</View>
					</View>
				</View>
				{/* House type name below image */}
				<View className="p-3">
					<ThemedText variant="title-sm" bold className="text-gray-900 text-center">
						{houseType.name}
					</ThemedText>
				</View>
			</TouchableOpacity>
		</Animated.View>
	);
};

// Garden Inspiration Card Component
const InspirationCard = ({
	item,
	width,
	isModal = false,
}: {
	item: InspirationImage;
	width: number;
	isModal?: boolean;
}) => {
	const scaleAnim = useRef(new Animated.Value(1)).current;

	const handlePressIn = () => {
		Animated.spring(scaleAnim, {
			toValue: 0.95,
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

	const handlePress = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		// TODO: Navigate to style transfer modal when built
		Alert.alert('Coming Soon', 'Style transfer feature is coming soon! 🎨');
	};

	return (
		<Animated.View
			style={{
				transform: [{ scale: scaleAnim }],
				width: width,
				marginRight: isModal ? 0 : 12,
			}}
		>
			<TouchableOpacity
				onPress={handlePress}
				onPressIn={handlePressIn}
				onPressOut={handlePressOut}
				activeOpacity={1}
				className="bg-white rounded-2xl overflow-hidden border-2 border-gray-200"
			>
				<Image
					source={{ uri: item.imageUrl }}
					style={{
						width: '100%',
						height: width * 0.75,
					}}
					resizeMode="cover"
				/>
				<View className="p-3">
					<ThemedText variant="title-sm" bold className="text-gray-900">
						{item.title}
					</ThemedText>
					{item.style && (
						<ThemedText variant="body" className="text-gray-500 text-base">
							{item.style}
						</ThemedText>
					)}
				</View>
			</TouchableOpacity>
		</Animated.View>
	);
};

// View All Modal for Garden
const ViewAllModal = ({
	visible,
	onClose,
	title,
	images,
}: {
	visible: boolean;
	onClose: () => void;
	title: string;
	images: InspirationImage[];
}) => {
	const insets = useSafeAreaInsets();

	return (
		<Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
			<View className="flex-1 bg-gray-50">
				{/* Modal Header */}
				<View
					className="flex-row items-center justify-between pb-4 px-6 bg-white border-b border-gray-200"
					style={{ paddingTop: insets.top + 16 }}
				>
					<ThemedText extraBold className="text-gray-900" variant="title-lg">
						{title}
					</ThemedText>
					<TouchableOpacity
						onPress={() => {
							Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
							onClose();
						}}
						className="p-2"
					>
						<Ionicons name="close" size={28} color="#111827" />
					</TouchableOpacity>
				</View>

				{/* Modal Content */}
				<FlatList
					data={images}
					renderItem={({ item }) => (
						<InspirationCard item={item} width={MODAL_CARD_WIDTH} isModal />
					)}
					keyExtractor={(item) => item.id}
					numColumns={2}
					contentContainerStyle={{
						padding: 24,
						gap: 16,
					}}
					columnWrapperStyle={{
						gap: 12,
					}}
					showsVerticalScrollIndicator={false}
				/>
			</View>
		</Modal>
	);
};

export default function ExplorePage() {
	const insets = useSafeAreaInsets();
	const [modalVisible, setModalVisible] = useState(false);
	const [modalData, setModalData] = useState<{
		title: string;
		images: InspirationImage[];
	}>({ title: '', images: [] });

	const handleViewAll = (title: string, images: InspirationImage[]) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setModalData({ title, images });
		setModalVisible(true);
	};

	const renderInteriorSection = () => (
		<View className="mb-6">
			<View className="flex-row items-center justify-between mb-2 px-5">
				<View className="flex-row items-center flex-1">
					<Octicons name="home" size={24} color="#111827" />
					<View className="ml-2 flex-1">
						<ThemedText variant="title-sm" extraBold className="text-gray-900">
							Interior Designs
						</ThemedText>
					</View>
				</View>
			</View>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={{ paddingHorizontal: 16 }}
			>
				{roomTypes.map((room) => (
					<RoomCard key={room.id} room={room} width={CARD_WIDTH} />
				))}
			</ScrollView>
		</View>
	);

	const renderExteriorSection = () => (
		<View className="mb-6">
			<View className="flex-row items-center justify-between mb-2 px-4">
				<View className="flex-row items-center flex-1">
					<MaterialCommunityIcons name="office-building" size={24} color="#111827" />
					<View className="ml-2 flex-1">
						<ThemedText variant="title-sm" extraBold className="text-gray-900">
							Exterior Designs
						</ThemedText>
					</View>
				</View>
			</View>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={{ paddingHorizontal: 16 }}
			>
				{houseTypes.map((houseType) => (
					<HouseTypeCard key={houseType.id} houseType={houseType} width={CARD_WIDTH} />
				))}
			</ScrollView>
		</View>
	);

	const renderGardenSection = () => (
		<View className="">
			<View className="flex-row items-center justify-between  px-4">
				<View className="flex-row items-center flex-1">
					<MaterialCommunityIcons name="flower-tulip-outline" size={24} color="#111827" />
					<View className="ml-2 flex-1">
						<ThemedText variant="title-sm" extraBold className="text-gray-900">
							Garden Designs
						</ThemedText>
					</View>
				</View>
				<TouchableOpacity
					onPress={() => handleViewAll('Garden Designs', gardenImages)}
					className="px-3 py-2"
				>
					<ThemedText variant="body" bold className="text-gray-900">
						View all
					</ThemedText>
				</TouchableOpacity>
			</View>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={{ paddingHorizontal: 16 }}
			>
				{gardenImages.slice(0, 5).map((image) => (
					<InspirationCard key={image.id} item={image} width={CARD_WIDTH} />
				))}
			</ScrollView>
		</View>
	);

	return (
		<>
			<View className="flex-1 bg-gray-50">
				{/* Header */}
				<View className="pb-4 px-6" style={{ paddingTop: insets.top + 16 }}>
					<View className="flex-row items-center justify-center">
						<ThemedText extraBold className="text-gray-900" variant="title-lg">
							Explore
						</ThemedText>
					</View>
				</View>

				<ScrollView
					className="flex-1"
					contentContainerStyle={{ paddingBottom: 32 }}
					showsVerticalScrollIndicator={false}
				>
					{renderInteriorSection()}
					{renderExteriorSection()}
					{renderGardenSection()}
				</ScrollView>
			</View>

			{/* View All Modal */}
			<ViewAllModal
				visible={modalVisible}
				onClose={() => setModalVisible(false)}
				title={modalData.title}
				images={modalData.images}
			/>
		</>
	);
}
