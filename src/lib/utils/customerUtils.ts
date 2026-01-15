/**
 * @fileoverview Customer utility functions
 * @source boombox-10.0/src/app/api/appointments/upcoming/route.ts (getUpcomingAppointments)
 * @source boombox-10.0/src/app/api/users/[id]/profile/route.ts (getUserProfileWithPaymentMethods)
 * @source boombox-10.0/src/app/api/users/[id]/contact-info/route.ts (getUserContactInfo, updateUserContactInfo)
 * @refactor Extracted utility functions for customer operations
 */

import { prisma } from '@/lib/database/prismaClient';
import { stripe } from '@/lib/integrations/stripeClient';
import Stripe from 'stripe';

/**
 * Get upcoming appointments for movers or drivers
 * @source boombox-10.0/src/app/api/appointments/upcoming/route.ts
 */
export async function getUpcomingAppointments(userType: 'mover' | 'driver', userId: number) {
  // Get current date and time
  const now = new Date();

  // Fetch upcoming appointments based on user type
  // Filter out canceled and completed appointments
  let whereClause: any = {
    date: {
      gte: now,
    },
    status: {
      notIn: ['Canceled', 'Complete', 'Completed'],
    },
  };

  // Add the appropriate filter based on user type
  if (userType === 'mover') {
    whereClause = {
      ...whereClause,
      movingPartnerId: userId,
    };
  } else {
    // For drivers, use OnfleetTasks relationship
    whereClause = {
      ...whereClause,
      onfleetTasks: {
        some: {
          driverId: userId,
        },
      },
    };
  }

  const appointments = await prisma.appointment.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      onfleetTasks: {
        where: {
          driverId: { not: null },
        },
        include: {
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
              profilePicture: true,
            },
          },
        },
        orderBy: {
          unitNumber: 'asc',
        },
        take: 1,
      },
      additionalInfo: true,
      requestedStorageUnits: {
        include: {
          storageUnit: true,
        },
      },
    },
    orderBy: {
      date: 'asc',
    },
  });

  // Transform the data to match the expected format
  return appointments.map((appointment: any) => {
    // Get driver from the first OnfleetTask
    const primaryDriver = appointment.onfleetTasks.length > 0 
      ? appointment.onfleetTasks[0].driver 
      : null;

    return {
      id: appointment.id,
      address: appointment.address,
      date: appointment.date,
      time: appointment.time,
      appointmentType: appointment.appointmentType,
      status: appointment.status,
      numberOfUnits: appointment.numberOfUnits || 0,
      planType: appointment.planType || '',
      insuranceCoverage: appointment.insuranceCoverage || undefined,
      description: appointment.description || undefined,
      additionalInformation: appointment.additionalInfo ? {
        itemsOver100lbs: appointment.additionalInfo.itemsOver100lbs,
        moveDescription: appointment.additionalInfo.moveDescription || undefined,
        conditionsDescription: appointment.additionalInfo.conditionsDescription || undefined,
      } : undefined,
      requestedStorageUnits: appointment.requestedStorageUnits.map((unit: any) => ({
        storageUnitId: unit.storageUnitId,
        storageUnit: {
          storageUnitNumber: unit.storageUnit.storageUnitNumber,
        },
      })),
      user: appointment.user ? {
        firstName: appointment.user.firstName,
        lastName: appointment.user.lastName,
      } : undefined,
      driver: primaryDriver ? {
        firstName: primaryDriver.firstName,
        lastName: primaryDriver.lastName,
        phoneNumber: primaryDriver.phoneNumber || undefined,
        profilePicture: primaryDriver.profilePicture || undefined,
      } : undefined,
    };
  });
}

/**
 * Get user profile with Stripe payment methods
 * @source boombox-10.0/src/app/api/users/[id]/profile/route.ts
 */
export async function getUserProfileWithPaymentMethods(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
      stripeCustomerId: true,
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  interface SavedCard {
    id: string;
    stripePaymentMethodId: string;
    last4: string;
    brand: string;
    expiryMonth: number;
    expiryYear: number;
    isDefault: boolean;
  }

  let savedCards: SavedCard[] = [];

  // Fetch payment methods from Stripe if user has a Stripe customer ID
  if (user.stripeCustomerId) {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: 'card',
      });

      // Get the customer to check for default payment method
      const customer = await stripe.customers.retrieve(user.stripeCustomerId);
      const defaultPaymentMethodId = typeof customer !== 'string' && 'invoice_settings' in customer 
        ? customer.invoice_settings.default_payment_method 
        : null;

      savedCards = paymentMethods.data.map(pm => ({
        id: pm.id,
        stripePaymentMethodId: pm.id,
        last4: pm.card?.last4 || '',
        brand: pm.card?.brand || '',
        expiryMonth: pm.card?.exp_month || 0,
        expiryYear: pm.card?.exp_year || 0,
        isDefault: pm.id === defaultPaymentMethodId,
      }));
    } catch (stripeError) {
      console.error('Error fetching payment methods from Stripe:', stripeError);
      // Continue without payment methods if Stripe fails
    }
  }

  return {
    ...user,
    savedCards,
  };
}

/**
 * Get user contact information with storage units
 * @source boombox-10.0/src/app/api/users/[id]/contact-info/route.ts
 */
export async function getUserContactInfo(userId: number) {
  // Fetch user information
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
      verifiedPhoneNumber: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Fetch storage unit usage and padlock combos
  const storageUnits = await prisma.storageUnitUsage.findMany({
    where: { userId },
    include: {
      storageUnit: true, // Join the related StorageUnit model
    },
  });

  // Map the storage units to include storage unit numbers and padlock combos
  const storageUnitDetails = storageUnits.map((usage) => ({
    storageUnitNumber: usage.storageUnit?.storageUnitNumber || 'Unknown',
    padlockCombo: usage.padlockCombo || 'N/A',
  }));

  // Combine user data with storage unit details
  return {
    ...user,
    storageUnits: storageUnitDetails,
  };
}

/**
 * Update user contact information and storage unit padlock combos
 * @source boombox-10.0/src/app/api/users/[id]/contact-info/route.ts
 */
export async function updateUserContactInfo(userId: number, updates: any) {
  // Handle phone number updates
  if (updates.phoneNumber) {
    const normalizedPhoneNumber = updates.phoneNumber.replace(/\D/g, '');

    if (normalizedPhoneNumber.length !== 10) {
      throw new Error('Invalid phone number format.');
    }

    updates.phoneNumber = `+1${normalizedPhoneNumber}`;

    // Ensure no other user has this phone number
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber: updates.phoneNumber },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new Error('This phone number is already in use. Please use a different phone number.');
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { phoneNumber: true, verifiedPhoneNumber: true },
    });

    if (!currentUser) {
      throw new Error('User not found');
    }

    if (currentUser.phoneNumber !== updates.phoneNumber) {
      updates.verifiedPhoneNumber = false;
    }
  }

  // Handle storage unit updates if provided
  if (updates.storageUnits) {
    for (const unit of updates.storageUnits) {
      const { storageUnitNumber, padlockCombo } = unit;

      if (!storageUnitNumber || !padlockCombo) {
        throw new Error('Invalid storage unit data.');
      }

      // Update storage unit padlock combinations
      await prisma.storageUnitUsage.updateMany({
        where: {
          userId,
          storageUnit: { storageUnitNumber },
        },
        data: { padlockCombo },
      });
    }

    // Remove storageUnits from updates to prevent conflicts with user updates
    delete updates.storageUnits;
  }

  // Update the user's data
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updates,
  });

  return updatedUser;
}

/**
 * Extended appointment type for UI display (includes flattened relations)
 */
export interface CustomerAppointmentDisplay {
  id: number;
  date: string;
  time: string;
  numberOfUnits: number;
  planType: string | null;
  address: string;
  status: string;
  appointmentType: string;
  loadingHelpPrice: number;
  monthlyStorageRate: number;
  monthlyInsuranceRate: number;
  insuranceCoverage: string | null;
  trackingUrl: string | null;
  hasAdditionalInfo: boolean;
  movingPartnerName: string | null;
  thirdPartyTitle: string | null;
  requestedStorageUnits: Array<{
    id: number;
    storageUnitNumber: string;
  }>;
}

/**
 * Get active appointments for a customer (regular user)
 * @source boombox-10.0/src/app/actions/appointmentActions.ts
 * @param userId User ID as string or number
 * @returns Array of appointments formatted for display
 */
export async function getActiveCustomerAppointments(userId: string | number): Promise<CustomerAppointmentDisplay[]> {
  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        userId: typeof userId === 'string' ? parseInt(userId) : userId,
        status: {
          notIn: ['Completed', 'Canceled', 'Awaiting Admin Check In']
        }
      },
      select: {
        id: true,
        date: true,
        time: true,
        numberOfUnits: true,
        planType: true,
        address: true,
        status: true,
        appointmentType: true,
        loadingHelpPrice: true,
        monthlyStorageRate: true,
        monthlyInsuranceRate: true,
        insuranceCoverage: true,
        trackingUrl: true,
        movingPartner: { 
          select: { 
            id: true, 
            name: true 
          } 
        },
        additionalInfo: true,
        thirdPartyMovingPartner: { 
          select: { 
            id: true, 
            title: true 
          } 
        },
        requestedStorageUnits: {
          select: {
            id: true,
            storageUnit: {
              select: {
                id: true,
                storageUnitNumber: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    return appointments.map(appointment => ({
      id: appointment.id,
      date: appointment.date.toISOString(),
      time: appointment.time.toISOString(),
      numberOfUnits: appointment.numberOfUnits || 0,
      planType: appointment.planType,
      address: appointment.address,
      status: appointment.status,
      appointmentType: appointment.appointmentType,
      loadingHelpPrice: appointment.loadingHelpPrice || 0,
      monthlyStorageRate: appointment.monthlyStorageRate || 0,
      monthlyInsuranceRate: appointment.monthlyInsuranceRate || 0,
      insuranceCoverage: appointment.insuranceCoverage,
      trackingUrl: appointment.trackingUrl,
      hasAdditionalInfo: appointment.additionalInfo !== null,
      movingPartnerName: appointment.movingPartner?.name || null,
      thirdPartyTitle: appointment.thirdPartyMovingPartner?.title || null,
      requestedStorageUnits: appointment.requestedStorageUnits.map(req => ({
        id: req.id,
        storageUnitNumber: req.storageUnit.storageUnitNumber
      })),
    }));
  } catch (error) {
    console.error('Error fetching active customer appointments:', error);
    throw new Error('Failed to fetch appointments');
  }
}

/**
 * Check if customer has active storage units
 * @source boombox-10.0/src/app/actions/appointmentActions.ts
 * @param userId User ID as string or number
 * @returns Boolean indicating if user has active storage units
 */
export async function hasActiveStorageUnits(userId: string | number): Promise<boolean> {
  try {
    const count = await prisma.storageUnitUsage.count({
      where: { 
        userId: typeof userId === 'string' ? parseInt(userId) : userId,
        usageEndDate: null,
        startAppointment: {
          status: 'Completed',
        },
      },
    });
    return count > 0;
  } catch (error) {
    console.error('Error checking storage units:', error);
    return false;
  }
}

/**
 * Packing supply order display type for customer UI
 */
export interface PackingSupplyOrderDisplay {
  id: number;
  deliveryAddress: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  orderDate: Date;
  deliveryDate: Date;
  totalPrice: number;
  status: string;
  paymentStatus: string | null;
  trackingUrl: string | null;
  orderDetails: Array<{
    id: number;
    productTitle: string;
    quantity: number;
    price: number;
    totalPrice: number;
  }>;
}

/**
 * Get active packing supply orders for a customer
 * @source boombox-10.0/src/app/actions/packingSupplyActions.ts
 * @param userId User ID as string or number
 * @returns Array of packing supply orders formatted for display
 */
export async function getActivePackingSupplyOrders(userId: string | number): Promise<PackingSupplyOrderDisplay[]> {
  try {
    const orders = await prisma.packingSupplyOrder.findMany({
      where: {
        userId: typeof userId === 'string' ? parseInt(userId) : userId,
        status: {
          notIn: ['Delivered', 'Cancelled'] // Exclude delivered and cancelled orders from "active" list
        }
      },
      include: {
        orderDetails: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                description: true,
                imageSrc: true
              }
            }
          }
        }
      },
      orderBy: {
        deliveryDate: 'asc'
      }
    });

    return orders.map(order => ({
      id: order.id,
      deliveryAddress: order.deliveryAddress,
      contactName: order.contactName,
      contactEmail: order.contactEmail,
      contactPhone: order.contactPhone,
      orderDate: order.orderDate,
      deliveryDate: order.deliveryDate,
      totalPrice: order.totalPrice,
      status: order.status,
      paymentStatus: order.paymentStatus,
      trackingUrl: order.trackingUrl,
      orderDetails: order.orderDetails.map(detail => ({
        id: detail.id,
        productTitle: detail.product.title,
        quantity: detail.quantity,
        price: detail.price,
        totalPrice: detail.quantity * detail.price
      }))
    }));
  } catch (error) {
    console.error('Error fetching packing supply orders:', error);
    throw new Error('Failed to fetch packing supply orders');
  }
}

/**
 * Storage unit usage display type for customer UI
 */
export interface StorageUnitUsageDisplay {
  id: number;
  usageStartDate: string;
  usageEndDate: string | null;
  storageUnit: {
    id: number;
    storageUnitNumber: string;
    mainImage: string;
  };
  location: string;
  uploadedImages: string[];
  description: string | null;
  mainImage?: string | null;
}

/**
 * Get active storage units for a customer
 * @source boombox-10.0/src/app/actions/storageUnitActions.ts
 * @param userId User ID as string or number
 * @returns Array of active storage unit usages formatted for display
 */
export async function getActiveStorageUnits(userId: string | number): Promise<StorageUnitUsageDisplay[]> {
  try {
    const storageUnits = await prisma.storageUnitUsage.findMany({
      where: { 
        userId: typeof userId === 'string' ? parseInt(userId) : userId,
        usageEndDate: null,
        startAppointment: {
          status: 'Completed',
        },
      },
      include: {
        storageUnit: true,
        startAppointment: {
          select: {
            id: true,
            address: true,
            status: true
          }
        }
      },
    });

    return storageUnits.map(usage => ({
      id: usage.id,
      usageStartDate: usage.usageStartDate.toISOString(),
      usageEndDate: usage.usageEndDate ? usage.usageEndDate.toISOString() : null,
      storageUnit: {
        id: usage.storageUnit.id,
        storageUnitNumber: usage.storageUnit.storageUnitNumber,
        mainImage: usage.mainImage || '/placeholder.jpg', // Use mainImage from DB, fallback to default
      },
      location: usage.startAppointment?.address || 'Not available',
      uploadedImages: usage.uploadedImages,
      description: usage.description || null,
      mainImage: usage.mainImage, // For reference, this will now hold the Onfleet photo directly
    }));
  } catch (error) {
    console.error('Error fetching storage units:', error);
    throw new Error('Failed to fetch storage units');
  }
}