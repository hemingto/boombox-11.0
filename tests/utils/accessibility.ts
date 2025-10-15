/**
 * @fileoverview Accessibility Testing Utilities
 * @description Comprehensive accessibility testing patterns and helpers
 */

import { axe, toHaveNoViolations } from 'jest-axe';
import { RenderResult } from '@testing-library/react';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

/**
 * Comprehensive accessibility test for any component
 * Tests for violations using axe-core
 */
export const testAccessibility = async (renderResult: RenderResult) => {
  const { container } = renderResult;
  const results = await axe(container);
  expect(results).toHaveNoViolations();
};

/**
 * Test accessibility with different states
 * Useful for components that have error, disabled, or loading states
 */
export const testAccessibilityWithStates = async (
  renderComponent: (props: any) => RenderResult,
  baseProps: any,
  states: Array<{ name: string; props: any }>
) => {
  for (const state of states) {
    const renderResult = renderComponent({ ...baseProps, ...state.props });
    const results = await axe(renderResult.container);
    expect(results).toHaveNoViolations();
  }
};

/**
 * Common accessibility test patterns
 */
export const accessibilityTestPatterns = {
  /**
   * Test form field accessibility
   */
  formField: async (renderResult: RenderResult, fieldRole: string = 'textbox') => {
    await testAccessibility(renderResult);
    
    const { getByRole } = renderResult;
    const field = getByRole(fieldRole);
    
    // Should have proper ARIA attributes
    expect(field).toHaveAttribute('aria-invalid');
    
    return field;
  },

  /**
   * Test button accessibility
   */
  button: async (renderResult: RenderResult, buttonName?: string | RegExp) => {
    await testAccessibility(renderResult);
    
    const { getByRole } = renderResult;
    const button = buttonName ? getByRole('button', { name: buttonName }) : getByRole('button');
    
    // Button should be focusable
    expect(button).toHaveAttribute('type');
    
    return button;
  },

  /**
   * Test interactive element accessibility
   */
  interactive: async (renderResult: RenderResult, role: string, name?: string | RegExp) => {
    await testAccessibility(renderResult);
    
    const { getByRole } = renderResult;
    const element = name ? getByRole(role, { name }) : getByRole(role);
    
    // Interactive elements should be focusable
    const tabIndex = element.getAttribute('tabindex');
    if (tabIndex !== null) {
      expect(parseInt(tabIndex)).toBeGreaterThanOrEqual(-1);
    }
    
    return element;
  },

  /**
   * Test component with error state
   */
  withError: async (renderResult: RenderResult, errorMessage: string) => {
    await testAccessibility(renderResult);
    
    const { getByText } = renderResult;
    const errorElement = getByText(errorMessage);
    
    // Error should have proper role
    expect(errorElement).toHaveAttribute('role', 'alert');
    
    return errorElement;
  },

  /**
   * Test component with loading state
   */
  withLoading: async (renderResult: RenderResult) => {
    await testAccessibility(renderResult);
    
    const { getByRole } = renderResult;
    
    // Should have loading indicator
    expect(() => getByRole('status')).not.toThrow();
    
    return getByRole('status');
  }
};

/**
 * Keyboard navigation testing helper
 */
export const testKeyboardNavigation = async (
  element: HTMLElement,
  keys: string[],
  expectedBehavior: () => void
) => {
  element.focus();
  expect(document.activeElement).toBe(element);
  
  for (const key of keys) {
    const event = new KeyboardEvent('keydown', { key });
    element.dispatchEvent(event);
  }
  
  expectedBehavior();
};

/**
 * Screen reader testing helper
 * Tests that important content is properly announced
 */
export const testScreenReaderContent = (renderResult: RenderResult, expectedAnnouncements: string[]) => {
  const { container } = renderResult;
  
  // Check for aria-live regions
  const liveRegions = container.querySelectorAll('[aria-live]');
  expect(liveRegions.length).toBeGreaterThan(0);
  
  // Check for proper labeling
  expectedAnnouncements.forEach(announcement => {
    expect(container).toHaveTextContent(announcement);
  });
};
