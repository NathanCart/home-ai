import React from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from './ThemedText';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { getUpcomingSeasonalEvent, getSeasonalStyle } from 'utils/seasonalUtils';

interface SeasonalBannerProps {
	sharedAnimation?: any;
}

export function SeasonalBanner({ sharedAnimation }: SeasonalBannerProps) {
	const upcomingEvent = getUpcomingSeasonalEvent();

	if (!upcomingEvent) {
		return null;
	}

	const seasonalStyle = getSeasonalStyle(upcomingEvent.id);

	if (!seasonalStyle) {
		return null;
	}

	const handlePress = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		// Navigate to interior design modal with the seasonal style preset
		router.push({
			pathname: '/generatemodal',
			params: {
				mode: 'interior-design',
				initialStyle: JSON.stringify(seasonalStyle),
			},
		});
	};

	// Calculate days until event (using start of day for accurate calculation)
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const eventDate = new Date(
		upcomingEvent.date.getFullYear(),
		upcomingEvent.date.getMonth(),
		upcomingEvent.date.getDate()
	);
	const daysUntilEvent = Math.floor(
		(eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
	);

	return (
		<TouchableOpacity
			onPress={handlePress}
			activeOpacity={0.9}
			className="rounded-3xl overflow-hidden"
		>
			<View
				className="relative"
				style={{
					shadowColor: '#000',
					shadowOffset: {
						width: 0,
						height: 8,
					},
					shadowOpacity: 0.2,
					shadowRadius: 16,
					elevation: 12,
				}}
			>
				{/* Background Image */}
				{seasonalStyle.imageUrl && (
					<Image
						source={{ uri: seasonalStyle.imageUrl }}
						className="w-full h-48"
						resizeMode="cover"
					/>
				)}

				{/* Dark Overlay */}
				<View className="absolute inset-0 bg-black/50" />

				{/* Gradient Overlay */}
				<LinearGradient
					colors={['transparent', 'rgba(0,0,0,0.6)']}
					locations={[0, 1]}
					className="absolute inset-0"
				/>

				{/* Content */}
				<View className="absolute inset-0 justify-end p-6">
					<View className="flex-row items-center justify-between">
						<View className="flex-1">
							<ThemedText variant="title-lg" className="text-white mb-1" extraBold>
								{upcomingEvent.name} is Coming!
							</ThemedText>
							<ThemedText variant="body" className="text-gray-100 mb-3" bold>
								{seasonalStyle.description}
							</ThemedText>
							{daysUntilEvent > 0 && (
								<ThemedText variant="body" className="text-gray-100 text-sm">
									{daysUntilEvent} {daysUntilEvent === 1 ? 'day' : 'days'} until{' '}
									{upcomingEvent.name}
								</ThemedText>
							)}
						</View>
					</View>
				</View>
			</View>
		</TouchableOpacity>
	);
}
