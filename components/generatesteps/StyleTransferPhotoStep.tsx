import React, { useState, useMemo } from 'react';
import { View, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Octicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { StepConfig } from '../../config/stepConfig';
import { CustomButton } from '../CustomButton';
import { PhotoTipsModal } from './PhotoTipsModal';
import { MediaSourceModal } from './MediaSourceModal';

// Get all images from explore page
const getAllExploreImages = (): string[] => {
	// Interior images - all rooms combined
	const interiorImages: string[] = [];
	const roomTypes = [
		{ id: 'living-room', images: Array.from({ length: 18 }, (_, i) => `https://pingu-app.s3.eu-west-2.amazonaws.com/livingroom${i === 0 ? '1' : i + 1}.jpg`) },
		{ id: 'bedroom', images: Array.from({ length: 18 }, (_, i) => `https://pingu-app.s3.eu-west-2.amazonaws.com/bedroom${i === 0 ? '1' : i + 1}.jpg`) },
		{ id: 'kitchen', images: Array.from({ length: 18 }, (_, i) => `https://pingu-app.s3.eu-west-2.amazonaws.com/kitchen${i === 0 ? '1' : i + 1}.jpg`) },
		{ id: 'bathroom', images: Array.from({ length: 18 }, (_, i) => `https://pingu-app.s3.eu-west-2.amazonaws.com/bathroom${i === 0 ? '1' : i + 1}.jpg`) },
		{ id: 'dining-room', images: Array.from({ length: 18 }, (_, i) => `https://pingu-app.s3.eu-west-2.amazonaws.com/diningroom${i === 0 ? '1' : i + 1}.jpg`) },
		{ id: 'office', images: Array.from({ length: 18 }, (_, i) => `https://pingu-app.s3.eu-west-2.amazonaws.com/office${i === 0 ? '1' : i + 1}.jpg`) },
		{ id: 'garage', images: Array.from({ length: 9 }, (_, i) => `https://pingu-app.s3.eu-west-2.amazonaws.com/garage${i === 0 ? '1' : i + 1}.jpg`) },
	];
	roomTypes.forEach((room) => {
		interiorImages.push(...room.images);
	});

	// Exterior images - all house types combined
	const exteriorImages: string[] = [];
	const houseTypes = [
		{ id: 'house', images: Array.from({ length: 18 }, (_, i) => `https://pingu-app.s3.eu-west-2.amazonaws.com/house${i === 0 ? '1' : i + 1}.jpg`) },
		{ id: 'apartment', images: Array.from({ length: 18 }, (_, i) => `https://pingu-app.s3.eu-west-2.amazonaws.com/apartment${i === 0 ? '1' : i + 1}.jpg`) },
		{ id: 'villa', images: Array.from({ length: 18 }, (_, i) => `https://pingu-app.s3.eu-west-2.amazonaws.com/villa${i === 0 ? '1' : i + 1}.jpg`) },
		{ id: 'townhouse', images: Array.from({ length: 18 }, (_, i) => `https://pingu-app.s3.eu-west-2.amazonaws.com/townhouse${i === 0 ? '1' : i + 1}.jpg`) },
		{ id: 'cottage', images: Array.from({ length: 18 }, (_, i) => `https://pingu-app.s3.eu-west-2.amazonaws.com/cottage${i === 0 ? '1' : i + 1}.jpg`) },
		{ id: 'mansion', images: Array.from({ length: 18 }, (_, i) => `https://pingu-app.s3.eu-west-2.amazonaws.com/mansion${i === 0 ? '1' : i + 1}.jpg`) },
		{ id: 'office-building', images: Array.from({ length: 18 }, (_, i) => `https://pingu-app.s3.eu-west-2.amazonaws.com/officebuilding${i === 0 ? '1' : i + 1}.jpg`) },
		{ id: 'retail-building', images: Array.from({ length: 18 }, (_, i) => `https://pingu-app.s3.eu-west-2.amazonaws.com/retail${i === 0 ? '1' : i + 1}.jpg`) },
	];
	houseTypes.forEach((houseType) => {
		exteriorImages.push(...houseType.images);
	});

	// Garden images
	const gardenImages = Array.from({ length: 36 }, (_, i) => `https://pingu-app.s3.eu-west-2.amazonaws.com/garden${i === 0 ? '1' : i + 1}.jpg`);

	// Combine all images
	return [...interiorImages, ...exteriorImages, ...gardenImages];
};

interface StyleTransferPhotoStepProps {
	onImageSelect?: (imageUri?: string) => void;
	config: StepConfig;
	selectedImageUri?: string | null;
	compact?: boolean;
	customExampleImages?: { id: string; source: { uri: string }; name: string }[];
	hideExamples?: boolean;
}

export function StyleTransferPhotoStep({
	onImageSelect,
	config,
	selectedImageUri,
	compact = false,
	customExampleImages = [],
	hideExamples = false,
}: StyleTransferPhotoStepProps) {
	const [showTipsModal, setShowTipsModal] = useState(false);
	const [showMediaSourceModal, setShowMediaSourceModal] = useState(false);

	const handleImageSelected = (imageUri: string) => {
		onImageSelect?.(imageUri);
	};

	const handleCardPress = () => {
		setShowMediaSourceModal(true);
	};

	const handleExampleImageSelect = (imageUri: string) => {
		onImageSelect?.(imageUri);
	};

	// Get all explore images
	const exploreImages = useMemo(() => getAllExploreImages(), []);

	// Compact layout
	if (compact) {
		return (
			<View className="px-6">
				<TouchableOpacity
					className="bg-gray-100 min-h-[135px] max-h-[135px] w-full flex justify-center border-2 border-dashed border-gray-300 rounded-2xl p-8 items-center overflow-hidden"
					onPress={handleCardPress}
				>
					{selectedImageUri ? (
						<View className="absolute inset-0">
							<Image
								source={{ uri: selectedImageUri }}
								className="w-full h-full"
								resizeMode="cover"
							/>
							<View className="absolute inset-0 bg-black/20 items-center justify-center">
								<View className="bg-white/90 rounded-full p-2">
									<Octicons name="pencil" size={20} color="#111827" />
								</View>
							</View>
						</View>
					) : (
						<View className="items-center">
							<Octicons name="image" size={48} color="#D1D5DB" className="mb-2" />
							<ThemedText variant="body" className="text-gray-600 text-sm mt-2">
								Tap to upload photo
							</ThemedText>
						</View>
					)}
				</TouchableOpacity>

				<MediaSourceModal
					visible={showMediaSourceModal}
					onClose={() => setShowMediaSourceModal(false)}
					onImageSelected={handleImageSelected}
				/>
			</View>
		);
	}

	// Default full layout
	return (
		<View className="flex-1 -20">
			<View className="items-start mb-4 px-6">
				<ThemedText variant="title-md" className="text-gray-900 mb-2 text-center" extraBold>
					{config.title}
				</ThemedText>

				<ThemedText variant="body" className="text-gray-600 leading-6">
					{config.subtitle}
				</ThemedText>
			</View>

			<View className="flex-1 justify-start  items-center w-full pt-4">
				<View className="relative w-full px-6">
					{/* Photo Tips Badge */}
					<TouchableOpacity
						onPress={() => setShowTipsModal(true)}
						className="absolute top-4 right-10 z-10 flex-row items-center bg-gray-50 border border-gray-200 rounded-full px-3 py-2"
					>
						<Octicons name="light-bulb" size={16} color="#111827" />
						<ThemedText
							variant="body"
							className="text-gray-900 font-medium text-sm ml-2"
						>
							Photo Tips
						</ThemedText>
					</TouchableOpacity>

					<TouchableOpacity
						className="bg-gray-100 aspect-square w-full flex justify-center border-dashed border-gray-300 rounded-3xl p-12 items-center mb-6 overflow-hidden"
						onPress={handleCardPress}
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
								<Octicons name="image" size={60} color="#D1D5DB" className="mb-4" />

								<CustomButton
									title="Upload photo"
									onPress={handleCardPress}
									icon="plus"
									iconPosition="left"
									className="!w-fit"
									variant="primary"
									size="sm"
								/>
							</View>
						)}
					</TouchableOpacity>
				</View>

				{/* Example Images Horizontal Scroll */}
				{!hideExamples && (
					<View className="">
						<ThemedText variant="body" className="text-gray-600 mb-2 px-6 leading-6">
							Or choose from examples
						</ThemedText>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={{ paddingHorizontal: 18 }}
							className="flex-row"
						>
							{exploreImages.map((imageUri, index) => {
								const isSelected = selectedImageUri === imageUri;
								return (
									<TouchableOpacity
										key={`explore-image-${index}`}
										onPress={() => handleExampleImageSelect(imageUri)}
										className="mr-3 items-center"
										activeOpacity={0.7}
									>
										<View
											className={`w-32 h-32 rounded-3xl overflow-hidden border-2 ${isSelected ? 'border-blue-500' : 'border-gray-200'}`}
										>
											<Image
												source={{ uri: imageUri }}
												className="w-full h-full"
												resizeMode="cover"
											/>
										</View>
									</TouchableOpacity>
								);
							})}
						</ScrollView>
					</View>
				)}
			</View>

			{/* Photo Tips Modal */}
			<PhotoTipsModal visible={showTipsModal} onClose={() => setShowTipsModal(false)} />

			{/* Media Source Modal */}
			<MediaSourceModal
				visible={showMediaSourceModal}
				onClose={() => setShowMediaSourceModal(false)}
				onImageSelected={handleImageSelected}
			/>
		</View>
	);
}

