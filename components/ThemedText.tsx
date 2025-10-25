import { Text, type TextProps } from 'react-native';

export type ThemedTextProps = TextProps & {
	color?: 'primary' | 'secondary' | 'destructive';
	variant?: 'body' | 'title-lg' | 'title-xl' | 'title-md' | 'title-sm';
	bold?: boolean;
	extraBold?: boolean;
};

export function ThemedText({
	style,
	variant = 'body',
	color = 'primary',
	className,
	bold,
	extraBold,
	...rest
}: ThemedTextProps) {
	// Get the appropriate font weight based on variant
	const getFontFamily = () => {
		if (bold) {
			return 'Urbanist_700Bold';
		}
		if (extraBold) {
			return 'Urbanist_700Bold';
		}
		switch (variant) {
			case 'title-xl':
			case 'title-lg':
			case 'title-md':
				return 'Urbanist_700Bold';
			case 'title-sm':
				return 'Urbanist_400Regular';
			case 'body':
			default:
				return 'Urbanist_400Regular';
		}
	};

	return (
		<Text
			style={[
				{
					fontFamily: getFontFamily(),
					textAlignVertical: 'center',
				},
				style,
			]}
			className={`
        ${variant === 'title-lg' ? 'text-3xl' : ''}
        ${variant === 'title-xl' ? 'text-4xl' : ''}
        ${variant === 'title-md' ? 'text-2xl' : ''}
		${variant === 'title-sm' ? 'text-xl' : ''}
        ${variant === 'body' ? 'text-lg' : ''}

        ${
			color === 'primary'
				? 'text-light-textPrimary dark:text-dark-textPrimary'
				: color === 'secondary'
					? 'text-light-textSecondary dark:text-dark-textSecondary'
					: color === 'destructive'
						? 'text-light-destructiveText dark:text-dark-destructiveText'
						: 'text-light-textPrimary dark:text-dark-textPrimary'
		}
        ${className}
      `}
			{...rest}
		/>
	);
}
