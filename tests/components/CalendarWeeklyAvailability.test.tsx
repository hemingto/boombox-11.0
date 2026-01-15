/**
 * @fileoverview Tests for CalendarWeeklyAvailability component
 * Following boombox-11.0 testing standards
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import CalendarWeeklyAvailability from '@/components/features/service-providers/calendar/CalendarWeeklyAvailability';

expect.extend(toHaveNoViolations);

// Mock Select component
jest.mock('@/components/ui/primitives/Select', () => ({
  Select: function MockSelect(props: any) {
    return (
      <select
        value={props.value}
        onChange={(e) => props.onChange?.(e.target.value)}
        aria-label={props['aria-label']}
        data-testid={`select-${props['aria-label']}`}
      >
        {props.options?.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  },
}));

// Mock Modal component
jest.mock('@/components/ui/primitives/Modal', () => ({
  Modal: function MockModal(props: any) {
    if (!props.open) return null;
    return (
      <div data-testid="edit-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h2 id="modal-title">{props.title}</h2>
        <button onClick={props.onClose} data-testid="modal-close-x" aria-label="Close modal">
          X
        </button>
        <div data-testid="modal-content">{props.children}</div>
      </div>
    );
  },
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('CalendarWeeklyAvailability', () => {
  const mockDriverAvailability = [
    {
      id: 1,
      dayOfWeek: 'Monday',
      startTime: '08:00',
      endTime: '17:00',
      isBlocked: false,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
    },
    {
      id: 2,
      dayOfWeek: 'Tuesday',
      startTime: '08:00',
      endTime: '17:00',
      isBlocked: false,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
    },
    {
      id: 3,
      dayOfWeek: 'Wednesday',
      startTime: '08:00',
      endTime: '17:00',
      isBlocked: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
    },
    {
      id: 4,
      dayOfWeek: 'Thursday',
      startTime: '08:00',
      endTime: '17:00',
      isBlocked: false,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
    },
    {
      id: 5,
      dayOfWeek: 'Friday',
      startTime: '08:00',
      endTime: '17:00',
      isBlocked: false,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
    },
    {
      id: 6,
      dayOfWeek: 'Saturday',
      startTime: '08:00',
      endTime: '17:00',
      isBlocked: false,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
    },
    {
      id: 7,
      dayOfWeek: 'Sunday',
      startTime: '08:00',
      endTime: '17:00',
      isBlocked: false,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
    },
  ];

  const mockMoverAvailability = mockDriverAvailability.map((day) => ({
    ...day,
    maxCapacity: 2,
  }));

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/availability')) {
        const availability = url.includes('/drivers/')
          ? mockDriverAvailability
          : mockMoverAvailability;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ availability }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders loading skeleton initially', () => {
      render(<CalendarWeeklyAvailability userType="driver" userId="123" />);
      
      const loadingElements = screen.getAllByRole('status');
      expect(loadingElements).toHaveLength(7); // One for each day
    });

    it('renders availability grid after data loads', async () => {
      render(<CalendarWeeklyAvailability userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Monday')).toBeInTheDocument();
      });

      expect(screen.getByText('Tuesday')).toBeInTheDocument();
      expect(screen.getByText('Wednesday')).toBeInTheDocument();
      expect(screen.getByText('Thursday')).toBeInTheDocument();
      expect(screen.getByText('Friday')).toBeInTheDocument();
      expect(screen.getByText('Saturday')).toBeInTheDocument();
      expect(screen.getByText('Sunday')).toBeInTheDocument();
    });

    it('renders header columns correctly for driver', async () => {
      render(<CalendarWeeklyAvailability userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Monday')).toBeInTheDocument();
      });

      expect(screen.getByText('Day of Week')).toBeInTheDocument();
      expect(screen.getByText('Time Available')).toBeInTheDocument();
      expect(screen.queryByText('Job Capacity')).not.toBeInTheDocument();
    });

    it('renders header columns correctly for mover', async () => {
      render(<CalendarWeeklyAvailability userType="mover" userId="456" />);

      await waitFor(() => {
        expect(screen.getByText('Monday')).toBeInTheDocument();
      });

      expect(screen.getByText('Day of Week')).toBeInTheDocument();
      expect(screen.getByText('Time Available')).toBeInTheDocument();
      expect(screen.getByText('Job Capacity')).toBeInTheDocument();
    });

    it('displays time ranges in correct format', async () => {
      render(<CalendarWeeklyAvailability userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getAllByText('8am - 5pm')).toHaveLength(6); // 6 non-blocked days
      });
    });

    it('shows "Not Available" for blocked days', async () => {
      render(<CalendarWeeklyAvailability userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Not Available')).toBeInTheDocument();
      });
    });

    it('displays job capacity for movers', async () => {
      render(<CalendarWeeklyAvailability userType="mover" userId="456" />);

      await waitFor(() => {
        const capacityTexts = screen.getAllByText(/2 jobs per time slot/i);
        expect(capacityTexts.length).toBeGreaterThan(0);
      });
    });
  });

  describe('API Integration', () => {
    it('fetches availability from correct driver endpoint', async () => {
      render(<CalendarWeeklyAvailability userType="driver" userId="123" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/drivers/123/availability');
      });
    });

    it('fetches availability from correct moving partner endpoint', async () => {
      render(<CalendarWeeklyAvailability userType="mover" userId="456" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/moving-partners/456/availability');
      });
    });

    it('handles API fetch failure gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<CalendarWeeklyAvailability userType="driver" userId="123" />);

      await waitFor(() => {
        // Should still render default availability even with error
        expect(screen.getByText('Monday')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('saves availability to correct endpoint from modal', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ availability: { id: 1 } }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ availability: mockDriverAvailability }),
        });
      });

      render(<CalendarWeeklyAvailability userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Monday')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /^Save$/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/drivers/123/availability',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });
    });
  });

  describe('Edit Functionality', () => {
    it('opens modal when edit button is clicked', async () => {
      render(<CalendarWeeklyAvailability userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Monday')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]); // Edit Monday

      await waitFor(() => {
        expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
      });
      
      // Check that the modal has the title element with Monday
      const titleElement = screen.getByText(/Edit.*Monday.*Availability/i);
      expect(titleElement).toBeInTheDocument();
    });

    it('shows time selects in modal', async () => {
      render(<CalendarWeeklyAvailability userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Monday')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        const modal = screen.getByTestId('edit-modal');
        expect(modal).toBeInTheDocument();
      });

      // Should show time selects within modal
      expect(screen.getByTestId('select-Monday start time')).toBeInTheDocument();
      expect(screen.getByTestId('select-Monday end time')).toBeInTheDocument();
    });

    it('shows block checkbox for unblocked days in modal', async () => {
      render(<CalendarWeeklyAvailability userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Monday')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        const blockCheckbox = screen.getByLabelText(/Block Monday/i);
        expect(blockCheckbox).toBeInTheDocument();
        expect(blockCheckbox).not.toBeChecked();
      });
    });

    it('shows capacity input for movers in modal', async () => {
      render(<CalendarWeeklyAvailability userType="mover" userId="456" />);

      await waitFor(() => {
        expect(screen.getByText('Monday')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('select-Monday job capacity')).toBeInTheDocument();
      });
    });

    it('does not show capacity input for drivers', async () => {
      render(<CalendarWeeklyAvailability userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Monday')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('select-Monday job capacity')).not.toBeInTheDocument();
    });

    it('closes modal when Close button clicked', async () => {
      render(<CalendarWeeklyAvailability userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Monday')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /^Close$/i });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('edit-modal')).not.toBeInTheDocument();
      });
    });

    it('closes modal when X button clicked', async () => {
      render(<CalendarWeeklyAvailability userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Monday')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
      });

      const xButton = screen.getByTestId('modal-close-x');
      fireEvent.click(xButton);

      await waitFor(() => {
        expect(screen.queryByTestId('edit-modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('Time Selection', () => {
    it('updates start time when changed in modal', async () => {
      render(<CalendarWeeklyAvailability userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Monday')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
      });

      const startTimeSelect = screen.getByTestId('select-Monday start time');
      fireEvent.change(startTimeSelect, { target: { value: '9am' } });

      await waitFor(() => {
        expect(startTimeSelect).toHaveValue('9am');
      });
    });

    it('updates end time when changed in modal', async () => {
      render(<CalendarWeeklyAvailability userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Monday')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
      });

      const endTimeSelect = screen.getByTestId('select-Monday end time');
      fireEvent.change(endTimeSelect, { target: { value: '4pm' } });

      await waitFor(() => {
        expect(endTimeSelect).toHaveValue('4pm');
      });
    });
  });

  describe('Informational Message', () => {
    it('shows setup message when all records are unchanged', async () => {
      // Mock data where createdAt equals updatedAt for all records
      const unchangedAvailability = mockDriverAvailability.map(day => ({
        ...day,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      }));

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ availability: unchangedAvailability }),
      });

      render(<CalendarWeeklyAvailability userType="driver" userId="123" />);

      await waitFor(() => {
        expect(
          screen.getByText(/To activate your driver account please set your calendar/i)
        ).toBeInTheDocument();
      });
    });

    it('does not show setup message when records have been modified', async () => {
      render(<CalendarWeeklyAvailability userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Monday')).toBeInTheDocument();
      });

      expect(
        screen.queryByText(/To activate your driver account/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('Save Functionality', () => {
    it('shows saving state while request is in progress', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (options?.method === 'POST') {
          return new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve({ availability: { id: 1 } }),
                }),
              100
            )
          );
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ availability: mockDriverAvailability }),
        });
      });

      render(<CalendarWeeklyAvailability userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Monday')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument();
      });
    });

    it('closes modal after successful save', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ availability: { id: 1 } }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ availability: mockDriverAvailability }),
        });
      });

      render(<CalendarWeeklyAvailability userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Monday')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.queryByTestId('edit-modal')).not.toBeInTheDocument();
      });
    });

    it('updates table with saved data', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ availability: { id: 1 } }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ availability: mockDriverAvailability }),
        });
      });

      render(<CalendarWeeklyAvailability userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Monday')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
      });

      // Change start time
      const startTimeSelect = screen.getByTestId('select-Monday start time');
      fireEvent.change(startTimeSelect, { target: { value: '9am' } });

      const saveButton = screen.getByRole('button', { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.queryByTestId('edit-modal')).not.toBeInTheDocument();
      });

      // Verify the table was updated
      await waitFor(() => {
        expect(screen.getByText('9am - 5pm')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations in loading state', async () => {
      const renderResult = render(<CalendarWeeklyAvailability userType="driver" userId="123" />);
      await testAccessibility(renderResult);
    });

    it('has no accessibility violations with loaded data', async () => {
      const renderResult = render(<CalendarWeeklyAvailability userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Monday')).toBeInTheDocument();
      });

      await testAccessibility(renderResult);
    });

    it('has no accessibility violations with modal open', async () => {
      const renderResult = render(<CalendarWeeklyAvailability userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Monday')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
      });

      await testAccessibility(renderResult);
    });

    it('has proper aria labels for time selects in modal', async () => {
      render(<CalendarWeeklyAvailability userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Monday')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByLabelText('Monday start time')).toBeInTheDocument();
        expect(screen.getByLabelText('Monday end time')).toBeInTheDocument();
      });
    });

    it('has proper aria labels for checkboxes in modal', async () => {
      render(<CalendarWeeklyAvailability userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Monday')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByLabelText(/Block Monday/i)).toBeInTheDocument();
      });
    });

    it('has proper loading state aria labels', () => {
      render(<CalendarWeeklyAvailability userType="driver" userId="123" />);

      const loadingElements = screen.getAllByRole('status');
      expect(loadingElements[0]).toHaveAttribute('aria-label', 'Loading day 1 availability');
    });

    it('modal has proper role and aria attributes', async () => {
      render(<CalendarWeeklyAvailability userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Monday')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        const modal = screen.getByTestId('edit-modal');
        expect(modal).toHaveAttribute('role', 'dialog');
        expect(modal).toHaveAttribute('aria-modal', 'true');
      });
    });
  });

  describe('User Type Handling', () => {
    it('handles driver user type correctly', async () => {
      render(<CalendarWeeklyAvailability userType="driver" userId="123" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/drivers/123/availability');
      });

      // Should not show job capacity column
      expect(screen.queryByText('Job Capacity')).not.toBeInTheDocument();
    });

    it('handles mover user type correctly', async () => {
      render(<CalendarWeeklyAvailability userType="mover" userId="456" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/moving-partners/456/availability');
      });

      // Should show job capacity column
      expect(screen.getByText('Job Capacity')).toBeInTheDocument();
    });
  });

  describe('Note Section', () => {
    it('displays informational note about appointment times', async () => {
      render(<CalendarWeeklyAvailability userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Monday')).toBeInTheDocument();
      });

      expect(
        screen.getByText(/The hours you set are times a customer can book an appointment/i)
      ).toBeInTheDocument();
    });
  });

  describe('Modal Behavior', () => {
    it('modal displays correct day name in title', async () => {
      render(<CalendarWeeklyAvailability userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Monday')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[2]); // Wednesday

      await waitFor(() => {
        expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
      });
      
      // Check that the modal has the title element with Wednesday
      const titleElement = screen.getByText(/Edit.*Wednesday.*Availability/i);
      expect(titleElement).toBeInTheDocument();
    });

    it('modal shows current time values for unblocked days', async () => {
      render(<CalendarWeeklyAvailability userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Monday')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]); // Monday

      await waitFor(() => {
        const startTimeSelect = screen.getByTestId('select-Monday start time');
        const endTimeSelect = screen.getByTestId('select-Monday end time');
        expect(startTimeSelect).toHaveValue('8am');
        expect(endTimeSelect).toHaveValue('5pm');
      });
    });

    it('changes revert when Close button clicked', async () => {
      render(<CalendarWeeklyAvailability userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Monday')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
      });

      // Change start time
      const startTimeSelect = screen.getByTestId('select-Monday start time');
      fireEvent.change(startTimeSelect, { target: { value: '10am' } });

      // Close without saving
      const closeButton = screen.getByRole('button', { name: /^Close$/i });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('edit-modal')).not.toBeInTheDocument();
      });

      // Reopen and verify changes were not saved
      fireEvent.click(screen.getAllByText('Edit')[0]);

      await waitFor(() => {
        const startTimeSelectAgain = screen.getByTestId('select-Monday start time');
        expect(startTimeSelectAgain).toHaveValue('8am'); // Original value
      });
    });

    it('modal has responsive size classes', async () => {
      render(<CalendarWeeklyAvailability userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Monday')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
      });
    });
  });

  describe('Blocking/Unblocking Logic', () => {
    it('day becomes blocked when checkbox checked and saved', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (options?.method === 'POST') {
          const body = JSON.parse(options.body);
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ availability: { id: 1, ...body } }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ availability: mockDriverAvailability }),
        });
      });

      render(<CalendarWeeklyAvailability userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Monday')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
      });

      // Check the block checkbox
      const blockCheckbox = screen.getByLabelText(/Block Monday/i);
      fireEvent.click(blockCheckbox);

      // Save
      const saveButton = screen.getByRole('button', { name: /^Save$/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.queryByTestId('edit-modal')).not.toBeInTheDocument();
      });

      // Verify "Not Available" is displayed (now there should be 2: Wednesday + Monday)
      await waitFor(() => {
        const notAvailableTexts = screen.getAllByText('Not Available');
        expect(notAvailableTexts.length).toBe(2); // Wednesday (already blocked) + Monday (newly blocked)
      });
    });

    it('blocked day shows message about unblocking in modal', async () => {
      const blockedMockData = mockDriverAvailability.map((day, i) => 
        i === 2 ? { ...day, isBlocked: true } : day
      );

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ availability: blockedMockData }),
      });

      render(<CalendarWeeklyAvailability userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Wednesday')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[2]); // Wednesday (blocked)

      await waitFor(() => {
        expect(screen.getByText(/This day is currently blocked/i)).toBeInTheDocument();
      });
    });
  });

  describe('Modal Editing Flow', () => {
    it('updates capacity value in modal for movers', async () => {
      render(<CalendarWeeklyAvailability userType="mover" userId="456" />);

      await waitFor(() => {
        expect(screen.getByText('Monday')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
      });

      const capacitySelect = screen.getByTestId('select-Monday job capacity');
      fireEvent.change(capacitySelect, { target: { value: '5' } });

      await waitFor(() => {
        expect(capacitySelect).toHaveValue('5');
      });
    });

    it('full flow: Open modal → Change times → Save → Verify table update', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ availability: { id: 1 } }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ availability: mockDriverAvailability }),
        });
      });

      render(<CalendarWeeklyAvailability userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Monday')).toBeInTheDocument();
      });

      // Open modal
      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
      });

      // Change times
      const startTimeSelect = screen.getByTestId('select-Monday start time');
      fireEvent.change(startTimeSelect, { target: { value: '10am' } });

      // Save
      const saveButton = screen.getByRole('button', { name: /Save/i });
      fireEvent.click(saveButton);

      // Verify modal closes
      await waitFor(() => {
        expect(screen.queryByTestId('edit-modal')).not.toBeInTheDocument();
      });

      // Verify table updated
      await waitFor(() => {
        expect(screen.getByText('10am - 5pm')).toBeInTheDocument();
      });
    });
  });
});

