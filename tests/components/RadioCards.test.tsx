/**
 * @fileoverview Comprehensive Jest tests for RadioCards component
 * Tests component functionality, accessibility, error states, and user interactions
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RadioCards } from '@/components/forms/RadioCards';

// Mock icon component for testing
const MockIcon = () => <div data-testid="mock-icon">📦</div>;

describe('RadioCards', () => {
  const defaultProps = {
    id: 'test-radio',
    title: 'Test Storage Plan',
    description: 'This is a test storage plan description',
    plan: '$50/month',
    icon: <MockIcon />,
    checked: false,
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all required elements correctly', () => {
      render(<RadioCards {...defaultProps} />);

      expect(screen.getByText('Test Storage Plan')).toBeInTheDocument();
      expect(screen.getByText('This is a test storage plan description')).toBeInTheDocument();
      expect(screen.getByText('$50/month')).toBeInTheDocument();
      expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
      expect(screen.getByRole('radio')).toBeInTheDocument();
    });

    it('renders with correct ID attributes', () => {
      render(<RadioCards {...defaultProps} />);

      const radioInput = screen.getByRole('radio');
      const description = screen.getByText('This is a test storage plan description');

      expect(radioInput).toHaveAttribute('id', 'test-radio');
      expect(description).toHaveAttribute('id', 'test-radio-description');
    });
  });

  describe('Checked State', () => {
    it('sets radio input checked state correctly', () => {
      const { rerender } = render(<RadioCards {...defaultProps} checked={false} />);
      
      const radioInput = screen.getByRole('radio');
      expect(radioInput).not.toBeChecked();

      rerender(<RadioCards {...defaultProps} checked={true} />);
      expect(radioInput).toBeChecked();
    });
  });

  describe('Error State', () => {
    it('applies error text colors when hasError is true', () => {
      render(<RadioCards {...defaultProps} hasError={true} />);

      const title = screen.getByText('Test Storage Plan');
      const plan = screen.getByText('$50/month');
      const description = screen.getByText('This is a test storage plan description');

      expect(title).toHaveClass('text-status-error');
      expect(plan).toHaveClass('text-status-error');
      expect(description).toHaveClass('text-status-error');
    });

    it('applies error accent color to radio input when hasError is true', () => {
      render(<RadioCards {...defaultProps} hasError={true} />);

      const radioInput = screen.getByRole('radio');
      expect(radioInput).toHaveClass('accent-status-error');
    });
  });

  describe('User Interactions', () => {
    it('calls onChange when radio input is clicked', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();

      render(<RadioCards {...defaultProps} onChange={mockOnChange} />);

      const radioInput = screen.getByRole('radio');
      await user.click(radioInput);

      expect(mockOnChange).toHaveBeenCalledWith(
        'test-radio',
        '$50/month',
        'This is a test storage plan description'
      );
    });

    it('calls onChange when label is clicked', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();

      render(<RadioCards {...defaultProps} onChange={mockOnChange} />);

      const label = screen.getByRole('radio').closest('label');
      await user.click(label!);

      expect(mockOnChange).toHaveBeenCalledWith(
        'test-radio',
        '$50/month',
        'This is a test storage plan description'
      );
    });

    it('calls onClearError when provided and onChange is triggered', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();
      const mockOnClearError = jest.fn();

      render(
        <RadioCards
          {...defaultProps}
          onChange={mockOnChange}
          onClearError={mockOnClearError}
        />
      );

      const radioInput = screen.getByRole('radio');
      await user.click(radioInput);

      expect(mockOnChange).toHaveBeenCalled();
      expect(mockOnClearError).toHaveBeenCalled();
    });

    it('does not call onClearError when not provided', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();

      render(<RadioCards {...defaultProps} onChange={mockOnChange} />);

      const radioInput = screen.getByRole('radio');
      await user.click(radioInput);

      expect(mockOnChange).toHaveBeenCalled();
      // Should not throw error when onClearError is undefined
    });
  });

  describe('Keyboard Navigation', () => {
    it('handles Enter key press', () => {
      const mockOnChange = jest.fn();
      render(<RadioCards {...defaultProps} onChange={mockOnChange} />);

      const label = screen.getByRole('radio').closest('label');
      fireEvent.keyDown(label!, { key: 'Enter', code: 'Enter' });

      expect(mockOnChange).toHaveBeenCalledWith(
        'test-radio',
        '$50/month',
        'This is a test storage plan description'
      );
    });

    it('handles Space key press', () => {
      const mockOnChange = jest.fn();
      render(<RadioCards {...defaultProps} onChange={mockOnChange} />);

      const label = screen.getByRole('radio').closest('label');
      fireEvent.keyDown(label!, { key: ' ', code: 'Space' });

      expect(mockOnChange).toHaveBeenCalledWith(
        'test-radio',
        '$50/month',
        'This is a test storage plan description'
      );
    });

    it('ignores other key presses', () => {
      const mockOnChange = jest.fn();
      render(<RadioCards {...defaultProps} onChange={mockOnChange} />);

      const label = screen.getByRole('radio').closest('label');
      fireEvent.keyDown(label!, { key: 'Tab', code: 'Tab' });
      fireEvent.keyDown(label!, { key: 'Escape', code: 'Escape' });

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<RadioCards {...defaultProps} checked={true} />);

      const radioInput = screen.getByRole('radio');
      const description = screen.getByText('This is a test storage plan description');

      expect(radioInput).toHaveAttribute('aria-describedby', 'test-radio-description');
      expect(description).toHaveAttribute('id', 'test-radio-description');
    });

    it('marks icon as decorative with aria-hidden', () => {
      render(<RadioCards {...defaultProps} />);

      const iconContainer = screen.getByTestId('mock-icon').parentElement;
      expect(iconContainer).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty strings gracefully', () => {
      render(
        <RadioCards
          {...defaultProps}
          title=""
          description=""
          plan=""
        />
      );

      expect(screen.getByRole('radio')).toBeInTheDocument();
    });

    it('handles special characters in text content', () => {
      render(
        <RadioCards
          {...defaultProps}
          title="Storage & Moving Plan"
          description="Includes: boxes, tape & bubble wrap"
          plan="$50.99/month"
        />
      );

      expect(screen.getByText('Storage & Moving Plan')).toBeInTheDocument();
      expect(screen.getByText('Includes: boxes, tape & bubble wrap')).toBeInTheDocument();
      expect(screen.getByText('$50.99/month')).toBeInTheDocument();
    });

    it('maintains functionality with complex icon components', () => {
      const ComplexIcon = () => (
        <div>
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path d="M12 2L2 7v10c0 5.55 3.84 9.739 9 11 5.16-1.261 9-5.45 9-11V7l-10-5z"/>
          </svg>
        </div>
      );

      render(<RadioCards {...defaultProps} icon={<ComplexIcon />} />);

      expect(screen.getByRole('radio')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('renders with proper label structure', () => {
      render(<RadioCards {...defaultProps} />);

      const radioInput = screen.getByRole('radio');
      const label = radioInput.closest('label');
      
      expect(label).toBeInTheDocument();
      expect(label).toHaveAttribute('for', 'test-radio');
    });

    it('applies correct styling classes', () => {
      render(<RadioCards {...defaultProps} />);

      const label = screen.getByRole('radio').closest('label');
      expect(label).toHaveClass('cursor-pointer', 'transition-all', 'duration-200');
    });
  });
});