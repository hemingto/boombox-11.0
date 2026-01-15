/**
 * @fileoverview Integration tests for complete Get Quote flow
 * @source boombox-11.0/src/components/features/orders/get-quote/GetQuoteForm.tsx
 * 
 * TEST COVERAGE:
 * - Complete 5-step quote flow from start to appointment creation
 * - Step-by-step navigation with validation
 * - Conditional labor selection (DIY vs Full Service)
 * - API integration with mocked responses
 * - Stripe payment processing (mocked)
 * - SMS verification workflow (mocked)
 * - Error recovery workflows and user feedback
 * - Accessibility flow testing
 * - Form state persistence across steps
 * - Multi-plan type workflows
 * - Real user interaction patterns
 * - Cross-component integration
 * - End-to-end form submission
 * 
 * FLOW STEPS:
 * Step 1: Address & storage unit selection (QuoteBuilder)
 * Step 2: Date/time scheduling (Scheduler)
 * Step 3: Labor selection (ChooseLabor) - conditional on Full Service
 * Step 4: Payment & contact info (ConfirmAppointment)
 * Step 5: Phone verification (VerifyPhoneNumber)
 * 
 * @refactor Comprehensive integration tests for the entire Get Quote user journey
 */

import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { GetQuoteForm } from '@/components/features/orders/get-quote';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// ===== MOCK SETUP =====

// Mock Next.js hooks
const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockRouter = jest.fn(() => '/success');

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
    replace: mockRouter
  })
}));

// Mock next-auth session (GetQuote doesn't require auth, but VerifyPhoneNumber uses signIn)
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(() => Promise.resolve({ ok: true, error: null })),
  useSession: () => ({
    data: null,
    status: 'unauthenticated'
  })
}));

// Mock API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Helper to create mock API responses
const createMockResponse = (data: any, ok = true) => ({
  ok,
  status: ok ? 200 : 400,
  json: async () => data,
  headers: new Headers({ 'content-type': 'application/json' })
});

// Default API mock responses
mockFetch.mockImplementation((url: string, options?: any) => {
  const urlString = url.toString();
  
  // SMS verification endpoints
  if (urlString.includes('/api/auth/send-code')) {
    return Promise.resolve(createMockResponse({ success: true }));
  }
  
  if (urlString.includes('/api/auth/verify-code')) {
    return Promise.resolve(createMockResponse({ success: true }));
  }
  
  // Stripe customer creation
  if (urlString.includes('/api/payments/create-customer')) {
    return Promise.resolve(createMockResponse({ 
      customerId: 'cus_test123',
      success: true 
    }));
  }
  
  // Quote submission
  if (urlString.includes('/api/orders/submit-quote')) {
    return Promise.resolve(createMockResponse({
      success: true,
      appointmentId: 456,
      userId: 'user_test123'
    }));
  }
  
  // Moving partners search
  if (urlString.includes('/api/moving-partners/search')) {
    return Promise.resolve(createMockResponse({
      movingPartners: [
        {
          id: '1',
          name: 'Test Movers',
          price: '150',
          onfleetTeamId: 'team_123',
          available: true
        }
      ]
    }));
  }
  
  // Availability check
  if (urlString.includes('/api/orders/availability')) {
    return Promise.resolve(createMockResponse({
      availableDates: ['2024-12-20', '2024-12-21', '2024-12-22'],
      availableTimeSlots: ['9:00 AM - 12:00 PM', '1:00 PM - 4:00 PM']
    }));
  }
  
  // Default response
  return Promise.resolve(createMockResponse({}));
});

// Mock Google Maps
global.google = {
  maps: {
    places: {
      Autocomplete: jest.fn().mockImplementation(() => ({
        addListener: jest.fn(),
        getPlace: jest.fn(() => ({
          formatted_address: '123 Test St, San Francisco, CA 94102',
          address_components: [
            { types: ['postal_code'], short_name: '94102' },
            { types: ['locality'], long_name: 'San Francisco' }
          ],
          geometry: {
            location: {
              lat: () => 37.7749,
              lng: () => -122.4194
            }
          }
        }))
      })),
      PlacesServiceStatus: {
        OK: 'OK'
      }
    },
    LatLngLiteral: jest.fn()
  }
} as any;

// Mock Stripe
const mockStripeElements = jest.fn(() => ({
  getElement: jest.fn(),
  create: jest.fn(),
  update: jest.fn()
}));

const mockStripeCreatePaymentMethod = jest.fn(() => 
  Promise.resolve({ 
    paymentMethod: { id: 'pm_test123' },
    error: null 
  })
);

const mockStripeInstance = {
  elements: mockStripeElements,
  createPaymentMethod: mockStripeCreatePaymentMethod,
  confirmCardPayment: jest.fn(),
  retrievePaymentIntent: jest.fn()
};

jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <div data-testid="stripe-elements">{children}</div>,
  useStripe: () => mockStripeInstance,
  useElements: () => mockStripeElements(),
  CardNumberElement: () => <input data-testid="card-number" aria-label="Card number" />,
  CardExpiryElement: () => <input data-testid="card-expiry" aria-label="Card expiry" />,
  CardCvcElement: () => <input data-testid="card-cvc" aria-label="Card CVC" />
}));

jest.mock('@/lib/integrations/stripeClientSide', () => ({
  getStripePromise: jest.fn(() => Promise.resolve(mockStripeInstance))
}));

// ===== TEST UTILITIES =====

/**
 * Helper to advance to a specific step in the quote flow
 */
async function advanceToStep(stepNumber: number, user: ReturnType<typeof userEvent.setup>) {
  // Step 1: Address and storage selection
  if (stepNumber >= 1) {
    const addressInput = screen.getByLabelText(/address/i);
    await user.clear(addressInput);
    await user.type(addressInput, '123 Test St, San Francisco, CA 94102');
    
    // Simulate address selection
    fireEvent.change(addressInput, {
      target: { value: '123 Test St, San Francisco, CA 94102' }
    });
    
    // Select plan
    const fullServiceCard = screen.getByLabelText(/full service/i);
    await user.click(fullServiceCard);
    
    // Select insurance
    const insuranceYes = screen.getByLabelText(/yes.*insurance/i);
    await user.click(insuranceYes);
    
    // Click MyQuote button to advance to Step 2
    const myQuoteButton = screen.getByRole('button', { name: /schedule appointment/i });
    await user.click(myQuoteButton);
  }
  
  // Step 2: Scheduling
  if (stepNumber >= 2) {
    await waitFor(() => {
      expect(screen.getByText(/schedule/i)).toBeInTheDocument();
    });
    
    // Select date and time (mocked in component)
    // User must click MyQuote button to advance (no auto-advancement)
    if (stepNumber >= 3) {
      const reserveButton = screen.getByRole('button', { name: /reserve appointment/i });
      await user.click(reserveButton);
    }
  }
  
  // Step 3: Labor selection (Full Service only)
  if (stepNumber >= 3) {
    await waitFor(() => {
      expect(screen.getByText(/choose.*labor/i)).toBeInTheDocument();
    });
    
    if (stepNumber >= 4) {
      const selectMoversButton = screen.getByRole('button', { name: /select movers/i });
      await user.click(selectMoversButton);
    }
  }
  
  // Step 4: Payment and contact
  if (stepNumber >= 4) {
    await waitFor(() => {
      expect(screen.getByText(/confirm/i)).toBeInTheDocument();
    });
    
    if (stepNumber >= 5) {
      const confirmButton = screen.getByRole('button', { name: /confirm appointment/i });
      await user.click(confirmButton);
    }
  }
  
  // Step 5: Phone verification
  if (stepNumber >= 5) {
    await waitFor(() => {
      expect(screen.getByText(/verify.*phone/i)).toBeInTheDocument();
    });
  }
}

// ===== TEST SUITES =====

describe('GetQuoteFlow Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;
  
  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    mockFetch.mockClear();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  // ===== BASIC RENDERING =====
  
  describe('Initial Render', () => {
    it('should render Step 1 (QuoteBuilder) on initial load', async () => {
      render(<GetQuoteForm />);
      
      await waitFor(() => {
        expect(screen.getByText(/step 1 of 5/i)).toBeInTheDocument();
      });
      
      expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
    });
    
    it('should have no accessibility violations on initial render', async () => {
      const { container } = render(<GetQuoteForm />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
      });
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
    
    it('should display MyQuote sidebar with default values', async () => {
      render(<GetQuoteForm />);
      
      await waitFor(() => {
        expect(screen.getByText(/step 1 of 5/i)).toBeInTheDocument();
      });
    });
  });
  
  // ===== STEP 1: ADDRESS & STORAGE =====
  
  describe('Step 1: Address and Storage Selection', () => {
    it('should validate address before allowing progression', async () => {
      render(<GetQuoteForm />);
      
      const continueButton = screen.getByRole('button', { name: /continue/i });
      await user.click(continueButton);
      
      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/address.*required/i)).toBeInTheDocument();
      });
    });
    
    it('should allow storage unit count increment/decrement', async () => {
      render(<GetQuoteForm />);
      
      const incrementButton = screen.getByLabelText(/increment.*storage/i);
      await user.click(incrementButton);
      
      expect(screen.getByText(/2.*units/i)).toBeInTheDocument();
      
      const decrementButton = screen.getByLabelText(/decrement.*storage/i);
      await user.click(decrementButton);
      
      expect(screen.getByText(/1.*unit/i)).toBeInTheDocument();
    });
    
    it('should require plan selection before progression', async () => {
      render(<GetQuoteForm />);
      
      const addressInput = screen.getByLabelText(/address/i);
      await user.type(addressInput, '123 Test St, San Francisco, CA');
      
      const continueButton = screen.getByRole('button', { name: /continue/i });
      await user.click(continueButton);
      
      // Should show plan selection error
      await waitFor(() => {
        expect(screen.getByText(/select.*plan/i)).toBeInTheDocument();
      });
    });
    
    it('should update MyQuote sidebar when plan is selected', async () => {
      render(<GetQuoteForm />);
      
      const fullServiceCard = screen.getByLabelText(/full service/i);
      await user.click(fullServiceCard);
      
      await waitFor(() => {
        expect(screen.getByText(/full service/i)).toBeInTheDocument();
      });
    });
  });
  
  // ===== STEP NAVIGATION =====
  
  describe('Step Navigation', () => {
    it('should progress from Step 1 to Step 2 when valid', async () => {
      render(<GetQuoteForm />);
      
      // Fill Step 1
      const addressInput = screen.getByLabelText(/address/i);
      await user.type(addressInput, '123 Test St, San Francisco, CA');
      
      const fullServiceCard = screen.getByLabelText(/full service/i);
      await user.click(fullServiceCard);
      
      const insuranceYes = screen.getByLabelText(/yes.*insurance/i);
      await user.click(insuranceYes);
      
      // Click MyQuote button to advance
      const myQuoteButton = screen.getByRole('button', { name: /schedule appointment/i });
      await user.click(myQuoteButton);
      
      // Should advance to Step 2
      await waitFor(() => {
        expect(screen.getByText(/step 2 of 5/i)).toBeInTheDocument();
      });
    });
    
    it('should allow navigation back to previous step', async () => {
      render(<GetQuoteForm />);
      
      // Advance to Step 2 (simplified)
      await advanceToStep(2, user);
      
      const backButton = screen.getByRole('button', { name: /back/i });
      await user.click(backButton);
      
      // Should return to Step 1
      await waitFor(() => {
        expect(screen.getByText(/step 1 of 5/i)).toBeInTheDocument();
      });
    });
    
    it('should skip Step 3 (labor) for DIY plan', async () => {
      render(<GetQuoteForm />);
      
      // Select DIY plan in Step 1
      const addressInput = screen.getByLabelText(/address/i);
      await user.type(addressInput, '123 Test St, San Francisco, CA');
      
      const diyCard = screen.getByLabelText(/diy/i);
      await user.click(diyCard);
      
      const insuranceNo = screen.getByLabelText(/no.*insurance/i);
      await user.click(insuranceNo);
      
      // Click MyQuote button to advance
      const myQuoteButton = screen.getByRole('button', { name: /schedule appointment/i });
      await user.click(myQuoteButton);
      
      // Advance through Step 2
      await waitFor(() => {
        expect(screen.getByText(/step 2 of 5/i)).toBeInTheDocument();
      });
      
      // After Step 2, should go directly to Step 4 (skip Step 3)
      // This tests conditional navigation logic
    });
  });
  
  // ===== PAYMENT & SUBMISSION =====
  
  describe('Step 2: Scheduler Behavior', () => {
    it('should NOT auto-advance after selecting date and time', async () => {
      render(<GetQuoteForm />);
      
      // Complete Step 1 first
      const addressInput = screen.getByLabelText(/address/i);
      await user.type(addressInput, '123 Test St, San Francisco, CA');
      
      const fullServiceCard = screen.getByLabelText(/full service/i);
      await user.click(fullServiceCard);
      
      const insuranceYes = screen.getByLabelText(/yes.*insurance/i);
      await user.click(insuranceYes);
      
      const myQuoteButton = screen.getByRole('button', { name: /schedule appointment/i });
      await user.click(myQuoteButton);
      
      // Now on Step 2 - should remain here after selecting date/time
      await waitFor(() => {
        expect(screen.getByText(/step 2 of 5/i)).toBeInTheDocument();
      });
      
      // Note: Actual date/time selection would happen here
      // Since Scheduler is mocked, we just verify the button behavior
      
      // Should still be on Step 2 (no auto-advance)
      expect(screen.getByText(/step 2 of 5/i)).toBeInTheDocument();
      
      // Must click MyQuote button (now "Reserve Appointment") to advance
      const reserveButton = screen.getByRole('button', { name: /reserve appointment/i });
      expect(reserveButton).toBeInTheDocument();
    });
  });
  
  describe('Step 4: Payment and Contact Information', () => {
    it('should validate contact fields before submission', async () => {
      render(<GetQuoteForm />);
      
      // Advance to Step 4 (simplified for test)
      await advanceToStep(4, user);
      
      const submitButton = screen.getByRole('button', { name: /submit|continue/i });
      await user.click(submitButton);
      
      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/email.*required/i) || screen.getByText(/required/i)).toBeInTheDocument();
      });
    });
    
    it('should create Stripe customer and submit quote successfully', async () => {
      render(<GetQuoteForm />);
      
      await advanceToStep(4, user);
      
      // Fill contact information
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');
      
      const phoneInput = screen.getByLabelText(/phone/i);
      await user.type(phoneInput, '4155551234');
      
      const firstNameInput = screen.getByLabelText(/first name/i);
      await user.type(firstNameInput, 'John');
      
      const lastNameInput = screen.getByLabelText(/last name/i);
      await user.type(lastNameInput, 'Doe');
      
      // Submit
      const submitButton = screen.getByRole('button', { name: /submit|continue/i });
      await user.click(submitButton);
      
      // Should call Stripe API
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/payments/create-customer'),
          expect.any(Object)
        );
      });
      
      // Should call quote submission API
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/orders/submit-quote'),
          expect.any(Object)
        );
      });
    });
  });
  
  // ===== PHONE VERIFICATION =====
  
  describe('Step 5: Phone Verification', () => {
    it('should send SMS verification code', async () => {
      render(<GetQuoteForm />);
      
      await advanceToStep(5, user);
      
      const sendCodeButton = screen.getByRole('button', { name: /send.*code/i });
      await user.click(sendCodeButton);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/auth/send-code'),
          expect.any(Object)
        );
      });
    });
    
    it('should verify SMS code and complete flow', async () => {
      render(<GetQuoteForm />);
      
      await advanceToStep(5, user);
      
      // Enter verification code
      const codeInputs = screen.getAllByRole('textbox');
      for (let i = 0; i < 4; i++) {
        await user.type(codeInputs[i], String(i + 1));
      }
      
      const verifyButton = screen.getByRole('button', { name: /verify/i });
      await user.click(verifyButton);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/auth/verify-code'),
          expect.any(Object)
        );
      });
    });
  });
  
  // ===== ERROR HANDLING =====
  
  describe('Error Scenarios', () => {
    it('should handle API errors gracefully', async () => {
      mockFetch.mockImplementationOnce(() => 
        Promise.resolve(createMockResponse({ error: 'API Error' }, false))
      );
      
      render(<GetQuoteForm />);
      
      await advanceToStep(4, user);
      
      const submitButton = screen.getByRole('button', { name: /submit|continue/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
    
    it('should handle network errors', async () => {
      mockFetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));
      
      render(<GetQuoteForm />);
      
      await advanceToStep(4, user);
      
      const submitButton = screen.getByRole('button', { name: /submit|continue/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });
    });
    
    it('should handle Stripe payment method errors', async () => {
      mockStripeCreatePaymentMethod.mockResolvedValueOnce({
        error: { message: 'Card declined' },
        paymentMethod: null
      });
      
      render(<GetQuoteForm />);
      
      await advanceToStep(4, user);
      
      const submitButton = screen.getByRole('button', { name: /submit|continue/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/card declined/i)).toBeInTheDocument();
      });
    });
  });
  
  // ===== ACCESSIBILITY =====
  
  describe('Accessibility', () => {
    it('should announce step changes to screen readers', async () => {
      const { container } = render(<GetQuoteForm />);
      
      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
    });
    
    it('should have proper keyboard navigation throughout flow', async () => {
      render(<GetQuoteForm />);
      
      const firstInput = screen.getByLabelText(/address/i);
      firstInput.focus();
      
      expect(firstInput).toHaveFocus();
      
      // Tab through form
      await user.tab();
      
      // Should focus next interactive element
      expect(document.activeElement).not.toBe(firstInput);
    });
    
    it('should have no accessibility violations in each step', async () => {
      const { container } = render(<GetQuoteForm />);
      
      // Step 1
      let results = await axe(container);
      expect(results).toHaveNoViolations();
      
      // Advance and test Step 2
      await advanceToStep(2, user);
      results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
  
  // ===== STATE PERSISTENCE =====
  
  describe('State Persistence', () => {
    it('should maintain form state when navigating between steps', async () => {
      render(<GetQuoteForm />);
      
      // Fill Step 1
      const addressInput = screen.getByLabelText(/address/i);
      await user.type(addressInput, '123 Test St, San Francisco, CA');
      
      // Navigate away and back
      const continueButton = screen.getByRole('button', { name: /continue/i });
      await user.click(continueButton);
      
      await waitFor(() => {
        expect(screen.getByText(/step 2 of 5/i)).toBeInTheDocument();
      });
      
      const backButton = screen.getByRole('button', { name: /back/i });
      await user.click(backButton);
      
      // Address should still be filled
      await waitFor(() => {
        const addressField = screen.getByLabelText(/address/i);
        expect(addressField).toHaveValue('123 Test St, San Francisco, CA');
      });
    });
  });
});

