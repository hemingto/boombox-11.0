/**
 * @fileoverview Pre-Pickup Checklist component for customer preparation guidance
 * @source boombox-10.0/src/app/components/checklist/checklistsection.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays an interactive checklist of pre-pickup preparation tasks for customers.
 * Allows users to check off completed items with visual feedback and accessibility support.
 * 
 * API ROUTES UPDATED:
 * - No API routes used (purely UI component with local state)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded zinc-950 with semantic primary color tokens
 * - Replaced slate-100 with surface-tertiary from design system
 * - Applied consistent spacing and typography from design system
 * - Enhanced accessibility with proper ARIA labels and keyboard navigation
 * 
 * @refactor Migrated from boombox-10.0 with design system compliance and accessibility improvements
 */

'use client';

import React from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';
import { useChecklist, type ChecklistItem } from '@/hooks/useChecklist';

interface ChecklistSectionProps {
  className?: string;
  onItemToggle?: (item: ChecklistItem) => void;
  onAllCompleted?: () => void;
}

export function ChecklistSection({ 
  className, 
  onItemToggle, 
  onAllCompleted 
}: ChecklistSectionProps) {
  const { items, toggleItem, handleKeyDown } = useChecklist({
    onItemToggle,
    onAllCompleted,
  });

  return (
    <section 
      className={`mt-12 sm:mt-24 lg:px-16 px-6 sm:mb-48 mb-24 ${className || ''}`}
      aria-labelledby="checklist-title"
    >
      <h1 
        id="checklist-title" 
        className="mb-10 text-text-primary font-poppins"
      >
        Pre-Pickup Checklist
      </h1>
      
      <ul className="space-y-6" role="list">
        {items.map((item) => (
          <li key={item.id} className="flex items-start">
            <button
              className="flex items-start p-6 border border-surface-tertiary rounded-md sm:transform sm:transition-transform sm:duration-300 sm:hover:scale-[102%] cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 w-full text-left"
              onClick={() => toggleItem(item.id)}
              onKeyDown={(e) => handleKeyDown(e, item.id)}
              aria-pressed={item.isChecked}
              aria-describedby={`item-${item.id}-description`}
            >
            {/* Checkbox */}
            <div
              className={`w-6 h-6 shrink-0 mr-4 mt-1.5 rounded-full outline outline-2 flex items-center justify-center transition-colors duration-200 ${
                item.isChecked 
                  ? 'outline-primary bg-primary' 
                  : 'outline-primary bg-surface-primary hover:bg-surface-secondary'
              }`}
              aria-hidden="true"
            >
              {item.isChecked && (
                <CheckIcon 
                  className="w-4 h-4 text-text-inverse" 
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Text Content */}
            <div className="flex-1">
              <h2
                className={`mb-2 font-poppins transition-all duration-200 ${
                  item.isChecked 
                    ? 'line-through text-text-secondary' 
                    : 'text-text-primary'
                }`}
              >
                {item.title}
              </h2>
              <p 
                id={`item-${item.id}-description`}
                className={`text-text-tertiary transition-colors duration-200 ${
                  item.isChecked ? 'text-text-secondary' : ''
                }`}
              >
                {item.description}
              </p>
            </div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default ChecklistSection;
