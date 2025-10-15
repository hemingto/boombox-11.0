/**
 * @fileoverview Admin AI-powered database query page
 * @source boombox-10.0/src/app/admin/ask-database/page.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Natural language database queries using AI
 * - Uses NaturalLanguageQuery component for query interface
 * - Allows admins to ask questions and get data insights
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses semantic color tokens for text
 * - Consistent spacing and layout
 * - Uses existing NaturalLanguageQuery component
 * 
 * @refactor Extracted from inline page implementation
 */

'use client';

import { NaturalLanguageQuery } from '@/components/features/admin/shared';

export function AdminAskDatabasePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-12 sm:mt-24">
      <div className="space-y-12 flex flex-col items-center">
        <h1 className="text-4xl font-semibold text-text-primary">What data do you need?</h1>
        <div className="w-full">
          <NaturalLanguageQuery />
        </div>
      </div>
    </div>
  );
}

