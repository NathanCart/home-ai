import React, { useState } from 'react';
import { View, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Octicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { StepConfig } from '../../config/stepConfig';
import { CustomButton } from '../CustomButton';
import { PhotoTipsModal } from './PhotoTipsModal';
import { MediaSourceModal } from './MediaSourceModal';

interface PhotoStepProps {
	onImageSelect?: (imageUri?: string) => void;
	config: StepConfig;
	selectedImageUri?: string | null;
}

const exampleImages = [
	{
		id: 'living-room-1',
		source: {
			uri: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop&crop=center',
		},
		name: 'Modern Living',
	},
	{
		id: 'bathroom-1',
		source: {
			uri: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=400&fit=crop&crop=center',
		},
		name: 'Luxury Bathroom',
	},
	{
		id: 'dining-room-1',
		source: {
			uri: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=400&fit=crop&crop=center',
		},
		name: 'Elegant Dining',
	},
	{
		id: 'office-1',
		source: {
			uri: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=400&fit=crop&crop=center',
		},
		name: 'Home Office',
	},
	{
		id: 'living-room-2',
		source: {
			uri: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&h=400&fit=crop&crop=center',
		},
		name: 'Scandinavian',
	},
	{
		id: 'bedroom-2',
		source: {
			uri: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=400&fit=crop&crop=center',
		},
		name: 'Minimalist',
	},
];

export function PhotoStep({ onImageSelect, config, selectedImageUri }: PhotoStepProps) {
	const [showTipsModal, setShowTipsModal] = useState(false);
	const [showMediaSourceModal, setShowMediaSourceModal] = useState(false);

	const handleImageSelected = (imageUri: string) => {
		onImageSelect?.(imageUri);
	};

	const handleCardPress = () => {
		setShowMediaSourceModal(true);
	};

	const handleExampleImageSelect = (imageSource: { uri: string }) => {
		onImageSelect?.(imageSource.uri);
	};

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
						{exampleImages.map((example) => (
							<TouchableOpacity
								key={example.id}
								onPress={() => handleExampleImageSelect(example.source)}
								className="mr-3 items-center"
								activeOpacity={0.7}
							>
								<View
									className={`w-32 h-32 rounded-3xl overflow-hidden border-2 border-gray-200  ${selectedImageUri === example.source.uri ? '!border-blue-500' : ''}`}
								>
									<Image
										source={example.source}
										className="w-full h-full"
										resizeMode="cover"
									/>
									{/* Highlight overlay */}
									<View className="absolute inset-0 bg-gray-900/10 opacity-0 hover:opacity-100 transition-opacity duration-200" />
								</View>
							</TouchableOpacity>
						))}
					</ScrollView>
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
