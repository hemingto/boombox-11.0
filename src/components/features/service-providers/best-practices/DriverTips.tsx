/**
 * @fileoverview Driver and Mover tips component for best practices display
 * @source boombox-10.0/src/app/components/driver/drivertips.tsx
 *
 * COMPONENT FUNCTIONALITY:
 * Displays a list of best practice tips for either drivers or movers with checkmark icons.
 * Used in the best practices section of service provider accounts.
 *
 * DESIGN SYSTEM UPDATES:
 * - Updated colors: `border-slate-100` → `border-border`, `bg-zinc-950` → `bg-primary`, `outline-zinc-950` → `outline-primary`
 * - Applied semantic color tokens for text and backgrounds
 * - Maintained consistent spacing with design system patterns
 *
 * ACCESSIBILITY:
 * - Semantic HTML with proper list structure
 * - Descriptive heading with dynamic userType
 * - Icon has aria-hidden for decorative purposes
 *
 * @refactor Extracted to service-providers/best-practices folder with design system compliance
 */

import React from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';

interface TipItem {
  id: number;
  title: string;
  description?: string;
}

interface DriverTipsProps {
  userType: 'driver' | 'mover';
}

export function DriverTips({ userType }: DriverTipsProps) {
  const driverTips: TipItem[] = [
    {
      id: 1,
      title:
        "Head directly to customer's location, and return directly to warehouse once the job is complete",
    },
    {
      id: 2,
      title: 'Make sure you and your vehicle are clean and professional',
    },
    {
      id: 3,
      title: 'Park in a safe location',
    },
    {
      id: 4,
      title: 'Greet the customer in a professional manner',
    },
    {
      id: 5,
      title:
        "Once the unit is finished being loaded take a photo of the storage unit with the door open with a clear view of the contents inside. Click here for example photo",
    },
    {
      id: 6,
      title:
        "To end the job make sure the door is securely shut and the customer's padlock is added to the front door",
    },
  ];

  const moverTips: TipItem[] = [
    {
      id: 1,
      title: 'Wrap all furniture items in moving blankets and plastic wrap',
    },
    {
      id: 2,
      title: 'Make sure to load heavier items on the base of the storage unit',
    },
    {
      id: 3,
      title:
        'Make sure items are secure and will not shift during the moving process',
    },
    {
      id: 4,
      title: 'Never slide furniture across a floor',
    },
    {
      id: 5,
      title:
        'Think before lifting – assess the weight, shape, and route before moving',
    },
    {
      id: 6,
      title:
        'Use tools – dollies, shoulder straps, sliders, and moving blankets are your best friends',
    },
  ];

  const tips = userType === 'driver' ? driverTips : moverTips;
  const title = userType === 'driver' ? 'Driver Tips' : 'Mover Tips';

  return (
    <div className="mt-4">
      <h2 className="mb-4 text-text-primary">{title}</h2>
      <ul className="space-y-6 p-6 border border-border rounded-md">
        {tips.map((tip) => (
          <li key={tip.id} className="flex items-center gap-2">
            {/* Checkbox Icon */}
            <div
              className="w-5 h-5 shrink-0 mr-4 rounded-full outline outline-2 outline-primary bg-primary flex items-center justify-center"
              aria-hidden="true"
            >
              <CheckIcon className="w-4 h-4 text-text-inverse" />
            </div>

            {/* Text Content */}
            <div>
              <p className="text-text-primary">{tip.title}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

