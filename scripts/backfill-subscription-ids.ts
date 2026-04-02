/**
 * One-time backfill script: populate stripeSubscriptionId on Appointment records
 * by matching Stripe subscription metadata.appointmentId.
 *
 * Usage: npx tsx scripts/backfill-subscription-ids.ts
 */

import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

async function backfillSubscriptionIds() {
  console.log('Starting subscription ID backfill...\n');

  const users = await prisma.user.findMany({
    where: { stripeCustomerId: { not: null } },
    select: { id: true, stripeCustomerId: true },
  });

  console.log(`Found ${users.length} users with Stripe customer IDs\n`);

  let matched = 0;
  let skipped = 0;
  let noMetadata = 0;

  for (const user of users) {
    if (!user.stripeCustomerId) continue;

    let subscriptions: Stripe.Subscription[];
    try {
      const result = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'all',
        limit: 100,
      });
      subscriptions = result.data;
    } catch (err) {
      console.error(
        `  Error fetching subscriptions for customer ${user.stripeCustomerId}:`,
        err instanceof Error ? err.message : err
      );
      continue;
    }

    if (subscriptions.length === 0) continue;

    for (const sub of subscriptions) {
      const metaApptId = sub.metadata?.appointmentId;
      if (!metaApptId) {
        noMetadata++;
        continue;
      }

      const appointmentId = parseInt(metaApptId, 10);
      if (isNaN(appointmentId)) {
        noMetadata++;
        continue;
      }

      try {
        const appointment = await prisma.appointment.findUnique({
          where: { id: appointmentId },
          select: { id: true, stripeSubscriptionId: true },
        });

        if (!appointment) {
          console.log(
            `  Appointment ${appointmentId} not found for subscription ${sub.id}`
          );
          continue;
        }

        if (appointment.stripeSubscriptionId) {
          skipped++;
          continue;
        }

        await prisma.appointment.update({
          where: { id: appointmentId },
          data: { stripeSubscriptionId: sub.id },
        });

        matched++;
        console.log(
          `  Linked appointment ${appointmentId} -> subscription ${sub.id}`
        );
      } catch (err) {
        console.error(
          `  Error updating appointment ${appointmentId}:`,
          err instanceof Error ? err.message : err
        );
      }
    }
  }

  console.log('\nBackfill complete:');
  console.log(`  Matched & updated: ${matched}`);
  console.log(`  Already populated (skipped): ${skipped}`);
  console.log(`  Subscriptions without metadata: ${noMetadata}`);
}

backfillSubscriptionIds()
  .catch(error => {
    console.error('Backfill failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
