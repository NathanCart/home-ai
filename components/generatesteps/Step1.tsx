import React, { useState } from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { Octicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { StepConfig } from '../../config/stepConfig';
import { CustomButton } from '../CustomButton';
import { PhotoTipsModal } from './PhotoTipsModal';
import { MediaSourceModal } from './MediaSourceModal';

interface Step1Props {
	onImageSelect?: (imageUri?: string) => void;
	config: StepConfig;
	selectedImageUri?: string | null;
}

export function Step1({ onImageSelect, config, selectedImageUri }: Step1Props) {
	const [showTipsModal, setShowTipsModal] = useState(false);
	const [showMediaSourceModal, setShowMediaSourceModal] = useState(false);

	const handleImageSelected = (imageUri: string) => {
		onImageSelect?.(imageUri);
	};

	const handleCardPress = () => {
		setShowMediaSourceModal(true);
	};

	return (
		<View className="flex-1 px-6">
			<View className="items-start mb-4">
				<ThemedText variant="title-md" className="text-gray-900 mb-2 text-center" extraBold>
					{config.title}
				</ThemedText>

				<ThemedText variant="body" className="text-gray-600 leading-6">
					{config.subtitle}
				</ThemedText>
			</View>

			<View className="flex-1 justify-start  items-center w-full pt-4">
				<View className="relative w-full">
					{/* Photo Tips Badge */}
					<TouchableOpacity
						onPress={() => setShowTipsModal(true)}
						className="absolute top-4 right-4 z-10 flex-row items-center bg-gray-50 border border-gray-200 rounded-full px-3 py-2"
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
