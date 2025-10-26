// Detailed prompt descriptions for each interior design style
// These descriptions help the AI generate more accurate style-specific imagery

export const STYLE_PROMPTS: Record<string, string> = {
	modern: `clean lines, minimalist furniture, neutral color palette with white, grey, and black, 
		sleek surfaces, glossy finishes, geometric shapes, open floor plan, minimal ornamentation, 
		functional design, contemporary lighting, polished metal accents, glass elements, 
		uncluttered space, geometric patterns, emphasis on horizontal and vertical lines`,

	bohemian: `eclectic mix of patterns and textures, layered textiles, vintage rugs, 
		macrame wall hangings, plants and greenery, warm earthy tones with pops of vibrant colors, 
		natural materials like rattan and wicker, floor cushions, tapestries, ethnic prints, 
		global-inspired decor, artistic wall art, cozy and lived-in feel, mixed furniture styles, 
		colorful throw pillows, hanging plants, natural wood tones`,

	'dark-academia': `rich dark wood furniture, leather armchairs, vintage bookshelves filled with books, 
		antique brass lamps, deep jewel tones like burgundy, forest green, and navy, 
		classical artwork, oil paintings in ornate frames, globe and vintage maps, 
		Persian rugs, velvet upholstery, wood paneling, scholarly atmosphere, dim warm lighting, 
		gothic architectural elements, vintage study aesthetic, intellectual ambiance, 
		traditional crown molding, heavy curtains`,

	'dark-behemian': `moody color palette with deep purples, blacks, and dark greens, 
		velvet and rich textured fabrics, dramatic wall art, mystical decor elements, 
		eclectic vintage furniture, dark patterned rugs, gothic-inspired accessories, 
		candlelight and warm ambient lighting, macrame in dark tones, dried flowers, 
		antique mirrors, layered textiles in deep hues, natural elements with dark wood, 
		mysterious and enchanting atmosphere`,

	scandinavian: `light wood floors, white walls, minimal furniture with clean lines, 
		hygge atmosphere, natural light emphasis, pale color palette with whites and light grays, 
		functional Scandinavian furniture, cozy textiles like wool throws, 
		simple pendant lighting, plants as accents, decluttered space, natural materials, 
		blonde wood tones, geometric patterns in soft colors, airy and bright feel, 
		emphasis on functionality and simplicity, muted pastel accents`,

	industrial: `exposed brick walls, concrete floors, metal fixtures and pipes, 
		edison bulb lighting, weathered wood elements, open ductwork, steel beams, 
		factory-style windows, utilitarian furniture, leather seating, metal stools, 
		neutral color palette with grays and browns, unfinished surfaces, 
		repurposed industrial items, minimalist decor, raw materials, 
		warehouse aesthetic, metal shelving units, distressed finishes`,

	traditional: `classic furniture with ornate details, rich wood tones, 
		elegant upholstered pieces, damask and floral patterns, crystal chandeliers, 
		crown molding and wainscoting, formal arrangement, symmetrical layouts, 
		antique accessories, oriental rugs, warm color palette, 
		traditional artwork in gold frames, table lamps with fabric shades, 
		luxurious draperies, timeless elegance, carved wood details, 
		balanced and cohesive design`,

	minimalist: `stark white walls, extremely minimal furniture, no clutter, 
		monochromatic color scheme, essential items only, clean surfaces, 
		hidden storage solutions, simple geometric forms, negative space emphasis, 
		functional pieces with no ornamentation, bare windows or simple blinds, 
		quality over quantity, zen-like atmosphere, natural light, 
		subtle textures, neutral tones, sleek and unadorned aesthetic`,

	rustic: `reclaimed wood furniture, natural stone elements, exposed wooden beams, 
		cozy fireplace, warm earth tones, vintage farmhouse pieces, 
		natural fiber textiles like burlap and linen, wrought iron accents, 
		distressed finishes, handcrafted items, organic shapes, 
		warm ambient lighting, nature-inspired decor, wooden floors, 
		comfortable overstuffed seating, natural materials throughout, 
		casual and inviting atmosphere`,

	contemporary: `current design trends, mix of modern and traditional elements, 
		curved furniture lines, bold accent colors, artistic lighting fixtures, 
		variety of textures, geometric patterns, neutral base with color pops, 
		innovative materials, sculptural elements, asymmetrical balance, 
		open concept layout, statement pieces, glass and metal accents, 
		sophisticated and current aesthetic, attention to architecture`,

	tropical: `natural woven furniture like rattan and bamboo, lush indoor plants, 
		palm leaf prints, bright tropical colors like turquoise and coral, 
		light and airy fabrics, bamboo blinds, wicker accents, 
		tropical leaf wallpaper or art, natural light, beach-inspired decor, 
		coastal elements, white and natural wood tones, relaxed atmosphere, 
		outdoor-indoor connection, botanical prints, casual seating`,

	'art-deco': `geometric patterns and bold symmetry, luxurious materials like marble and brass, 
		rich jewel tones like emerald and sapphire, metallic accents in gold and chrome, 
		glamorous mirrors with geometric frames, velvet upholstery, 
		stepped forms and ziggurat shapes, sunburst motifs, lacquered furniture, 
		high contrast color schemes, sophisticated and elegant, 
		angular furniture, decorative screens, stylized floral patterns, 
		opulent and dramatic aesthetic`,

	'modern-farmhouse': `shiplap walls, barn doors, rustic wood beams mixed with modern furniture, 
		white or neutral color palette, industrial metal fixtures, 
		farmhouse sink, open shelving, vintage-inspired lighting, 
		clean lines with rustic textures, comfortable upholstered furniture, 
		natural materials, wooden accents, simple window treatments, 
		fresh and updated country style, mix of old and new, 
		cozy yet refined atmosphere`,

	coastal: `light blue and white color scheme, natural textures like jute and rope, 
		driftwood accents, nautical decor elements, striped patterns, 
		weathered wood furniture, sea-inspired artwork, 
		large windows with sheer curtains, bright and airy feel, 
		coral and seashell decorations, light linens, wicker furniture, 
		relaxed beach house vibe, soft sandy neutrals, ocean-inspired palette`,

	japandi: `Japanese minimalism meets Scandinavian functionality, 
		natural wood in light and medium tones, clean lines, 
		neutral color palette with warm undertones, wabi-sabi aesthetic, 
		low-profile furniture, rice paper screens or shoji-inspired elements, 
		minimal ornamentation, natural materials, zen atmosphere, 
		quality craftsmanship, subtle textures, perfect balance, 
		clutter-free space, organic shapes, handmade ceramics, 
		harmonious and peaceful design`,

	'french-country': `distressed furniture with antique finish, soft pastel colors, 
		toile patterns, floral prints, wrought iron accents, 
		rustic wooden beams, farmhouse table, upholstered chairs, 
		vintage accessories, copper cookware, open shelving with displayed dishware, 
		romantic and charming aesthetic, natural stone elements, 
		linen fabrics, chandeliers, country elegance, warm and inviting`,

	'shabby-chic': `distressed white furniture, vintage pieces with worn finishes, 
		soft pastel colors like blush pink and mint, 
		romantic floral patterns, ruffled fabrics, 
		vintage mirrors and frames, crystal chandeliers, 
		feminine and delicate aesthetic, lace accents, 
		repurposed vintage items, chippy paint finishes, 
		comfortable overstuffed seating, roses and botanical prints, 
		cottage-style charm, soft and dreamy atmosphere`,

	transitional: `blend of traditional and contemporary styles, 
		neutral color palette with strategic color accents, 
		mix of curved and straight lines, classic furniture with modern updates, 
		timeless elegance, minimal accessories, 
		comfortable and sophisticated, quality fabrics, 
		balanced proportions, subtle patterns, 
		refined yet relaxed atmosphere, versatile design elements, 
		understated luxury, clean upholstery with traditional shapes`,
};

// Helper function to get style-specific prompt enhancement
export function getStylePrompt(styleId: string): string {
	return STYLE_PROMPTS[styleId] || STYLE_PROMPTS['modern'];
}

// Helper function to check if a style has a detailed prompt
export function hasStylePrompt(styleId: string): boolean {
	return styleId in STYLE_PROMPTS;
}
