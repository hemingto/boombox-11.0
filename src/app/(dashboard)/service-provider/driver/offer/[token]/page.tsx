/**
 * @fileoverview Driver job offer acceptance/decline page
 * @source boombox-10.0/src/app/driver/offer/[token]/page.tsx
 * @refactor Migrated to (dashboard)/service-provider route group with proper token handling
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { calculateDriverPayment } from '@/lib/payments/calculator';

// Define stagger time in minutes (consistent with driver-assign route)
const UNIT_STAGGER_MINUTES = 45;

// Helper function to calculate unit-specific start time (consistent with driver-assign route)
function getUnitSpecificStartTime(
  originalAppointmentTime: Date,
  unitNumber: number
): Date {
  if (unitNumber <= 1) {
    return originalAppointmentTime;
  }
  // Calculate offset in milliseconds
  const offset = (unitNumber - 1) * UNIT_STAGGER_MINUTES * 60 * 1000;
  return new Date(originalAppointmentTime.getTime() + offset);
}

interface OfferData {
  driverId: number;
  appointmentId: number;
  unitNumber: number;
  action: string;
  timestamp: number;
  expired: boolean;
  onfleetTaskId?: string;
}

interface AppointmentData {
  id: number;
  date: string;
  time: string;
  address: string;
  zipcode: string;
  status: string;
  unitNumber: number;
  driverName?: string;
  appointmentType?: string;
  totalEstimatedCost?: number;
}

export default function DriverOfferPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenData, setTokenData] = useState<OfferData | null>(null);
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [paymentEstimate, setPaymentEstimate] = useState<string>('Calculating...');
  const [actionComplete, setActionComplete] = useState(false);
  const [actionResult, setActionResult] = useState<'accepted' | 'declined' | null>(
    null
  );
  const [acceptInProgress, setAcceptInProgress] = useState(false);
  const [declineInProgress, setDeclineInProgress] = useState(false);
  const [jobAlreadyAccepted, setJobAlreadyAccepted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      let localTokenData: OfferData | null = null;
      let shouldFetchAppointmentDetails = false;
      let initialError: string | null = null;
      let isAlreadyAccepted = false;

      try {
        if (!token) {
          setError('Token not found.');
          return;
        }

        // Step 1: Verify Token
        const tokenResponse = await fetch(`/api/driver/verify-token?token=${token}`);
        const tokenResponseData = await tokenResponse.json();

        if (!tokenResponse.ok) {
          initialError = tokenResponseData.error || 'Invalid or expired link.';
          if (
            tokenResponseData.alreadyAccepted &&
            tokenResponseData.appointmentId
          ) {
            isAlreadyAccepted = true;
            localTokenData = {
              driverId: tokenResponseData.driverId,
              appointmentId: tokenResponseData.appointmentId,
              unitNumber: tokenResponseData.unitNumber,
              action: tokenResponseData.action,
              timestamp: tokenResponseData.timestamp,
              onfleetTaskId: tokenResponseData.onfleetTaskId,
              expired: false,
            };
            shouldFetchAppointmentDetails = true;
          } else {
            setError(initialError);
            return;
          }
        } else {
          const isExpired =
            tokenResponseData.timestamp < Date.now() - 2 * 60 * 60 * 1000;
          if (isExpired) {
            initialError =
              'This link has expired. Please check your app for updated job offers.';
            setError(initialError);
            return;
          }
          localTokenData = {
            ...tokenResponseData,
            expired: isExpired,
            onfleetTaskId: tokenResponseData.onfleetTaskId,
          };
          shouldFetchAppointmentDetails = true;
        }

        if (initialError) setError(initialError);
        if (isAlreadyAccepted) setJobAlreadyAccepted(true);
        if (localTokenData) setTokenData(localTokenData);

        // Step 2: Fetch Appointment Details
        if (
          shouldFetchAppointmentDetails &&
          localTokenData?.appointmentId
        ) {
          const appointmentResponse = await fetch(
            `/api/appointments/${localTokenData.appointmentId}/driverJobDetails`
          );

          if (!appointmentResponse.ok) {
            const appointmentErrorData = await appointmentResponse.json();
            setError(
              (prevError) =>
                (isAlreadyAccepted && prevError) ||
                appointmentErrorData.error ||
                'Could not load job details.'
            );
          } else {
            const appointmentData = await appointmentResponse.json();
            const fullAppointmentData = {
              ...appointmentData,
              unitNumber: localTokenData.unitNumber,
            };
            setAppointment(fullAppointmentData);

            // Calculate payment estimate
            if (
              fullAppointmentData.address &&
              fullAppointmentData.appointmentType
            ) {
              try {
                let paymentEstimateText = '';
                if (
                  fullAppointmentData.totalEstimatedCost &&
                  fullAppointmentData.totalEstimatedCost > 0
                ) {
                  paymentEstimateText = `$${Math.round(fullAppointmentData.totalEstimatedCost)}`;
                } else {
                  const paymentBreakdown = await calculateDriverPayment(
                    fullAppointmentData.address,
                    fullAppointmentData.appointmentType
                  );
                  paymentEstimateText = paymentBreakdown.formattedEstimate;
                }
                setPaymentEstimate(paymentEstimateText);
              } catch (paymentError) {
                console.error('Error calculating payment:', paymentError);
                setPaymentEstimate('Estimate unavailable');
              }
            } else {
              setPaymentEstimate('Estimate unavailable');
            }
          }
        }
      } catch (e: any) {
        console.error('Error in offer page fetchData:', e);
        setError((prevError) => prevError || e.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleAction = async (action: 'accept' | 'decline') => {
    try {
      if (action === 'accept') {
        setAcceptInProgress(true);
      } else {
        setDeclineInProgress(true);
      }

      if (!tokenData) {
        setError('Invalid token data');
        setAcceptInProgress(false);
        setDeclineInProgress(false);
        return;
      }

      const response = await fetch('/api/driver-assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId: tokenData.appointmentId,
          driverId: tokenData.driverId,
          onfleetTaskId: tokenData.onfleetTaskId,
          action:
            tokenData.action === 'reconfirm' && action === 'accept'
              ? 'reconfirm'
              : action === 'accept'
                ? 'accept'
                : 'decline',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || `Failed to ${action} job`);
        setAcceptInProgress(false);
        setDeclineInProgress(false);
        return;
      }

      setActionComplete(true);
      setActionResult(action === 'accept' ? 'accepted' : 'declined');
    } catch (error) {
      console.error(`Error ${action}ing job:`, error);
      setError(`An error occurred while ${action}ing the job`);
    } finally {
      setAcceptInProgress(false);
      setDeclineInProgress(false);
    }
  };

  // Rest of the component rendering logic...
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-zinc-900 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-xl text-zinc-950">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error && !jobAlreadyAccepted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md p-6 text-center">
          <div className="mb-4 flex justify-center">
            <ExclamationTriangleIcon className="text-red-500 w-16 h-16" />
          </div>
          <h2 className="text-xl font-bold text-zinc-950 mb-4">Error</h2>
          <div className="bg-red-100 border-red-500 border-2 rounded-md p-4">
            <p className="text-red-500">{error}</p>
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => router.push('/login')}
              className="mt-10 rounded-md py-2.5 px-6 font-semibold bg-zinc-950 text-white text-md hover:bg-zinc-800 active:bg-zinc-700"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (actionComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md p-6 text-center">
          {actionResult === 'accepted' ? (
            <>
              <div className="mb-4 flex justify-center">
                <CheckCircleIcon className="text-emerald-500 w-16 h-16" />
              </div>
              <h2 className="text-xl font-bold text-zinc-950 mb-2">
                {tokenData?.action === 'reconfirm' ? 'Job Reconfirmed' : 'Job Accepted'}
              </h2>
              <p className="text-zinc-950 mb-4">
                {tokenData?.action === 'reconfirm'
                  ? 'Thank you for reconfirming this job with the updated schedule.'
                  : 'Thank you for accepting this job.'} Please check your app for more details.
              </p>
            </>
          ) : (
            <>
              <div className="mb-4 flex justify-center">
                <XCircleIcon className="text-red-500 w-16 h-16" />
              </div>
              <h2 className="text-xl font-bold text-zinc-950 mb-2">Job Declined</h2>
              <p className="text-zinc-950 mb-4">
                You have declined this job. We&apos;ll notify you of future opportunities.
              </p>
            </>
          )}
          <div className="flex justify-center">
            <button
              onClick={() => router.push('/login')}
              className="mt-10 rounded-md py-2.5 px-6 font-semibold bg-zinc-950 text-white text-md hover:bg-zinc-800 active:bg-zinc-700"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md p-6 text-center">
          <div className="mb-4 flex justify-center">
            <ExclamationTriangleIcon className="text-amber-500 w-16 h-16" />
          </div>
          <h2 className="text-xl font-bold text-zinc-950 mb-2">No Job Found</h2>
          <p className="text-zinc-950 mb-4">
            We couldn&apos;t find details for this job. It may have been cancelled or assigned to another driver.
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => router.push('/login')}
              className="block mt-10 rounded-md py-2.5 px-6 font-semibold bg-zinc-950 text-white text-md hover:bg-zinc-800 active:bg-zinc-700"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formattedDate = appointment.date
    ? format(new Date(appointment.date), 'EEEE, MMMM d, yyyy')
    : 'Unknown date';

  const adjustedTime =
    appointment.time && tokenData?.unitNumber
      ? (() => {
          const originalAppointmentTime = new Date(appointment.time);
          const unitSpecificStartTime = getUnitSpecificStartTime(
            originalAppointmentTime,
            tokenData.unitNumber
          );
          const displayTime = new Date(
            unitSpecificStartTime.getTime() - 60 * 60 * 1000
          );
          return format(displayTime, 'h:mm a');
        })()
      : 'Unknown time';

  // Get job description based on appointmentType
  const getJobDescription = (type: string): string => {
    switch (type) {
      case 'Initial Pickup':
        return 'Tow a Boombox storage unit to the customers location. Customer or mover loads the unit. Take a photo of the unit with door open. Customer secures the unit with their padlock. Drive back to the warehouse.';
      case 'Additional Storage':
        return 'Tow a Boombox storage unit to the customers location. Customer or mover loads the unit. Take a photo of the unit with door open. Customer secures the unit with their padlock. Drive back to the warehouse.';
      case 'Access Storage':
        return 'Tow a Boombox storage unit to the customers location. Customer or mover unloads the unit. Take a photo of the unit with door open. Customer secures the unit with their padlock. Drive back to the warehouse.';
      case 'End Storage Term':
        return 'Tow a Boombox storage unit to the customers location. Customer or mover unloads everything from the unit. Take a photo of the unit with door open. Remove padlock and secure door. Drive back to the warehouse.';
      default:
        return 'Job description not available.';
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 mb-8">
      <div className="w-full">
        <div className="bg-zinc-950 p-4 text-white flex items-center rounded-md">
          <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center mr-3">
            <CalendarDaysIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              {appointment.appointmentType || 'Unknown'} request
            </h1>
            <p className="text-sm text-white">
              {tokenData?.action === 'reconfirm'
                ? 'Please reconfirm or decline the updated schedule'
                : 'Please accept or decline'}
            </p>
          </div>
        </div>

        {jobAlreadyAccepted && appointment && (
          <div className="mt-4 p-3 border border-emerald-500 bg-emerald-50 rounded-md">
            <div className="flex items-center">
              <p className="text-sm text-emerald-500">
                {tokenData?.action === 'reconfirm'
                  ? 'You have already reconfirmed this job. Details are shown for your reference.'
                  : 'You have already accepted this job. Details are shown for your reference.'}
              </p>
            </div>
          </div>
        )}

        <div className="py-6 px-2">
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">
            Details
          </h2>
          <div className="space-y-3 pb-4">
            <div>
              <p className="text-sm text-slate-500 mb-1">Pay Est.</p>
              <p className="text-lg text-zinc-900">{paymentEstimate}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Date</p>
              <p className="text-lg text-zinc-900">{formattedDate}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Start Time</p>
              <p className="text-lg text-zinc-900">{adjustedTime}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Customer Location</p>
              <p className="text-lg text-zinc-900">
                {appointment.address || 'Address not available'}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Job description</p>
              <p className="text-zinc-900">
                {getJobDescription(appointment.appointmentType || '')}
              </p>
            </div>
          </div>
          <div className="flex space-x-3 mt-6">
            <button
              onClick={() => handleAction('decline')}
              disabled={declineInProgress || jobAlreadyAccepted}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 font-semibold"
            >
              {declineInProgress ? 'Declining...' : 'Decline'}
            </button>
            <button
              onClick={() => handleAction('accept')}
              disabled={acceptInProgress || jobAlreadyAccepted}
              className="flex-1 px-4 py-2 bg-zinc-950 text-white rounded-md hover:bg-zinc-800 disabled:opacity-50 font-semibold"
            >
              {acceptInProgress
                ? tokenData?.action === 'reconfirm'
                  ? 'Reconfirming...'
                  : 'Accepting...'
                : tokenData?.action === 'reconfirm'
                  ? 'Reconfirm'
                  : 'Accept'}
            </button>
          </div>
          <div className="mt-4 p-3 border border-slate-100 bg-white rounded-md max-w-fit">
            <p className="text-sm text-zinc-500">
              This request will expire in 2 hours from when it was sent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

