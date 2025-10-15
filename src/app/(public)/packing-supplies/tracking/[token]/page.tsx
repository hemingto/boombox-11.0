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
          <h1 className="text-2xl font-semibold text-text-primary mb-2">
            Invalid Tracking Link
          </h1>
          <p className="text-text-secondary">{error}</p>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 mb-64">
        {/* Title and date shimmer */}
        <div className="mb-6">
          <div className="h-8 bg-surface-tertiary rounded-sm w-3/4 mb-2 bg-shimmer bg-cover bg-no-repeat animate-shimmer" />
          <div className="h-4 bg-surface-tertiary rounded-sm w-1/2 bg-shimmer bg-cover bg-no-repeat animate-shimmer" />
        </div>

        {/* Map shimmer */}
        <div className="w-full h-32 rounded-md bg-surface-tertiary mb-4 overflow-hidden relative bg-shimmer bg-cover bg-no-repeat animate-shimmer">
          <div className="absolute inset-0 bg-shimmer bg-cover bg-no-repeat animate-shimmer" />
        </div>

        {/* Delivery progress shimmer */}
        <div className="bg-surface-primary border-b border-border-subtle mb-2">
          <div className="px-4 py-4 flex items-center justify-between">
            <div>
              <div className="h-5 bg-surface-tertiary rounded-sm w-48 mb-2 bg-shimmer bg-cover bg-no-repeat animate-shimmer" />
              <div className="h-4 bg-surface-tertiary rounded-sm w-32 bg-shimmer bg-cover bg-no-repeat animate-shimmer" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-20 h-8 bg-surface-tertiary rounded-sm bg-shimmer bg-cover bg-no-repeat animate-shimmer" />
              <div className="w-5 h-5 bg-surface-tertiary rounded-full bg-shimmer bg-cover bg-no-repeat animate-shimmer" />
            </div>
          </div>

          {/* Progress steps shimmer */}
          <div className="px-4 pb-8 pt-4">
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-3 h-3 rounded-full mt-1.5 bg-surface-tertiary bg-shimmer bg-cover bg-no-repeat animate-shimmer" />
                  <div className="flex-1">
                    <div className="h-4 bg-surface-tertiary rounded-sm w-40 mb-2 bg-shimmer bg-cover bg-no-repeat animate-shimmer" />
                    <div className="h-3 bg-surface-tertiary rounded-sm w-24 mb-4 bg-shimmer bg-cover bg-no-repeat animate-shimmer" />
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

