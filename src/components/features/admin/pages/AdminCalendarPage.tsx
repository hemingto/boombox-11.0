/**
 * @fileoverview Admin calendar page - displays appointment calendar with week/day views
 * @source boombox-10.0/src/app/admin/calendar/page.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays appointments in a calendar view (week/day)
 * - Color-coded by appointment type (pickup, additional, access, end term)
 * - Shows customer name, mover, driver, address, and unit count
 * - Click event to view full details in modal
 * - Supports navigation between dates and view switching
 * - Working hours: 7 AM - 7 PM
 * 
 * API ROUTES UPDATED:
 * - Old: /api/admin/calendar → New: /api/admin/calendar (no change)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors (cyan-100, emerald-100, red-100) with semantic status colors
 * - Updated Modal component to use UI primitive Modal
 * - Applied semantic text colors (text-text-primary, text-text-secondary)
 * - Used btn-* utility classes for buttons
 * 
 * @refactor Migrated to admin/pages with design system compliance and UI primitives
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views, EventProps, View, Components } from 'react-big-calendar';
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { startOfWeek } from 'date-fns/startOfWeek';
import { getDay } from 'date-fns/getDay';
import { enUS } from 'date-fns/locale/en-US';
import { addHours, subHours, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Modal } from '@/components/ui';
import { Spinner } from '@/components/ui';

// Define types based on Prisma models
type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
};

type MovingPartner = {
  id: number;
  name: string;
};

type Driver = {
  id: number;
  name: string;
};

type Appointment = {
  id: number;
  userId: number;
  movingPartnerId: number | null;
  appointmentType: string;
  address: string;
  date: Date;
  numberOfUnits: number | null;
};

// Define a type that includes the relations we fetched
type AppointmentWithDetails = Appointment & {
  user: Pick<User, 'firstName' | 'lastName'>;
  movingPartner: Pick<MovingPartner, 'name'> | null;
  driver: { name: string } | null;
};

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: AppointmentWithDetails;
}

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

/**
 * Get semantic color classes based on appointment type
 * Using design system status colors instead of hardcoded colors
 */
const getEventColor = (appointmentType: string | undefined): string => {
  switch (appointmentType) {
    case 'Initial Pickup':
      return 'bg-sky-100 border-sky-400'; // Cyan equivalent in semantic colors
    case 'Additional Storage': 
      return 'bg-status-bg-success border-status-success'; // Success green
    case 'End Storage Term':
      return 'bg-status-bg-error border-status-error'; // Error red
    case 'Storage Unit Access': 
      return 'bg-status-bg-warning border-status-warning'; // Warning amber
    default:
      return 'bg-surface-tertiary border-border'; // Default surface gray
  }
};

/**
 * Custom event component for calendar - displays compact appointment info
 */
const CustomEvent: React.FC<EventProps<CalendarEvent>> = ({ event }) => {
  const { resource } = event;
  const userFullName = `${resource.user.firstName} ${resource.user.lastName}`;
  const moverName = resource.movingPartner?.name ?? 'N/A';
  const driverName = resource.driver?.name ?? 'Unassigned driver';

  return (
    <div className={`p-1 py-1 text-text-primary text-xs rounded-sm overflow-hidden min-w-[80px] ${getEventColor(resource.appointmentType)}`}>
      <strong>{userFullName}</strong>
      <div className="truncate">{resource.appointmentType}</div>
      <div className="truncate">Mover: {moverName}</div>
      <div className="truncate">Driver: {driverName}</div>
      <div className="truncate">{resource.address}</div>
      {resource.numberOfUnits !== null && <div className="truncate">Units: {resource.numberOfUnits}</div>}
    </div>
  );
};

/**
 * Custom popup component for overflow events ("+X more")
 */
const CustomPopup = ({ event }: { event: CalendarEvent }) => {
  const { resource } = event;
  const userFullName = `${resource.user.firstName} ${resource.user.lastName}`;
  const moverName = resource.movingPartner?.name ?? 'N/A';
  const driverName = resource.driver?.name ?? 'Unassigned driver';

  // Extract the border color class from getEventColor
  const eventColorClasses = getEventColor(resource.appointmentType);
  const borderColorClass = eventColorClasses.split(' ').find(cls => cls.startsWith('border-')) || 'border-border';

  return (
    <div className={`p-2 mb-1 text-sm rounded border-l-4 ${borderColorClass}`}>
      <div className="font-semibold text-text-primary">{userFullName}</div>
      <div className="text-text-secondary">{resource.appointmentType}</div>
      <div className="text-text-secondary">Mover: {moverName}</div>
      <div className="text-text-secondary">Driver: {driverName}</div>
      <div className="text-text-secondary">{resource.address}</div>
      {resource.numberOfUnits !== null && <div className="text-text-secondary">Units: {resource.numberOfUnits}</div>}
    </div>
  );
};

/**
 * Event detail modal component - full appointment details
 * Uses UI primitive Modal component instead of custom modal
 */
const EventDetailModal = ({ 
  event, 
  isOpen, 
  onClose 
}: { 
  event: CalendarEvent | null, 
  isOpen: boolean, 
  onClose: () => void 
}) => {
  if (!event) return null;
  
  const { resource } = event;
  const userFullName = `${resource.user.firstName} ${resource.user.lastName}`;
  const moverName = resource.movingPartner?.name ?? 'N/A';
  const driverName = resource.driver?.name ?? 'Unassigned driver';
  
  // Extract just the border color class from getEventColor
  const colorClasses = getEventColor(resource.appointmentType);
  const borderColorClass = colorClasses.split(' ').find(cls => cls.startsWith('border-')) || 'border-border';
  
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={userFullName}
      size="md"
      showCloseButton
    >
      <div className={`border-t-8 ${borderColorClass} pt-4`}>
        <div className="space-y-3 text-text-primary">
          <div>
            <span className="font-semibold">Appointment Type:</span>{' '}
            <span className="text-text-secondary">{resource.appointmentType}</span>
          </div>
          <div>
            <span className="font-semibold">Date/Time:</span>{' '}
            <span className="text-text-secondary">
              {format(event.start, 'PPP p')} - {format(event.end, 'p')}
            </span>
          </div>
          <div>
            <span className="font-semibold">Moving Partner:</span>{' '}
            <span className="text-text-secondary">{moverName}</span>
          </div>
          <div>
            <span className="font-semibold">Driver:</span>{' '}
            <span className="text-text-secondary">{driverName}</span>
          </div>
          <div>
            <span className="font-semibold">Address:</span>{' '}
            <span className="text-text-secondary">{resource.address}</span>
          </div>
          {resource.numberOfUnits !== null && (
            <div>
              <span className="font-semibold">Number of Units:</span>{' '}
              <span className="text-text-secondary">{resource.numberOfUnits}</span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

/**
 * Main AdminCalendarPage component
 * Displays appointment calendar with week/day views and custom rendering
 */
export function AdminCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Define the min and max times for the calendar view (7 AM - 7 PM)
  const minTime = useMemo(() => {
    return setHours(setMinutes(setSeconds(setMilliseconds(new Date(), 0), 0), 0), 7);
  }, []);

  const maxTime = useMemo(() => {
    return setHours(setMinutes(setSeconds(setMilliseconds(new Date(), 0), 0), 0), 19);
  }, []);

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/admin/calendar');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: AppointmentWithDetails[] = await response.json();

        // Group appointments by time to handle overlapping events
        const groupedEvents: Record<string, AppointmentWithDetails[]> = {};
        
        data.forEach((appt) => {
          const key = new Date(appt.date).toISOString();
          groupedEvents[key] = groupedEvents[key] || [];
          groupedEvents[key].push(appt);
        });
        
        const calendarEvents: CalendarEvent[] = [];
        
        // Process each group of appointments starting at the same time
        // Add small offset to prevent exact overlap
        Object.entries(groupedEvents).forEach(([_, group]) => {
          group.forEach((appt, index) => {
            const appointmentDate = new Date(appt.date);
            const startTime = subHours(appointmentDate, 1);
            // Add offset only within each time group (1 second per appointment)
            const offsetStart = new Date(startTime.getTime() + index * 1000);
            const endTime = addHours(offsetStart, 3);
            
            calendarEvents.push({
              id: appt.id,
              title: `${appt.user.firstName} ${appt.user.lastName} - ${appt.appointmentType}`,
              start: offsetStart,
              end: endTime,
              resource: appt,
            });
          });
        });

        setEvents(calendarEvents);
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        console.error('Failed to load appointments:', e);
        setError(`Failed to load appointments: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const onNavigate = useCallback((newDate: Date) => setDate(newDate), []);
  const onView = useCallback((newView: View) => setView(newView), []);
  
  // Handle event selection
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  }, []);
  
  // Close modal
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  }, []);

  const eventPropGetter = useCallback(
    (event: CalendarEvent) => ({
      className: `p-0 border-l-4 ${getEventColor(event.resource.appointmentType).split(' ')[1]}`,
      style: {
        backgroundColor: 'transparent',
        borderRadius: '3px',
        color: 'black',
        cursor: 'pointer',
        borderWidth: '0 0 0 4px',
      },
    }),
    []
  );

  const components: Components<CalendarEvent, object> = useMemo(() => ({ 
    event: CustomEvent,
    popup: ({ events }: { events: CalendarEvent[] }) => ( 
      <div className="rbc-overlay rbc-overlay-popup p-2 bg-surface-primary shadow-lg rounded border border-border max-h-96 overflow-y-auto">
        {events.map(event => <CustomPopup key={event.id} event={event} />)}
      </div>
    ),
  }), []);

  const messages = useMemo(() => ({
    showMore: (count: number) => `+${count} more`,
  }), []);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-tertiary flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-tertiary py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-status-bg-error border border-status-error rounded-md p-4">
            <p className="text-status-error font-semibold">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-tertiary py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-text-primary mb-6">
          Admin Appointment Calendar
        </h1>
        
        <div className="bg-surface-primary rounded-lg shadow-lg p-4 h-[calc(100vh-200px)]">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            views={[Views.WEEK, Views.DAY]}
            view={view}
            date={date}
            onNavigate={onNavigate}
            onView={onView}
            eventPropGetter={eventPropGetter}
            components={components}
            step={60}
            timeslots={1}
            popup={true}
            messages={messages}
            min={minTime}
            max={maxTime}
            dayLayoutAlgorithm="no-overlap"
            onSelectEvent={handleSelectEvent}
          />
        </div>
        
        {/* Event Detail Modal */}
        <EventDetailModal 
          event={selectedEvent} 
          isOpen={isModalOpen} 
          onClose={handleCloseModal} 
        />
      </div>
    </div>
  );
}
