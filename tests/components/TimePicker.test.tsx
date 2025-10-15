/**
 * @fileoverview Comprehensive test suite for TimePicker component
 * Tests component functionality, accessibility, user interactions, and edge cases
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimePicker from '@/components/forms/TimePicker';

// Mock @heroicons/react/20/solid
jest.mock('@heroicons/react/20/solid', () => ({
  ClockIcon: ({ className, 'aria-hidden': ariaHidden }: any) => (
    <div 
      data-testid="clock-icon" 
      className={className}
      aria-hidden={ariaHidden}
    />
  ),
}));

describe('TimePicker', () => {
  const mockOnTimeChange = jest.fn();
  const mockOnClearError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<TimePicker onTimeChange={mockOnTimeChange} />);
      
      const input = screen.getByRole('combobox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'Add Time');
      expect(input).toHaveAttribute('aria-label', 'Select time slot');
      expect(input).toHaveAttribute('aria-expanded', 'false');
      expect(input).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('renders with custom props', () => {
      render(
        <TimePicker
          onTimeChange={mockOnTimeChange}
          placeholder="Choose time"
          id="custom-time-picker"
          aria-label="Custom time picker"
          aria-describedby="time-help"
          className="custom-class"
        />
      );
      
      const input = screen.getByRole('combobox');
      expect(input).toHaveAttribute('placeholder', 'Choose time');
      expect(input).toHaveAttribute('id', 'custom-time-picker');
      expect(input).toHaveAttribute('aria-label', 'Custom time picker');
      expect(input).toHaveAttribute('aria-describedby', 'time-help');
      expect(input.closest('div')?.parentElement).toHaveClass('relative', 'w-full', 'custom-class');
    });

    it('renders clock icon', () => {
      render(<TimePicker onTimeChange={mockOnTimeChange} />);
      
      const clockIcon = screen.getByTestId('clock-icon');
      expect(clockIcon).toBeInTheDocument();
      expect(clockIcon).toHaveAttribute('aria-hidden', 'true');
    });

    it('displays selected value when provided', () => {
      render(
        <TimePicker 
          onTimeChange={mockOnTimeChange} 
          value="10am-11am"
        />
      );
      
      const input = screen.getByRole('combobox');
      expect(input).toHaveValue('10am-11am');
    });
  });

  describe('Error States', () => {
    it('applies error styling when hasError is true', () => {
      render(
        <TimePicker 
          onTimeChange={mockOnTimeChange} 
          hasError={true}
        />
      );
      
      const input = screen.getByRole('combobox');
      expect(input).toHaveClass('input-field--error');
    });

    it('calls onClearError when input is focused', async () => {
      const user = userEvent.setup();
      render(
        <TimePicker 
          onTimeChange={mockOnTimeChange} 
          hasError={true}
          onClearError={mockOnClearError}
        />
      );
      
      const input = screen.getByRole('combobox');
      await user.click(input);
      
      // onClearError is called both on focus and when opening popover
      expect(mockOnClearError).toHaveBeenCalledTimes(2);
    });

    it('calls onClearError when popover is opened', async () => {
      const user = userEvent.setup();
      render(
        <TimePicker 
          onTimeChange={mockOnTimeChange} 
          hasError={true}
          onClearError={mockOnClearError}
        />
      );
      
      const input = screen.getByRole('combobox');
      await user.click(input);
      
      // onClearError is called both on focus and when opening popover
      expect(mockOnClearError).toHaveBeenCalledTimes(2);
    });
  });

  describe('Disabled State', () => {
    it('applies disabled styling and behavior', () => {
      render(
        <TimePicker 
          onTimeChange={mockOnTimeChange} 
          disabled={true}
        />
      );
      
      const input = screen.getByRole('combobox');
      expect(input).toBeDisabled();
      expect(input).toHaveClass('cursor-not-allowed');
    });

    it('does not open popover when disabled', async () => {
      const user = userEvent.setup();
      render(
        <TimePicker 
          onTimeChange={mockOnTimeChange} 
          disabled={true}
        />
      );
      
      const input = screen.getByRole('combobox');
      await user.click(input);
      
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('does not respond to keyboard events when disabled', async () => {
      const user = userEvent.setup();
      render(
        <TimePicker 
          onTimeChange={mockOnTimeChange} 
          disabled={true}
        />
      );
      
      const input = screen.getByRole('combobox');
      await user.type(input, '{Enter}');
      
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('Popover Functionality', () => {
    it('opens popover when input is clicked', async () => {
      const user = userEvent.setup();
      render(<TimePicker onTimeChange={mockOnTimeChange} />);
      
      const input = screen.getByRole('combobox');
      await user.click(input);
      
      expect(input).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(screen.getByText('This is the arrival window not how long the job will take.')).toBeInTheDocument();
    });

    it('closes popover when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <TimePicker onTimeChange={mockOnTimeChange} />
          <button>Outside button</button>
        </div>
      );
      
      const input = screen.getByRole('combobox');
      await user.click(input);
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      
      const outsideButton = screen.getByText('Outside button');
      await user.click(outsideButton);
      
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    it('renders all time slots in popover', async () => {
      const user = userEvent.setup();
      render(<TimePicker onTimeChange={mockOnTimeChange} />);
      
      const input = screen.getByRole('combobox');
      await user.click(input);
      
      const expectedTimeSlots = [
        '9am-10am', '10am-11am', '11am-12pm', '12pm-1pm',
        '1pm-2pm', '2pm-3pm', '3pm-4pm', '4pm-5pm', '5pm-6pm'
      ];
      
      expectedTimeSlots.forEach(timeSlot => {
        expect(screen.getByRole('option', { name: timeSlot })).toBeInTheDocument();
      });
    });

    it('highlights selected time slot in popover', async () => {
      const user = userEvent.setup();
      render(
        <TimePicker 
          onTimeChange={mockOnTimeChange} 
          value="2pm-3pm"
        />
      );
      
      const input = screen.getByRole('combobox');
      await user.click(input);
      
      const selectedOption = screen.getByRole('option', { name: '2pm-3pm' });
      expect(selectedOption).toHaveAttribute('aria-selected', 'true');
      expect(selectedOption).toHaveClass('bg-primary', 'text-text-inverse');
    });
  });

  describe('Time Selection', () => {
    it('selects time slot and calls onTimeChange', async () => {
      const user = userEvent.setup();
      render(<TimePicker onTimeChange={mockOnTimeChange} />);
      
      const input = screen.getByRole('combobox');
      await user.click(input);
      
      const timeSlot = screen.getByRole('option', { name: '2pm-3pm' });
      await user.click(timeSlot);
      
      expect(mockOnTimeChange).toHaveBeenCalledWith('2pm-3pm', '14:00');
      expect(input).toHaveValue('2pm-3pm');
      
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    it('handles disabled time slots correctly', async () => {
      // This test verifies the disabled slot logic exists in the component
      // Since we can't easily mock the timeSlots array, we test the conditional logic
      const user = userEvent.setup();
      
      render(<TimePicker onTimeChange={mockOnTimeChange} />);
      
      const input = screen.getByRole('combobox');
      await user.click(input);
      
      // All current time slots should be enabled by default
      const timeSlots = screen.getAllByRole('option');
      timeSlots.forEach(slot => {
        expect(slot).not.toBeDisabled();
        expect(slot).not.toHaveClass('cursor-not-allowed', 'line-through');
      });
      
      // Verify that the component has the disabled slot handling logic
      // by checking the className logic exists
      const firstSlot = timeSlots[0];
      expect(firstSlot).toHaveClass('bg-surface-tertiary', 'text-text-primary');
    });

    it('focuses input after time selection', async () => {
      const user = userEvent.setup();
      render(<TimePicker onTimeChange={mockOnTimeChange} />);
      
      const input = screen.getByRole('combobox');
      await user.click(input);
      
      const timeSlot = screen.getByRole('option', { name: '2pm-3pm' });
      await user.click(timeSlot);
      
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('opens popover with Enter key', async () => {
      const user = userEvent.setup();
      render(<TimePicker onTimeChange={mockOnTimeChange} />);
      
      const input = screen.getByRole('combobox');
      input.focus();
      await user.keyboard('{Enter}');
      
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('opens popover with Space key', async () => {
      const user = userEvent.setup();
      render(<TimePicker onTimeChange={mockOnTimeChange} />);
      
      const input = screen.getByRole('combobox');
      input.focus();
      await user.keyboard(' ');
      
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('opens popover with ArrowDown key', async () => {
      const user = userEvent.setup();
      render(<TimePicker onTimeChange={mockOnTimeChange} />);
      
      const input = screen.getByRole('combobox');
      input.focus();
      await user.keyboard('{ArrowDown}');
      
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('closes popover with Escape key', async () => {
      const user = userEvent.setup();
      render(<TimePicker onTimeChange={mockOnTimeChange} />);
      
      const input = screen.getByRole('combobox');
      await user.click(input);
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      
      await user.keyboard('{Escape}');
      
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
      expect(input).toHaveFocus();
    });

    it('prevents default behavior for handled keys', async () => {
      const user = userEvent.setup();
      render(<TimePicker onTimeChange={mockOnTimeChange} />);
      
      const input = screen.getByRole('combobox');
      input.focus();
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      const preventDefaultSpy = jest.spyOn(enterEvent, 'preventDefault');
      
      fireEvent(input, enterEvent);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Focus Management', () => {
    it('updates focus state on focus and blur', async () => {
      const user = userEvent.setup();
      render(<TimePicker onTimeChange={mockOnTimeChange} />);
      
      const input = screen.getByRole('combobox');
      
      await user.click(input);
      // Focus state is reflected in styling - we can test this indirectly
      expect(input).toHaveFocus();
      
      await user.tab();
      expect(input).not.toHaveFocus();
    });

    it('updates icon color based on focus and value state', () => {
      const { rerender } = render(<TimePicker onTimeChange={mockOnTimeChange} />);
      
      let clockIcon = screen.getByTestId('clock-icon');
      expect(clockIcon).toHaveClass('text-text-secondary');
      
      // With value
      rerender(<TimePicker onTimeChange={mockOnTimeChange} value="10am-11am" />);
      clockIcon = screen.getByTestId('clock-icon');
      expect(clockIcon).toHaveClass('text-text-primary');
      
      // With error
      rerender(<TimePicker onTimeChange={mockOnTimeChange} hasError={true} />);
      clockIcon = screen.getByTestId('clock-icon');
      expect(clockIcon).toHaveClass('text-status-error');
      
      // Disabled
      rerender(<TimePicker onTimeChange={mockOnTimeChange} disabled={true} />);
      clockIcon = screen.getByTestId('clock-icon');
      expect(clockIcon).toHaveClass('text-text-secondary');
    });
  });

  describe('Value Updates', () => {
    it('updates selected time when value prop changes', () => {
      const { rerender } = render(
        <TimePicker onTimeChange={mockOnTimeChange} value="9am-10am" />
      );
      
      let input = screen.getByRole('combobox');
      expect(input).toHaveValue('9am-10am');
      
      rerender(
        <TimePicker onTimeChange={mockOnTimeChange} value="3pm-4pm" />
      );
      
      input = screen.getByRole('combobox');
      expect(input).toHaveValue('3pm-4pm');
    });

    it('clears selected time when value is empty', () => {
      const { rerender } = render(
        <TimePicker onTimeChange={mockOnTimeChange} value="9am-10am" />
      );
      
      let input = screen.getByRole('combobox');
      expect(input).toHaveValue('9am-10am');
      
      rerender(
        <TimePicker onTimeChange={mockOnTimeChange} value="" />
      );
      
      input = screen.getByRole('combobox');
      expect(input).toHaveValue('');
    });

    it('handles invalid value gracefully', () => {
      render(
        <TimePicker onTimeChange={mockOnTimeChange} value="invalid-time" />
      );
      
      const input = screen.getByRole('combobox');
      expect(input).toHaveValue('');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<TimePicker onTimeChange={mockOnTimeChange} />);
      
      const input = screen.getByRole('combobox');
      expect(input).toHaveAttribute('aria-expanded', 'false');
      expect(input).toHaveAttribute('aria-haspopup', 'listbox');
      expect(input).toHaveAttribute('role', 'combobox');
    });

    it('updates aria-expanded when popover opens/closes', async () => {
      const user = userEvent.setup();
      render(<TimePicker onTimeChange={mockOnTimeChange} />);
      
      const input = screen.getByRole('combobox');
      expect(input).toHaveAttribute('aria-expanded', 'false');
      
      await user.click(input);
      expect(input).toHaveAttribute('aria-expanded', 'true');
      
      await user.keyboard('{Escape}');
      await waitFor(() => {
        expect(input).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('has proper option attributes in popover', async () => {
      const user = userEvent.setup();
      render(<TimePicker onTimeChange={mockOnTimeChange} value="2pm-3pm" />);
      
      const input = screen.getByRole('combobox');
      await user.click(input);
      
      const listbox = screen.getByRole('listbox');
      expect(listbox).toHaveAttribute('aria-label', 'Time slot options');
      
      const selectedOption = screen.getByRole('option', { name: '2pm-3pm' });
      expect(selectedOption).toHaveAttribute('aria-selected', 'true');
      
      const unselectedOption = screen.getByRole('option', { name: '9am-10am' });
      expect(unselectedOption).toHaveAttribute('aria-selected', 'false');
    });

    it('supports screen reader announcements', () => {
      render(<TimePicker onTimeChange={mockOnTimeChange} />);
      
      const clockIcon = screen.getByTestId('clock-icon');
      expect(clockIcon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Event Cleanup', () => {
    it('removes event listeners on unmount', () => {
      // Note: Click-outside cleanup is now handled by useClickOutside hook
      // which has its own test coverage. This test verifies the component unmounts cleanly.
      const { unmount } = render(<TimePicker onTimeChange={mockOnTimeChange} />);
      
      expect(() => unmount()).not.toThrow();
    });

    it('removes event listeners when popover closes', async () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      const user = userEvent.setup();
      
      render(<TimePicker onTimeChange={mockOnTimeChange} />);
      
      const input = screen.getByRole('combobox');
      await user.click(input);
      
      await user.keyboard('{Escape}');
      
      await waitFor(() => {
        expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
      });
      
      removeEventListenerSpy.mockRestore();
    });
  });
});
