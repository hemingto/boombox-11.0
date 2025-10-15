/**
 * @fileoverview Storage guidelines list component displaying numbered guidelines with descriptions
 * @source boombox-10.0/src/app/components/storage-guidelines/storageguidelineslist.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays all storage guidelines as numbered cards with titles and detailed descriptions.
 * Each guideline includes rules, best practices, and safety information for using Boombox storage.
 * Data extracted to @/data/storageGuidelines for better maintainability.
 * 
 * API ROUTES UPDATED:
 * - None (presentational component only)
 * 
 * DESIGN SYSTEM UPDATES:
 * - border-slate-100 → border-border (semantic border color)
 * - border-zinc-950 → border-primary (semantic primary color for numbered badges)
 * - text-zinc-950 → text-primary (semantic text color for badges)
 * - Maintains responsive padding (lg:px-16 px-6)
 * - Preserves spacing and layout patterns
 * 
 * @refactor Extracted data to centralized data folder, renamed to PascalCase, applied design system colors,
 * removed hardcoded Help Center link (will be handled by parent component)
 */

import React from 'react';
import Link from 'next/link';
import { storageGuidelines } from '@/data/storageGuidelines';
import type { StorageGuideline } from '@/data/storageGuidelines';

/**
 * StorageGuidelinesList component
 * 
 * Displays a list of storage guidelines as numbered cards.
 * Each guideline includes a number badge, title, and detailed description.
 * The descriptions may contain multiple paragraphs and inline links.
 * 
 * @example
 * ```tsx
 * <StorageGuidelinesList />
 * ```
 */
export function StorageGuidelinesList(): React.ReactElement {
  return (
    <div className="lg:px-16 px-6">
      {storageGuidelines.map((guideline: StorageGuideline) => (
        <article 
          key={guideline.number} 
          className="flex mb-8 p-6 border border-border rounded-md items-start"
          aria-labelledby={`guideline-${guideline.number}-title`}
        >
          {/* Number Badge */}
          <div 
            className="flex mr-4 mt-0.5 items-center justify-center w-8 h-8 rounded-full flex-shrink-0 border-2 border-primary text-primary font-semibold"
            aria-label={`Guideline ${guideline.number}`}
          >
            {guideline.number}
          </div>
          
          {/* Content */}
          <div>
            <h2 id={`guideline-${guideline.number}-title`} className="mb-5">
              {guideline.title}
            </h2>
            <div className="text-text-primary">
              {/* Special handling for guideline 2 to add Help Center link */}
              {guideline.number === 2 ? (
                <>
                  <p className="mb-2">All items need to fit into our standard 5x8 Boombox storage container. The door to your unit must be able to close properly. If the door is unable to be properly closed you must remove the stored item that is preventing the door from closing.</p>
                  <p>If you are unsure if one of your storage items will fit please reach out at our <Link href="/help-center" className="font-bold underline">Help Center</Link>.</p>
                </>
              ) : (
                guideline.description
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

