/**
 * @fileoverview Stripe utility functions for customer management
 * @source boombox-10.0/src/app/lib/getStripeCustomerId.ts
 * @source boombox-10.0/src/app/lib/getuserbyID.ts (getUserById)
 * @refactor Consolidated Stripe utilities with updated import paths
 */

import { prisma } from '@/lib/database/prismaClient';

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