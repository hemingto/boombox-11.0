/**
 * @fileoverview Mover change confirmation page - customer approves moving partner replacement
 * @source boombox-10.0/src/app/customer/mover-change/[token]/page.tsx
 * @refactor Migrated to (dashboard)/customer route group with proper error handling
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import {
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  TruckIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { Spinner } from '@/components/ui/primitives/Spinner/Spinner';

interface MoverChangeData {
  appointmentId: number;
  suggestedMovingPartnerId: number;
  originalMovingPartnerId: number;
  timestamp: number;
}

interface AppointmentData {
  id: number;
  date: string;
  time: string;
  address: string;
  appointmentType: string;
  loadingHelpPrice: number;
  insuranceCoverage: string;
  monthlyStorageRate: number;
  numberOfUnits: number;
  quotedPrice: number;
  requestedStorageUnits?: any[];
  originalMover: {
    name: string;
    hourlyRate: number;
  };
  suggestedMover: {
    name: string;
    hourlyRate: number;
    averageRating: number;
  };
}

export default function MoverChangePage() {
  const params = useParams();
  const { token } = params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenData, setTokenData] = useState<MoverChangeData | null>(null);
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [actionComplete, setActionComplete] = useState(false);
  const [actionResult, setActionResult] = useState<'accepted' | 'diy' | null>(
    null
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        if (!token) {
          setError('Invalid link.');
          return;
        }

        const response = await fetch(
          `/api/orders/verify-mover-change-token?token=${token}`
        );
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Invalid or expired link.');
          return;
        }

        const isExpired = data.timestamp < Date.now() - 2 * 60 * 60 * 1000;
        if (isExpired) {
          setError(
            'This link has expired. Please check your messages for updated information.'
          );
          return;
        }

        setTokenData(data);
        setAppointment(data.appointment);
      } catch (e: any) {
        console.error('Error loading mover change request:', e);
        setError(e.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleAction = async (action: 'accept' | 'diy') => {
    if (!tokenData) return;

    setActionInProgress(true);

    try {
      const response = await fetch('/api/orders/mover-change-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          action,
          appointmentId: tokenData.appointmentId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to process your response.');
        return;
      }

      setActionComplete(true);
      setActionResult(action === 'accept' ? 'accepted' : 'diy');
    } catch (e: any) {
      console.error('Error processing response:', e);
      setError(e.message || 'An unexpected error occurred.');
    } finally {
      setActionInProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-tertiary flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-text-secondary">Loading your request...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-tertiary flex items-center justify-center p-4">
        <div className="bg-surface-primary rounded-lg shadow-lg p-6 max-w-md w-full text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-status-error mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-text-primary mb-2">
            Unable to Load Request
          </h1>
          <p className="text-text-secondary">{error}</p>
        </div>
      </div>
    );
  }

  if (actionComplete) {
    return (
      <div className="min-h-screen bg-surface-tertiary flex items-center justify-center p-4">
        <div className="bg-surface-primary rounded-lg shadow-lg p-6 max-w-md w-full text-center">
          {actionResult === 'accepted' ? (
            <>
              <CheckCircleIcon className="h-12 w-12 text-status-success mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-text-primary mb-2">
                Moving Partner Confirmed!
              </h1>
              <p className="text-text-secondary">
                Great! We&apos;ve confirmed {appointment?.suggestedMover.name}{' '}
                as your new moving partner.
              </p>
            </>
          ) : (
            <>
              <TruckIcon className="h-12 w-12 text-status-info mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-text-primary mb-2">
                Switched to DIY Plan
              </h1>
              <p className="text-text-secondary">
                Your appointment has been updated to the DIY plan.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!appointment || !tokenData) {
    return (
      <div className="min-h-screen bg-surface-tertiary flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary">Loading appointment details...</p>
        </div>
      </div>
    );
  }

  const appointmentDate = new Date(appointment.date + 'T' + appointment.time);
  const priceDifference =
    appointment.suggestedMover.hourlyRate - appointment.originalMover.hourlyRate;
  const newQuotedPrice = appointment.quotedPrice + priceDifference;

  return (
    <div className="min-h-screen bg-surface-tertiary py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-surface-primary rounded-lg shadow-lg overflow-hidden">
          <div className="bg-status-bg-warning border-l-4 border-border-warning p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-status-warning" />
              <div className="ml-3">
                <h1 className="text-lg font-medium text-text-primary">
                  Moving Partner Change Required
                </h1>
                <p className="text-sm text-text-secondary">
                  Your original moving partner has cancelled and we need your
                  approval for a replacement.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
                <CalendarDaysIcon className="h-5 w-5 mr-2" />
                Appointment Details
              </h2>
              <div className="bg-surface-tertiary rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Date & Time:</span>
                  <span className="font-medium text-text-primary">
                    {format(appointmentDate, 'EEEE, MMMM d, yyyy')} at{' '}
                    {format(appointmentDate, 'h:mm a')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Address:</span>
                  <span className="font-medium text-text-primary">
                    {appointment.address}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Type:</span>
                  <span className="font-medium text-text-primary">
                    {appointment.appointmentType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Units:</span>
                  <span className="font-medium text-text-primary">
                    {appointment.numberOfUnits}
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
                <UserGroupIcon className="h-5 w-5 mr-2" />
                Moving Partner Change
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-status-bg-error border border-border-error rounded-lg p-4">
                  <h3 className="font-medium text-status-error mb-2">
                    Original (Cancelled)
                  </h3>
                  <p className="text-sm text-text-primary">
                    {appointment.originalMover.name}
                  </p>
                  <p className="text-sm text-text-secondary">
                    ${appointment.originalMover.hourlyRate}/hr
                  </p>
                </div>

                <div className="bg-status-bg-success border border-border-success rounded-lg p-4">
                  <h3 className="font-medium text-status-success mb-2">
                    Suggested Replacement
                  </h3>
                  <p className="text-sm text-text-primary font-medium">
                    {appointment.suggestedMover.name}
                  </p>
                  <p className="text-sm text-text-secondary">
                    ${appointment.suggestedMover.hourlyRate}/hr
                  </p>
                  <p className="text-xs text-text-secondary">
                    ★ {appointment.suggestedMover.averageRating.toFixed(1)}{' '}
                    rating
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                Pricing
              </h2>
              <div className="bg-surface-tertiary rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-text-secondary">
                    Original Loading Help:
                  </span>
                  <span className="text-text-primary">
                    ${appointment.originalMover.hourlyRate}/hr
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">New Loading Help:</span>
                  <span className="text-text-primary">
                    ${appointment.suggestedMover.hourlyRate}/hr
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">
                    Monthly Storage Rate:
                  </span>
                  <span className="text-text-primary">
                    ${appointment.monthlyStorageRate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Insurance Coverage:</span>
                  <span className="text-text-primary">
                    {appointment.insuranceCoverage}
                  </span>
                </div>
                <hr className="my-2 border-border-subtle" />
                <div className="flex justify-between font-semibold">
                  <span className="text-text-primary">New Total Quote:</span>
                  <span
                    className={
                      priceDifference > 0
                        ? 'text-status-error'
                        : priceDifference < 0
                          ? 'text-status-success'
                          : 'text-text-primary'
                    }
                  >
                    ${newQuotedPrice}
                    {priceDifference !== 0 && (
                      <span className="text-sm ml-1">
                        ({priceDifference > 0 ? '+' : ''}${priceDifference})
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => handleAction('accept')}
                disabled={actionInProgress}
                className="flex-1 bg-status-success text-white py-3 px-6 rounded-lg font-medium hover:bg-status-success-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionInProgress
                  ? 'Processing...'
                  : `Accept ${appointment.suggestedMover.name}`}
              </button>

              <button
                onClick={() => handleAction('diy')}
                disabled={actionInProgress}
                className="flex-1 bg-status-info text-white py-3 px-6 rounded-lg font-medium hover:bg-status-info-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionInProgress ? 'Processing...' : 'Switch to DIY Plan'}
              </button>
            </div>

            <p className="text-sm text-text-tertiary text-center mt-4">
              If you don&apos;t respond within 2 hours, we&apos;ll automatically
              assign {appointment.suggestedMover.name} to ensure your appointment
              continues as scheduled.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

