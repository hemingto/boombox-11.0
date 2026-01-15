/**
 * @fileoverview Labor Plan Details - Informational component displaying the differences between DIY and Full Service plans
 * @source boombox-10.0/src/app/components/reusablecomponents/laborplandetails.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays a side-by-side comparison of the "Do It Yourself Plan" and "Full Service Plan" options.
 * Shows what's included in each plan with bullet points and clear descriptions.
 * Used in quote forms and appointment booking flows to help users understand their labor options.
 * 
 * API ROUTES UPDATED:
 * None - This is a pure UI component with no API dependencies
 * 
 * DESIGN SYSTEM UPDATES:
 * - Updated colors to use design system tokens (text-primary, text-secondary, border)
 * - Applied consistent spacing using design system patterns
 * - Updated border styles to use semantic border colors
 * - Improved typography hierarchy with design system text colors
 * - Enhanced accessibility with proper semantic structure
 * 
 * @refactor Migrated from boombox-10.0 with design system compliance and improved accessibility
 */

import { LABOR_PLAN_TYPES } from '@/data/laborOptions';

interface LaborPlanDetailsProps {
  className?: string;
}

const LaborPlanDetails: React.FC<LaborPlanDetailsProps> = ({ 
  className = '' 
}) => {
  return (
    <div className={`flex flex-row justify-around gap-3 ${className}`}>
      {/* Do It Yourself Plan */}
      <div className="basis-1/2 pl-4 pt-4 pb-4">
        <h3 className="py-2 pl-3 text-text-primary">
          {LABOR_PLAN_TYPES.DO_IT_YOURSELF}
        </h3>
        <ul 
          className="text-xs sm:text-sm list-none border-r border-border p-3"
          role="list"
          aria-label="Do It Yourself Plan features"
        >
          <li className="pb-2 flex items-start" role="listitem">
            <span className="mr-2 text-text-secondary" aria-hidden="true">•</span>
            <span className="text-text-primary">
              We&apos;ll deliver your storage unit to your pickup address
            </span>
          </li>
          <li className="pb-2 flex items-start" role="listitem">
            <span className="mr-2 text-text-secondary" aria-hidden="true">•</span>
            <span className="text-text-primary">
              We&apos;ll wait for Free for 1 full hour while you pack your unit. It&apos;s $50/hr after your 1st hour.
            </span>
          </li>
          <li className="pb-2 flex items-start" role="listitem">
            <span className="mr-2 text-text-secondary" aria-hidden="true">•</span>
            <span className="text-text-primary">
              We&apos;ll return your storage unit back to our storage facility
            </span>
          </li>
          <li className="flex items-start" role="listitem">
            <span className="mr-2 text-text-secondary" aria-hidden="true">•</span>
            <span className="text-text-primary">
              Loading help, disassembly, packing, and supplies are not included
            </span>
          </li>
        </ul>
      </div>

      {/* Full Service Plan */}
      <div className="basis-1/2 pr-4 pt-4 pb-4">
        <h3 className="py-2 pl-3 text-text-primary">
          {LABOR_PLAN_TYPES.FULL_SERVICE}
        </h3>
        <ul 
          className="text-xs sm:text-sm list-none p-3"
          role="list"
          aria-label="Full Service Plan features"
        >
          <li className="pb-2 flex items-start" role="listitem">
            <span className="mr-2 text-text-secondary" aria-hidden="true">•</span>
            <span className="text-text-primary">
              We&apos;ll deliver your storage unit to your pickup address
            </span>
          </li>
          <li className="pb-2 flex items-start" role="listitem">
            <span className="mr-2 text-text-secondary" aria-hidden="true">•</span>
            <span className="text-text-primary">
              We&apos;ll wrap furniture, pack boxes, and disassemble furniture. Then load your items into your storage unit.
            </span>
          </li>
          <li className="pb-2 flex items-start" role="listitem">
            <span className="mr-2 text-text-secondary" aria-hidden="true">•</span>
            <span className="text-text-primary">
              We&apos;ll provide basic packing supplies
            </span>
          </li>
          <li className="flex items-start" role="listitem">
            <span className="mr-2 text-text-secondary" aria-hidden="true">•</span>
            <span className="text-text-primary">
              We&apos;ll return your storage unit back to our storage facility
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default LaborPlanDetails;
