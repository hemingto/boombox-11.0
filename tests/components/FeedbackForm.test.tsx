/**
 * @fileoverview Tests for FeedbackForm component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { FeedbackForm } from '@/components/features/orders/FeedbackForm';
import type { FeedbackFormProps } from '@/components/features/orders/FeedbackForm';

expect.extend(toHaveNoViolations);

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn()
  }))
}));

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock console methods to reduce test noise
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

describe('FeedbackForm', () => {
  // REQUIRED: Test cleanup
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Default props for testing
  const defaultProps: FeedbackFormProps = {
    appointmentId: '123',
    appointmentType: 'Storage Pickup',
    appointmentDate: '2025-01-15',
    movingPartnerName: 'Boombox Storage',
    invoiceTotal: 150.00,
    userId: 'user-123'
  };

  const propsWithDrivers: FeedbackFormProps = {
    ...defaultProps,
    drivers: [
      {
        key: 'driver-1',
        taskId: 'task-1',
        taskIds: ['task-1', 'task-2'],
        name: 'John Doe',
        unitNumber: 101,
        cloudinaryFile: 'driver-profile.jpg',
        subtitle: 'Professional Driver'
      }
    ]
  };

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: false })
      });

      render(<FeedbackForm {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Add a tip')).toBeInTheDocument();
      });
    });

    it('displays appointment information correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: false })
      });

      render(<FeedbackForm {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Boombox Storage')).toBeInTheDocument();
        expect(screen.getByText('2025-01-15')).toBeInTheDocument();
        expect(screen.getByText('Storage Pickup')).toBeInTheDocument();
        expect(screen.getByText('Invoice total $150.00')).toBeInTheDocument();
      });
    });

    it('displays loading state initially', () => {
      render(<FeedbackForm {...defaultProps} />);
      
      expect(screen.getByRole('status', { name: /loading feedback form/i })).toBeInTheDocument();
    });

    it('displays drivers section when drivers are provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: false })
      });

      render(<FeedbackForm {...propsWithDrivers} />);
      
      await waitFor(() => {
        expect(screen.getByText('Driver')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Professional Driver')).toBeInTheDocument();
      });
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: false })
      });

      const renderResult = render(<FeedbackForm {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Add a tip')).toBeInTheDocument();
      });

      const results = await axe(renderResult.container);
      expect(results).toHaveNoViolations();
    });

    it('maintains accessibility with error state', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: false })
      });

      const user = userEvent.setup();
      render(<FeedbackForm {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Submit')).toBeInTheDocument();
      });

      // Try to submit without rating to trigger error
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Please provide a rating');
      });

      const results = await axe(document.body);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA labels for interactive elements', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: false })
      });

      render(<FeedbackForm {...propsWithDrivers} />);
      
      await waitFor(() => {
        expect(screen.getByRole('group', { name: /star rating/i })).toBeInTheDocument();
        expect(screen.getByRole('group', { name: /tip options/i })).toBeInTheDocument();
        expect(screen.getByRole('group', { name: /rate john doe/i })).toBeInTheDocument();
      });
    });
  });

  // REQUIRED: User interaction testing
  describe('User Interactions', () => {
    it('handles star rating selection', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: false })
      });

      const user = userEvent.setup();
      render(<FeedbackForm {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Rate 3 out of 5 stars')).toBeInTheDocument();
      });

      const threeStarButton = screen.getByLabelText('Rate 3 out of 5 stars');
      await user.click(threeStarButton);

      expect(threeStarButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('handles tip percentage selection', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: false })
      });

      const user = userEvent.setup();
      render(<FeedbackForm {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('20%')).toBeInTheDocument();
      });

      const twentyPercentButton = screen.getByRole('button', { name: /20%.*\$30.00\)/ });
      await user.click(twentyPercentButton);

      expect(twentyPercentButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('handles custom tip input', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: false })
      });

      const user = userEvent.setup();
      render(<FeedbackForm {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Custom Tip')).toBeInTheDocument();
      });

      const customTipButton = screen.getByRole('button', { name: /custom tip/i });
      await user.click(customTipButton);

      const customTipInput = screen.getByLabelText(/custom tip amount/i);
      expect(customTipInput).toBeInTheDocument();

      await user.type(customTipInput, '25.50');
      expect(customTipInput).toHaveValue(25.50);
    });

    it('handles driver rating interactions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: false })
      });

      const user = userEvent.setup();
      render(<FeedbackForm {...propsWithDrivers} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/give john doe a thumbs up/i)).toBeInTheDocument();
      });

      const thumbsUpButton = screen.getByLabelText(/give john doe a thumbs up/i);
      await user.click(thumbsUpButton);

      expect(thumbsUpButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('handles comment textarea input', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: false })
      });

      const user = userEvent.setup();
      render(<FeedbackForm {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/additional feedback comments/i)).toBeInTheDocument();
      });

      const commentTextarea = screen.getByLabelText(/additional feedback comments/i);
      await user.type(commentTextarea, 'Great service!');

      expect(commentTextarea).toHaveValue('Great service!');
    });
  });

  // REQUIRED: Form validation testing
  describe('Form Validation', () => {
    it('shows validation error when submitting without rating', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: false })
      });

      const user = userEvent.setup();
      render(<FeedbackForm {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Submit')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Please provide a rating');
      });
    });

    it('clears validation error when rating is provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: false })
      });

      const user = userEvent.setup();
      render(<FeedbackForm {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Submit')).toBeInTheDocument();
      });

      // Try to submit without rating
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Please provide a rating');
      });

      // Provide rating
      const fourStarButton = screen.getByLabelText('Rate 4 out of 5 stars');
      await user.click(fourStarButton);

      // Error should be cleared
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  // REQUIRED: API integration testing
  describe('API Integration', () => {
    it('checks for existing feedback on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: false })
      });

      render(<FeedbackForm {...defaultProps} />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/feedback/check?appointmentId=123');
      });
    });

    it('shows submitted state when feedback already exists', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: true })
      });

      render(<FeedbackForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Thank you for your feedback!')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /go to account page/i })).toBeInTheDocument();
      });
    });

    it('submits feedback with correct payload', async () => {
      // Mock check feedback (no existing feedback)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: false })
      });

      // Mock submit feedback
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          id: 1, 
          tipProcessingStatus: 'success',
          tipPaymentStatus: 'succeeded'
        })
      });

      const user = userEvent.setup();
      render(<FeedbackForm {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Submit')).toBeInTheDocument();
      });

      // Provide rating
      const fiveStarButton = screen.getByLabelText('Rate 5 out of 5 stars');
      await user.click(fiveStarButton);

      // Add comment
      const commentTextarea = screen.getByLabelText(/additional feedback comments/i);
      await user.type(commentTextarea, 'Excellent service!');

      // Select tip
      const twentyPercentButton = screen.getByRole('button', { name: /20%.*\$30.00\)/ });
      await user.click(twentyPercentButton);

      // Submit
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/feedback/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            appointmentId: 123,
            rating: 5,
            comment: 'Excellent service!',
            tipAmount: 30,
            driverRatings: {},
          }),
        });
      });
    });

    it('handles API error gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: false })
      });

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const user = userEvent.setup();
      render(<FeedbackForm {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Submit')).toBeInTheDocument();
      });

      // Provide rating and submit
      const fiveStarButton = screen.getByLabelText('Rate 5 out of 5 stars');
      await user.click(fiveStarButton);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          'An error occurred while submitting your feedback. Please try again.'
        );
      });
    });
  });

  // REQUIRED: State management testing
  describe('State Management', () => {
    it('maintains form state during interactions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: false })
      });

      const user = userEvent.setup();
      render(<FeedbackForm {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Submit')).toBeInTheDocument();
      });

      // Set rating
      const fourStarButton = screen.getByLabelText('Rate 4 out of 5 stars');
      await user.click(fourStarButton);

      // Set comment
      const commentTextarea = screen.getByLabelText(/additional feedback comments/i);
      await user.type(commentTextarea, 'Good job!');

      // Switch between tip options
      const twentyPercentButton = screen.getByRole('button', { name: /20%/ });
      await user.click(twentyPercentButton);

      const customTipButton = screen.getByRole('button', { name: /custom tip/i });
      await user.click(customTipButton);

      // Verify state is maintained
      expect(fourStarButton).toHaveAttribute('aria-pressed', 'true');
      expect(commentTextarea).toHaveValue('Good job!');
      expect(customTipButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('shows loading state during submission', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: false })
      });

      // Make submit request hang to test loading state
      let resolveSubmit: (value: any) => void;
      const submitPromise = new Promise(resolve => {
        resolveSubmit = resolve;
      });
      
      mockFetch.mockReturnValueOnce(submitPromise);

      const user = userEvent.setup();
      render(<FeedbackForm {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Submit')).toBeInTheDocument();
      });

      // Provide rating and submit
      const fiveStarButton = screen.getByLabelText('Rate 5 out of 5 stars');
      await user.click(fiveStarButton);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Processing...')).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });

      // Resolve the promise
      resolveSubmit!({
        ok: true,
        json: async () => ({ id: 1 })
      });

      await waitFor(() => {
        expect(screen.getByText('Thank you for your feedback!')).toBeInTheDocument();
      });
    });
  });

  // REQUIRED: Edge cases and error handling
  describe('Edge Cases', () => {
    it('handles missing optional props gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: false })
      });

      const minimalProps: FeedbackFormProps = {
        appointmentId: '123',
        appointmentType: 'Storage',
        appointmentDate: '2025-01-01',
        invoiceTotal: 100
      };

      render(<FeedbackForm {...minimalProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Boombox')).toBeInTheDocument(); // Default name
        expect(screen.getByText('Add a tip')).toBeInTheDocument();
      });
    });

    it('formats custom tip amount on blur', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: false })
      });

      const user = userEvent.setup();
      render(<FeedbackForm {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Custom Tip')).toBeInTheDocument();
      });

      const customTipButton = screen.getByRole('button', { name: /custom tip/i });
      await user.click(customTipButton);

      const customTipInput = screen.getByLabelText(/custom tip amount/i);
      await user.type(customTipInput, '15.5');
      
      // Trigger blur event
      fireEvent.blur(customTipInput);

      expect(customTipInput).toHaveValue(15.50);
    });
  });
});
