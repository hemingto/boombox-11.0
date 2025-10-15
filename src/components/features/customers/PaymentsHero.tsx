/**
 * @fileoverview PaymentsHero component - Navigation header for payments page
 * @source boombox-10.0/src/app/components/user-page/paymentshero.tsx
 * @refactored Following REFACTOR_PRD.md and component-migration-checklist.md
 */

'use client';

import Link from 'next/link';
import { ChevronLeftIcon } from '@heroicons/react/20/solid';

export interface PaymentsHeroProps {
  userId: string;
}

/**
 * PaymentsHero - Page header with back navigation
 * 
 * Features:
 * - Back button navigation to user dashboard
 * - Page title display
 * - Responsive spacing
 */
export const PaymentsHero: React.FC<PaymentsHeroProps> = ({ userId }) => {
  return (
    <div className="flex flex-col mt-12 sm:mt-24 mb-12 lg:px-16 px-6 max-w-5xl w-full mx-auto">
      <div className="flex items-center gap-2 lg:-ml-10">
        <Link href={`/user-page/${userId}`} aria-label="Back to dashboard">
          <ChevronLeftIcon 
            className="w-8 cursor-pointer shrink-0 text-text-primary hover:text-text-secondary transition-colors"
          />
        </Link>
        <h1 className="text-4xl font-semibold text-text-primary">Payments</h1>
      </div>
    </div>
  );
};

