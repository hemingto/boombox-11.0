/**
 * @fileoverview Stripe utility functions for customer management
 * @source boombox-10.0/src/app/lib/getStripeCustomerId.ts
 * @source boombox-10.0/src/app/lib/getuserbyID.ts (getUserById)
 * @refactor Consolidated Stripe utilities with updated import paths
 */

import { prisma } from '@/lib/database/prismaClient';
import { stripe } from '@/lib/integrations/stripeClient';
import Stripe from 'stripe';

export async function getStripeCustomerId(userId: string): Promise<string | null> {
  try {
    // Convert the string userId to a number
    const numericUserId = parseInt(userId, 10);
    
    // Check if the conversion was successful
    if (isNaN(numericUserId)) {
      console.error('Invalid user ID format');
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { 
        id: numericUserId  // Now using the numeric ID
      },
      select: { 
        stripeCustomerId: true 
      }
    });
    
    return user?.stripeCustomerId || null;
  } catch (error) {
    console.error('Error fetching Stripe customer ID:', error);
    return null;
  }
}

export async function getUserById(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(userId, 10) // Convert string to number
      },
      select: {
        id: true,
        stripeCustomerId: true
      }
    });
    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

/**
 * Stripe Connect utility functions
 * @source boombox-10.0/src/app/api/stripe/connect/* (common patterns extracted)
 */

export interface StripeConnectUser {
  stripeConnectAccountId: string | null;
  stripeConnectOnboardingComplete?: boolean | null;
  stripeConnectPayoutsEnabled?: boolean | null;
  stripeConnectDetailsSubmitted?: boolean | null;
}

export interface DriverUser extends StripeConnectUser {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
}

export interface MovingPartnerUser extends StripeConnectUser {
  name: string;
  email: string | null;
  phoneNumber: string | null;
}

/**
 * Get user's Stripe Connect account info by type
 * @source boombox-10.0/src/app/api/stripe/connect/* (repeated pattern)
 */
export async function getStripeConnectUser(userId: number, userType: 'driver' | 'mover'): Promise<StripeConnectUser | null> {
  try {
    if (userType === 'driver') {
      return await prisma.driver.findUnique({
        where: { id: userId },
        select: {
          stripeConnectAccountId: true,
          stripeConnectOnboardingComplete: true,
          stripeConnectPayoutsEnabled: true,
          stripeConnectDetailsSubmitted: true,
        }
      });
    } else {
      return await prisma.movingPartner.findUnique({
        where: { id: userId },
        select: {
          stripeConnectAccountId: true,
          stripeConnectOnboardingComplete: true,
          stripeConnectPayoutsEnabled: true,
          stripeConnectDetailsSubmitted: true,
        }
      });
    }
  } catch (error) {
    console.error('Error fetching Stripe Connect user:', error);
    return null;
  }
}

/**
 * Get detailed user info for account creation
 * @source boombox-10.0/src/app/api/stripe/connect/create-account/route.ts
 */
export async function getDetailedStripeConnectUser(userId: number, userType: 'driver' | 'mover'): Promise<DriverUser | MovingPartnerUser | null> {
  try {
    if (userType === 'driver') {
      return await prisma.driver.findUnique({
        where: { id: userId },
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
          stripeConnectAccountId: true,
          stripeConnectOnboardingComplete: true,
          stripeConnectPayoutsEnabled: true,
          stripeConnectDetailsSubmitted: true,
        }
      });
    } else {
      return await prisma.movingPartner.findUnique({
        where: { id: userId },
        select: {
          name: true,
          email: true,
          phoneNumber: true,
          stripeConnectAccountId: true,
          stripeConnectOnboardingComplete: true,
          stripeConnectPayoutsEnabled: true,
          stripeConnectDetailsSubmitted: true,
        }
      });
    }
  } catch (error) {
    console.error('Error fetching detailed Stripe Connect user:', error);
    return null;
  }
}

/**
 * Calculate total balance from Stripe balance and in-transit payouts
 * @source boombox-10.0/src/app/api/stripe/connect/account-details/route.ts
 */
export async function calculateStripeBalance(accountId: string) {
  const [balance, inTransitPayouts] = await Promise.all([
    stripe.balance.retrieve({ stripeAccount: accountId }),
    stripe.payouts.list(
      { limit: 10, status: 'in_transit' },
      { stripeAccount: accountId }
    )
  ]);

  const availableBalance = balance.available.reduce((acc, bal) => acc + bal.amount, 0);
  const pendingBalance = balance.pending.reduce((acc, bal) => acc + bal.amount, 0);
  const inTransitBalance = inTransitPayouts.data.reduce((acc, payout) => acc + payout.amount, 0);

  return {
    available: availableBalance,
    pending: pendingBalance,
    inTransit: inTransitBalance,
    total: availableBalance + pendingBalance + inTransitBalance
  };
}

/**
 * Update user's Stripe Connect status in database
 * @source boombox-10.0/src/app/api/stripe/connect/account-status/route.ts
 */
export async function updateStripeConnectStatus(userId: number, userType: 'driver' | 'mover', account: Stripe.Account) {
  const updateData = {
    stripeConnectOnboardingComplete: account.details_submitted,
    stripeConnectPayoutsEnabled: account.payouts_enabled,
    stripeConnectDetailsSubmitted: account.details_submitted
  };

  if (userType === 'driver') {
    await prisma.driver.update({
      where: { id: userId },
      data: updateData
    });
  } else {
    await prisma.movingPartner.update({
      where: { id: userId },
      data: updateData
    });
  }
}

/**
 * Get Stripe Connect account status display information
 * @deprecated Moved to stripeDisplayUtils.ts for client-safe imports
 * @see stripeDisplayUtils.ts
 */
export { getStripeAccountStatusDisplay } from './stripeDisplayUtils';

/**
 * Create Stripe Connect account for user
 * @source boombox-10.0/src/app/api/stripe/connect/create-account/route.ts
 */
export async function createStripeConnectAccount(userId: number, userType: 'driver' | 'mover', user: DriverUser | MovingPartnerUser): Promise<string> {
  // Create account parameters based on user type
  const accountParams: Stripe.AccountCreateParams = {
    type: 'express',
    country: 'US',
    capabilities: {
      transfers: { requested: true },
    },
    business_profile: {
      mcc: userType === 'driver' ? '4214' : '5699', // Motor Freight Carriers for drivers, Miscellaneous Apparel and Accessory Stores for movers
      url: process.env.NODE_ENV === 'production' 
        ? (process.env.NEXT_PUBLIC_APP_URL || 'https://boomboxstorage.com')
        : 'https://boomboxstorage.com',
    },
    metadata: {
      userId: userId.toString(),
      userType: userType
    }
  };

  // Add type-specific parameters
  if (userType === 'driver') {
    const driverUser = user as DriverUser;
    accountParams.business_type = 'individual';
    accountParams.email = driverUser.email;
    accountParams.individual = {
      first_name: driverUser.firstName,
      last_name: driverUser.lastName,
      email: driverUser.email,
      phone: driverUser.phoneNumber || undefined,
    };
  } else {
    const movingPartnerUser = user as MovingPartnerUser;
    accountParams.business_type = 'company';
    accountParams.email = movingPartnerUser.email || '';
    accountParams.company = {
      name: movingPartnerUser.name,
    };
  }

  // Create the Stripe account
  const account = await stripe.accounts.create(accountParams);

  // Update user record with Connect account ID
  if (userType === 'driver') {
    await prisma.driver.update({
      where: { id: userId },
      data: {
        stripeConnectAccountId: account.id
      }
    });
  } else {
    await prisma.movingPartner.update({
      where: { id: userId },
      data: {
        stripeConnectAccountId: account.id,
        stripeConnectOnboardingComplete: false,
        stripeConnectPayoutsEnabled: false,
        stripeConnectDetailsSubmitted: false
      }
    });
  }

  return account.id;
}

 