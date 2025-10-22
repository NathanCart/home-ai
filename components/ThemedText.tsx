import { Text, type TextProps } from 'react-native';

export type ThemedTextProps = TextProps & {
	color?: 'primary' | 'secondary' | 'destructive';
	variant?: 'body' | 'title-lg' | 'title-xl' | 'title-md';
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
			return 'Montserrat_700Bold';
		}
		if (extraBold) {
			return 'Montserrat_800ExtraBold';
		}
		switch (variant) {
			case 'title-xl':
			case 'title-lg':
			case 'title-md':
				return 'Montserrat_600SemiBold';
			case 'body':
			default:
				return 'Montserrat_500Medium';
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
        ${variant === 'title-lg' ? 'text-4xl' : ''}
        ${variant === 'title-xl' ? 'text-5xl' : ''}
        ${variant === 'title-md' ? 'text-3xl' : ''}
        ${variant === 'body' ? 'text-xl' : ''}

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
