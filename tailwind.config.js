/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./app/**/*.{js,ts,tsx}', './components/**/*.{js,ts,tsx}'],

	presets: [require('nativewind/preset')],
	theme: {
		extend: {
			colors: {
				primary: '#199dfe',
				primary2: '#0285f8',
				gray: {
					100: '#F0F3F5',
					200: '#EBECF2',
					300: '#D1D5DB',
				},
			},
		},
	},
	plugins: [],
};
