import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UpcomingJobs } from '@/components/features/service-providers/jobs/UpcomingJobs';

// Mock Google Maps
const mockGeocoder = {
  geocode: jest.fn(),
};

global.google = {
  maps: {
    Geocoder: jest.fn(() => mockGeocoder),
    LatLng: jest.fn((lat, lng) => ({ lat, lng })),
  },
} as any;

// Mock @react-google-maps/api
jest.mock('@react-google-maps/api', () => ({
  GoogleMap: ({ children }: any) => <div data-testid="google-map">{children}</div>,
  Marker: () => <div data-testid="marker" />,
}));

// Mock hooks
jest.mock('@/hooks/useClickOutside', () => ({
  useClickOutside: jest.fn(),
}));

// Mock shared components
jest.mock('@/components/features/service-providers/shared/AppointmentDetailsPopup', () => ({
  AppointmentDetailsPopup: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="appointment-details-popup">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('UpcomingJobs', () => {
  const mockUserId = 'user-123';
  const mockUserType = 'driver';

  const mockAppointments = [
    {
      id: 1,
      address: '123 Main St, San Francisco, CA',
      date: new Date('2025-10-15'),
      time: new Date('2025-10-15T10:00:00'),
      numberOfUnits: 2,
      planType: 'Standard',
      appointmentType: 'Container Delivery',
      driver: {
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '555-1234',
      },
    },
    {
      id: 2,
      address: '456 Oak Ave, San Francisco, CA',
      date: new Date('2025-10-16'),
      time: new Date('2025-10-16T14:00:00'),
      numberOfUnits: 1,
      planType: 'Premium',
      appointmentType: 'Container Pickup',
    },
  ];

  const mockPackingSupplyRoute = {
    id: 3,
    address: '789 Pine St, San Francisco, CA',
    date: new Date('2025-10-17'),
    time: new Date('2025-10-17T09:00:00'),
    appointmentType: 'Packing Supply Delivery',
    routeId: 'route-123',
    routeStatus: 'pending',
    totalStops: 5,
    completedStops: 2,
    estimatedPayout: 150,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();

    // Default geocoder mock
    mockGeocoder.geocode.mockImplementation((request: any, callback: any) => {
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
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render loading state initially', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<UpcomingJobs userId={mockUserId} userType={mockUserType} />);

      expect(screen.getByLabelText('Loading upcoming jobs')).toBeInTheDocument();
      expect(screen.getByText('Upcoming Jobs')).toBeInTheDocument();
    });

    it('should render jobs after loading', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAppointments,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

      render(<UpcomingJobs userId={mockUserId} userType={mockUserType} />);

      await waitFor(() => {
        expect(screen.getByText('123 Main St, San Francisco, CA')).toBeInTheDocument();
        expect(screen.getByText('456 Oak Ave, San Francisco, CA')).toBeInTheDocument();
      });
    });

    it('should render View Calendar button', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAppointments,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

      render(<UpcomingJobs userId={mockUserId} userType={mockUserType} />);

      await waitFor(() => {
        expect(screen.getByText('View Calendar')).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('should fetch appointments and packing supply routes for drivers', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAppointments,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [mockPackingSupplyRoute],
        });

      render(<UpcomingJobs userId={mockUserId} userType="driver" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/customers/upcoming-appointments?userType=driver&userId=${mockUserId}`
        );
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/drivers/${mockUserId}/packing-supply-routes`
        );
      });
    });

    it('should fetch appointments and packing supply routes for movers', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAppointments,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [mockPackingSupplyRoute],
        });

      render(<UpcomingJobs userId={mockUserId} userType="mover" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/customers/upcoming-appointments?userType=mover&userId=${mockUserId}`
        );
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/moving-partners/${mockUserId}/packing-supply-routes`
        );
      });
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<UpcomingJobs userId={mockUserId} userType={mockUserType} />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('Failed to load appointments')).toBeInTheDocument();
      });
    });

    it('should continue if packing supply routes fail', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAppointments,
        })
        .mockRejectedValueOnce(new Error('Routes error'));

      render(<UpcomingJobs userId={mockUserId} userType={mockUserType} />);

      await waitFor(() => {
        expect(screen.getByText('123 Main St, San Francisco, CA')).toBeInTheDocument();
      });
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no appointments', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

      render(<UpcomingJobs userId={mockUserId} userType={mockUserType} />);

      await waitFor(() => {
        expect(screen.getByText('No upcoming jobs available')).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    beforeEach(async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const appointmentsWithDates = [
        { ...mockAppointments[0], date: today },
        { ...mockAppointments[1], date: tomorrow, driver: undefined },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => appointmentsWithDates,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });
    });

    it('should show filter dropdown when clicked', async () => {
      render(<UpcomingJobs userId={mockUserId} userType="mover" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Filter jobs/i)).toBeInTheDocument();
      });

      const filterButton = screen.getByLabelText(/Filter jobs/i);
      fireEvent.click(filterButton);

      // Check that dropdown options appear
      await waitFor(() => {
        const nextUpOptions = screen.getAllByText('Next Up');
        expect(nextUpOptions.length).toBeGreaterThan(0);
      });
    });

    it('should show Unassigned filter option for movers only', async () => {
      const { rerender } = render(
        <UpcomingJobs userId={mockUserId} userType="mover" />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/Filter jobs/i)).toBeInTheDocument();
      });

      const filterButton = screen.getByLabelText(/Filter jobs/i);
      fireEvent.click(filterButton);

      await waitFor(() => {
        expect(screen.getByText('Unassigned')).toBeInTheDocument();
      });

      // Rerender with driver userType
      (global.fetch as jest.Mock).mockClear();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAppointments,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

      rerender(<UpcomingJobs userId={mockUserId} userType="driver" />);

      await waitFor(() => {
        const filterBtn = screen.getByLabelText(/Filter jobs/i);
        fireEvent.click(filterBtn);
      });

      // Unassigned should not be present for drivers
      expect(screen.queryByText('Unassigned')).not.toBeInTheDocument();
    });

    it('should filter appointments when selecting Today', async () => {
      render(<UpcomingJobs userId={mockUserId} userType={mockUserType} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Filter jobs/i)).toBeInTheDocument();
      });

      const filterButton = screen.getByLabelText(/Filter jobs/i);
      fireEvent.click(filterButton);

      const todayOption = screen.getByRole('option', { name: 'Today' });
      fireEvent.click(todayOption);

      // Verify filter closed
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });
  });

  describe('Status Badges', () => {
    it('should show Driver Assigned badge when driver exists', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAppointments,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

      render(<UpcomingJobs userId={mockUserId} userType="mover" />);

      await waitFor(() => {
        expect(screen.getByText('Driver Assigned')).toBeInTheDocument();
      });
    });

    it('should show Driver Unassigned badge when no driver', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [mockAppointments[1]], // No driver
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

      render(<UpcomingJobs userId={mockUserId} userType="mover" />);

      await waitFor(() => {
        expect(screen.getByText('Driver Unassigned')).toBeInTheDocument();
      });
    });

    it('should show route status badges for packing supply routes', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [mockPackingSupplyRoute],
        });

      render(<UpcomingJobs userId={mockUserId} userType="mover" />);

      await waitFor(() => {
        expect(screen.getByText('Route Pending')).toBeInTheDocument();
      });
    });

    it('should not show status badges for drivers', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAppointments,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

      render(<UpcomingJobs userId={mockUserId} userType="driver" />);

      await waitFor(() => {
        expect(screen.getByText('123 Main St, San Francisco, CA')).toBeInTheDocument();
      });

      // Status badges should not be present for drivers
      expect(screen.queryByText('Driver Assigned')).not.toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('should show pagination when more than 5 items', async () => {
      const manyAppointments = Array.from({ length: 10 }, (_, i) => ({
        ...mockAppointments[0],
        id: i,
        address: `${i} Street`,
      }));

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => manyAppointments,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

      render(<UpcomingJobs userId={mockUserId} userType={mockUserType} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Pagination')).toBeInTheDocument();
        expect(screen.getByText(/Page 1 of 2/i)).toBeInTheDocument();
      });
    });

    it('should navigate to next page', async () => {
      const manyAppointments = Array.from({ length: 10 }, (_, i) => ({
        ...mockAppointments[0],
        id: i,
        address: `${i} Street`,
      }));

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => manyAppointments,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

      render(<UpcomingJobs userId={mockUserId} userType={mockUserType} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Next page')).toBeInTheDocument();
      });

      const nextButton = screen.getByLabelText('Next page');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/Page 2 of 2/i)).toBeInTheDocument();
      });
    });

    it('should disable previous button on first page', async () => {
      const manyAppointments = Array.from({ length: 10 }, (_, i) => ({
        ...mockAppointments[0],
        id: i,
        address: `${i} Street`,
      }));

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => manyAppointments,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

      render(<UpcomingJobs userId={mockUserId} userType={mockUserType} />);

      await waitFor(() => {
        const prevButton = screen.getByLabelText('Previous page');
        expect(prevButton).toBeDisabled();
      });
    });
  });

  describe('Google Maps Integration', () => {
    it('should geocode appointment addresses', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [mockAppointments[0]],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

      render(<UpcomingJobs userId={mockUserId} userType={mockUserType} />);

      await waitFor(() => {
        expect(mockGeocoder.geocode).toHaveBeenCalledWith(
          { address: '123 Main St, San Francisco, CA' },
          expect.any(Function)
        );
      });
    });

    it('should show loading state while geocoding', async () => {
      mockGeocoder.geocode.mockImplementation((request: any, callback: any) => {
        // Don't call callback immediately
        setTimeout(() => {
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
        }, 100);
      });

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [mockAppointments[0]],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

      render(<UpcomingJobs userId={mockUserId} userType={mockUserType} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Loading map')).toBeInTheDocument();
      });
    });

    it('should handle geocoding errors', async () => {
      mockGeocoder.geocode.mockImplementation((request: any, callback: any) => {
        callback([], 'ERROR');
      });

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [mockAppointments[0]],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

      render(<UpcomingJobs userId={mockUserId} userType={mockUserType} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load map')).toBeInTheDocument();
      });
    });
  });

  describe('Job Cancellation', () => {
    it('should open cancellation modal when clicking Cancel Job', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [mockAppointments[0]],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

      render(<UpcomingJobs userId={mockUserId} userType={mockUserType} />);

      await waitFor(() => {
        expect(screen.getByText('123 Main St, San Francisco, CA')).toBeInTheDocument();
      });

      // Click menu button
      const menuButton = screen.getByLabelText('Job options');
      fireEvent.click(menuButton);

      // Click Cancel Job
      const cancelButton = screen.getByRole('menuitem', { name: 'Cancel Job' });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.getByText('Confirm your cancellation')).toBeInTheDocument();
        expect(screen.getByText('Tell us why you need to cancel')).toBeInTheDocument();
      });
    });

    it('should submit cancellation with reason', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [mockAppointments[0]],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      render(<UpcomingJobs userId={mockUserId} userType={mockUserType} />);

      await waitFor(() => {
        expect(screen.getByText('123 Main St, San Francisco, CA')).toBeInTheDocument();
      });

      // Open menu and click Cancel Job
      const menuButton = screen.getByLabelText('Job options');
      fireEvent.click(menuButton);

      const cancelButton = screen.getByRole('menuitem', { name: 'Cancel Job' });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.getByText('Confirm your cancellation')).toBeInTheDocument();
      });

      // Select a reason (assuming RadioList renders radio buttons)
      const radioOptions = screen.getAllByRole('radio');
      if (radioOptions.length > 0) {
        fireEvent.click(radioOptions[0]);
      }

      // Click confirm button
      const confirmButton = screen.getByLabelText('Confirm job cancellation');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/orders/appointments/1/mover-driver-cancel`,
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('cancellationReason'),
          })
        );
      });
    });

    it('should show error when cancellation fails', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [mockAppointments[0]],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Cancellation failed' }),
        });

      render(<UpcomingJobs userId={mockUserId} userType={mockUserType} />);

      await waitFor(() => {
        expect(screen.getByText('123 Main St, San Francisco, CA')).toBeInTheDocument();
      });

      // Open menu and cancel
      const menuButton = screen.getByLabelText('Job options');
      fireEvent.click(menuButton);

      const cancelButton = screen.getByRole('menuitem', { name: 'Cancel Job' });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        const confirmButton = screen.getByLabelText('Confirm job cancellation');
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Cancellation failed')).toBeInTheDocument();
      });
    });
  });

  describe('Appointment Details', () => {
    it('should open details popup when clicking More Details', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [mockAppointments[0]],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

      render(<UpcomingJobs userId={mockUserId} userType={mockUserType} />);

      await waitFor(() => {
        expect(screen.getByText('123 Main St, San Francisco, CA')).toBeInTheDocument();
      });

      // Click menu button
      const menuButton = screen.getByLabelText('Job options');
      fireEvent.click(menuButton);

      // Click More Details
      const detailsButton = screen.getByRole('menuitem', { name: 'More Details' });
      fireEvent.click(detailsButton);

      await waitFor(() => {
        expect(screen.getByTestId('appointment-details-popup')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for interactive elements', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAppointments,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

      render(<UpcomingJobs userId={mockUserId} userType={mockUserType} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Filter jobs/i)).toBeInTheDocument();
        expect(screen.getByLabelText('View calendar in new tab')).toBeInTheDocument();
      });
    });

    it('should have proper loading state announcements', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      );

      render(<UpcomingJobs userId={mockUserId} userType={mockUserType} />);

      const loadingStatus = screen.getByRole('status');
      expect(loadingStatus).toHaveAttribute('aria-busy', 'true');
      expect(loadingStatus).toHaveAttribute('aria-label', 'Loading upcoming jobs');
    });

    it('should announce pagination changes', async () => {
      const manyAppointments = Array.from({ length: 10 }, (_, i) => ({
        ...mockAppointments[0],
        id: i,
        address: `${i} Street`,
      }));

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => manyAppointments,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

      render(<UpcomingJobs userId={mockUserId} userType={mockUserType} />);

      await waitFor(() => {
        const paginationText = screen.getByText(/Page 1 of 2/i);
        expect(paginationText).toHaveAttribute('aria-live', 'polite');
      });
    });
  });

  describe('Packing Supply Routes', () => {
    it('should display packing supply route information', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [mockPackingSupplyRoute],
        });

      render(<UpcomingJobs userId={mockUserId} userType={mockUserType} />);

      await waitFor(() => {
        expect(screen.getByText(/2\/5 stops completed/i)).toBeInTheDocument();
        expect(screen.getByText(/Est\. payout: \$150/i)).toBeInTheDocument();
      });
    });

    it('should show route status badges', async () => {
      const completedRoute = {
        ...mockPackingSupplyRoute,
        routeStatus: 'completed',
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [completedRoute],
        });

      render(<UpcomingJobs userId={mockUserId} userType="mover" />);

      await waitFor(() => {
        expect(screen.getByText('Route Completed')).toBeInTheDocument();
      });
    });
  });
});

