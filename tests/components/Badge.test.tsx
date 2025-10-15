/**
 * @fileoverview Jest tests for Badge component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { Badge } from '@/components/ui/primitives/Badge';

describe('Badge Component', () => {
  describe('Basic Rendering', () => {
    it('renders with required label prop', () => {
      render(<Badge label="Test Badge" />);
      
      expect(screen.getByText('Test Badge')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('applies default variant and size classes', () => {
      render(<Badge label="Default" />);
      
      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('bg-surface-tertiary', 'text-text-primary');
      expect(badge).toHaveClass('px-4', 'py-2', 'text-sm'); // medium size
    });

    it('renders with custom className', () => {
      render(<Badge label="Custom" className="custom-class" />);
      
      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('custom-class');
    });
  });

  describe('Variants', () => {
    it.each([
      ['success', 'badge-success'],
      ['warning', 'badge-warning'],
      ['error', 'badge-error'],
      ['info', 'badge-info'],
      ['pending', 'badge-pending'],
      ['processing', 'badge-processing'],
    ])('applies correct class for %s variant', (variant, expectedClass) => {
      render(<Badge label="Test" variant={variant as any} />);
      
      const badge = screen.getByRole('status');
      expect(badge).toHaveClass(expectedClass);
    });
  });

  describe('Sizes', () => {
    it.each([
      ['sm', ['px-2', 'py-1', 'text-xs']],
      ['md', ['px-4', 'py-2', 'text-sm']],
      ['lg', ['px-6', 'py-3', 'text-base']],
    ])('applies correct classes for %s size', (size, expectedClasses) => {
      render(<Badge label="Test" size={size as any} />);
      
      const badge = screen.getByRole('status');
      expectedClasses.forEach(className => {
        expect(badge).toHaveClass(className);
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper aria-label with default variant', () => {
      render(<Badge label="Test Label" />);
      
      const badge = screen.getByRole('status');
      expect(badge).toHaveAttribute('aria-label', 'badge: Test Label');
    });

    it('has proper aria-label with semantic variant', () => {
      render(<Badge label="Success Message" variant="success" />);
      
      const badge = screen.getByRole('status');
      expect(badge).toHaveAttribute('aria-label', 'success: Success Message');
    });

    it('applies role="status" for screen readers', () => {
      render(<Badge label="Status" />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Text Truncation', () => {
    it('applies truncation classes to label span', () => {
      render(<Badge label="Very long text that should be truncated" />);
      
      const textSpan = screen.getByText('Very long text that should be truncated');
      expect(textSpan).toHaveClass('truncate', 'whitespace-nowrap', 'text-ellipsis');
    });
  });



  describe('Event Handling', () => {
    it('forwards click events to badge element', () => {
      const onClick = jest.fn();
      render(<Badge label="Clickable" onClick={onClick} />);
      
      const badge = screen.getByRole('status');
      fireEvent.click(badge);
      
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('forwards other HTML attributes', () => {
      render(<Badge label="Test" data-testid="badge-test" id="badge-1" />);
      
      const badge = screen.getByRole('status');
      expect(badge).toHaveAttribute('data-testid', 'badge-test');
      expect(badge).toHaveAttribute('id', 'badge-1');
    });
  });
});
