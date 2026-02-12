/**
 * @fileoverview Calculator results component
 * Displays the estimated number of Boomboxes needed
 */

'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/primitives/Button';

interface CalculatorResultsProps {
  /** Number of Boomboxes needed */
  unitsNeeded: number;
  /** Total volume of items in cubic inches */
  totalVolume: number;
  /** Callback when Edit button is clicked */
  onEdit: () => void;
  /** Additional CSS classes */
  className?: string;
}

/** Convert cubic inches to cubic feet */
function formatVolume(cubicInches: number): string {
  const cubicFeet = cubicInches / 1728;
  return cubicFeet.toFixed(1);
}

/**
 * Results view showing estimated Boomboxes needed
 */
export function CalculatorResults({
  unitsNeeded,
  totalVolume,
  onEdit,
  className,
}: CalculatorResultsProps) {
  const router = useRouter();

  const handleGetQuote = () => {
    const queryParams = new URLSearchParams({
      storageUnitCount: unitsNeeded.toString(),
    }).toString();

    router.push(`/get-quote?${queryParams}`);
  };

  return (
    <div className={`flex flex-col h-full ${className || ''}`}>
      {/* Content area - flex-1 to fill available space and center content */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <p className="text-text-primary text-md mb-2">Estimate</p>
        <div className="flex items-center mb-2 justify-center bg-slate-100 rounded-full p-3 w-20 h-20">
          <p className="text-6xl font-bold text-text-primary mt-1">
            {unitsNeeded}
          </p>
        </div>
        <p className="text-text-primary text-lg mb-6">
          {unitsNeeded === 1 ? 'Boombox' : 'Boomboxes'}
        </p>
        <div className="border-border border rounded-md p-3 max-w-sm">
          <p className="text-text-primary text-sm text-center">
            We calculated the total volume of your items at{' '}
            {formatVolume(totalVolume)} cubic feet, which should all fit into{' '}
            {unitsNeeded} {unitsNeeded === 1 ? 'Boombox' : 'Boomboxes'}.
          </p>
        </div>
      </div>

      {/* Action buttons - flex-shrink-0 to stay at bottom */}
      <div className="flex items-center gap-3 mt-4 pt-4 flex-shrink-0">
        <Button variant="secondary" onClick={onEdit} className="w-1/3">
          Edit
        </Button>
        <Button variant="primary" onClick={handleGetQuote} className="w-2/3">
          Get Quote
        </Button>
      </div>
    </div>
  );
}

export default CalculatorResults;
