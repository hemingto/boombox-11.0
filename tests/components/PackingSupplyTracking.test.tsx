/**
 * @fileoverview Tests for PackingSupplyTracking component
 * Following boombox-11.0 testing standards
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { PackingSupplyTracking } from '@/components/features/packing-supplies/PackingSupplyTracking';

expect.extend(toHaveNoViolations);

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage(props: any) {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock Google Maps components
jest.mock('@react-google-maps/api', () => ({
  GoogleMap: function MockGoogleMap({ children }: any) {
    return <div data-testid="google-map">{children}</div>;
  },
  Marker: function MockMarker() {
    return <div data-testid="map-marker" />;
  },
}));

// Mock window.open
const mockWindowOpen = jest.fn();
window.open = mockWindowOpen;

describe('PackingSupplyTracking', () => {
  const mockProps = {
    orderId: 123,
    orderDate: new Date('2025-01-15'),
    deliveryDate: new Date('2025-01-20'),
    customerName: 'John Doe',
    deliveryAddress: '123 Main St, City, ST 12345',
    totalPrice: 150.0,
    status: 'In Transit',
    driverName: 'Jane Smith',
    driverProfilePicture: 'https://example.com/driver.jpg',
    deliveryPhotoUrl: 'https://example.com/delivery-photo.jpg',
    items: [
      { name: 'Small Box', quantity: 5, price: 50.0 },
      { name: 'Tape', quantity: 2, price: 25.0 },
      { name: 'Bubble Wrap', quantity: 3, price: 75.0 },
    ],
    deliveryProgress: {
      steps: [
        {
          title: 'Your order has been placed',
          description: 'Order confirmed',
          status: 'complete' as const,
          timestamp: 'Jan 15, 10:00 AM',
        },
        {
          title: 'Your delivery driver has been assigned',
          description: 'Driver assigned',
          status: 'complete' as const,
          timestamp: 'Jan 15, 11:00 AM',
        },
        {
          title: 'Your order is out for delivery',
          description: 'In transit',
          status: 'in_transit' as const,
          timestamp: 'eta 2:30 PM',
        },
        {
          title: 'Your order has been delivered',
          description: 'Completed',
          status: 'pending' as const,
          timestamp: 'Pending',
        },
      ],
      currentStep: 2,
    },
    deliveryWindow: {
      start: new Date('2025-01-20T14:00:00'),
      end: new Date('2025-01-20T16:00:00'),
      isSameDay: true,
    },
    taskId: 'TASK-789',
    trackingUrl: 'https://onfleet.com/track/abc123',
    estimatedArrival: '2:30 PM',
    feedbackToken: 'feedback-token-xyz',
    canLeaveFeedback: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Google Maps Geocoder
    const mockGeocoder = {
      geocode: jest.fn((request, callback) => {
        callback(
          [
            {
              geometry: {
                location: {
                  lat: () => 37.7749,
                  lng: () => -122.4194,
                },
              },
            },
          ],
          'OK'
        );
      }),
    };

    (global as any).google = {
      maps: {
        Geocoder: jest.fn(() => mockGeocoder),
      },
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete (global as any).google;
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<PackingSupplyTracking {...mockProps} />);
      expect(screen.getByText('Packing Supplies Delivery')).toBeInTheDocument();
    });

    it('displays order information correctly', () => {
      render(<PackingSupplyTracking {...mockProps} />);

      expect(screen.getByText('Packing Supplies Delivery')).toBeInTheDocument();
      expect(screen.getByText(/Order #TASK-789/)).toBeInTheDocument();
      expect(screen.getByText('In transit')).toBeInTheDocument();
    });

    it('displays delivery window information', () => {
      render(<PackingSupplyTracking {...mockProps} />);

      // Check that the delivery window is formatted and displayed
      expect(screen.getByText(/scheduled between/)).toBeInTheDocument();
    });

    it('displays all delivery progress steps', () => {
      render(<PackingSupplyTracking {...mockProps} />);

      expect(screen.getByText('Your order has been placed')).toBeInTheDocument();
      expect(screen.getByText('Your delivery driver has been assigned')).toBeInTheDocument();
      expect(screen.getByText('Your order is out for delivery')).toBeInTheDocument();
      expect(screen.getByText('Your order has been delivered')).toBeInTheDocument();
    });

    it('displays driver information when available', () => {
      render(<PackingSupplyTracking {...mockProps} />);

      expect(screen.getByText(mockProps.driverName)).toBeInTheDocument();
      expect(screen.getByText('Boombox Driver')).toBeInTheDocument();
      expect(screen.getByAltText(`${mockProps.driverName} profile`)).toBeInTheDocument();
    });

    it('displays order items with quantities and prices', () => {
      render(<PackingSupplyTracking {...mockProps} />);

      expect(screen.getByText('5 Small Box')).toBeInTheDocument();
      expect(screen.getByText('2 Tape')).toBeInTheDocument();
      expect(screen.getByText('3 Bubble Wrap')).toBeInTheDocument();
      expect(screen.getByText('$50.00')).toBeInTheDocument();
      expect(screen.getByText('$25.00')).toBeInTheDocument();
      expect(screen.getByText('$75.00')).toBeInTheDocument();
    });

    it('displays total price', () => {
      render(<PackingSupplyTracking {...mockProps} />);

      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('$150.00')).toBeInTheDocument();
    });

    it('displays delivery address', () => {
      render(<PackingSupplyTracking {...mockProps} />);

      expect(screen.getByText('Delivery Address')).toBeInTheDocument();
      expect(screen.getByText(mockProps.deliveryAddress)).toBeInTheDocument();
    });

    it('renders Google Map component', () => {
      render(<PackingSupplyTracking {...mockProps} />);

      expect(screen.getByTestId('google-map')).toBeInTheDocument();
      expect(screen.getByTestId('map-marker')).toBeInTheDocument();
    });

    it('displays "Delivery window TBD" when no delivery window provided', () => {
      const propsWithoutWindow = {
        ...mockProps,
        deliveryWindow: {
          start: null,
          end: null,
          isSameDay: false,
        },
      };

      render(<PackingSupplyTracking {...propsWithoutWindow} />);
      expect(screen.getByText('Delivery window TBD')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<PackingSupplyTracking {...mockProps} />);
      await testAccessibility(renderResult);
    });

    it('has proper ARIA label for expand/collapse button', () => {
      render(<PackingSupplyTracking {...mockProps} />);

      const expandButton = screen.getByRole('button', {
        name: /collapse order details/i,
      });
      expect(expandButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('has proper ARIA labels for action buttons', () => {
      render(<PackingSupplyTracking {...mockProps} />);

      expect(
        screen.getByRole('button', { name: /track your delivery location/i })
      ).toBeInTheDocument();
    });

    it('has aria-disabled attribute for disabled buttons', () => {
      const propsWithPendingDelivery = {
        ...mockProps,
        deliveryProgress: {
          ...mockProps.deliveryProgress,
          steps: mockProps.deliveryProgress.steps.map((step, index) => ({
            ...step,
            status: index === 3 ? ('pending' as const) : step.status,
          })),
        },
      };

      render(<PackingSupplyTracking {...propsWithPendingDelivery} />);

      const viewPhotoButton = screen.getByRole('button', { name: /view delivery photo/i });
      expect(viewPhotoButton).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Expandable Section', () => {
    it('starts in expanded state by default', () => {
      render(<PackingSupplyTracking {...mockProps} />);

      const expandButton = screen.getByRole('button', {
        name: /collapse order details/i,
      });
      expect(expandButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('collapses section when toggle button is clicked', async () => {
      const user = userEvent.setup();
      render(<PackingSupplyTracking {...mockProps} />);

      const expandButton = screen.getByRole('button', {
        name: /collapse order details/i,
      });
      await user.click(expandButton);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /expand order details/i })
        ).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('expands section when clicking collapsed toggle button', async () => {
      const user = userEvent.setup();
      render(<PackingSupplyTracking {...mockProps} />);

      const expandButton = screen.getByRole('button', {
        name: /collapse order details/i,
      });

      // Collapse first
      await user.click(expandButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /expand order details/i })).toBeInTheDocument();
      });

      // Expand again
      const collapseButton = screen.getByRole('button', { name: /expand order details/i });
      await user.click(collapseButton);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /collapse order details/i })
        ).toHaveAttribute('aria-expanded', 'true');
      });
    });
  });

  describe('Status Display', () => {
    it('displays "Complete" status for delivered orders', () => {
      const deliveredProps = {
        ...mockProps,
        status: 'Delivered',
      };

      render(<PackingSupplyTracking {...deliveredProps} />);
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });

    it('displays "In transit" status for orders in transit', () => {
      render(<PackingSupplyTracking {...mockProps} />);
      expect(screen.getByText('In transit')).toBeInTheDocument();
    });

    it('displays "In transit" status for driver arrived', () => {
      const arrivedProps = {
        ...mockProps,
        status: 'Driver Arrived',
      };

      render(<PackingSupplyTracking {...arrivedProps} />);
      expect(screen.getByText('In transit')).toBeInTheDocument();
    });

    it('displays "Driver Assigned" status for other statuses', () => {
      const pendingProps = {
        ...mockProps,
        status: 'Pending',
      };

      render(<PackingSupplyTracking {...pendingProps} />);
      expect(screen.getByText('Driver Assigned')).toBeInTheDocument();
    });

    it('applies success color class for delivered status', () => {
      const deliveredProps = {
        ...mockProps,
        status: 'Delivered',
      };

      render(<PackingSupplyTracking {...deliveredProps} />);
      const statusBadge = screen.getByText('Complete');
      expect(statusBadge).toHaveClass('text-status-success');
      expect(statusBadge).toHaveClass('bg-status-bg-success');
    });

    it('applies info color class for in transit status', () => {
      render(<PackingSupplyTracking {...mockProps} />);
      const statusBadge = screen.getByText('In transit');
      expect(statusBadge).toHaveClass('text-status-info');
      expect(statusBadge).toHaveClass('bg-status-bg-info');
    });
  });

  describe('Track Location Button', () => {
    it('renders track location button for out for delivery step', () => {
      render(<PackingSupplyTracking {...mockProps} />);

      expect(
        screen.getByRole('button', { name: /track your delivery location/i })
      ).toBeInTheDocument();
    });

    it('opens tracking URL when track location button is clicked', async () => {
      const user = userEvent.setup();
      render(<PackingSupplyTracking {...mockProps} />);

      const trackButton = screen.getByRole('button', {
        name: /track your delivery location/i,
      });
      await user.click(trackButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(mockProps.trackingUrl, '_blank');
    });

    it('disables track location button when status is pending', () => {
      const pendingProps = {
        ...mockProps,
        deliveryProgress: {
          ...mockProps.deliveryProgress,
          steps: mockProps.deliveryProgress.steps.map((step, index) => ({
            ...step,
            status: index === 2 ? ('pending' as const) : step.status,
          })),
        },
      };

      render(<PackingSupplyTracking {...pendingProps} />);

      const trackButton = screen.getByRole('button', {
        name: /track your delivery location/i,
      });
      expect(trackButton).toBeDisabled();
    });

    it('disables track location button when no tracking URL provided', () => {
      const noUrlProps = {
        ...mockProps,
        trackingUrl: undefined,
      };

      render(<PackingSupplyTracking {...noUrlProps} />);

      const trackButton = screen.getByRole('button', {
        name: /track your delivery location/i,
      });
      expect(trackButton).toBeDisabled();
    });
  });

  describe('View Photo Button', () => {
    it('renders view photo button for delivered step', () => {
      const deliveredProps = {
        ...mockProps,
        deliveryProgress: {
          ...mockProps.deliveryProgress,
          steps: mockProps.deliveryProgress.steps.map((step, index) => ({
            ...step,
            status: index === 3 ? ('complete' as const) : step.status,
          })),
        },
      };

      render(<PackingSupplyTracking {...deliveredProps} />);

      expect(
        screen.getByRole('button', { name: /view delivery photo/i })
      ).toBeInTheDocument();
    });

    it('opens delivery photo when view photo button is clicked', async () => {
      const user = userEvent.setup();
      const deliveredProps = {
        ...mockProps,
        deliveryProgress: {
          ...mockProps.deliveryProgress,
          steps: mockProps.deliveryProgress.steps.map((step, index) => ({
            ...step,
            status: index === 3 ? ('complete' as const) : step.status,
          })),
        },
      };

      render(<PackingSupplyTracking {...deliveredProps} />);

      const viewPhotoButton = screen.getByRole('button', { name: /view delivery photo/i });
      await user.click(viewPhotoButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(mockProps.deliveryPhotoUrl, '_blank');
    });

    it('disables view photo button when no photo URL provided', () => {
      const noPhotoProps = {
        ...mockProps,
        deliveryPhotoUrl: undefined,
      };

      render(<PackingSupplyTracking {...noPhotoProps} />);

      const viewPhotoButton = screen.getByRole('button', { name: /view delivery photo/i });
      expect(viewPhotoButton).toBeDisabled();
    });
  });

  describe('Share Feedback Button', () => {
    it('renders share feedback button for delivered step', () => {
      const deliveredProps = {
        ...mockProps,
        deliveryProgress: {
          ...mockProps.deliveryProgress,
          steps: mockProps.deliveryProgress.steps.map((step, index) => ({
            ...step,
            status: index === 3 ? ('complete' as const) : step.status,
          })),
        },
      };

      render(<PackingSupplyTracking {...deliveredProps} />);

      expect(
        screen.getByRole('button', { name: /share feedback about your delivery/i })
      ).toBeInTheDocument();
    });

    it('opens feedback page when share feedback button is clicked', async () => {
      const user = userEvent.setup();
      const deliveredProps = {
        ...mockProps,
        deliveryProgress: {
          ...mockProps.deliveryProgress,
          steps: mockProps.deliveryProgress.steps.map((step, index) => ({
            ...step,
            status: index === 3 ? ('complete' as const) : step.status,
          })),
        },
      };

      render(<PackingSupplyTracking {...deliveredProps} />);

      const feedbackButton = screen.getByRole('button', {
        name: /share feedback about your delivery/i,
      });
      await user.click(feedbackButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        `/packing-supplies/feedback/${mockProps.feedbackToken}`,
        '_blank'
      );
    });

    it('disables share feedback button when canLeaveFeedback is false', () => {
      const noFeedbackProps = {
        ...mockProps,
        canLeaveFeedback: false,
      };

      render(<PackingSupplyTracking {...noFeedbackProps} />);

      const feedbackButton = screen.getByRole('button', {
        name: /share feedback about your delivery/i,
      });
      expect(feedbackButton).toBeDisabled();
    });

    it('disables share feedback button when no feedback token provided', () => {
      const noTokenProps = {
        ...mockProps,
        feedbackToken: undefined,
      };

      render(<PackingSupplyTracking {...noTokenProps} />);

      const feedbackButton = screen.getByRole('button', {
        name: /share feedback about your delivery/i,
      });
      expect(feedbackButton).toBeDisabled();
    });
  });

  describe('Delivery Progress Steps', () => {
    it('displays ETA for steps with eta timestamp', () => {
      render(<PackingSupplyTracking {...mockProps} />);

      expect(screen.getByText(/ETA: eta 2:30 PM/)).toBeInTheDocument();
    });

    it('applies correct styling to pending steps', () => {
      render(<PackingSupplyTracking {...mockProps} />);

      const pendingStepTitle = screen.getByText('Your order has been delivered');
      expect(pendingStepTitle).toHaveClass('text-text-tertiary');
    });

    it('applies correct styling to complete steps', () => {
      render(<PackingSupplyTracking {...mockProps} />);

      const completeStepTitle = screen.getByText('Your order has been placed');
      expect(completeStepTitle).toHaveClass('text-text-primary');
    });

    it('renders in-transit step correctly', () => {
      render(<PackingSupplyTracking {...mockProps} />);

      // Verify that the in-transit step is rendered
      const inTransitStep = screen.getByText('Your order is out for delivery');
      expect(inTransitStep).toBeInTheDocument();
      
      // Verify the timestamp contains ETA
      expect(screen.getByText(/ETA: eta 2:30 PM/)).toBeInTheDocument();
    });
  });
});

