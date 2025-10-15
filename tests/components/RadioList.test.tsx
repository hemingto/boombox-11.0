/**
 * @fileoverview Jest tests for RadioList component
 * Tests component rendering, user interactions, accessibility features, and error states
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { RadioList } from '@/components/forms/RadioList';

// Mock options for testing
const mockOptions = ['Option 1', 'Option 2', 'Option 3'];
const mockOnChange = jest.fn();

describe('RadioList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders all provided options', () => {
      render(<RadioList options={mockOptions} />);
      
      mockOptions.forEach(option => {
        expect(screen.getByLabelText(option)).toBeInTheDocument();
      });
    });

    it('renders with legend when provided', () => {
      const legend = 'Choose an option';
      render(<RadioList options={mockOptions} legend={legend} />);
      
      expect(screen.getByText(legend)).toBeInTheDocument();
      expect(screen.getByRole('group')).toHaveAccessibleName(legend);
    });

    it('renders without legend when not provided', () => {
      render(<RadioList options={mockOptions} />);
      
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
      // The fieldset still creates a 'group' role, but no legend is visible
      expect(screen.queryByRole('group')).toBeInTheDocument();
      expect(screen.queryByText(/choose an option/i)).not.toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
      const customClass = 'custom-radio-list';
      render(<RadioList options={mockOptions} className={customClass} />);
      
      const fieldset = screen.getByRole('group') || screen.getByRole('radiogroup').closest('fieldset');
      expect(fieldset).toHaveClass(customClass);
    });
  });

  describe('Selection Behavior', () => {
    it('allows selecting an option', async () => {
      const user = userEvent.setup();
      render(<RadioList options={mockOptions} onChange={mockOnChange} />);
      
      const firstOption = screen.getByLabelText('Option 1');
      await user.click(firstOption);
      
      expect(firstOption).toBeChecked();
      expect(mockOnChange).toHaveBeenCalledWith('Option 1');
    });

    it('allows changing selection', async () => {
      const user = userEvent.setup();
      render(<RadioList options={mockOptions} onChange={mockOnChange} />);
      
      // Select first option
      const firstOption = screen.getByLabelText('Option 1');
      await user.click(firstOption);
      expect(firstOption).toBeChecked();
      
      // Select second option
      const secondOption = screen.getByLabelText('Option 2');
      await user.click(secondOption);
      
      expect(firstOption).not.toBeChecked();
      expect(secondOption).toBeChecked();
      expect(mockOnChange).toHaveBeenCalledTimes(2);
      expect(mockOnChange).toHaveBeenLastCalledWith('Option 2');
    });

    it('respects defaultValue prop', () => {
      render(<RadioList options={mockOptions} defaultValue="Option 2" />);
      
      expect(screen.getByLabelText('Option 2')).toBeChecked();
      expect(screen.getByLabelText('Option 1')).not.toBeChecked();
      expect(screen.getByLabelText('Option 3')).not.toBeChecked();
    });

    it('maintains selection state internally when no onChange provided', async () => {
      const user = userEvent.setup();
      render(<RadioList options={mockOptions} />);
      
      const firstOption = screen.getByLabelText('Option 1');
      await user.click(firstOption);
      
      expect(firstOption).toBeChecked();
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports Enter key for selection', async () => {
      const user = userEvent.setup();
      render(<RadioList options={mockOptions} onChange={mockOnChange} />);
      
      const firstOptionLabel = screen.getByText('Option 1').closest('label');
      firstOptionLabel?.focus();
      
      await user.keyboard('{Enter}');
      
      expect(screen.getByLabelText('Option 1')).toBeChecked();
      expect(mockOnChange).toHaveBeenCalledWith('Option 1');
    });

    it('supports Space key for selection', async () => {
      const user = userEvent.setup();
      render(<RadioList options={mockOptions} onChange={mockOnChange} />);
      
      const firstOptionLabel = screen.getByText('Option 1').closest('label');
      firstOptionLabel?.focus();
      
      await user.keyboard(' ');
      
      expect(screen.getByLabelText('Option 1')).toBeChecked();
      expect(mockOnChange).toHaveBeenCalledWith('Option 1');
    });

    it('handles keyboard events properly', async () => {
      const user = userEvent.setup();
      render(<RadioList options={mockOptions} onChange={mockOnChange} />);
      
      const firstOptionLabel = screen.getByText('Option 1').closest('label');
      firstOptionLabel?.focus();
      
      // Test that keyboard events trigger selection
      await user.keyboard('{Enter}');
      expect(screen.getByLabelText('Option 1')).toBeChecked();
      expect(mockOnChange).toHaveBeenCalledWith('Option 1');
      
      // Reset and test space key
      mockOnChange.mockClear();
      const secondOptionLabel = screen.getByText('Option 2').closest('label');
      secondOptionLabel?.focus();
      
      await user.keyboard(' ');
      expect(screen.getByLabelText('Option 2')).toBeChecked();
      expect(mockOnChange).toHaveBeenCalledWith('Option 2');
    });
  });

  describe('Disabled State', () => {
    it('renders as disabled when disabled prop is true', () => {
      render(<RadioList options={mockOptions} disabled />);
      
      const fieldset = screen.getByRole('group') || screen.getByRole('radiogroup').closest('fieldset');
      expect(fieldset).toBeDisabled();
      
      mockOptions.forEach(option => {
        expect(screen.getByLabelText(option)).toBeDisabled();
      });
    });

    it('prevents selection when disabled', async () => {
      const user = userEvent.setup();
      render(<RadioList options={mockOptions} disabled onChange={mockOnChange} />);
      
      const firstOption = screen.getByLabelText('Option 1');
      await user.click(firstOption);
      
      expect(firstOption).not.toBeChecked();
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('prevents keyboard interaction when disabled', async () => {
      const user = userEvent.setup();
      render(<RadioList options={mockOptions} disabled onChange={mockOnChange} />);
      
      const firstOptionLabel = screen.getByText('Option 1').closest('label');
      firstOptionLabel?.focus();
      
      await user.keyboard('{Enter}');
      
      expect(screen.getByLabelText('Option 1')).not.toBeChecked();
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('applies disabled styling', () => {
      render(<RadioList options={mockOptions} disabled />);
      
      const firstOptionLabel = screen.getByText('Option 1').closest('label');
      expect(firstOptionLabel).toHaveClass('cursor-not-allowed', 'opacity-60');
    });
  });

  describe('Error State', () => {
    it('renders error state styling when hasError is true', () => {
      render(<RadioList options={mockOptions} hasError />);
      
      const firstOptionLabel = screen.getByText('Option 1').closest('label');
      expect(firstOptionLabel).toHaveClass('bg-status-bg-error');
    });

    it('displays error message when provided', () => {
      const errorMessage = 'Please select an option';
      render(<RadioList options={mockOptions} hasError errorMessage={errorMessage} />);
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
    });

    it('associates error message with fieldset using aria-describedby', () => {
      const errorMessage = 'Please select an option';
      const name = 'testRadio';
      render(<RadioList options={mockOptions} hasError errorMessage={errorMessage} name={name} />);
      
      const fieldset = screen.getByRole('group') || screen.getByRole('radiogroup').closest('fieldset');
      expect(fieldset).toHaveAttribute('aria-describedby', `${name}-error`);
    });

    it('sets aria-invalid on fieldset when hasError is true', () => {
      render(<RadioList options={mockOptions} hasError />);
      
      const fieldset = screen.getByRole('group') || screen.getByRole('radiogroup').closest('fieldset');
      expect(fieldset).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA roles and properties', () => {
      render(<RadioList options={mockOptions} legend="Test Legend" />);
      
      expect(screen.getByRole('group')).toBeInTheDocument();
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
      
      mockOptions.forEach((option, idx) => {
        const label = screen.getByText(option).closest('label');
        expect(label).toHaveAttribute('role', 'radio');
        expect(label).toHaveAttribute('aria-checked');
      });
    });

    it('provides proper labeling for screen readers', () => {
      render(<RadioList options={mockOptions} name="testRadio" />);
      
      mockOptions.forEach((option, idx) => {
        const input = screen.getByLabelText(option);
        const optionId = `testRadio-option-${idx}`;
        
        expect(input).toHaveAttribute('id', optionId);
        expect(input).toHaveAttribute('aria-describedby', `${optionId}-text`);
      });
    });

    it('supports focus management', async () => {
      const user = userEvent.setup();
      render(<RadioList options={mockOptions} />);
      
      const firstOptionLabel = screen.getByText('Option 1').closest('label');
      
      await user.tab();
      expect(firstOptionLabel).toHaveFocus();
    });

    it('has proper focus indicators', () => {
      render(<RadioList options={mockOptions} />);
      
      const firstOptionLabel = screen.getByText('Option 1').closest('label');
      expect(firstOptionLabel).toHaveClass('focus-within:ring-2', 'focus-within:ring-border-focus');
    });
  });

  describe('Custom Name Attribute', () => {
    it('uses custom name for radio group', () => {
      const customName = 'customRadioGroup';
      render(<RadioList options={mockOptions} name={customName} />);
      
      mockOptions.forEach(option => {
        expect(screen.getByLabelText(option)).toHaveAttribute('name', customName);
      });
    });

    it('uses default name when not provided', () => {
      render(<RadioList options={mockOptions} />);
      
      mockOptions.forEach(option => {
        expect(screen.getByLabelText(option)).toHaveAttribute('name', 'radioList');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty options array', () => {
      render(<RadioList options={[]} />);
      
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
      expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    });

    it('handles options with special characters', () => {
      const specialOptions = ['Option & Special', 'Option "Quotes"', 'Option <HTML>'];
      render(<RadioList options={specialOptions} />);
      
      specialOptions.forEach(option => {
        expect(screen.getByLabelText(option)).toBeInTheDocument();
      });
    });

    it('handles very long option text', () => {
      const longOption = 'This is a very long option text that should still render properly and maintain accessibility features';
      render(<RadioList options={[longOption]} />);
      
      expect(screen.getByLabelText(longOption)).toBeInTheDocument();
    });
  });
});
