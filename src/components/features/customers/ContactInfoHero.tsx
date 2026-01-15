/**
 * @fileoverview ContactInfoHero component - Navigation header for contact info page
 * @source boombox-10.0/src/app/components/user-page/contactinfohero.tsx
 * @refactored Following REFACTOR_PRD.md and component-migration-checklist.md
 */

'use client';

import Link from 'next/link';
import { ChevronLeftIcon } from '@heroicons/react/20/solid';

export interface ContactInfoHeroProps {
 userId: string;
}

/**
 * ContactInfoHero - Page header with back navigation
 * 
 * Features:
 * - Back button navigation to user dashboard
 * - Page title display
 * - Responsive spacing
 */
export const ContactInfoHero: React.FC<ContactInfoHeroProps> = ({ userId }) => {
 return (
  <div className="flex flex-col mt-12 sm:mt-24 mb-12 lg:px-16 px-6 max-w-5xl w-full mx-auto">
   <div className="flex items-center gap-2 lg:-ml-10">
    <Link 
     href={`/customer/${userId}`} 
     aria-label="Back to dashboard"
     className="p-1 -mr-1 rounded-full hover:bg-surface-tertiary text-text-secondary hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2"
    >
     <ChevronLeftIcon 
      className="w-8 h-8"
      aria-hidden="true"
     />
    </Link>
    <h1 className="text-4xl font-semibold text-text-primary">Account info</h1>
   </div>
  </div>
 );
};

