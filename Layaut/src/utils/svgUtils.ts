
/**
 * Helper function to strip outer svg tags and extract inner content
 * This removes <svg ...> and </svg> tags, keeping only the inner shapes/paths
 */
export const stripSvgTags = (svgContent: string): string => {
    // Remove outer <svg> and </svg> tags, keeping the inner content
    const svgMatch = svgContent.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
    if (svgMatch && svgMatch[1]) {
        return svgMatch[1].trim();
    }
    // Specific check if the content starts with an svg tag but match failed (e.g. multiline specific issues)
    // or if it's already stripped, just return it.
    // Basic fallback: remove <svg...> and </svg>
    return svgContent.replace(/<svg[^>]*>/i, '').replace(/<\/svg>/i, '').trim();
};

/**
 * Helper function to extract viewBox from svg content
 * Tries to find viewBox attribute in the root svg tag
 */
export const extractViewBox = (svgContent: string): string | null => {
    const match = svgContent.match(/viewBox=["']([^"']+)["']/i);
    return match ? match[1] : null;
};
