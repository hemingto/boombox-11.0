/**
 * @fileoverview Comprehensive Jest tests for YesOrNoRadio component
 * Tests component functionality, accessibility, user interactions, and error states
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import YesOrNoRadio from '@/components/forms/YesOrNoRadio';

describe('YesOrNoRadio Component', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Basic Rendering', () => {
    it('renders with default Yes/No labels', () => {
      render(<YesOrNoRadio value={null} onChange={mockOnChange} />);
      
      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();
    });

    it('renders with custom labels', () => {
      render(
        <YesOrNoRadio 
          value={null} 
          onChange={mockOnChange} 
          yesLabel="Agree" 
          noLabel="Disagree" 
        />
      );
      
      expect(screen.getByText('Agree')).toBeInTheDocument();
      expect(screen.getByText('Disagree')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <YesOrNoRadio 
          value={null} 
          onChange={mockOnChange} 
          className="custom-class" 
        />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Selection States', () => {
    it('shows Yes as selected when value matches yesLabel', () => {
      render(<YesOrNoRadio value="Yes" onChange={mockOnChange} />);
      
      const yesButton = screen.getByText('Yes').parentElement;
      const noButton = screen.getByText('No').parentElement;
      
      expect(yesButton).toHaveAttribute('aria-checked', 'true');
      expect(noButton).toHaveAttribute('aria-checked', 'false');
    });

    it('shows No as selected when value matches noLabel', () => {
      render(<YesOrNoRadio value="No" onChange={mockOnChange} />);
      
      const yesButton = screen.getByText('Yes').parentElement;
      const noButton = screen.getByText('No').parentElement;
      
      expect(yesButton).toHaveAttribute('aria-checked', 'false');
      expect(noButton).toHaveAttribute('aria-checked', 'true');
    });

    it('shows custom label as selected when value matches', () => {
      render(
        <YesOrNoRadio 
          value="Agree" 
          onChange={mockOnChange} 
          yesLabel="Agree" 
          noLabel="Disagree" 
        />
      );
      
      const agreeButton = screen.getByText('Agree').parentElement;
      const disagreeButton = screen.getByText('Disagree').parentElement;
      
      expect(agreeButton).toHaveAttribute('aria-checked', 'true');
      expect(disagreeButton).toHaveAttribute('aria-checked', 'false');
    });

    it('shows no selection when value is null', () => {
      render(<YesOrNoRadio value={null} onChange={mockOnChange} />);
      
      const yesButton = screen.getByText('Yes').parentElement;
      const noButton = screen.getByText('No').parentElement;
      
      expect(yesButton).toHaveAttribute('aria-checked', 'false');
      expect(noButton).toHaveAttribute('aria-checked', 'false');
    });
  });

  describe('User Interactions', () => {
    it('calls onChange with Yes when Yes button is clicked', async () => {
      const user = userEvent.setup();
      render(<YesOrNoRadio value={null} onChange={mockOnChange} />);
      
      const yesButton = screen.getByText('Yes');
      await user.click(yesButton);
      
      expect(mockOnChange).toHaveBeenCalledWith('Yes');
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it('calls onChange with No when No button is clicked', async () => {
      const user = userEvent.setup();
      render(<YesOrNoRadio value={null} onChange={mockOnChange} />);
      
      const noButton = screen.getByText('No');
      await user.click(noButton);
      
      expect(mockOnChange).toHaveBeenCalledWith('No');
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it('calls onChange with custom labels when clicked', async () => {
      const user = userEvent.setup();
      render(
        <YesOrNoRadio 
          value={null} 
          onChange={mockOnChange} 
          yesLabel="Accept" 
          noLabel="Decline" 
        />
      );
      
      const acceptButton = screen.getByText('Accept');
      const declineButton = screen.getByText('Decline');
      
      await user.click(acceptButton);
      expect(mockOnChange).toHaveBeenCalledWith('Accept');
      
      await user.click(declineButton);
      expect(mockOnChange).toHaveBeenCalledWith('Decline');
    });

    it('allows switching between options', async () => {
      const user = userEvent.setup();
      render(<YesOrNoRadio value="Yes" onChange={mockOnChange} />);
      
      const noButton = screen.getByText('No');
      await user.click(noButton);
      
      expect(mockOnChange).toHaveBeenCalledWith('No');
    });
  });

  describe('Keyboard Navigation', () => {
    it('responds to Enter key on Yes button', () => {
      render(<YesOrNoRadio value={null} onChange={mockOnChange} />);
      
      const yesButton = screen.getByText('Yes');
      fireEvent.keyDown(yesButton, { key: 'Enter' });
      
      expect(mockOnChange).toHaveBeenCalledWith('Yes');
    });

    it('responds to Space key on No button', () => {
      render(<YesOrNoRadio value={null} onChange={mockOnChange} />);
      
      const noButton = screen.getByText('No');
      fireEvent.keyDown(noButton, { key: ' ' });
      
      expect(mockOnChange).toHaveBeenCalledWith('No');
    });

    it('ignores other keys', () => {
      render(<YesOrNoRadio value={null} onChange={mockOnChange} />);
      
      const yesButton = screen.getByText('Yes');
      fireEvent.keyDown(yesButton, { key: 'Tab' });
      fireEvent.keyDown(yesButton, { key: 'Escape' });
      fireEvent.keyDown(yesButton, { key: 'a' });
      
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('has proper tabIndex for keyboard navigation', () => {
      render(<YesOrNoRadio value={null} onChange={mockOnChange} />);
      
      const yesButton = screen.getByText('Yes').parentElement;
      const noButton = screen.getByText('No').parentElement;
      
      expect(yesButton).toHaveAttribute('tabIndex', '0');
      expect(noButton).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Disabled State', () => {
    it('renders disabled buttons when disabled prop is true', () => {
      render(<YesOrNoRadio value={null} onChange={mockOnChange} disabled />);
      
      const yesButton = screen.getByText('Yes').parentElement;
      const noButton = screen.getByText('No').parentElement;
      
      expect(yesButton).toHaveAttribute('aria-disabled', 'true');
      expect(noButton).toHaveAttribute('aria-disabled', 'true');
      expect(yesButton).toHaveAttribute('tabIndex', '-1');
      expect(noButton).toHaveAttribute('tabIndex', '-1');
    });

    it('does not call onChange when disabled and clicked', async () => {
      const user = userEvent.setup();
      render(<YesOrNoRadio value={null} onChange={mockOnChange} disabled />);
      
      const yesButton = screen.getByText('Yes');
      await user.click(yesButton);
      
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('does not respond to keyboard events when disabled', () => {
      render(<YesOrNoRadio value={null} onChange={mockOnChange} disabled />);
      
      const yesButton = screen.getByText('Yes');
      fireEvent.keyDown(yesButton, { key: 'Enter' });
      
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('applies disabled styling classes', () => {
      render(<YesOrNoRadio value={null} onChange={mockOnChange} disabled />);
      
      const yesButton = screen.getByText('Yes').parentElement;
      expect(yesButton).toHaveClass('cursor-not-allowed');
      expect(yesButton).toHaveClass('bg-surface-disabled');
      expect(yesButton).toHaveClass('text-text-secondary');
    });
  });

  describe('Error States', () => {
    it('displays error message when hasError is true', () => {
      render(
        <YesOrNoRadio 
          value={null} 
          onChange={mockOnChange} 
          hasError 
          errorMessage="Please select an option" 
        />
      );
      
      expect(screen.getByText('Please select an option')).toBeInTheDocument();
    });

    it('does not display error message when hasError is false', () => {
      render(
        <YesOrNoRadio 
          value={null} 
          onChange={mockOnChange} 
          hasError={false} 
          errorMessage="Please select an option" 
        />
      );
      
      expect(screen.queryByText('Please select an option')).not.toBeInTheDocument();
    });

    it('applies error styling to buttons when hasError is true', () => {
      render(
        <YesOrNoRadio 
          value={null} 
          onChange={mockOnChange} 
          hasError 
          errorMessage="Error message" 
        />
      );
      
      const yesButton = screen.getByText('Yes').parentElement;
      const noButton = screen.getByText('No').parentElement;
      
      expect(yesButton).toHaveClass('ring-border-error');
      expect(yesButton).toHaveClass('bg-status-bg-error');
      expect(yesButton).toHaveClass('text-status-text-error');
      
      expect(noButton).toHaveClass('ring-border-error');
      expect(noButton).toHaveClass('bg-status-bg-error');
      expect(noButton).toHaveClass('text-status-text-error');
    });

    it('does not display error message when hasError is true but errorMessage is not provided', () => {
      render(
        <YesOrNoRadio 
          value={null} 
          onChange={mockOnChange} 
          hasError 
        />
      );
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA roles and attributes', () => {
      render(<YesOrNoRadio value={null} onChange={mockOnChange} />);
      
      const radioGroup = screen.getByRole('radiogroup');
      const yesRadio = screen.getByRole('radio', { name: 'Yes' });
      const noRadio = screen.getByRole('radio', { name: 'No' });
      
      expect(radioGroup).toBeInTheDocument();
      expect(yesRadio).toBeInTheDocument();
      expect(noRadio).toBeInTheDocument();
    });

    it('uses custom name for accessibility IDs', () => {
      render(
        <YesOrNoRadio 
          value={null} 
          onChange={mockOnChange} 
          name="custom-radio" 
          hasError 
          errorMessage="Error message" 
        />
      );
      
      const radioGroup = screen.getByRole('radiogroup');
      const errorMessage = screen.getByRole('alert');
      
      expect(radioGroup).toHaveAttribute('aria-labelledby', 'custom-radio-label');
      expect(errorMessage).toHaveAttribute('id', 'custom-radio-error');
    });

    it('associates error message with radio buttons via aria-describedby', () => {
      render(
        <YesOrNoRadio 
          value={null} 
          onChange={mockOnChange} 
          name="test-radio" 
          hasError 
          errorMessage="Error message" 
        />
      );
      
      const yesButton = screen.getByText('Yes').parentElement;
      const noButton = screen.getByText('No').parentElement;
      
      expect(yesButton).toHaveAttribute('aria-describedby', 'test-radio-error');
      expect(noButton).toHaveAttribute('aria-describedby', 'test-radio-error');
    });

    it('error message has proper ARIA attributes', () => {
      render(
        <YesOrNoRadio 
          value={null} 
          onChange={mockOnChange} 
          hasError 
          errorMessage="Error message" 
        />
      );
      
      const errorMessage = screen.getByText('Error message');
      
      expect(errorMessage).toHaveAttribute('role', 'alert');
      expect(errorMessage).toHaveAttribute('aria-live', 'polite');
    });

    it('has focus indicators for keyboard navigation', () => {
      render(<YesOrNoRadio value={null} onChange={mockOnChange} />);
      
      const yesButton = screen.getByText('Yes').parentElement;
      const noButton = screen.getByText('No').parentElement;
      
      expect(yesButton).toHaveClass('focus:outline-none');
      expect(yesButton).toHaveClass('focus-visible:ring-2');
      expect(yesButton).toHaveClass('focus-visible:ring-primary');
      
      expect(noButton).toHaveClass('focus:outline-none');
      expect(noButton).toHaveClass('focus-visible:ring-2');
      expect(noButton).toHaveClass('focus-visible:ring-primary');
    });
  });

  describe('Design System Compliance', () => {
    it('uses design system color tokens', () => {
      render(<YesOrNoRadio value="Yes" onChange={mockOnChange} />);
      
      const selectedButton = screen.getByText('Yes').parentElement;
      const unselectedButton = screen.getByText('No').parentElement;
      
      // Selected button uses primary colors
      expect(selectedButton).toHaveClass('ring-primary');
      expect(selectedButton).toHaveClass('bg-surface-primary');
      expect(selectedButton).toHaveClass('text-primary');
      
      // Unselected button uses surface colors
      expect(unselectedButton).toHaveClass('bg-surface-tertiary');
      expect(unselectedButton).toHaveClass('text-text-secondary');
    });

    it('applies proper hover states with design system colors', () => {
      render(<YesOrNoRadio value={null} onChange={mockOnChange} />);
      
      const yesButton = screen.getByText('Yes').parentElement;
      
      expect(yesButton).toHaveClass('hover:bg-surface-disabled');
      expect(yesButton).toHaveClass('hover:text-text-primary');
    });

    it('uses consistent spacing and typography', () => {
      render(<YesOrNoRadio value={null} onChange={mockOnChange} />);
      
      const yesButton = screen.getByText('Yes').parentElement;
      
      expect(yesButton).toHaveClass('text-sm');
      expect(yesButton).toHaveClass('py-2.5');
      expect(yesButton).toHaveClass('px-6');
      expect(yesButton).toHaveClass('rounded-md');
    });

    it('includes proper transition animations', () => {
      render(<YesOrNoRadio value={null} onChange={mockOnChange} />);
      
      const yesButton = screen.getByText('Yes').parentElement;
      
      expect(yesButton).toHaveClass('transition-all');
      expect(yesButton).toHaveClass('duration-200');
    });
  });
});
