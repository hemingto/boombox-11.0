/**
 * @fileoverview Tests for LocationZipInput component
 * Tests zip code validation, input handling, navigation, and accessibility
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationZipInput } from '@/components/ui/navigation/LocationZipInput';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('LocationZipInput', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    mockPush.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('renders input field with proper label', () => {
      render(<LocationZipInput />);
      
      const input = screen.getByLabelText(/enter your zip code/i);
      const label = screen.getByText('Zip Code');
      
      expect(input).toBeInTheDocument();
      expect(label).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', '94123');
    });

    it('renders search button', () => {
      render(<LocationZipInput />);
      
      const button = screen.getByRole('button', { name: /search all storage locations/i });
      expect(button).toBeInTheDocument();
    });

    it('accepts numeric input only', async () => {
      render(<LocationZipInput />);
      
      const input = screen.getByLabelText(/enter your zip code/i);
      
      // Type mixed characters
      await user.type(input, 'abc123def456');
      
      // Should only contain digits and be limited to 5 characters
      expect(input).toHaveValue('12345');
    });

    it('limits input to 5 characters', async () => {
      render(<LocationZipInput />);
      
      const input = screen.getByLabelText(/enter your zip code/i);
      
      // Type more than 5 digits
      await user.type(input, '123456789');
      
      // Should be limited to 5 digits
      expect(input).toHaveValue('12345');
    });
  });

  describe('Navigation Functionality', () => {
    it('navigates to locations with valid zip code', async () => {
      render(<LocationZipInput />);
      
      const input = screen.getByLabelText(/enter your zip code/i);
      const button = screen.getByRole('button');
      
      // Enter valid zip code
      await user.type(input, '94123');
      await user.click(button);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/locations?zipCode=94123');
      });
    });

    it('navigates to locations without query param for invalid zip', async () => {
      render(<LocationZipInput />);
      
      const input = screen.getByLabelText(/enter your zip code/i);
      const button = screen.getByRole('button');
      
      // Enter invalid zip code (less than 5 digits)
      await user.type(input, '941');
      await user.click(button);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/locations');
      });
    });

    it('navigates to locations without query param for empty input', async () => {
      render(<LocationZipInput />);
      
      const button = screen.getByRole('button');
      
      // Click without entering anything
      await user.click(button);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/locations');
      });
    });

    it('submits on Enter key press', async () => {
      render(<LocationZipInput />);
      
      const input = screen.getByLabelText(/enter your zip code/i);
      
      // Enter valid zip code and press Enter
      await user.type(input, '94123');
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/locations?zipCode=94123');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<LocationZipInput />);
      
      const input = screen.getByLabelText(/enter your zip code/i);
      
      expect(input).toHaveAttribute('aria-describedby', 'zip-help');
      expect(input).toHaveAttribute('inputMode', 'numeric');
      expect(input).toHaveAttribute('pattern', '[0-9]{5}');
    });

    it('has descriptive help text for screen readers', () => {
      render(<LocationZipInput />);
      
      const helpText = document.getElementById('zip-help');
      expect(helpText).toBeInTheDocument();
      expect(helpText).toHaveClass('sr-only');
      expect(helpText).toHaveTextContent(/enter a 5-digit zip code/i);
    });

    it('updates button aria-label based on input validity', async () => {
      render(<LocationZipInput />);
      
      const input = screen.getByLabelText(/enter your zip code/i);
      const button = screen.getByRole('button');
      
      // Initially should have generic label
      expect(button).toHaveAttribute('aria-label', 'Search all storage locations');
      
      // After entering valid zip
      await user.type(input, '94123');
      
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-label', 'Search storage locations for zip code 94123');
      });
    });
  });

  describe('Input Validation', () => {
    it('validates zip code format correctly', async () => {
      render(<LocationZipInput />);
      
      const input = screen.getByLabelText(/enter your zip code/i);
      const button = screen.getByRole('button');
      
      // Test invalid format
      await user.type(input, '1234');
      await user.click(button);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/locations');
      });
      
      mockPush.mockClear();
      
      // Test valid format
      await user.clear(input);
      await user.type(input, '94123');
      await user.click(button);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/locations?zipCode=94123');
      });
    });

    it('handles backspace correctly', async () => {
      render(<LocationZipInput />);
      
      const input = screen.getByLabelText(/enter your zip code/i);
      
      await user.type(input, '94123');
      expect(input).toHaveValue('94123');
      
      // Backspace should work normally
      await user.keyboard('{Backspace}');
      expect(input).toHaveValue('9412');
    });
  });

  describe('Component Props and State', () => {
    it('has correct display name', () => {
      expect(LocationZipInput.displayName).toBe('LocationZipInput');
    });

    it('maintains internal state correctly', async () => {
      render(<LocationZipInput />);
      
      const input = screen.getByLabelText(/enter your zip code/i);
      
      // State should update with input
      await user.type(input, '94123');
      expect(input).toHaveValue('94123');
      
      // State should clear
      await user.clear(input);
      expect(input).toHaveValue('');
    });
  });
});
