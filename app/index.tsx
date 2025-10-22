import { Redirect } from 'expo-router';

export default function Index() {
	// Redirect to the main app group
	return <Redirect href="/onboarding" />;
}
