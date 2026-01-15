/**
 * @fileoverview Displays upcoming jobs and packing supply routes for service providers
 * Shows appointments with Google Maps integration, filtering, pagination, and status management.
 * 
 * @source boombox-10.0/src/app/components/mover-account/upcomingjobs.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays upcoming jobs for drivers and moving partners with map previews
 * - Provides filtering options: Next Up, Today, Unassigned (for movers)
 * - Integrates Google Maps with geocoding for location visualization
 * - Supports job cancellation with reason selection
 * - Pagination for large job lists (5 items per page)
 * - Status badges for driver assignment and route status
 * - Links to detailed calendar view
 * - Shows packing supply route metrics (stops, estimated payout)
 * 
 * API ROUTES USED:
 * - POST /api/orders/appointments/[id]/mover-driver-cancel - Cancel appointment
 * - GET /api/moving-partners/[id]/approved-drivers - Fetch drivers for assignment
 * - POST /api/orders/appointments/[id]/assign-driver - Assign driver
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced bg-slate-100 with semantic surface colors (bg-surface-secondary, bg-surface-tertiary)
 * - Applied status badge classes (badge-success, badge-error, badge-warning, badge-info)
 * - Updated text colors to semantic palette (text-text-secondary, text-text-primary)
 * - Replaced hover colors (hover:bg-slate-100 → hover:bg-surface-hover)
 * - Applied ring colors (ring-slate-100 → ring-border)
 * - Updated error styling (bg-red-100, text-red-500 → bg-status-error/10, text-status-error)
 * - Updated warning styling (bg-amber-50, text-amber-600 → bg-status-warning/10, text-status-warning)
 * 
 * ACCESSIBILITY IMPROVEMENTS:
 * - Added ARIA labels for all interactive elements
 * - Added role="alert" for error messages
 * - Added aria-expanded for filter dropdown
 * - Added aria-label for navigation buttons
 * - Added role="button" for clickable elements
 * - Proper button disabled states with aria-disabled
 * - Screen reader announcements for dynamic content
 * 
 * @refactor Data fetching moved to parent page via useJobsPageData hook.
 * Component now accepts appointments as props for coordinated page-level loading.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';
import { format, subHours } from 'date-fns';
import { useClickOutside } from '@/hooks/useClickOutside';
import { AppointmentDetailsPopup } from '../shared/AppointmentDetailsPopup';
import { DriverAssignmentModeToggle } from './DriverAssignmentModeToggle';
import { Modal } from '@/components/ui/primitives/Modal';
import { Select, SelectOption } from '@/components/ui/primitives/Select';
import { Button } from '@/components/ui/primitives/Button';
import { Spinner } from '@/components/ui/primitives/Spinner';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { mapStyles } from '@/app/mapstyles';
import { formatPhoneNumberForDisplay } from '@/lib/utils/phoneUtils';
import Image from 'next/image';
import type { UpcomingAppointment } from '@/hooks/useJobsPageData';

// Re-export type for convenience
export type { UpcomingAppointment };

interface UpcomingJobsProps {
  userType: 'mover' | 'driver';
  userId: string;
  /** Upcoming appointments to display */
  appointments: UpcomingAppointment[];
  /** Callback to update appointments after actions (for optimistic updates) */
  onAppointmentsChange: (appointments: UpcomingAppointment[]) => void;
}

type FilterOption = 'next-up' | 'today' | 'unassigned';

export function UpcomingJobs({ userType, userId, appointments, onAppointmentsChange }: UpcomingJobsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAppointment, setSelectedAppointment] =
    useState<UpcomingAppointment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [geocodingStatus, setGeocodingStatus] = useState<
    Record<number, 'pending' | 'success' | 'error'>
  >({});
  const [mapCenters, setMapCenters] = useState<
    Record<number, google.maps.LatLngLiteral>
  >({});
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [cancellationError, setCancellationError] = useState<string | null>(
    null
  );
  const [filterOption, setFilterOption] = useState<FilterOption>('next-up');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<number | null>(
    null
  );
  // Driver assignment modal state
  const [isAssignDriverModalOpen, setIsAssignDriverModalOpen] = useState(false);
  const [appointmentToAssign, setAppointmentToAssign] = useState<UpcomingAppointment | null>(null);
  const [availableDrivers, setAvailableDrivers] = useState<Array<{
    id: number;
    firstName: string;
    lastName: string;
    phoneNumber: string | null;
    onfleetWorkerId: string | null;
    profilePicture: string | null;
    isAvailable?: boolean;
    conflictReason?: string;
  }>>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const [isAssigningDriver, setIsAssigningDriver] = useState(false);
  const [assignDriverError, setAssignDriverError] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const itemsPerPage = 5;

  // Use centralized click outside hook
  useClickOutside(filterRef, () => setIsFilterOpen(false));

  const filteredAppointments = appointments
    .filter((appointment) => {
      // Filter out completed appointments (handle case variations)
      const status = appointment.status?.toLowerCase();
      if (status === 'complete' || status === 'completed') {
        return false;
      }

      const appointmentDate = new Date(appointment.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      switch (filterOption) {
        case 'today':
          return appointmentDate.toDateString() === today.toDateString();
        case 'unassigned':
          return userType === 'mover' && !appointment.driver;
        default: // 'next-up'
          return true;
      }
    })
    .sort((a, b) => {
      if (filterOption === 'next-up') {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      }
      return 0;
    });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAppointments = filteredAppointments.slice(
    startIndex,
    startIndex + itemsPerPage
  );
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);

  const mapContainerStyle = {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: '0.375rem',
    borderBottomLeftRadius: '0.375rem',
    borderTopRightRadius: '0',
    borderBottomRightRadius: '0',
  };

  const mapOptions = {
    styles: mapStyles,
    disableDefaultUI: false,
    fullscreenControl: false,
  };

  // Geocode location to coordinates for each appointment
  useEffect(() => {
    filteredAppointments.forEach((appointment) => {
      if (
        !mapCenters[appointment.id] &&
        geocodingStatus[appointment.id] !== 'pending'
      ) {
        setGeocodingStatus((prev) => ({ ...prev, [appointment.id]: 'pending' }));

        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: appointment.address }, (results, status) => {
          if (status === 'OK' && results && results.length > 0) {
            const { lat, lng } = results[0].geometry.location;
            setMapCenters((prev) => ({
              ...prev,
              [appointment.id]: { lat: lat(), lng: lng() },
            }));
            setGeocodingStatus((prev) => ({
              ...prev,
              [appointment.id]: 'success',
            }));
          } else {
            console.error(
              `Geocoding failed for appointment ${appointment.id}:`,
              status
            );
            setGeocodingStatus((prev) => ({
              ...prev,
              [appointment.id]: 'error',
            }));
          }
        });
      }
    });
  }, [filteredAppointments, geocodingStatus, mapCenters]);

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const isPackingSupplyRoute = (appointment: UpcomingAppointment) => {
    return (
      appointment.appointmentType === 'Packing Supply Delivery' &&
      appointment.routeId
    );
  };

  const getDriverStatus = (appointment: UpcomingAppointment, onAssignClick?: () => void) => {
    if (isPackingSupplyRoute(appointment)) {
      const routeStatus = appointment.routeStatus;
      if (routeStatus === 'completed') {
        return <span className="bg-status-bg-success text-status-success px-3 py-2 rounded-md text-xs font-medium">Route Completed</span>;
      } else if (routeStatus === 'in_progress') {
        return <span className="bg-status-bg-info text-status-info px-3 py-2 rounded-md text-xs font-medium">Route Active</span>;
      }
      return <span className="bg-status-bg-warning text-status-warning px-3 py-2 rounded-md text-xs font-medium">Route Pending</span>;
    }

    if (appointment.driver) {
      return <span className="bg-status-bg-success text-status-success px-3 py-2 rounded-md text-xs font-medium">Driver Assigned</span>;
    }
    return (
      <button
        onClick={onAssignClick}
        className="bg-status-bg-error text-status-error py-2 px-3 rounded-md text-xs font-medium hover:bg-red-200 cursor-pointer transition-colors"
        aria-label="Assign driver to this job"
      >
        Driver Unassigned
      </button>
    );
  };

  const handleMenuClick = (appointmentId: number) => {
    setOpenMenuId(openMenuId === appointmentId ? null : appointmentId);
  };

  const cancelationOptions = [
    'I can no longer fulfill this job',
    'Scheduling conflict',
    'Equipment issues',
    'Other',
  ];

  const cancelAppointment = async (appointmentId: number) => {
    setIsCancelling(true);
    try {
      const response = await fetch(
        `/api/orders/appointments/${appointmentId}/mover-driver-cancel`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cancellationReason: cancellationReason || 'No reason added',
            userType,
            userId,
          }),
        }
      );

      if (response.ok) {
        // Update appointments via parent callback
        onAppointmentsChange(appointments.filter((app) => app.id !== appointmentId));
        setOpenMenuId(null);
        setIsCancelModalOpen(false);
        setCancellationReason('');
        setAppointmentToCancel(null);
      } else {
        const errorData = await response.json();
        console.error('Failed to cancel appointment:', errorData);
        setCancellationError(errorData.error || 'Failed to cancel appointment');
      }
    } catch (error) {
      console.error('Error:', error);
      setCancellationError('An error occurred while canceling the appointment');
    } finally {
      setIsCancelling(false);
    }
  };

  // Fetch approved drivers for the moving partner with availability check
  const fetchApprovedDrivers = async () => {
    if (!appointmentToAssign) return;
    
    setIsLoadingDrivers(true);
    setAssignDriverError(null);
    try {
      // Build URL with appointment date/time for availability checking
      const appointmentDate = new Date(appointmentToAssign.date).toISOString();
      const appointmentTime = new Date(appointmentToAssign.time).toISOString();
      const url = `/api/moving-partners/${userId}/approved-drivers?appointmentDate=${encodeURIComponent(appointmentDate)}&appointmentTime=${encodeURIComponent(appointmentTime)}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch drivers');
      }
      const data = await response.json();
      console.log('Approved drivers API response:', data);
      
      // Extract driver data from the nested MovingPartnerDriver structure
      // Sort available drivers to the top
      const drivers = (data.approvedDrivers || [])
        .map((mpDriver: any) => ({
          id: mpDriver.driver.id,
          firstName: mpDriver.driver.firstName,
          lastName: mpDriver.driver.lastName,
          phoneNumber: mpDriver.driver.phoneNumber,
          onfleetWorkerId: mpDriver.driver.onfleetWorkerId,
          profilePicture: mpDriver.driver.profilePicture,
          isAvailable: mpDriver.isAvailable ?? true, // Default to available if not provided
          conflictReason: mpDriver.conflictReason,
        }))
        .sort((a: { isAvailable?: boolean }, b: { isAvailable?: boolean }) => 
          (b.isAvailable ? 1 : 0) - (a.isAvailable ? 1 : 0)
        );
      console.log('Extracted drivers with availability:', drivers);
      
      setAvailableDrivers(drivers);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setAssignDriverError('Failed to load available drivers');
    } finally {
      setIsLoadingDrivers(false);
    }
  };

  // Assign driver to the selected appointment
  const assignDriver = async () => {
    if (!appointmentToAssign || !selectedDriverId) return;

    setIsAssigningDriver(true);
    setAssignDriverError(null);
    try {
      const response = await fetch(
        `/api/orders/appointments/${appointmentToAssign.id}/assign-driver`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            driverId: parseInt(selectedDriverId),
            movingPartnerId: parseInt(userId),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign driver');
      }

      const data = await response.json();
      
      // Update local state with assigned driver via parent callback
      const assignedDriver = availableDrivers.find(d => d.id === parseInt(selectedDriverId));
      if (assignedDriver) {
        onAppointmentsChange(
          appointments.map(app =>
            app.id === appointmentToAssign.id
              ? {
                  ...app,
                  driver: {
                    firstName: assignedDriver.firstName,
                    lastName: assignedDriver.lastName,
                    phoneNumber: assignedDriver.phoneNumber || '',
                    profilePicture: assignedDriver.profilePicture || undefined,
                  },
                }
              : app
          )
        );
      }

      // Close modal and reset state
      setIsAssignDriverModalOpen(false);
      setAppointmentToAssign(null);
      setSelectedDriverId('');
      setAvailableDrivers([]);
    } catch (error) {
      console.error('Error assigning driver:', error);
      setAssignDriverError(error instanceof Error ? error.message : 'Failed to assign driver');
    } finally {
      setIsAssigningDriver(false);
    }
  };

  // Fetch drivers when assign driver modal opens
  useEffect(() => {
    if (isAssignDriverModalOpen && userType === 'mover' && appointmentToAssign) {
      fetchApprovedDrivers();
    }
  }, [isAssignDriverModalOpen, userType, userId, appointmentToAssign]);

  // Don't render the section if no appointments
  if (appointments.length === 0) {
    return null;
  }

  return (
    <div className="max-w-5xl lg:px-16 px-6 mx-auto">
      <h2 className="text-2xl mb-8">Upcoming Jobs</h2>

      <div className="flex justify-between items-start mb-6">
        {/* Filter dropdown */}
        <div className="relative" ref={filterRef}>
          <button
            className={`relative w-fit rounded-full px-3 py-2 cursor-pointer ${
              isFilterOpen
                ? 'ring-2 ring-border bg-white'
                : 'ring-1 ring-border bg-surface-secondary'
            }`}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            aria-expanded={isFilterOpen}
            aria-haspopup="listbox"
            aria-label={`Filter jobs: ${
              filterOption === 'next-up'
                ? 'Next Up'
                : filterOption === 'today'
                  ? 'Today'
                  : 'Unassigned'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-primary text-nowrap">
                {filterOption === 'next-up'
                  ? 'Next Up'
                  : filterOption === 'today'
                    ? 'Today'
                    : 'Unassigned'}
              </span>
              <svg
                className="shrink-0 w-3 h-3 text-text-primary ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </button>

          {isFilterOpen && (
            <div
              className="absolute w-fit min-w-36 left-0 z-10 mt-1 border border-border rounded-md bg-surface-primary shadow-custom-shadow"
              role="listbox"
              aria-label="Filter options"
            >
              <button
                className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-tertiary focus-visible focus:bg-surface-secondary ${userType === 'mover' ? 'rounded-t-md' : 'rounded-md'}`}
                onClick={() => {
                  setFilterOption('next-up');
                  setIsFilterOpen(false);
                }}
                role="option"
                aria-selected={filterOption === 'next-up'}
              >
                Next Up
              </button>
              <button
                className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-tertiary focus-visible focus:bg-surface-secondary ${userType === 'mover' ? '' : 'rounded-b-md'}`}
                onClick={() => {
                  setFilterOption('today');
                  setIsFilterOpen(false);
                }}
                role="option"
                aria-selected={filterOption === 'today'}
              >
                Today
              </button>
              {userType === 'mover' && (
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-surface-tertiary focus-visible focus:bg-surface-secondary rounded-b-md"
                  onClick={() => {
                    setFilterOption('unassigned');
                    setIsFilterOpen(false);
                  }}
                  role="option"
                  aria-selected={filterOption === 'unassigned'}
                >
                  Unassigned
                </button>
              )}
            </div>
          )}
        </div>

        {/* Driver Assignment Mode Toggle - Only for movers */}
        {userType === 'mover' && <DriverAssignmentModeToggle userId={userId} />}
      </div>

      <div className="space-y-4">
        {paginatedAppointments.map((appointment) => {
          const appointmentTime = new Date(appointment.time);
          const displayTime = subHours(appointmentTime, 1);
          const isGeocoding = geocodingStatus[appointment.id] === 'pending';
          const hasGeocodingError = geocodingStatus[appointment.id] === 'error';

          return (
            <div
              key={appointment.id}
              className="bg-white rounded-md shadow-custom-shadow p-4"
            >
              <div className="flex items-center space-x-4">
                <div className="w-36 h-36 shrink-0 relative rounded-l-md overflow-hidden">
                  {isGeocoding ? (
                    <div
                      className="w-full h-full bg-surface-tertiary animate-pulse rounded-l-md flex items-center justify-center"
                      role="status"
                      aria-label="Loading map"
                    >
                      <p className="text-text-disabled">Loading map...</p>
                    </div>
                  ) : hasGeocodingError ? (
                    <div className="w-full h-full bg-status-error/10 rounded-l-md flex items-center justify-center">
                      <p className="text-status-error text-sm">
                        Failed to load map
                      </p>
                    </div>
                  ) : (
                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={
                        mapCenters[appointment.id] || {
                          lat: 37.75,
                          lng: -122.294465,
                        }
                      }
                      zoom={14}
                      options={mapOptions}
                    >
                      {mapCenters[appointment.id] && (
                        <Marker position={mapCenters[appointment.id]} />
                      )}
                    </GoogleMap>
                  )}
                </div>

                <div className="flex-1 h-36 relative">
                  <div className="absolute top-0 right-0 flex items-center gap-4">
                    {userType !== 'driver' && getDriverStatus(appointment, () => {
                      setAppointmentToAssign(appointment);
                      setIsAssignDriverModalOpen(true);
                    })}

                    <div className="relative">
                      <button
                        onClick={() => handleMenuClick(appointment.id)}
                        className="p-1 rounded-full hover:bg-surface-tertiary"
                        aria-label="Job options"
                        aria-expanded={openMenuId === appointment.id}
                        aria-haspopup="menu"
                      >
                        <EllipsisHorizontalIcon
                          className="w-8 h-8 text-text-primary"
                          aria-hidden="true"
                        />
                      </button>

                      {openMenuId === appointment.id && (
                        <div
                          className="absolute right-0 top-10 w-48 bg-surface-primary border border-border rounded-md shadow-custom-shadow z-10"
                          role="menu"
                        >
                          <button
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setIsDetailsOpen(true);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-surface-tertiary rounded-t-md"
                            role="menuitem"
                          >
                            More Details
                          </button>
                          <button
                            onClick={() => {
                              setAppointmentToCancel(appointment.id);
                              setIsCancelModalOpen(true);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-status-error rounded-b-md"
                            role="menuitem"
                          >
                            Cancel Job
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="h-full flex items-center">
                    <div>
                      <h3 className="text-lg font-medium mb-1">
                        {appointment.address}
                      </h3>
                      <p className="text-text-tertiary mb-1">
                        {appointment.appointmentType}
                      </p>
                      {isPackingSupplyRoute(appointment) ? (
                        <div className="space-y-1">
                          <p className="text-text-tertiary">
                            {format(displayTime, "MMMM do, yyyy 'delivery route'")}
                          </p>
                          <p className="text-sm text-text-tertiary">
                            {appointment.completedStops || 0}/
                            {appointment.totalStops || 0} stops completed
                            {appointment.estimatedPayout && (
                              <span className="ml-2">
                                • Est. payout: ${appointment.estimatedPayout}
                              </span>
                            )}
                          </p>
                        </div>
                      ) : (
                        <p className="text-text-tertiary">
                          {format(displayTime, "MMMM do, yyyy 'starting at' h:mmaaa")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <nav
          className="flex justify-center items-center mt-8"
          role="navigation"
          aria-label="Pagination"
        >
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className={`mr-4 ${
              currentPage === 1
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer'
            }`}
            aria-label="Previous page"
            aria-disabled={currentPage === 1}
          >
            <ChevronLeftIcon className="w-5 h-5" aria-hidden="true" />
          </button>
          <span className="text-sm" aria-live="polite" aria-atomic="true">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className={`ml-4 ${
              currentPage === totalPages
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer'
            }`}
            aria-label="Next page"
            aria-disabled={currentPage === totalPages}
          >
            <ChevronRightIcon className="w-5 h-5" aria-hidden="true" />
          </button>
        </nav>
      )}

      {/* Appointment Details Popup */}
      {selectedAppointment && (
        <AppointmentDetailsPopup
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            setSelectedAppointment(null);
          }}
          appointment={selectedAppointment}
          userType={userType}
        />
      )}

      {/* Cancellation Modal */}
      <Modal
        open={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setAppointmentToCancel(null);
          setCancellationReason('');
          setCancellationError(null);
        }}
        title="Tell us why you need to cancel"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <div className="space-y-2">
              {cancelationOptions.map((option) => (
                <label
                  key={option}
                  className={`flex items-center p-4 border-2 rounded-md cursor-pointer ${
                    cancellationReason === option
                      ? 'border-2 border-primary bg-surface-primary'
                      : 'bg-slate-100 border-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancellation-reason"
                    value={option}
                    checked={cancellationReason === option}
                    onChange={(e) => {
                      setCancellationReason(e.target.value);
                      setCancellationError(null);
                    }}
                    className="mr-3 accent-primary w-4 h-4"
                  />
                  <span className="text-sm text-text-primary">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {cancellationError && (
            <p className="text-sm text-status-error" role="alert">
              {cancellationError}
            </p>
          )}

          <div className="bg-status-bg-warning border border-border-warning rounded-md p-4">
            <p className="text-status-warning text-sm">
              Once canceled, the job will be removed from your schedule and
              reassigned to another mover. Cancellations affect your rating and your ability to accept future jobs.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-8">
            <Button
              onClick={() => {
                setIsCancelModalOpen(false);
                setAppointmentToCancel(null);
                setCancellationReason('');
                setCancellationError(null);
              }}
              variant="secondary"
              size="md"
              disabled={isCancelling}
            >
              Keep Job
            </Button>
            <Button
              onClick={async () => {
                if (appointmentToCancel) {
                  await cancelAppointment(appointmentToCancel);
                }
              }}
              variant="primary"
              size="md"
              disabled={!cancellationReason || isCancelling}
              loading={isCancelling}
              aria-label="Confirm job cancellation"
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign Driver Modal */}
      <Modal
        open={isAssignDriverModalOpen}
        onClose={() => {
          setIsAssignDriverModalOpen(false);
          setAppointmentToAssign(null);
          setSelectedDriverId('');
          setAvailableDrivers([]);
          setAssignDriverError(null);
        }}
        title="Assign Driver"
        size="md"
      >
        <div className="space-y-4">
          {appointmentToAssign && (
            <div className="bg-surface-tertiary p-3 rounded-md">
              <p className="text-sm text-text-tertiary">
                <span className="font-medium text-text-primary">Job:</span>{' '}
                {appointmentToAssign.appointmentType}
              </p>
              <p className="text-sm text-text-tertiary mt-1">
                <span className="font-medium text-text-primary">Address:</span>{' '}
                {appointmentToAssign.address}
              </p>
              <p className="text-sm text-text-tertiary mt-1">
                <span className="font-medium text-text-primary">Date:</span>{' '}
                {format(new Date(appointmentToAssign.date), 'MMMM do, yyyy')}
              </p>
            </div>
          )}

          {isLoadingDrivers ? (
            <div className="space-y-2">
              <label className="form-label">Select a Driver</label>
              <div className="w-full py-2.5 px-3 bg-surface-tertiary rounded-md flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Spinner size="sm" variant="secondary" />
                  <span className="text-base text-text-secondary">Loading drivers...</span>
                </div>
                <ChevronDownIcon className="w-6 h-6 text-text-secondary flex-shrink-0" />
              </div>
            </div>
          ) : availableDrivers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-text-tertiary">No approved drivers available.</p>
              <p className="text-sm text-text-tertiary mt-1">
                Please add and approve drivers in your account settings.
              </p>
            </div>
          ) : (
            <Select
              label="Select a Driver"
              placeholder="Choose a driver to assign"
              options={availableDrivers.map(driver => ({
                value: driver.id.toString(),
                label: `${driver.firstName} ${driver.lastName}`,
                description: driver.isAvailable === false 
                  ? driver.conflictReason 
                  : driver.phoneNumber 
                    ? formatPhoneNumberForDisplay(driver.phoneNumber) 
                    : undefined,
                disabled: driver.isAvailable === false,
                metadata: { 
                  profilePicture: driver.profilePicture,
                  isAvailable: driver.isAvailable,
                  conflictReason: driver.conflictReason,
                },
              }))}
              value={selectedDriverId}
              onChange={(value) => setSelectedDriverId(value)}
              fullWidth
              renderOption={(option: SelectOption) => (
                <div className={`flex items-center space-x-3 ${option.disabled ? 'opacity-60' : ''}`}>
                  {option.metadata?.profilePicture ? (
                    <Image
                      src={option.metadata.profilePicture}
                      alt={option.label}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-surface-tertiary flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-text-tertiary">
                        {option.label.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className={`text-sm ${option.disabled ? 'text-text-tertiary' : 'text-text-primary'}`}>
                      {option.label}
                    </span>
                    {option.description && (
                      <span className={`text-xs ${option.disabled ? 'text-status-warning' : 'text-text-tertiary'}`}>
                        {option.description}
                      </span>
                    )}
                  </div>
                </div>
              )}
              renderSelected={(option: SelectOption) => (
                <div className="flex items-center space-x-3">
                  {option.metadata?.profilePicture ? (
                    <Image
                      src={option.metadata.profilePicture}
                      alt={option.label}
                      width={24}
                      height={24}
                      className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-surface-tertiary flex items-center justify-center flex-shrink-0">
                      <span className="text-2xs font-medium text-text-tertiary">
                        {option.label.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  )}
                  <span>{option.label}</span>
                </div>
              )}
            />
          )}

          {assignDriverError && (
            <div 
              className="mt-4 p-3 text-sm bg-status-bg-error text-status-error rounded-md"
              role="alert"
              aria-live="polite"
            >
              {assignDriverError}
            </div>
          )}
        </div>

        <div className="mt-12 flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setIsAssignDriverModalOpen(false);
              setAppointmentToAssign(null);
              setSelectedDriverId('');
              setAvailableDrivers([]);
              setAssignDriverError(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={assignDriver}
            disabled={!selectedDriverId || isAssigningDriver || availableDrivers.length === 0}
            aria-label="Assign selected driver to job"
          >
            {isAssigningDriver ? 'Assigning...' : 'Assign Driver'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
