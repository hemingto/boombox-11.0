/**
 * @fileoverview Accessibility testing utilities
 * Jest + axe-core integration for automated a11y testing
 */

import { axe } from 'jest-axe';

// Define axe configuration interface
interface AxeConfig {
  rules?: Record<string, { enabled: boolean }>;
}

/**
 * Default axe configuration for Boombox testing
 */
const DEFAULT_AXE_CONFIG: AxeConfig = {
  rules: {
    // Enable all WCAG 2.1 AA rules
    'color-contrast': { enabled: true },
    'color-contrast-enhanced': { enabled: false }, // AAA level - optional
    'focus-order-semantics': { enabled: true },
    'hidden-content': { enabled: false }, // Allow hidden content for dropdowns, etc.
    'landmark-unique': { enabled: true },
    'page-has-heading-one': { enabled: true },
    'region': { enabled: true },
    'skip-link': { enabled: true },
    
    // Form accessibility
    'label': { enabled: true },
    'form-field-multiple-labels': { enabled: true },
    'duplicate-id-aria': { enabled: true },
    
    // Image accessibility
    'image-alt': { enabled: true },
    'image-redundant-alt': { enabled: true },
    
    // Keyboard accessibility
    'keyboard': { enabled: true },
    'focus-order': { enabled: true },
    'tabindex': { enabled: true },
  },
} as const;

/**
 * Test component for accessibility violations
 */
export async function testAccessibility(
  container: HTMLElement,
  config: AxeConfig = {}
) {
  const results = await axe(container, {
    ...DEFAULT_AXE_CONFIG,
    ...config,
  });
  
  expect(results).toHaveNoViolations();
  return results;
}

/**
 * Test form accessibility specifically
 */
export async function testFormAccessibility(container: HTMLElement) {
  return testAccessibility(container, {
    rules: {
      'label': { enabled: true },
      'form-field-multiple-labels': { enabled: true },
      'duplicate-id-aria': { enabled: true },
      'required-attr': { enabled: true },
      'aria-required-attr': { enabled: true },
    },
  });
}

/**
 * Test navigation accessibility
 */
export async function testNavigationAccessibility(container: HTMLElement) {
  return testAccessibility(container, {
    rules: {
      'landmark-unique': { enabled: true },
      'region': { enabled: true },
      'skip-link': { enabled: true },
      'focus-order': { enabled: true },
      'keyboard': { enabled: true },
    },
  });
}

/**
 * Test color contrast specifically
 */
export async function testColorContrast(container: HTMLElement) {
  return testAccessibility(container, {
    rules: {
      'color-contrast': { enabled: true },
    },
  });
}

/**
 * Accessibility testing helpers for common patterns
 */
export const a11yHelpers = {
  /**
   * Test button accessibility
   */
  async testButton(container: HTMLElement) {
    return testAccessibility(container, {
      rules: {
        'button-name': { enabled: true },
        'color-contrast': { enabled: true },
        'focus-order': { enabled: true },
        'keyboard': { enabled: true },
      },
    });
  },

  /**
   * Test link accessibility  
   */
  async testLink(container: HTMLElement) {
    return testAccessibility(container, {
      rules: {
        'link-name': { enabled: true },
        'color-contrast': { enabled: true },
        'focus-order': { enabled: true },
      },
    });
  },

  /**
   * Test input accessibility
   */
  async testInput(container: HTMLElement) {
    return testFormAccessibility(container);
  },

  /**
   * Test modal/dialog accessibility
   */
  async testModal(container: HTMLElement) {
    return testAccessibility(container, {
      rules: {
        'focus-trap': { enabled: true },
        'aria-dialog-name': { enabled: true },
        'focus-order': { enabled: true },
        'keyboard': { enabled: true },
      },
    });
  },

  /**
   * Test table accessibility
   */
  async testTable(container: HTMLElement) {
    return testAccessibility(container, {
      rules: {
        'table-fake-caption': { enabled: true },
        'td-headers-attr': { enabled: true },
        'th-has-data-cells': { enabled: true },
        'scope-attr-valid': { enabled: true },
      },
    });
  },
};

// Define interfaces for accessibility results
interface AxeViolation {
  id: string;
  impact: string;
  description: string;
  help: string;
  helpUrl: string;
  nodes: { length: number };
}

interface AxeResults {
  violations: AxeViolation[];
  passes: AxeViolation[];
  incomplete: AxeViolation[];
}

/**
 * Generate accessibility test report
 */
export function generateA11yReport(results: AxeResults) {
  const { violations, passes, incomplete } = results;
  
  return {
    summary: {
      violations: violations.length,
      passes: passes.length,
      incomplete: incomplete.length,
      total: violations.length + passes.length + incomplete.length,
    },
    violations: violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      nodes: violation.nodes.length,
    })),
    recommendations: generateRecommendations(violations),
  };
}

/**
 * Generate accessibility recommendations
 */
function generateRecommendations(violations: AxeViolation[]): string[] {
  const recommendations: string[] = [];
  
  violations.forEach(violation => {
    switch (violation.id) {
      case 'color-contrast':
        recommendations.push('Increase color contrast to meet WCAG AA standards (4.5:1 ratio)');
        break;
      case 'label':
        recommendations.push('Add proper labels to form controls for screen reader accessibility');
        break;
      case 'button-name':
        recommendations.push('Ensure all buttons have accessible names (text content or aria-label)');
        break;
      case 'link-name':
        recommendations.push('Ensure all links have descriptive text or aria-labels');
        break;
      case 'image-alt':
        recommendations.push('Add meaningful alt text to images for screen readers');
        break;
      case 'keyboard':
        recommendations.push('Ensure all interactive elements are keyboard accessible');
        break;
      case 'focus-order':
        recommendations.push('Fix focus order to follow logical page structure');
        break;
      case 'landmark-unique':
        recommendations.push('Ensure landmark elements have unique accessible names');
        break;
      default:
        recommendations.push(`Address ${violation.id}: ${violation.help}`);
    }
  });
  
  return [...new Set(recommendations)]; // Remove duplicates
} 