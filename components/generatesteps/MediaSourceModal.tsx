import React, { useRef } from 'react';
import { View, TouchableOpacity, Modal, Animated } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { Octicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

interface MediaSourceModalProps {
	visible: boolean;
	onClose: () => void;
	onTakePhoto: () => void;
	onChooseFromGallery: () => void;
}

export function MediaSourceModal({
	visible,
	onClose,
	onTakePhoto,
	onChooseFromGallery,
}: MediaSourceModalProps) {
	const insets = useSafeAreaInsets();
	const translateY = useRef(new Animated.Value(200)).current;
	const panGestureRef = useRef<PanGestureHandler>(null);

	// Slide up animation when modal opens
	React.useEffect(() => {
		if (visible) {
			Animated.spring(translateY, {
				toValue: 0,
				tension: 100,
				friction: 8,
				useNativeDriver: true,
			}).start();
		} else {
			translateY.setValue(200);
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
				// Close modal - don't reset the position, just close
				onClose();
			} else {
				// Snap back to original position
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
		Animated.timing(translateY, {
			toValue: 200,
			duration: 200,
			useNativeDriver: true,
		}).start(() => {
			onClose();
		});
	};

	const handleTakePhoto = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		onTakePhoto();
		handleClose();
	};

	const handleChooseFromGallery = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		onChooseFromGallery();
		handleClose();
	};

	return (
		<Modal
			visible={visible}
			animationType="fade"
			transparent={true}
			onRequestClose={handleClose}
		>
			<PanGestureHandler
				ref={panGestureRef}
				onGestureEvent={onGestureEvent}
				onHandlerStateChange={onHandlerStateChange}
			>
				<Animated.View className="flex-1 justify-end bg-black/50">
					<TouchableOpacity className="flex-1" activeOpacity={1} onPress={handleClose}>
						<View />
					</TouchableOpacity>
					<TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
						<Animated.View
							className="bg-white rounded-t-3xl"
							style={{
								paddingBottom: insets.bottom,
								transform: [{ translateY }],
							}}
						>
							{/* Handle */}
							<View className="w-12 h-1 bg-gray-300 rounded-full self-center mt-3 mb-4" />

							{/* Header */}
							<View className="flex-row items-center justify-between px-6 mb-6">
								<ThemedText
									variant="title-md"
									className="text-gray-900 font-semibold"
								>
									Select Media Source
								</ThemedText>
								<TouchableOpacity onPress={handleClose}>
									<Octicons name="x" size={24} color="#6B7280" />
								</TouchableOpacity>
							</View>

							{/* Options */}
							<View className="px-6 pb-6">
								{/* Take Photo Option */}
								<TouchableOpacity
									onPress={handleTakePhoto}
									className="flex-row items-center bg-gray-50 rounded-2xl p-4 mb-4"
								>
									<View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mr-4">
										<Octicons name="device-camera" size={24} color="#111827" />
									</View>
									<View className="flex-1">
										<ThemedText
											variant="body"
											bold
											className="text-gray-900 font-semibold"
										>
											Take photo from camera
										</ThemedText>
										<ThemedText
											variant="body"
											className="text-gray-600 text-sm mt-1"
										>
											Capture a new photo of your room
										</ThemedText>
									</View>
									<Octicons name="chevron-right" size={20} color="#6B7280" />
								</TouchableOpacity>

								{/* Choose from Gallery Option */}
								<TouchableOpacity
									onPress={handleChooseFromGallery}
									className="flex-row items-center bg-gray-50 rounded-2xl p-4"
								>
									<View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mr-4">
										<Octicons name="image" size={24} color="#111827" />
									</View>
									<View className="flex-1">
										<ThemedText
											variant="body"
											bold
											className="text-gray-900 font-semibold"
										>
											Choose from gallery
										</ThemedText>
										<ThemedText
											variant="body"
											className="text-gray-600 text-sm mt-1"
										>
											Select an existing photo from your gallery
										</ThemedText>
									</View>
									<Octicons name="chevron-right" size={20} color="#6B7280" />
								</TouchableOpacity>
							</View>
						</Animated.View>
					</TouchableOpacity>
				</Animated.View>
			</PanGestureHandler>
		</Modal>
	);
}
