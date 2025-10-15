/**
 * @fileoverview Comprehensive Jest tests for CheckboxCard component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { CheckboxCard, type CheckboxCardProps } from '@/components/ui/primitives/CheckboxCard';

// Mock the cn utility
jest.mock('@/lib/utils/cn', () => ({
  cn: (...classes: (string | undefined | boolean | Record<string, boolean>)[]) => {
    return classes
      .filter(Boolean)
      .map(cls => {
        if (typeof cls === 'object') {
          return Object.entries(cls)
            .filter(([, value]) => value)
            .map(([key]) => key)
            .join(' ');
        }
        return cls;
      })
      .join(' ');
  },
}));

describe('CheckboxCard', () => {
  const defaultProps: CheckboxCardProps = {
    id: 'test-card',
    title: 'Test Plan',
    titleDescription: 'Test description',
    description: 'Additional test description',
    plan: '$299/month',
    checked: false,
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with all required props', () => {
      render(<CheckboxCard {...defaultProps} />);
      
      expect(screen.getByText('Test Plan')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
      expect(screen.getByText('Additional test description')).toBeInTheDocument();
      expect(screen.getByText('$299/month')).toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
      const { container } = render(
        <CheckboxCard {...defaultProps} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('sets custom test ID when provided', () => {
      render(<CheckboxCard {...defaultProps} testId="custom-test-id" />);
      
      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
    });

    it('generates proper element IDs based on component ID', () => {
      render(<CheckboxCard {...defaultProps} id="my-card" />);
      
      expect(screen.getByRole('radio')).toHaveAttribute('aria-labelledby', 'my-card-title');
      expect(screen.getByRole('radio')).toHaveAttribute('aria-describedby', 'my-card-description my-card-plan');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<CheckboxCard {...defaultProps} />);
      
      const card = screen.getByRole('radio');
      expect(card).toHaveAttribute('aria-checked', 'false');
      expect(card).toHaveAttribute('tabIndex', '0');
      expect(card).toHaveAttribute('aria-invalid', 'false');
    });

    it('updates aria-checked when checked prop changes', () => {
      const { rerender } = render(<CheckboxCard {...defaultProps} checked={false} />);
      
      expect(screen.getByRole('radio')).toHaveAttribute('aria-checked', 'false');
      
      rerender(<CheckboxCard {...defaultProps} checked={true} />);
      
      expect(screen.getByRole('radio')).toHaveAttribute('aria-checked', 'true');
    });

    it('sets aria-invalid when hasError is true', () => {
      render(<CheckboxCard {...defaultProps} hasError={true} />);
      
      expect(screen.getByRole('radio')).toHaveAttribute('aria-invalid', 'true');
    });

    it('uses custom ariaLabel when provided', () => {
      const customLabel = 'Custom accessibility label';
      render(<CheckboxCard {...defaultProps} ariaLabel={customLabel} />);
      
      expect(screen.getByRole('radio')).toHaveAttribute('aria-label', customLabel);
    });

    it('removes from tab order when disabled', () => {
      render(<CheckboxCard {...defaultProps} disabled={true} />);
      
      expect(screen.getByRole('radio')).toHaveAttribute('tabIndex', '-1');
    });

    it('includes screen reader status text', () => {
      const { rerender } = render(<CheckboxCard {...defaultProps} checked={false} />);
      
      expect(screen.getByText('Not selected')).toHaveClass('sr-only');
      
      rerender(<CheckboxCard {...defaultProps} checked={true} />);
      
      expect(screen.getByText('Selected')).toHaveClass('sr-only');
    });

    it('announces disabled state to screen readers', () => {
      render(<CheckboxCard {...defaultProps} disabled={true} />);
      
      expect(screen.getByText('Not selected (disabled)')).toHaveClass('sr-only');
    });

    it('announces error state to screen readers', () => {
      render(<CheckboxCard {...defaultProps} hasError={true} />);
      
      expect(screen.getByText(/^Error:/)).toHaveClass('sr-only');
    });
  });

  describe('Visual States', () => {
    it('applies checked styles when checked', () => {
      render(<CheckboxCard {...defaultProps} checked={true} />);
      
      const card = screen.getByRole('radio');
      expect(card).toHaveClass('ring-primary', 'ring-2', 'bg-surface-primary');
    });

    it('applies error styles when hasError is true', () => {
      render(<CheckboxCard {...defaultProps} hasError={true} />);
      
      const card = screen.getByRole('radio');
      expect(card).toHaveClass('ring-status-error', 'bg-status-bg-error');
    });

    it('applies disabled styles when disabled', () => {
      render(<CheckboxCard {...defaultProps} disabled={true} />);
      
      const card = screen.getByRole('radio');
      expect(card).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('prioritizes error styles over checked styles', () => {
      render(<CheckboxCard {...defaultProps} checked={true} hasError={true} />);
      
      const card = screen.getByRole('radio');
      expect(card).toHaveClass('ring-status-error', 'bg-status-bg-error');
      expect(card).not.toHaveClass('ring-primary');
    });

    it('shows checkbox indicator when checked and no error', () => {
      render(<CheckboxCard {...defaultProps} checked={true} hasError={false} />);
      
      // Look for the inner white dot that appears when checked
      const checkbox = screen.getByRole('radio').querySelector('.bg-surface-primary');
      expect(checkbox).toBeInTheDocument();
    });

    it('does not show checkbox indicator when error state', () => {
      render(<CheckboxCard {...defaultProps} checked={true} hasError={true} />);
      
      // Should not have the inner white dot when in error state
      const checkbox = screen.getByRole('radio').querySelector('.bg-surface-primary');
      expect(checkbox).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onChange when clicked', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      
      render(<CheckboxCard {...defaultProps} onChange={handleChange} />);
      
      await user.click(screen.getByRole('radio'));
      
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('calls onChange when activated with Space key', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      
      render(<CheckboxCard {...defaultProps} onChange={handleChange} />);
      
      const card = screen.getByRole('radio');
      card.focus();
      await user.keyboard(' ');
      
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('calls onChange when activated with Enter key', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      
      render(<CheckboxCard {...defaultProps} onChange={handleChange} />);
      
      const card = screen.getByRole('radio');
      card.focus();
      await user.keyboard('{Enter}');
      
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('does not call onChange when disabled and clicked', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      
      render(<CheckboxCard {...defaultProps} disabled={true} onChange={handleChange} />);
      
      await user.click(screen.getByRole('radio'));
      
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('does not call onChange when disabled and keyboard activated', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      
      render(<CheckboxCard {...defaultProps} disabled={true} onChange={handleChange} />);
      
      const card = screen.getByRole('radio');
      card.focus();
      await user.keyboard(' ');
      
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('calls onClearError when clicked and hasError is true', async () => {
      const user = userEvent.setup();
      const handleClearError = jest.fn();
      
      render(
        <CheckboxCard 
          {...defaultProps} 
          hasError={true} 
          onClearError={handleClearError} 
        />
      );
      
      await user.click(screen.getByRole('radio'));
      
      expect(handleClearError).toHaveBeenCalledTimes(1);
    });

    it('does not call onClearError when no error state', async () => {
      const user = userEvent.setup();
      const handleClearError = jest.fn();
      
      render(
        <CheckboxCard 
          {...defaultProps} 
          hasError={false} 
          onClearError={handleClearError} 
        />
      );
      
      await user.click(screen.getByRole('radio'));
      
      expect(handleClearError).not.toHaveBeenCalled();
    });

    it('ignores other keyboard keys', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      
      render(<CheckboxCard {...defaultProps} onChange={handleChange} />);
      
      const card = screen.getByRole('radio');
      card.focus();
      await user.keyboard('a');
      await user.keyboard('{Escape}');
      await user.keyboard('{Tab}');
      
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Focus Management', () => {
    it('is focusable by default', () => {
      render(<CheckboxCard {...defaultProps} />);
      
      const card = screen.getByRole('radio');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('is not focusable when disabled', () => {
      render(<CheckboxCard {...defaultProps} disabled={true} />);
      
      const card = screen.getByRole('radio');
      expect(card).toHaveAttribute('tabIndex', '-1');
    });

    it('shows focus indicator when focused', async () => {
      const user = userEvent.setup();
      
      render(<CheckboxCard {...defaultProps} />);
      
      const card = screen.getByRole('radio');
      await user.tab();
      
      expect(card).toHaveFocus();
      expect(card).toHaveClass('focus-visible:ring-2', 'focus-visible:ring-primary');
    });
  });

  describe('Error Handling', () => {
    it('applies error styles to all text elements when hasError is true', () => {
      render(<CheckboxCard {...defaultProps} hasError={true} />);
      
      expect(screen.getByText('Test Plan')).toHaveClass('text-status-error');
      expect(screen.getByText('Test description')).toHaveClass('text-status-error');
      expect(screen.getByText('$299/month')).toHaveClass('text-status-error');
      expect(screen.getByText('Additional test description')).toHaveClass('text-status-error');
    });

    it('removes error styles when hasError is false', () => {
      const { rerender } = render(<CheckboxCard {...defaultProps} hasError={true} />);
      
      // Verify error styles are applied
      expect(screen.getByText('Test Plan')).toHaveClass('text-status-error');
      
      // Rerender without error
      rerender(<CheckboxCard {...defaultProps} hasError={false} />);
      
      // Verify error styles are removed
      expect(screen.getByText('Test Plan')).not.toHaveClass('text-status-error');
    });
  });

  describe('Props Validation', () => {
    it('handles missing optional props gracefully', () => {
      expect(() => {
        render(<CheckboxCard {...defaultProps} />);
      }).not.toThrow();
    });

    it('handles empty string values', () => {
      const propsWithEmpty = {
        ...defaultProps,
        title: '',
        description: '',
        plan: '',
      };
      
      expect(() => {
        render(<CheckboxCard {...propsWithEmpty} />);
      }).not.toThrow();
    });

    it('maintains component stability with rapid prop changes', async () => {
      const { rerender } = render(<CheckboxCard {...defaultProps} checked={false} />);
      
      // Rapidly change props
      for (let i = 0; i < 5; i++) {
        rerender(<CheckboxCard {...defaultProps} checked={i % 2 === 0} />);
        await waitFor(() => {
          expect(screen.getByRole('radio')).toHaveAttribute(
            'aria-checked', 
            (i % 2 === 0).toString()
          );
        });
      }
    });
  });
});
