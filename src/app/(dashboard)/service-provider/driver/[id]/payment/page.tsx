/**
 * @fileoverview Driver payment and Stripe setup page
 * @source boombox-10.0/src/app/driver-account-page/[id]/payment/page.tsx
 * @refactor Migrated to (dashboard)/service-provider route group
 */

import { SubPageHero } from '@/components/features/service-providers/account/SubPageHero';
import { StripeConnectSetup } from '@/components/features/service-providers/payments/StripeConnectSetup';
import { StripeDashboardButton } from '@/components/features/service-providers/payments/StripeDashboardButton';
import { StripePayoutsComponent } from '@/components/features/service-providers/payments/StripePayoutsComponent';

// Define a type for the resolved params for clarity
type PageParams = {
  id: string;
};

export default async function DriverPaymentPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const resolvedParams = await params;
  const driverId = resolvedParams.id;

  return (
    <div className="min-h-screen">
      <SubPageHero
        title="Payments"
        description="Set up your stripe account to receive payments for completed jobs"
        userType="driver"
        userId={driverId}
      />

      <div className="flex flex-col lg:px-16 px-6 max-w-5xl w-full mx-auto mb-16">
        {/* Pay Breakdown Note */}
        <div
          className="-mt-4 mb-8 p-3 border border-border rounded-md max-w-fit"
          role="note"
          aria-label="Driver pay breakdown information"
        >
          <p className="text-sm text-text-primary mb-2">
            <strong className="font-semibold">
              How your pay is calculated:
            </strong>
          </p>
          <ul className="text-sm text-text-primary list-disc list-inside space-y-1 ml-1">
            <li>
              <span className="font-bold">$30.00 base fee</span> per job
            </li>
            <li>
              <span className="font-bold">$0.75 per mile</span> for round-trip
              mileage (warehouse ↔ customer)
            </li>
            <li>
              <span className="font-bold">$15.00 per hour</span> for on-site
              service time
            </li>
            <li>
              <span className="font-bold">100% of tips</span> — tips go directly
              to you with no platform fees
            </li>
          </ul>
        </div>
        <h2 className="text-2xl font-medium mb-4">Stripe Account</h2>
        <div className="mb-12">
          <StripeConnectSetup userId={driverId} userType="driver" />
        </div>

        <div className="mt-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2>Payment History</h2>
            </div>
            <StripeDashboardButton userId={driverId} userType="driver" />
          </div>
          <StripePayoutsComponent userId={driverId} userType="driver" />
        </div>
      </div>
    </div>
  );
}
