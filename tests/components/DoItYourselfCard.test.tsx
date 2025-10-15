/**
 * @fileoverview Comprehensive Jest tests for DoItYourselfCard component
 * @source Test suite for migrated component from boombox-10.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { DoItYourselfCard, type DoItYourselfCardProps } from '@/components/forms/DoItYourselfCard';

// Mock the FurnitureIcon component
jest.mock('@/components/icons', () => ({
  FurnitureIcon: ({ className, hasError }: { className?: string; hasError?: boolean }) => (
    <div data-testid="furniture-icon" className={className} data-has-error={hasError}>
      Furniture Icon
    </div>
  ),
}));

describe('DoItYourselfCard', () => {
  const defaultProps: DoItYourselfCardProps = {
    onPlanTypeChange: jest.fn(),
  };

  const createWrapper = (props: Partial<DoItYourselfCardProps> = {}) => {
    return render(<DoItYourselfCard {...defaultProps} {...props} />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders the component with default props', () => {
      createWrapper();
      
      expect(screen.getByRole('radio')).toBeInTheDocument();
      expect(screen.getByText('Do It Yourself Plan')).toBeInTheDocument();
      expect(screen.getByText('Feeling strong? Save money by loading your Boombox yourself')).toBeInTheDocument();
      expect(screen.getByText('Free!')).toBeInTheDocument();
      expect(screen.getByText('1st hour')).toBeInTheDocument();
      expect(screen.getByTestId('furniture-icon')).toBeInTheDocument();
    });

    it('applies correct ARIA attributes', () => {
      createWrapper();
      
      const radioInput = screen.getByRole('radio');
      expect(radioInput).toHaveAttribute('aria-describedby', 'do-it-yourself-description do-it-yourself-price');
      expect(radioInput).toHaveAttribute('aria-invalid', 'false');
    });

    it('renders with custom className', () => {
      const customClass = 'custom-test-class';
      createWrapper({ className: customClass });
      
      const labelElement = screen.getByText('Do It Yourself Plan').closest('label');
      expect(labelElement).toHaveClass(customClass);
    });
  });

  describe('Checked State', () => {
    it('displays checked state correctly', () => {
      createWrapper({ checked: true });
      
      const radioInput = screen.getByRole('radio');
      expect(radioInput).toBeChecked();
    });

    it('applies correct CSS classes when checked', () => {
      createWrapper({ checked: true });
      
      const labelElement = screen.getByText('Do It Yourself Plan').closest('label');
      expect(labelElement).toHaveClass('ring-border-focus', 'ring-2', 'bg-surface-primary');
    });

    it('displays unchecked state correctly', () => {
      createWrapper({ checked: false });
      
      const radioInput = screen.getByRole('radio');
      expect(radioInput).not.toBeChecked();
    });
  });

  describe('Error State', () => {
    it('displays error state correctly', () => {
      createWrapper({ hasError: true });
      
      const radioInput = screen.getByRole('radio');
      expect(radioInput).toHaveAttribute('aria-invalid', 'true');
      
      const labelElement = screen.getByText('Do It Yourself Plan').closest('label');
      expect(labelElement).toHaveClass('ring-border-error', 'bg-status-bg-error', 'ring-2');
    });

    it('passes error state to FurnitureIcon', () => {
      createWrapper({ hasError: true });
      
      const furnitureIcon = screen.getByTestId('furniture-icon');
      expect(furnitureIcon).toHaveAttribute('data-has-error', 'true');
    });

    it('applies error styling to icon container', () => {
      createWrapper({ hasError: true });
      
      // The icon container should have error background
      const iconContainer = screen.getByTestId('furniture-icon').parentElement;
      expect(iconContainer).toHaveClass('bg-status-bg-error');
    });
  });

  describe('Disabled State', () => {
    it('displays disabled state correctly', () => {
      createWrapper({ disabled: true });
      
      const radioInput = screen.getByRole('radio');
      expect(radioInput).toBeDisabled();
      
      const labelElement = screen.getByText('Do It Yourself Plan').closest('label');
      expect(labelElement).toHaveAttribute('tabIndex', '-1');
      expect(labelElement).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('does not trigger callbacks when disabled', async () => {
      const onChange = jest.fn();
      const onPlanTypeChange = jest.fn();
      const onClearError = jest.fn();
      
      createWrapper({
        disabled: true,
        onChange,
        onPlanTypeChange,
        onClearError,
      });
      
      const labelElement = screen.getByText('Do It Yourself Plan').closest('label');
      await userEvent.click(labelElement!);
      
      expect(onChange).not.toHaveBeenCalled();
      expect(onPlanTypeChange).not.toHaveBeenCalled();
      expect(onClearError).not.toHaveBeenCalled();
    });
  });

  describe('User Interactions', () => {
    it('handles click events correctly', async () => {
      const onChange = jest.fn();
      const onPlanTypeChange = jest.fn();
      const onClearError = jest.fn();
      
      createWrapper({
        onChange,
        onPlanTypeChange,
        onClearError,
      });
      
      const labelElement = screen.getByText('Do It Yourself Plan').closest('label');
      await userEvent.click(labelElement!);
      
      expect(onPlanTypeChange).toHaveBeenCalledWith('Do It Yourself Plan');
      expect(onChange).toHaveBeenCalledWith('Do It Yourself Plan', '0', 'Do It Yourself Plan');
      expect(onClearError).toHaveBeenCalled();
    });

    it('handles keyboard events correctly', async () => {
      const onChange = jest.fn();
      const onPlanTypeChange = jest.fn();
      
      createWrapper({
        onChange,
        onPlanTypeChange,
      });
      
      const labelElement = screen.getByText('Do It Yourself Plan').closest('label')!;
      labelElement.focus();
      
      // Test Enter key
      fireEvent.keyDown(labelElement, { key: 'Enter' });
      expect(onPlanTypeChange).toHaveBeenCalledWith('Do It Yourself Plan');
      expect(onChange).toHaveBeenCalledWith('Do It Yourself Plan', '0', 'Do It Yourself Plan');
      
      jest.clearAllMocks();
      
      // Test Space key
      fireEvent.keyDown(labelElement, { key: ' ' });
      expect(onPlanTypeChange).toHaveBeenCalledWith('Do It Yourself Plan');
      expect(onChange).toHaveBeenCalledWith('Do It Yourself Plan', '0', 'Do It Yourself Plan');
    });

    it('ignores other keyboard events', async () => {
      const onChange = jest.fn();
      const onPlanTypeChange = jest.fn();
      
      createWrapper({
        onChange,
        onPlanTypeChange,
      });
      
      const labelElement = screen.getByText('Do It Yourself Plan').closest('label')!;
      fireEvent.keyDown(labelElement, { key: 'Tab' });
      fireEvent.keyDown(labelElement, { key: 'Escape' });
      fireEvent.keyDown(labelElement, { key: 'a' });
      
      expect(onChange).not.toHaveBeenCalled();
      expect(onPlanTypeChange).not.toHaveBeenCalled();
    });

    it('prevents default behavior for handled keyboard events', () => {
      createWrapper();
      
      const labelElement = screen.getByText('Do It Yourself Plan').closest('label')!;
      
      // Test Enter key
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      const enterPreventDefault = jest.spyOn(enterEvent, 'preventDefault');
      
      // Test Space key
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
      const spacePreventDefault = jest.spyOn(spaceEvent, 'preventDefault');
      
      // Trigger events on the label element
      labelElement.dispatchEvent(enterEvent);
      labelElement.dispatchEvent(spaceEvent);
      
      expect(enterPreventDefault).toHaveBeenCalled();
      expect(spacePreventDefault).toHaveBeenCalled();
    });
  });

  describe('Optional Callbacks', () => {
    it('handles missing onChange callback gracefully', async () => {
      createWrapper({ onChange: undefined });
      
      const radioElement = screen.getByRole('radio');
      await userEvent.click(radioElement);
      
      // Should not throw an error
      expect(defaultProps.onPlanTypeChange).toHaveBeenCalled();
    });

    it('handles missing onClearError callback gracefully', async () => {
      createWrapper({ onClearError: undefined });
      
      const radioElement = screen.getByRole('radio');
      await userEvent.click(radioElement);
      
      // Should not throw an error
      expect(defaultProps.onPlanTypeChange).toHaveBeenCalled();
    });

    it('calls onClearError when provided', async () => {
      const onClearError = jest.fn();
      createWrapper({ onClearError, hasError: true });
      
      const radioElement = screen.getByRole('radio');
      await userEvent.click(radioElement);
      
      expect(onClearError).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper focus management', () => {
      createWrapper();
      
      const labelElement = screen.getByText('Do It Yourself Plan').closest('label')!;
      expect(labelElement).toHaveAttribute('tabIndex', '0');
      
      labelElement.focus();
      expect(labelElement).toHaveFocus();
    });

    it('has correct ARIA relationships', () => {
      createWrapper();
      
      const description = screen.getByText('Feeling strong? Save money by loading your Boombox yourself');
      const price = screen.getByText((content, element) => {
        return element?.textContent === 'Free! 1st hour';
      });
      
      expect(description).toHaveAttribute('id', 'do-it-yourself-description');
      expect(price).toHaveAttribute('id', 'do-it-yourself-price');
    });

    it('supports screen reader navigation', () => {
      createWrapper();
      
      const radioInput = screen.getByRole('radio');
      expect(radioInput).toHaveAccessibleName();
      expect(radioInput).toHaveAccessibleDescription();
    });

    it('removes focus when disabled', () => {
      createWrapper({ disabled: true });
      
      const labelElement = screen.getByText('Do It Yourself Plan').closest('label')!;
      expect(labelElement).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('Visual States', () => {
    it('applies correct hover state classes', () => {
      createWrapper();
      
      const labelElement = screen.getByText('Do It Yourself Plan').closest('label')!;
      expect(labelElement).toHaveClass('hover:bg-surface-tertiary');
    });

    it('applies focus-visible classes for keyboard navigation', () => {
      createWrapper();
      
      const labelElement = screen.getByText('Do It Yourself Plan').closest('label')!;
      expect(labelElement).toHaveClass(
        'focus-visible:outline-none',
        'focus-visible:ring-2',
        'focus-visible:ring-border-focus',
        'focus-visible:ring-offset-2'
      );
    });

    it('shows correct state-based styling combinations', () => {
      // Test normal state
      const { rerender } = createWrapper();
      let labelElement = screen.getByText('Do It Yourself Plan').closest('label')!;
      expect(labelElement).toHaveClass('ring-border', 'ring-2', 'bg-surface-secondary');
      
      // Test checked state
      rerender(<DoItYourselfCard {...defaultProps} checked={true} />);
      labelElement = screen.getByText('Do It Yourself Plan').closest('label')!;
      expect(labelElement).toHaveClass('ring-border-focus', 'ring-2', 'bg-surface-primary');
      
      // Test error state
      rerender(<DoItYourselfCard {...defaultProps} hasError={true} />);
      labelElement = screen.getByText('Do It Yourself Plan').closest('label')!;
      expect(labelElement).toHaveClass('ring-border-error', 'bg-status-bg-error', 'ring-2');
    });
  });

  describe('Form Integration', () => {
    it('has correct form attributes', () => {
      createWrapper();
      
      const radioInput = screen.getByRole('radio');
      expect(radioInput).toHaveAttribute('name', 'planName');
      expect(radioInput).toHaveAttribute('value', 'Do It Yourself Plan');
      expect(radioInput).toHaveAttribute('type', 'radio');
    });

    it('maintains proper label association', () => {
      createWrapper();
      
      const radioInput = screen.getByRole('radio');
      const labelElement = screen.getByText('Do It Yourself Plan').closest('label');
      
      expect(radioInput).toHaveAttribute('id', 'do-it-yourself-plan');
      expect(radioInput).toHaveAttribute('type', 'radio');
      expect(labelElement).toHaveAttribute('for', 'do-it-yourself-plan');
    });
  });
});
