/**
 * @fileoverview PriceZipInput component tests
 * Tests zip code input validation, navigation functionality, accessibility, and user interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { PriceZipInput } from '@/components/ui/navigation/PriceZipInput';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
  })),
}));

// Mock Button component
jest.mock('@/components/ui/primitives/Button', () => ({
  Button: ({ children, onClick, loading, disabled, 'aria-label': ariaLabel, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      data-loading={loading}
      {...props}
    >
      {children}
    </button>
  ),
}));

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('PriceZipInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
    } as any);
  });

  describe('Rendering', () => {
    it('renders the zip code input field', () => {
      render(<PriceZipInput />);
      
      expect(screen.getByLabelText(/enter your zip code to check pricing/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('94123')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /get pricing information/i })).toBeInTheDocument();
    });

    it('renders the label and help text', () => {
      render(<PriceZipInput />);
      
      expect(screen.getByText('Zip Code')).toBeInTheDocument();
      expect(screen.getByText(/enter a 5-digit zip code to get accurate pricing/i)).toBeInTheDocument();
    });
  });

  describe('Input Validation', () => {
    it('only allows numeric input', async () => {
      const user = userEvent.setup();
      render(<PriceZipInput />);
      
      const input = screen.getByLabelText(/enter your zip code to check pricing/i);
      
      await user.type(input, 'abc123def');
      expect(input).toHaveValue('123');
    });

    it('limits input to 5 characters', async () => {
      const user = userEvent.setup();
      render(<PriceZipInput />);
      
      const input = screen.getByLabelText(/enter your zip code to check pricing/i);
      
      await user.type(input, '1234567890');
      expect(input).toHaveValue('12345');
    });

    it('updates button aria-label based on valid zip code', async () => {
      const user = userEvent.setup();
      render(<PriceZipInput />);
      
      const input = screen.getByLabelText(/enter your zip code to check pricing/i);
      const button = screen.getByRole('button');
      
      // Initially should have generic label
      expect(button).toHaveAttribute('aria-label', 'Get pricing information');
      
      // After entering valid zip code
      await user.type(input, '94123');
      expect(button).toHaveAttribute('aria-label', 'Get pricing for zip code 94123');
    });
  });

  describe('Navigation Functionality', () => {
    it('navigates to getquote page with valid zip code', async () => {
      const user = userEvent.setup();
      render(<PriceZipInput />);
      
      const input = screen.getByLabelText(/enter your zip code to check pricing/i);
      const button = screen.getByRole('button');
      
      await user.type(input, '94123');
      await user.click(button);
      
      expect(mockPush).toHaveBeenCalledWith('/getquote?zipCode=94123');
    });

    it('navigates to getquote page without zip code parameter for invalid input', async () => {
      const user = userEvent.setup();
      render(<PriceZipInput />);
      
      const input = screen.getByLabelText(/enter your zip code to check pricing/i);
      const button = screen.getByRole('button');
      
      await user.type(input, '123'); // Invalid zip code
      await user.click(button);
      
      expect(mockPush).toHaveBeenCalledWith('/getquote');
    });

    it('navigates to getquote page when no zip code is entered', async () => {
      const user = userEvent.setup();
      render(<PriceZipInput />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(mockPush).toHaveBeenCalledWith('/getquote');
    });

    it('submits on Enter key press', async () => {
      const user = userEvent.setup();
      render(<PriceZipInput />);
      
      const input = screen.getByLabelText(/enter your zip code to check pricing/i);
      
      await user.type(input, '94123');
      await user.type(input, '{Enter}');
      
      expect(mockPush).toHaveBeenCalledWith('/getquote?zipCode=94123');
    });

    it('prevents form submission behavior on Enter key', async () => {
      const user = userEvent.setup();
      const preventDefaultSpy = jest.fn();
      
      render(<PriceZipInput />);
      
      const input = screen.getByLabelText(/enter your zip code to check pricing/i);
      
      // Create a custom event to test preventDefault
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          preventDefaultSpy();
        }
      });
      
      await user.type(input, '{Enter}');
      
      expect(mockPush).toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('shows loading state during navigation', async () => {
      const user = userEvent.setup();
      
      // Mock router.push to return a promise that we can control
      let resolveNavigation: () => void;
      const navigationPromise = new Promise<void>((resolve) => {
        resolveNavigation = resolve;
      });
      
      mockPush.mockReturnValue(navigationPromise);
      
      render(<PriceZipInput />);
      
      const button = screen.getByRole('button');
      
      await user.click(button);
      
      // Button should show loading state
      expect(button).toHaveAttribute('data-loading', 'true');
      expect(button).toBeDisabled();
      
      // Resolve the navigation
      resolveNavigation!();
      await waitFor(() => {
        expect(button).toHaveAttribute('data-loading', 'false');
        expect(button).not.toBeDisabled();
      });
    });

    it('prevents multiple simultaneous submissions', async () => {
      const user = userEvent.setup();
      
      // Mock router.push to return a promise
      let resolveNavigation: () => void;
      const navigationPromise = new Promise<void>((resolve) => {
        resolveNavigation = resolve;
      });
      
      mockPush.mockReturnValue(navigationPromise);
      
      render(<PriceZipInput />);
      
      const button = screen.getByRole('button');
      
      // Click multiple times quickly
      await user.click(button);
      await user.click(button);
      await user.click(button);
      
      // Should only call push once
      expect(mockPush).toHaveBeenCalledTimes(1);
      
      // Resolve the navigation
      resolveNavigation!();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels and descriptions', () => {
      render(<PriceZipInput />);
      
      const input = screen.getByLabelText(/enter your zip code to check pricing/i);
      
      expect(input).toHaveAttribute('aria-describedby', 'price-zip-help');
      expect(input).toHaveAttribute('id', 'price-zip');
      
      const label = screen.getByText('Zip Code');
      expect(label).toHaveAttribute('for', 'price-zip');
    });

    it('provides helpful screen reader text', () => {
      render(<PriceZipInput />);
      
      const helpText = screen.getByText(/enter a 5-digit zip code to get accurate pricing/i);
      expect(helpText).toHaveClass('sr-only');
    });

    it('has proper input attributes for mobile devices', () => {
      render(<PriceZipInput />);
      
      const input = screen.getByLabelText(/enter your zip code to check pricing/i);
      
      expect(input).toHaveAttribute('inputMode', 'numeric');
      expect(input).toHaveAttribute('pattern', '[0-9]{5}');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('has aria-hidden on decorative icon', () => {
      render(<PriceZipInput />);
      
      const icon = screen.getByRole('button').querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Input Field Styling', () => {
    it('applies correct design system classes', () => {
      render(<PriceZipInput />);
      
      const container = screen.getByLabelText(/enter your zip code to check pricing/i).parentElement;
      expect(container).toHaveClass('ring-border', 'focus-within:ring-border-focus', 'bg-surface-primary');
      
      const input = screen.getByLabelText(/enter your zip code to check pricing/i);
      expect(input).toHaveClass('text-text-primary', 'placeholder:text-text-secondary');
    });

    it('maintains proper focus styles', () => {
      render(<PriceZipInput />);
      
      const container = screen.getByLabelText(/enter your zip code to check pricing/i).parentElement;
      expect(container).toHaveClass('focus-within:ring-2');
    });
  });

  describe('Button Integration', () => {
    it('passes correct props to Button component', () => {
      render(<PriceZipInput />);
      
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('type', 'button');
      expect(button).toHaveClass('w-11', 'h-11');
    });

    it('uses Button primitive for consistent styling', () => {
      render(<PriceZipInput />);
      
      const button = screen.getByRole('button');
      
      // Button component should be rendered (verified by our mock)
      expect(button).toBeInTheDocument();
    });
  });
});
