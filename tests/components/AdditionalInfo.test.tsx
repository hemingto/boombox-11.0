/**
 * @fileoverview Comprehensive tests for AdditionalInfo primitive component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdditionalInfo } from '@/components/ui/primitives/AdditionalInfo';

describe('AdditionalInfo', () => {
  const defaultProps = {
    text: 'This is some additional information'
  };

  describe('Rendering', () => {
    it('renders with required text prop', () => {
      render(<AdditionalInfo {...defaultProps} />);
      
      expect(screen.getByText(defaultProps.text)).toBeInTheDocument();
    });

    it('renders with correct semantic HTML structure', () => {
      render(<AdditionalInfo {...defaultProps} />);
      
      const container = screen.getByRole('note');
      const textElement = screen.getByText(defaultProps.text);
      
      expect(container).toBeInTheDocument();
      expect(textElement.tagName).toBe('P');
    });

    it('applies correct CSS classes for design system compliance', () => {
      render(<AdditionalInfo {...defaultProps} />);
      
      const container = screen.getByRole('note');
      
      expect(container).toHaveClass(
        'mt-4',
        'p-3',
        'sm:mb-4',
        'mb-2',
        'bg-surface-primary',
        'border',
        'border-border',
        'rounded-md',
        'max-w-fit'
      );
    });

    it('applies correct text styling classes', () => {
      render(<AdditionalInfo {...defaultProps} />);
      
      const textElement = screen.getByText(defaultProps.text);
      
      expect(textElement).toHaveClass('text-xs', 'text-text-tertiary');
    });
  });

  describe('Props handling', () => {
    it('accepts and applies custom className', () => {
      const customClass = 'custom-test-class';
      render(<AdditionalInfo {...defaultProps} className={customClass} />);
      
      const container = screen.getByRole('note');
      expect(container).toHaveClass(customClass);
    });

    it('accepts and applies custom id', () => {
      const customId = 'test-additional-info';
      render(<AdditionalInfo {...defaultProps} id={customId} />);
      
      const container = screen.getByRole('note');
      expect(container).toHaveAttribute('id', customId);
    });

    it('handles different text content', () => {
      const longText = 'This is a much longer piece of additional information that provides more context about the current form or section of the application.';
      render(<AdditionalInfo text={longText} />);
      
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('handles empty text gracefully', () => {
      render(<AdditionalInfo text="" />);
      
      const container = screen.getByRole('note');
      expect(container).toBeInTheDocument();
      expect(container.querySelector('p')).toHaveTextContent('');
    });
  });

  describe('Accessibility', () => {
    it('has correct ARIA role', () => {
      render(<AdditionalInfo {...defaultProps} />);
      
      expect(screen.getByRole('note')).toBeInTheDocument();
    });

    it('has default aria-label using text content', () => {
      render(<AdditionalInfo {...defaultProps} />);
      
      const container = screen.getByRole('note');
      expect(container).toHaveAttribute('aria-label', defaultProps.text);
    });

    it('accepts custom aria-label', () => {
      const customAriaLabel = 'Custom accessibility label';
      render(<AdditionalInfo {...defaultProps} aria-label={customAriaLabel} />);
      
      const container = screen.getByRole('note');
      expect(container).toHaveAttribute('aria-label', customAriaLabel);
    });

    it('has aria-live attribute for dynamic content updates', () => {
      render(<AdditionalInfo {...defaultProps} />);
      
      const container = screen.getByRole('note');
      expect(container).toHaveAttribute('aria-live', 'polite');
    });

    it('is accessible to screen readers', () => {
      render(<AdditionalInfo {...defaultProps} />);
      
      const container = screen.getByRole('note');
      
      // Verify the component is discoverable by assistive technology
      expect(container).toBeVisible();
      expect(container).not.toHaveAttribute('aria-hidden');
    });
  });

  describe('Design System Integration', () => {
    it('uses semantic color tokens from design system', () => {
      render(<AdditionalInfo {...defaultProps} />);
      
      const container = screen.getByRole('note');
      const textElement = screen.getByText(defaultProps.text);
      
      // Check for design system color classes
      expect(container).toHaveClass('bg-surface-primary', 'border-border');
      expect(textElement).toHaveClass('text-text-tertiary');
    });

    it('maintains responsive design patterns', () => {
      render(<AdditionalInfo {...defaultProps} />);
      
      const container = screen.getByRole('note');
      
      // Check for responsive margin classes
      expect(container).toHaveClass('sm:mb-4', 'mb-2');
    });

    it('follows consistent spacing patterns', () => {
      render(<AdditionalInfo {...defaultProps} />);
      
      const container = screen.getByRole('note');
      
      // Check for consistent padding and margin
      expect(container).toHaveClass('mt-4', 'p-3');
    });
  });

  describe('TypeScript Integration', () => {
    it('accepts all required props', () => {
      // This test ensures TypeScript compilation succeeds with required props
      expect(() => render(<AdditionalInfo text="Test" />)).not.toThrow();
    });

    it('accepts all optional props', () => {
      // This test ensures TypeScript compilation succeeds with optional props
      expect(() => render(
        <AdditionalInfo 
          text="Test"
          className="custom-class"
          id="test-id"
          aria-label="Custom label"
        />
      )).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('renders quickly with minimal DOM nodes', () => {
      const { container } = render(<AdditionalInfo {...defaultProps} />);
      
      // Should create minimal DOM structure
      const allElements = container.querySelectorAll('*');
      expect(allElements.length).toBeLessThanOrEqual(3); // container, div, p
    });

    it('handles re-renders efficiently', () => {
      const { rerender } = render(<AdditionalInfo text="First text" />);
      
      expect(screen.getByText('First text')).toBeInTheDocument();
      
      rerender(<AdditionalInfo text="Second text" />);
      
      expect(screen.getByText('Second text')).toBeInTheDocument();
      expect(screen.queryByText('First text')).not.toBeInTheDocument();
    });
  });
});
