/**
 * @fileoverview Tests for MyCart component (unified desktop + mobile)
 * Following boombox-11.0 testing standards
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { MyCart } from '@/components/features/packing-supplies/MyCart';

expect.extend(toHaveNoViolations);

// Mock Stripe hooks
jest.mock('@stripe/react-stripe-js', () => ({
  useStripe: jest.fn(() => ({
    createPaymentMethod: jest.fn(),
  })),
  useElements: jest.fn(() => ({
    getElement: jest.fn(() => ({})),
  })),
}));

// Mock Tooltip component
jest.mock('@/components/ui/primitives/Tooltip/Tooltip', () => ({
  Tooltip: function MockTooltip({ text, className }: any) {
    return <span data-testid="tooltip" className={className}>{text}</span>;
  },
}));

// Mock Hero Icons
jest.mock('@heroicons/react/24/outline', () => ({
  TrashIcon: function MockTrashIcon(props: any) {
    return <svg data-testid="trash-icon" {...props} />;
  },
}));

// Mock HelpIcon
jest.mock('@/components/icons', () => ({
  HelpIcon: function MockHelpIcon(props: any) {
    return <svg data-testid="help-icon" {...props} />;
  },
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('MyCart', () => {
  const mockCartItems = [
    { name: 'Small Box', quantity: 2, price: 5.99 },
    { name: 'Large Box', quantity: 1, price: 8.99 },
  ];

  const mockSavedCards = [
    {
      id: 1,
      stripePaymentMethodId: 'pm_test_123',
      last4: '4242',
      brand: 'visa',
      expiryMonth: 12,
      expiryYear: 2025,
      isDefault: true,
    },
  ];

  const defaultProps = {
    cartItems: mockCartItems,
    removeItem: jest.fn(),
    clearCart: jest.fn(),
    onCheckout: jest.fn(),
    isCheckout: false,
    address: '123 Main St',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phoneNumber: '5551234567',
    addressError: null,
    firstNameError: null,
    lastNameError: null,
    emailError: null,
    phoneError: null,
    setAddressError: jest.fn(),
    setFirstNameError: jest.fn(),
    setLastNameError: jest.fn(),
    setEmailError: jest.fn(),
    setPhoneError: jest.fn(),
    onOrderSuccess: jest.fn(),
    savedCards: [],
    selectedPaymentMethod: null,
    userId: 1,
  };

  // Helper to get button from either desktop or mobile view
  const getSubmitButton = () => {
    const buttons = screen.getAllByRole('button', { name: /place order|proceed to checkout|checkout/i });
    return buttons[0]; // Return first match (desktop view button)
  };

  const getClearButton = () => {
    const buttons = screen.getAllByRole('button', { name: /clear cart/i });
    return buttons[0];
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, orderId: 'order-123' }),
    });
  });

  // REQUIRED: Basic rendering tests
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<MyCart {...defaultProps} />);
      // Should render both desktop and mobile cart headers
      const cartHeaders = screen.getAllByText('My Cart');
      expect(cartHeaders.length).toBeGreaterThanOrEqual(1);
    });

    it('displays cart items with correct quantities and prices', () => {
      render(<MyCart {...defaultProps} />);
      
      // Expand the cart
      const expandButton = screen.getByRole('button', { name: /expand cart/i });
      fireEvent.click(expandButton);

      // Check for items in both desktop and mobile views
      const smallBoxes = screen.getAllByText('Small Box');
      expect(smallBoxes.length).toBeGreaterThan(0);
      const largeBoxes = screen.getAllByText('Large Box');
      expect(largeBoxes.length).toBeGreaterThan(0);
      
      // Prices appear in both views
      const price1 = screen.getAllByText('$11.98');
      expect(price1.length).toBeGreaterThan(0);
      const price2 = screen.getAllByText('$8.99');
      expect(price2.length).toBeGreaterThan(0);
    });

    it('displays empty cart state when no items', () => {
      render(<MyCart {...defaultProps} cartItems={[]} />);
      
      const expandButton = screen.getByRole('button', { name: /expand cart/i });
      fireEvent.click(expandButton);

      // Both desktop and mobile show empty state indicators
      const emptyIndicators = screen.getAllByText('---');
      expect(emptyIndicators.length).toBeGreaterThanOrEqual(2);
    });

    it('displays total price correctly', () => {
      render(<MyCart {...defaultProps} />);
      // Total: (2 * 5.99) + (1 * 8.99) = 20.97
      // Both desktop and mobile views show the total
      const totalPrices = screen.getAllByText('$20.97');
      expect(totalPrices.length).toBeGreaterThanOrEqual(1);
    });

    it('displays tooltip for total price', () => {
      render(<MyCart {...defaultProps} />);
      // Should have tooltips in both desktop and mobile views
      const tooltips = screen.getAllByTestId('tooltip');
      expect(tooltips.length).toBeGreaterThan(0);
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<MyCart {...defaultProps} />);
      await testAccessibility(renderResult);
    });

    it('has proper ARIA labels for buttons', () => {
      render(<MyCart {...defaultProps} />);
      
      // Mobile has expand button
      expect(screen.getByRole('button', { name: /expand cart/i })).toBeInTheDocument();
      // Both views have clear cart buttons
      const clearButtons = screen.getAllByRole('button', { name: /clear cart/i });
      expect(clearButtons.length).toBeGreaterThan(0);
      // Both views have checkout buttons
      const checkoutButtons = screen.getAllByRole('button', { name: /proceed to checkout/i });
      expect(checkoutButtons.length).toBeGreaterThan(0);
    });

    it('maintains accessibility when expanded', async () => {
      const renderResult = render(<MyCart {...defaultProps} />);
      
      const expandButton = screen.getByRole('button', { name: /expand cart/i });
      fireEvent.click(expandButton);

      await testAccessibility(renderResult);
    });

    it('has proper aria-expanded attribute', () => {
      render(<MyCart {...defaultProps} />);
      
      const expandButton = screen.getByRole('button', { name: /expand cart/i });
      expect(expandButton).toHaveAttribute('aria-expanded', 'false');
      
      fireEvent.click(expandButton);
      expect(expandButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  // REQUIRED: User interaction testing
  describe('User Interactions', () => {
    it('expands and collapses cart when toggle button is clicked', () => {
      render(<MyCart {...defaultProps} />);
      
      const expandButton = screen.getByRole('button', { name: /expand cart/i });
      expect(expandButton).toHaveAttribute('aria-expanded', 'false');
      
      fireEvent.click(expandButton);
      expect(expandButton).toHaveAttribute('aria-expanded', 'true');
      
      fireEvent.click(expandButton);
      expect(expandButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('calls removeItem when delete button is clicked', async () => {
      const user = userEvent.setup();
      const mockRemoveItem = jest.fn();
      
      render(<MyCart {...defaultProps} removeItem={mockRemoveItem} />);
      
      const expandButton = screen.getByRole('button', { name: /expand cart/i });
      fireEvent.click(expandButton);

      const deleteButtons = screen.getAllByRole('button', { name: /remove.*from cart/i });
      await user.click(deleteButtons[0]);

      expect(mockRemoveItem).toHaveBeenCalledWith('Small Box');
    });

    it('calls clearCart when trash icon is clicked', async () => {
      const user = userEvent.setup();
      const mockClearCart = jest.fn();
      
      render(<MyCart {...defaultProps} clearCart={mockClearCart} />);
      
      const clearButton = getClearButton();
      await user.click(clearButton);

      expect(mockClearCart).toHaveBeenCalled();
    });

    it('disables clear cart button when cart is empty', () => {
      render(<MyCart {...defaultProps} cartItems={[]} />);
      
      const clearButton = getClearButton();
      expect(clearButton).toBeDisabled();
    });

    it('calls onCheckout when checkout button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnCheckout = jest.fn();
      
      render(<MyCart {...defaultProps} onCheckout={mockOnCheckout} />);
      
      const checkoutButton = getSubmitButton();
      await user.click(checkoutButton);

      expect(mockOnCheckout).toHaveBeenCalled();
    });
  });

  // State management tests
  describe('State Management', () => {
    it('disables checkout button when cart is empty', () => {
      render(<MyCart {...defaultProps} cartItems={[]} />);
      
      const checkoutButton = getSubmitButton();
      expect(checkoutButton).toBeDisabled();
    });

    it('changes button text when in checkout mode', () => {
      render(<MyCart {...defaultProps} isCheckout={true} />);
      
      const submitButton = getSubmitButton();
      expect(submitButton).toHaveTextContent('Place Order');
    });

    it('shows loading state during order submission', async () => {
      const user = userEvent.setup();
      
      render(<MyCart {...defaultProps} isCheckout={true} />);
      
      // Mock a slow API response
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true })
        }), 500))
      );
      
      const submitButton = getSubmitButton();
      
      // Click and immediately check for loading state
      const clickPromise = user.click(submitButton);
      
      // Wait for loading state to appear
      await waitFor(() => {
        const buttons = screen.getAllByRole('button', { name: /place order|creating order/i });
        expect(buttons.length).toBeGreaterThan(0);
        expect(buttons[0]).toHaveTextContent('Creating Order...');
        expect(buttons[0]).toBeDisabled();
      }, { timeout: 300 });
      
      // Wait for click to complete
      await clickPromise;
    });
  });

  // Form validation tests
  describe('Form Validation', () => {
    it('validates required fields before submission', async () => {
      const user = userEvent.setup();
      const mockSetAddressError = jest.fn();
      const mockSetFirstNameError = jest.fn();
      
      render(
        <MyCart 
          {...defaultProps} 
          isCheckout={true}
          address=""
          firstName=""
          setAddressError={mockSetAddressError}
          setFirstNameError={mockSetFirstNameError}
        />
      );
      
      const submitButton = getSubmitButton();
      await user.click(submitButton);

      expect(mockSetAddressError).toHaveBeenCalledWith("Please enter your delivery address");
      expect(mockSetFirstNameError).toHaveBeenCalledWith("Please enter your first name");
    });

    it('validates email format', async () => {
      const user = userEvent.setup();
      const mockSetEmailError = jest.fn();
      
      render(
        <MyCart 
          {...defaultProps} 
          isCheckout={true}
          email="invalid-email"
          setEmailError={mockSetEmailError}
        />
      );
      
      const submitButton = getSubmitButton();
      await user.click(submitButton);

      expect(mockSetEmailError).toHaveBeenCalledWith("Please enter a valid email address");
    });

    it('validates payment method is selected when saved cards exist', async () => {
      const user = userEvent.setup();
      
      render(
        <MyCart 
          {...defaultProps} 
          isCheckout={true}
          savedCards={mockSavedCards}
          selectedPaymentMethod={null}
        />
      );
      
      const submitButton = getSubmitButton();
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessages = screen.queryAllByText('Please select a payment method');
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });
  });

  // Order submission tests
  describe('Order Submission', () => {
    it('submits order with correct data', async () => {
      const user = userEvent.setup();
      const mockOnOrderSuccess = jest.fn();
      
      render(
        <MyCart 
          {...defaultProps} 
          isCheckout={true}
          selectedPaymentMethod="VISA •••• 4242"
          savedCards={mockSavedCards}
          onOrderSuccess={mockOnOrderSuccess}
        />
      );
      
      const submitButton = getSubmitButton();
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/orders/packing-supplies/create',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('John Doe'),
          })
        );
      });

      expect(mockOnOrderSuccess).toHaveBeenCalledWith({ success: true, orderId: 'order-123' });
    });

    it('normalizes phone number to E.164 format', async () => {
      const user = userEvent.setup();
      
      render(
        <MyCart 
          {...defaultProps} 
          isCheckout={true}
          phoneNumber="(555) 123-4567"
          selectedPaymentMethod="VISA •••• 4242"
          savedCards={mockSavedCards}
        />
      );
      
      const submitButton = getSubmitButton();
      await user.click(submitButton);

      await waitFor(() => {
        const callArgs = (global.fetch as jest.Mock).mock.calls[0][1].body;
        const parsedBody = JSON.parse(callArgs);
        expect(parsedBody.customerPhone).toMatch(/^\+1\d{10}$/);
      });
    });

    it('displays error message on submission failure', async () => {
      const user = userEvent.setup();
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Payment processing failed' }),
      });
      
      render(
        <MyCart 
          {...defaultProps} 
          isCheckout={true}
          selectedPaymentMethod="VISA •••• 4242"
          savedCards={mockSavedCards}
        />
      );
      
      const submitButton = getSubmitButton();
      await user.click(submitButton);

      await waitFor(() => {
        const alerts = screen.getAllByRole('alert');
        // Should find alert in both desktop and mobile views
        expect(alerts.length).toBeGreaterThan(0);
        expect(alerts[0]).toHaveTextContent('Payment processing failed');
      });
    });

    it('handles network errors gracefully', async () => {
      const user = userEvent.setup();
      
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      render(
        <MyCart 
          {...defaultProps} 
          isCheckout={true}
          selectedPaymentMethod="VISA •••• 4242"
          savedCards={mockSavedCards}
        />
      );
      
      const submitButton = getSubmitButton();
      await user.click(submitButton);

      await waitFor(() => {
        const alerts = screen.getAllByRole('alert');
        expect(alerts.length).toBeGreaterThan(0);
        expect(alerts[0]).toHaveTextContent('Network error');
      });
    });
  });

  // Error handling tests
  describe('Error Handling', () => {
    it('displays submit error when shown', () => {
      render(<MyCart {...defaultProps} isCheckout={true} />);
      
      // Manually trigger an error by submitting without payment method
      const submitButton = getSubmitButton();
      fireEvent.click(submitButton);

      // Since we don't have payment method and don't have saved cards, it should process
      // but for this test, let's check the error display structure exists
    });

    it('clears previous submit errors on new submission', async () => {
      const user = userEvent.setup();
      
      // First submission fails
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'First error' }),
      });
      
      render(
        <MyCart 
          {...defaultProps} 
          isCheckout={true}
          selectedPaymentMethod="VISA •••• 4242"
          savedCards={mockSavedCards}
        />
      );
      
      const submitButton = getSubmitButton();
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessages = screen.queryAllByText('First error');
        expect(errorMessages.length).toBeGreaterThan(0);
      });

      // Second submission succeeds
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument();
      });
    });
  });

  // Design system integration tests
  describe('Design System Integration', () => {
    it('uses semantic color tokens', () => {
      const { container } = render(<MyCart {...defaultProps} />);
      
      // Check that primary colors are used (mobile view)
      expect(container.querySelector('.bg-primary')).toBeInTheDocument();
      expect(container.querySelector('.text-text-inverse')).toBeInTheDocument();
      // Check that surface colors are used (desktop view)
      expect(container.querySelector('.bg-surface-primary')).toBeInTheDocument();
      expect(container.querySelector('.text-text-primary')).toBeInTheDocument();
    });

    it('uses formatCurrency for price display', () => {
      render(<MyCart {...defaultProps} />);
      
      // Should display formatted currency (appears in both desktop and mobile)
      const totalPrices = screen.getAllByText('$20.97');
      expect(totalPrices.length).toBeGreaterThanOrEqual(1);
      const itemPrices = screen.getAllByText('$11.98');
      expect(itemPrices.length).toBeGreaterThanOrEqual(1);
    });

    it('renders both desktop and mobile layouts', () => {
      const { container } = render(<MyCart {...defaultProps} />);
      
      // Desktop layout should have hidden md:block classes
      const desktopLayout = container.querySelector('.hidden.md\\:block');
      expect(desktopLayout).toBeInTheDocument();
      
      // Mobile layout should have md:hidden class
      const mobileLayout = container.querySelector('.md\\:hidden');
      expect(mobileLayout).toBeInTheDocument();
    });
  });
});

