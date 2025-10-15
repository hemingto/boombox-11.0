/**
 * @fileoverview Tests for PackingSupplyDeliveryCard component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 * @source boombox-10.0/src/app/components/user-page/packingsupplydeliverycard.tsx
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { useRouter } from 'next/navigation';
import {
  PackingSupplyDeliveryCard,
  PackingSupplyDeliveryCardProps,
} from '@/components/features/customers/PackingSupplyDeliveryCard';

expect.extend(toHaveNoViolations);

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
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

// Mock Modal component
jest.mock('@/components/ui/primitives/Modal', () => ({
  Modal: function MockModal({ children, open, onClose, title }: any) {
    if (!open) return null;
    return (
      <div data-testid="modal" role="dialog" aria-labelledby="modal-title">
        <h2 id="modal-title">{title}</h2>
        <button onClick={onClose} data-testid="modal-close">
          Close
        </button>
        {children}
      </div>
    );
  },
}));

// Mock map styles
jest.mock('@/app/mapstyles', () => ({
  mapStyles: [],
}));

describe('PackingSupplyDeliveryCard', () => {
  const mockRefresh = jest.fn();
  const mockOnCancellation = jest.fn();

  const defaultProps: PackingSupplyDeliveryCardProps = {
    orderId: 123,
    deliveryAddress: '123 Main St, San Francisco, CA 94102',
    contactName: 'John Doe',
    contactEmail: 'john@example.com',
    contactPhone: '+14155551234',
    orderDate: '2025-10-01',
    deliveryDate: '2025-10-15',
    displayDeliveryDate: 'October 15th, 2025',
    deliveryTime: '10:00 AM - 12:00 PM',
    totalPrice: 150.0,
    status: 'Pending Batch',
    paymentStatus: 'Paid',
    trackingUrl: null,
    userId: '456',
    orderDetails: [
      {
        id: 1,
        productTitle: 'Moving Box (Large)',
        quantity: 10,
        price: 5.0,
        totalPrice: 50.0,
      },
      {
        id: 2,
        productTitle: 'Bubble Wrap Roll',
        quantity: 5,
        price: 10.0,
        totalPrice: 50.0,
      },
      {
        id: 3,
        productTitle: 'Packing Tape',
        quantity: 10,
        price: 5.0,
        totalPrice: 50.0,
      },
    ],
    onCancellation: mockOnCancellation,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      refresh: mockRefresh,
      back: jest.fn(),
      forward: jest.fn(),
    });

    // Mock Google Maps Geocoder
    global.google = {
      maps: {
        Geocoder: jest.fn().mockImplementation(() => ({
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
        })),
      },
    } as any;
  });

  afterEach(() => {
    delete (global as any).google;
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<PackingSupplyDeliveryCard {...defaultProps} />);
      expect(screen.getByText('Packing Supply Delivery')).toBeInTheDocument();
    });

    it('displays delivery address correctly', () => {
      render(<PackingSupplyDeliveryCard {...defaultProps} />);
      expect(screen.getByText('123 Main St, San Francisco, CA 94102')).toBeInTheDocument();
    });

    it('displays delivery date and time correctly', () => {
      render(<PackingSupplyDeliveryCard {...defaultProps} />);
      expect(screen.getByText('October 15th, 2025')).toBeInTheDocument();
      expect(screen.getByText('10:00 AM - 12:00 PM')).toBeInTheDocument();
    });

    it('displays item count correctly with singular form', () => {
      const singleItemProps = {
        ...defaultProps,
        orderDetails: [defaultProps.orderDetails[0]],
      };
      render(<PackingSupplyDeliveryCard {...singleItemProps} />);
      expect(screen.getByText('10 item ordered')).toBeInTheDocument();
    });

    it('displays item count correctly with plural form', () => {
      render(<PackingSupplyDeliveryCard {...defaultProps} />);
      expect(screen.getByText('25 items ordered')).toBeInTheDocument();
    });

    it('renders Google Map component', () => {
      render(<PackingSupplyDeliveryCard {...defaultProps} />);
      expect(screen.getByTestId('google-map')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<PackingSupplyDeliveryCard {...defaultProps} />);
      await testAccessibility(renderResult);
    });

    it('maintains accessibility with expanded order details', async () => {
      const renderResult = render(<PackingSupplyDeliveryCard {...defaultProps} />);
      const detailsButton = screen.getByText('Order Details').closest('button');
      
      if (detailsButton) {
        await userEvent.click(detailsButton);
      }
      
      await testAccessibility(renderResult);
    });
  });

  describe('User Interactions', () => {
    it('expands order details when button is clicked', async () => {
      render(<PackingSupplyDeliveryCard {...defaultProps} />);
      const detailsButton = screen.getByText('Order Details').closest('button');

      expect(screen.queryByText('Moving Box (Large)')).not.toBeVisible();

      if (detailsButton) {
        await userEvent.click(detailsButton);
      }

      await waitFor(() => {
        expect(screen.getByText(/Moving Box \(Large\)/)).toBeVisible();
      });
    });

    it('collapses order details when button is clicked again', async () => {
      render(<PackingSupplyDeliveryCard {...defaultProps} />);
      const detailsButton = screen.getByText('Order Details').closest('button');

      if (detailsButton) {
        await userEvent.click(detailsButton);
        await waitFor(() => {
          expect(screen.getByText(/Moving Box \(Large\)/)).toBeVisible();
        });

        await userEvent.click(detailsButton);
        await waitFor(() => {
          expect(screen.queryByText(/Moving Box \(Large\)/)).not.toBeVisible();
        });
      }
    });
  });

  describe('Order Details Display', () => {
    it('displays all order items with quantities and prices', async () => {
      render(<PackingSupplyDeliveryCard {...defaultProps} />);
      const detailsButton = screen.getByText('Order Details').closest('button');

      if (detailsButton) {
        await userEvent.click(detailsButton);
      }

      await waitFor(() => {
        expect(screen.getByText(/10 Moving Box \(Large\)/)).toBeInTheDocument();
        expect(screen.getByText('$50.00')).toBeInTheDocument();
        expect(screen.getByText(/5 Bubble Wrap Roll/)).toBeInTheDocument();
        expect(screen.getByText(/10 Packing Tape/)).toBeInTheDocument();
      });
    });

    it('calculates and displays correct subtotal', async () => {
      render(<PackingSupplyDeliveryCard {...defaultProps} />);
      const detailsButton = screen.getByText('Order Details').closest('button');

      if (detailsButton) {
        await userEvent.click(detailsButton);
      }

      await waitFor(() => {
        const totalElements = screen.getAllByText('$150.00');
        expect(totalElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Status Display', () => {
    it('shows in-progress indicator when status is in progress', () => {
      const inProgressProps = {
        ...defaultProps,
        status: 'In Progress',
      };
      render(<PackingSupplyDeliveryCard {...inProgressProps} />);
      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });

    it('does not show in-progress indicator when status is Pending Batch', () => {
      render(<PackingSupplyDeliveryCard {...defaultProps} />);
      expect(screen.queryByText('In Progress')).not.toBeInTheDocument();
    });

    it('does not show in-progress indicator when status is Delivered', () => {
      const deliveredProps = {
        ...defaultProps,
        status: 'Delivered',
      };
      render(<PackingSupplyDeliveryCard {...deliveredProps} />);
      expect(screen.queryByText('In Progress')).not.toBeInTheDocument();
    });

    it('does not show in-progress indicator when status is Cancelled', () => {
      const cancelledProps = {
        ...defaultProps,
        status: 'Cancelled',
      };
      render(<PackingSupplyDeliveryCard {...cancelledProps} />);
      expect(screen.queryByText('In Progress')).not.toBeInTheDocument();
    });
  });

  describe('Tracking Link', () => {
    it('displays tracking link when status is in progress and tracking URL exists', () => {
      const trackingProps = {
        ...defaultProps,
        status: 'In Progress',
        trackingUrl: 'https://tracking.example.com/123',
      };
      render(<PackingSupplyDeliveryCard {...trackingProps} />);
      
      const trackingLink = screen.getByText('Track Order').closest('a');
      expect(trackingLink).toHaveAttribute('href', 'https://tracking.example.com/123');
      expect(trackingLink).toHaveAttribute('target', '_blank');
      expect(trackingLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('does not display tracking link when status is Pending Batch', () => {
      const noTrackingProps = {
        ...defaultProps,
        trackingUrl: 'https://tracking.example.com/123',
      };
      render(<PackingSupplyDeliveryCard {...noTrackingProps} />);
      expect(screen.queryByText('Track Order')).not.toBeInTheDocument();
    });

    it('does not display tracking link when tracking URL is null', () => {
      const inProgressNoUrlProps = {
        ...defaultProps,
        status: 'In Progress',
        trackingUrl: null,
      };
      render(<PackingSupplyDeliveryCard {...inProgressNoUrlProps} />);
      expect(screen.queryByText('Track Order')).not.toBeInTheDocument();
    });
  });

  describe('Cancellation', () => {
    it('shows cancel button when status is Pending Batch', () => {
      render(<PackingSupplyDeliveryCard {...defaultProps} />);
      expect(screen.getByText('Cancel Order')).toBeInTheDocument();
    });

    it('does not show cancel button when status is not Pending Batch', () => {
      const inProgressProps = {
        ...defaultProps,
        status: 'In Progress',
      };
      render(<PackingSupplyDeliveryCard {...inProgressProps} />);
      expect(screen.queryByText('Cancel Order')).not.toBeInTheDocument();
    });

    it('opens cancellation modal when cancel button is clicked', async () => {
      render(<PackingSupplyDeliveryCard {...defaultProps} />);
      const cancelButton = screen.getByText('Cancel Order').closest('button');

      if (cancelButton) {
        await userEvent.click(cancelButton);
      }

      await waitFor(() => {
        expect(screen.getByText('Cancel Packing Supply Order')).toBeInTheDocument();
        expect(screen.getByText('Tell us why you need to cancel')).toBeInTheDocument();
      });
    });

    it('displays all cancellation reason options', async () => {
      render(<PackingSupplyDeliveryCard {...defaultProps} />);
      const cancelButton = screen.getByText('Cancel Order').closest('button');

      if (cancelButton) {
        await userEvent.click(cancelButton);
      }

      await waitFor(() => {
        expect(screen.getByText('No longer need these items')).toBeInTheDocument();
        expect(screen.getByText('Ordered wrong items')).toBeInTheDocument();
        expect(screen.getByText('Found items elsewhere')).toBeInTheDocument();
        expect(screen.getByText('Delivery date no longer works')).toBeInTheDocument();
        expect(screen.getByText('Changed mind about purchase')).toBeInTheDocument();
        expect(screen.getByText('Other')).toBeInTheDocument();
      });
    });

    it('allows selecting a cancellation reason', async () => {
      render(<PackingSupplyDeliveryCard {...defaultProps} />);
      const cancelButton = screen.getByText('Cancel Order').closest('button');

      if (cancelButton) {
        await userEvent.click(cancelButton);
      }

      await waitFor(() => {
        const reasonOption = screen.getByText('No longer need these items')
          .closest('label')
          ?.querySelector('input[type="radio"]');
        
        if (reasonOption) {
          fireEvent.click(reasonOption);
        }

        expect(reasonOption).toBeChecked();
      });
    });

    it('successfully cancels order with valid reason', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        })
      ) as jest.Mock;

      render(<PackingSupplyDeliveryCard {...defaultProps} />);
      const cancelButton = screen.getByText('Cancel Order').closest('button');

      if (cancelButton) {
        await userEvent.click(cancelButton);
      }

      await waitFor(async () => {
        const reasonOption = screen.getByText('No longer need these items')
          .closest('label')
          ?.querySelector('input[type="radio"]');
        
        if (reasonOption) {
          fireEvent.click(reasonOption);
        }

        const submitButton = screen.getAllByText('Cancel Order').find(el => 
          el.closest('button')?.className.includes('btn-destructive')
        );
        
        if (submitButton) {
          await userEvent.click(submitButton.closest('button')!);
        }

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith(
            '/api/orders/packing-supplies/123/cancel',
            expect.objectContaining({
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                cancellationReason: 'No longer need these items',
                userId: 456,
              }),
            })
          );
          expect(mockOnCancellation).toHaveBeenCalledWith(123);
          expect(mockRefresh).toHaveBeenCalled();
        });
      });
    });

    it('closes modal when Keep Order button is clicked', async () => {
      render(<PackingSupplyDeliveryCard {...defaultProps} />);
      const cancelButton = screen.getByText('Cancel Order').closest('button');

      if (cancelButton) {
        await userEvent.click(cancelButton);
      }

      await waitFor(async () => {
        const keepButton = screen.getByText('Keep Order');
        await userEvent.click(keepButton);

        await waitFor(() => {
          expect(screen.queryByText('Cancel Packing Supply Order')).not.toBeInTheDocument();
        });
      });
    });

    it('disables cancel button when no reason is selected', async () => {
      render(<PackingSupplyDeliveryCard {...defaultProps} />);
      const cancelButton = screen.getByText('Cancel Order').closest('button');

      if (cancelButton) {
        await userEvent.click(cancelButton);
      }

      await waitFor(() => {
        const submitButton = screen.getAllByText('Cancel Order').find(el => 
          el.closest('button')?.className.includes('btn-destructive')
        );
        
        expect(submitButton?.closest('button')).toBeDisabled();
      });
    });

    it('handles failed cancellation gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          json: async () => ({ error: 'Cancellation failed' }),
        })
      ) as jest.Mock;

      render(<PackingSupplyDeliveryCard {...defaultProps} />);
      const cancelButton = screen.getByText('Cancel Order').closest('button');

      if (cancelButton) {
        await userEvent.click(cancelButton);
      }

      await waitFor(async () => {
        const reasonOption = screen.getByText('No longer need these items')
          .closest('label')
          ?.querySelector('input[type="radio"]');
        
        if (reasonOption) {
          fireEvent.click(reasonOption);
        }

        const submitButton = screen.getAllByText('Cancel Order').find(el => 
          el.closest('button')?.className.includes('btn-destructive')
        );
        
        if (submitButton) {
          await userEvent.click(submitButton.closest('button')!);
        }

        await waitFor(() => {
          expect(consoleErrorSpy).toHaveBeenCalled();
          expect(mockOnCancellation).not.toHaveBeenCalled();
        });
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Map Integration', () => {
    it('geocodes the delivery address on mount', async () => {
      render(<PackingSupplyDeliveryCard {...defaultProps} />);

      await waitFor(() => {
        expect(global.google.maps.Geocoder).toHaveBeenCalled();
      });
    });

    it('displays marker when geocoding succeeds', async () => {
      render(<PackingSupplyDeliveryCard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('map-marker')).toBeInTheDocument();
      });
    });

    it('handles geocoding failure gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      global.google = {
        maps: {
          Geocoder: jest.fn().mockImplementation(() => ({
            geocode: jest.fn((request, callback) => {
              callback(null, 'ERROR');
            }),
          })),
        },
      } as any;

      render(<PackingSupplyDeliveryCard {...defaultProps} />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Geocoding failed: ', 'ERROR');
      });

      consoleErrorSpy.mockRestore();
    });
  });
});

