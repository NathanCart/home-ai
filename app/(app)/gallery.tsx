import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function GalleryPage() {
	return (
		<View className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-50 justify-center items-center px-6">
			<View className="items-center space-y-6">
				<Text className="text-4xl font-bold text-gray-800 text-center">File Gallery</Text>

				<Text className="text-lg text-gray-600 text-center leading-relaxed">
					Browse through your organized files
				</Text>

				<View className="space-y-4 w-full max-w-sm">
					<TouchableOpacity
						onPress={() => router.back()}
						className="bg-indigo-600 py-4 px-6 rounded-xl items-center"
					>
						<Text className="text-white font-semibold text-lg text-center">
							Go Back
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						onPress={() => router.push('/')}
						className="bg-gray-200 py-4 px-6 rounded-xl items-center"
					>
						<Text className="text-gray-700 font-semibold text-lg text-center">
							Go Home
						</Text>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
}
