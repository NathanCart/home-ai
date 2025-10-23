import React, { useRef, useEffect, useState } from 'react';
import { View, TouchableOpacity, Modal, Animated, ActivityIndicator } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { Octicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

interface MediaSourceModalProps {
	visible: boolean;
	onClose: () => void;
	onImageSelected: (imageUri: string) => void;
}

export function MediaSourceModal({ visible, onClose, onImageSelected }: MediaSourceModalProps) {
	const insets = useSafeAreaInsets();
	const translateY = useRef(new Animated.Value(200)).current;
	const panGestureRef = useRef<PanGestureHandler>(null);
	const [isLoading, setIsLoading] = useState(false);

	// Reset loading state when modal opens
	useEffect(() => {
		if (visible) {
			setIsLoading(false);
		}
	}, [visible]);

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

	const handleTakePhoto = async () => {
		try {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			setIsLoading(true);

			// Request camera permissions
			const { status } = await ImagePicker.requestCameraPermissionsAsync();

			if (status !== 'granted') {
				alert('Camera permission is required to take photos.');
				setIsLoading(false);
				return;
			}

			// Launch camera with the same options as your working code
			const result = await ImagePicker.launchCameraAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: [4, 3],
				quality: 0.8,
			});

			// Handle result like your working code
			if (!result.canceled && result.assets[0]) {
				const asset = result.assets[0];
				if (asset.uri) {
					onImageSelected(asset.uri);
					handleClose(); // Close modal after successful selection
				}
			}
		} catch (error) {
			console.error('Error taking photo:', error);
			// More specific error handling
			if (error.message && error.message.includes('simulator')) {
				alert(
					'Camera is not available on simulator. Please test on a real device or use the photo library.'
				);
			} else if (error.message && error.message.includes('Camera not available')) {
				alert(
					'Camera is not available. Please check your device settings or use the photo library.'
				);
			} else {
				alert(
					`Failed to open camera: ${error.message || 'Unknown error'}. Please try again or use the photo library.`
				);
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleChooseFromGallery = async () => {
		try {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			setIsLoading(true);

			// Request media library permissions
			const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

			if (status !== 'granted') {
				alert('Gallery permission is required to select photos.');
				setIsLoading(false);
				return;
			}

			// Launch image picker with the same options as your working code
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: [4, 3],
				quality: 0.8,
			});

			// Handle result like your working code
			if (!result.canceled && result.assets[0]) {
				const asset = result.assets[0];
				if (asset.uri) {
					onImageSelected(asset.uri);
					handleClose(); // Close modal after successful selection
				}
			}
		} catch (error) {
			console.error('Error selecting image:', error);
			alert('Error selecting image. Please try again.');
		} finally {
			setIsLoading(false);
		}
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
									disabled={isLoading}
									className={`flex-row items-center bg-gray-50 rounded-2xl p-4 mb-4 ${isLoading ? 'opacity-50' : ''}`}
								>
									<View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mr-4">
										{isLoading ? (
											<ActivityIndicator size="small" color="#111827" />
										) : (
											<Octicons
												name="device-camera"
												size={24}
												color="#111827"
											/>
										)}
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
									{!isLoading && (
										<Octicons name="chevron-right" size={20} color="#6B7280" />
									)}
								</TouchableOpacity>

								{/* Choose from Gallery Option */}
								<TouchableOpacity
									onPress={handleChooseFromGallery}
									disabled={isLoading}
									className={`flex-row items-center bg-gray-50 rounded-2xl p-4 ${isLoading ? 'opacity-50' : ''}`}
								>
									<View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mr-4">
										{isLoading ? (
											<ActivityIndicator size="small" color="#111827" />
										) : (
											<Octicons name="image" size={24} color="#111827" />
										)}
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
									{!isLoading && (
										<Octicons name="chevron-right" size={20} color="#6B7280" />
									)}
								</TouchableOpacity>
							</View>
						</Animated.View>
					</TouchableOpacity>
				</Animated.View>
			</PanGestureHandler>
		</Modal>
	);
}
