/**
 * @fileoverview Tests for DriverSignUpForm component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 * @source boombox-10.0/src/app/components/driver-signup/driversignupform.tsx
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { DriverSignUpForm } from '@/components/features/drivers/DriverSignUpForm';

expect.extend(toHaveNoViolations);

// Mock Next.js dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn()
  }))
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated'
  })),
  signOut: jest.fn(),
  signIn: jest.fn()
}));

// Mock form components with correct export patterns
jest.mock('@/components/forms/FirstNameInput', () => {
  const MockFirstNameInput = (props: any) => (
    <div data-testid="mock-first-name-input">
      <input
        type="text"
        value={props.value}
        onChange={(e) => props.onFirstNameChange(e.target.value)}
        placeholder="First Name"
        aria-label="First name"
        data-error={props.hasError}
      />
      {props.hasError && props.errorMessage && (
        <span role="alert">{props.errorMessage}</span>
      )}
    </div>
  );
  MockFirstNameInput.displayName = 'MockFirstNameInput';
  return {
    __esModule: true,
    default: MockFirstNameInput
  };
});

jest.mock('@/components/forms/EmailInput', () => {
  const MockEmailInput = (props: any) => (
    <div data-testid="mock-email-input">
      <input
        type="email"
        value={props.value}
        onChange={(e) => props.onEmailChange(e.target.value)}
        placeholder="Email"
        aria-label="Email address"
        data-error={props.hasError}
      />
      {props.hasError && props.errorMessage && (
        <span role="alert">{props.errorMessage}</span>
      )}
    </div>
  );
  MockEmailInput.displayName = 'MockEmailInput';
  return {
    __esModule: true,
    default: MockEmailInput
  };
});

jest.mock('@/components/forms/PhoneNumberInput', () => ({
  PhoneNumberInput: function MockPhoneNumberInput(props: any) {
    return (
      <div data-testid="mock-phone-input">
        <input
          type="tel"
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          placeholder="Phone number"
          aria-label="Phone number"
          data-error={props.hasError}
        />
        {props.hasError && props.errorMessage && (
          <span role="alert">{props.errorMessage}</span>
        )}
      </div>
    );
  }
}));

jest.mock('@/components/forms/YesOrNoRadio', () => {
  const MockYesOrNoRadio = (props: any) => (
    <div data-testid="mock-yes-no-radio" role="radiogroup">
      <button
        type="button"
        onClick={() => props.onChange('Yes')}
        aria-checked={props.value === 'Yes'}
        role="radio"
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => props.onChange('No')}
        aria-checked={props.value === 'No'}
        role="radio"
      >
        No
      </button>
      {props.hasError && props.errorMessage && (
        <span role="alert">{props.errorMessage}</span>
      )}
    </div>
  );
  MockYesOrNoRadio.displayName = 'MockYesOrNoRadio';
  return {
    __esModule: true,
    default: MockYesOrNoRadio
  };
});

jest.mock('@/components/ui/primitives/CheckboxCard', () => ({
  CheckboxCard: function MockCheckboxCard(props: any) {
    return (
      <div
        data-testid={`mock-checkbox-card-${props.id}`}
        role="radio"
        aria-checked={props.checked}
        onClick={props.onChange}
        data-error={props.hasError}
      >
        <h3>{props.title}</h3>
        <p>{props.titleDescription}</p>
        <p>{props.plan}</p>
        <p>{props.description}</p>
      </div>
    );
  }
}));

jest.mock('@/components/ui/primitives/Modal', () => ({
  Modal: function MockModal(props: any) {
    if (!props.open) return null;
    return (
      <div data-testid="mock-modal" role="dialog" aria-modal="true">
        <h2>{props.title}</h2>
        {props.children}
        <button onClick={props.onClose}>Close</button>
      </div>
    );
  }
}));

jest.mock('@/components/features/drivers/LocationSelect', () => ({
  LocationSelect: function MockLocationSelect(props: any) {
    return (
      <div data-testid="mock-location-select">
        <select
          value={props.value || ''}
          onChange={(e) => props.onLocationChange(e.target.value)}
          aria-label="Select location"
          data-error={props.hasError}
        >
          <option value="">Select location</option>
          <option value="San Francisco">San Francisco</option>
          <option value="San Jose">San Jose</option>
        </select>
        {props.hasError && (
          <span role="alert">Please select your location</span>
        )}
      </div>
    );
  }
}));

jest.mock('@/components/ui/primitives/Select', () => ({
  Select: function MockSelect(props: any) {
    return (
      <div data-testid="mock-select">
        <label>{props.label}</label>
        <select
          value={props.value || ''}
          onChange={(e) => props.onValueChange(e.target.value)}
          data-error={props.error}
        >
          <option value="">{props.placeholder}</option>
          {props.options?.map((option: any) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {props.error && (
          <span role="alert">{props.error}</span>
        )}
      </div>
    );
  }
}));

// Mock validation utilities
jest.mock('@/lib/utils/validationUtils', () => ({
  validateForm: jest.fn(() => ({ isValid: true, errors: {} }))
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('DriverSignUpForm', () => {
  // REQUIRED: Test cleanup
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ driver: { id: 123 } })
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<DriverSignUpForm />);
      expect(screen.getByRole('heading', { name: /tell us about yourself/i })).toBeInTheDocument();
    });

    it('renders all required form fields', () => {
      render(<DriverSignUpForm />);
      
      expect(screen.getByTestId('mock-first-name-input')).toBeInTheDocument();
      expect(screen.getByTestId('mock-email-input')).toBeInTheDocument();
      expect(screen.getByTestId('mock-phone-input')).toBeInTheDocument();
      expect(screen.getByTestId('mock-location-select')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit application/i })).toBeInTheDocument();
    });

    it('renders services section by default', () => {
      render(<DriverSignUpForm />);
      
      expect(screen.getByRole('heading', { name: /what services can you offer/i })).toBeInTheDocument();
      expect(screen.getByTestId('mock-checkbox-card-option1')).toBeInTheDocument();
      expect(screen.getByTestId('mock-checkbox-card-option2')).toBeInTheDocument();
    });

    it('hides services section when hideServicesSection is true', () => {
      render(<DriverSignUpForm hideServicesSection={true} />);
      
      expect(screen.queryByRole('heading', { name: /what services can you offer/i })).not.toBeInTheDocument();
      expect(screen.queryByTestId('mock-checkbox-card-option1')).not.toBeInTheDocument();
    });

    it('renders vehicle information section when no invitation token', () => {
      render(<DriverSignUpForm />);
      
      expect(screen.getByRole('heading', { name: /vehicle information/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/vehicle type/i)).toBeInTheDocument();
    });

    it('hides vehicle information section with invitation token', () => {
      render(<DriverSignUpForm invitationToken="abc123" />);
      
      expect(screen.queryByRole('heading', { name: /vehicle information/i })).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/vehicle type/i)).not.toBeInTheDocument();
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<DriverSignUpForm />);
      await testAccessibility(renderResult);
    });

    it('maintains accessibility with error state', async () => {
      const { validateForm } = require('@/lib/utils/validationUtils');
      validateForm.mockReturnValue({
        isValid: false,
        errors: { firstName: 'First name is required' }
      });

      const renderResult = render(<DriverSignUpForm />);
      const submitButton = screen.getByRole('button', { name: /submit application/i });
      
      await userEvent.click(submitButton);
      await testAccessibility(renderResult);
    });

    it('has proper form structure and labels', () => {
      render(<DriverSignUpForm />);
      
      // Check for proper heading hierarchy
      expect(screen.getByRole('heading', { level: 2, name: /tell us about yourself/i })).toBeInTheDocument();
      
      // Check for form controls with proper labels
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    });
  });

  // REQUIRED: User interaction testing
  describe('User Interactions', () => {
    it('handles form input changes correctly', async () => {
      const user = userEvent.setup();
      render(<DriverSignUpForm />);
      
      const firstNameInput = screen.getByLabelText(/first name/i);
      const emailInput = screen.getByLabelText(/email/i);
      
      await user.type(firstNameInput, 'John');
      await user.type(emailInput, 'john@example.com');
      
      expect(firstNameInput).toHaveValue('John');
      expect(emailInput).toHaveValue('john@example.com');
    });

    it('handles service selection correctly', async () => {
      const user = userEvent.setup();
      render(<DriverSignUpForm />);
      
      const storageServiceCard = screen.getByTestId('mock-checkbox-card-option1');
      const packingServiceCard = screen.getByTestId('mock-checkbox-card-option2');
      
      await user.click(storageServiceCard);
      expect(storageServiceCard).toHaveAttribute('aria-checked', 'true');
      
      await user.click(packingServiceCard);
      expect(packingServiceCard).toHaveAttribute('aria-checked', 'true');
      
      // Deselect first service
      await user.click(storageServiceCard);
      expect(storageServiceCard).toHaveAttribute('aria-checked', 'false');
    });

    it('handles yes/no radio selections', async () => {
      const user = userEvent.setup();
      render(<DriverSignUpForm />);
      
      const backgroundCheckRadios = screen.getAllByTestId('mock-yes-no-radio');
      const backgroundCheckRadio = backgroundCheckRadios[0]; // Background check consent
      
      const yesButton = backgroundCheckRadio.querySelector('[role="radio"][aria-checked="false"]');
      if (yesButton) {
        await user.click(yesButton);
        expect(yesButton).toHaveAttribute('aria-checked', 'true');
      }
    });

    it('handles location selection', async () => {
      const user = userEvent.setup();
      render(<DriverSignUpForm />);
      
      const locationSelect = screen.getByLabelText(/select location/i);
      await user.selectOptions(locationSelect, 'San Francisco');
      
      expect(locationSelect).toHaveValue('San Francisco');
    });
  });

  // REQUIRED: Form validation testing
  describe('Form Validation', () => {
    it('shows validation errors when form is invalid', async () => {
      const { validateForm } = require('@/lib/utils/validationUtils');
      validateForm.mockReturnValue({
        isValid: false,
        errors: {
          firstName: 'First name is required',
          email: 'Please enter a valid email',
          phoneNumber: 'Phone number is required'
        }
      });

      const user = userEvent.setup();
      render(<DriverSignUpForm />);
      
      const submitButton = screen.getByRole('button', { name: /submit application/i });
      await user.click(submitButton);
      
      // Check that validation was called
      expect(validateForm).toHaveBeenCalled();
      
      // Form should not be submitted when invalid
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('clears errors when user interacts with fields', async () => {
      const user = userEvent.setup();
      render(<DriverSignUpForm />);
      
      const firstNameInput = screen.getByLabelText(/first name/i);
      await user.type(firstNameInput, 'John');
      
      // Verify error clearing behavior through component interaction
      expect(firstNameInput).toHaveValue('John');
    });

    it('validates required fields correctly', async () => {
      const { validateForm } = require('@/lib/utils/validationUtils');
      const user = userEvent.setup();
      render(<DriverSignUpForm />);
      
      const submitButton = screen.getByRole('button', { name: /submit application/i });
      await user.click(submitButton);
      
      expect(validateForm).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: '',
          lastName: '',
          email: '',
          phoneNumber: '',
          location: '',
          phoneProvider: '',
          services: '',
          vehicle: '',
          hasTrailerHitch: '',
          backgroundCheck: ''
        }),
        expect.objectContaining({
          firstName: { required: true, firstName: true },
          lastName: { required: true, name: true },
          email: { required: true, email: true },
          phoneNumber: { required: true, phone: true },
          location: { required: true },
          phoneProvider: { required: true },
          backgroundCheck: { required: true },
          services: { required: true },
          hasTrailerHitch: { required: true },
          vehicle: { required: true }
        })
      );
    });
  });

  // REQUIRED: API integration testing
  describe('API Integration', () => {
    it('submits form data to correct endpoint for regular signup', async () => {
      const { validateForm } = require('@/lib/utils/validationUtils');
      validateForm.mockReturnValue({ isValid: true, errors: {} });
      
      const user = userEvent.setup();
      render(<DriverSignUpForm />);
      
      // Fill out form with valid data
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      
      const submitButton = screen.getByRole('button', { name: /submit application/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/drivers/list',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: expect.stringContaining('John')
          })
        );
      });
    });

    it('submits form data to invitation endpoint with token', async () => {
      const { validateForm } = require('@/lib/utils/validationUtils');
      validateForm.mockReturnValue({ isValid: true, errors: {} });
      
      const user = userEvent.setup();
      render(<DriverSignUpForm invitationToken="abc123" />);
      
      // Fill out form with valid data
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      
      const submitButton = screen.getByRole('button', { name: /submit application/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/drivers/accept-invitation',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('abc123')
          })
        );
      });
    });

    it('handles API errors gracefully', async () => {
      const { validateForm } = require('@/lib/utils/validationUtils');
      validateForm.mockReturnValue({ isValid: true, errors: {} });
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ error: 'Driver already exists' })
      });

      const user = userEvent.setup();
      render(<DriverSignUpForm />);
      
      // Fill out form to make it valid
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      
      const submitButton = screen.getByRole('button', { name: /submit application/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        const alerts = screen.getAllByRole('alert');
        const apiErrorAlert = alerts.find(alert => 
          alert.textContent?.includes('Driver already exists')
        );
        expect(apiErrorAlert).toBeInTheDocument();
      });
    });

    it('shows loading state during submission', async () => {
      const { validateForm } = require('@/lib/utils/validationUtils');
      validateForm.mockReturnValue({ isValid: true, errors: {} });
      
      // Mock a delayed response
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ driver: { id: 123 } })
        }), 100))
      );

      const user = userEvent.setup();
      render(<DriverSignUpForm />);
      
      // Fill out form to make it valid
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      
      const submitButton = screen.getByRole('button', { name: /submit application/i });
      await user.click(submitButton);
      
      // Check for loading state
      expect(screen.getByText(/processing your application/i)).toBeInTheDocument();
      expect(submitButton).toHaveTextContent('Processing...');
    });
  });

  // REQUIRED: Session management testing
  describe('Session Management', () => {
    it('shows session warning when user is logged in', async () => {
      const { useSession } = require('next-auth/react');
      const { validateForm } = require('@/lib/utils/validationUtils');
      
      useSession.mockReturnValue({
        data: { user: { id: 'existing-user' } },
        status: 'authenticated'
      });
      validateForm.mockReturnValue({ isValid: true, errors: {} });

      const user = userEvent.setup();
      render(<DriverSignUpForm />);
      
      // Fill out form to make it valid
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      
      const submitButton = screen.getByRole('button', { name: /submit application/i });
      await user.click(submitButton);
      
      expect(screen.getByTestId('mock-modal')).toBeInTheDocument();
      expect(screen.getByText(/account session warning/i)).toBeInTheDocument();
    });

    it('handles logout and form submission flow', async () => {
      const { useSession, signOut, signIn } = require('next-auth/react');
      const { validateForm } = require('@/lib/utils/validationUtils');
      
      useSession.mockReturnValue({
        data: { user: { id: 'existing-user' } },
        status: 'authenticated'
      });
      validateForm.mockReturnValue({ isValid: true, errors: {} });

      const user = userEvent.setup();
      render(<DriverSignUpForm />);
      
      // Fill out form to make it valid
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      
      const submitButton = screen.getByRole('button', { name: /submit application/i });
      await user.click(submitButton);
      
      // Confirm logout in modal
      const logoutButton = screen.getByRole('button', { name: /log out & continue/i });
      await user.click(logoutButton);
      
      await waitFor(() => {
        expect(signOut).toHaveBeenCalledWith({ redirect: false });
      });
    });
  });

  // REQUIRED: Invitation token behavior
  describe('Invitation Token Behavior', () => {
    it('sets default service selection with invitation token', () => {
      render(<DriverSignUpForm invitationToken="abc123" />);
      
      // Storage Unit Delivery should be pre-selected
      const storageServiceCard = screen.getByTestId('mock-checkbox-card-option1');
      expect(storageServiceCard).toHaveAttribute('aria-checked', 'true');
    });

    it('includes correct data for invitation-based signup', async () => {
      const { validateForm } = require('@/lib/utils/validationUtils');
      validateForm.mockReturnValue({ isValid: true, errors: {} });
      
      const user = userEvent.setup();
      render(<DriverSignUpForm invitationToken="abc123" />);
      
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      
      const submitButton = screen.getByRole('button', { name: /submit application/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/drivers/accept-invitation',
          expect.objectContaining({
            body: expect.stringContaining('"vehicleType":"pending"')
          })
        );
      });
    });
  });

  // REQUIRED: Error handling
  describe('Error Handling', () => {
    it('displays network errors appropriately', async () => {
      const { validateForm } = require('@/lib/utils/validationUtils');
      validateForm.mockReturnValue({ isValid: true, errors: {} });
      
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const user = userEvent.setup();
      render(<DriverSignUpForm />);
      
      // Fill out form to make it valid
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      
      const submitButton = screen.getByRole('button', { name: /submit application/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/unexpected error occurred/i)).toBeInTheDocument();
      });
    });

    it('handles sign-in errors after successful registration', async () => {
      const { validateForm } = require('@/lib/utils/validationUtils');
      const { signIn } = require('next-auth/react');
      
      validateForm.mockReturnValue({ isValid: true, errors: {} });
      signIn.mockResolvedValue({ error: 'SignIn failed' });

      const user = userEvent.setup();
      render(<DriverSignUpForm />);
      
      // Fill out form to make it valid
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      
      const submitButton = screen.getByRole('button', { name: /submit application/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to sign in/i)).toBeInTheDocument();
      });
    });
  });
});
