/**
 * @fileoverview Jest tests for TimeSlotPicker component
 * Tests time slot selection functionality, loading states, and accessibility
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimeSlotPicker from '@/components/forms/TimeSlotPicker';
import { TimeSlot } from '@/components/forms/Scheduler';

describe('TimeSlotPicker Component', () => {
  const mockTimeSlots: TimeSlot[] = [
    { startTime: '09:00', endTime: '10:00', display: '9am-10am', available: true },
    { startTime: '10:00', endTime: '11:00', display: '10am-11am', available: true },
    { startTime: '11:00', endTime: '12:00', display: '11am-12pm', available: false },
    { startTime: '14:00', endTime: '15:00', display: '2pm-3pm', available: true },
  ];

  const defaultProps = {
    selectedDate: new Date('2024-01-15'),
    timeSlots: mockTimeSlots,
    selectedTimeSlot: null,
    onTimeSlotSelect: jest.fn(),
    isLoading: false,
    currentCalendarDate: new Date('2024-01-15'),
    hasError: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders time slots when date is selected and in current month', () => {
      render(<TimeSlotPicker {...defaultProps} />);
      
      expect(screen.getByText(/Available time slots for/)).toBeInTheDocument();
      expect(screen.getByText('9am-10am')).toBeInTheDocument();
      expect(screen.getByText('10am-11am')).toBeInTheDocument();
      expect(screen.getByText('11am-12pm')).toBeInTheDocument();
      expect(screen.getByText('2pm-3pm')).toBeInTheDocument();
    });

    it('does not render when selected date is not in current month', () => {
      const props = {
        ...defaultProps,
        selectedDate: new Date('2024-02-15'), // Different month
        currentCalendarDate: new Date('2024-01-15'),
      };

      const { container } = render(<TimeSlotPicker {...props} />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null when no date is selected', () => {
      const props = {
        ...defaultProps,
        selectedDate: null,
      };

      const { container } = render(<TimeSlotPicker {...props} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders no slots message when no time slots available', () => {
      const props = {
        ...defaultProps,
        timeSlots: [],
        isLoading: false,
      };

      render(<TimeSlotPicker {...props} />);
      expect(screen.getByText('No available time slots for this date.')).toBeInTheDocument();
    });

    it('renders with error styling when hasError is true', () => {
      const props = {
        ...defaultProps,
        hasError: true,
      };

      render(<TimeSlotPicker {...props} />);
      const container = screen.getByRole('region', { name: 'Time slot selection' });
      expect(container).toHaveClass('ring-border-error', 'ring-2', 'bg-red-50');
    });
  });

  describe('Loading States', () => {
    it('renders loading skeleton when isLoading is true', () => {
      const props = {
        ...defaultProps,
        isLoading: true,
      };

      render(<TimeSlotPicker {...props} />);
      
      expect(screen.getAllByLabelText('Loading time slots')).toHaveLength(2); // Container and spinner
      expect(screen.getByRole('status', { name: 'Loading time slots' })).toBeInTheDocument();
      
      // Should render 6 skeleton items
      const skeletonItems = document.querySelectorAll('.animate-pulse');
      expect(skeletonItems).toHaveLength(6);
    });

    it('shows loading overlay with spinner', () => {
      const props = {
        ...defaultProps,
        isLoading: true,
      };

      render(<TimeSlotPicker {...props} />);
      
      const spinner = screen.getByRole('status', { name: 'Loading time slots' });
      expect(spinner).toHaveClass('animate-spin');
    });
  });

  describe('Time Slot Interactions', () => {
    it('calls onTimeSlotSelect when available slot is clicked', async () => {
      const user = userEvent.setup();
      render(<TimeSlotPicker {...defaultProps} />);

      const availableSlot = screen.getByText('9am-10am');
      await user.click(availableSlot);

      expect(defaultProps.onTimeSlotSelect).toHaveBeenCalledWith('9am-10am');
      expect(defaultProps.onTimeSlotSelect).toHaveBeenCalledTimes(1);
    });

    it('does not call onTimeSlotSelect when unavailable slot is clicked', async () => {
      const user = userEvent.setup();
      render(<TimeSlotPicker {...defaultProps} />);

      const unavailableSlot = screen.getByText('11am-12pm');
      await user.click(unavailableSlot);

      expect(defaultProps.onTimeSlotSelect).not.toHaveBeenCalled();
    });

    it('shows selected state for selected time slot', () => {
      const props = {
        ...defaultProps,
        selectedTimeSlot: '9am-10am',
      };

      render(<TimeSlotPicker {...props} />);
      
      const selectedSlot = screen.getByText('9am-10am');
      expect(selectedSlot).toHaveClass('bg-primary', 'text-text-inverse');
      expect(selectedSlot).toHaveAttribute('aria-pressed', 'true');
    });

    it('shows disabled state for unavailable slots', () => {
      render(<TimeSlotPicker {...defaultProps} />);
      
      const unavailableSlot = screen.getByText('11am-12pm');
      expect(unavailableSlot).toHaveClass('cursor-not-allowed', 'line-through');
      expect(unavailableSlot).toBeDisabled();
      expect(unavailableSlot).toHaveAttribute('aria-label', '11am-12pm (not available)');
    });

    it('shows hover state for available slots', () => {
      render(<TimeSlotPicker {...defaultProps} />);
      
      const availableSlot = screen.getByText('10am-11am');
      expect(availableSlot).toHaveClass('hover:bg-surface-disabled');
      expect(availableSlot).not.toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<TimeSlotPicker {...defaultProps} />);
      
      expect(screen.getByRole('region', { name: 'Time slot selection' })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: 'Available time slots' })).toBeInTheDocument();
    });

    it('provides proper button labels for available slots', () => {
      render(<TimeSlotPicker {...defaultProps} />);
      
      const availableSlot = screen.getByLabelText('9am-10am');
      expect(availableSlot).toBeInTheDocument();
      expect(availableSlot).toHaveAttribute('type', 'button');
    });

    it('provides proper button labels for unavailable slots', () => {
      render(<TimeSlotPicker {...defaultProps} />);
      
      const unavailableSlot = screen.getByLabelText('11am-12pm (not available)');
      expect(unavailableSlot).toBeInTheDocument();
      expect(unavailableSlot).toBeDisabled();
    });

    it('has proper focus management', () => {
      render(<TimeSlotPicker {...defaultProps} />);
      
      const availableSlot = screen.getByText('9am-10am');
      expect(availableSlot).toHaveClass('focus-visible:ring-2', 'focus-visible:ring-border-focus');
    });

    it('announces loading state to screen readers', () => {
      const props = {
        ...defaultProps,
        isLoading: true,
      };

      render(<TimeSlotPicker {...props} />);
      
      expect(screen.getAllByLabelText('Loading time slots')).toHaveLength(2); // Container and spinner
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Grid Layout', () => {
    it('renders time slots in responsive grid', () => {
      render(<TimeSlotPicker {...defaultProps} />);
      
      const grid = screen.getByRole('group', { name: 'Available time slots' });
      expect(grid).toHaveClass('grid', 'grid-cols-2', 'sm:grid-cols-3');
    });

    it('renders correct number of time slots', () => {
      render(<TimeSlotPicker {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(4); // 4 time slots
    });
  });

  describe('Information Display', () => {
    it('shows arrival window information', () => {
      render(<TimeSlotPicker {...defaultProps} />);
      
      expect(screen.getByText('This is the arrival window not how long the job will take')).toBeInTheDocument();
    });

    it('formats date correctly in header', () => {
      const props = {
        ...defaultProps,
        selectedDate: new Date('2024-12-25'), // Christmas
        currentCalendarDate: new Date('2024-12-25'),
      };

      render(<TimeSlotPicker {...props} />);
      
      expect(screen.getByText(/Available time slots for.*December/)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles null selected date gracefully', () => {
      const props = {
        ...defaultProps,
        selectedDate: null,
      };

      const { container } = render(<TimeSlotPicker {...props} />);
      expect(container.firstChild).toBeNull();
    });

    it('handles empty time slots array', () => {
      const props = {
        ...defaultProps,
        timeSlots: [],
      };

      render(<TimeSlotPicker {...props} />);
      expect(screen.getByText('No available time slots for this date.')).toBeInTheDocument();
    });

    it('handles date in different year', () => {
      const props = {
        ...defaultProps,
        selectedDate: new Date('2025-01-15'),
        currentCalendarDate: new Date('2024-01-15'),
      };

      const { container } = render(<TimeSlotPicker {...props} />);
      expect(container.firstChild).toBeNull();
    });

    it('handles all slots unavailable', () => {
      const unavailableSlots: TimeSlot[] = [
        { startTime: '09:00', endTime: '10:00', display: '9am-10am', available: false },
        { startTime: '10:00', endTime: '11:00', display: '10am-11am', available: false },
      ];

      const props = {
        ...defaultProps,
        timeSlots: unavailableSlots,
      };

      render(<TimeSlotPicker {...props} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
        expect(button).toHaveClass('cursor-not-allowed');
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports keyboard interaction', async () => {
      const user = userEvent.setup();
      render(<TimeSlotPicker {...defaultProps} />);

      const firstSlot = screen.getByText('9am-10am');
      
      // Tab to the button and press Enter
      await user.tab();
      expect(firstSlot).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(defaultProps.onTimeSlotSelect).toHaveBeenCalledWith('9am-10am');
    });

    it('supports space key activation', async () => {
      const user = userEvent.setup();
      render(<TimeSlotPicker {...defaultProps} />);

      const firstSlot = screen.getByText('9am-10am');
      firstSlot.focus();
      
      await user.keyboard(' ');
      expect(defaultProps.onTimeSlotSelect).toHaveBeenCalledWith('9am-10am');
    });
  });

});
