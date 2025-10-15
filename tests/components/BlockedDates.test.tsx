/**
 * @fileoverview Tests for BlockedDates component
 * @source Tests for boombox-10.0/src/app/components/mover-account/blockdates.tsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BlockedDates from '@/components/features/service-providers/calendar/BlockedDates';
import { format } from 'date-fns';

// Mock the fetch API
global.fetch = jest.fn();

// Mock the CustomDatePicker component
jest.mock('@/components/forms/CustomDatePicker', () => ({
  __esModule: true,
  default: ({ onDateChange, value, placeholder }: any) => (
    <div data-testid="custom-date-picker">
      <input
        type="text"
        placeholder={placeholder}
        value={value ? format(value, 'MM/dd/yyyy') : ''}
        onChange={(e) => {
          const date = e.target.value ? new Date(e.target.value) : null;
          onDateChange(e.target.value, date);
        }}
        data-testid="date-picker-input"
      />
    </div>
  ),
}));

describe('BlockedDates Component', () => {
  const mockDriverUserId = '123';
  const mockMoverUserId = '456';

  const mockBlockedDates = [
    { id: 1, blockedDate: '2024-12-25T00:00:00.000Z' },
    { id: 2, blockedDate: '2024-12-31T00:00:00.000Z' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the component with title', () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<BlockedDates userType="driver" userId={mockDriverUserId} />);

      expect(screen.getByText('Block Specific Dates')).toBeInTheDocument();
    });

    it('should render date picker and block button', () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<BlockedDates userType="driver" userId={mockDriverUserId} />);

      expect(screen.getByTestId('date-picker-input')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /block selected date/i })).toBeInTheDocument();
    });

    it('should render informational note', () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<BlockedDates userType="driver" userId={mockDriverUserId} />);

      expect(screen.getByText(/Note:/)).toBeInTheDocument();
      expect(
        screen.getByText(/Blocked dates will prevent any bookings/i)
      ).toBeInTheDocument();
    });
  });

  describe('API Integration - Driver', () => {
    it('should fetch blocked dates for driver on mount', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBlockedDates,
      });

      render(<BlockedDates userType="driver" userId={mockDriverUserId} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/drivers/${mockDriverUserId}/blocked-dates`
        );
      });

      expect(screen.getByText('December 25, 2024')).toBeInTheDocument();
      expect(screen.getByText('December 31, 2024')).toBeInTheDocument();
    });

    it('should add blocked date for driver', async () => {
      const newBlockedDate = { id: 3, blockedDate: '2025-01-01T00:00:00.000Z' };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => newBlockedDate,
        });

      render(<BlockedDates userType="driver" userId={mockDriverUserId} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /block selected date/i })).toBeInTheDocument();
      });

      // Select a date
      const dateInput = screen.getByTestId('date-picker-input');
      fireEvent.change(dateInput, { target: { value: '01/01/2025' } });

      // Click block button
      const blockButton = screen.getByRole('button', { name: /block selected date/i });
      fireEvent.click(blockButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/drivers/${mockDriverUserId}/blocked-dates`,
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ blockedDate: '01/01/2025' }),
          })
        );
      });
      
      await waitFor(() => {
        expect(screen.getByText('January 1, 2025')).toBeInTheDocument();
      });
    });

    it('should remove blocked date for driver', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBlockedDates,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        });

      render(<BlockedDates userType="driver" userId={mockDriverUserId} />);

      await waitFor(() => {
        expect(screen.getByText('December 25, 2024')).toBeInTheDocument();
      });

      const removeButtons = screen.getAllByRole('button', { name: /remove blocked date/i });
      fireEvent.click(removeButtons[0]);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/drivers/${mockDriverUserId}/blocked-dates/1`,
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });

      await waitFor(() => {
        expect(screen.queryByText('December 25, 2024')).not.toBeInTheDocument();
      });
    });
  });

  describe('API Integration - Moving Partner', () => {
    it('should fetch blocked dates for mover on mount', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBlockedDates,
      });

      render(<BlockedDates userType="mover" userId={mockMoverUserId} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/moving-partners/${mockMoverUserId}/blocked-dates`
        );
      });

      expect(screen.getByText('December 25, 2024')).toBeInTheDocument();
    });

    it('should add blocked date for mover', async () => {
      const newBlockedDate = { id: 3, blockedDate: '2025-01-01T00:00:00.000Z' };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => newBlockedDate,
        });

      render(<BlockedDates userType="mover" userId={mockMoverUserId} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /block selected date/i })).toBeInTheDocument();
      });

      // Select a date
      const dateInput = screen.getByTestId('date-picker-input');
      fireEvent.change(dateInput, { target: { value: '01/01/2025' } });

      // Click block button
      const blockButton = screen.getByRole('button', { name: /block selected date/i });
      fireEvent.click(blockButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/moving-partners/${mockMoverUserId}/blocked-dates`,
          expect.objectContaining({
            method: 'POST',
          })
        );
      });
      
      await waitFor(() => {
        expect(screen.getByText('January 1, 2025')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show skeleton loading state while fetching', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: async () => [],
              });
            }, 1000);
          })
      );

      render(<BlockedDates userType="driver" userId={mockDriverUserId} />);

      // Check for skeleton components (using class selector as Skeleton may not have specific role)
      const skeletons = document.querySelectorAll('.skeleton, [class*="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should show "Adding..." text when saving', async () => {
      let resolveAddBlockedDate: (value: any) => void;
      const addBlockedDatePromise = new Promise((resolve) => {
        resolveAddBlockedDate = resolve;
      });

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        })
        .mockReturnValueOnce(addBlockedDatePromise);

      render(<BlockedDates userType="driver" userId={mockDriverUserId} />);

      await waitFor(() => {
        expect(screen.getByTestId('date-picker-input')).toBeInTheDocument();
      });

      // Select a date
      const dateInput = screen.getByTestId('date-picker-input');
      fireEvent.change(dateInput, { target: { value: '01/01/2025' } });

      // Click block button
      const blockButton = screen.getByRole('button', { name: /block selected date/i });
      fireEvent.click(blockButton);

      // Check for "Adding..." text
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /adding blocked date/i })).toBeInTheDocument();
      });

      // Resolve the promise
      resolveAddBlockedDate!({
        ok: true,
        json: async () => ({ id: 3, blockedDate: '2025-01-01T00:00:00.000Z' }),
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no blocked dates', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<BlockedDates userType="driver" userId={mockDriverUserId} />);

      await waitFor(() => {
        expect(screen.getByText('No blocked dates')).toBeInTheDocument();
      });

      // Check for calendar icon (aria-hidden, so check by class or parent)
      const emptyState = screen.getByRole('status', { name: /no blocked dates/i });
      expect(emptyState).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error when fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Network error' }),
      });

      render(<BlockedDates userType="driver" userId={mockDriverUserId} />);

      await waitFor(() => {
        expect(screen.getByText(/Unable to load blocked dates/i)).toBeInTheDocument();
      });
    });

    it('should display error when adding blocked date fails', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Date already blocked' }),
        });

      render(<BlockedDates userType="driver" userId={mockDriverUserId} />);

      await waitFor(() => {
        expect(screen.getByTestId('date-picker-input')).toBeInTheDocument();
      });

      // Select a date
      const dateInput = screen.getByTestId('date-picker-input');
      fireEvent.change(dateInput, { target: { value: '01/01/2025' } });

      // Click block button
      const blockButton = screen.getByRole('button', { name: /block selected date/i });
      fireEvent.click(blockButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/Date already blocked/i);
      });
    });

    it('should display error when removing blocked date fails', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBlockedDates,
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Failed to remove' }),
        });

      render(<BlockedDates userType="driver" userId={mockDriverUserId} />);

      await waitFor(() => {
        expect(screen.getByText('December 25, 2024')).toBeInTheDocument();
      });

      const removeButtons = screen.getAllByRole('button', { name: /remove blocked date/i });
      fireEvent.click(removeButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/Failed to remove/i);
      });
    });

    it('should clear error when user selects a new date', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Date already blocked' }),
        });

      render(<BlockedDates userType="driver" userId={mockDriverUserId} />);

      await waitFor(() => {
        expect(screen.getByTestId('date-picker-input')).toBeInTheDocument();
      });

      // Select a date and trigger error
      const dateInput = screen.getByTestId('date-picker-input');
      fireEvent.change(dateInput, { target: { value: '01/01/2025' } });

      const blockButton = screen.getByRole('button', { name: /block selected date/i });
      fireEvent.click(blockButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // Select a new date - should clear error
      fireEvent.change(dateInput, { target: { value: '01/02/2025' } });

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });
  });

  describe('Button States', () => {
    it('should disable block button when no date selected', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<BlockedDates userType="driver" userId={mockDriverUserId} />);

      await waitFor(() => {
        const blockButton = screen.getByRole('button', { name: /block selected date/i });
        expect(blockButton).toBeDisabled();
      });
    });

    it('should enable block button when date is selected', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<BlockedDates userType="driver" userId={mockDriverUserId} />);

      await waitFor(() => {
        expect(screen.getByTestId('date-picker-input')).toBeInTheDocument();
      });

      // Select a date
      const dateInput = screen.getByTestId('date-picker-input');
      fireEvent.change(dateInput, { target: { value: '01/01/2025' } });

      const blockButton = screen.getByRole('button', { name: /block selected date/i });
      expect(blockButton).not.toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBlockedDates,
      });

      render(<BlockedDates userType="driver" userId={mockDriverUserId} />);

      await waitFor(() => {
        // Check for list with aria-label
        expect(screen.getByRole('list', { name: /blocked dates list/i })).toBeInTheDocument();

        // Check for list items
        const listItems = screen.getAllByRole('listitem');
        expect(listItems.length).toBe(2);
      });
    });

    it('should have proper error announcement', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Network error' }),
      });

      render(<BlockedDates userType="driver" userId={mockDriverUserId} />);

      await waitFor(() => {
        const errorAlert = screen.getByRole('alert');
        expect(errorAlert).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('should have descriptive remove button labels', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBlockedDates,
      });

      render(<BlockedDates userType="driver" userId={mockDriverUserId} />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /remove blocked date: december 25, 2024/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /remove blocked date: december 31, 2024/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe('Date Formatting', () => {
    it('should format dates correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, blockedDate: '2024-07-04T00:00:00.000Z' }],
      });

      render(<BlockedDates userType="driver" userId={mockDriverUserId} />);

      await waitFor(() => {
        expect(screen.getByText('July 4, 2024')).toBeInTheDocument();
      });
    });
  });
});

