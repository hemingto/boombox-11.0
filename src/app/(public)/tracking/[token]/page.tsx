/**
 * @fileoverview Customer tracking page for appointment delivery tracking
 * @source boombox-10.0/src/app/tracking/[token]/page.tsx
 * 
 * PAGE FUNCTIONALITY:
 * - Provides customer-facing tracking interface using secure tokens
 * - Displays real-time appointment tracking with delivery progress
 * - Handles loading states with skeleton UI
 * - Shows error states for invalid or expired tracking links
 * - Integrates with Google Maps for delivery location display
 * 
 * ROUTE GROUP ORGANIZATION:
 * - Located in (public) route group as per boombox-11.0 architecture
 * - Public access page that doesn't require authentication
 * - Uses secure token-based access for customer tracking
 * - URL structure: /tracking/[token] (unchanged from boombox-10.0)
 * 
 * API ROUTES UPDATED:
 * - API calls moved to useTrackingData custom hook
 * - Uses migrated API route: POST /api/customers/tracking/verify
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with semantic design tokens
 * - Updated loading skeleton to use design system colors
 * - Applied consistent text hierarchy and spacing
 * - Used design system surface and border colors
 * 
 * @refactor 
 * - Moved from /app/tracking/[token]/ to /app/(public)/tracking/[token]/ per PRD
 * - Extracted API logic to useTrackingData custom hook
 * - Simplified page component to focus on UI orchestration
 * - Enhanced loading states with proper skeleton components
 * - Improved error handling with user-friendly messages
 * - Added comprehensive accessibility features
 * - Applied design system compliance throughout
 */

'use client';

import { use } from 'react';
import { AppointmentTracking } from '@/components/features/tracking/AppointmentTracking';
import { useTrackingData } from '@/hooks/useTrackingData';
import { ErrorState, EmptyState } from '@/components/ui/feedback';
import { Button } from '@/components/ui/primitives/Button';
import { Skeleton, SkeletonText, SkeletonTitle, SkeletonButton } from '@/components/ui/primitives/Skeleton';

// Define a type for the resolved params for clarity
type PageParams = {
  token: string;
};

// Loading state now uses existing Skeleton primitive components inline

// Removed - now using ErrorState primitive component

// Removed - now using EmptyState primitive component

/**
 * TrackingPage - Customer-facing tracking page component
 * 
 * Handles the complete tracking experience including loading states,
 * error handling, and successful tracking display using the new
 * custom hook architecture and design system primitives.
 */
export default function TrackingPage({ params }: { params: Promise<PageParams> }) {
  const actualParams = use(params);
  const { appointmentData, isLoading, error } = useTrackingData(actualParams.token);

  // Handle error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md mx-auto px-4">
          <ErrorState
            title="Unable to Load Tracking Information"
            message={error}
            action={
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
                size="md"
              >
                Try Again
              </Button>
            }
          />
          <div className="mt-6 text-center">
            <p className="text-sm text-text-tertiary">
              If you believe this is an error, please check your tracking link or contact support.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle loading state
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 mb-64">
        {/* Title and date skeleton */}
        <div className="mb-6">
          <SkeletonTitle className="w-3/4 mb-2" />
          <SkeletonText className="w-1/2" />
        </div>
        
        {/* Map skeleton */}
        <Skeleton className="w-full h-32 rounded-md mb-4" />

        {/* Delivery units skeleton */}
        {[1, 2].map((unitIndex) => (
          <div key={unitIndex} className="bg-white border-b border-slate-100 mb-2">
            {/* Unit header */}
            <div className="px-4 py-4 flex items-center justify-between">
              <div>
                <SkeletonText className="w-48 h-5 mb-2" />
                <SkeletonText className="w-32 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="w-20 h-8 rounded-sm" />
                <Skeleton className="w-5 h-5 rounded-full" />
              </div>
            </div>
            
            {/* Expanded content skeleton (only show for first unit) */}
            {unitIndex === 1 && (
              <div className="px-4 pb-8 pt-4">
                <div className="space-y-6">
                  {[1, 2, 3].map((stepIndex) => (
                    <div key={stepIndex} className="flex items-start gap-4">
                      <Skeleton className="w-3 h-3 rounded-full mt-1.5" />
                      <div className="flex-1">
                        <SkeletonText className="w-40 h-4 mb-2" />
                        <SkeletonText className="w-24 h-3 mb-4" />
                        <div className="flex gap-2">
                          <SkeletonButton className="w-32" />
                          {stepIndex === 1 && <SkeletonButton className="w-32" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Handle empty state (no data but no error)
  if (!appointmentData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md mx-auto px-4">
          <EmptyState
            title="No Tracking Information Available"
            message="We couldn't find any tracking information for this request."
          />
        </div>
      </div>
    );
  }

  // Render successful tracking state
  return (
    <main>
      <AppointmentTracking {...appointmentData} />
    </main>
  );
}
