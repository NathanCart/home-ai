import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView, ImageBackground } from 'react-native';
import { ThemedText } from '../ThemedText';
import { StepConfig } from '../../config/stepConfig';

interface HouseType {
	id: string;
	name: string;
	imageUrl: string;
	description: string;
}

interface HouseTypeStepProps {
	onHouseTypeSelect?: (houseType: HouseType | null) => void;
	config: StepConfig;
	selectedHouseType?: HouseType | null;
	compact?: boolean;
}

const houseTypes: HouseType[] = [
	{
		id: 'house',
		name: 'House',
		description: 'Single-family residential home',
		imageUrl: 'https://leafly-app.s3.eu-west-2.amazonaws.com/house.png',
	},
	{
		id: 'apartment',
		name: 'Apartment',
		description: 'Multi-unit residential building',
		imageUrl: 'https://leafly-app.s3.eu-west-2.amazonaws.com/apartment.png',
	},
	{
		id: 'villa',
		name: 'Villa',
		description: 'Large luxury detached home',
		imageUrl: 'https://leafly-app.s3.eu-west-2.amazonaws.com/villa.png',
	},
	{
		id: 'townhouse',
		name: 'Townhouse',
		description: 'Multi-story attached home',
		imageUrl: 'https://leafly-app.s3.eu-west-2.amazonaws.com/townhouse.png',
	},
	{
		id: 'cottage',
		name: 'Cottage',
		description: 'Small charming rural home',
		imageUrl: 'https://leafly-app.s3.eu-west-2.amazonaws.com/cottage.png',
	},
	{
		id: 'mansion',
		name: 'Mansion',
		description: 'Large prestigious estate home',
		imageUrl: 'https://leafly-app.s3.eu-west-2.amazonaws.com/mansion.png',
	},
	{
		id: 'office-building',
		name: 'Office Building',
		description: 'Commercial office building',
		imageUrl: 'https://leafly-app.s3.eu-west-2.amazonaws.com/office.png',
	},
	{
		id: 'retail-building',
		name: 'Retail Building',
		description: 'Commercial retail or shop building',
		imageUrl: 'https://leafly-app.s3.eu-west-2.amazonaws.com/retail.png',
	},
];

export function HouseTypeStep({
	onHouseTypeSelect,
	config,
	selectedHouseType,
	compact = false,
}: HouseTypeStepProps) {
	const [selectedHouseTypeId, setSelectedHouseTypeId] = useState<string | null>(
		selectedHouseType?.id || null
	);

	const handleHouseTypeSelect = (houseType: HouseType) => {
		setSelectedHouseTypeId(houseType.id);
		onHouseTypeSelect?.(houseType);
	};

	// Compact horizontal layout
	if (compact) {
		return (
			<View className="flex-1 items-center justify-center">
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
				>
					{houseTypes.map((houseType) => {
						const isSelected = selectedHouseTypeId === houseType.id;

						return (
							<TouchableOpacity
								key={houseType.id}
								onPress={() => handleHouseTypeSelect(houseType)}
								className={`w-40 h-40 rounded-2xl overflow-hidden border-2 ${
									isSelected ? 'border-blue-500' : 'border-gray-200'
								}`}
								activeOpacity={0.8}
							>
								<ImageBackground
									source={{ uri: houseType.imageUrl }}
									className="flex-1"
									resizeMode="cover"
								>
									<View className="flex-1 bg-black/30 justify-end p-2">
										<ThemedText
											variant="body"
											className="text-white font-bold text-xs"
											extraBold
										>
											{houseType.name}
										</ThemedText>
									</View>
								</ImageBackground>
							</TouchableOpacity>
						);
					})}
				</ScrollView>
			</View>
		);
	}

	// Default grid layout
	return (
		<View className="flex-1 px-6">
			<View className="items-start mb-6">
				<ThemedText variant="title-md" className="text-gray-900 mb-2 text-center" extraBold>
					{config.title}
				</ThemedText>

				<ThemedText variant="body" className="text-gray-600 leading-6">
					{config.subtitle}
				</ThemedText>
			</View>

			<ScrollView
				className="flex-1"
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: 100 }}
			>
				<View className="flex-row flex-wrap justify-between gap-3">
					{houseTypes.map((houseType) => {
						const isSelected = selectedHouseTypeId === houseType.id;

						return (
							<TouchableOpacity
								key={houseType.id}
								onPress={() => handleHouseTypeSelect(houseType)}
								className={`w-[48%] aspect-square rounded-2xl overflow-hidden border-2 border-gray-200 ${
									isSelected ? '!border-blue-500' : ''
								}`}
								activeOpacity={0.8}
							>
								<ImageBackground
									source={{ uri: houseType.imageUrl }}
									className="flex-1"
									resizeMode="cover"
								>
									<View className="flex-1 bg-black/30 justify-end p-3">
										<ThemedText
											variant="body"
											className="text-white font-bold"
											extraBold
										>
											{houseType.name}
										</ThemedText>
									</View>
								</ImageBackground>
							</TouchableOpacity>
						);
					})}
				</View>
			</ScrollView>
		</View>
	);
}
