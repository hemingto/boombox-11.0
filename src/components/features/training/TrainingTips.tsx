/**
 * @fileoverview Training tips component for drivers and movers with best practices guidance
 * @source boombox-10.0/src/app/components/driver/drivertips.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays role-specific training tips and best practices for drivers and movers.
 * Supports dynamic content switching based on userType prop (driver/mover).
 * Provides checklist-style UI with visual indicators for completed items.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with semantic design system tokens
 * - Updated border colors from border-slate-100 to border-border
 * - Updated background colors from bg-zinc-950 to bg-primary
 * - Updated outline colors from outline-zinc-950 to outline-primary
 * - Applied consistent spacing and typography from design system
 * 
 * @refactor Renamed from DriverTips to TrainingTips for better semantic clarity
 * @refactor Moved to training domain as it serves both drivers and movers
 * @refactor Applied design system color tokens and accessibility improvements
 */

import React from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';

interface TipItem {
  id: number;
  title: string;
  description?: string;
}

interface TrainingTipsProps {
  userType: 'driver' | 'mover';
  className?: string;
}

export function TrainingTips({ userType, className = '' }: TrainingTipsProps) {
  const driverTips: TipItem[] = [
    {
      id: 1,
      title: "Head directly to customer's location, and return directly to warehouse once the job is complete",
    },
    {
      id: 2,
      title: "Make sure you and your vehicle are clean and professional",
    },
    {
      id: 3,
      title: "Park in a safe location",
    },
    {
      id: 4,
      title: "Greet the customer in a professional manner",
    },
    {
      id: 5,
      title: "Once the unit is finished being loaded take a photo of the storage unit with the door open with a clear view of the contents inside. Click here for example photo",
    },
    {
      id: 6,
      title: "To end the job make sure the door is securely shut and the customer's padlock is added to the front door",
    },
  ];

  const moverTips: TipItem[] = [
    {
      id: 1,
      title: "Wrap all furniture items in moving blankets and plastic wrap",
    },
    {
      id: 2,
      title: "Make sure to load heavier items on the base of the storage unit",
    },
    {
      id: 3,
      title: "Make sure items are secure and will not shift during the moving process",
    },
    {
      id: 4,
      title: "Never slide furniture across a floor",
    },
    {
      id: 5,
      title: "Think before lifting – assess the weight, shape, and route before moving",
    },
    {
      id: 6,
      title: "Use tools – dollies, shoulder straps, sliders, and moving blankets are your best friends",
    },
  ];

  const tips = userType === 'driver' ? driverTips : moverTips;
  const title = userType === 'driver' ? 'Driver Tips' : 'Mover Tips';

  return (
    <section className={`mt-4 ${className}`} aria-labelledby="training-tips-heading">
      <h2 id="training-tips-heading" className="mb-4 text-text-primary">
        {title}
      </h2>
      <ul 
        className="space-y-6 p-6 border border-border rounded-md bg-surface-primary"
        role="list"
        aria-label={`${title} checklist`}
      >
        {tips.map((tip) => (
          <li
            key={tip.id}
            className="flex items-center gap-2"
            role="listitem"
          >
            {/* Checkbox Icon */}
            <div
              className="w-5 h-5 shrink-0 mr-4 rounded-full outline outline-2 outline-primary bg-primary flex items-center justify-center"
              role="img"
              aria-label="Completed tip indicator"
            >
              <CheckIcon className="w-4 h-4 text-text-inverse" aria-hidden="true" />
            </div>

            {/* Text Content */}
            <div className="flex-1">
              <p className="text-text-primary leading-relaxed">
                {tip.title}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default TrainingTips;
