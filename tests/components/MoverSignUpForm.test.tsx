/**
 * @fileoverview Tests for MoverSignUpForm component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 * @source Tests migrated from boombox-10.0 patterns with enhanced coverage
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { MoverSignUpForm } from '@/components/features/moving-partners/MoverSignUpForm';

expect.extend(toHaveNoViolations);

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signOut: jest.fn(() => Promise.resolve()),
  signIn: jest.fn(() => Promise.resolve({ error: null })),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  })),
}));

// Mock fetch
global.fetch = jest.fn();

describe('MoverSignUpForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<MoverSignUpForm />);
      expect(screen.getByText('Tell us about your company')).toBeInTheDocument();
    });

    it('renders all form fields', () => {
      render(<MoverSignUpForm />);
      
      // Check for company name input (by placeholder since it uses Input component)
      expect(screen.getByPlaceholderText('Enter your company name')).toBeInTheDocument();
      
      // Check for email input
      expect(screen.getByPlaceholderText('Enter your email address')).toBeInTheDocument();
      
      // Check for phone input
      expect(screen.getByPlaceholderText('Enter your phone number')).toBeInTheDocument();
      
      // Check for employee count section
      expect(screen.getByText('How big is your team?')).toBeInTheDocument();
      
      // Check for website input
      expect(screen.getByPlaceholderText('Enter your website URL or GMB page')).toBeInTheDocument();
      
      // Check for submit button
      expect(screen.getByRole('button', { name: /submit application/i })).toBeInTheDocument();
    });

    it('displays helper text for website field', () => {
      render(<MoverSignUpForm />);
      expect(
        screen.getByText(/If you don't have a website, you can link your Google My Business Page/i)
      ).toBeInTheDocument();
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<MoverSignUpForm />);
      await testAccessibility(renderResult);
    });

    it('maintains accessibility with error state', async () => {
      render(<MoverSignUpForm />);
      const submitButton = screen.getByRole('button', { name: /submit application/i });
      
      await userEvent.click(submitButton);
      
      // Wait for validation errors to appear
      await waitFor(() => {
        expect(screen.getByText('Company name is required')).toBeInTheDocument();
      });
      
      const renderResult = { container: screen.getByText('Tell us about your company').closest('div')! };
      const results = await axe(renderResult.container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA labels for form fields', () => {
      render(<MoverSignUpForm />);
      
      const companyNameInput = screen.getByPlaceholderText('Enter your company name');
      expect(companyNameInput).toHaveAttribute('aria-label', 'Company name');
      
      const websiteInput = screen.getByPlaceholderText('Enter your website URL or GMB page');
      expect(websiteInput).toHaveAttribute('aria-label', 'Company website');
    });

    it('indicates required fields properly', () => {
      render(<MoverSignUpForm />);
      const submitButton = screen.getByRole('button', { name: /submit application/i });
      
      // Button should not be disabled initially (form allows submission attempt)
      expect(submitButton).not.toBeDisabled();
    });
  });

  // REQUIRED: User interaction testing
  describe('User Interactions', () => {
    it('handles company name input correctly', async () => {
      const user = userEvent.setup();
      render(<MoverSignUpForm />);
      
      const companyNameInput = screen.getByPlaceholderText('Enter your company name');
      await user.type(companyNameInput, 'Test Moving Company');
      
      expect(companyNameInput).toHaveValue('Test Moving Company');
    });

    it('handles email input correctly', async () => {
      const user = userEvent.setup();
      render(<MoverSignUpForm />);
      
      const emailInput = screen.getByPlaceholderText('Enter your email address');
      await user.type(emailInput, 'test@example.com');
      
      expect(emailInput).toHaveValue('test@example.com');
    });

    it('handles phone number input correctly', async () => {
      render(<MoverSignUpForm />);
      
      const phoneInput = screen.getByPlaceholderText('Enter your phone number');
      // Use fireEvent for phone input as it has special formatting logic
      fireEvent.change(phoneInput, { target: { value: '1234567890' } });
      
      // Phone component shows raw digits while typing
      expect(phoneInput).toHaveValue('1234567890');
    });

    it('handles website input correctly', async () => {
      const user = userEvent.setup();
      render(<MoverSignUpForm />);
      
      const websiteInput = screen.getByPlaceholderText('Enter your website URL or GMB page');
      await user.type(websiteInput, 'https://example.com');
      
      expect(websiteInput).toHaveValue('https://example.com');
    });

    it('handles employee count selection', async () => {
      const user = userEvent.setup();
      render(<MoverSignUpForm />);
      
      // Find and click the select dropdown
      const selectTrigger = screen.getByRole('combobox');
      await user.click(selectTrigger);
      
      // Wait for dropdown to open and select an option
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      
      const option = screen.getByRole('option', { name: '1-5' });
      await user.click(option);
      
      // Verify selection
      await waitFor(() => {
        expect(selectTrigger).toHaveTextContent('1-5');
      });
    });
  });

  // Form validation testing
  describe('Form Validation', () => {
    it('shows validation errors when submitting empty form', async () => {
      const user = userEvent.setup();
      render(<MoverSignUpForm />);
      
      const submitButton = screen.getByRole('button', { name: /submit application/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Company name is required')).toBeInTheDocument();
        expect(screen.getByText('Please enter a valid email')).toBeInTheDocument();
        expect(screen.getByText('Phone number is required')).toBeInTheDocument();
        expect(screen.getByText('Please enter a valid website URL')).toBeInTheDocument();
        expect(screen.getByText('Please select the number of employees')).toBeInTheDocument();
        expect(screen.getByText('Please fix the errors above before submitting.')).toBeInTheDocument();
      });
    });

    it('validates email format', async () => {
      const user = userEvent.setup();
      render(<MoverSignUpForm />);
      
      const emailInput = screen.getByPlaceholderText('Enter your email address');
      await user.type(emailInput, 'invalid-email');
      
      const submitButton = screen.getByRole('button', { name: /submit application/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email')).toBeInTheDocument();
      });
    });

    it('validates website URL format', async () => {
      const user = userEvent.setup();
      render(<MoverSignUpForm />);
      
      const websiteInput = screen.getByPlaceholderText('Enter your website URL or GMB page');
      await user.type(websiteInput, 'not-a-valid-url');
      
      const submitButton = screen.getByRole('button', { name: /submit application/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid website URL')).toBeInTheDocument();
      });
    });

    it('clears error when user starts typing in company name field', async () => {
      const user = userEvent.setup();
      render(<MoverSignUpForm />);
      
      // Trigger validation error
      const submitButton = screen.getByRole('button', { name: /submit application/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Company name is required')).toBeInTheDocument();
      });
      
      // Start typing
      const companyNameInput = screen.getByPlaceholderText('Enter your company name');
      await user.type(companyNameInput, 'T');
      
      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Company name is required')).not.toBeInTheDocument();
      });
    });
  });

  // API integration testing
  describe('Form Submission', () => {
    it('submits form with valid data', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        mover: {
          id: '123',
          companyName: 'Test Moving Company',
        },
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
      
      // Mock signIn
      const { signIn } = require('next-auth/react');
      signIn.mockResolvedValueOnce({ error: null });
      
      // Mock window.location.href
      delete (window as any).location;
      (window as any).location = { href: '' };
      
      render(<MoverSignUpForm />);
      
      // Fill out form
      const companyNameInput = screen.getByPlaceholderText('Enter your company name');
      await user.type(companyNameInput, 'Test Moving Company');
      
      const emailInput = screen.getByPlaceholderText('Enter your email address');
      await user.type(emailInput, 'test@example.com');
      
      const phoneInput = screen.getByPlaceholderText('Enter your phone number');
      fireEvent.change(phoneInput, { target: { value: '1234567890' } });
      
      const websiteInput = screen.getByPlaceholderText('Enter your website URL or GMB page');
      await user.type(websiteInput, 'https://example.com');
      
      // Select employee count
      const selectTrigger = screen.getByRole('combobox');
      await user.click(selectTrigger);
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      const option = screen.getByRole('option', { name: '1-5' });
      await user.click(option);
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /submit application/i });
      await user.click(submitButton);
      
      // Verify API call
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/moving-partners/list',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: expect.stringContaining('Test Moving Company'),
          })
        );
      });
    });

    it('displays loading state during submission', async () => {
      const user = userEvent.setup();
      
      // Make fetch hang
      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );
      
      render(<MoverSignUpForm />);
      
      // Fill out required fields quickly
      fireEvent.change(screen.getByPlaceholderText('Enter your company name'), {
        target: { value: 'Test Company' },
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your email address'), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('Phone number'), {
        target: { value: '1234567890' },
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your website URL or GMB page'), {
        target: { value: 'https://example.com' },
      });
      
      // Select employee count
      const selectTrigger = screen.getByRole('combobox');
      await user.click(selectTrigger);
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      const option = screen.getByRole('option', { name: '1-5' });
      await user.click(option);
      
      // Submit
      const submitButton = screen.getByRole('button', { name: /submit application/i });
      await user.click(submitButton);
      
      // Check for loading state
      await waitFor(() => {
        expect(screen.getByText('Processing your application...')).toBeInTheDocument();
      });
    });

    it('handles API error responses', async () => {
      const user = userEvent.setup();
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      });
      
      render(<MoverSignUpForm />);
      
      // Fill out form
      fireEvent.change(screen.getByPlaceholderText('Enter your company name'), {
        target: { value: 'Test Company' },
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your email address'), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('Phone number'), {
        target: { value: '1234567890' },
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your website URL or GMB page'), {
        target: { value: 'https://example.com' },
      });
      
      // Select employee count
      const selectTrigger = screen.getByRole('combobox');
      await user.click(selectTrigger);
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      const option = screen.getByRole('option', { name: '1-5' });
      await user.click(option);
      
      // Submit
      const submitButton = screen.getByRole('button', { name: /submit application/i });
      await user.click(submitButton);
      
      // Check for error message
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/Failed to create mover company/i);
      });
    });

    it('handles duplicate account error (409)', async () => {
      const user = userEvent.setup();
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ error: 'Account already exists' }),
      });
      
      render(<MoverSignUpForm />);
      
      // Fill out form
      fireEvent.change(screen.getByPlaceholderText('Enter your company name'), {
        target: { value: 'Test Company' },
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your email address'), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('Phone number'), {
        target: { value: '1234567890' },
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your website URL or GMB page'), {
        target: { value: 'https://example.com' },
      });
      
      // Select employee count
      const selectTrigger = screen.getByRole('combobox');
      await user.click(selectTrigger);
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      const option = screen.getByRole('option', { name: '1-5' });
      await user.click(option);
      
      // Submit
      const submitButton = screen.getByRole('button', { name: /submit application/i });
      await user.click(submitButton);
      
      // Check for duplicate error message
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/Account already exists/i);
      });
    });
  });

  // Session management testing
  describe('Session Management', () => {
    it('shows session warning modal when user is already logged in', async () => {
      const user = userEvent.setup();
      
      // Mock logged in session
      const { useSession } = require('next-auth/react');
      useSession.mockReturnValueOnce({
        data: { user: { id: 'existing-user' } },
        status: 'authenticated',
      });
      
      render(<MoverSignUpForm />);
      
      // Fill out form
      fireEvent.change(screen.getByPlaceholderText('Enter your company name'), {
        target: { value: 'Test Company' },
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your email address'), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('Phone number'), {
        target: { value: '1234567890' },
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your website URL or GMB page'), {
        target: { value: 'https://example.com' },
      });
      
      // Select employee count
      const selectTrigger = screen.getByRole('combobox');
      await user.click(selectTrigger);
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      const option = screen.getByRole('option', { name: '1-5' });
      await user.click(option);
      
      // Submit
      const submitButton = screen.getByRole('button', { name: /submit application/i });
      await user.click(submitButton);
      
      // Check for session warning modal
      await waitFor(() => {
        expect(screen.getByText('Already Logged In')).toBeInTheDocument();
        expect(
          screen.getByText(/You are currently logged in to another account/i)
        ).toBeInTheDocument();
      });
    });

    it('allows canceling session warning modal', async () => {
      const user = userEvent.setup();
      
      // Mock logged in session
      const { useSession } = require('next-auth/react');
      useSession.mockReturnValueOnce({
        data: { user: { id: 'existing-user' } },
        status: 'authenticated',
      });
      
      render(<MoverSignUpForm />);
      
      // Fill out and submit form to trigger modal
      fireEvent.change(screen.getByPlaceholderText('Enter your company name'), {
        target: { value: 'Test Company' },
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your email address'), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('Phone number'), {
        target: { value: '1234567890' },
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your website URL or GMB page'), {
        target: { value: 'https://example.com' },
      });
      
      const selectTrigger = screen.getByRole('combobox');
      await user.click(selectTrigger);
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      const option = screen.getByRole('option', { name: '1-5' });
      await user.click(option);
      
      const submitButton = screen.getByRole('button', { name: /submit application/i });
      await user.click(submitButton);
      
      // Wait for modal
      await waitFor(() => {
        expect(screen.getByText('Already Logged In')).toBeInTheDocument();
      });
      
      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      // Modal should be closed
      await waitFor(() => {
        expect(screen.queryByText('Already Logged In')).not.toBeInTheDocument();
      });
    });
  });
});

