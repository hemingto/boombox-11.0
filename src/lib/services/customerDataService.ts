/**
 * @fileoverview Customer data fetching service - Server Actions for customer components
 * @source boombox-10.0/src/app/actions/appointmentActions.ts, packingSupplyActions.ts, storageUnitActions.ts
 * @refactor Extracted customer data fetching logic into dedicated service with 'use server'
 */

'use server';

import { prisma } from '@/lib/database/prismaClient';

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

