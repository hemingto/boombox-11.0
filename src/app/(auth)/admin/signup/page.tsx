/**
 * @fileoverview Admin signup page (invitation-only)
 * @source boombox-10.0/src/app/admin/signup/page.tsx
 * @refactor Migrated to (auth)/admin route group for proper layout separation
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Admin Signup | Boombox Storage',
  description: 'Admin registration for invited administrators.',
  robots: 'noindex, nofollow', // Don't index admin pages
};

/**
 * @REFACTOR-P9-TEMP: Admin signup component not yet migrated
 * Source: boombox-10.0/src/app/admin/signup/page.tsx
 * TODO: Migrate AdminSignupForm component to features/admin/
 */
function AdminSignupPlaceholder() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Signup
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Invitation-only registration for administrators
          </p>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-md">
          <p className="text-gray-700">
            Admin signup component pending migration from Phase 5.
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Source: boombox-10.0/src/app/admin/signup/page.tsx
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminSignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminSignupPlaceholder />
    </Suspense>
  );
}

