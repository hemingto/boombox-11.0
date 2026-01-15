/**
 * @fileoverview Packing supply tracking page with JWT token
 * @source boombox-10.0/src/app/packing-supplies/tracking/[token]/page.tsx
 * @refactor Migrated to (public) route group with proper loading states
 */

'use client';

import { useEffect, useState, use } from 'react';
import {
  PackingSupplyTracking,
} from '@/components/features/packing-supplies';

// Define a type for the resolved params for clarity
type PageParams = {
  token: string;
};

export default function PackingSupplyTrackingPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const actualParams = use(params);
  const [orderData, setOrderData] = useState<any | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        const response = await fetch(
          `/api/admin/packing-supply-tracking/verify`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: actualParams.token }),
          }
        );

        if (!response.ok) {
          throw new Error('Invalid or expired tracking link');
        }

        const data = await response.json();
        setOrderData(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load tracking data'
        );
      }
    };

    fetchOrderData();
  }, [actualParams.token]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-zinc-950 mb-2">
            Invalid Tracking Link
          </h1>
          <p className="text-zinc-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 mb-64">
        {/* Title and date skeleton */}
        <div className="mb-6">
          <div className="h-8 bg-slate-200 rounded-sm w-3/4 mb-2 animate-pulse" />
          <div className="h-4 bg-slate-200 rounded-sm w-1/2 animate-pulse" />
        </div>

        {/* Map skeleton */}
        <div className="w-full h-32 rounded-md bg-slate-200 mb-4 animate-pulse" />

        {/* Delivery progress skeleton */}
        <div className="bg-white border-b border-slate-100 mb-2">
          <div className="px-4 py-4 flex items-center justify-between">
            <div>
              <div className="h-5 bg-slate-200 rounded-sm w-48 mb-2 animate-pulse" />
              <div className="h-4 bg-slate-200 rounded-sm w-32 animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-20 h-8 bg-slate-200 rounded-sm animate-pulse" />
              <div className="w-5 h-5 bg-slate-200 rounded-full animate-pulse" />
            </div>
          </div>

          {/* Progress steps skeleton */}
          <div className="px-4 pb-8 pt-4">
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-3 h-3 rounded-full mt-1.5 bg-slate-200 animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded-sm w-40 mb-2 animate-pulse" />
                    <div className="h-3 bg-slate-200 rounded-sm w-24 mb-4 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <PackingSupplyTracking {...orderData} />;
}

