/**
 * @fileoverview Tests for CalendarJobCard component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import CalendarJobCard from '@/components/features/service-providers/calendar/CalendarJobCard';
import type { CalendarJobCardProps } from '@/components/features/service-providers/calendar/CalendarJobCard';

expect.extend(toHaveNoViolations);

// Mock RadioList component (named export)
jest.mock('@/components/forms/RadioList', () => ({
  RadioList: function MockRadioList({ options, onChange, name }: any) {
    return (
      <div data-testid="mock-radio-list">
        {options.map((option: string, idx: number) => (
          <label key={idx}>
            <input
              type="radio"
              name={name || 'radioList'}
              value={option}
              onChange={() => onChange?.(option)}
            />
            {option}
          </label>
        ))}
      </div>
    );
  }
}));

// Mock Modal component (named export)
jest.mock('@/components/ui/primitives/Modal/Modal', () => ({
  Modal: function MockModal({ open, onClose, title, children }: any) {
    if (!open) return null;
    return (
      <div 
        data-testid="mock-modal" 
        role="dialog" 
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <h2 id="modal-title">{title}</h2>
        <button onClick={onClose} aria-label="Close modal">Close</button>
        <div>{children}</div>
      </div>
    );
  }
}));

describe('CalendarJobCard', () => {
  const defaultProps: CalendarJobCardProps = {
    title: 'Storage Unit Delivery',
    crewSize: '2 movers required',
    customerId: 'CUST-12345',
    customerName: 'John Doe',
    date: 'Monday, January 15, 2025',
    time: '10:00 AM - 12:00 PM',
    address: '123 Main St, San Francisco, CA 94102',
    description: 'Need help moving 5 storage units from garage to truck. Heavy lifting required.',
  };

  // REQUIRED: Test cleanup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<CalendarJobCard {...defaultProps} />);
      expect(screen.getByRole('article')).toBeInTheDocument();
    });

    it('displays job title and crew size', () => {
      render(<CalendarJobCard {...defaultProps} />);
      expect(screen.getByText('Storage Unit Delivery')).toBeInTheDocument();
      expect(screen.getByText('2 movers required')).toBeInTheDocument();
    });

    it('displays customer information', () => {
      render(<CalendarJobCard {...defaultProps} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText(/CUST-12345/)).toBeInTheDocument();
    });

    it('displays delivery date and time', () => {
      render(<CalendarJobCard {...defaultProps} />);
      expect(screen.getByText('Monday, January 15, 2025')).toBeInTheDocument();
      expect(screen.getByText('10:00 AM - 12:00 PM')).toBeInTheDocument();
    });

    it('displays delivery address', () => {
      render(<CalendarJobCard {...defaultProps} />);
      expect(screen.getByText('123 Main St, San Francisco, CA 94102')).toBeInTheDocument();
    });

    it('displays job description', () => {
      render(<CalendarJobCard {...defaultProps} />);
      expect(screen.getByText(/Need help moving 5 storage units/)).toBeInTheDocument();
    });

    it('renders cancel appointment button', () => {
      render(<CalendarJobCard {...defaultProps} />);
      const cancelButton = screen.getByRole('button', { name: /cancel appointment/i });
      expect(cancelButton).toBeInTheDocument();
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<CalendarJobCard {...defaultProps} />);
      await testAccessibility(renderResult);
    });

    it('has proper ARIA labels', () => {
      render(<CalendarJobCard {...defaultProps} />);
      
      expect(screen.getByRole('article')).toHaveAttribute('aria-label', 'Job: Storage Unit Delivery');
      expect(screen.getByRole('button', { name: /cancel appointment/i })).toBeInTheDocument();
    });

    it('uses semantic HTML structure', () => {
      render(<CalendarJobCard {...defaultProps} />);
      
      // Check for semantic elements
      expect(screen.getByRole('article')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('maintains accessibility with modal open', async () => {
      const user = userEvent.setup();
      const renderResult = render(<CalendarJobCard {...defaultProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel appointment/i });
      await user.click(cancelButton);
      
      // Modal should be accessible
      await waitFor(() => {
        const modal = screen.getByRole('dialog');
        expect(modal).toBeInTheDocument();
        expect(modal).toHaveAttribute('aria-modal', 'true');
      });
      
      await testAccessibility(renderResult);
    });
  });

  // REQUIRED: User interaction testing
  describe('User Interactions', () => {
    it('opens cancel modal when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<CalendarJobCard {...defaultProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel appointment/i });
      await user.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-modal')).toBeInTheDocument();
        expect(screen.getByText('Confirm your cancellation')).toBeInTheDocument();
      });
    });

    it('displays cancellation options in modal', async () => {
      const user = userEvent.setup();
      render(<CalendarJobCard {...defaultProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel appointment/i });
      await user.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-radio-list')).toBeInTheDocument();
        expect(screen.getByText('Scheduling conflict')).toBeInTheDocument();
        expect(screen.getByText("I don't have enough labor")).toBeInTheDocument();
        expect(screen.getByText('Job looks too hard')).toBeInTheDocument();
        expect(screen.getByText('Emergency')).toBeInTheDocument();
        expect(screen.getByText('Other')).toBeInTheDocument();
      });
    });

    it('closes modal when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<CalendarJobCard {...defaultProps} />);
      
      // Open modal
      const cancelButton = screen.getByRole('button', { name: /cancel appointment/i });
      await user.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-modal')).toBeInTheDocument();
      });
      
      // Close modal
      const closeButton = screen.getByRole('button', { name: /close modal/i });
      await user.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('mock-modal')).not.toBeInTheDocument();
      });
    });

    it('closes modal when Go Back button is clicked', async () => {
      const user = userEvent.setup();
      render(<CalendarJobCard {...defaultProps} />);
      
      // Open modal
      const cancelButton = screen.getByRole('button', { name: /cancel appointment/i });
      await user.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-modal')).toBeInTheDocument();
      });
      
      // Click Go Back
      const goBackButton = screen.getByRole('button', { name: /cancel and go back/i });
      await user.click(goBackButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('mock-modal')).not.toBeInTheDocument();
      });
    });

    it('handles cancellation reason selection', async () => {
      const user = userEvent.setup();
      render(<CalendarJobCard {...defaultProps} />);
      
      // Open modal
      const cancelButton = screen.getByRole('button', { name: /cancel appointment/i });
      await user.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-radio-list')).toBeInTheDocument();
      });
      
      // Select a reason
      const reasonRadio = screen.getByRole('radio', { name: /scheduling conflict/i });
      await user.click(reasonRadio);
      
      expect(reasonRadio).toBeChecked();
    });
  });

  // Props and callback testing
  describe('Callbacks', () => {
    it('calls onCancelConfirm with selected reason when confirmed', async () => {
      const user = userEvent.setup();
      const mockOnCancelConfirm = jest.fn();
      
      render(
        <CalendarJobCard 
          {...defaultProps} 
          onCancelConfirm={mockOnCancelConfirm}
        />
      );
      
      // Open modal
      const cancelButton = screen.getByRole('button', { name: /cancel appointment/i });
      await user.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-radio-list')).toBeInTheDocument();
      });
      
      // Select a reason
      const reasonRadio = screen.getByRole('radio', { name: /emergency/i });
      await user.click(reasonRadio);
      
      // Confirm cancellation
      const confirmButton = screen.getByRole('button', { name: /confirm cancellation/i });
      await user.click(confirmButton);
      
      expect(mockOnCancelConfirm).toHaveBeenCalledWith('Emergency');
      expect(mockOnCancelConfirm).toHaveBeenCalledTimes(1);
    });

    it('does not call onCancelConfirm if callback not provided', async () => {
      const user = userEvent.setup();
      
      render(<CalendarJobCard {...defaultProps} />);
      
      // Open modal
      const cancelButton = screen.getByRole('button', { name: /cancel appointment/i });
      await user.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-radio-list')).toBeInTheDocument();
      });
      
      // Select a reason and confirm - should not throw error
      const reasonRadio = screen.getByRole('radio', { name: /other/i });
      await user.click(reasonRadio);
      
      const confirmButton = screen.getByRole('button', { name: /confirm cancellation/i });
      await user.click(confirmButton);
      
      // Should close modal without errors
      await waitFor(() => {
        expect(screen.queryByTestId('mock-modal')).not.toBeInTheDocument();
      });
    });
  });

  // Design system integration
  describe('Design System Integration', () => {
    it('uses semantic color classes', () => {
      const { container } = render(<CalendarJobCard {...defaultProps} />);
      
      // Check for design system classes (not hardcoded colors)
      const card = container.querySelector('.bg-surface-primary');
      expect(card).toBeInTheDocument();
      
      const button = screen.getByRole('button', { name: /cancel appointment/i });
      expect(button).toHaveClass('hover:bg-surface-tertiary');
    });

    it('uses proper border semantic tokens', () => {
      const { container } = render(<CalendarJobCard {...defaultProps} />);
      
      const borders = container.querySelectorAll('.border-border');
      expect(borders.length).toBeGreaterThan(0);
    });
  });

  // Edge cases
  describe('Edge Cases', () => {
    it('handles empty description gracefully', () => {
      render(<CalendarJobCard {...defaultProps} description="" />);
      
      expect(screen.getByText('Customer Job Description:')).toBeInTheDocument();
    });

    it('handles long customer names', () => {
      const longName = 'John Alexander Montgomery Wellington III';
      render(<CalendarJobCard {...defaultProps} customerName={longName} />);
      
      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it('handles long addresses', () => {
      const longAddress = '123 Very Long Street Name With Many Words, San Francisco, California 94102-1234';
      render(<CalendarJobCard {...defaultProps} address={longAddress} />);
      
      expect(screen.getByText(longAddress)).toBeInTheDocument();
    });

    it('disables confirm button when no reason selected', async () => {
      const user = userEvent.setup();
      render(<CalendarJobCard {...defaultProps} />);
      
      // Open modal
      const cancelButton = screen.getByRole('button', { name: /cancel appointment/i });
      await user.click(cancelButton);
      
      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /confirm cancellation/i });
        expect(confirmButton).toBeDisabled();
      });
    });

    it('enables confirm button after reason selection', async () => {
      const user = userEvent.setup();
      render(<CalendarJobCard {...defaultProps} />);
      
      // Open modal
      const cancelButton = screen.getByRole('button', { name: /cancel appointment/i });
      await user.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-radio-list')).toBeInTheDocument();
      });
      
      // Select a reason
      const reasonRadio = screen.getByRole('radio', { name: /scheduling conflict/i });
      await user.click(reasonRadio);
      
      const confirmButton = screen.getByRole('button', { name: /confirm cancellation/i });
      expect(confirmButton).not.toBeDisabled();
    });
  });

  // Warning message display
  describe('Warning Message', () => {
    it('displays cancellation warning in modal', async () => {
      const user = userEvent.setup();
      render(<CalendarJobCard {...defaultProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel appointment/i });
      await user.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Canceling on a customer hurts your rating/)).toBeInTheDocument();
        expect(screen.getByText(/subject to removal from our platform/)).toBeInTheDocument();
      });
    });

    it('warning message has proper alert role', async () => {
      const user = userEvent.setup();
      render(<CalendarJobCard {...defaultProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel appointment/i });
      await user.click(cancelButton);
      
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveClass('bg-status-bg-warning');
      });
    });
  });
});

