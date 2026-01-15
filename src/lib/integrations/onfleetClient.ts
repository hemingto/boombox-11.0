/**
 * @fileoverview Onfleet API client for logistics and delivery management
 * @source boombox-10.0/src/app/lib/onfleet.ts
 * @refactor Moved to integrations directory with NO LOGIC CHANGES
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type OriginalOnfleet from '@onfleet/node-onfleet';

let onfleetInstance: OriginalOnfleet | null = null;

// Custom error class to handle Onfleet API errors
class OnfleetApiError extends Error {
  response?: any;
  status?: number;

  constructor(message: string, response?: any, status?: number) {
    super(message);
    this.name = 'OnfleetApiError';
    this.response = response;
    this.status = status;
  }
}

export async function getOnfleetClient(): Promise<OriginalOnfleet> {
  if (!onfleetInstance) {
    if (!process.env.ONFLEET_API_KEY) {
      throw new Error('ONFLEET_API_KEY is not defined');
    }

    try {
      // Dynamically import the Onfleet SDK
      // .default is often needed when dynamically importing CJS modules in an ESM context
      const OnfleetConstructor = (await import('@onfleet/node-onfleet'))
        .default;
      onfleetInstance = new OnfleetConstructor(process.env.ONFLEET_API_KEY);

      // Monkey patch the error handler to prevent HttpError constructor issues
      if (onfleetInstance) {
        const original = onfleetInstance.workers.create;
        onfleetInstance.workers.create = async function (
          worker: Parameters<typeof original>[0]
        ) {
          try {
            return await original.call(this, worker);
          } catch (error: any) {
            console.error(
              'Original Onfleet SDK Error:',
              JSON.stringify(error, Object.getOwnPropertyNames(error))
            );
            throw new OnfleetApiError(
              error.message || 'Onfleet API error',
              error.response?.data,
              error.response?.status
            );
          }
        };
      }
    } catch (error) {
      console.error('Failed to initialize Onfleet client:', error);
      throw error;
    }
  }

  return onfleetInstance;
}

// ========================================
// PACKING SUPPLY DELIVERY EXTENSIONS
// ========================================

export interface PackingSupplyDeliveryConfig {
  hubName: string;
  teamName: string;
  deliveryWindowHours: number;
}

export const PACKING_SUPPLY_CONFIG: PackingSupplyDeliveryConfig = {
  hubName: 'Boombox Warehouse',
  teamName: 'Boombox Packing Supply Delivery Drivers',
  deliveryWindowHours: 7, // 7-hour delivery window (12 PM - 7 PM)
};

/**
 * Get team by name - used for packing supply deliveries
 */
export async function getOnfleetTeamByName(
  teamName: string
): Promise<any | null> {
  const client = await getOnfleetClient();
  const teams = await (client as any).teams.get();
  return teams.find((team: any) => team.name === teamName) || null;
}

/**
 * Get hub by name - used for packing supply deliveries
 */
export async function getOnfleetHubByName(
  hubName: string
): Promise<any | null> {
  const client = await getOnfleetClient();
  const hubs = await (client as any).hubs.get();
  return hubs.find((hub: any) => hub.name === hubName) || null;
}

/**
 * Auto-dispatch team for packing supply deliveries
 */
export async function autoDispatchPackingSupplyTeam(
  teamId: string
): Promise<{ success: boolean; tasks: any[] }> {
  const client = await getOnfleetClient();

  try {
    // Use the existing Onfleet SDK's team dispatch functionality
    const result = await (client as any).teams.autoDispatch(teamId);
    return {
      success: true,
      tasks: Array.isArray(result) ? result : [],
    };
  } catch (error: any) {
    console.error('Error auto-dispatching packing supply team:', error);
    throw new OnfleetApiError(
      `Failed to auto-dispatch team: ${error.message}`,
      error.response?.data,
      error.response?.status
    );
  }
}

/**
 * Create packing supply delivery task using direct HTTP request
 * This bypasses the SDK issue with HttpError constructor
 */
export async function createPackingSupplyTask(taskData: any): Promise<any> {
  try {
    // Log the task data being sent for debugging
    console.log(
      'Creating Onfleet task with data:',
      JSON.stringify(taskData, null, 2)
    );

    // Use direct HTTP request instead of SDK
    const apiKey = process.env.ONFLEET_API_KEY;
    if (!apiKey) {
      throw new Error('ONFLEET_API_KEY is not defined');
    }

    const response = await fetch('https://onfleet.com/api/v2/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
      },
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Onfleet API error response:', errorData);
      throw new OnfleetApiError(
        `Onfleet API error (${response.status}): ${errorData}`,
        errorData,
        response.status
      );
    }

    const task = await response.json();
    console.log('Successfully created Onfleet task:', task.id);
    return task;
  } catch (error: any) {
    console.error('Error creating packing supply task:', error);

    if (error instanceof OnfleetApiError) {
      throw error;
    }

    throw new OnfleetApiError(
      `Failed to create packing supply task: ${error.message}`,
      error.response?.data,
      error.response?.status
    );
  }
}

/**
 * Delete an Onfleet task using direct HTTP request
 * This works for any Onfleet task (appointments, packing supplies, etc.)
 * 
 * @param taskId - The Onfleet task ID to delete
 * @returns Promise with success status and optional error message
 */
export async function deleteOnfleetTask(
  taskId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const apiKey = process.env.ONFLEET_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: 'ONFLEET_API_KEY is not defined',
      };
    }

    const response = await fetch(`https://onfleet.com/api/v2/tasks/${taskId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Error deleting Onfleet task:', errorData);
      return {
        success: false,
        error: `Onfleet API error (${response.status}): ${errorData}`,
      };
    }

    console.log(`Successfully deleted Onfleet task: ${taskId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting Onfleet task:', error);

    // Don't throw error - log it and return failure status
    // This prevents cancellation from failing if Onfleet deletion fails
    return {
      success: false,
      error: error.message || 'Failed to delete Onfleet task',
    };
  }
}

/**
 * Delete packing supply delivery task from Onfleet using direct HTTP request
 * @param taskId - The Onfleet task ID to delete
 * @returns Promise with success status and optional error message
 * @deprecated Use deleteOnfleetTask instead - kept for backward compatibility
 */
export async function deletePackingSupplyTask(
  taskId: string
): Promise<{ success: boolean; error?: string }> {
  return deleteOnfleetTask(taskId);
}

/**
 * Cancel a packing supply order and delete its associated Onfleet task
 * This is a utility function that can be reused across different cancellation scenarios
 *
 * @param orderId - The ID of the packing supply order to cancel
 * @param cancellationReason - Reason for cancellation
 * @param userId - Optional user ID (defaults to order's userId)
 * @param adminNotes - Optional admin notes for the cancellation
 * @returns Promise with success status, error message, and Onfleet deletion result
 */
export async function cancelPackingSupplyOrderWithOnfleetCleanup(
  orderId: number,
  cancellationReason: string,
  userId?: number,
  adminNotes?: string
): Promise<{ success: boolean; error?: string; onfleetDeletionResult?: any }> {
  try {
    // Get the order with its Onfleet task ID
    const { prisma } = await import('@/lib/database/prismaClient');
    const order = await prisma.packingSupplyOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return {
        success: false,
        error: 'Order not found',
      };
    }

    // Delete Onfleet task if it exists
    let onfleetDeletionResult = null;
    if (order.onfleetTaskId) {
      console.log(
        `Attempting to delete Onfleet task ${order.onfleetTaskId} for cancelled order ${orderId}`
      );
      onfleetDeletionResult = await deletePackingSupplyTask(
        order.onfleetTaskId
      );

      if (!onfleetDeletionResult.success) {
        console.warn(
          `Failed to delete Onfleet task ${order.onfleetTaskId}: ${onfleetDeletionResult.error}`
        );
        // Continue with cancellation even if Onfleet deletion fails
      } else {
        console.log(
          `Successfully deleted Onfleet task ${order.onfleetTaskId} for cancelled order ${orderId}`
        );
      }
    }

    // Update order in database and restore inventory
    const { prisma: dbClient } = await import('@/lib/database/prismaClient');
    await dbClient.$transaction(async (tx: any) => {
      // Get order details to restore inventory
      const orderDetails = await tx.packingSupplyOrderDetails.findMany({
        where: { orderId },
        include: { product: true },
      });

      // Restore inventory for each item
      for (const detail of orderDetails) {
        await tx.product.update({
          where: { id: detail.productId },
          data: {
            stockCount: {
              increment: detail.quantity,
            },
            isOutOfStock: false, // Reset out of stock flag since we're adding inventory back
          },
        });
      }

      // Create cancellation record
      await tx.packingSupplyOrderCancellation.create({
        data: {
          packingSupplyOrderId: orderId,
          userId: userId || order.userId || 0,
          cancellationReason,
          cancellationFee: 0, // No fee for most cancellations
          refundAmount: order.totalPrice, // Full refund for pending orders
          refundStatus: 'pending',
          adminNotes,
        },
      });

      // Update order status and clear Onfleet task references
      await tx.packingSupplyOrder.update({
        where: { id: orderId },
        data: {
          status: 'Cancelled',
          onfleetTaskId: null, // Clear the Onfleet task ID
          onfleetTaskShortId: null, // Clear the short ID as well
        },
      });
    });

    return {
      success: true,
      onfleetDeletionResult,
    };
  } catch (error: any) {
    console.error(`Error cancelling order ${orderId}:`, error);
    return {
      success: false,
      error: error.message || 'Failed to cancel order',
    };
  }
}

/**
 * Test Onfleet connection
 */
export async function testOnfleetConnection(): Promise<{
  success: boolean;
  organization?: any;
  error?: string;
}> {
  try {
    const client = await getOnfleetClient();
    const organization = await (client as any).organization.get();

    return {
      success: true,
      organization,
    };
  } catch (error: any) {
    console.error('Onfleet connection test failed:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Fetch task details by shortId from Onfleet API
 * @source boombox-10.0/src/app/api/tracking/verify/route.ts (fetchTask function)
 */
export async function fetchTaskByShortId(taskId: string) {
  if (!taskId) return null;
  
  try {
    const response = await fetch(
      `https://onfleet.com/api/v2/tasks/shortId/${taskId}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(process.env.ONFLEET_API_KEY + ':').toString('base64')}`
        }
      }
    );
    
    return response.ok ? await response.json() : null;
  } catch (error) {
    console.error('Error fetching Onfleet task by shortId:', error);
    return null;
  }
}

// Export the error class for use in other files
export { OnfleetApiError };
