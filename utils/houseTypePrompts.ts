/**
 * House type-specific prompt details for exterior design
 * Each house type has specific architectural elements and features
 */

export const houseTypePrompts: { [key: string]: string } = {
	house: `single-family home exterior, residential house facade with distinct architectural style, 
		front entrance with door and surrounding details, windows arranged for facade symmetry, 
		roofing visible (pitched roof, gables, dormers, or flat roof depending on style), 
		landscaping around the foundation including garden beds, walkways, or driveways, 
		architectural features like columns, porches, verandas, or architectural trim, 
		building materials appropriate to style (siding, brick, stone, stucco, wood), 
		garage or carport if visible in front facade, architectural details that define the style, 
		professional exterior photography showing front elevation with proper scale and depth`,

	apartment: `multi-unit residential building exterior, apartment complex facade, 
		multiple windows arranged in vertical columns, balconies or terraces, 
		entrance areas with doorways, architectural details like cornices or decorative elements, 
		modern or traditional building materials (brick, concrete, stucco, or glass), 
		coordinated window treatments and frames, building signage or numbering, 
		landscaped entry areas, parking or access areas visible, 
		professional architectural photography perspective showing building facade`,

	villa: `luxury villa exterior, large detached residential home with sophisticated architectural design, 
		grand entrance with prominent door and surrounding architectural details, 
		expansive facade with well-proportioned windows and architectural elements, 
		high-quality building materials including stone, stucco, or premium siding, 
		formal landscaping with mature gardens and pathways, 
		architectural features like columns, porticos, terraces, or balconies, 
		multi-level design with varied rooflines and gables, 
		luxurious and prestigious appearance, well-maintained exterior with elegant details, 
		professional architectural photography showing grandeur and scale`,

	townhouse: `townhouse exterior, multi-story attached residential building, 
		narrow but tall facade with multiple floors visible, 
		vertical arrangement of windows creating sense of height, 
		staircase or entry area leading to main entrance, 
		consistent facade design shared with neighboring units, 
		architectural details appropriate to style and era, 
		building materials like brick, stone, or siding, 
		small front garden or landscaping area, 
		urban residential architectural character, 
		professional exterior photography showing complete facade elevation`,

	cottage: `charming cottage exterior, small rural or country home with cozy character, 
		picturesque and inviting facade with rustic architectural details, 
		steep pitched roof with gables or dormer windows, 
		informal landscaping with cottage-style gardens, 
		traditional building materials like wood, stone, or brick, 
		small-scale architectural elements with decorative details, 
		warm and welcoming appearance, natural and unpretentious aesthetic, 
		country or countryside setting implied in design, 
		professional architectural photography showing charming exterior character`,

	mansion: `grand mansion exterior, large prestigious estate home, 
		imposing facade with multiple architectural elements and wings, 
		formal entrance with elaborate architectural details, 
		extensive use of high-end materials like stone, marble, or premium brick, 
		formal symmetrical facade design, classical architectural features, 
		landscaped grounds with mature trees and formal gardens, 
		architectural details like columns, cornices, pediments, or balustrades, 
		luxurious and opulent appearance, historical or classical architectural influences, 
		professional architectural photography showing the grandeur and stately presence`,

	'office-building': `commercial office building exterior, professional commercial architecture, 
		large-scale building facade with multiple floors, extensive glazing and windows, 
		modern or traditional commercial architectural elements, 
		building entrance with prominent doors and surrounding architectural features, 
		exterior materials like curtain walls, precast concrete, glass, metal panels, or stone, 
		signage placement for business identification, lighting fixtures visible on exterior, 
		surrounding context including parking, landscaping, plazas, or pedestrian areas, 
		architectural details like louvers, sunshades, or decorative panels, 
		professional commercial photography perspective showing building facade and context`,

	'retail-building': `commercial retail building exterior, shop or storefront facade, 
		visible windows displaying merchandise or interior activity, 
		entrance designed to attract customers with prominent doors, 
		commercial signage and branding visible on exterior, 
		storefront architectural style appropriate to business type, 
		exterior materials suitable for commercial retail use, 
		display windows with clear visibility into interior, 
		street-level commercial architectural character, 
		professional signage placement and building identification, 
		professional exterior photography showing commercial retail facade and context`,
};

/**
 * Get the detailed prompt for a specific house type
 */
export function getHouseTypePrompt(houseTypeId: string): string {
	// Normalize the house type ID (lowercase, replace spaces with hyphens)
	const normalizedId = houseTypeId.toLowerCase().replace(/\s+/g, '-');
	return houseTypePrompts[normalizedId] || '';
}

/**
 * Check if a house type has a detailed prompt
 */
export function hasHouseTypePrompt(houseTypeId: string): boolean {
	const normalizedId = houseTypeId.toLowerCase().replace(/\s+/g, '-');
	return Object.prototype.hasOwnProperty.call(houseTypePrompts, normalizedId);
}
