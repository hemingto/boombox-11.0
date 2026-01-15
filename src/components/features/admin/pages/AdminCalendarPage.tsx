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
 * @refactor Migrated from react-big-calendar to FullCalendar, design system compliance and UI primitives
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg, EventContentArg } from '@fullcalendar/core';
import { format, addHours, subHours } from 'date-fns';
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

/**
 * Get semantic color classes based on appointment type
 * Using design system status colors instead of hardcoded colors
 */
const getEventColorClasses = (appointmentType: string | undefined): { bg: string; border: string } => {
  switch (appointmentType) {
    case 'Initial Pickup':
      return { bg: 'bg-sky-100', border: 'border-sky-400' };
    case 'Additional Storage': 
      return { bg: 'bg-status-bg-success', border: 'border-status-success' };
    case 'End Storage Term':
      return { bg: 'bg-status-bg-error', border: 'border-status-error' };
    case 'Storage Unit Access': 
      return { bg: 'bg-status-bg-warning', border: 'border-border-warning' };
    default:
      return { bg: 'bg-surface-tertiary', border: 'border-border' };
  }
};

/**
 * Get CSS color values for FullCalendar events
 */
const getEventColors = (appointmentType: string | undefined): { backgroundColor: string; borderColor: string } => {
  switch (appointmentType) {
    case 'Initial Pickup':
      return { backgroundColor: '#e0f2fe', borderColor: '#38bdf8' }; // sky-100, sky-400
    case 'Additional Storage': 
      return { backgroundColor: '#dcfce7', borderColor: '#22c55e' }; // green-100, green-500
    case 'End Storage Term':
      return { backgroundColor: '#fee2e2', borderColor: '#ef4444' }; // red-100, red-500
    case 'Storage Unit Access': 
      return { backgroundColor: '#fef3c7', borderColor: '#f59e0b' }; // amber-100, amber-500
    default:
      return { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' }; // slate-100, slate-300
  }
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
  
  // Get the border color class
  const colorClasses = getEventColorClasses(resource.appointmentType);
  
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={userFullName}
      size="md"
      showCloseButton
    >
      <div className={`border-t-8 ${colorClasses.border} pt-4`}>
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
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);

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
  
  // Handle event selection
  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    const eventId = parseInt(clickInfo.event.id, 10);
    const event = events.find(e => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      setIsModalOpen(true);
    }
  }, [events]);
  
  // Close modal
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  }, []);

  // Custom event content renderer
  const renderEventContent = useCallback((eventInfo: EventContentArg) => {
    const eventId = parseInt(eventInfo.event.id, 10);
    const event = events.find(e => e.id === eventId);
    
    if (!event) return null;
    
    const { resource } = event;
    const userFullName = `${resource.user.firstName} ${resource.user.lastName}`;
    const moverName = resource.movingPartner?.name ?? 'N/A';
    const driverName = resource.driver?.name ?? 'Unassigned driver';
    const colorClasses = getEventColorClasses(resource.appointmentType);

    return (
      <div className={`p-1 py-1 text-text-primary text-xs rounded-sm overflow-hidden min-w-[80px] h-full ${colorClasses.bg} border-l-4 ${colorClasses.border}`}>
        <strong>{userFullName}</strong>
        <div className="truncate">{resource.appointmentType}</div>
        <div className="truncate">Mover: {moverName}</div>
        <div className="truncate">Driver: {driverName}</div>
        <div className="truncate">{resource.address}</div>
        {resource.numberOfUnits !== null && <div className="truncate">Units: {resource.numberOfUnits}</div>}
      </div>
    );
  }, [events]);

  // Convert events to FullCalendar format
  const fullCalendarEvents = events.map(event => {
    const colors = getEventColors(event.resource.appointmentType);
    return {
      id: String(event.id),
      title: event.title,
      start: event.start,
      end: event.end,
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      textColor: '#1f2937',
      extendedProps: {
        resource: event.resource,
      }
    };
  });

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
          <style jsx global>{`
            /* FullCalendar Admin Calendar Styles */
            .admin-calendar {
              height: 100%;
            }
            
            .admin-calendar .fc {
              height: 100%;
            }
            
            /* Toolbar styling */
            .admin-calendar .fc .fc-toolbar {
              margin-bottom: 16px;
              flex-wrap: wrap;
              gap: 8px;
            }
            
            .admin-calendar .fc .fc-toolbar-title {
              font-size: 1.25rem;
              font-weight: 600;
              color: var(--color-text-primary, #1f2937);
            }
            
            /* Button styling */
            .admin-calendar .fc .fc-button-group {
              background-color: white;
              border: 1px solid #e2e8f0;
              border-radius: 0.5rem;
              overflow: hidden;
              padding: 4px;
            }
            
            .admin-calendar .fc .fc-button {
              color: #18181b !important;
              font-size: 0.875rem !important;
              font-weight: 600 !important;
              border: none !important;
              padding: 6px 12px !important;
              background-color: transparent !important;
              box-shadow: none !important;
              border-radius: 0.375rem !important;
              text-transform: capitalize;
            }
            
            .admin-calendar .fc .fc-button:hover {
              background-color: #f1f5f9 !important;
            }
            
            .admin-calendar .fc .fc-button-active {
              background-color: #e2e8f0 !important;
            }
            
            .admin-calendar .fc .fc-button:focus {
              box-shadow: none !important;
            }
            
            /* Grid styling */
            .admin-calendar .fc-theme-standard .fc-scrollgrid {
              border: 1px solid var(--color-border, #e2e8f0);
              border-radius: 0.5rem;
              overflow: hidden;
            }
            
            .admin-calendar .fc-theme-standard td,
            .admin-calendar .fc-theme-standard th {
              border-color: var(--color-border, #e2e8f0);
            }
            
            /* Time slot styling */
            .admin-calendar .fc .fc-timegrid-slot {
              height: 4em;
            }
            
            .admin-calendar .fc .fc-timegrid-slot-label {
              color: var(--color-text-tertiary, #6b7280);
              font-size: 0.75rem;
            }
            
            /* Today highlighting */
            .admin-calendar .fc .fc-timegrid-col.fc-day-today,
            .admin-calendar .fc .fc-daygrid-day.fc-day-today {
              background-color: #f8fafc;
            }
            
            /* Event styling - make background transparent for custom content */
            .admin-calendar .fc-event {
              background-color: transparent !important;
              border: none !important;
              cursor: pointer;
            }
            
            .admin-calendar .fc-event-main {
              padding: 0;
            }
            
            /* Now indicator */
            .admin-calendar .fc .fc-timegrid-now-indicator-line {
              border-color: #0891b2;
              border-width: 2px;
            }
            
            /* More link styling */
            .admin-calendar .fc .fc-more-link {
              color: var(--color-text-secondary, #6b7280);
              font-weight: 500;
            }
            
            .admin-calendar .fc .fc-more-link:hover {
              color: var(--color-text-primary, #1f2937);
            }
          `}</style>
          <div className="admin-calendar h-full">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'timeGridWeek,timeGridDay'
              }}
              buttonText={{
                today: 'Today',
                week: 'Week',
                day: 'Day',
              }}
              events={fullCalendarEvents}
              eventClick={handleEventClick}
              eventContent={renderEventContent}
              slotMinTime="07:00:00"
              slotMaxTime="19:00:00"
              slotDuration="01:00:00"
              slotLabelFormat={{
                hour: 'numeric',
                minute: '2-digit',
                omitZeroMinute: true,
                meridiem: 'short'
              }}
              height="100%"
              nowIndicator={true}
              allDaySlot={false}
              expandRows={true}
              stickyHeaderDates={true}
              dayMaxEvents={true}
              eventDisplay="block"
              slotEventOverlap={false}
            />
          </div>
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
