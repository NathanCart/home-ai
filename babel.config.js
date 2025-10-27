module.exports = function (api) {
	api.cache(true);
	let plugins = ['react-native-reanimated/plugin'];

	// Add Skia only if installed
	try {
		require('@shopify/react-native-skia');
		plugins.push('react-native-skia/babel');
	} catch (e) {
		// Skia not installed
	}

	return {
		presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],

		plugins,
	};
};
