/**
 * @fileoverview Tests for OrderConfirmation component
 * Following boombox-11.0 testing standards
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { OrderConfirmation } from '@/components/features/packing-supplies/OrderConfirmation';

expect.extend(toHaveNoViolations);

// Mock Hero Icons
jest.mock('@heroicons/react/24/outline', () => ({
  CheckCircleIcon: function MockCheckCircleIcon(props: any) {
    return <svg data-testid="check-circle-icon" {...props} />;
  },
}));

describe('OrderConfirmation', () => {
  const mockOrderData = {
    orderId: 12345,
    onfleetTaskShortId: 'ABC123',
    trackingUrl: 'https://tracking.example.com/ABC123',
    assignedDriverName: 'John Doe',
    deliveryWindow: {
      start: '2024-01-15T12:00:00.000Z',
      end: '2024-01-15T19:00:00.000Z',
      isSameDay: true,
      deliveryDate: '2024-01-15',
    },
    estimatedServiceTime: 30,
    capacityInfo: {
      totalWeight: 100,
      itemCount: 5,
    },
  };

  const defaultProps = {
    email: 'test@example.com',
  };

  describe('Component Rendering', () => {
    it('should render success message with email', () => {
      render(<OrderConfirmation {...defaultProps} />);
      
      expect(screen.getByText('Awesome! Your order has been received')).toBeInTheDocument();
      expect(screen.getByText(/A receipt has been sent to your email test@example.com/)).toBeInTheDocument();
    });

    it('should render success icon', () => {
      render(<OrderConfirmation {...defaultProps} />);
      
      const icon = screen.getByTestId('check-circle-icon');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('text-status-success');
    });

    it('should not render order details when orderData is not provided', () => {
      render(<OrderConfirmation {...defaultProps} />);
      
      expect(screen.queryByText('Order Details')).not.toBeInTheDocument();
      expect(screen.queryByText('Tracking ID:')).not.toBeInTheDocument();
    });
  });

  describe('Order Details Display', () => {
    it('should render all order details when orderData is provided', () => {
      render(<OrderConfirmation {...defaultProps} orderData={mockOrderData} />);
      
      expect(screen.getByText('Order Details')).toBeInTheDocument();
      expect(screen.getByText('Tracking ID:')).toBeInTheDocument();
      expect(screen.getByText('ABC123')).toBeInTheDocument();
      expect(screen.getByText('Items:')).toBeInTheDocument();
      expect(screen.getByText('5 items')).toBeInTheDocument();
      expect(screen.getByText('Delivery Date:')).toBeInTheDocument();
      expect(screen.getByText('Delivery Window:')).toBeInTheDocument();
      expect(screen.getByText('Driver:')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should display "Same day!" badge when isSameDay is true', () => {
      render(<OrderConfirmation {...defaultProps} orderData={mockOrderData} />);
      
      expect(screen.getByText('Same day!')).toBeInTheDocument();
      const badge = screen.getByText('Same day!');
      expect(badge).toHaveClass('bg-status-bg-success');
      expect(badge).toHaveClass('text-status-text-success');
    });

    it('should not display "Same day!" badge when isSameDay is false', () => {
      const orderDataWithoutSameDay = {
        ...mockOrderData,
        deliveryWindow: {
          ...mockOrderData.deliveryWindow,
          isSameDay: false,
        },
      };
      
      render(<OrderConfirmation {...defaultProps} orderData={orderDataWithoutSameDay} />);
      
      expect(screen.queryByText('Same day!')).not.toBeInTheDocument();
    });

    it('should display "TBD" message when driver is not assigned', () => {
      const orderDataWithoutDriver = {
        ...mockOrderData,
        assignedDriverName: undefined,
      };
      
      render(<OrderConfirmation {...defaultProps} orderData={orderDataWithoutDriver} />);
      
      expect(screen.getByText('TBD (driver will be assigned shortly)')).toBeInTheDocument();
    });

    it('should format delivery date correctly', () => {
      render(<OrderConfirmation {...defaultProps} orderData={mockOrderData} />);
      
      // Date should be formatted as "Monday, January 15, 2024"
      expect(screen.getByText(/Monday, January 15, 2024/)).toBeInTheDocument();
    });
  });

  describe('Navigation Actions', () => {
    it('should show "Need storage space?" link for non-logged in users', () => {
      render(<OrderConfirmation {...defaultProps} />);
      
      const link = screen.getByText('Need storage space?');
      expect(link).toBeInTheDocument();
      expect(link.closest('a')).toHaveAttribute('href', '/getquote');
    });

    it('should show "Go to homepage" link for logged in users', () => {
      render(<OrderConfirmation {...defaultProps} isLoggedIn={true} userId="123" />);
      
      const link = screen.getByText('Go to homepage');
      expect(link).toBeInTheDocument();
      expect(link.closest('a')).toHaveAttribute('href', '/user-page/123');
    });
  });

  describe('Tracking Button', () => {
    it('should render tracking button when trackingUrl is provided', () => {
      render(<OrderConfirmation {...defaultProps} orderData={mockOrderData} />);
      
      const trackingButton = screen.getByText('Track Your Order');
      expect(trackingButton).toBeInTheDocument();
      expect(trackingButton.closest('a')).toHaveAttribute('href', mockOrderData.trackingUrl);
    });

    it('should not render tracking button when trackingUrl is not provided', () => {
      const orderDataWithoutTracking = {
        ...mockOrderData,
        trackingUrl: undefined,
      };
      
      render(<OrderConfirmation {...defaultProps} orderData={orderDataWithoutTracking} />);
      
      expect(screen.queryByText('Track Your Order')).not.toBeInTheDocument();
    });

    it('should show loading state when tracking button is clicked', () => {
      render(<OrderConfirmation {...defaultProps} orderData={mockOrderData} />);
      
      const trackingLink = screen.getByText('Track Your Order').closest('a')!;
      fireEvent.click(trackingLink);
      
      expect(screen.getByText('Tracking Order...')).toBeInTheDocument();
    });

    it('should disable tracking button during loading', () => {
      render(<OrderConfirmation {...defaultProps} orderData={mockOrderData} />);
      
      const trackingLink = screen.getByText('Track Your Order').closest('a')!;
      fireEvent.click(trackingLink);
      
      const loadingLink = screen.getByText('Tracking Order...').closest('a')!;
      expect(loadingLink).toHaveClass('bg-surface-disabled');
      expect(loadingLink).toHaveClass('text-text-secondary');
      expect(loadingLink).toHaveClass('cursor-not-allowed');
      expect(loadingLink).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Design System Compliance', () => {
    it('should use design system colors for success icon', () => {
      render(<OrderConfirmation {...defaultProps} />);
      
      const icon = screen.getByTestId('check-circle-icon');
      expect(icon).toHaveClass('text-status-success');
    });

    it('should use design system colors for headings', () => {
      render(<OrderConfirmation {...defaultProps} orderData={mockOrderData} />);
      
      const heading = screen.getByText('Awesome! Your order has been received');
      expect(heading).toHaveClass('text-text-primary');
    });

    it('should use design system colors for order details background', () => {
      render(<OrderConfirmation {...defaultProps} orderData={mockOrderData} />);
      
      const orderDetailsSection = screen.getByRole('region', { name: 'Order details' });
      expect(orderDetailsSection).toHaveClass('bg-surface-secondary');
    });

    it('should use design system colors for labels', () => {
      render(<OrderConfirmation {...defaultProps} orderData={mockOrderData} />);
      
      const trackingLabel = screen.getByText('Tracking ID:');
      expect(trackingLabel).toHaveClass('text-text-tertiary');
    });

    it('should use design system colors for buttons', () => {
      render(<OrderConfirmation {...defaultProps} orderData={mockOrderData} />);
      
      const trackingButton = screen.getByText('Track Your Order');
      expect(trackingButton).toHaveClass('bg-primary');
      expect(trackingButton).toHaveClass('text-text-inverse');
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <OrderConfirmation {...defaultProps} orderData={mockOrderData} />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA attributes for order details section', () => {
      render(<OrderConfirmation {...defaultProps} orderData={mockOrderData} />);
      
      const orderDetailsSection = screen.getByRole('region', { name: 'Order details' });
      expect(orderDetailsSection).toBeInTheDocument();
    });

    it('should have aria-hidden on decorative icon', () => {
      render(<OrderConfirmation {...defaultProps} />);
      
      const icon = screen.getByTestId('check-circle-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('should have descriptive aria-label for navigation button', () => {
      render(<OrderConfirmation {...defaultProps} />);
      
      const button = screen.getByLabelText('Get a quote for storage space');
      expect(button).toBeInTheDocument();
    });

    it('should have descriptive aria-label for logged in user navigation', () => {
      render(<OrderConfirmation {...defaultProps} isLoggedIn={true} userId="123" />);
      
      const button = screen.getByLabelText('Go to your homepage');
      expect(button).toBeInTheDocument();
    });

    it('should have descriptive aria-label for tracking button', () => {
      render(<OrderConfirmation {...defaultProps} orderData={mockOrderData} />);
      
      const trackingButton = screen.getByLabelText('Track your packing supply order');
      expect(trackingButton).toBeInTheDocument();
    });

    it('should have aria-disabled attribute when tracking button is in loading state', () => {
      render(<OrderConfirmation {...defaultProps} orderData={mockOrderData} />);
      
      const trackingLink = screen.getByText('Track Your Order').closest('a')!;
      fireEvent.click(trackingLink);
      
      const loadingLink = screen.getByText('Tracking Order...').closest('a')!;
      expect(loadingLink).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty email gracefully', () => {
      render(<OrderConfirmation email="" />);
      
      expect(screen.getByText(/A receipt has been sent to your email/)).toBeInTheDocument();
    });

    it('should handle missing userId when isLoggedIn is true', () => {
      render(<OrderConfirmation {...defaultProps} isLoggedIn={true} />);
      
      const link = screen.getByText('Go to homepage');
      expect(link.closest('a')).toHaveAttribute('href', '/user-page/undefined');
    });

    it('should handle zero items in order', () => {
      const orderDataWithZeroItems = {
        ...mockOrderData,
        capacityInfo: {
          ...mockOrderData.capacityInfo,
          itemCount: 0,
        },
      };
      
      render(<OrderConfirmation {...defaultProps} orderData={orderDataWithZeroItems} />);
      
      expect(screen.getByText('0 items')).toBeInTheDocument();
    });
  });

  describe('Props Validation', () => {
    it('should render correctly with minimal props', () => {
      render(<OrderConfirmation email="test@example.com" />);
      
      expect(screen.getByText('Awesome! Your order has been received')).toBeInTheDocument();
    });

    it('should render correctly with all props', () => {
      render(
        <OrderConfirmation
          email="test@example.com"
          isLoggedIn={true}
          userId="123"
          orderData={mockOrderData}
        />
      );
      
      expect(screen.getByText('Awesome! Your order has been received')).toBeInTheDocument();
      expect(screen.getByText('Order Details')).toBeInTheDocument();
      expect(screen.getByText('Go to homepage')).toBeInTheDocument();
    });
  });
});

