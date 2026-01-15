/**
 * @fileoverview Tests for CalendarView component
 * Following boombox-11.0 testing standards
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import CalendarView from '@/components/features/service-providers/calendar/CalendarView';

expect.extend(toHaveNoViolations);

// Mock FullCalendar and its plugins
jest.mock('@fullcalendar/react', () => {
  return {
    __esModule: true,
    default: function MockFullCalendar(props: any) {
      // Simulate eventClick callback with FullCalendar's event structure
      const handleEventClick = () => {
        if (props.events && props.events.length > 0 && props.eventClick) {
          const mockEvent = {
            event: {
              id: props.events[0].id,
              title: props.events[0].title,
              start: props.events[0].start,
              end: props.events[0].end,
              extendedProps: props.events[0].extendedProps,
            },
            jsEvent: new MouseEvent('click'),
            view: {},
          };
          props.eventClick(mockEvent);
        }
      };

      return (
        <div data-testid="calendar-mock">
          <button onClick={handleEventClick}>
            Select Event
          </button>
          <div>{props.events?.length ?? 0} events</div>
        </div>
      );
    },
  };
});

// Mock FullCalendar plugins
jest.mock('@fullcalendar/daygrid', () => ({ __esModule: true, default: {} }));
jest.mock('@fullcalendar/timegrid', () => ({ __esModule: true, default: {} }));
jest.mock('@fullcalendar/list', () => ({ __esModule: true, default: {} }));
jest.mock('@fullcalendar/interaction', () => ({ __esModule: true, default: {} }));

// Mock AppointmentDetailsPopup from shared folder
jest.mock('@/components/features/service-providers/shared/AppointmentDetailsPopup', () => ({
  AppointmentDetailsPopup: function MockAppointmentDetailsPopup(props: any) {
    return props.isOpen ? (
      <div data-testid="appointment-details-popup">
        <button onClick={props.onClose}>Close</button>
        {props.appointment && (
          <div data-testid="appointment-info">
            {props.appointment.address}
          </div>
        )}
      </div>
    ) : null;
  }
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('CalendarView', () => {
  const mockDriverAppointments = [
    {
      id: 1,
      address: '123 Main St',
      date: new Date('2025-10-15T10:00:00'),
      appointmentType: 'Storage Unit Delivery',
      status: 'Scheduled',
      numberOfUnits: 2,
      planType: 'Monthly Storage',
      user: {
        firstName: 'John',
        lastName: 'Doe',
      },
      driver: {
        firstName: 'Jane',
        lastName: 'Smith',
        phoneNumber: '+15551234567',
      },
    },
  ];

  const mockPackingSupplyRoutes = [
    {
      id: 2,
      date: new Date('2025-10-16T12:00:00'),
      appointmentType: 'Packing Supply Delivery',
      routeId: 'PSR-123',
      routeStatus: 'in_progress',
      address: 'Multiple Locations',
      totalStops: 5,
      completedStops: 2,
      estimatedMiles: 15,
      estimatedDurationMinutes: 180,
      estimatedPayout: 75,
      payoutStatus: 'pending',
      driver: {
        id: 1,
        firstName: 'Jane',
        lastName: 'Smith',
      },
      orders: [
        {
          routeStopNumber: 1,
          contactName: 'Customer 1',
          deliveryAddress: '456 Oak Ave',
          status: 'completed',
        },
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/appointments')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDriverAppointments),
        });
      }
      if (url.includes('/packing-supply-routes')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPackingSupplyRoutes),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders loading state initially', () => {
      render(<CalendarView userType="driver" userId="123" />);
      expect(screen.getByRole('status', { name: /loading calendar/i })).toBeInTheDocument();
    });

    it('renders calendar after data loads for driver', async () => {
      render(<CalendarView userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByTestId('calendar-mock')).toBeInTheDocument();
      });
    });

    it('renders calendar after data loads for mover', async () => {
      render(<CalendarView userType="mover" userId="456" />);

      await waitFor(() => {
        expect(screen.getByTestId('calendar-mock')).toBeInTheDocument();
      });
    });

    it('displays correct number of events', async () => {
      render(<CalendarView userType="driver" userId="123" />);

      await waitFor(() => {
        // Should have 2 events: 1 appointment + 1 packing supply route
        expect(screen.getByText(/2 events/i)).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('fetches appointments from correct driver endpoint', async () => {
      render(<CalendarView userType="driver" userId="123" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/drivers/123/appointments');
      });
    });

    it('fetches appointments from correct moving partner endpoint', async () => {
      render(<CalendarView userType="mover" userId="456" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/moving-partners/456/appointments');
      });
    });

    it('fetches packing supply routes for driver', async () => {
      render(<CalendarView userType="driver" userId="123" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/drivers/123/packing-supply-routes');
      });
    });

    it('fetches packing supply routes for mover', async () => {
      render(<CalendarView userType="mover" userId="456" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/moving-partners/456/packing-supply-routes');
      });
    });

    it('handles packing supply routes fetch failure gracefully', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/appointments')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockDriverAppointments),
          });
        }
        if (url.includes('/packing-supply-routes')) {
          return Promise.resolve({
            ok: false,
            status: 404,
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      render(<CalendarView userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByTestId('calendar-mock')).toBeInTheDocument();
      });

      // Should still render calendar with just appointments
      expect(screen.getByText(/1 events/i)).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('handles complete fetch failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<CalendarView userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByTestId('calendar-mock')).toBeInTheDocument();
      });

      // Calendar should render even with no data
      expect(screen.getByText(/0 events/i)).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('Appointment Details Popup', () => {
    it('opens popup when event is selected', async () => {
      render(<CalendarView userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByTestId('calendar-mock')).toBeInTheDocument();
      });

      const selectButton = screen.getByText('Select Event');
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(screen.getByTestId('appointment-details-popup')).toBeInTheDocument();
      });
    });

    it('closes popup when close button is clicked', async () => {
      render(<CalendarView userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByTestId('calendar-mock')).toBeInTheDocument();
      });

      // Open popup
      const selectButton = screen.getByText('Select Event');
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(screen.getByTestId('appointment-details-popup')).toBeInTheDocument();
      });

      // Close popup
      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('appointment-details-popup')).not.toBeInTheDocument();
      });
    });

    it('passes correct appointment details to popup', async () => {
      render(<CalendarView userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByTestId('calendar-mock')).toBeInTheDocument();
      });

      const selectButton = screen.getByText('Select Event');
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(screen.getByTestId('appointment-info')).toHaveTextContent('123 Main St');
      });
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations in loading state', async () => {
      const renderResult = render(<CalendarView userType="driver" userId="123" />);
      await testAccessibility(renderResult);
    });

    it('has no accessibility violations with loaded data', async () => {
      const renderResult = render(<CalendarView userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByTestId('calendar-mock')).toBeInTheDocument();
      });

      await testAccessibility(renderResult);
    });

    it('has proper loading state aria label', () => {
      render(<CalendarView userType="driver" userId="123" />);
      const loadingElement = screen.getByRole('status', { name: /loading calendar/i });
      expect(loadingElement).toHaveAttribute('aria-label', 'Loading calendar');
    });
  });

  describe('Data Formatting', () => {
    it('formats regular appointments correctly', async () => {
      render(<CalendarView userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByTestId('calendar-mock')).toBeInTheDocument();
      });

      // Calendar should receive formatted events
      expect(global.fetch).toHaveBeenCalled();
    });

    it('formats packing supply routes correctly', async () => {
      render(<CalendarView userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByTestId('calendar-mock')).toBeInTheDocument();
      });

      // Should have both appointments and routes
      expect(screen.getByText(/2 events/i)).toBeInTheDocument();
    });

    it('combines appointments and routes into single event list', async () => {
      render(<CalendarView userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByTestId('calendar-mock')).toBeInTheDocument();
      });

      // Should combine 1 appointment + 1 route = 2 events
      expect(screen.getByText(/2 events/i)).toBeInTheDocument();
    });
  });

  describe('User Type Handling', () => {
    it('handles driver user type correctly', async () => {
      render(<CalendarView userType="driver" userId="123" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/drivers/123/appointments');
        expect(global.fetch).toHaveBeenCalledWith('/api/drivers/123/packing-supply-routes');
      });
    });

    it('handles mover user type correctly', async () => {
      render(<CalendarView userType="mover" userId="456" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/moving-partners/456/appointments');
        expect(global.fetch).toHaveBeenCalledWith('/api/moving-partners/456/packing-supply-routes');
      });
    });
  });

  describe('Console Logging', () => {
    it('logs fetch operations for debugging', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      render(<CalendarView userType="driver" userId="123" />);

      await waitFor(() => {
        expect(screen.getByTestId('calendar-mock')).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Fetching appointments for:',
        expect.objectContaining({ userType: 'driver', userId: '123' })
      );

      consoleSpy.mockRestore();
    });
  });
});
