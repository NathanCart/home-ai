/**
 * Room-specific prompt details to ensure AI includes essential elements
 * Each room type has specific requirements and typical features
 */

export const roomPrompts: { [key: string]: string } = {
	'living-room':
		'must include seating area with sofa or chairs, coffee table, entertainment area, ambient lighting, comfortable arrangement for conversation and relaxation',
	bedroom:
		'must include bed as central focal point, nightstands or bedside tables, adequate lighting, dresser or storage, calming atmosphere, comfortable sleeping space',
	kitchen:
		'must include countertops, cabinets, cooking appliances (stove/oven), sink, refrigerator, food preparation areas, functional work triangle layout',
	bathroom:
		'must include shower or bathtub, toilet, sink/vanity, mirror, towel storage, proper lighting, clean and hygienic appearance',
	'dining-room':
		'must include dining table with chairs, proper seating capacity, lighting fixture above table, space for serving, comfortable eating area',
	'home-office':
		'must include desk with workspace, office chair, adequate task lighting, storage for supplies, organized work environment, professional atmosphere',
	nursery:
		'must include crib or baby bed, changing table or area, soft lighting, storage for baby items, safe and calming environment, child-appropriate decor',
	'kids-room':
		'must include bed suitable for children, toy storage, play area, safe furniture, age-appropriate design',
	'laundry-room':
		'must include washing machine, dryer or drying space, folding area, storage for detergents, utility sink, organized and functional layout',
	'walk-in-closet':
		'must include hanging rods for clothes, shelving units, drawer systems, full-length mirror, good lighting, organized storage solutions',
	entryway:
		'must include area for shoes, coat hooks or storage, welcoming atmosphere, proper lighting, functional drop zone for keys and mail',
	'home-gym':
		'must include exercise equipment, workout space, mirrors, proper flooring, adequate lighting, motivating atmosphere, storage for gear',
	library:
		'must include bookshelves with books, reading chair or seating, good reading light, quiet atmosphere, intellectual aesthetic',
	'media-room':
		'must include large screen or TV, comfortable seating arranged for viewing, sound system, dark ambient lighting, entertainment setup',
	basement:
		'must include functional space layout, proper lighting, storage solutions, finished walls and floors, multi-purpose areas',
	attic: 'must include sloped ceiling or roof line, dormer windows if present, creative use of angular space, cozy atmosphere, proper lighting',
	sunroom:
		'must include large windows, abundant natural light, plants or greenery, comfortable seating, connection to outdoors, bright airy atmosphere',
	balcony:
		'must include outdoor furniture, railing visible, connection to interior space, plants or decor, outdoor living atmosphere',
	patio: 'must include outdoor furniture, ground surface (pavers/concrete/wood), connection to landscape, outdoor living setup, entertaining space',
	garage: 'must include vehicle parking space, storage solutions, workbench area, tool organization, functional utility space',
};

/**
 * Get the detailed prompt for a specific room type
 */
export function getRoomPrompt(roomId: string): string {
	// Normalize the room ID (lowercase, replace spaces with hyphens)
	const normalizedId = roomId.toLowerCase().replace(/\s+/g, '-');
	return roomPrompts[normalizedId] || '';
}

/**
 * Check if a room type has a detailed prompt
 */
export function hasRoomPrompt(roomId: string): boolean {
	const normalizedId = roomId.toLowerCase().replace(/\s+/g, '-');
	return Object.prototype.hasOwnProperty.call(roomPrompts, normalizedId);
}
