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
	compact?: boolean;
}

const exampleImages = [
	{
		id: 'living-room-1',
		source: {
			uri: 'https://media.houseandgarden.co.uk/photos/67dc464c0f2847aedf2da20b/master/w_1600%2Cc_limit/Shot05117_RT-production_digital.jpg',
		},
		name: 'Modern Living',
	},
	{
		id: 'bathroom-1',
		source: {
			uri: 'https://www.jasmine-roth.com/cdn/shop/files/5-Different-Living-Room-Styles-and-How-to-Achieve-Each-Look-Living-Room_1512x.jpg?v=1675386734',
		},
		name: 'Luxury Bathroom',
	},
	{
		id: 'br-2',
		source: {
			uri: 'https://www.bellabathrooms.co.uk/blog/wp-content/uploads/2020/09/iStock-1158066696-1.jpg',
		},
		name: 'Luxury Bathroom',
	},
	{
		id: 'kt-1',
		source: {
			uri: 'https://john-lewis.co.uk/wp-content/img-cache/14978/210615_JLH-IG_0022-Edit_JW-scaled-e1710431120803.webp',
		},
		name: 'Luxury Bathroom',
	},

	{
		id: 'br-1',
		source: {
			uri: 'https://images.ctfassets.net/g44e4oo0e2sa/7Ap4IIvcLDXaeyOZtTIIsE/a3640577789c4e8b70e5cb676b88a939/The_Bathroom_Showroom.jpg?fm=webp&q=75&r=4',
		},
		name: 'Elegant Dining',
	},

	{
		id: 'office-1',
		source: {
			uri: 'https://www.betterkitchens.co.uk/web/image/kitchen.style/19/banner_image?unique=d79acaf',
		},
		name: 'Home Office',
	},
	{
		id: 'office-dsadas1',
		source: {
			uri: 'https://www.tomhowley.co.uk/wp-content/uploads/ModernShakerKitchen_hero1.jpg',
		},
		name: 'Home Office',
	},
	{
		id: 'office-dsaddsadasas1',
		source: {
			uri: 'https://media.houseandgarden.co.uk/photos/661814569705e8148a61a04c/master/w_1600%2Cc_limit/HouseAndGarden_SussexHouse_S6_0092.jpg',
		},
		name: 'Home Office',
	},
	{
		id: 'officdsae-dsaddsadasas1',
		source: {
			uri: 'https://cdn-web.redrow.co.uk/-/media/redrow-2020/global/news-and-inspiration/inspiration/interior-design/2025/bedroom-ideas-for-national-bed-month/redrow-inspiration-hampstead-grey-bedroom.jpg?w=1280&h=720&useCustomFunctions=1&centerCrop=1&hash=E0053128ED174E1228445C6B88432C41',
		},
		name: 'Home Office',
	},
	{
		id: 'officdsadsae-dsaddsadasas1',
		source: {
			uri: 'https://hips.hearstapps.com/hmg-prod/images/461-w-montecito-ave-virtuallyherestudios-com-13-646eaa638cb69.jpg?crop=1xw:1xh;center,top',
		},
		name: 'Home Office',
	},
	{
		id: 'offiscdsadsae-dsaddsadasas1',
		source: {
			uri: 'https://www.bhg.com/thmb/dcA2PxsOahxmk2LgzWAaqOWFfxU=/6000x0/filters:no_upscale():strip_icc()/200522-EB_12-Living-Room_1267-b13debcb440a4471981d7ac637e76e7a.jpg',
		},
		name: 'Home Office',
	},
];

export function PhotoStep({
	onImageSelect,
	config,
	selectedImageUri,
	compact = false,
}: PhotoStepProps) {
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
