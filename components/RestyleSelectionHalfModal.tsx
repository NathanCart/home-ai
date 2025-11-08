import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, Modal, Animated, ScrollView, Dimensions } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { Octicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ThemedText } from './ThemedText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

interface RestyleOption {
	id: string;
	title: string;
	description: string;
	icon: string;
	iconType?: 'octicon' | 'material';
}

const restyleOptions: RestyleOption[] = [
	{
		id: 'interior-design',
		title: 'Interior Design',
		description: 'Redesign your interior with different styles and rooms',
		icon: 'home',
		iconType: 'octicon',
	},
	{
		id: 'garden',
		title: 'Garden Design',
		description: 'Transform your outdoor space',
		icon: 'flower-tulip-outline',
		iconType: 'material',
	},
	{
		id: 'exterior-design',
		title: 'Exterior Design',
		description: 'Redesign your home exterior',
		icon: 'office-building',
		iconType: 'material',
	},
	{
		id: 'styletransfer',
		title: 'Style Transfer',
		description: 'Transfer style from one image to your room',
		icon: 'palette-outline',
		iconType: 'material',
	},
];

interface RestyleSelectionHalfModalProps {
	visible: boolean;
	onClose: () => void;
	onSelect: (mode: string) => void;
	initialImageUri?: string | null;
}

export function RestyleSelectionHalfModal({
	visible,
	onClose,
	onSelect,
	initialImageUri,
}: RestyleSelectionHalfModalProps) {
	const translateY = useRef(new Animated.Value(1000)).current;
	const backgroundOpacity = useRef(new Animated.Value(0)).current;
	const panGestureRef = useRef<PanGestureHandler>(null);
	const insets = useSafeAreaInsets();

	// Slide up animation when modal opens
	useEffect(() => {
		if (visible) {
			Animated.parallel([
				Animated.timing(translateY, {
					toValue: 0,
					duration: 300,
					useNativeDriver: true,
				}),
				Animated.timing(backgroundOpacity, {
					toValue: 1,
					duration: 300,
					useNativeDriver: true,
				}),
			]).start();
		} else {
			translateY.setValue(1000);
			backgroundOpacity.setValue(0);
		}
	}, [visible]);

	const onGestureEvent = Animated.event([{ nativeEvent: { translationY: translateY } }], {
		useNativeDriver: true,
	});

	const onHandlerStateChange = (event: PanGestureHandlerGestureEvent) => {
		if (event.nativeEvent.state === 5) {
			// END state
			const { translationY, velocityY } = event.nativeEvent;

			if (translationY > 120 || velocityY > 600) {
				onClose();
			} else {
				Animated.timing(translateY, {
					toValue: 0,
					duration: 200,
					useNativeDriver: true,
				}).start();
			}
		}
	};

	const handleClose = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		Animated.parallel([
			Animated.timing(translateY, {
				toValue: 1000,
				duration: 300,
				useNativeDriver: true,
			}),
			Animated.timing(backgroundOpacity, {
				toValue: 0,
				duration: 300,
				useNativeDriver: true,
			}),
		]).start(() => {
			onClose();
		});
	};

	const handleSelect = (mode: string) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		handleClose();
		// Small delay to allow modal to close before opening the next one
		setTimeout(() => {
			onSelect(mode);
		}, 300);
	};

	return (
		<Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
			<View className="flex-1">
				{/* Background Overlay */}
				<Animated.View
					className="absolute inset-0 bg-black"
					style={{
						opacity: backgroundOpacity.interpolate({
							inputRange: [0, 1],
							outputRange: [0, 0.5],
						}),
					}}
				>
					<TouchableOpacity className="flex-1" activeOpacity={1} onPress={handleClose} />
				</Animated.View>

				{/* Half Modal */}
				<PanGestureHandler
					ref={panGestureRef}
					onGestureEvent={onGestureEvent}
					onHandlerStateChange={onHandlerStateChange}
				>
					<Animated.View
						className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl"
						style={{
							transform: [{ translateY }],
							paddingBottom: insets.bottom + 16,
							maxHeight: Dimensions.get('window').height * 0.85,
						}}
					>
						{/* Handle Bar */}
						<View className="items-center pt-3 pb-2">
							<View className="w-12 h-1 bg-gray-300 rounded-full" />
						</View>

						{/* Header */}
						<View className="px-6 pb-4 border-b border-gray-200">
							<View className="flex-row items-center justify-between">
								<ThemedText variant="title-lg" className="text-gray-900" extraBold>
									Choose restyle type
								</ThemedText>
								<TouchableOpacity onPress={handleClose} className="p-2">
									<Octicons name="x" size={24} color="#6B7280" />
								</TouchableOpacity>
							</View>
							<ThemedText variant="body" className="text-gray-600 mt-2">
								Select how you want to restyle your image
							</ThemedText>
						</View>

						{/* Options List */}
						<ScrollView
							className="flex-1"
							showsVerticalScrollIndicator={false}
							contentContainerStyle={{ paddingVertical: 16 }}
						>
							{restyleOptions.map((option) => (
								<TouchableOpacity
									key={option.id}
									onPress={() => handleSelect(option.id)}
									className="mx-6 mb-3 p-4 bg-gray-50 rounded-2xl border border-gray-200 active:bg-gray-100"
									activeOpacity={0.7}
								>
									<View className="flex-row items-center">
										<View className="w-12 h-12 bg-gray-900 rounded-xl items-center justify-center mr-4">
											{option.iconType === 'material' ? (
												<MaterialCommunityIcons
													name={option.icon as any}
													size={24}
													color="#F9FAFB"
												/>
											) : (
												<Octicons
													name={option.icon as any}
													size={24}
													color="#F9FAFB"
												/>
											)}
										</View>
										<View className="flex-1">
											<ThemedText
												variant="title-sm"
												className="text-gray-900"
												bold
											>
												{option.title}
											</ThemedText>
											<ThemedText
												variant="body"
												className="text-gray-600 text-sm mt-1"
											>
												{option.description}
											</ThemedText>
										</View>
										<Octicons name="chevron-right" size={20} color="#9CA3AF" />
									</View>
								</TouchableOpacity>
							))}
						</ScrollView>
					</Animated.View>
				</PanGestureHandler>
			</View>
		</Modal>
	);
}
