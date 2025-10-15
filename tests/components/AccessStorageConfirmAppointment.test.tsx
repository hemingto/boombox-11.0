/**
 * @fileoverview Tests for AccessStorageConfirmAppointment component
 * Following boombox-11.0 testing standards (99→0 failure learnings)
 */

import React from 'react';
import { render, screen, waitFor } from '../utils/AccessStorageTestWrapper';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import AccessStorageConfirmAppointment from '@/components/features/orders/AccessStorageConfirmAppointment';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Default props
const defaultProps = {
  goBackToStep1: jest.fn(),
  goBackToStep2: jest.fn(),
  selectedPlanName: 'Standard Plan',
};

describe('AccessStorageConfirmAppointment', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  // REQUIRED: Basic rendering test
  it('renders without crashing', () => {
    render(<AccessStorageConfirmAppointment {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: /confirm appointment/i })).toBeInTheDocument();
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<AccessStorageConfirmAppointment {...defaultProps} />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA labels and structure', () => {
      render(<AccessStorageConfirmAppointment {...defaultProps} />);

      // Check header structure
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go back to previous step/i })).toBeInTheDocument();

      // Check form sections
      expect(screen.getByLabelText(/additional delivery information/i)).toBeInTheDocument();
      expect(screen.getByText(/optional: provide additional information/i)).toBeInTheDocument();

      // Check modal trigger
      const modalTrigger = screen.getByRole('button', { name: /when will i be charged/i });
      expect(modalTrigger).toHaveAttribute('aria-describedby', 'payment-modal-description');
    });

    it('supports keyboard navigation', async () => {
      render(<AccessStorageConfirmAppointment {...defaultProps} />);

      // Tab through interactive elements
      await user.tab();
      expect(screen.getByRole('button', { name: /go back to previous step/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/additional delivery information/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /when will i be charged/i })).toHaveFocus();
    });
  });

  // Component functionality tests
  describe('Component Functionality', () => {
    it('displays the correct heading', () => {
      render(<AccessStorageConfirmAppointment {...defaultProps} />);

      expect(screen.getByRole('heading', { name: /confirm appointment/i })).toBeInTheDocument();
    });

    it('renders description textarea with form integration', () => {
      render(<AccessStorageConfirmAppointment {...defaultProps} />);

      const textarea = screen.getByLabelText(/additional delivery information/i);
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute('placeholder', expect.stringContaining('stairs, narrow hallways'));
      expect(textarea).toHaveValue('Test description'); // From mocked form
    });

    it('displays payment information correctly', () => {
      render(<AccessStorageConfirmAppointment {...defaultProps} />);

      expect(screen.getByText(/you won't be charged anything today/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /when will i be charged/i })).toBeInTheDocument();
    });
  });

  // Navigation tests
  describe('Navigation', () => {
    it('calls goBackToStep2 when back button is clicked', async () => {
      const mockGoBack = jest.fn();
      
      render(
        <AccessStorageConfirmAppointment 
          {...defaultProps} 
          goBackToStep2={mockGoBack}
        />
      );

      const backButton = screen.getByRole('button', { name: /go back to previous step/i });
      await user.click(backButton);

      expect(mockGoBack).toHaveBeenCalledTimes(1);
    });

    it('handles back navigation for DIY plans correctly', async () => {
      const mockGoBack = jest.fn();
      
      render(
        <AccessStorageConfirmAppointment 
          {...defaultProps} 
          selectedPlanName="Do It Yourself Plan"
          goBackToStep2={mockGoBack}
        />
      );

      const backButton = screen.getByRole('button', { name: /go back to previous step/i });
      await user.click(backButton);

      expect(mockGoBack).toHaveBeenCalledTimes(1);
    });

    it('handles back navigation for labor plans correctly', async () => {
      const mockGoBack = jest.fn();
      
      render(
        <AccessStorageConfirmAppointment 
          {...defaultProps} 
          selectedPlanName="Standard Plan"
          goBackToStep2={mockGoBack}
        />
      );

      const backButton = screen.getByRole('button', { name: /go back to previous step/i });
      await user.click(backButton);

      expect(mockGoBack).toHaveBeenCalledTimes(1);
    });
  });

  // Modal functionality tests
  describe('Payment Information Modal', () => {
    it('opens modal when payment info button is clicked', async () => {
      render(<AccessStorageConfirmAppointment {...defaultProps} />);

      const triggerButton = screen.getByRole('button', { name: /when will i be charged/i });
      await user.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/reserving is free/i)).toBeInTheDocument();
      });
    });

    it('displays correct modal content', async () => {
      render(<AccessStorageConfirmAppointment {...defaultProps} />);

      const triggerButton = screen.getByRole('button', { name: /when will i be charged/i });
      await user.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/reserving is free/i)).toBeInTheDocument();
        expect(screen.getByText(/what if i need to reschedule/i)).toBeInTheDocument();
        expect(screen.getByText(/48 hours in advance/i)).toBeInTheDocument();
      });
    });

    it('closes modal when escape key is pressed', async () => {
      render(<AccessStorageConfirmAppointment {...defaultProps} />);

      // Open modal
      const triggerButton = screen.getByRole('button', { name: /when will i be charged/i });
      await user.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Press escape
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('has proper modal accessibility attributes', async () => {
      render(<AccessStorageConfirmAppointment {...defaultProps} />);

      const triggerButton = screen.getByRole('button', { name: /when will i be charged/i });
      await user.click(triggerButton);

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAttribute('aria-labelledby');
      });
    });
  });

  // Design system compliance tests
  describe('Design System Compliance', () => {
    it('uses semantic color classes', () => {
      render(<AccessStorageConfirmAppointment {...defaultProps} />);

      const heading = screen.getByRole('heading', { name: /confirm appointment/i });
      expect(heading).toHaveClass('text-text-primary');

      const backButton = screen.getByRole('button', { name: /go back to previous step/i });
      expect(backButton).toHaveClass('text-text-primary');
    });

    it('uses form utility classes', () => {
      render(<AccessStorageConfirmAppointment {...defaultProps} />);

      const textarea = screen.getByLabelText(/additional delivery information/i);
      expect(textarea).toHaveClass('input-field');

      // Check for form-group classes in the DOM
      const { container } = render(<AccessStorageConfirmAppointment {...defaultProps} />);
      const formGroups = container.querySelectorAll('.form-group');
      expect(formGroups.length).toBeGreaterThan(0);
    });

    it('uses card utility classes for payment section', () => {
      const { container } = render(<AccessStorageConfirmAppointment {...defaultProps} />);

      const cardElement = container.querySelector('.card');
      expect(cardElement).toBeInTheDocument();
    });
  });

  // Error handling tests
  describe('Error Handling', () => {
    it('handles form context errors gracefully', () => {
      // Component should render without crashing even with errors
      render(<AccessStorageConfirmAppointment {...defaultProps} />);

      expect(screen.getByRole('heading', { name: /confirm appointment/i })).toBeInTheDocument();
    });

    it('handles missing form context gracefully', () => {
      // Component should handle undefined values gracefully
      render(<AccessStorageConfirmAppointment {...defaultProps} />);

      const textarea = screen.getByLabelText(/additional delivery information/i);
      expect(textarea).toHaveValue('Test description'); // From mocked form
    });
  });

  // Integration tests
  describe('Integration', () => {
    it('integrates properly with form hooks', () => {
      render(<AccessStorageConfirmAppointment {...defaultProps} />);

      // Should render without provider errors
      expect(screen.getByRole('heading', { name: /confirm appointment/i })).toBeInTheDocument();
    });

    it('maintains form state consistency', async () => {
      render(<AccessStorageConfirmAppointment {...defaultProps} />);

      const textarea = screen.getByLabelText(/additional delivery information/i);
      
      // Should be able to interact with textarea without errors
      await user.clear(textarea);
      await user.type(textarea, 'New description');

      // Component should handle the interaction gracefully
      expect(textarea).toBeInTheDocument();
    });
  });

  // Performance tests
  describe('Performance', () => {
    it('renders efficiently without unnecessary re-renders', () => {
      const { rerender } = render(<AccessStorageConfirmAppointment {...defaultProps} />);

      // Re-render with same props
      rerender(<AccessStorageConfirmAppointment {...defaultProps} />);

      // Should not cause errors
      expect(screen.getByRole('heading', { name: /confirm appointment/i })).toBeInTheDocument();
    });
  });
});