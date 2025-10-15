/**
 * @fileoverview Appointment Loading Skeleton - Enhanced loading state for appointment data
 * @source Created for boombox-11.0 edit appointment functionality
 * 
 * COMPONENT FUNCTIONALITY:
 * Provides a realistic loading skeleton that matches the appointment form structure,
 * giving users visual feedback about what content is loading and improving perceived performance.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses semantic skeleton classes and design system spacing
 * - Implements proper ARIA attributes for accessibility
 * - Follows consistent animation patterns
 * 
 * @refactor Created as part of enhanced loading states for edit appointment feature
 */

'use client';

import React from 'react';

interface AppointmentLoadingSkeletonProps {
  className?: string;
}

export function AppointmentLoadingSkeleton({ className = '' }: AppointmentLoadingSkeletonProps) {
  return (
    <div 
      className={`md:flex gap-x-8 lg:gap-x-16 mt-12 sm:mt-24 lg:px-16 px-6 justify-center mb-10 sm:mb-64 items-start ${className}`}
      role="status"
      aria-label="Loading appointment details"
    >
      {/* Form Content Skeleton */}
      <div className="w-full basis-1/2">
        <div className="max-w-lg mx-auto md:mx-0 md:ml-auto">
          {/* Header Skeleton */}
          <header className="mb-12">
            <div className="mb-4">
              <div className="skeleton w-48 h-6 rounded-full"></div>
            </div>
            <div className="skeleton w-80 h-10 mb-2"></div>
            <div className="skeleton w-96 h-5"></div>
          </header>
          
          {/* Form Section 1 */}
          <section className="mb-10">
            <div className="skeleton w-64 h-6 mb-4"></div>
            <div className="space-y-3">
              <div className="skeleton w-full h-12 rounded-lg"></div>
              <div className="skeleton w-full h-12 rounded-lg"></div>
            </div>
          </section>
          
          {/* Form Section 2 */}
          <section className="mb-10">
            <div className="skeleton w-48 h-6 mb-4"></div>
            <div className="skeleton w-full h-16 rounded-lg"></div>
          </section>
          
          {/* Form Section 3 */}
          <section className="mb-10">
            <div className="skeleton w-56 h-6 mb-4"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="skeleton w-full h-20 rounded-lg"></div>
              <div className="skeleton w-full h-20 rounded-lg"></div>
            </div>
          </section>
          
          {/* Form Section 4 */}
          <section className="mb-10">
            <div className="skeleton w-40 h-6 mb-4"></div>
            <div className="space-y-2">
              <div className="skeleton w-full h-8"></div>
              <div className="skeleton w-full h-8"></div>
              <div className="skeleton w-3/4 h-8"></div>
            </div>
          </section>
        </div>
      </div>
      
      {/* Quote Sidebar Skeleton */}
      <div className="basis-1/2 md:mr-auto sticky top-5 max-w-md">
        <div className="card p-6">
          {/* Quote Header */}
          <div className="mb-6">
            <div className="skeleton w-32 h-8 mb-2"></div>
            <div className="skeleton w-48 h-5"></div>
          </div>
          
          {/* Quote Details */}
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center">
              <div className="skeleton w-20 h-4"></div>
              <div className="skeleton w-16 h-4"></div>
            </div>
            <div className="flex justify-between items-center">
              <div className="skeleton w-24 h-4"></div>
              <div className="skeleton w-20 h-4"></div>
            </div>
            <div className="flex justify-between items-center">
              <div className="skeleton w-28 h-4"></div>
              <div className="skeleton w-24 h-4"></div>
            </div>
            <div className="flex justify-between items-center">
              <div className="skeleton w-16 h-4"></div>
              <div className="skeleton w-12 h-4"></div>
            </div>
          </div>
          
          {/* Divider */}
          <div className="border-t border-border my-4"></div>
          
          {/* Total */}
          <div className="flex justify-between items-center mb-6">
            <div className="skeleton w-20 h-6"></div>
            <div className="skeleton w-24 h-6"></div>
          </div>
          
          {/* Button */}
          <div className="skeleton w-full h-12 rounded-lg"></div>
        </div>
        
        {/* Help Section */}
        <div className="mt-6 px-4">
          <div className="flex items-center">
            <div className="skeleton w-8 h-8 rounded-full mr-4 shrink-0"></div>
            <div className="space-y-2 flex-1">
              <div className="skeleton w-full h-3"></div>
              <div className="skeleton w-3/4 h-3"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Screen Reader Announcement */}
      <div className="sr-only" aria-live="polite">
        Loading appointment details, please wait...
      </div>
    </div>
  );
}

export default AppointmentLoadingSkeleton;
