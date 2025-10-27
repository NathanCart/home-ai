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
			title: 'Upload a photo to paint',
			subtitle: 'Take a photo of your space to begin painting your space with AI',
			icon: 'device-camera',
			description: '💡 Tip: Make sure your image is clear and well-lit for best results',
		},
		step2: {
			title: 'Select an area to paint',
			subtitle: 'Using the tools below, select the area you want to paint',
			icon: 'paintbrush',
			description: 'Pick colors that create the perfect mood and atmosphere',
		},
		step3: {
			title: 'Generate Design',
			subtitle: 'AI will create your personalized interior design',
			icon: 'sparkle',
			description: 'Review your preferences and generate your AI-powered design',
		},
		step6: {
			title: 'Design Complete',
			subtitle: 'Your interior design has been generated successfully',
			icon: 'check-circle',
			description: 'Your personalized interior design is ready!',
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
