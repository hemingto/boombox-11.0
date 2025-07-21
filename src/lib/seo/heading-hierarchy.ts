/**
 * @fileoverview Heading hierarchy utilities for SEO and accessibility
 * Ensures proper H1-H6 structure throughout the application
 */

export type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

/**
 * Heading hierarchy configuration for different page types
 */
export const HEADING_HIERARCHY = {
  // Landing page structure
  homepage: {
    h1: 'Main value proposition', // e.g., "Mobile Storage & Moving Services in San Francisco"
    h2: 'Service sections',       // e.g., "How It Works", "Our Services", "Why Choose Us"
    h3: 'Service details',        // e.g., "Storage Units", "Packing Supplies"
    h4: 'Feature benefits',       // e.g., "Secure Storage", "Climate Controlled"
  },
  
  // Service pages structure  
  service: {
    h1: 'Service name + location', // e.g., "Mobile Storage Units in San Francisco"
    h2: 'Service sections',        // e.g., "Features", "Pricing", "How to Order"
    h3: 'Service details',         // e.g., "Storage Unit Sizes", "Security Features"
    h4: 'Specific features',       // e.g., "24/7 Access", "Climate Control"
  },
  
  // Location pages structure
  location: {
    h1: 'Services + location',     // e.g., "Storage & Moving Services in Oakland, CA"
    h2: 'Service categories',      // e.g., "Storage Solutions", "Moving Services"
    h3: 'Specific services',       // e.g., "Residential Storage", "Commercial Moving"
    h4: 'Service features',        // e.g., "Same-Day Delivery", "Professional Packing"
  },
  
  // Dashboard/app pages structure
  dashboard: {
    h1: 'Page title',             // e.g., "Customer Dashboard", "Order Management"
    h2: 'Main sections',          // e.g., "Active Orders", "Order History"
    h3: 'Subsections',            // e.g., "Storage Units", "Upcoming Deliveries"
    h4: 'Detail sections',        // e.g., "Unit Details", "Payment Information"
  },
} as const;

/**
 * Validate heading hierarchy for a page
 * Ensures proper semantic structure: H1 -> H2 -> H3, etc.
 */
export function validateHeadingHierarchy(headings: Array<{ level: HeadingLevel; text: string }>) {
  const issues: string[] = [];
  let currentLevel = 0;
  
  // Check for H1 presence
  const h1Count = headings.filter(h => h.level === 'h1').length;
  if (h1Count === 0) {
    issues.push('Missing H1 - every page should have exactly one H1');
  } else if (h1Count > 1) {
    issues.push(`Multiple H1s found (${h1Count}) - should have exactly one H1 per page`);
  }
  
  // Check heading sequence
  headings.forEach((heading, index) => {
    const level = parseInt(heading.level.replace('h', ''));
    
    if (index === 0 && level !== 1) {
      issues.push(`First heading should be H1, found ${heading.level.toUpperCase()}`);
    }
    
    if (level > currentLevel + 1) {
      issues.push(`Heading level skip: ${heading.level.toUpperCase()} after H${currentLevel} - should not skip levels`);
    }
    
    currentLevel = Math.max(currentLevel, level);
  });
  
  return {
    isValid: issues.length === 0,
    issues,
    suggestions: generateHeadingSuggestions(headings),
  };
}

/**
 * Generate suggestions for improving heading hierarchy
 */
function generateHeadingSuggestions(headings: Array<{ level: HeadingLevel; text: string }>) {
  const suggestions: string[] = [];
  
  // Suggest SEO improvements
  const h1 = headings.find(h => h.level === 'h1');
  if (h1) {
    if (h1.text.length < 20) {
      suggestions.push('H1 is quite short - consider adding location or service details for better SEO');
    }
    if (h1.text.length > 60) {
      suggestions.push('H1 is quite long - consider shortening for better readability');
    }
    if (!h1.text.toLowerCase().includes('san francisco') && !h1.text.toLowerCase().includes('bay area')) {
      suggestions.push('Consider including location in H1 for better local SEO');
    }
  }
  
  // Check for descriptive headings
  const genericHeadings = ['About', 'Services', 'Contact', 'More'];
  headings.forEach(heading => {
    if (genericHeadings.some(generic => heading.text.toLowerCase().includes(generic.toLowerCase()))) {
      suggestions.push(`Consider making "${heading.text}" more specific and descriptive`);
    }
  });
  
  return suggestions;
}

/**
 * Generate SEO-optimized heading text
 */
export function generateSEOHeading(config: {
  service?: string;
  location?: string;
  action?: string;
  level: HeadingLevel;
}): string {
  const { service, location, action, level } = config;
  
  // H1 should be most comprehensive
  if (level === 'h1') {
    const parts = [
      action || 'Professional',
      service || 'Storage & Moving Services',
      location ? `in ${location}` : 'in San Francisco Bay Area'
    ];
    return parts.join(' ');
  }
  
  // H2-H6 can be more specific
  const parts = [action, service, location].filter(Boolean);
  return parts.join(' ');
}

/**
 * Create semantic heading component props
 */
export function createHeadingProps(
  level: HeadingLevel,
  text: string,
  options: {
    id?: string;
    className?: string;
    ariaLabel?: string;
  } = {}
) {
  const { id, className = '', ariaLabel } = options;
  
  // Generate ID from text if not provided
  const headingId = id || text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
  
  return {
    as: level,
    id: headingId,
    className: `${getHeadingStyles(level)} ${className}`.trim(),
    'aria-label': ariaLabel,
    tabIndex: -1, // Allow programmatic focus for skip links
  };
}

/**
 * Get consistent styling for heading levels
 */
function getHeadingStyles(level: HeadingLevel): string {
  const styles = {
    h1: 'text-4xl font-bold text-text-primary',
    h2: 'text-3xl font-bold text-text-primary',
    h3: 'text-2xl font-semibold text-text-primary',
    h4: 'text-xl font-semibold text-text-primary',
    h5: 'text-lg font-medium text-text-primary',
    h6: 'text-base font-medium text-text-primary',
  };
  
  return styles[level];
}

/**
 * Skip link utility for accessibility
 */
export function generateSkipLinks(headings: Array<{ level: HeadingLevel; text: string; id: string }>) {
  return headings
    .filter(h => ['h2', 'h3'].includes(h.level)) // Only major sections
    .map(h => ({
      href: `#${h.id}`,
      text: `Skip to ${h.text}`,
    }));
} 