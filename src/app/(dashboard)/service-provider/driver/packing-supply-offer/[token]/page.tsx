/**
 * @fileoverview Driver packing supply route offer page
 * @source boombox-10.0/src/app/driver/packing-supply-offer/[token]/page.tsx
 * @refactor Migrated to (dashboard)/service-provider route group with JWT token validation
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  TruckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  MapPinIcon,
  ClockIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

interface OfferTokenData {
  driverId: number;
  routeId: string;
  expiresAt: number;
  iat: number;
}

interface RouteOffer {
  routeId: string;
  deliveryDate: string;
  totalStops: number;
  estimatedPayout: number;
  estimatedMiles: number;
  estimatedDuration: string;
  orders: {
    id: number;
    deliveryAddress: string;
    contactName: string;
    totalPrice: number;
  }[];
}

export default function PackingSupplyOfferPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenData, setTokenData] = useState<OfferTokenData | null>(null);
  const [routeOffer, setRouteOffer] = useState<RouteOffer | null>(null);
  const [actionComplete, setActionComplete] = useState(false);
  const [actionResult, setActionResult] = useState<'accepted' | 'declined' | null>(
    null
  );
  const [acceptInProgress, setAcceptInProgress] = useState(false);
  const [declineInProgress, setDeclineInProgress] = useState(false);
  const [offerAlreadyHandled, setOfferAlreadyHandled] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        if (!token || typeof token !== 'string') {
          setError('Invalid offer link.');
          return;
        }

        // Decode JWT token
        let decodedToken: OfferTokenData;
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length !== 3) {
            throw new Error('Invalid JWT format');
          }

          const payload = tokenParts[1];
          const paddedPayload = payload + '='.repeat((4 - (payload.length % 4)) % 4);
          const decoded = JSON.parse(atob(paddedPayload));

          decodedToken = decoded as OfferTokenData;
          if (!decodedToken || !decodedToken.routeId || !decodedToken.driverId) {
            throw new Error('Invalid token structure');
          }
        } catch (e) {
          setError('Invalid offer link format.');
          return;
        }

        // Check if token has expired
        const now = Date.now();
        if (decodedToken.expiresAt && now > decodedToken.expiresAt) {
          setError('This offer has expired. Please check for new delivery opportunities.');
          return;
        }

        setTokenData(decodedToken);

        // Fetch route details
        const response = await fetch(
          `/api/onfleet/packing-supplies/route-details/${decodedToken.routeId}?token=${token}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 409) {
            setOfferAlreadyHandled(true);
            setError(
              errorData.message ||
                'This route has already been accepted by another driver.'
            );
          } else {
            setError(errorData.message || 'Could not load route details.');
          }
          return;
        }

        const routeData = await response.json();
        setRouteOffer(routeData);
      } catch (e: any) {
        console.error('Error loading packing supply offer:', e);
        setError(e.message || 'An unexpected error occurred while loading the offer.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Update countdown timer
  useEffect(() => {
    if (!tokenData?.expiresAt) return;

    const updateTimer = () => {
      const now = Date.now();
      const timeLeft = Math.floor((tokenData.expiresAt - now) / 1000);

      if (timeLeft <= 0) {
        setTimeRemaining('Expired');
        setError('This offer has expired.');
        return;
      }

      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [tokenData?.expiresAt]);

  const handleAction = async (action: 'accept' | 'decline') => {
    try {
      if (action === 'accept') {
        setAcceptInProgress(true);
      } else {
        setDeclineInProgress(true);
      }

      if (!tokenData || !token) {
        setError('Invalid offer data');
        return;
      }

      const response = await fetch('/api/onfleet/packing-supplies/driver-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          action: action,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        setError(responseData.message || `Failed to ${action} route offer`);
        return;
      }

      setActionComplete(true);
      setActionResult(action === 'accept' ? 'accepted' : 'declined');
    } catch (error) {
      console.error(`Error ${action}ing route:`, error);
      setError(`An error occurred while ${action}ing the route offer`);
    } finally {
      setAcceptInProgress(false);
      setDeclineInProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-zinc-900 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-xl text-zinc-950">Loading route details...</p>
        </div>
      </div>
    );
  }

  if (error && !offerAlreadyHandled) {
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
              Back to App
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
              <h2 className="text-xl font-bold text-zinc-950 mb-2">Route Accepted!</h2>
              <p className="text-zinc-950 mb-4">
                Thank you for accepting this delivery route. You&apos;ll receive the delivery details shortly.
              </p>
            </>
          ) : (
            <>
              <div className="mb-4 flex justify-center">
                <XCircleIcon className="text-red-500 w-16 h-16" />
              </div>
              <h2 className="text-xl font-bold text-zinc-950 mb-2">Route Declined</h2>
              <p className="text-zinc-950 mb-4">
                You have declined this delivery route. We&apos;ll notify you of future opportunities.
              </p>
            </>
          )}
          <button
            onClick={() => router.push('/login')}
            className="mt-6 rounded-md py-2.5 px-6 font-semibold bg-zinc-950 text-white text-md hover:bg-zinc-800 active:bg-zinc-700"
          >
            Back to App
          </button>
        </div>
      </div>
    );
  }

  if (!routeOffer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md p-6 text-center">
          <div className="mb-4 flex justify-center">
            <ExclamationTriangleIcon className="text-amber-500 w-16 h-16" />
          </div>
          <h2 className="text-xl font-bold text-zinc-950 mb-2">Route Not Found</h2>
          <p className="text-zinc-950 mb-4">
            We couldn&apos;t find details for this delivery route.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="mt-10 rounded-md py-2.5 px-6 font-semibold bg-zinc-950 text-white text-md hover:bg-zinc-800 active:bg-zinc-700"
          >
            Back to App
          </button>
        </div>
      </div>
    );
  }

  const formattedDate = routeOffer.deliveryDate
    ? format(new Date(routeOffer.deliveryDate), 'EEEE, MMMM d, yyyy')
    : 'Unknown date';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 mb-8">
      <div className="w-full">
        <div className="bg-zinc-950 p-4 text-white flex items-center rounded-md">
          <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center mr-3">
            <TruckIcon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Packing Supply Delivery</h1>
            <p className="text-sm text-white">Please accept or decline this route</p>
          </div>
          {timeRemaining && (
            <div className="text-right">
              <p className="text-xs text-zinc-300">Expires in</p>
              <p className="text-sm font-bold text-white">{timeRemaining}</p>
            </div>
          )}
        </div>

        {offerAlreadyHandled && (
          <div className="mt-4 p-3 border border-amber-500 bg-amber-50 rounded-md">
            <p className="text-sm text-amber-700">
              This route has already been handled. Details are shown for your reference.
            </p>
          </div>
        )}

        <div className="py-6 px-2">
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">
            Route Overview
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <CurrencyDollarIcon className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-sm text-slate-500">Estimated Pay</p>
                <p className="text-lg font-semibold text-zinc-900">
                  ${routeOffer.estimatedPayout}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <MapPinIcon className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-slate-500">Total Stops</p>
                <p className="text-lg font-semibold text-zinc-900">
                  {routeOffer.totalStops}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <ClockIcon className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-slate-500">Est. Duration</p>
                <p className="text-lg font-semibold text-zinc-900">
                  {routeOffer.estimatedDuration}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <TruckIcon className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-slate-500">Distance</p>
                <p className="text-lg font-semibold text-zinc-900">
                  {routeOffer.estimatedMiles} mi
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm text-slate-500 mb-1">Delivery Date</p>
            <p className="text-lg text-zinc-900 mb-6">{formattedDate}</p>
          </div>

          <h3 className="text-md font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2">
            Delivery Stops
          </h3>

          <div className="space-y-3 mb-6">
            {routeOffer.orders.map((order, index) => (
              <div key={order.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="w-6 h-6 bg-zinc-900 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                        {index + 1}
                      </span>
                      <p className="font-semibold text-zinc-900">{order.contactName}</p>
                    </div>
                    <p className="text-sm text-gray-600 ml-8">{order.deliveryAddress}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-zinc-900">
                      ${order.totalPrice}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={() => handleAction('decline')}
              disabled={declineInProgress || offerAlreadyHandled}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 font-semibold"
            >
              {declineInProgress ? 'Declining...' : 'Decline Route'}
            </button>
            <button
              onClick={() => handleAction('accept')}
              disabled={acceptInProgress || offerAlreadyHandled}
              className="flex-1 px-4 py-3 bg-zinc-950 text-white rounded-md hover:bg-zinc-800 disabled:opacity-50 font-semibold"
            >
              {acceptInProgress ? 'Accepting...' : 'Accept Route'}
            </button>
          </div>

          <div className="mt-4 p-3 border border-slate-100 bg-white rounded-md">
            <p className="text-sm text-zinc-500">
              This route offer expires 20 minutes after being sent. Payment will be
              processed after all deliveries are completed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

