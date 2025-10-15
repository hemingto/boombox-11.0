/**
 * @fileoverview Comprehensive Jest tests for CustomDatePicker component
 * @source tests for boombox-10.0/src/app/components/reusablecomponents/customdatepicker.tsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import CustomDatePicker, { CustomDatePickerProps } from '@/components/forms/CustomDatePicker';
import { formatDateForInput } from '@/lib/utils/dateUtils';

// Mock react-datepicker to avoid complex DOM dependencies in tests
jest.mock('react-datepicker', () => {
  const MockDatePicker = ({ selected, onChange, inline, minDate, filterDate }: any) => {
    const handleDateClick = (date: Date) => {
      if (onChange) {
        onChange(date);
      }
    };

    return (
      <div data-testid="mock-datepicker">
        <button
          data-testid="mock-date-button"
          onClick={() => handleDateClick(new Date('2024-12-25'))}
        >
          Select Date
        </button>
        <span data-testid="selected-date">
          {selected ? selected.toISOString() : 'No date selected'}
        </span>
        <span data-testid="min-date">
          {minDate ? minDate.toISOString() : 'No min date'}
        </span>
      </div>
    );
  };
  return MockDatePicker;
});

// Mock CSS imports
jest.mock('react-datepicker/dist/react-datepicker.css', () => ({}));

describe('CustomDatePicker', () => {
  const mockOnDateChange = jest.fn();
  const mockOnClearError = jest.fn();

  const defaultProps: CustomDatePickerProps = {
    onDateChange: mockOnDateChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<CustomDatePicker {...defaultProps} />);
      
      const input = screen.getByRole('combobox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'Add Date');
      expect(input).toHaveAttribute('aria-label', 'Select date');
    });

    it('renders with custom placeholder', () => {
      render(<CustomDatePicker {...defaultProps} placeholder="Choose a date" />);
      
      const input = screen.getByRole('combobox');
      expect(input).toHaveAttribute('placeholder', 'Choose a date');
    });

    it('renders with custom aria-label', () => {
      render(
        <CustomDatePicker {...defaultProps} aria-label="Pick appointment date" />
      );
      
      const input = screen.getByRole('combobox');
      expect(input).toHaveAttribute('aria-label', 'Pick appointment date');
    });

    it('renders calendar icon', () => {
      render(<CustomDatePicker {...defaultProps} />);
      
      // Find the SVG element by its classes
      const icon = document.querySelector('svg[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('w-5', 'h-5');
    });
  });

  describe('Value Display', () => {
    it('displays formatted date when value is provided', () => {
      const testDate = new Date('2024-12-25');
      render(<CustomDatePicker {...defaultProps} value={testDate} />);
      
      const input = screen.getByRole('combobox');
      expect(input).toHaveValue(formatDateForInput(testDate));
    });

    it('displays empty value when no date is selected', () => {
      render(<CustomDatePicker {...defaultProps} value={null} />);
      
      const input = screen.getByRole('combobox');
      expect(input).toHaveValue('');
    });

    it('updates display value when value prop changes', () => {
      const firstDate = new Date('2024-12-25');
      const secondDate = new Date('2024-12-26');
      
      const { rerender } = render(
        <CustomDatePicker {...defaultProps} value={firstDate} />
      );
      
      const input = screen.getByRole('combobox');
      expect(input).toHaveValue(formatDateForInput(firstDate));
      
      rerender(<CustomDatePicker {...defaultProps} value={secondDate} />);
      expect(input).toHaveValue(formatDateForInput(secondDate));
    });
  });

  describe('Calendar Interaction', () => {
    it('opens calendar when input is clicked', async () => {
      render(<CustomDatePicker {...defaultProps} />);
      
      const input = screen.getByRole('combobox');
      fireEvent.click(input);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-datepicker')).toBeInTheDocument();
      });
      
      expect(input).toHaveAttribute('aria-expanded', 'true');
    });

    it('opens calendar on Enter key press', async () => {
      render(<CustomDatePicker {...defaultProps} />);
      
      const input = screen.getByRole('combobox');
      fireEvent.keyDown(input, { key: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-datepicker')).toBeInTheDocument();
      });
    });

    it('opens calendar on Space key press', async () => {
      render(<CustomDatePicker {...defaultProps} />);
      
      const input = screen.getByRole('combobox');
      fireEvent.keyDown(input, { key: ' ' });
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-datepicker')).toBeInTheDocument();
      });
    });

    it('closes calendar on Escape key press', async () => {
      render(<CustomDatePicker {...defaultProps} />);
      
      const input = screen.getByRole('combobox');
      fireEvent.click(input);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-datepicker')).toBeInTheDocument();
      });
      
      fireEvent.keyDown(input, { key: 'Escape' });
      
      await waitFor(() => {
        expect(screen.queryByTestId('mock-datepicker')).not.toBeInTheDocument();
      });
    });
  });

  describe('Date Selection', () => {
    it('calls onDateChange when date is selected', async () => {
      render(<CustomDatePicker {...defaultProps} />);
      
      const input = screen.getByRole('combobox');
      fireEvent.click(input);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-datepicker')).toBeInTheDocument();
      });
      
      const dateButton = screen.getByTestId('mock-date-button');
      fireEvent.click(dateButton);
      
      expect(mockOnDateChange).toHaveBeenCalledWith(
        formatDateForInput(new Date('2024-12-25')),
        new Date('2024-12-25')
      );
    });

    it('closes calendar after date selection', async () => {
      render(<CustomDatePicker {...defaultProps} />);
      
      const input = screen.getByRole('combobox');
      fireEvent.click(input);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-datepicker')).toBeInTheDocument();
      });
      
      const dateButton = screen.getByTestId('mock-date-button');
      fireEvent.click(dateButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('mock-datepicker')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('applies error styles when hasError is true', () => {
      render(<CustomDatePicker {...defaultProps} hasError />);
      
      const input = screen.getByRole('combobox');
      expect(input).toHaveClass('ring-status-error', 'ring-2', 'bg-red-50');
    });

    it('applies normal styles when hasError is false', () => {
      render(<CustomDatePicker {...defaultProps} hasError={false} />);
      
      const input = screen.getByRole('combobox');
      expect(input).toHaveClass('input-field');
      expect(input).not.toHaveClass('ring-status-error');
    });

    it('calls onClearError when input gains focus', () => {
      render(
        <CustomDatePicker {...defaultProps} hasError onClearError={mockOnClearError} />
      );
      
      const input = screen.getByRole('combobox');
      fireEvent.focus(input);
      
      expect(mockOnClearError).toHaveBeenCalledTimes(1);
    });

    it('calls onClearError when calendar is opened', () => {
      render(
        <CustomDatePicker {...defaultProps} hasError onClearError={mockOnClearError} />
      );
      
      const input = screen.getByRole('combobox');
      fireEvent.click(input);
      
      expect(mockOnClearError).toHaveBeenCalledTimes(1);
    });
  });

  describe('Disabled State', () => {
    it('applies disabled styles when disabled is true', () => {
      render(<CustomDatePicker {...defaultProps} disabled />);
      
      const input = screen.getByRole('combobox');
      expect(input).toBeDisabled();
      expect(input).toHaveClass('cursor-not-allowed', 'opacity-50');
    });

    it('does not open calendar when disabled and clicked', () => {
      render(<CustomDatePicker {...defaultProps} disabled />);
      
      const input = screen.getByRole('combobox');
      fireEvent.click(input);
      
      expect(screen.queryByTestId('mock-datepicker')).not.toBeInTheDocument();
    });

    it('does not respond to keyboard events when disabled', () => {
      render(<CustomDatePicker {...defaultProps} disabled />);
      
      const input = screen.getByRole('combobox');
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(screen.queryByTestId('mock-datepicker')).not.toBeInTheDocument();
    });

    it('does not call onClearError on focus when disabled', () => {
      render(
        <CustomDatePicker 
          {...defaultProps} 
          disabled 
          onClearError={mockOnClearError} 
        />
      );
      
      const input = screen.getByRole('combobox');
      fireEvent.focus(input);
      
      expect(mockOnClearError).not.toHaveBeenCalled();
    });
  });

  describe('Small Text Variant', () => {
    it('applies small text styles when smallText is true', () => {
      render(<CustomDatePicker {...defaultProps} smallText />);
      
      const input = screen.getByRole('combobox');
      expect(input).toHaveClass('text-sm');
      
      const icon = document.querySelector('svg[aria-hidden="true"]');
      expect(icon).toHaveClass('inset-y-2.5');
    });

    it('applies normal text styles when smallText is false', () => {
      render(<CustomDatePicker {...defaultProps} smallText={false} />);
      
      const input = screen.getByRole('combobox');
      expect(input).not.toHaveClass('text-sm');
      
      const icon = document.querySelector('svg[aria-hidden="true"]');
      expect(icon).toHaveClass('inset-y-3');
    });
  });

  describe('Past Date Handling', () => {
    it('passes allowPastDates to date picker component', async () => {
      render(<CustomDatePicker {...defaultProps} allowPastDates />);
      
      const input = screen.getByRole('combobox');
      fireEvent.click(input);
      
      await waitFor(() => {
        const minDateElement = screen.getByTestId('min-date');
        expect(minDateElement).toHaveTextContent('No min date');
      });
    });

    it('sets minimum date when allowPastDates is false', async () => {
      render(<CustomDatePicker {...defaultProps} allowPastDates={false} />);
      
      const input = screen.getByRole('combobox');
      fireEvent.click(input);
      
      await waitFor(() => {
        const minDateElement = screen.getByTestId('min-date');
        expect(minDateElement).not.toHaveTextContent('No min date');
      });
    });
  });

  describe('Focus Management', () => {
    it('updates focus state when input gains focus', () => {
      render(<CustomDatePicker {...defaultProps} />);
      
      const input = screen.getByRole('combobox');
      const icon = document.querySelector('svg[aria-hidden="true"]');
      
      fireEvent.focus(input);
      expect(icon).toHaveClass('text-primary');
      
      fireEvent.blur(input);
      expect(icon).toHaveClass('text-text-secondary');
    });

    it('shows focused icon color when input has value', () => {
      const testDate = new Date('2024-12-25');
      render(<CustomDatePicker {...defaultProps} value={testDate} />);
      
      const icon = document.querySelector('svg[aria-hidden="true"]');
      expect(icon).toHaveClass('text-primary');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <CustomDatePicker 
          {...defaultProps} 
          aria-label="Select appointment date"
          aria-describedby="date-help"
        />
      );
      
      const input = screen.getByRole('combobox');
      expect(input).toHaveAttribute('aria-label', 'Select appointment date');
      expect(input).toHaveAttribute('aria-describedby', 'date-help');
      expect(input).toHaveAttribute('aria-expanded', 'false');
      expect(input).toHaveAttribute('aria-haspopup', 'dialog');
    });

    it('updates aria-expanded when calendar opens', async () => {
      render(<CustomDatePicker {...defaultProps} />);
      
      const input = screen.getByRole('combobox');
      expect(input).toHaveAttribute('aria-expanded', 'false');
      
      fireEvent.click(input);
      
      await waitFor(() => {
        expect(input).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('has proper role for calendar dialog', async () => {
      render(<CustomDatePicker {...defaultProps} />);
      
      const input = screen.getByRole('combobox');
      fireEvent.click(input);
      
      await waitFor(() => {
        const calendarContainer = screen.getByRole('dialog', { name: 'Date picker' });
        expect(calendarContainer).toBeInTheDocument();
      });
    });

    it('has aria-hidden on decorative icon', () => {
      render(<CustomDatePicker {...defaultProps} />);
      
      const icon = document.querySelector('svg[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Click Outside Handling', () => {
    it('closes calendar when clicking outside', async () => {
      render(
        <div>
          <CustomDatePicker {...defaultProps} />
          <button data-testid="outside-button">Outside Button</button>
        </div>
      );
      
      const input = screen.getByRole('combobox');
      fireEvent.click(input);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-datepicker')).toBeInTheDocument();
      });
      
      const outsideButton = screen.getByTestId('outside-button');
      fireEvent.mouseDown(outsideButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('mock-datepicker')).not.toBeInTheDocument();
      });
    });
  });
});
