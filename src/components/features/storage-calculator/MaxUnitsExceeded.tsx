/**
 * @fileoverview Max units exceeded component
 * Displays a message when the user needs more than 4 Boomboxes
 */

'use client';

import { Button } from '@/components/ui/primitives/Button';
import { MAX_UNITS_PER_ORDER } from '@/data/storageCalculatorItems';

interface MaxUnitsExceededProps {
  /** Actual number of units calculated */
  unitsNeeded: number;
  /** Callback when Edit button is clicked */
  onEdit: () => void;
  /** Additional CSS classes */
  className?: string;
}

const SUPPORT_EMAIL = 'help@boomboxstorage.com';

/**
 * Warning view when user needs more than max allowed units
 */
export function MaxUnitsExceeded({
  unitsNeeded,
  onEdit,
  className,
}: MaxUnitsExceededProps) {
  const handleContactUs = () => {
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=Storage Quote Request - ${unitsNeeded} Units`;
  };

  return (
    <div className={`flex flex-col h-full ${className || ''}`}>
      {/* Content area - flex-1 to fill available space and center content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <p className="text-text-primary text-sm mb-2">Estimate</p>
        <div className="flex items-center mb-2 justify-center bg-slate-100 rounded-full p-3 w-24 h-24">
          <p className="text-6xl font-bold text-text-primary mt-1">
            {unitsNeeded}+
          </p>
        </div>
        <p className="text-text-primary text-lg mb-6">Boomboxes</p>

        <div className="border-border border rounded-md p-3 max-w-sm">
          <p className="text-text-primary text-sm mb-2">
            Our max per order is {MAX_UNITS_PER_ORDER} units
          </p>
          <p className="text-sm">
            For larger storage needs, please contact us at{' '}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-primary hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
          </p>
        </div>
      </div>

      {/* Action buttons - flex-shrink-0 to stay at bottom */}
      <div className="flex items-center gap-3 mt-4 pt-4 flex-shrink-0">
        <Button variant="secondary" onClick={onEdit} className="w-1/3">
          Edit
        </Button>
        <Button variant="primary" onClick={handleContactUs} className="w-2/3">
          Contact Us
        </Button>
      </div>
    </div>
  );
}

export default MaxUnitsExceeded;
