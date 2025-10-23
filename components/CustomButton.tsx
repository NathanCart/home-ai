import React, { useRef } from 'react';
import { TouchableOpacity, Animated, Pressable } from 'react-native';
import { ThemedText } from './ThemedText';
import * as Haptics from 'expo-haptics';
import Octicons from '@expo/vector-icons/Octicons';

interface CustomButtonProps {
	title: string;
	onPress: () => void;
	icon?: keyof typeof Octicons.glyphMap;
	variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
	size?: 'sm' | 'md' | 'lg';
	disabled?: boolean;
	loading?: boolean;
	className?: string;
	iconPosition?: 'left' | 'right';
	hapticFeedback?: boolean;
}

export function CustomButton({
	title,
	onPress,
	icon,
	variant = 'primary',
	size = 'md',
	disabled = false,
	loading = false,
	className = '',
	iconPosition = 'left',
	hapticFeedback = true,
}: CustomButtonProps) {
	const scaleAnimation = useRef(new Animated.Value(1)).current;
	const opacityAnimation = useRef(new Animated.Value(1)).current;

	const getButtonStyles = () => {
		const baseStyles = 'rounded-3xl flex-row items-center justify-center';

		// Size styles
		const sizeStyles = {
			sm: 'px-4 py-2 min-h-[40px]',
			md: 'px-6 py-3 min-h-[48px]',
			lg: 'px-8 py-4 min-h-[56px]',
		};

		// Variant styles
		const variantStyles = {
			primary: 'bg-gray-900',
			secondary: 'bg-gray-600',
			outline: 'border-2 border-gray-900 bg-transparent',
			ghost: 'bg-transparent',
		};

		// Disabled styles
		const disabledStyles = disabled ? 'opacity-50' : '';

		return `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${disabledStyles} ${className}`;
	};

	const getTextStyles = () => {
		const sizeStyles = {
			sm: 'text-sm',
			md: 'text-base',
			lg: 'text-lg',
		};

		const variantStyles = {
			primary: 'text-white',
			secondary: 'text-white',
			outline: 'text-gray-900',
			ghost: 'text-gray-900',
		};

		return `${sizeStyles[size]} ${variantStyles[variant]}`;
	};

	const getIconSize = () => {
		const iconSizes = {
			sm: 16,
			md: 20,
			lg: 24,
		};
		return iconSizes[size];
	};

	const getIconColor = () => {
		const iconColors = {
			primary: '#ffffff',
			secondary: '#ffffff',
			outline: '#111827',
			ghost: '#111827',
		};
		return iconColors[variant];
	};

	const handlePressIn = () => {
		Animated.parallel([
			Animated.spring(scaleAnimation, {
				toValue: 0.95,
				useNativeDriver: true,
				tension: 300,
				friction: 10,
			}),
			Animated.timing(opacityAnimation, {
				toValue: 0.8,
				duration: 100,
				useNativeDriver: true,
			}),
		]).start();
	};

	const handlePressOut = () => {
		Animated.parallel([
			Animated.spring(scaleAnimation, {
				toValue: 1,
				useNativeDriver: true,
				tension: 300,
				friction: 10,
			}),
			Animated.timing(opacityAnimation, {
				toValue: 1,
				duration: 100,
				useNativeDriver: true,
			}),
		]).start();
	};

	const handlePress = () => {
		if (disabled || loading) return;

		// Haptic feedback
		if (hapticFeedback) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		}

		onPress();
	};

	const renderIcon = () => {
		if (!icon || loading) return null;

		return (
			<Octicons
				name={icon}
				size={getIconSize()}
				color={getIconColor()}
				style={{
					marginRight: iconPosition === 'left' ? 8 : 0,
					marginLeft: iconPosition === 'right' ? 8 : 0,
				}}
			/>
		);
	};

	const renderLoadingIcon = () => {
		if (!loading) return null;

		return (
			<Animated.View
				style={{
					transform: [
						{
							rotate: '0deg',
						},
					],
				}}
			>
				<Octicons
					name="sync"
					size={getIconSize()}
					color={getIconColor()}
					style={{
						marginRight: iconPosition === 'left' ? 8 : 0,
						marginLeft: iconPosition === 'right' ? 8 : 0,
					}}
				/>
			</Animated.View>
		);
	};

	return (
		<Animated.View
			className={`${className}`}
			style={{
				transform: [{ scale: scaleAnimation }],
				opacity: opacityAnimation,
			}}
		>
			<Pressable
				onPress={handlePress}
				onPressIn={handlePressIn}
				onPressOut={handlePressOut}
				disabled={disabled || loading}
				className={getButtonStyles()}
				style={({ pressed }) => [
					{
						opacity: pressed ? 0.8 : 1,
					},
				]}
			>
				{iconPosition === 'left' && (renderIcon() || renderLoadingIcon())}

				<ThemedText
					variant="body"
					className={`${getTextStyles()} !text-xl`}
					bold={variant === 'primary' || variant === 'secondary'}
				>
					{loading ? 'Loading...' : title}
				</ThemedText>

				{iconPosition === 'right' && (renderIcon() || renderLoadingIcon())}
			</Pressable>
		</Animated.View>
	);
}
