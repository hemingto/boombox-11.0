/**
 * @fileoverview Tests for PackingSupplyFeedbackForm component
 * Following boombox-11.0 testing standards
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { PackingSupplyFeedbackForm } from '@/components/features/packing-supplies/PackingSupplyFeedbackForm';

expect.extend(toHaveNoViolations);

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage(props: any) {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('PackingSupplyFeedbackForm', () => {
  const mockProps = {
    orderId: 'order-123',
    taskShortId: 'TASK-456',
    orderDate: '2025-01-15',
    deliveryAddress: '123 Main St, City, ST 12345',
    invoiceTotal: 100.0,
    userId: 'user-789',
    driverName: 'John Doe',
    driverProfilePicture: 'profile.jpg',
    items: [
      { name: 'Small Box', quantity: 5, price: 10.0 },
      { name: 'Tape', quantity: 2, price: 5.0 },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ exists: false }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', async () => {
      render(<PackingSupplyFeedbackForm {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Boombox Packing Supplies')).toBeInTheDocument();
      });
    });

    it('displays order information correctly', async () => {
      render(<PackingSupplyFeedbackForm {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Boombox Packing Supplies')).toBeInTheDocument();
        expect(screen.getByText(mockProps.orderDate)).toBeInTheDocument();
        expect(screen.getByText(`Order #${mockProps.taskShortId}`)).toBeInTheDocument();
        expect(screen.getByText(`Order total $${mockProps.invoiceTotal.toFixed(2)}`)).toBeInTheDocument();
      });
    });

    it('displays driver information when provided', async () => {
      render(<PackingSupplyFeedbackForm {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Your Driver')).toBeInTheDocument();
        expect(screen.getByText(mockProps.driverName!)).toBeInTheDocument();
        expect(screen.getByText('Boombox Driver')).toBeInTheDocument();
      });
    });

    it('does not display driver section when driver info not provided', async () => {
      const propsWithoutDriver = {
        ...mockProps,
        driverName: undefined,
        driverProfilePicture: undefined,
      };

      render(<PackingSupplyFeedbackForm {...propsWithoutDriver} />);

      await waitFor(() => {
        expect(screen.queryByText('Your Driver')).not.toBeInTheDocument();
      });
    });

    it('shows all tip options', async () => {
      render(<PackingSupplyFeedbackForm {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('No tip')).toBeInTheDocument();
        expect(screen.getByText(/15%/)).toBeInTheDocument();
        expect(screen.getByText(/20%/)).toBeInTheDocument();
        expect(screen.getByText(/25%/)).toBeInTheDocument();
        expect(screen.getByText('Custom Tip')).toBeInTheDocument();
      });
    });

    it('displays 5 star rating buttons', async () => {
      render(<PackingSupplyFeedbackForm {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Rate your delivery experience')).toBeInTheDocument();
        
        // Check for star rating buttons (5 stars)
        const starButtons = screen.getAllByRole('button', { name: /Rate \d out of 5 stars/ });
        expect(starButtons).toHaveLength(5);
      });
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<PackingSupplyFeedbackForm {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Boombox Packing Supplies')).toBeInTheDocument();
      });

      await testAccessibility(renderResult);
    });

    it('has proper ARIA labels for star rating buttons', async () => {
      render(<PackingSupplyFeedbackForm {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Rate 1 out of 5 stars' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Rate 5 out of 5 stars' })).toBeInTheDocument();
      });
    });

    it('has proper ARIA labels for driver rating buttons', async () => {
      render(<PackingSupplyFeedbackForm {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Rate driver with thumbs up' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Rate driver with thumbs down' })).toBeInTheDocument();
      });
    });

    it('uses role="alert" for error messages', async () => {
      const user = userEvent.setup();
      render(<PackingSupplyFeedbackForm {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Submit')).toBeInTheDocument();
      });

      // Try to submit without rating
      const submitButton = screen.getByRole('button', { name: 'Submit feedback' });
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText('Please provide a rating');
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });
  });

  describe('User Interactions', () => {
    it('allows selecting a star rating', async () => {
      const user = userEvent.setup();
      render(<PackingSupplyFeedbackForm {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Rate 5 out of 5 stars' })).toBeInTheDocument();
      });

      const fiveStarButton = screen.getByRole('button', { name: 'Rate 5 out of 5 stars' });
      await user.click(fiveStarButton);

      // Check that button is now pressed
      expect(fiveStarButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('allows selecting a tip percentage', async () => {
      const user = userEvent.setup();
      render(<PackingSupplyFeedbackForm {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText(/20%/)).toBeInTheDocument();
      });

      const twentyPercentButton = screen.getByRole('button', { name: /Select 20% tip/ });
      await user.click(twentyPercentButton);

      // Check that the button has selected styles (primary background)
      expect(twentyPercentButton).toHaveClass('bg-primary');
    });

    it('shows custom tip input when Custom Tip is selected', async () => {
      const user = userEvent.setup();
      render(<PackingSupplyFeedbackForm {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Custom Tip')).toBeInTheDocument();
      });

      const customTipButton = screen.getByRole('button', { name: 'Select Custom Tip tip' });
      await user.click(customTipButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
      });
    });

    it('allows entering a custom tip amount', async () => {
      const user = userEvent.setup();
      render(<PackingSupplyFeedbackForm {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Custom Tip')).toBeInTheDocument();
      });

      // Select custom tip
      const customTipButton = screen.getByRole('button', { name: 'Select Custom Tip tip' });
      await user.click(customTipButton);

      // Enter custom amount
      const customInput = screen.getByPlaceholderText('0.00');
      await user.type(customInput, '25.50');

      expect(customInput).toHaveValue(25.5);
    });

    it('allows selecting thumbs up driver rating', async () => {
      const user = userEvent.setup();
      render(<PackingSupplyFeedbackForm {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Rate driver with thumbs up' })).toBeInTheDocument();
      });

      const thumbsUpButton = screen.getByRole('button', { name: 'Rate driver with thumbs up' });
      await user.click(thumbsUpButton);

      // Check that button has success styles
      expect(thumbsUpButton).toHaveClass('bg-status-bg-success');
    });

    it('allows selecting thumbs down driver rating', async () => {
      const user = userEvent.setup();
      render(<PackingSupplyFeedbackForm {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Rate driver with thumbs down' })).toBeInTheDocument();
      });

      const thumbsDownButton = screen.getByRole('button', { name: 'Rate driver with thumbs down' });
      await user.click(thumbsDownButton);

      // Check that button has error styles
      expect(thumbsDownButton).toHaveClass('bg-status-bg-error');
    });

    it('allows toggling driver rating', async () => {
      const user = userEvent.setup();
      render(<PackingSupplyFeedbackForm {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Rate driver with thumbs up' })).toBeInTheDocument();
      });

      const thumbsUpButton = screen.getByRole('button', { name: 'Rate driver with thumbs up' });
      
      // Click once to select
      await user.click(thumbsUpButton);
      expect(thumbsUpButton).toHaveClass('bg-status-bg-success');

      // Click again to deselect
      await user.click(thumbsUpButton);
      expect(screen.getByRole('button', { name: 'Rate driver with thumbs up' })).toBeInTheDocument();
    });

    it('allows entering a comment', async () => {
      const user = userEvent.setup();
      render(<PackingSupplyFeedbackForm {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Please provide your feedback...')).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText('Please provide your feedback...');
      const testComment = 'Great service!';
      
      // Use fireEvent for faster text input
      fireEvent.change(textarea, { target: { value: testComment } });

      expect(textarea).toHaveValue(testComment);
    });
  });

  describe('Form Validation', () => {
    it('shows error when submitting without a rating', async () => {
      const user = userEvent.setup();
      render(<PackingSupplyFeedbackForm {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Submit')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: 'Submit feedback' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please provide a rating')).toBeInTheDocument();
      });
    });

    it('clears rating error when rating is selected', async () => {
      const user = userEvent.setup();
      render(<PackingSupplyFeedbackForm {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Submit')).toBeInTheDocument();
      });

      // Try to submit without rating
      const submitButton = screen.getByRole('button', { name: 'Submit feedback' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please provide a rating')).toBeInTheDocument();
      });

      // Select a rating
      const threeStarButton = screen.getByRole('button', { name: 'Rate 3 out of 5 stars' });
      await user.click(threeStarButton);

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Please provide a rating')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('submits feedback with rating and tip', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: false }),
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          id: 123,
          tipPaymentStatus: 'succeeded',
        }),
      });

      render(<PackingSupplyFeedbackForm {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Submit')).toBeInTheDocument();
      });

      // Select rating
      const fiveStarButton = screen.getByRole('button', { name: 'Rate 5 out of 5 stars' });
      await user.click(fiveStarButton);

      // Select 20% tip
      const twentyPercentButton = screen.getByRole('button', { name: /Select 20% tip/ });
      await user.click(twentyPercentButton);

      // Submit
      const submitButton = screen.getByRole('button', { name: 'Submit feedback' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/packing-supply-feedback/submit',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('"rating":5'),
          })
        );
      });
    });

    it('shows success message after successful submission', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: false }),
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          id: 123,
          tipPaymentStatus: 'succeeded',
        }),
      });

      render(<PackingSupplyFeedbackForm {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Submit')).toBeInTheDocument();
      });

      // Select rating
      const fiveStarButton = screen.getByRole('button', { name: 'Rate 5 out of 5 stars' });
      await user.click(fiveStarButton);

      // Submit
      const submitButton = screen.getByRole('button', { name: 'Submit feedback' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Thank you for your feedback!')).toBeInTheDocument();
      });
    });

    it('shows tip success message when tip is processed', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: false }),
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          id: 123,
          tipPaymentStatus: 'succeeded',
        }),
      });

      render(<PackingSupplyFeedbackForm {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Submit')).toBeInTheDocument();
      });

      // Select rating and tip
      const fiveStarButton = screen.getByRole('button', { name: 'Rate 5 out of 5 stars' });
      await user.click(fiveStarButton);

      // Submit
      const submitButton = screen.getByRole('button', { name: 'Submit feedback' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Your tip was successfully processed/)).toBeInTheDocument();
      });
    });

    it('shows error message when submission fails', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: false }),
      }).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ 
          tipProcessingError: 'Payment failed',
        }),
      });

      render(<PackingSupplyFeedbackForm {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Submit')).toBeInTheDocument();
      });

      // Select rating
      const fiveStarButton = screen.getByRole('button', { name: 'Rate 5 out of 5 stars' });
      await user.click(fiveStarButton);

      // Submit
      const submitButton = screen.getByRole('button', { name: 'Submit feedback' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to submit feedback/)).toBeInTheDocument();
      });
    });

    it('disables submit button while submitting', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: false }),
      }).mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<PackingSupplyFeedbackForm {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Submit')).toBeInTheDocument();
      });

      // Select rating
      const fiveStarButton = screen.getByRole('button', { name: 'Rate 5 out of 5 stars' });
      await user.click(fiveStarButton);

      // Submit
      const submitButton = screen.getByRole('button', { name: 'Submit feedback' });
      await user.click(submitButton);

      // Check that button is disabled during submission
      expect(submitButton).toBeDisabled();
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });
  });

  describe('Feedback Check on Mount', () => {
    it('checks if feedback already exists on component mount', async () => {
      render(<PackingSupplyFeedbackForm {...mockProps} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/admin/packing-supply-feedback/check?taskShortId=${mockProps.taskShortId}`
        );
      });
    });

    it('shows thank you message if feedback already exists', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: true }),
      });

      render(<PackingSupplyFeedbackForm {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Thank you for your feedback!')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('navigates to home when Back to Home button is clicked', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: true }),
      });

      render(<PackingSupplyFeedbackForm {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Thank you for your feedback!')).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: 'Return to home page' });
      await user.click(backButton);

      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  describe('Tip Calculations', () => {
    it('displays correct tip amounts for percentage options', async () => {
      render(<PackingSupplyFeedbackForm {...mockProps} />);

      await waitFor(() => {
        // 15% of $100 = $15.00
        expect(screen.getByText(/\$15\.00\)/)).toBeInTheDocument();
        // 20% of $100 = $20.00
        expect(screen.getByText(/\$20\.00\)/)).toBeInTheDocument();
        // 25% of $100 = $25.00
        expect(screen.getByText(/\$25\.00\)/)).toBeInTheDocument();
      });
    });
  });

  describe('Custom Tip Input', () => {
    it('formats custom tip to 2 decimal places on blur', async () => {
      const user = userEvent.setup();
      render(<PackingSupplyFeedbackForm {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Custom Tip')).toBeInTheDocument();
      });

      // Select custom tip
      const customTipButton = screen.getByRole('button', { name: 'Select Custom Tip tip' });
      await user.click(customTipButton);

      // Enter custom amount without decimals
      const customInput = screen.getByPlaceholderText('0.00');
      await user.type(customInput, '25');
      
      // Trigger blur event
      fireEvent.blur(customInput);

      await waitFor(() => {
        expect(customInput).toHaveValue(25);
      });
    });
  });
});

