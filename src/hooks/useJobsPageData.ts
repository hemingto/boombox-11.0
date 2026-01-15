/**
 * @fileoverview Centralized data fetching hook for Jobs page
 * Fetches all job-related data at the page level to enable coordinated loading.
 * 
 * This hook consolidates data fetching for:
 * - Job offers (drivers only)
 * - Upcoming appointments
 * - Packing supply routes
 * - Job history
 * 
 * Benefits:
 * - Single loading state for entire page
 * - No layout shift from sections appearing/disappearing
 * - Coordinated data refresh
 * - Better error handling at page level
 * - Focus-based refetching for cross-tab synchronization
 * - Optimistic updates when accepting job offers
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Types for job offers - exported for use in components
export interface AppointmentOffer {
  id: number;
  type: 'appointment';
  appointmentId: number;
  onfleetTaskId: string;
  unitNumber: number;
  address: string;
  date: string;
  time: string;
  appointmentType: string;
  planType: string | null;
  numberOfUnits: number | null;
  payEstimate: string;
  notifiedAt: string;
  expiresAt: string;
  token: string;
  customer?: {
    firstName: string;
    lastName: string;
  };
  /** True if this is a reconfirmation request (e.g., after time/unit change) */
  isReconfirmation?: boolean;
  /** Message explaining what changed (for reconfirmation) */
  reconfirmationMessage?: string;
}

interface PackingSupplyRouteOffer {
  id: string;
  type: 'packingSupplyRoute';
  routeId: string;
  deliveryDate: string;
  totalStops: number;
  estimatedPayout: string;
  estimatedMiles: number;
  estimatedDuration: string;
  firstStopAddress: string;
  notifiedAt: string;
  expiresAt: string;
  token: string;
}

export type PendingOffer = AppointmentOffer | PackingSupplyRouteOffer;

// Types for upcoming jobs / appointments
export interface UpcomingAppointment {
  id: number;
  address: string;
  date: Date;
  time: Date;
  numberOfUnits: number;
  planType: string;
  appointmentType: string;
  status?: string;
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

// Types for job history
export interface HistoryJob {
  id: number;
  address: string;
  date: string;
  time: string;
  appointmentType: string;
  numberOfUnits: number;
  planType: string;
  insuranceCoverage?: string;
  requestedStorageUnits?: {
    unitType: string;
    quantity: number;
  }[];
  serviceStartTime?: string;
  serviceEndTime?: string;
  user?: {
    firstName: string;
    lastName: string;
  };
  driver?: {
    firstName: string;
    lastName: string;
  };
  feedback?: {
    rating: number;
    comment: string;
    tipAmount: number;
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

interface UseJobsPageDataProps {
  userType: 'mover' | 'driver';
  userId: string;
}

/**
 * Transform an appointment offer into an upcoming appointment for optimistic updates.
 * This allows the job to appear in UpcomingJobs immediately after accepting.
 */
function offerToAppointment(offer: AppointmentOffer): UpcomingAppointment {
  return {
    id: offer.appointmentId,
    address: offer.address,
    date: new Date(offer.date),
    time: new Date(offer.time),
    numberOfUnits: offer.numberOfUnits || 1,
    planType: offer.planType || '',
    appointmentType: offer.appointmentType,
    user: offer.customer ? {
      firstName: offer.customer.firstName,
      lastName: offer.customer.lastName,
    } : undefined,
  };
}

/** Result of an optimistic accept operation */
export interface AcceptOfferResult {
  success: boolean;
  error?: string;
}

interface UseJobsPageDataReturn {
  // Data
  jobOffers: PendingOffer[];
  upcomingJobs: UpcomingAppointment[];
  jobHistory: HistoryJob[];
  // Loading states
  isLoading: boolean;
  // Error states
  error: string | null;
  // Actions
  refetchOffers: () => Promise<void>;
  refetchUpcomingJobs: () => Promise<void>;
  refetchJobHistory: () => Promise<void>;
  refetchAll: () => Promise<void>;
  // Optimistic update action for accepting offers
  acceptOffer: (
    offer: PendingOffer,
    apiCall: () => Promise<Response>
  ) => Promise<AcceptOfferResult>;
  // Setters for optimistic updates
  setJobOffers: React.Dispatch<React.SetStateAction<PendingOffer[]>>;
  setUpcomingJobs: React.Dispatch<React.SetStateAction<UpcomingAppointment[]>>;
  setJobHistory: React.Dispatch<React.SetStateAction<HistoryJob[]>>;
}

export function useJobsPageData({ userType, userId }: UseJobsPageDataProps): UseJobsPageDataReturn {
  const [jobOffers, setJobOffers] = useState<PendingOffer[]>([]);
  const [upcomingJobs, setUpcomingJobs] = useState<UpcomingAppointment[]>([]);
  const [jobHistory, setJobHistory] = useState<HistoryJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track if data has been fetched at least once (for focus-based refetching)
  const hasInitialData = useRef(false);

  const apiBase = userType === 'mover' ? 'moving-partners' : 'drivers';

  // Fetch job offers (drivers only)
  const fetchOffers = useCallback(async () => {
    if (userType !== 'driver') return;
    
    try {
      const response = await fetch(`/api/drivers/${userId}/pending-offers`);
      if (!response.ok) {
        throw new Error('Failed to fetch pending offers');
      }
      const data = await response.json();
      setJobOffers(data.offers || []);
    } catch (err) {
      console.warn('Failed to fetch job offers:', err);
      // Don't set error - offers are optional
    }
  }, [userId, userType]);

  // Fetch upcoming jobs/appointments
  const fetchUpcomingJobs = useCallback(async () => {
    try {
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
      try {
        const routesResponse = await fetch(
          `/api/${apiBase}/${userId}/packing-supply-routes`
        );
        if (routesResponse.ok) {
          packingSupplyRoutes = await routesResponse.json();
        }
      } catch (routeError) {
        console.warn('Failed to fetch packing supply routes:', routeError);
      }

      // Combine appointments and packing supply routes
      const combinedData = [...appointmentsData, ...packingSupplyRoutes];
      setUpcomingJobs(combinedData);
    } catch (err) {
      console.error('Error fetching upcoming jobs:', err);
      throw err;
    }
  }, [userId, userType, apiBase]);

  // Fetch job history
  const fetchJobHistory = useCallback(async () => {
    try {
      // Fetch regular jobs
      const jobsResponse = await fetch(`/api/${apiBase}/${userId}/jobs`);
      if (!jobsResponse.ok) {
        throw new Error('Failed to fetch jobs');
      }
      const jobsData = await jobsResponse.json();

      // Fetch packing supply routes for history
      let packingSupplyRoutes = [];
      try {
        const routesResponse = await fetch(`/api/${apiBase}/${userId}/packing-supply-routes`);
        if (routesResponse.ok) {
          const routesData = await routesResponse.json();
          packingSupplyRoutes = routesData.map((route: any) => ({
            ...route,
            date: route.date || new Date().toISOString(),
            time: route.time || route.date || new Date().toISOString(),
          }));
        }
      } catch (routeError) {
        console.warn('Failed to fetch packing supply routes:', routeError);
      }

      // Combine jobs and routes
      const combinedJobs = [...jobsData, ...packingSupplyRoutes];
      setJobHistory(combinedJobs);
    } catch (err) {
      console.error('Error fetching job history:', err);
      throw err;
    }
  }, [userId, apiBase]);

  // Fetch all data
  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchOffers(),
        fetchUpcomingJobs(),
        fetchJobHistory(),
      ]);
      hasInitialData.current = true;
    } catch (err) {
      setError('Failed to load jobs data');
    } finally {
      setIsLoading(false);
    }
  }, [fetchOffers, fetchUpcomingJobs, fetchJobHistory]);
  
  // Silent refetch (doesn't show loading state) for focus-based updates
  const silentRefetch = useCallback(async () => {
    try {
      await Promise.all([
        fetchOffers(),
        fetchUpcomingJobs(),
        fetchJobHistory(),
      ]);
    } catch (err) {
      // Silent failures - don't update error state for background refreshes
      console.warn('Background refetch failed:', err);
    }
  }, [fetchOffers, fetchUpcomingJobs, fetchJobHistory]);

  // Initial fetch
  useEffect(() => {
    if (userId) {
      fetchAll();
    }
  }, [userId, fetchAll]);

  // Focus-based refetching for cross-tab synchronization
  // When user returns to the tab (e.g., after accepting via SMS in another tab),
  // silently refetch data to ensure it's up-to-date
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && hasInitialData.current) {
        silentRefetch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [silentRefetch]);

  /**
   * Accept an offer with optimistic update.
   * Immediately removes offer from jobOffers and adds to upcomingJobs,
   * then makes the API call. Rolls back on failure.
   */
  const acceptOffer = useCallback(async (
    offer: PendingOffer,
    apiCall: () => Promise<Response>
  ): Promise<AcceptOfferResult> => {
    // 1. Store current state for rollback
    const previousOffers = jobOffers;
    const previousUpcoming = upcomingJobs;

    // 2. Optimistically update state
    setJobOffers(prev => prev.filter(o => o.id !== offer.id));
    
    // Add to upcoming jobs if it's an appointment offer
    if (offer.type === 'appointment') {
      const newAppointment = offerToAppointment(offer);
      setUpcomingJobs(prev => [newAppointment, ...prev]);
    }

    // 3. Make API call
    try {
      const response = await apiCall();
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to accept offer');
      }
      return { success: true };
    } catch (err) {
      // 4. Rollback on failure
      setJobOffers(previousOffers);
      setUpcomingJobs(previousUpcoming);
      const errorMessage = err instanceof Error ? err.message : 'Failed to accept offer';
      return { success: false, error: errorMessage };
    }
  }, [jobOffers, upcomingJobs]);

  return {
    jobOffers,
    upcomingJobs,
    jobHistory,
    isLoading,
    error,
    refetchOffers: fetchOffers,
    refetchUpcomingJobs: fetchUpcomingJobs,
    refetchJobHistory: fetchJobHistory,
    refetchAll: fetchAll,
    acceptOffer,
    setJobOffers,
    setUpcomingJobs,
    setJobHistory,
  };
}

