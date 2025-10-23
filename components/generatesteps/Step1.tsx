import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Octicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { StepConfig } from '../../config/stepConfig';
import { CustomButton } from '../CustomButton';
import { PhotoTipsModal } from './PhotoTipsModal';

interface Step1Props {
	onImageSelect?: () => void;
	config: StepConfig;
}

export function Step1({ onImageSelect, config }: Step1Props) {
	const [showTipsModal, setShowTipsModal] = useState(false);

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
						className="bg-gray-100 aspect-square  w-full flex justify-center border-dashed border-gray-300 rounded-3xl p-12 items-center mb-6"
						onPress={onImageSelect}
					>
						<Octicons name="image" size={60} color="#D1D5DB" className="mb-4" />

						<CustomButton
							title="Upload photo"
							onPress={onImageSelect || (() => {})}
							icon="plus"
							iconPosition="left"
							className="!w-fit"
							variant="primary"
							size="sm"
						/>
					</TouchableOpacity>
				</View>
			</View>

			{/* Photo Tips Modal */}
			<PhotoTipsModal visible={showTipsModal} onClose={() => setShowTipsModal(false)} />
		</View>
	);
}
