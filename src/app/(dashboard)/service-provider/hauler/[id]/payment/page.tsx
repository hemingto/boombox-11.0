/**
 * @fileoverview Hauler payment and Stripe setup page
 * @refactor Migrated to use shared service-provider payment components
 */

import { SubPageHero } from '@/components/features/service-providers/account/SubPageHero';
import { StripeConnectSetup } from '@/components/features/service-providers/payments/StripeConnectSetup';
import { StripeDashboardButton } from '@/components/features/service-providers/payments/StripeDashboardButton';
import { StripePayoutsComponent } from '@/components/features/service-providers/payments/StripePayoutsComponent';

type PageParams = {
  id: string;
};

export default async function HaulerPaymentPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const resolvedParams = await params;
  const haulerId = resolvedParams.id;

  return (
    <div className="min-h-screen mb-96 sm:mb-60">
      <SubPageHero
        title="Payments"
        description="Set up your stripe account to receive payments for completed jobs"
        userType="hauler"
        userId={haulerId}
      />

      <div className="flex flex-col lg:px-16 px-6 max-w-5xl w-full mx-auto mb-16">
        <h2 className="text-2xl font-medium mb-4">Stripe Account</h2>
        <div className="mb-12">
          <StripeConnectSetup userId={haulerId} userType="hauler" />
        </div>

        <div className="mt-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2>Payment History</h2>
            </div>
            <StripeDashboardButton userId={haulerId} userType="hauler" />
          </div>
          <StripePayoutsComponent userId={haulerId} userType="hauler" />
        </div>
      </div>
    </div>
  );
}
