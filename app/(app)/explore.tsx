import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import {
	View,
	FlatList,
	ScrollView,
	TouchableOpacity,
	Image,
	Dimensions,
	Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from 'components/ThemedText';
import { Octicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { TryThisStyleModal } from 'components/TryThisStyleModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GAP = 12; // Gap between columns and rows (must match MARGIN_BOTTOM)
const COLUMN_WIDTH = (SCREEN_WIDTH - 32 - GAP) / 2; // 2 columns: 16px padding each side + gap between columns

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
		images: deterministicShuffle(
			Array.from(
				{ length: 36 },
				(_, i) =>
					`https://pingu-app.s3.eu-west-2.amazonaws.com/bedroom${i === 0 ? '1' : i + 1}.jpg`
			),
			'bedroom'
		),
		count: 18,
	},
	{
		id: 'kitchen',
		name: 'Kitchen',
		icon: 'kitchen',
		iconType: 'material',
		description: 'Cooking and dining area',
		images: deterministicShuffle(
			Array.from(
				{ length: 36 },
				(_, i) =>
					`https://pingu-app.s3.eu-west-2.amazonaws.com/kitchen${i === 0 ? '1' : i + 1}.jpg`
			),
			'kitchen'
		),
		count: 22,
	},
	{
		id: 'bathroom',
		name: 'Bathroom',
		icon: 'shower',
		iconType: 'material-community',
		description: 'Personal hygiene and grooming space',
		images: deterministicShuffle(
			Array.from(
				{ length: 36 },
				(_, i) =>
					`https://pingu-app.s3.eu-west-2.amazonaws.com/bathroom${i === 0 ? '1' : i + 1}.jpg`
			),
			'bathroom'
		),
		count: 15,
	},
	{
		id: 'dining-room',
		name: 'Dining Room',
		icon: 'table',
		description: 'Formal dining and meal space',
		images: deterministicShuffle(
			Array.from(
				{ length: 36 },
				(_, i) =>
					`https://pingu-app.s3.eu-west-2.amazonaws.com/diningroom${i === 0 ? '1' : i + 1}.jpg`
			),
			'dining-room'
		),
		count: 12,
	},
	{
		id: 'office',
		name: 'Home Office',
		icon: 'briefcase',
		description: 'Work and productivity space',
		images: deterministicShuffle(
			Array.from(
				{ length: 36 },
				(_, i) =>
					`https://pingu-app.s3.eu-west-2.amazonaws.com/homeoffice${i === 0 ? '1' : i + 1}.jpg`
			),
			'office'
		),
		count: 16,
	},
	{
		id: 'nursery',
		name: 'Nursery',
		icon: 'heart',
		description: 'Baby and child room',
		images: deterministicShuffle(
			Array.from(
				{ length: 36 },
				(_, i) =>
					`https://pingu-app.s3.eu-west-2.amazonaws.com/nursery${i === 0 ? '1' : i + 1}.jpg`
			),
			'nursery'
		),
		count: 10,
	},

	{
		id: 'garage',
		name: 'Garage',
		icon: 'car-outline',
		iconType: 'ionicons',
		description: 'Vehicle storage and workshop space',
		images: deterministicShuffle(
			Array.from(
				{ length: 36 },
				(_, i) =>
					`https://pingu-app.s3.eu-west-2.amazonaws.com/garage${i === 0 ? '1' : i + 1}.jpg`
			),
			'garage'
		),
		count: 9,
	},
];

// House types
const houseTypes: HouseType[] = [
	{
		id: 'house',
		name: 'House',
		description: 'Single-family home exterior',
		images: deterministicShuffle(
			Array.from(
				{ length: 18 },
				(_, i) =>
					`https://pingu-app.s3.eu-west-2.amazonaws.com/house${i === 0 ? '1' : i + 1}.jpg`
			),
			'house'
		),
		count: 32,
	},
	{
		id: 'apartment',
		name: 'Apartment',
		description: 'Multi-unit residential building',
		images: deterministicShuffle(
			Array.from(
				{ length: 18 },
				(_, i) =>
					`https://pingu-app.s3.eu-west-2.amazonaws.com/apartment${i === 0 ? '1' : i + 1}.jpg`
			),
			'apartment'
		),
		count: 28,
	},
	{
		id: 'villa',
		name: 'Villa',
		description: 'Large luxury detached home',
		images: deterministicShuffle(
			Array.from(
				{ length: 18 },
				(_, i) =>
					`https://pingu-app.s3.eu-west-2.amazonaws.com/villa${i === 0 ? '1' : i + 1}.jpg`
			),
			'villa'
		),
		count: 19,
	},
	{
		id: 'townhouse',
		name: 'Townhouse',
		description: 'Multi-story attached home',
		images: deterministicShuffle(
			Array.from(
				{ length: 18 },
				(_, i) =>
					`https://pingu-app.s3.eu-west-2.amazonaws.com/townhouse${i === 0 ? '1' : i + 1}.jpg`
			),
			'townhouse'
		),
		count: 15,
	},
	{
		id: 'cottage',
		name: 'Cottage',
		description: 'Small charming rural home',
		images: deterministicShuffle(
			Array.from(
				{ length: 18 },
				(_, i) =>
					`https://pingu-app.s3.eu-west-2.amazonaws.com/cottage${i === 0 ? '1' : i + 1}.jpg`
			),
			'cottage'
		),
		count: 14,
	},
	{
		id: 'mansion',
		name: 'Mansion',
		description: 'Large prestigious estate home',
		images: deterministicShuffle(
			Array.from(
				{ length: 18 },
				(_, i) =>
					`https://pingu-app.s3.eu-west-2.amazonaws.com/mansion${i === 0 ? '1' : i + 1}.jpg`
			),
			'mansion'
		),
		count: 12,
	},
	{
		id: 'office-building',
		name: 'Office Building',
		description: 'Commercial office building',
		images: deterministicShuffle(
			Array.from(
				{ length: 18 },
				(_, i) =>
					`https://pingu-app.s3.eu-west-2.amazonaws.com/officebuilding${i === 0 ? '1' : i + 1}.jpg`
			),
			'office'
		),
		count: 21,
	},
	{
		id: 'retail-building',
		name: 'Retail Building',
		description: 'Commercial retail or shop building',
		images: deterministicShuffle(
			Array.from(
				{ length: 18 },
				(_, i) =>
					`https://pingu-app.s3.eu-west-2.amazonaws.com/retail${i === 0 ? '1' : i + 1}.jpg`
			),
			'retail'
		),
		count: 17,
	},
];

// Garden images
const gardenImages = deterministicShuffle(
	Array.from(
		{ length: 36 },
		(_, i) => `https://pingu-app.s3.eu-west-2.amazonaws.com/garden${i === 0 ? '1' : i + 1}.jpg`
	),
	'garden'
);

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

// Distribute images into two columns for masonry layout
interface ColumnItem {
	imageUrl: string;
	index: number;
	height: number;
}

interface ColumnItemWithPosition extends ColumnItem {
	top: number;
	bottom: number;
}

interface MasonryRow {
	id: string;
	left?: ColumnItem & { relativeTop: number };
	right?: ColumnItem & { relativeTop: number };
	rowHeight: number;
}

const distributeImagesIntoRows = (images: string[]): MasonryRow[] => {
	const leftColumn: ColumnItemWithPosition[] = [];
	const rightColumn: ColumnItemWithPosition[] = [];
	let leftTop = 0;
	let rightTop = 0;
	const MARGIN_BOTTOM = GAP; // Match horizontal gap

	// Distribute images into columns based on which column is shorter
	images.forEach((imageUrl, index) => {
		const height = getImageHeight(index);
		if (leftTop <= rightTop) {
			leftColumn.push({
				imageUrl,
				index,
				height,
				top: leftTop,
				bottom: leftTop + height,
			});
			leftTop += height + MARGIN_BOTTOM;
		} else {
			rightColumn.push({
				imageUrl,
				index,
				height,
				top: rightTop,
				bottom: rightTop + height,
			});
			rightTop += height + MARGIN_BOTTOM;
		}
	});

	// Collect all vertical breakpoints (where items start or end)
	const breakpoints = new Set<number>();
	leftColumn.forEach((item) => {
		breakpoints.add(item.top);
		breakpoints.add(item.bottom);
	});
	rightColumn.forEach((item) => {
		breakpoints.add(item.top);
		breakpoints.add(item.bottom);
	});

	const sortedBreakpoints = Array.from(breakpoints).sort((a, b) => a - b);

	// Create rows for each vertical slice
	const rows: MasonryRow[] = [];
	for (let i = 0; i < sortedBreakpoints.length - 1; i++) {
		const rowTop = sortedBreakpoints[i];
		const rowBottom = sortedBreakpoints[i + 1];
		const rowHeight = rowBottom - rowTop;

		// Find items that are active in this vertical range
		const leftItem = leftColumn.find((item) => item.top < rowBottom && item.bottom > rowTop);
		const rightItem = rightColumn.find((item) => item.top < rowBottom && item.bottom > rowTop);

		// Only create row if there's at least one item
		if (leftItem || rightItem) {
			rows.push({
				id: `row-${i}`,
				left: leftItem
					? {
							imageUrl: leftItem.imageUrl,
							index: leftItem.index,
							height: leftItem.height,
							relativeTop: leftItem.top - rowTop,
						}
					: undefined,
				right: rightItem
					? {
							imageUrl: rightItem.imageUrl,
							index: rightItem.index,
							height: rightItem.height,
							relativeTop: rightItem.top - rowTop,
						}
					: undefined,
				rowHeight: rowHeight + (i === sortedBreakpoints.length - 2 ? MARGIN_BOTTOM : 0),
			});
		}
	}

	return rows;
};

// Skeleton component for loading state
const ImageSkeleton = ({ height }: { height: number }) => (
	<View
		className="rounded-3xl"
		style={{
			width: '100%',
			height: height,
			backgroundColor: '#E5E7EB',
		}}
	/>
);

// Memoized image item component to prevent unnecessary re-renders
const ImageItem = React.memo(
	({
		imageUrl,
		height,
		onPress,
	}: {
		imageUrl: string;
		height: number;
		onPress: (imageUrl: string) => void;
	}) => {
		const [isLoading, setIsLoading] = useState(true);
		const timeoutRef = useRef<number | null>(null);
		const scaleAnim = useRef(new Animated.Value(1)).current;

		// Handlers for image load events
		const handleLoad = useCallback(() => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
			setIsLoading(false);
		}, []);

		const handleError = useCallback(() => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
			setIsLoading(false);
		}, []);

		// Set up loading state and timeout when component mounts or imageUrl changes
		useEffect(() => {
			// Always show skeleton initially
			setIsLoading(true);

			// Clear any existing timeout
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}

			// Set a timeout to hide skeleton after 200ms (fallback)
			timeoutRef.current = setTimeout(() => {
				setIsLoading(false);
				timeoutRef.current = null;
			}, 3000);

			return () => {
				if (timeoutRef.current) {
					clearTimeout(timeoutRef.current);
					timeoutRef.current = null;
				}
			};
		}, [imageUrl]);

		const handlePressIn = useCallback(() => {
			Animated.spring(scaleAnim, {
				toValue: 0.95,
				useNativeDriver: true,
				tension: 300,
				friction: 10,
			}).start();
		}, [scaleAnim]);

		const handlePressOut = useCallback(() => {
			Animated.spring(scaleAnim, {
				toValue: 1,
				useNativeDriver: true,
				tension: 300,
				friction: 10,
			}).start();
		}, [scaleAnim]);

		const handlePress = useCallback(() => {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
			onPress(imageUrl);
		}, [imageUrl, onPress]);

		return (
			<TouchableOpacity
				onPress={handlePress}
				onPressIn={handlePressIn}
				onPressOut={handlePressOut}
				activeOpacity={1}
				className="rounded-3xl overflow-hidden"
				style={{
					width: '100%',
					height: height,
					position: 'relative',
				}}
			>
				<Animated.View
					style={{
						width: '100%',
						height: '100%',
						transform: [{ scale: scaleAnim }],
					}}
				>
					{/* Image always renders so it can load */}
					<Image
						key={imageUrl}
						source={{ uri: imageUrl }}
						style={{
							width: '100%',
							height: '100%',
						}}
						resizeMode="cover"
						onLoad={handleLoad}
						onError={handleError}
					/>
					{/* Skeleton overlay */}
					{isLoading && (
						<View
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								right: 0,
								bottom: 0,
								zIndex: 1,
							}}
							pointerEvents="none"
						>
							<ImageSkeleton height={height} />
						</View>
					)}
				</Animated.View>
			</TouchableOpacity>
		);
	},
	(prevProps, nextProps) => {
		// Always re-render if imageUrl changes
		return prevProps.imageUrl === nextProps.imageUrl && prevProps.height === nextProps.height;
	}
);

ImageItem.displayName = 'ImageItem';

// Memoized row component for masonry layout - columns are independent
const MasonryRow = React.memo(
	({ row, onImagePress }: { row: MasonryRow; onImagePress: (imageUrl: string) => void }) => (
		<View
			style={{
				height: row.rowHeight,
				position: 'relative',
			}}
		>
			{/* Left Column */}
			{row.left && (
				<View
					style={{
						position: 'absolute',
						left: 0,
						top: row.left.relativeTop,
						width: COLUMN_WIDTH,
					}}
				>
					<ImageItem
						key={row.left.imageUrl}
						imageUrl={row.left.imageUrl}
						height={row.left.height}
						onPress={onImagePress}
					/>
				</View>
			)}

			{/* Right Column */}
			{row.right && (
				<View
					style={{
						position: 'absolute',
						left: COLUMN_WIDTH + GAP, // Position with gap from left column
						top: row.right.relativeTop,
						width: COLUMN_WIDTH,
					}}
				>
					<ImageItem
						key={row.right.imageUrl}
						imageUrl={row.right.imageUrl}
						height={row.right.height}
						onPress={onImagePress}
					/>
				</View>
			)}
		</View>
	)
);

MasonryRow.displayName = 'MasonryRow';

type TabType = 'interior' | 'exterior' | 'garden';

export default function ExplorePage() {
	const insets = useSafeAreaInsets();
	const [activeTab, setActiveTab] = useState<TabType>('interior');
	const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
	const [selectedHouseTypeId, setSelectedHouseTypeId] = useState<string | null>(null);
	const [showTryStyleModal, setShowTryStyleModal] = useState(false);
	const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

	const flatListRef = useRef<FlatList>(null);

	const handleTabChange = (tab: TabType) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setActiveTab(tab);
		setSelectedRoomId(null);
		setSelectedHouseTypeId(null);
		// Scroll to top
		flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
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

	const handleImagePress = (imageUrl: string) => {
		// Haptic feedback is handled in ImageItem component
		setSelectedImageUrl(imageUrl);
		setShowTryStyleModal(true);
	};

	const handleTryStyle = () => {
		if (!selectedImageUrl) return;

		// Navigate to style transfer modal with the selected image as the style reference
		router.push({
			pathname: '/styletransfermodal',
			params: {
				initialStyleImageUri: selectedImageUrl,
			},
		});
	};

	// Memoize expensive computations
	const images = useMemo(
		() => getCurrentImages(),
		[activeTab, selectedRoomId, selectedHouseTypeId]
	);
	const masonryRows = useMemo(() => distributeImagesIntoRows(images), [images]);

	// Scroll to top when filter changes
	useEffect(() => {
		flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
	}, [selectedRoomId, selectedHouseTypeId]);

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

			{/* Masonry Grid - Single Virtualized FlatList */}
			<FlatList
				ref={flatListRef}
				key={`${activeTab}-${selectedRoomId}-${selectedHouseTypeId}`}
				data={masonryRows}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => <MasonryRow row={item} onImagePress={handleImagePress} />}
				showsVerticalScrollIndicator={false}
				removeClippedSubviews={true}
				initialNumToRender={10}
				maxToRenderPerBatch={10}
				windowSize={10}
				updateCellsBatchingPeriod={50}
				getItemLayout={(data, index) => {
					if (!data || index >= data.length) {
						return { length: 0, offset: 0, index };
					}
					let offset = 16; // padding top
					for (let i = 0; i < index; i++) {
						offset += data[i]?.rowHeight || 0;
					}
					return {
						length: data[index].rowHeight,
						offset,
						index,
					};
				}}
				contentContainerStyle={{
					padding: 16,
					paddingBottom: 32,
					paddingTop: activeTab === 'garden' ? 16 : 0,
				}}
				style={{ flex: 1 }}
			/>

			{/* Try This Style Modal */}
			<TryThisStyleModal
				visible={showTryStyleModal}
				onClose={() => {
					setShowTryStyleModal(false);
					setSelectedImageUrl(null);
				}}
				onTryStyle={handleTryStyle}
				imageUrl={selectedImageUrl || ''}
			/>
		</View>
	);
}
