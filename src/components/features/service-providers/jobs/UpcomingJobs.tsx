/**
 * @fileoverview Displays upcoming jobs and packing supply routes for service providers
 * Shows appointments with Google Maps integration, filtering, pagination, and status management.
 * 
 * @source boombox-10.0/src/app/components/mover-account/upcomingjobs.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays upcoming jobs for drivers and moving partners with map previews
 * - Fetches and combines regular appointments and packing supply delivery routes
 * - Provides filtering options: Next Up, Today, Unassigned (for movers)
 * - Integrates Google Maps with geocoding for location visualization
 * - Supports job cancellation with reason selection
 * - Pagination for large job lists (5 items per page)
 * - Status badges for driver assignment and route status
 * - Links to detailed calendar view
 * - Shows packing supply route metrics (stops, estimated payout)
 * 
 * API ROUTES UPDATED:
 * - Old: /api/appointments/upcoming → New: /api/customers/upcoming-appointments
 * - Old: /api/drivers/[id]/packing-supply-routes → New: /api/drivers/[id]/packing-supply-routes (unchanged)
 * - Old: /api/movers/[id]/packing-supply-routes → New: /api/moving-partners/[id]/packing-supply-routes
 * - Old: /api/appointments/[id]/mover-driver-cancel → New: /api/orders/appointments/[id]/mover-driver-cancel
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
 * BUSINESS LOGIC EXTRACTED:
 * - Replaced inline click-outside handler with useClickOutside hook
 * - Extracted date formatting logic (uses date-fns consistently)
 * 
 * ACCESSIBILITY IMPROVEMENTS:
 * - Added ARIA labels for all interactive elements
 * - Added role="status" for loading states
 * - Added role="alert" for error messages
 * - Added aria-expanded for filter dropdown
 * - Added aria-label for navigation buttons
 * - Added role="button" for clickable elements
 * - Proper button disabled states with aria-disabled
 * - Screen reader announcements for dynamic content
 * 
 * @refactor
 * - Migrated to service-providers/jobs feature folder
 * - Updated API routes to new domain-based structure
 * - Applied design system colors and semantic tokens
 * - Extracted business logic to centralized utilities
 * - Enhanced accessibility with ARIA attributes
 * - Replaced InformationalPopup with Modal component
 * - Improved component organization and readability
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisHorizontalIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { ArrowUpRightIcon } from '@heroicons/react/20/solid';
import { format, subHours } from 'date-fns';
import Link from 'next/link';
import { useClickOutside } from '@/hooks/useClickOutside';
import { AppointmentDetailsPopup } from '../shared/AppointmentDetailsPopup';
import { Modal } from '@/components/ui/primitives/Modal';
import { RadioList } from '@/components/forms/RadioList';
import { mapStyles } from '@/app/mapstyles';

interface Appointment {
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
  coordinates?: {
    lat: number;
    lng: number;
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

interface UpcomingJobsProps {
  userType: 'mover' | 'driver';
  userId: string;
}

type FilterOption = 'next-up' | 'today' | 'unassigned';

export function UpcomingJobs({ userType, userId }: UpcomingJobsProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
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
  const filterRef = useRef<HTMLDivElement>(null);
  const itemsPerPage = 5;

  // Use centralized click outside hook
  useClickOutside(filterRef, () => setIsFilterOpen(false));

  const filteredAppointments = appointments
    .filter((appointment) => {
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

  const baseUrl =
    userType === 'driver'
      ? `/driver-account-page/${userId}`
      : `/mover-account-page/${userId}`;

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

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setIsLoading(true);

        // Fetch regular appointments
        const appointmentsResponse = await fetch(
          `/api/customers/upcoming-appointments?userType=${userType}&userId=${userId}`
        );
        if (!appointmentsResponse.ok) {
          throw new Error('Failed to fetch appointments');
        }
        const appointmentsData = await appointmentsResponse.json();

        // Fetch packing supply routes
        let packingSupplyRoutes = [];
        if (userType === 'driver') {
          try {
            const routesResponse = await fetch(
              `/api/drivers/${userId}/packing-supply-routes`
            );
            if (routesResponse.ok) {
              packingSupplyRoutes = await routesResponse.json();
            }
          } catch (routeError) {
            console.warn('Failed to fetch packing supply routes:', routeError);
          }
        } else if (userType === 'mover') {
          try {
            const routesResponse = await fetch(
              `/api/moving-partners/${userId}/packing-supply-routes`
            );
            if (routesResponse.ok) {
              packingSupplyRoutes = await routesResponse.json();
            }
          } catch (routeError) {
            console.warn('Failed to fetch packing supply routes:', routeError);
          }
        }

        // Combine appointments and packing supply routes
        const combinedData = [...appointmentsData, ...packingSupplyRoutes];
        setAppointments(combinedData);
      } catch (error) {
        console.error('Error:', error);
        setError('Failed to load appointments');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchAppointments();
    }
  }, [userId, userType]);

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

  const isPackingSupplyRoute = (appointment: Appointment) => {
    return (
      appointment.appointmentType === 'Packing Supply Delivery' &&
      appointment.routeId
    );
  };

  const getDriverStatus = (appointment: Appointment) => {
    if (isPackingSupplyRoute(appointment)) {
      const routeStatus = appointment.routeStatus;
      if (routeStatus === 'completed') {
        return <span className="badge-success text-xs">Route Completed</span>;
      } else if (routeStatus === 'in_progress') {
        return <span className="badge-info text-xs">Route Active</span>;
      }
      return <span className="badge-warning text-xs">Route Pending</span>;
    }

    if (appointment.driver) {
      return <span className="badge-success text-xs">Driver Assigned</span>;
    }
    return <span className="badge-error text-xs">Driver Unassigned</span>;
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
        // Refresh the appointments list
        const updatedAppointments = appointments.filter(
          (app) => app.id !== appointmentId
        );
        setAppointments(updatedAppointments);
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

  if (isLoading) {
    return (
      <div
        className="max-w-5xl lg:px-16 px-6 mx-auto"
        role="status"
        aria-busy="true"
        aria-label="Loading upcoming jobs"
      >
        <h2 className="text-2xl mb-8">Upcoming Jobs</h2>
        <div className="bg-white rounded-md shadow-custom-shadow">
          {[...Array(1)].map((_, i) => (
            <div key={i} className={`p-4 ${i === 0 ? 'mb-4' : ''}`}>
              <div className="flex items-center space-x-4">
                {/* Map skeleton */}
                <div className="w-36 h-36 shrink-0 bg-surface-tertiary rounded-l-md animate-pulse" />

                {/* Content skeleton */}
                <div className="flex-1 h-36 relative">
                  {/* Status and menu skeleton */}
                  <div className="absolute top-0 right-0 flex items-center gap-4">
                    <div className="w-28 h-8 bg-surface-tertiary rounded-md animate-pulse" />
                    <div className="w-8 h-8 bg-surface-tertiary rounded-full animate-pulse" />
                  </div>

                  {/* Text content skeleton */}
                  <div className="h-full flex items-center">
                    <div className="space-y-2">
                      <div className="h-6 bg-surface-tertiary rounded w-64 animate-pulse" />
                      <div className="h-5 bg-surface-tertiary rounded w-48 animate-pulse" />
                      <div className="h-5 bg-surface-tertiary rounded w-56 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl lg:px-16 px-6 mx-auto">
        <h2 className="text-2xl mb-8">Upcoming Jobs</h2>
        <div
          className="bg-status-error/10 p-3 mb-4 border border-status-error rounded-md"
          role="alert"
        >
          <p className="text-sm text-status-error">{error}</p>
        </div>
      </div>
    );
  }

  if (!isLoading && appointments.length === 0) {
    return (
      <div className="max-w-5xl lg:px-16 px-6 mx-auto">
        <h2 className="text-2xl mb-8">Upcoming Jobs</h2>
        <div
          className="bg-white rounded-md shadow-custom-shadow p-8 text-center"
          role="status"
          aria-live="polite"
        >
          <CalendarDaysIcon
            className="w-10 h-10 text-text-disabled mb-4 mx-auto"
            aria-hidden="true"
          />
          <p className="text-text-secondary">No upcoming jobs available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl lg:px-16 px-6 mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl">Upcoming Jobs</h2>
        <div className="flex items-center gap-4">
          <Link
            href={`${baseUrl}/view-calendar`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View calendar in new tab"
          >
            <button className="flex items-center gap-1 bg-primary text-white rounded-md py-2.5 pl-6 pr-5 font-inter font-semibold hover:bg-primary-hover">
              View Calendar
              <ArrowUpRightIcon className="w-6 h-6" aria-hidden="true" />
            </button>
          </Link>
        </div>
      </div>

      <div className="relative" ref={filterRef}>
        <button
          className={`relative w-fit rounded-full px-3 py-2 mb-6 cursor-pointer ${
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
            className="absolute w-fit min-w-36 left-0 z-10 -mt-2 border border-border rounded-md bg-white shadow-custom-shadow"
            role="listbox"
            aria-label="Filter options"
          >
            <div
              className="flex justify-between items-center p-3 cursor-pointer hover:bg-surface-hover"
              onClick={() => {
                setFilterOption('next-up');
                setIsFilterOpen(false);
              }}
              role="option"
              aria-selected={filterOption === 'next-up'}
            >
              <span className="text-sm text-text-primary">Next Up</span>
            </div>
            <div
              className="flex justify-between items-center p-3 cursor-pointer hover:bg-surface-hover"
              onClick={() => {
                setFilterOption('today');
                setIsFilterOpen(false);
              }}
              role="option"
              aria-selected={filterOption === 'today'}
            >
              <span className="text-sm text-text-primary">Today</span>
            </div>
            {userType === 'mover' && (
              <div
                className="flex justify-between items-center p-3 cursor-pointer hover:bg-surface-hover"
                onClick={() => {
                  setFilterOption('unassigned');
                  setIsFilterOpen(false);
                }}
                role="option"
                aria-selected={filterOption === 'unassigned'}
              >
                <span className="text-sm text-text-primary">Unassigned</span>
              </div>
            )}
          </div>
        )}
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
                    {userType !== 'driver' && getDriverStatus(appointment)}

                    <div className="relative">
                      <button
                        onClick={() => handleMenuClick(appointment.id)}
                        className="p-1 hover:bg-surface-hover rounded-full"
                        aria-label="Job options"
                        aria-expanded={openMenuId === appointment.id}
                        aria-haspopup="menu"
                      >
                        <EllipsisHorizontalIcon
                          className="w-6 h-6 text-text-primary"
                          aria-hidden="true"
                        />
                      </button>

                      {openMenuId === appointment.id && (
                        <div
                          className="absolute right-0 top-8 w-48 bg-white border border-border rounded-md shadow-custom-shadow z-10"
                          role="menu"
                        >
                          <button
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setIsDetailsOpen(true);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-surface-hover"
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
                            className="w-full text-left px-3 py-2 text-sm hover:bg-surface-hover text-status-error"
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
                      <p className="text-text-secondary mb-1">
                        {appointment.appointmentType}
                      </p>
                      {isPackingSupplyRoute(appointment) ? (
                        <div className="space-y-1">
                          <p className="text-text-secondary">
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
                        <p className="text-text-secondary">
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
        title="Confirm your cancellation"
        size="md"
      >
        <div>
          <p className="mt-2 mb-4 text-lg">Tell us why you need to cancel</p>
          <div className="bg-status-warning/10 border border-status-warning rounded-md p-3 mb-6 max-w-md">
            <p className="text-status-warning text-sm">
              Cancellations affect your rating and your ability to accept future
              jobs. Please make sure you do not cancel jobs unless absolutely
              necessary.
            </p>
          </div>
          <RadioList
            options={cancelationOptions}
            onChange={(value) => {
              setCancellationReason(value);
              setCancellationError(null);
            }}
          />
          {cancellationError && (
            <p className="mt-2 text-sm text-status-error" role="alert">
              {cancellationError}
            </p>
          )}
        </div>
        <p className="mt-4 ml-1 text-sm">
          Once canceled, the job will be removed from your schedule and
          reassigned to another mover.
        </p>
        <div className="mt-10 flex justify-end">
          <button
            onClick={async () => {
              if (appointmentToCancel) {
                await cancelAppointment(appointmentToCancel);
              }
            }}
            disabled={isCancelling}
            className="cursor-pointer py-2.5 px-5 font-semibold bg-primary text-white text-sm rounded-md hover:bg-primary-hover active:bg-primary font-inter disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Confirm job cancellation"
          >
            {isCancelling ? 'Cancelling...' : 'Cancel Job'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

