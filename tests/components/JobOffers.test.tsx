import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JobOffers } from '@/components/features/service-providers/jobs/JobOffers';

// Mock fetch globally
global.fetch = jest.fn();

// Mock date-fns format
jest.mock('date-fns', () => ({
  ...jest.requireActual('date-fns'),
  format: jest.fn((date, formatStr) => {
    if (formatStr.includes('EEE, MMM d')) return 'Sat, Dec 13';
    if (formatStr.includes('h:mmaaa')) return '9:00am';
    return date.toString();
  }),
  subHours: jest.fn((date) => new Date(new Date(date).getTime() - 60 * 60 * 1000)),
}));

describe('JobOffers', () => {
  const mockDriverId = '123';

  const mockAppointmentOffer = {
    id: 1,
    type: 'appointment' as const,
    appointmentId: 100,
    onfleetTaskId: 'task-123',
    unitNumber: 1,
    address: '2180 Vallejo Street, San Francisco, CA 94123',
    date: '2025-12-13T00:00:00Z',
    time: '2025-12-13T10:00:00Z',
    appointmentType: 'Initial Pickup',
    planType: 'Do It Yourself Plan',
    numberOfUnits: 1,
    payEstimate: '$97',
    notifiedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
    expiresAt: new Date(Date.now() + 90 * 60 * 1000).toISOString(), // 90 mins from now
    token: 'test-token-123',
    customer: {
      firstName: 'John',
      lastName: 'Doe',
    },
  };

  const mockPackingSupplyRouteOffer = {
    id: 'route-456',
    type: 'packingSupplyRoute' as const,
    routeId: 'route-456',
    deliveryDate: '2025-12-16T00:00:00Z',
    totalStops: 5,
    estimatedPayout: '$85',
    estimatedMiles: 12,
    estimatedDuration: '2h 30m',
    firstStopAddress: '456 Oak Ave, San Francisco, CA',
    notifiedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 mins ago
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 mins from now
    token: 'route-token-456',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({ advanceTimers: true });
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render loading state initially', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<JobOffers driverId={mockDriverId} />);

      expect(screen.getByLabelText('Loading job offers')).toBeInTheDocument();
      expect(screen.getByText('Job Offers')).toBeInTheDocument();
    });

    it('should render appointment offers after loading', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          offers: [mockAppointmentOffer],
          count: 1,
        }),
      });

      render(<JobOffers driverId={mockDriverId} />);

      await waitFor(() => {
        expect(screen.getByText('2180 Vallejo Street')).toBeInTheDocument();
        expect(screen.getByText('Initial Pickup')).toBeInTheDocument();
      });
    });

    it('should render packing supply route offers after loading', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          offers: [mockPackingSupplyRouteOffer],
          count: 1,
        }),
      });

      render(<JobOffers driverId={mockDriverId} />);

      await waitFor(() => {
        expect(screen.getByText('5 Stop Route')).toBeInTheDocument();
        expect(screen.getByText(/456 Oak Ave/)).toBeInTheDocument();
      });
    });

    it('should render both offer types', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          offers: [mockAppointmentOffer, mockPackingSupplyRouteOffer],
          count: 2,
        }),
      });

      render(<JobOffers driverId={mockDriverId} />);

      await waitFor(() => {
        expect(screen.getByText('2180 Vallejo Street')).toBeInTheDocument();
        expect(screen.getByText('5 Stop Route')).toBeInTheDocument();
      });
    });

    it('should show navigation arrows when multiple offers exist', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          offers: [mockAppointmentOffer, mockPackingSupplyRouteOffer],
          count: 2,
        }),
      });

      render(<JobOffers driverId={mockDriverId} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Scroll left to previous offer')).toBeInTheDocument();
        expect(screen.getByLabelText('Scroll right to next offer')).toBeInTheDocument();
      });
    });

    it('should not show navigation arrows for single offer', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          offers: [mockAppointmentOffer],
          count: 1,
        }),
      });

      render(<JobOffers driverId={mockDriverId} />);

      await waitFor(() => {
        expect(screen.getByText('Initial Pickup')).toBeInTheDocument();
      });

      expect(screen.queryByLabelText('Scroll left to previous offer')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Scroll right to next offer')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should not render anything when no offers', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          offers: [],
          count: 0,
        }),
      });

      const { container } = render(<JobOffers driverId={mockDriverId} />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error message when fetch fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<JobOffers driverId={mockDriverId} />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('Failed to load job offers')).toBeInTheDocument();
      });
    });

    it('should show error message when response is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Server error' }),
      });

      render(<JobOffers driverId={mockDriverId} />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('Failed to load job offers')).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('should fetch pending offers with correct driver ID', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          offers: [],
          count: 0,
        }),
      });

      render(<JobOffers driverId={mockDriverId} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/drivers/${mockDriverId}/pending-offers`
        );
      });
    });
  });

  describe('Accept/Decline Actions', () => {
    it('should have Accept and Decline buttons for each offer', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          offers: [mockAppointmentOffer],
          count: 1,
        }),
      });

      render(<JobOffers driverId={mockDriverId} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Accept this job offer')).toBeInTheDocument();
        expect(screen.getByLabelText('Decline this job offer')).toBeInTheDocument();
      });
    });

    it('should call driver-assign API when accepting appointment offer', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            offers: [mockAppointmentOffer],
            count: 1,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      render(<JobOffers driverId={mockDriverId} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Accept this job offer')).toBeInTheDocument();
      });

      const acceptButton = screen.getByLabelText('Accept this job offer');
      fireEvent.click(acceptButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/onfleet/driver-assign',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              appointmentId: mockAppointmentOffer.appointmentId,
              driverId: parseInt(mockDriverId),
              onfleetTaskId: mockAppointmentOffer.onfleetTaskId,
              action: 'accept',
            }),
          })
        );
      });
    });

    it('should call driver-assign API when declining appointment offer', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            offers: [mockAppointmentOffer],
            count: 1,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      render(<JobOffers driverId={mockDriverId} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Decline this job offer')).toBeInTheDocument();
      });

      const declineButton = screen.getByLabelText('Decline this job offer');
      fireEvent.click(declineButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/onfleet/driver-assign',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              appointmentId: mockAppointmentOffer.appointmentId,
              driverId: parseInt(mockDriverId),
              onfleetTaskId: mockAppointmentOffer.onfleetTaskId,
              action: 'decline',
            }),
          })
        );
      });
    });

    it('should remove offer from list after successful accept', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            offers: [mockAppointmentOffer],
            count: 1,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      render(<JobOffers driverId={mockDriverId} />);

      await waitFor(() => {
        expect(screen.getByText('2180 Vallejo Street')).toBeInTheDocument();
      });

      const acceptButton = screen.getByLabelText('Accept this job offer');
      fireEvent.click(acceptButton);

      await waitFor(() => {
        expect(screen.queryByText('2180 Vallejo Street')).not.toBeInTheDocument();
      });
    });

    it('should show success message after accepting offer when multiple offers exist', async () => {
      // With multiple offers, the component still renders after one is removed
      const secondOffer = {
        ...mockAppointmentOffer,
        id: 2,
        appointmentId: 101,
        address: '789 Second St, San Francisco, CA',
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            offers: [mockAppointmentOffer, secondOffer],
            count: 2,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      render(<JobOffers driverId={mockDriverId} />);

      await waitFor(() => {
        const acceptButtons = screen.getAllByLabelText('Accept this job offer');
        expect(acceptButtons.length).toBe(2);
      });

      const acceptButtons = screen.getAllByLabelText('Accept this job offer');
      fireEvent.click(acceptButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Job accepted/i)).toBeInTheDocument();
      });
    });

    it('should show error message when accept fails', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            offers: [mockAppointmentOffer],
            count: 1,
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Job already taken' }),
        });

      render(<JobOffers driverId={mockDriverId} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Accept this job offer')).toBeInTheDocument();
      });

      const acceptButton = screen.getByLabelText('Accept this job offer');
      fireEvent.click(acceptButton);

      await waitFor(() => {
        expect(screen.getByText('Job already taken')).toBeInTheDocument();
      });
    });

    it('should disable buttons while action is in progress', async () => {
      let resolveAccept: (value: any) => void;
      const acceptPromise = new Promise((resolve) => {
        resolveAccept = resolve;
      });

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            offers: [mockAppointmentOffer],
            count: 1,
          }),
        })
        .mockImplementationOnce(() => acceptPromise);

      render(<JobOffers driverId={mockDriverId} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Accept this job offer')).toBeInTheDocument();
      });

      const acceptButton = screen.getByLabelText('Accept this job offer');
      const declineButton = screen.getByLabelText('Decline this job offer');
      
      fireEvent.click(acceptButton);

      await waitFor(() => {
        expect(acceptButton).toBeDisabled();
        expect(declineButton).toBeDisabled();
      });

      // Resolve the promise to clean up
      act(() => {
        resolveAccept!({
          ok: true,
          json: async () => ({ success: true }),
        });
      });
    });
  });

  describe('Countdown Timer', () => {
    it('should display countdown timer for each offer', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          offers: [mockAppointmentOffer],
          count: 1,
        }),
      });

      render(<JobOffers driverId={mockDriverId} />);

      await waitFor(() => {
        expect(screen.getByText(/Expires/i)).toBeInTheDocument();
      });
    });
  });

  describe('Offer Details Display', () => {
    it('should display appointment type badge', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          offers: [mockAppointmentOffer],
          count: 1,
        }),
      });

      render(<JobOffers driverId={mockDriverId} />);

      await waitFor(() => {
        expect(screen.getByText('Initial Pickup')).toBeInTheDocument();
      });
    });

    it('should display pay amount for appointment offers', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          offers: [mockAppointmentOffer],
          count: 1,
        }),
      });

      render(<JobOffers driverId={mockDriverId} />);

      await waitFor(() => {
        expect(screen.getByText('$97')).toBeInTheDocument();
      });
    });

    it('should display route metrics for packing supply routes', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          offers: [mockPackingSupplyRouteOffer],
          count: 1,
        }),
      });

      render(<JobOffers driverId={mockDriverId} />);

      await waitFor(() => {
        expect(screen.getByText('$85')).toBeInTheDocument();
        expect(screen.getByText(/~12 mi/)).toBeInTheDocument();
        expect(screen.getByText(/2h 30m/)).toBeInTheDocument();
      });
    });

    it('should display Delivery Route badge for packing supply routes', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          offers: [mockPackingSupplyRouteOffer],
          count: 1,
        }),
      });

      render(<JobOffers driverId={mockDriverId} />);

      await waitFor(() => {
        expect(screen.getByText('Delivery Route')).toBeInTheDocument();
      });
    });

    it('should parse address into street and city/state/zip', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          offers: [mockAppointmentOffer],
          count: 1,
        }),
      });

      render(<JobOffers driverId={mockDriverId} />);

      await waitFor(() => {
        expect(screen.getByText('2180 Vallejo Street')).toBeInTheDocument();
        expect(screen.getByText('San Francisco, CA 94123')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for interactive elements', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          offers: [mockAppointmentOffer],
          count: 1,
        }),
      });

      render(<JobOffers driverId={mockDriverId} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Accept this job offer')).toBeInTheDocument();
        expect(screen.getByLabelText('Decline this job offer')).toBeInTheDocument();
      });
    });

    it('should have proper loading state announcements', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      );

      render(<JobOffers driverId={mockDriverId} />);

      const loadingStatus = screen.getByRole('status');
      expect(loadingStatus).toHaveAttribute('aria-busy', 'true');
      expect(loadingStatus).toHaveAttribute('aria-label', 'Loading job offers');
    });

    it('should announce success messages when multiple offers exist', async () => {
      // With multiple offers, the component still renders after one is removed
      const secondOffer = {
        ...mockAppointmentOffer,
        id: 2,
        appointmentId: 101,
        address: '789 Second St, San Francisco, CA',
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            offers: [mockAppointmentOffer, secondOffer],
            count: 2,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      render(<JobOffers driverId={mockDriverId} />);

      await waitFor(() => {
        const acceptButtons = screen.getAllByLabelText('Accept this job offer');
        expect(acceptButtons.length).toBe(2);
      });

      const acceptButtons = screen.getAllByLabelText('Accept this job offer');
      fireEvent.click(acceptButtons[0]);

      await waitFor(() => {
        // Check that the success message container has proper aria-live
        const statusElements = screen.getAllByRole('status');
        const successStatus = statusElements.find(el => el.getAttribute('aria-live') === 'polite');
        expect(successStatus).toBeDefined();
      });
    });

    it('should have proper ARIA labels for route offers', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          offers: [mockPackingSupplyRouteOffer],
          count: 1,
        }),
      });

      render(<JobOffers driverId={mockDriverId} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Accept this route offer')).toBeInTheDocument();
        expect(screen.getByLabelText('Decline this route offer')).toBeInTheDocument();
      });
    });

    it('should have scrollable container with keyboard navigation label', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          offers: [mockAppointmentOffer],
          count: 1,
        }),
      });

      render(<JobOffers driverId={mockDriverId} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Job offers - use arrow keys or scroll to navigate')).toBeInTheDocument();
      });
    });
  });

  describe('Packing Supply Route Offers', () => {
    it('should call driver-response API when accepting route offer', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            offers: [mockPackingSupplyRouteOffer],
            count: 1,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      render(<JobOffers driverId={mockDriverId} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Accept this route offer')).toBeInTheDocument();
      });

      const acceptButton = screen.getByLabelText('Accept this route offer');
      fireEvent.click(acceptButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/onfleet/packing-supplies/driver-response',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              token: mockPackingSupplyRouteOffer.token,
              action: 'accept',
            }),
          })
        );
      });
    });

    it('should call driver-response API when declining route offer', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            offers: [mockPackingSupplyRouteOffer],
            count: 1,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      render(<JobOffers driverId={mockDriverId} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Decline this route offer')).toBeInTheDocument();
      });

      const declineButton = screen.getByLabelText('Decline this route offer');
      fireEvent.click(declineButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/onfleet/packing-supplies/driver-response',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              token: mockPackingSupplyRouteOffer.token,
              action: 'decline',
            }),
          })
        );
      });
    });
  });

  describe('Horizontal Scroll Navigation', () => {
    it('should have navigation buttons when multiple offers', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          offers: [mockAppointmentOffer, mockPackingSupplyRouteOffer],
          count: 2,
        }),
      });

      render(<JobOffers driverId={mockDriverId} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Scroll left to previous offer')).toBeInTheDocument();
        expect(screen.getByLabelText('Scroll right to next offer')).toBeInTheDocument();
      });
    });

    it('should call scrollTo on navigation button click', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          offers: [mockAppointmentOffer, mockPackingSupplyRouteOffer],
          count: 2,
        }),
      });

      // Mock scrollTo on Element prototype since JSDOM doesn't implement it
      const scrollToMock = jest.fn();
      Element.prototype.scrollTo = scrollToMock;

      render(<JobOffers driverId={mockDriverId} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Scroll right to next offer')).toBeInTheDocument();
      });

      const rightButton = screen.getByLabelText('Scroll right to next offer');
      fireEvent.click(rightButton);

      expect(scrollToMock).toHaveBeenCalled();
    });
  });
});
