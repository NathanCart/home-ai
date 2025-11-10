// Seasonal event definitions with their dates
interface SeasonalEvent {
	id: string;
	name: string;
	date: Date; // The actual date of the event
	daysBefore: number; // How many days before to start showing (default 30)
	imageUrl?: string;
}

// Define seasonal events
const seasonalEvents: SeasonalEvent[] = [
	{
		id: 'christmas',
		name: 'Christmas',
		date: new Date(new Date().getFullYear(), 11, 25), // December 25
		daysBefore: 30,
		imageUrl: 'https://pingu-app.s3.eu-west-2.amazonaws.com/christmas.webp',
	},
	{
		id: 'easter',
		name: 'Easter',
		// Easter is calculated (first Sunday after first full moon after March 21)
		// For simplicity, approximate to April 9 (adjust as needed)
		date: new Date(new Date().getFullYear(), 3, 9),
		daysBefore: 30,
		imageUrl: 'https://pingu-app.s3.eu-west-2.amazonaws.com/easter.webp',
	},
	{
		id: 'halloween',
		name: 'Halloween',
		date: new Date(new Date().getFullYear(), 9, 31), // October 31
		daysBefore: 30,
		imageUrl: 'https://pingu-app.s3.eu-west-2.amazonaws.com/halloween.webp',
	},
	{
		id: 'thanksgiving',
		name: 'Thanksgiving',
		// Thanksgiving is 4th Thursday of November
		date: getThanksgivingDate(new Date().getFullYear()),
		daysBefore: 7,
		imageUrl: 'https://pingu-app.s3.eu-west-2.amazonaws.com/thanksgiving.webp',
	},
	{
		id: 'valentines',
		name: "Valentine's Day",
		date: new Date(new Date().getFullYear(), 1, 14), // February 14
		daysBefore: 30,
		imageUrl: 'https://pingu-app.s3.eu-west-2.amazonaws.com/valentines.webp',
	},
	{
		id: 'st-patricks',
		name: "St. Patrick's Day",
		date: new Date(new Date().getFullYear(), 2, 17), // March 17
		daysBefore: 30,
		imageUrl: 'https://pingu-app.s3.eu-west-2.amazonaws.com/stpatricks.webp',
	},
];

// Helper function to calculate Thanksgiving date (4th Thursday of November)
function getThanksgivingDate(year: number): Date {
	const november = new Date(year, 10, 1); // November 1
	const dayOfWeek = november.getDay(); // 0 = Sunday, 1 = Monday, etc.
	// Find first Thursday
	const daysUntilThursday = (4 - dayOfWeek + 7) % 7;
	const firstThursday = 1 + daysUntilThursday;
	// 4th Thursday is 3 weeks later
	return new Date(year, 10, firstThursday + 21);
}

// Check if we're within 30 days of a seasonal event
export function getUpcomingSeasonalEvent(): SeasonalEvent | null {
	const now = new Date();
	const currentYear = now.getFullYear();

	// Check events for current year
	for (const event of seasonalEvents) {
		const eventDate = new Date(currentYear, event.date.getMonth(), event.date.getDate());
		const daysUntilEvent = Math.floor(
			(eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
		);

		// If event is within the specified days before (default 30) and hasn't passed
		if (daysUntilEvent >= 0 && daysUntilEvent <= event.daysBefore) {
			return event;
		}

		// Also check next year's event (for events that might be coming up next year)
		const nextYearEventDate = new Date(
			currentYear + 1,
			event.date.getMonth(),
			event.date.getDate()
		);
		const daysUntilNextYearEvent = Math.floor(
			(nextYearEventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
		);

		if (daysUntilNextYearEvent >= 0 && daysUntilNextYearEvent <= event.daysBefore) {
			return { ...event, date: nextYearEventDate };
		}
	}

	return null;
}

// Get the style object for a seasonal event
export function getSeasonalStyle(eventId: string) {
	const seasonalStyles: Record<string, any> = {
		christmas: {
			id: 'christmas',
			name: 'Christmas',
			description: 'Festive holiday decorations and warm Christmas vibes',
			imageUrl: 'https://pingu-app.s3.eu-west-2.amazonaws.com/christmas.webp',
		},
		easter: {
			id: 'easter',
			name: 'Easter',
			description: 'Fresh springtime pastels and Easter decorations',
			imageUrl: 'https://pingu-app.s3.eu-west-2.amazonaws.com/easter.webp',
		},
		halloween: {
			id: 'halloween',
			name: 'Halloween',
			description: 'Spooky decorations and Halloween atmosphere',
			imageUrl: 'https://pingu-app.s3.eu-west-2.amazonaws.com/halloween.webp',
		},
		thanksgiving: {
			id: 'thanksgiving',
			name: 'Thanksgiving',
			description: 'Warm autumn harvest decorations and cozy fall vibes',
			imageUrl: 'https://pingu-app.s3.eu-west-2.amazonaws.com/thanksgiving.webp',
		},
		valentines: {
			id: 'valentines',
			name: "Valentine's Day",
			description: 'Romantic red and pink hearts and love-themed decor',
			imageUrl: 'https://pingu-app.s3.eu-west-2.amazonaws.com/valentines.webp',
		},
		'st-patricks': {
			id: 'st-patricks',
			name: "St. Patrick's Day",
			description: 'Green shamrocks and Irish-themed festive decorations',
			imageUrl: 'https://pingu-app.s3.eu-west-2.amazonaws.com/stpatricks.webp',
		},
	};

	return seasonalStyles[eventId] || null;
}
