import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { ThemedText } from '../ThemedText';
import { StepConfig } from '../../config/stepConfig';
import * as Haptics from 'expo-haptics';

interface TextInputStepProps {
	onTextSubmit?: (text: string) => void;
	config: StepConfig;
	initialText?: string;
	examples?: string[];
}

export function TextInputStep({
	onTextSubmit,
	config,
	initialText = '',
	examples = [],
}: TextInputStepProps) {
	const [text, setText] = useState(initialText);

	const handleTextChange = (newText: string) => {
		setText(newText);
		onTextSubmit?.(newText);
	};

	const handleExamplePress = (example: string) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setText(example);
		onTextSubmit?.(example);
	};

	return (
		<View className="flex-1 px-6">
			<View className="items-start mb-4">
				<ThemedText variant="title-md" className="text-gray-900 mb-2 text-center" extraBold>
					{config.title || 'What should appear here?'}
				</ThemedText>
				<ThemedText variant="body" className="text-gray-600 leading-6">
					{config.description || 'Describe what you want to replace the masked area with'}
				</ThemedText>
			</View>

			<View className="mb-6 bg-white rounded-2xl border-2 border-gray-200">
				<TextInput
					value={text}
					onChangeText={handleTextChange}
					placeholder="e.g., walls, floor, sofa, carpet..."
					placeholderTextColor="#9CA3AF"
					multiline
					numberOfLines={8}
					className="p-4 text-gray-900"
					style={{
						minHeight: 200,
						textAlignVertical: 'top',
						fontSize: 16,
					}}
				/>
			</View>

			{examples && examples.length > 0 && (
				<View className="mb-4">
					<ThemedText variant="body" className="text-gray-600 mb-3">
						Or choose a quick example:
					</ThemedText>
					<View className="flex-col gap-2">
						{examples.map((example, index) => (
							<TouchableOpacity
								key={index}
								onPress={() => handleExamplePress(example)}
								className="px-4 py-3 bg-white border border-gray-300 rounded-xl"
							>
								<ThemedText variant="body" className="text-gray-900">
									{example}
								</ThemedText>
							</TouchableOpacity>
						))}
					</View>
				</View>
			)}
		</View>
	);
}
