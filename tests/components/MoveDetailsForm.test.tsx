/**
 * @fileoverview Tests for MoveDetailsForm component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 * @source boombox-10.0/src/app/components/user-page/movedetailspopupform.tsx
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import {
  MoveDetailsForm,
  MoveDetailsFormProps,
} from '@/components/features/customers/MoveDetailsForm';

expect.extend(toHaveNoViolations);

// Mock Modal component
jest.mock('@/components/ui/primitives/Modal', () => ({
  Modal: function MockModal({ children, open, onClose, title, size }: any) {
    if (!open) return null;
    return (
      <div data-testid="modal" role="dialog" aria-labelledby="modal-title" data-size={size}>
        <h2 id="modal-title">{title}</h2>
        <button onClick={onClose} data-testid="modal-close">
          Close
        </button>
        {children}
      </div>
    );
  },
}));

// Mock YesOrNoRadio component
jest.mock('@/components/forms/YesOrNoRadio', () => ({
  YesOrNoRadio: function MockYesOrNoRadio({
    value,
    onChange,
    hasError,
    errorMessage,
    yesLabel,
    noLabel,
  }: any) {
    return (
      <div data-testid="yes-or-no-radio">
        <button
          data-testid="yes-button"
          onClick={() => onChange('Yes')}
          aria-pressed={value === 'Yes'}
        >
          {yesLabel}
        </button>
        <button
          data-testid="no-button"
          onClick={() => onChange('No')}
          aria-pressed={value === 'No'}
        >
          {noLabel}
        </button>
        {hasError && <span data-testid="radio-error">{errorMessage}</span>}
      </div>
    );
  },
}));

// Mock Select component
jest.mock('@/components/ui/primitives/Select', () => ({
  Select: function MockSelect({ children, value, onChange, error, id }: any) {
    return (
      <div>
        <select value={value} onChange={onChange} id={id} data-testid={id}>
          {children}
        </select>
        {error && <span data-testid={`${id}-error`}>{error}</span>}
      </div>
    );
  },
}));

describe('MoveDetailsForm', () => {
  const mockOnClose = jest.fn();
  const mockOnUpdateAppointment = jest.fn();

  const defaultProps: MoveDetailsFormProps = {
    appointmentId: 123,
    onClose: mockOnClose,
    onUpdateAppointment: mockOnUpdateAppointment,
    isOpen: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing when open', () => {
      render(<MoveDetailsForm {...defaultProps} />);
      expect(screen.getByText('Tell us more about your move')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      const closedProps = { ...defaultProps, isOpen: false };
      render(<MoveDetailsForm {...closedProps} />);
      expect(screen.queryByText('Tell us more about your move')).not.toBeInTheDocument();
    });

    it('displays all form fields', () => {
      render(<MoveDetailsForm {...defaultProps} />);
      
      expect(screen.getByText('Are you moving any items over 100lbs?')).toBeInTheDocument();
      expect(screen.getByLabelText('How long do you plan on storing your items?')).toBeInTheDocument();
      expect(screen.getByLabelText('How often will you need access to your storage unit?')).toBeInTheDocument();
      expect(screen.getByLabelText('Provide a description of what you are moving?')).toBeInTheDocument();
      expect(screen.getByLabelText('Provide a description of your moving conditions?')).toBeInTheDocument();
    });

    it('displays submit and close buttons', () => {
      render(<MoveDetailsForm {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /Add Details/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Close/i })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<MoveDetailsForm {...defaultProps} />);
      await testAccessibility(renderResult);
    });

    it('has proper labels for all form fields', () => {
      render(<MoveDetailsForm {...defaultProps} />);
      
      expect(screen.getByLabelText('How long do you plan on storing your items?')).toBeInTheDocument();
      expect(screen.getByLabelText('How often will you need access to your storage unit?')).toBeInTheDocument();
      expect(screen.getByLabelText('Provide a description of what you are moving?')).toBeInTheDocument();
      expect(screen.getByLabelText('Provide a description of your moving conditions?')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('shows error when submitting without selecting heavy items option', async () => {
      render(<MoveDetailsForm {...defaultProps} />);
      const submitButton = screen.getByRole('button', { name: /Add Details/i });
      
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('radio-error')).toHaveTextContent('Please select yes or no');
      });
    });

    it('shows error when submitting without selecting storage term', async () => {
      render(<MoveDetailsForm {...defaultProps} />);
      
      // Select heavy items
      const yesButton = screen.getByTestId('yes-button');
      await userEvent.click(yesButton);
      
      const submitButton = screen.getByRole('button', { name: /Add Details/i });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('storage-term-error')).toHaveTextContent('Please add a storage term');
      });
    });

    it('shows error when submitting without selecting access frequency', async () => {
      render(<MoveDetailsForm {...defaultProps} />);
      
      // Select heavy items
      const yesButton = screen.getByTestId('yes-button');
      await userEvent.click(yesButton);
      
      // Select storage term
      const storageTermSelect = screen.getByTestId('storage-term');
      fireEvent.change(storageTermSelect, { target: { value: '3-6 months' } });
      
      const submitButton = screen.getByRole('button', { name: /Add Details/i });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('access-frequency-error')).toHaveTextContent('Please choose storage access needed');
      });
    });

    it('clears error when heavy items option is selected', async () => {
      render(<MoveDetailsForm {...defaultProps} />);
      const submitButton = screen.getByRole('button', { name: /Add Details/i });
      
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('radio-error')).toBeInTheDocument();
      });
      
      const yesButton = screen.getByTestId('yes-button');
      await userEvent.click(yesButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('radio-error')).not.toBeInTheDocument();
      });
    });

    it('clears error when storage term is selected', async () => {
      render(<MoveDetailsForm {...defaultProps} />);
      
      // Trigger validation error
      const yesButton = screen.getByTestId('yes-button');
      await userEvent.click(yesButton);
      const submitButton = screen.getByRole('button', { name: /Add Details/i });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('storage-term-error')).toBeInTheDocument();
      });
      
      // Select storage term
      const storageTermSelect = screen.getByTestId('storage-term');
      fireEvent.change(storageTermSelect, { target: { value: '3-6 months' } });
      
      await waitFor(() => {
        expect(screen.queryByTestId('storage-term-error')).not.toBeInTheDocument();
      });
    });

    it('clears error when access frequency is selected', async () => {
      render(<MoveDetailsForm {...defaultProps} />);
      
      // Trigger validation error
      const yesButton = screen.getByTestId('yes-button');
      await userEvent.click(yesButton);
      const storageTermSelect = screen.getByTestId('storage-term');
      fireEvent.change(storageTermSelect, { target: { value: '3-6 months' } });
      const submitButton = screen.getByRole('button', { name: /Add Details/i });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('access-frequency-error')).toBeInTheDocument();
      });
      
      // Select access frequency
      const accessFrequencySelect = screen.getByTestId('access-frequency');
      fireEvent.change(accessFrequencySelect, { target: { value: 'Rarely (couple times a year)' } });
      
      await waitFor(() => {
        expect(screen.queryByTestId('access-frequency-error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('submits form with valid data', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        })
      ) as jest.Mock;

      render(<MoveDetailsForm {...defaultProps} />);
      
      // Fill out form
      const yesButton = screen.getByTestId('yes-button');
      await userEvent.click(yesButton);
      
      const storageTermSelect = screen.getByTestId('storage-term');
      fireEvent.change(storageTermSelect, { target: { value: '3-6 months' } });
      
      const accessFrequencySelect = screen.getByTestId('access-frequency');
      fireEvent.change(accessFrequencySelect, { target: { value: 'Rarely (couple times a year)' } });
      
      const itemDescriptionTextarea = screen.getByLabelText('Provide a description of what you are moving?');
      fireEvent.change(itemDescriptionTextarea, { target: { value: 'Furniture and boxes' } });
      
      const movingConditionsTextarea = screen.getByLabelText('Provide a description of your moving conditions?');
      fireEvent.change(movingConditionsTextarea, { target: { value: 'Third floor, no elevator' } });
      
      const submitButton = screen.getByRole('button', { name: /Add Details/i });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/orders/appointments/123/add-details',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              itemsOver100lbs: true,
              storageTerm: '3-6 months',
              storageAccessFrequency: 'Rarely (couple times a year)',
              moveDescription: 'Furniture and boxes',
              conditionsDescription: 'Third floor, no elevator',
            }),
          })
        );
      });
    });

    it('displays success message after successful submission', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        })
      ) as jest.Mock;

      render(<MoveDetailsForm {...defaultProps} />);
      
      // Fill out required fields
      const yesButton = screen.getByTestId('yes-button');
      await userEvent.click(yesButton);
      
      const storageTermSelect = screen.getByTestId('storage-term');
      fireEvent.change(storageTermSelect, { target: { value: '3-6 months' } });
      
      const accessFrequencySelect = screen.getByTestId('access-frequency');
      fireEvent.change(accessFrequencySelect, { target: { value: 'Rarely (couple times a year)' } });
      
      const submitButton = screen.getByRole('button', { name: /Add Details/i });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Thanks!')).toBeInTheDocument();
        expect(screen.getByText(/We appreciate you sharing more information/)).toBeInTheDocument();
      });
    });

    it('displays loading state during submission', async () => {
      global.fetch = jest.fn(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ success: true }),
                } as Response),
              100
            )
          )
      ) as jest.Mock;

      render(<MoveDetailsForm {...defaultProps} />);
      
      // Fill out required fields
      const yesButton = screen.getByTestId('yes-button');
      await userEvent.click(yesButton);
      
      const storageTermSelect = screen.getByTestId('storage-term');
      fireEvent.change(storageTermSelect, { target: { value: '3-6 months' } });
      
      const accessFrequencySelect = screen.getByTestId('access-frequency');
      fireEvent.change(accessFrequencySelect, { target: { value: 'Rarely (couple times a year)' } });
      
      const submitButton = screen.getByRole('button', { name: /Add Details/i });
      await userEvent.click(submitButton);
      
      expect(screen.getByText('Submitting Details')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Thanks!')).toBeInTheDocument();
      });
    });

    it('handles submission error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error'))) as jest.Mock;

      render(<MoveDetailsForm {...defaultProps} />);
      
      // Fill out required fields
      const yesButton = screen.getByTestId('yes-button');
      await userEvent.click(yesButton);
      
      const storageTermSelect = screen.getByTestId('storage-term');
      fireEvent.change(storageTermSelect, { target: { value: '3-6 months' } });
      
      const accessFrequencySelect = screen.getByTestId('access-frequency');
      fireEvent.change(accessFrequencySelect, { target: { value: 'Rarely (couple times a year)' } });
      
      const submitButton = screen.getByRole('button', { name: /Add Details/i });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });

    it('disables submit button during submission', async () => {
      global.fetch = jest.fn(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ success: true }),
                } as Response),
              100
            )
          )
      ) as jest.Mock;

      render(<MoveDetailsForm {...defaultProps} />);
      
      // Fill out required fields
      const yesButton = screen.getByTestId('yes-button');
      await userEvent.click(yesButton);
      
      const storageTermSelect = screen.getByTestId('storage-term');
      fireEvent.change(storageTermSelect, { target: { value: '3-6 months' } });
      
      const accessFrequencySelect = screen.getByTestId('access-frequency');
      fireEvent.change(accessFrequencySelect, { target: { value: 'Rarely (couple times a year)' } });
      
      const submitButton = screen.getByRole('button', { name: /Add Details/i });
      await userEvent.click(submitButton);
      
      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.getByText('Thanks!')).toBeInTheDocument();
      });
    });
  });

  describe('Form Reset', () => {
    it('resets form when modal closes', async () => {
      const { rerender } = render(<MoveDetailsForm {...defaultProps} />);
      
      // Fill out form
      const yesButton = screen.getByTestId('yes-button');
      await userEvent.click(yesButton);
      
      const storageTermSelect = screen.getByTestId('storage-term');
      fireEvent.change(storageTermSelect, { target: { value: '3-6 months' } });
      
      // Close modal
      rerender(<MoveDetailsForm {...defaultProps} isOpen={false} />);
      
      // Reopen modal
      rerender(<MoveDetailsForm {...defaultProps} isOpen={true} />);
      
      // Check form is reset
      await waitFor(() => {
        const storageTermSelectReopened = screen.getByTestId('storage-term') as HTMLSelectElement;
        expect(storageTermSelectReopened.value).toBe('');
      });
    });
  });

  describe('Close Behavior', () => {
    it('calls onClose when close button is clicked', async () => {
      render(<MoveDetailsForm {...defaultProps} />);
      const closeButton = screen.getAllByRole('button', { name: /Close/i })[0];
      
      await userEvent.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onUpdateAppointment when closing after successful submission', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        })
      ) as jest.Mock;

      render(<MoveDetailsForm {...defaultProps} />);
      
      // Fill out and submit form
      const yesButton = screen.getByTestId('yes-button');
      await userEvent.click(yesButton);
      
      const storageTermSelect = screen.getByTestId('storage-term');
      fireEvent.change(storageTermSelect, { target: { value: '3-6 months' } });
      
      const accessFrequencySelect = screen.getByTestId('access-frequency');
      fireEvent.change(accessFrequencySelect, { target: { value: 'Rarely (couple times a year)' } });
      
      const submitButton = screen.getByRole('button', { name: /Add Details/i });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Thanks!')).toBeInTheDocument();
      });
      
      // Close modal
      const closeButton = screen.getAllByRole('button', { name: /Close/i })[0];
      await userEvent.click(closeButton);
      
      expect(mockOnUpdateAppointment).toHaveBeenCalledWith(123);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});

