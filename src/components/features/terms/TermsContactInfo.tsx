/**
 * @fileoverview Terms of Service contact information card component
 * @source boombox-10.0/src/app/components/terms/termscontactinfo.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays a contact information card on the Terms of Service page with:
 * - Heading prompting users to get in touch
 * - Phone number with icon (415-322-3135)
 * - Email address with icon (help@boomboxstorage.com)
 * - Card styling with border and padding
 * 
 * API ROUTES UPDATED:
 * - None (this is a presentational component with no API calls)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Changed border-slate-100 to border-border (semantic border color)
 * - Changed text-zinc-950 to text-text-primary (semantic text color)
 * - Maintained existing spacing and layout structure
 * - Uses Heroicons for phone and envelope icons
 * 
 * @refactor
 * - Renamed file from termscontactinfo.tsx to TermsContactInfo.tsx (PascalCase)
 * - Applied design system semantic colors from tailwind.config.ts
 * - Preserved all functionality and layout
 * - Added comprehensive documentation header
 */

'use client';

import { EnvelopeIcon, PhoneIcon } from '@heroicons/react/20/solid';

export function TermsContactInfo() {
  return (
    <div className="w-full">
      <div className="border border-border rounded-md p-6">
        <div className="mb-8">
          <h2 className="mb-2">Need to get in touch?</h2>
          <p>No problem! Contact our support team</p>
        </div>
        <div className="flex mb-4">
          <PhoneIcon className="h-6 w-6 shrink-0 text-text-primary mr-2" />
          <p>415-322-3135</p>
        </div>
        <div className="flex">
          <EnvelopeIcon className="h-6 w-6 shrink-0 text-text-primary mr-2" />
          <p>help@boomboxstorage.com</p>
        </div>
      </div>
    </div>
  );
}

