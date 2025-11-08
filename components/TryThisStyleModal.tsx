import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, Modal, Animated, Image } from 'react-native';
import { Octicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { CustomButton } from './CustomButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

interface TryThisStyleModalProps {
	visible: boolean;
	onClose: () => void;
	onTryStyle: () => void;
	imageUrl: string;
}

export function TryThisStyleModal({
	visible,
	onClose,
	onTryStyle,
	imageUrl,
}: TryThisStyleModalProps) {
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const scaleAnim = useRef(new Animated.Value(0.9)).current;
	const insets = useSafeAreaInsets();

	// Fade and scale animation when modal opens
	useEffect(() => {
		if (visible) {
			Animated.parallel([
				Animated.timing(fadeAnim, {
					toValue: 1,
					duration: 300,
					useNativeDriver: true,
				}),
				Animated.spring(scaleAnim, {
					toValue: 1,
					tension: 50,
					friction: 7,
					useNativeDriver: true,
				}),
			]).start();
		} else {
			fadeAnim.setValue(0);
			scaleAnim.setValue(0.9);
		}
	}, [visible, fadeAnim, scaleAnim]);

	const handleClose = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		Animated.parallel([
			Animated.timing(fadeAnim, {
				toValue: 0,
				duration: 200,
				useNativeDriver: true,
			}),
			Animated.timing(scaleAnim, {
				toValue: 0.9,
				duration: 200,
				useNativeDriver: true,
			}),
		]).start(() => {
			onClose();
		});
	};

	const handleTryStyle = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		handleClose();
		// Small delay to allow modal to close before opening the next one
		setTimeout(() => {
			onTryStyle();
		}, 200);
	};

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
			<View
				className="flex-1 justify-center items-center px-6"
				style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
			>
				{/* Background Overlay */}
				<TouchableOpacity
					className="absolute inset-0 bg-black/50"
					activeOpacity={1}
					onPress={handleClose}
				/>

				{/* Centered Modal */}
				<Animated.View
					className="bg-white rounded-3xl w-full max-w-sm overflow-hidden px-4 pt-4 relative border-white"
					style={{
						opacity: fadeAnim,
						transform: [{ scale: scaleAnim }],

						shadowColor: '#000',
						shadowOffset: { width: 0, height: 12 },
						shadowOpacity: 0.15,
						shadowRadius: 32,
						elevation: 20,
					}}
				>
					{/* Close Button */}
					<TouchableOpacity
						onPress={handleClose}
						className="absolute top-4 right-4 z-10 w-10 h-10 items-center justify-center rounded-full bg-gray-50 backdrop-blur-sm"
						style={{
							shadowColor: '#000',
							shadowOffset: { width: 0, height: 2 },
							shadowOpacity: 0.1,
							shadowRadius: 4,
							elevation: 4,
						}}
						activeOpacity={0.7}
					>
						<Octicons name="x" size={20} color="#111827" />
					</TouchableOpacity>

					{/* Image */}
					<View className="w-full" style={{ aspectRatio: 1 }}>
						<Image
							source={{ uri: imageUrl }}
							style={{
								width: '100%',
								height: '100%',
							}}
							className="rounded-3xl"
							resizeMode="cover"
						/>
					</View>

					{/* Try This Style Button */}
					<View className=" pt-4 pb-4">
						<CustomButton
							title="Try This Style"
							onPress={handleTryStyle}
							variant="primary"
							size="lg"
						/>
					</View>
				</Animated.View>
			</View>
		</Modal>
	);
}
