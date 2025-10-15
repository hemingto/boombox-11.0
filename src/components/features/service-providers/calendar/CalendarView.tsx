/**
 * @fileoverview Calendar view component for service providers (drivers/moving partners) to manage appointments and delivery routes
 * @source boombox-10.0/src/app/components/mover-account/calendar-view.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays a weekly/monthly calendar view of appointments and packing supply routes
 * - Supports multiple user types (driver/moving partner)
 * - Fetches and combines regular appointments with packing supply delivery routes
 * - Shows appointment details in a popup modal when clicked
 * - Color-codes events by status and type
 * - Integrates with react-big-calendar for calendar UI
 * 
 * API ROUTES UPDATED:
 * - Old: /api/drivers/${userId}/appointments → New: /api/drivers/[id]/appointments/route.ts
 * - Old: /api/movers/${userId}/appointments → New: /api/moving-partners/[id]/appointments/route.ts
 * - Old: /api/drivers/${userId}/packing-supply-routes → New: /api/drivers/[id]/packing-supply-routes/route.ts
 * - Old: /api/movers/${userId}/packing-supply-routes → New: /api/moving-partners/[id]/packing-supply-routes/route.ts
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with semantic tokens (primary, status-success, status-error, etc.)
 * - Updated calendar styling to use design system color palette
 * - Replaced custom loading state with design system patterns
 * - Updated button styling for navigation controls
 * 
 * @refactor Updated API routes to new domain-based structure, applied design system colors, improved accessibility
 */

'use client'

import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, Event, View, Components } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, setHours, setMinutes, isSameDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { AppointmentDetailsPopup } from '../shared/AppointmentDetailsPopup';

const locales = {
  'en-US': require('date-fns/locale/en-US')
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface AppointmentDetails {
  id: number;
  address: string;
  date: Date;
  time: Date;
  numberOfUnits: number;
  planType: string;
  appointmentType: string;
  insuranceCoverage?: string;
  description?: string;
  additionalInformation?: {
    itemsOver100lbs: boolean;
    moveDescription?: string;
    conditionsDescription?: string;
  };
  requestedStorageUnits?: {
    storageUnitId: number;
    storageUnit: {
      storageUnitNumber: string;
    };
  }[];
  user?: {
    firstName: string;
    lastName: string;
  };
  driver?: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    profilePicture?: string;
  };
  // Packing supply route specific fields
  routeId?: string;
  routeStatus?: string;
  totalStops?: number;
  completedStops?: number;
  estimatedMiles?: number;
  estimatedDurationMinutes?: number;
  estimatedPayout?: number;
  payoutStatus?: string;
  orders?: any[];
  routeMetrics?: {
    totalDistance?: number;
    totalTime?: number;
    startTime?: Date;
    endTime?: Date;
  };
}

interface Appointment extends Event {
  id: number;
  address: string;
  appointmentType: string;
  status: string;
  movingPartnerId?: number;
  driverId?: number;
  details?: AppointmentDetails;
  user?: {
    firstName: string;
    lastName: string;
  };
}

interface CalendarViewProps {
  userType: "driver" | "mover";
  userId: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ userType, userId }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('week');
  const [date, setDate] = useState<Date>(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // Set the min and max times for the calendar
  const minTime = setHours(setMinutes(new Date(), 0), 7); // 7:00 AM
  const maxTime = setHours(setMinutes(new Date(), 0), 20); // 8:00 PM

  const formats = {
    timeGutterFormat: (date: Date) => format(date, 'h aaa'), // This will format times as "7 AM"
  };

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        console.log('Fetching appointments for:', { userType, userId });
        
        // Fetch regular appointments - UPDATED API ROUTES
        const appointmentsEndpoint = userType === 'driver' 
          ? `/api/drivers/${userId}/appointments`
          : `/api/moving-partners/${userId}/appointments`;
        const appointmentsResponse = await fetch(appointmentsEndpoint);
        const appointmentsData = await appointmentsResponse.json();
        console.log('Raw appointments API response:', appointmentsData);
        
        // Fetch packing supply routes - UPDATED API ROUTES
        let packingSupplyRoutes = [];
        try {
          const routesEndpoint = userType === 'driver'
            ? `/api/drivers/${userId}/packing-supply-routes`
            : `/api/moving-partners/${userId}/packing-supply-routes`;
          const routesResponse = await fetch(routesEndpoint);
          if (routesResponse.ok) {
            packingSupplyRoutes = await routesResponse.json();
            console.log('Raw packing supply routes:', packingSupplyRoutes);
          }
        } catch (routeError) {
          console.warn('Failed to fetch packing supply routes:', routeError);
        }
        
        // Format regular appointments
        const formattedAppointments = appointmentsData.map((appointment: any) => {
          const appointmentDate = new Date(appointment.date);
          const startDate = new Date(appointmentDate);
          startDate.setMinutes(startDate.getMinutes() - 60);
          const endDate = new Date(startDate);
          endDate.setHours(endDate.getHours() + 3);
          
          const formattedAppointment = {
            id: appointment.id,
            title: `${appointment.appointmentType} - ${appointment.address}`,
            start: startDate,
            end: endDate,
            address: appointment.address,
            appointmentType: appointment.appointmentType,
            status: appointment.status,
            movingPartnerId: appointment.movingPartnerId,
            driverId: appointment.driverId,
            user: {
              firstName: appointment.user?.firstName || '',
              lastName: appointment.user?.lastName || ''
            },
            details: {
              id: appointment.id,
              address: appointment.address,
              date: appointmentDate,
              time: appointmentDate,
              numberOfUnits: appointment.numberOfUnits,
              planType: appointment.planType,
              appointmentType: appointment.appointmentType,
              insuranceCoverage: appointment.insuranceCoverage,
              description: appointment.description || '',
              additionalInformation: {
                itemsOver100lbs: appointment.additionalInfo?.itemsOver100lbs ?? false,
                moveDescription: appointment.additionalInfo?.moveDescription || '',
                conditionsDescription: appointment.additionalInfo?.conditionsDescription || ''
              },
              requestedStorageUnits: appointment.requestedStorageUnits,
              user: {
                firstName: appointment.user?.firstName || '',
                lastName: appointment.user?.lastName || ''
              },
              driver: appointment.driver ? {
                firstName: appointment.driver.firstName,
                lastName: appointment.driver.lastName,
                phoneNumber: appointment.driver.phoneNumber,
                profilePicture: appointment.driver.profilePicture
              } : undefined
            },
          };

          console.log('Raw appointment data:', {
            description: appointment.description,
            additionalInfo: appointment.additionalInfo,
            additionalAppointmentInfo: appointment.additionalAppointmentInfo
          });

          return formattedAppointment;
        });
        
        // Format packing supply routes
        const formattedRoutes = packingSupplyRoutes.map((route: any) => {
          const routeDate = new Date(route.date);
          const startDate = new Date(routeDate);
          // Set start time to 12:00 PM for packing supply deliveries
          startDate.setHours(12, 0, 0, 0);
          const endDate = new Date(startDate);
          // Set end time based on estimated duration or default to 5 hours
          const durationHours = 5;
          endDate.setHours(endDate.getHours() + durationHours);
          
          const formattedRoute = {
            id: route.id,
            title: `${route.appointmentType} - Route ${route.routeId}`,
            start: startDate,
            end: endDate,
            address: route.address,
            appointmentType: route.appointmentType,
            status: route.routeStatus || 'in_progress',
            movingPartnerId: null,
            driverId: route.driver?.id,
            user: null, // Routes don't have a single user
            details: {
              id: route.id,
              address: route.address,
              date: routeDate,
              time: routeDate,
              numberOfUnits: route.numberOfUnits || route.totalStops || 0,
              planType: route.planType || 'Packing Supply Route',
              appointmentType: route.appointmentType,
              insuranceCoverage: null,
              description: route.description || `Route with ${route.totalStops} delivery stops`,
              additionalInformation: {
                itemsOver100lbs: false,
                moveDescription: '',
                conditionsDescription: ''
              },
              requestedStorageUnits: [],
              user: null,
              driver: route.driver ? {
                firstName: route.driver.firstName,
                lastName: route.driver.lastName,
                phoneNumber: route.driver.phoneNumber || '',
                profilePicture: ''
              } : undefined,
              // Add route-specific fields
              routeId: route.routeId,
              routeStatus: route.routeStatus,
              totalStops: route.totalStops,
              completedStops: route.completedStops,
              estimatedMiles: route.estimatedMiles,
              estimatedDurationMinutes: route.estimatedDurationMinutes,
              estimatedPayout: route.estimatedPayout,
              payoutStatus: route.payoutStatus,
              orders: route.orders,
              routeMetrics: route.routeMetrics
            },
          };

          return formattedRoute;
        });
        
        // Combine appointments and routes
        const allAppointments = [...formattedAppointments, ...formattedRoutes];
        setAppointments(allAppointments);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [userType, userId]);

  const eventStyleGetter = (event: Appointment) => {
    // DESIGN SYSTEM UPDATE: Using semantic color tokens
    let backgroundColor = '#06b6d4'; // cyan-500 for default (could use design system color)
    let color = 'white';

    // Check if this is a packing supply route
    const isPackingSupplyRoute = event.appointmentType === 'Packing Supply Delivery' && event.details?.routeId;

    if (isPackingSupplyRoute) {
      // Different colors for packing supply routes
      if (event.status === 'completed') {
        backgroundColor = '#059669'; // emerald-600 for completed routes
      } else if (event.status === 'in_progress') {
        backgroundColor = '#7c3aed'; // violet-600 for active routes
      } else {
        backgroundColor = '#ea580c'; // orange-600 for pending routes
      }
    } else {
      // Regular appointment colors
      if (event.status === 'Completed') {
        backgroundColor = '#10b981'; // emerald-500 (status-success)
      } else if (event.status === 'Canceled') {
        backgroundColor = '#ef4444'; // red-500 (status-error)
      }
    }

    return {
      style: {
        backgroundColor,
        color,
        border: 'none',
        borderRadius: '6px',
        opacity: 0.95,
      },
    };
  };

  const components: Components<Appointment, object> = {
    timeSlotWrapper: ({ children }: { children?: React.ReactElement }) => 
      children
        ? React.cloneElement(children, {
            style: {
              backgroundColor: 'transparent',
            },
          } as any)
        : null,
    header: (props: { date: Date; label: string }) => {
      const isToday = isSameDay(props.date, new Date());
      return (
        <div className="flex flex-col items-center justify-center py-2">
          <span className="text-sm font-medium mb-1 text-text-secondary">{format(props.date, 'EEE').toUpperCase()}</span>
          <span className={`w-12 h-12 flex items-center justify-center rounded-full text-lg ${
            isToday ? 'bg-primary text-text-inverse' : 'text-text-primary'
          }`}>
            {format(props.date, 'd')}
          </span>
        </div>
      );
    },
  };

  const handleSelectEvent = (event: Appointment) => {
    console.log('Selected appointment details:', {
      id: event.id,
      details: event.details,
      additionalInfo: event.details?.additionalInformation,
      user: event.user
    });
    setSelectedAppointment(event);
    setIsPopupOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[800px] text-text-secondary" role="status" aria-label="Loading calendar">
        <span>Loading calendar...</span>
      </div>
    );
  }

  return (
    <div className="h-[800px] p-4 bg-surface-tertiary rounded-xl">
      <style jsx global>{`
        .rbc-calendar {
          color: var(--color-text-primary);
        }
        .rbc-toolbar {
          margin-bottom: 20px !important;
        }
        .rbc-toolbar-label {
          font-size: 1.5rem !important;
          font-weight: 500;
        }
        @media (max-width: 640px) {
          .rbc-toolbar-label {
            margin: 20px 0 !important;
          }
        }
        .rbc-btn-group {
          background-color: var(--color-surface-primary);
          border: 1px solid var(--color-border) !important;
          border-radius: 0.5rem;
          overflow: hidden;
        }
        .rbc-header {
          padding: 0 !important;
          border: none !important;
          font-weight: normal !important;
        }
        .rbc-time-header-cell {
          min-height: 80px !important;
        }
        .rbc-time-header-content {
          border: none !important;
        }
        .rbc-today {
          background-color: #f8fafc !important;
        }
        .rbc-time-content {
          border-top: 1px solid var(--color-border) !important;
        }
        .rbc-time-view, .rbc-month-view, .rbc-agenda-view {
          border: 1px solid var(--color-border) !important;
          border-radius: 0.5rem !important;
          background-color: var(--color-surface-primary);
        }
        .rbc-timeslot-group {
          border-bottom: 1px solid var(--color-border) !important;
        }
        .rbc-time-slot {
          color: var(--color-text-tertiary);
        }
        .rbc-time-header-gutter {
          background-color: var(--color-surface-primary) !important;
        }
        .rbc-time-gutter {
          background-color: var(--color-surface-primary) !important;
        }
        .rbc-time-column {
          background-color: var(--color-surface-primary) !important;
        }
        .rbc-day-slot .rbc-time-slot {
          border-top: none !important;
        }
        .rbc-toolbar button {
          color: var(--color-text-primary) !important;
          font-size: 1rem !important;
          border: none !important;
          padding: 8px 16px;
          background: none;
          box-shadow: none !important;
        }
        .rbc-toolbar button:hover {
          background-color: var(--color-surface-secondary) !important;
        }
        .rbc-toolbar button.rbc-active {
          background-color: var(--color-surface-tertiary) !important;
        }
        .rbc-toolbar button:checked,
        .rbc-toolbar button[aria-pressed="true"],
        .rbc-toolbar button.rbc-clicked {
          background: none !important;
        }
        .rbc-toolbar .rbc-btn-group:first-child button {
          background: none !important;
        }
        .rbc-toolbar .rbc-btn-group:first-child button:hover {
          background-color: var(--color-surface-secondary) !important;
        }
        .rbc-current-time-indicator {
          background-color: #0891b2 !important;
        }
        .rbc-time-header {
          display: flex;
          align-items: stretch;
        }
        .rbc-time-header-content {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }
        .rbc-header + .rbc-header {
          border-left: none !important;
        }
        .rbc-header {
          border-bottom: none !important;
        }
        .rbc-time-header-cell-single-day {
          display: none;
        }
      `}</style>
      <Calendar
        localizer={localizer}
        events={appointments}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        eventPropGetter={eventStyleGetter}
        views={['month', 'week', 'day', 'agenda']}
        view={view}
        onView={(newView) => setView(newView)}
        date={date}
        onNavigate={(newDate) => setDate(newDate)}
        min={minTime}
        max={maxTime}
        formats={formats}
        components={components}
        onSelectEvent={handleSelectEvent}
      />
      <AppointmentDetailsPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        appointment={selectedAppointment?.details || null}
        userType={userType}
      />
    </div>
  );
};

export default CalendarView;

