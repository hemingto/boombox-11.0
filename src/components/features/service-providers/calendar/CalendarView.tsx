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
 * - Integrates with FullCalendar for calendar UI
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
 * @refactor Migrated from react-big-calendar to FullCalendar, applied design system colors, improved accessibility
 */

'use client'

import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg, DayHeaderContentArg } from '@fullcalendar/core';
import { format, isSameDay } from 'date-fns';
import { AppointmentDetailsPopup } from '../shared/AppointmentDetailsPopup';

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

interface Appointment {
  id: number;
  title: string;
  start: Date;
  end: Date;
  address: string;
  appointmentType: string;
  status: string;
  movingPartnerId?: number | null;
  driverId?: number;
  details?: AppointmentDetails;
  user?: {
    firstName: string;
    lastName: string;
  } | null;
  color?: string;
}

interface CalendarViewProps {
  userType: "driver" | "mover";
  userId: string;
  /** Whether to show a warning banner when there are no upcoming jobs (default: false) */
  showEmptyWarning?: boolean;
  /** Custom message for the empty warning banner */
  emptyWarningMessage?: string;
}

/**
 * Get event color based on appointment type and status
 */
const getEventColor = (appointmentType: string, status: string, routeId?: string): string => {
  // Check if this is a packing supply route
  const isPackingSupplyRoute = appointmentType === 'Packing Supply Delivery' && routeId;

  if (isPackingSupplyRoute) {
    // Different colors for packing supply routes
    if (status === 'completed') {
      return '#059669'; // emerald-600 for completed routes
    } else if (status === 'in_progress') {
      return '#7c3aed'; // violet-600 for active routes
    } else {
      return '#ea580c'; // orange-600 for pending routes
    }
  } else {
    // Regular appointment colors
    if (status === 'Completed') {
      return '#10b981'; // emerald-500 (status-success)
    } else if (status === 'Canceled') {
      return '#ef4444'; // red-500 (status-error)
    }
  }
  
  return '#06b6d4'; // cyan-500 for default
};

export const CalendarView: React.FC<CalendarViewProps> = ({ 
  userType, 
  userId,
  showEmptyWarning = false,
  emptyWarningMessage = "You currently have no upcoming jobs scheduled. Once a job has been accepted it will show on your calendar here."
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);

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
        const formattedAppointments: Appointment[] = appointmentsData.map((appointment: any) => {
          const appointmentDate = new Date(appointment.date);
          const startDate = new Date(appointmentDate);
          startDate.setMinutes(startDate.getMinutes() - 60);
          const endDate = new Date(startDate);
          endDate.setHours(endDate.getHours() + 3);
          
          const formattedAppointment: Appointment = {
            id: appointment.id,
            title: `${appointment.appointmentType} - ${appointment.address}`,
            start: startDate,
            end: endDate,
            address: appointment.address,
            appointmentType: appointment.appointmentType,
            status: appointment.status,
            movingPartnerId: appointment.movingPartnerId,
            driverId: appointment.driverId,
            color: getEventColor(appointment.appointmentType, appointment.status),
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
        const formattedRoutes: Appointment[] = packingSupplyRoutes.map((route: any) => {
          const routeDate = new Date(route.date);
          const startDate = new Date(routeDate);
          // Set start time to 12:00 PM for packing supply deliveries
          startDate.setHours(12, 0, 0, 0);
          const endDate = new Date(startDate);
          // Set end time based on estimated duration or default to 5 hours
          const durationHours = 5;
          endDate.setHours(endDate.getHours() + durationHours);
          
          const formattedRoute: Appointment = {
            id: route.id,
            title: `${route.appointmentType} - Route ${route.routeId}`,
            start: startDate,
            end: endDate,
            address: route.address,
            appointmentType: route.appointmentType,
            status: route.routeStatus || 'in_progress',
            movingPartnerId: null,
            driverId: route.driver?.id,
            color: getEventColor(route.appointmentType, route.routeStatus || 'in_progress', route.routeId),
            user: null, // Routes don't have a single user
            details: {
              id: route.id,
              address: route.address,
              date: routeDate,
              time: routeDate,
              numberOfUnits: route.numberOfUnits || route.totalStops || 0,
              planType: route.planType || 'Packing Supply Route',
              appointmentType: route.appointmentType,
              insuranceCoverage: undefined,
              description: route.description || `Route with ${route.totalStops} delivery stops`,
              additionalInformation: {
                itemsOver100lbs: false,
                moveDescription: '',
                conditionsDescription: ''
              },
              requestedStorageUnits: [],
              user: undefined,
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

  const handleEventClick = (clickInfo: EventClickArg) => {
    const eventId = parseInt(clickInfo.event.id, 10);
    const appointment = appointments.find(apt => apt.id === eventId);
    
    if (appointment) {
      console.log('Selected appointment details:', {
        id: appointment.id,
        details: appointment.details,
        additionalInfo: appointment.details?.additionalInformation,
        user: appointment.user
      });
      setSelectedAppointment(appointment);
      setIsPopupOpen(true);
    }
  };

  // Custom day header renderer
  const renderDayHeaderContent = (args: DayHeaderContentArg) => {
    const isToday = isSameDay(args.date, new Date());
    return (
      <div className="flex flex-col items-center justify-center py-2 w-full h-full">
        <span className="text-sm font-medium mb-1 text-text-secondary">
          {format(args.date, 'EEE').toUpperCase()}
        </span>
        <span className={`w-12 h-12 flex items-center justify-center rounded-full text-lg flex-shrink-0 ${
          isToday ? 'bg-primary text-text-inverse' : 'text-text-primary'
        }`}>
          {format(args.date, 'd')}
        </span>
      </div>
    );
  };

  // Convert appointments to FullCalendar event format
  const calendarEvents = appointments.map(apt => ({
    id: String(apt.id),
    title: apt.title,
    start: apt.start,
    end: apt.end,
    backgroundColor: apt.color,
    borderColor: apt.color,
    textColor: 'white',
    extendedProps: {
      address: apt.address,
      appointmentType: apt.appointmentType,
      status: apt.status,
      details: apt.details,
      user: apt.user,
    }
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[800px] text-text-secondary" role="status" aria-label="Loading calendar">
        <span>Loading calendar...</span>
      </div>
    );
  }

  return (
    <>
      {/* Empty Jobs Warning Banner - Outside calendar container */}
      {showEmptyWarning && appointments.length === 0 && !loading && (
        <div 
          className="bg-status-bg-warning border border-border-warning rounded-md p-4 mb-6"
          role="alert"
          aria-live="polite"
        >
          <p className="text-status-warning text-sm">
            {emptyWarningMessage}
          </p>
        </div>
      )}
      <div className="h-[800px] p-4 sm:p-6 border-2 border-slate-100 bg-white rounded-md">
        <style jsx global>{`
          /* FullCalendar CSS Variables */
          :root {
            --fc-border-color: var(--color-border, #e2e8f0);
            --fc-button-bg-color: transparent;
            --fc-button-border-color: transparent;
            --fc-button-text-color: #18181b;
            --fc-button-hover-bg-color: #f1f5f9;
            --fc-button-active-bg-color: #e2e8f0;
            --fc-today-bg-color: #f8fafc;
            --fc-page-bg-color: var(--color-surface-primary, white);
            --fc-neutral-bg-color: var(--color-surface-primary, white);
            --fc-event-border-color: transparent;
          }
          
          .fc {
            color: var(--color-text-primary);
            height: 100%;
          }
          
          /* Toolbar styling */
          .fc .fc-toolbar {
            margin-bottom: 20px !important;
            flex-wrap: wrap;
            gap: 10px;
          }
          
          .fc .fc-toolbar-title {
            font-size: 1.5rem !important;
            font-weight: 500;
          }
          
          @media (max-width: 640px) {
            .fc .fc-toolbar-title {
              margin: 10px 0 !important;
              width: 100%;
              text-align: center;
            }
            .fc .fc-toolbar {
              flex-direction: column;
            }
          }
          
          /* Button group styling */
          .fc .fc-button-group {
            background-color: var(--color-surface-primary, white);
            border: 1px solid #e2e8f0 !important;
            border-radius: 0.5rem;
            overflow: hidden;
            padding: 4px;
            gap: 2px;
          }
          
          .fc .fc-button {
            color: #18181b !important;
            font-size: 0.875rem !important;
            font-weight: 600 !important;
            border: none !important;
            padding: 8px 12px !important;
            background-color: transparent !important;
            box-shadow: none !important;
            border-radius: 0.375rem !important;
            transition: background-color 150ms ease, color 150ms ease;
            text-transform: capitalize;
          }
          
          .fc .fc-button:hover {
            background-color: #f1f5f9 !important;
          }
          
          .fc .fc-button:active {
            background-color: #e2e8f0 !important;
          }
          
          .fc .fc-button:focus {
            box-shadow: none !important;
          }
          
          .fc .fc-button:focus-visible {
            outline: 2px solid #18181b;
            outline-offset: 2px;
          }
          
          .fc .fc-button-active {
            background-color: #e2e8f0 !important;
            color: #18181b !important;
          }
          
          .fc .fc-button-active:hover {
            background-color: #cbd5e1 !important;
          }
          
          /* Header styling */
          .fc .fc-col-header-cell {
            padding: 0 !important;
            border: none !important;
            font-weight: normal !important;
          }
          
          .fc .fc-col-header {
            border: none !important;
          }
          
          /* Time grid styling */
          .fc-theme-standard .fc-scrollgrid {
            border: 1px solid var(--color-border, #e2e8f0) !important;
            border-radius: 0.5rem !important;
            overflow: hidden;
          }
          
          .fc .fc-timegrid-slot {
            height: 3em;
          }
          
          .fc .fc-timegrid-slot-label {
            color: var(--color-text-tertiary);
          }
          
          .fc .fc-timegrid-axis {
            background-color: var(--color-surface-primary, white) !important;
          }
          
          .fc .fc-timegrid-col.fc-day-today {
            background-color: #f8fafc !important;
          }
          
          /* Event styling */
          .fc-event {
            border: none !important;
            border-radius: 6px !important;
            opacity: 0.95;
            cursor: pointer;
          }
          
          .fc-event-main {
            padding: 2px 4px;
          }
          
          /* Current time indicator */
          .fc .fc-timegrid-now-indicator-line {
            border-color: #0891b2 !important;
            border-width: 2px;
          }
          
          .fc .fc-timegrid-now-indicator-arrow {
            border-color: #0891b2 !important;
            border-top-color: transparent !important;
            border-bottom-color: transparent !important;
          }
          
          /* Day grid / Month view */
          .fc .fc-daygrid-day.fc-day-today {
            background-color: #f8fafc !important;
          }
          
          .fc .fc-daygrid-day-frame {
            min-height: 100px;
          }
          
          /* List view styling */
          .fc .fc-list {
            border-radius: 0.5rem !important;
            overflow: hidden;
          }
          
          .fc .fc-list-event:hover td {
            background-color: #f8fafc;
          }
          
          /* Remove extra borders */
          .fc-theme-standard td, .fc-theme-standard th {
            border-color: var(--color-border, #e2e8f0);
          }
          
          .fc .fc-scrollgrid-section > * {
            border-color: var(--color-border, #e2e8f0);
          }
        `}</style>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
          }}
          buttonText={{
            today: 'Today',
            month: 'Month',
            week: 'Week',
            day: 'Day',
            list: 'Agenda'
          }}
          events={calendarEvents}
          eventClick={handleEventClick}
          slotMinTime="07:00:00"
          slotMaxTime="20:00:00"
          slotLabelFormat={{
            hour: 'numeric',
            minute: '2-digit',
            omitZeroMinute: true,
            meridiem: 'short'
          }}
          dayHeaderContent={renderDayHeaderContent}
          height="100%"
          nowIndicator={true}
          allDaySlot={false}
          slotDuration="01:00:00"
          expandRows={true}
          stickyHeaderDates={true}
          dayMaxEvents={true}
          eventDisplay="block"
        />
        <AppointmentDetailsPopup
          isOpen={isPopupOpen}
          onClose={() => setIsPopupOpen(false)}
          appointment={selectedAppointment?.details || null}
          userType={userType}
        />
      </div>
    </>
  );
};

export default CalendarView;
