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
import { Ionicons, Octicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { ViewAllInteriorModal, roomTypes, type Room } from 'components/ViewAllInteriorModal';
import { ViewAllExteriorModal, houseTypes, type HouseType } from 'components/ViewAllExteriorModal';
import { ViewAllGardenModal, type InspirationImage } from 'components/ViewAllGardenModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.55; // 70% of screen width for horizontal cards

// Garden inspiration images

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
					<View className="absolute inset-0 bg-black/30" />
					{/* Count text overlay at bottom center */}
					<View className="absolute bottom-0 left-0 right-0 items-center pb-3">
						<View className="bg-white/90 backdrop-blur-sm px-4 py-1 rounded-full">
							<ThemedText variant="title-md" extraBold className="text-gray-900">
								+{room.count}
							</ThemedText>
						</View>
						<ThemedText
							variant="title-md"
							bold
							className="text-gray-50 text-center mt-2"
						>
							{room.name}
						</ThemedText>
					</View>
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
					<View className="absolute inset-0 bg-black/30" />
					{/* Count text overlay at bottom center */}
					<View className="absolute bottom-0 left-0 right-0 items-center pb-3">
						<View className="bg-white/90 backdrop-blur-sm px-4 py-1 rounded-full">
							<ThemedText variant="title-md" extraBold className="text-gray-900">
								+{houseType.count}
							</ThemedText>
						</View>
						<ThemedText
							variant="title-md"
							bold
							className="text-gray-50 text-center mt-2"
						>
							{houseType.name}
						</ThemedText>
					</View>
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

export default function ExplorePage() {
	const insets = useSafeAreaInsets();

	// First level modals
	const [interiorModalVisible, setInteriorModalVisible] = useState(false);
	const [exteriorModalVisible, setExteriorModalVisible] = useState(false);
	const [gardenModalVisible, setGardenModalVisible] = useState(false);

	const handleViewAllRooms = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setInteriorModalVisible(true);
	};

	const handleViewAllHouseTypes = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setExteriorModalVisible(true);
	};

	const handleViewAllImages = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setGardenModalVisible(true);
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
				<TouchableOpacity onPress={handleViewAllRooms} className="px-3 py-2">
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
				<TouchableOpacity onPress={handleViewAllHouseTypes} className="px-3 py-2">
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
				<TouchableOpacity onPress={handleViewAllImages} className="px-3 py-2">
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

			{/* Modals */}
			<ViewAllInteriorModal
				visible={interiorModalVisible}
				onClose={() => setInteriorModalVisible(false)}
			/>
			<ViewAllExteriorModal
				visible={exteriorModalVisible}
				onClose={() => setExteriorModalVisible(false)}
			/>
			<ViewAllGardenModal
				visible={gardenModalVisible}
				onClose={() => setGardenModalVisible(false)}
				images={gardenImages}
			/>
		</>
	);
}
