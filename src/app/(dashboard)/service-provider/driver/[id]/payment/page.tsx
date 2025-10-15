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

