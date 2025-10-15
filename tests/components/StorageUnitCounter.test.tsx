/**
 * @fileoverview Jest tests for StorageUnitCounter component
 * @source boombox-10.0/src/app/components/reusablecomponents/storageunitcounter.tsx (test coverage)
 * 
 * TEST COVERAGE:
 * - Component rendering and initial state
 * - Counter increment/decrement functionality
 * - Availability API integration and error handling
 * - Accessibility features (ARIA labels, keyboard navigation)
 * - Design system color application
 * - Focus management and user interactions
 * - Edge cases (zero availability, API errors)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import StorageUnitCounter from '@/components/forms/StorageUnitCounter';

// Mock the custom hook
jest.mock('@/hooks/useStorageUnitAvailability');
import { useStorageUnitAvailability } from '@/hooks/useStorageUnitAvailability';

const mockUseStorageUnitAvailability = useStorageUnitAvailability as jest.MockedFunction<typeof useStorageUnitAvailability>;

// Mock the StorageUnitIcon component
jest.mock('@/components/icons/StorageUnitIcon', () => ({
  StorageUnitIcon: ({ className, 'aria-hidden': ariaHidden }: { className: string; 'aria-hidden': boolean }) => (
    <div data-testid="storage-unit-icon" className={className} aria-hidden={ariaHidden}>
      Storage Unit Icon
    </div>
  ),
}));

describe('StorageUnitCounter', () => {
  const defaultProps = {
    onCountChange: jest.fn(),
    initialCount: 1,
  };

  const mockHookReturn = {
    availableUnits: 10,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseStorageUnitAvailability.mockReturnValue(mockHookReturn);
  });

  describe('Rendering', () => {
    it('renders with initial count', () => {
      render(<StorageUnitCounter {...defaultProps} />);
      
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('Boombox Storage Unit')).toBeInTheDocument();
      expect(screen.getByText('studio apartment')).toBeInTheDocument();
    });

    it('renders plural form for multiple units', async () => {
      render(<StorageUnitCounter {...defaultProps} initialCount={2} />);
      
      await waitFor(() => {
        expect(screen.getByText('Boombox Storage Units')).toBeInTheDocument();
        expect(screen.getByText('1 bedroom apt')).toBeInTheDocument();
      });
    });

    it('displays storage unit icon', () => {
      render(<StorageUnitCounter {...defaultProps} />);
      
      expect(screen.getByTestId('storage-unit-icon')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<StorageUnitCounter {...defaultProps} className="custom-class" />);
      
      const container = screen.getByRole('spinbutton').closest('.custom-class');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Counter Functionality', () => {
    it('increments counter when plus button is clicked', async () => {
      const user = userEvent.setup();
      const onCountChange = jest.fn();
      
      render(<StorageUnitCounter {...defaultProps} onCountChange={onCountChange} />);
      
      const incrementButton = screen.getByLabelText(/increase to 2 storage units/i);
      await user.click(incrementButton);
      
      await waitFor(() => {
        expect(onCountChange).toHaveBeenCalledWith(2, '1 bedroom apt');
      });
    });

    it('decrements counter when minus button is clicked', async () => {
      const user = userEvent.setup();
      const onCountChange = jest.fn();
      
      render(<StorageUnitCounter {...defaultProps} initialCount={2} onCountChange={onCountChange} />);
      
      await waitFor(() => {
        const decrementButton = screen.getByLabelText(/decrease to 1 storage unit/i);
        user.click(decrementButton);
      });
      
      await waitFor(() => {
        expect(onCountChange).toHaveBeenCalledWith(1, 'studio apartment');
      });
    });

    it('does not decrement below minimum (1)', async () => {
      const user = userEvent.setup();
      const onCountChange = jest.fn();
      
      render(<StorageUnitCounter {...defaultProps} onCountChange={onCountChange} />);
      
      const decrementButton = screen.getByLabelText(/decrease to 0 storage units/i);
      expect(decrementButton).toBeDisabled();
      
      await user.click(decrementButton);
      expect(onCountChange).not.toHaveBeenCalledWith(0, expect.any(String));
    });

    it('does not increment above maximum (4)', async () => {
      const user = userEvent.setup();
      const onCountChange = jest.fn();
      
      render(<StorageUnitCounter {...defaultProps} initialCount={4} onCountChange={onCountChange} />);
      
      await waitFor(() => {
        const incrementButton = screen.getByLabelText(/increase to 5 storage units/i);
        expect(incrementButton).toBeDisabled();
      });
    });

    it('respects availability limits', async () => {
      mockUseStorageUnitAvailability.mockReturnValue({
        ...mockHookReturn,
        availableUnits: 2,
      });
      
      const user = userEvent.setup();
      render(<StorageUnitCounter {...defaultProps} initialCount={2} />);
      
      await waitFor(() => {
        const incrementButton = screen.getByLabelText(/increase to 3 storage units/i);
        expect(incrementButton).toBeDisabled();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('handles arrow up key to increment', async () => {
      const user = userEvent.setup();
      const onCountChange = jest.fn();
      
      render(<StorageUnitCounter {...defaultProps} onCountChange={onCountChange} />);
      
      const spinbutton = screen.getByRole('spinbutton');
      await user.click(spinbutton);
      await user.keyboard('{ArrowUp}');
      
      await waitFor(() => {
        expect(onCountChange).toHaveBeenCalledWith(2, '1 bedroom apt');
      });
    });

    it('handles arrow down key to decrement', async () => {
      const user = userEvent.setup();
      const onCountChange = jest.fn();
      
      render(<StorageUnitCounter {...defaultProps} initialCount={2} onCountChange={onCountChange} />);
      
      const spinbutton = screen.getByRole('spinbutton');
      await user.click(spinbutton);
      await user.keyboard('{ArrowDown}');
      
      await waitFor(() => {
        expect(onCountChange).toHaveBeenCalledWith(1, 'studio apartment');
      });
    });

    it('handles Home key to go to minimum', async () => {
      const user = userEvent.setup();
      const onCountChange = jest.fn();
      
      render(<StorageUnitCounter {...defaultProps} initialCount={3} onCountChange={onCountChange} />);
      
      const spinbutton = screen.getByRole('spinbutton');
      await user.click(spinbutton);
      await user.keyboard('{Home}');
      
      await waitFor(() => {
        expect(onCountChange).toHaveBeenCalledWith(1, 'studio apartment');
      });
    });

    it('handles End key to go to maximum', async () => {
      const user = userEvent.setup();
      const onCountChange = jest.fn();
      
      render(<StorageUnitCounter {...defaultProps} onCountChange={onCountChange} />);
      
      const spinbutton = screen.getByRole('spinbutton');
      await user.click(spinbutton);
      await user.keyboard('{End}');
      
      await waitFor(() => {
        expect(onCountChange).toHaveBeenCalledWith(4, 'full house');
      });
    });
  });

  describe('Availability Display', () => {
    it('shows availability warning for low units', () => {
      mockUseStorageUnitAvailability.mockReturnValue({
        ...mockHookReturn,
        availableUnits: 2,
      });
      
      render(<StorageUnitCounter {...defaultProps} />);
      
      expect(screen.getByText('2 units left')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveClass('badge-error');
    });

    it('shows availability warning for medium units', () => {
      mockUseStorageUnitAvailability.mockReturnValue({
        ...mockHookReturn,
        availableUnits: 5,
      });
      
      render(<StorageUnitCounter {...defaultProps} />);
      
      expect(screen.getByText('5 units left')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveClass('badge-warning');
    });

    it('shows no availability message when zero units', () => {
      mockUseStorageUnitAvailability.mockReturnValue({
        ...mockHookReturn,
        availableUnits: 0,
      });
      
      render(<StorageUnitCounter {...defaultProps} />);
      
      expect(screen.getByText('No units available')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveClass('badge-error');
    });

    it('shows loading state', () => {
      mockUseStorageUnitAvailability.mockReturnValue({
        ...mockHookReturn,
        isLoading: true,
        availableUnits: null,
      });
      
      render(<StorageUnitCounter {...defaultProps} />);
      
      expect(screen.getByText('Checking availability...')).toBeInTheDocument();
    });

    it('shows error state', () => {
      mockUseStorageUnitAvailability.mockReturnValue({
        ...mockHookReturn,
        error: 'Network error',
        availableUnits: 0,
      });
      
      render(<StorageUnitCounter {...defaultProps} />);
      
      expect(screen.getByText('Unable to check availability')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('does not show availability badge for high availability', () => {
      mockUseStorageUnitAvailability.mockReturnValue({
        ...mockHookReturn,
        availableUnits: 15,
      });
      
      render(<StorageUnitCounter {...defaultProps} />);
      
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<StorageUnitCounter {...defaultProps} />);
      
      const spinbutton = screen.getByRole('spinbutton');
      expect(spinbutton).toHaveAttribute('aria-label', 'Number of storage units');
      expect(spinbutton).toHaveAttribute('aria-valuenow', '1');
      expect(spinbutton).toHaveAttribute('aria-valuemin', '1');
      expect(spinbutton).toHaveAttribute('aria-valuemax', '4');
      expect(spinbutton).toHaveAttribute('aria-describedby', 'storage-unit-description availability-status');
    });

    it('has proper button labels', async () => {
      render(<StorageUnitCounter {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/decrease to 0 storage units/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/increase to 2 storage units/i)).toBeInTheDocument();
      });
    });

    it('has screen reader status updates', () => {
      mockUseStorageUnitAvailability.mockReturnValue({
        ...mockHookReturn,
        availableUnits: 5,
      });
      
      render(<StorageUnitCounter {...defaultProps} />);
      
      const statusElement = screen.getByText('5 storage units available');
      expect(statusElement).toHaveClass('sr-only');
      expect(statusElement).toHaveAttribute('aria-live', 'polite');
    });

    it('disables component when no units available', () => {
      mockUseStorageUnitAvailability.mockReturnValue({
        ...mockHookReturn,
        availableUnits: 0,
      });
      
      render(<StorageUnitCounter {...defaultProps} />);
      
      const spinbutton = screen.getByRole('spinbutton');
      expect(spinbutton).toHaveAttribute('aria-disabled', 'true');
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('supports disabled prop', () => {
      render(<StorageUnitCounter {...defaultProps} disabled />);
      
      const spinbutton = screen.getByRole('spinbutton');
      expect(spinbutton).toHaveAttribute('tabindex', '-1');
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('tabindex', '-1');
      });
    });
  });

  describe('Focus Management', () => {
    it('manages focus state correctly', async () => {
      const user = userEvent.setup();
      render(<StorageUnitCounter {...defaultProps} />);
      
      const spinbutton = screen.getByRole('spinbutton');
      
      // Focus the component
      await user.click(spinbutton);
      expect(spinbutton).toHaveFocus();
      
      // Check focus styling is applied
      expect(spinbutton).toHaveClass('ring-2', 'ring-border-focus');
    });

    it('handles click outside to blur', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <StorageUnitCounter {...defaultProps} />
          <button>Outside button</button>
        </div>
      );
      
      const spinbutton = screen.getByRole('spinbutton');
      const outsideButton = screen.getByText('Outside button');
      
      // Focus the component
      await user.click(spinbutton);
      expect(spinbutton).toHaveClass('ring-2', 'ring-border-focus');
      
      // Click outside
      await user.click(outsideButton);
      
      await waitFor(() => {
        expect(spinbutton).not.toHaveClass('ring-2', 'ring-border-focus');
      });
    });
  });

  describe('Storage Unit Text Mapping', () => {
    const testCases = [
      { count: 1, expected: 'studio apartment' },
      { count: 2, expected: '1 bedroom apt' },
      { count: 3, expected: '2 bedroom apt' },
      { count: 4, expected: 'full house' },
    ];

    testCases.forEach(({ count, expected }) => {
      it(`returns "${expected}" for ${count} unit${count !== 1 ? 's' : ''}`, async () => {
        const onCountChange = jest.fn();
        render(<StorageUnitCounter {...defaultProps} initialCount={count} onCountChange={onCountChange} />);
        
        await waitFor(() => {
          expect(onCountChange).toHaveBeenCalledWith(count, expected);
        });
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles null availability gracefully', () => {
      mockUseStorageUnitAvailability.mockReturnValue({
        ...mockHookReturn,
        availableUnits: null,
      });
      
      render(<StorageUnitCounter {...defaultProps} />);
      
      // Should still render without crashing
      expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    });

    it('initializes with availability constraints', async () => {
      mockUseStorageUnitAvailability.mockReturnValue({
        ...mockHookReturn,
        availableUnits: 2,
      });
      
      const onCountChange = jest.fn();
      render(<StorageUnitCounter {...defaultProps} initialCount={5} onCountChange={onCountChange} />);
      
      await waitFor(() => {
        expect(onCountChange).toHaveBeenCalledWith(2, '1 bedroom apt');
      });
    });

    it('handles zero availability initialization', async () => {
      mockUseStorageUnitAvailability.mockReturnValue({
        ...mockHookReturn,
        availableUnits: 0,
      });
      
      const onCountChange = jest.fn();
      render(<StorageUnitCounter {...defaultProps} initialCount={3} onCountChange={onCountChange} />);
      
      await waitFor(() => {
        expect(onCountChange).toHaveBeenCalledWith(1, 'studio apartment');
      });
    });
  });
});
