export interface StepConfig {
	title: string;
	subtitle: string;
	icon: string;
	description: string;
}

export interface ModeConfig {
	step1: StepConfig;
	step2: StepConfig;
	step3: StepConfig;
	step4: StepConfig;
	step5: StepConfig;
	step6: StepConfig;
}

export const stepConfigs: Record<string, ModeConfig> = {
	'interior-design': {
		step1: {
			title: 'Upload a photo of your room',
			subtitle: 'Take a photo or upload an existing image to get started',
			icon: 'device-camera',
			description: '💡 Tip: Make sure your image is clear and well-lit for best results',
		},
		step2: {
			title: 'Choose a room type',
			subtitle: 'Select the type of room you want to design',
			icon: 'home',
			description: 'Choose the type of room you want to design',
		},
		step3: {
			title: 'Choose design style',
			subtitle: 'Select your preferred interior design style',
			icon: 'palette',
			description: 'Pick a style that matches your vision and personality',
		},
		step4: {
			title: 'Choose color palette',
			subtitle: 'Select a color scheme for your design',
			icon: 'paintbrush',
			description: 'Pick colors that create the perfect mood and atmosphere',
		},
		step5: {
			title: 'Generate design',
			subtitle: 'AI will create your personalized interior design',
			icon: 'sparkle',
			description: 'Review your preferences and generate your AI-powered design',
		},
		step6: {
			title: 'Design complete',
			subtitle: 'Your interior design has been generated successfully',
			icon: 'check-circle',
			description: 'Your personalized interior design is ready!',
		},
	},
	paint: {
		step1: {
			title: 'Upload a photo',
			subtitle: 'Select or take a photo to start replacing objects with AI',
			icon: 'device-camera',
			description: '💡 Tip: Make sure your image is clear and well-lit for best results',
		},
		step2: {
			title: 'Select area to replace',
			subtitle: 'Use brush, auto-select, or eraser to mark what you want to replace',
			icon: 'paintbrush',
			description: 'Select the area where you want to replace an object',
		},
		step3: {
			title: 'What should appear here?',
			subtitle: 'Describe what you want to replace the masked area with',
			icon: 'sparkle',
			description: 'Describe what you want to replace the masked area with',
		},
		step4: {
			title: 'Generating...',
			subtitle: 'AI is replacing the selected area',
			icon: 'sparkle',
			description: 'AI is replacing the selected area based on your description',
		},
		step5: {
			title: 'Complete',
			subtitle: 'Your replacement is complete',
			icon: 'check-circle',
			description: 'Your object replacement is ready!',
		},
		step6: {
			title: 'Complete',
			subtitle: 'Your replacement is complete',
			icon: 'check-circle',
			description: 'Your object replacement is ready!',
		},
	},
	default: {
		step1: {
			title: 'Upload Your Photo',
			subtitle: 'Take a photo or upload an existing image to get started',
			icon: 'device-camera',
			description: '💡 Tip: Make sure your image is clear and well-lit for best results',
		},
		step2: {
			title: 'Choose Your Options',
			subtitle: 'Select your preferences and customize your generation',
			icon: 'gear',
			description: 'Customize your generation with various options',
		},
		step3: {
			title: 'Generate Content',
			subtitle: 'AI will create your personalized content',
			icon: 'sparkle',
			description: 'Review your preferences and generate your AI-powered content',
		},
		step4: {
			title: 'Generate Content',
			subtitle: 'AI will create your personalized content',
			icon: 'sparkle',
			description: 'Review your preferences and generate your AI-powered content',
		},
		step5: {
			title: 'Complete',
			subtitle: 'Your content has been generated successfully',
			icon: 'check-circle',
			description: 'Your personalized content is ready!',
		},
		step6: {
			title: 'Complete',
			subtitle: 'Your content has been generated successfully',
			icon: 'check-circle',
			description: 'Your personalized content is ready!',
		},
	},
	garden: {
		step1: {
			title: 'Upload a photo of your garden',
			subtitle: 'Take a photo or upload an existing image of your outdoor space',
			icon: 'device-camera',
			description: '💡 Tip: Make sure your image is clear and well-lit for best results',
		},
		step2: {
			title: 'Choose a garden style',
			subtitle: 'Select your preferred garden design style',
			icon: 'palette',
			description: 'Pick a style that matches your vision and personality',
		},
		step3: {
			title: 'Generate garden design',
			subtitle: 'AI will create your personalized garden design',
			icon: 'sparkle',
			description: 'Review your preferences and generate your AI-powered garden design',
		},
		step4: {
			title: 'Garden design complete',
			subtitle: 'Your garden design has been generated successfully',
			icon: 'check-circle',
			description: 'Your personalized garden design is ready!',
		},
		step5: {
			title: 'Garden design complete',
			subtitle: 'Your garden design has been generated successfully',
			icon: 'check-circle',
			description: 'Your personalized garden design is ready!',
		},
		step6: {
			title: 'Garden design complete',
			subtitle: 'Your garden design has been generated successfully',
			icon: 'check-circle',
			description: 'Your personalized garden design is ready!',
		},
	},
	'exterior-design': {
		step1: {
			title: 'Upload a photo of your building',
			subtitle: 'Take a photo or upload an existing image of your building exterior',
			icon: 'device-camera',
			description: '💡 Tip: Make sure your image is clear and shows the building facade',
		},
		step2: {
			title: 'Choose house type',
			subtitle: 'Select the type of building you want to design',
			icon: 'home',
			description: 'Choose the building type to get the best design results',
		},
		step3: {
			title: 'Choose exterior style',
			subtitle: 'Select your preferred exterior design style',
			icon: 'palette',
			description: 'Pick a style that matches your vision and personality',
		},
		step4: {
			title: 'Generate exterior design',
			subtitle: 'AI will create your personalized exterior design',
			icon: 'sparkle',
			description: 'Review your preferences and generate your AI-powered exterior design',
		},
		step5: {
			title: 'Exterior design complete',
			subtitle: 'Your exterior design has been generated successfully',
			icon: 'check-circle',
			description: 'Your personalized exterior design is ready!',
		},
		step6: {
			title: 'Exterior design complete',
			subtitle: 'Your exterior design has been generated successfully',
			icon: 'check-circle',
			description: 'Your personalized exterior design is ready!',
		},
	},
};

export function getStepConfig(mode: string, step: number): StepConfig {
	const config = stepConfigs[mode] || stepConfigs.default;

	switch (step) {
		case 1:
			return config.step1;
		case 2:
			return config.step2;
		case 3:
			return config.step3;
		case 4:
			return config.step4;
		case 5:
			return config.step5;
		case 6:
			return config.step6;
		default:
			return config.step1;
	}
}
