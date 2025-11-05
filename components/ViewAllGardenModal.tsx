import React from 'react';
import { View, TouchableOpacity, Modal, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from 'components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'react-native';
import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MODAL_CARD_WIDTH = (SCREEN_WIDTH - 60) / 2;

export interface InspirationImage {
	id: string;
	imageUrl: string;
	title: string;
	style?: string;
}

interface InspirationCardProps {
	item: InspirationImage;
	width: number;
	isModal?: boolean;
}

const InspirationCard = ({ item, width, isModal = false }: InspirationCardProps) => {
	return (
		<View
			style={{
				width: width,
				marginRight: isModal ? 0 : 12,
			}}
		>
			<View className="bg-white rounded-2xl overflow-hidden border-2 border-gray-200">
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
			</View>
		</View>
	);
};

interface ViewAllGardenModalProps {
	visible: boolean;
	onClose: () => void;
	images: InspirationImage[];
}

export function ViewAllGardenModal({ visible, onClose, images }: ViewAllGardenModalProps) {
	const insets = useSafeAreaInsets();

	return (
		<Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
			<View className="flex-1 bg-gray-50">
				<View
					className="flex-row items-center justify-between pb-4 px-6 bg-white border-b border-gray-200"
					style={{ paddingTop: insets.top + 16 }}
				>
					<ThemedText extraBold className="text-gray-900" variant="title-lg">
						Garden Designs
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
}

