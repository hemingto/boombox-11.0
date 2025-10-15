/**
 * @fileoverview Insurance plan rates and pricing display
 * @source boombox-10.0/src/app/components/insurance-coverage/insuranceprices.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays available insurance plans with coverage details and monthly pricing.
 * Shows two tiers: Standard ($15/mo, $1000 coverage) and Premium ($25/mo, $2500 coverage).
 * Includes important disclaimers about purchase timing and alternatives.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with design system tokens
 *   - border-slate-100 → border-border
 *   - text-zinc-950 → text-text-primary
 * - Applied semantic text colors for hierarchy
 * - Used card component pattern for consistent styling
 * - Improved icon color consistency
 * 
 * @refactor Migrated to features/insurance domain with design system compliance
 */

import { ShieldCheckIcon } from '@heroicons/react/24/solid';

interface InsurancePlan {
  name: string;
  coverage: string;
  price: string;
}

const insurancePlans: InsurancePlan[] = [
  {
    name: 'Standard Insurance Coverage',
    coverage: 'covers up to $1000 per unit',
    price: '$15/mo',
  },
  {
    name: 'Premium Insurance Coverage',
    coverage: 'covers up to $2500 per unit',
    price: '$25/mo',
  },
];

export function InsuranceRates() {
  return (
    <section className="lg:px-16 px-6 rounded-md mb-8">
      <div className="card"> 
        <h2 className="mb-4">Rates for insurance coverage</h2>
        <p className="mb-6 text-text-secondary">
          We offer insurance coverage at the following rates.
        </p>
        <div className="border-t border-border max-w-xl">
          {insurancePlans.map((plan, index) => (
            <div key={index} className="flex justify-between items-center py-6 border-b border-border">
              <div className="flex items-center">
                <ShieldCheckIcon className="w-8 h-8 text-primary mr-4" aria-hidden="true" />
                <div>
                  <p className="text-lg font-medium text-text-primary">{plan.name}</p>
                  <p className="text-sm text-text-secondary">{plan.coverage}</p>
                </div>
              </div>
              <div className="text-lg font-medium text-text-primary">{plan.price}</div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-text-secondary">
          All insurance plans must be purchased at the time of your original sign up. You can also opt out of insurance and use your own renter&apos;s insurance to cover your belongings.
        </p>
      </div>
    </section>
  );
}

export default InsuranceRates;

