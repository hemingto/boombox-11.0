/**
 * @fileoverview Service for handling packing supply order preparation and delivery workflow
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (prep-packing-supply task display logic)
 * @source boombox-10.0/src/app/api/admin/packing-supplies/[orderId]/prep/route.ts (prep processing logic)
 * 
 * SERVICE FUNCTIONALITY:
 * - Get packing supply order preparation task details for display
 * - Process order preparation with status updates and admin tracking
 * - Handle order validation and inventory management workflow
 * - Manage delivery preparation and driver assignment coordination
 * - Create prep audit trails and admin logging
 * 
 * USED BY:
 * - Admin task management interface for packing supply preparation workflow
 * - Inventory management and order fulfillment systems
 * - Delivery route planning and driver coordination
 * 
 * @refactor Extracted from monolithic admin tasks route for better organization
 */

import { prisma } from '@/lib/database/prismaClient';
import { 
  formatTaskDate,
  markPackingSupplyOrderAsPrepped,
  validatePackingSupplyOrderForPrep
} from '@/lib/utils/adminTaskUtils';

// Prep packing supply order task interface
export interface PrepPackingSupplyOrderTask {
  id: string;
  title: 'Prep Packing Supply Order';
  description: string;
  action: 'Mark as Prepped';
  color: 'darkAmber';
  details: string;
  customerName: string;
  deliveryAddress: string;
  driverName: string;
  onfleetTaskShortId: string | null;
  packingSupplyOrder: {
    id: number;
    contactName: string;
    contactEmail: string;
    contactPhone: string | null;
    deliveryAddress: string;
    deliveryDate: Date;
    totalPrice: number;
    onfleetTaskShortId: string | null;
    assignedDriver: {
      firstName: string;
      lastName: string;
    } | null;
    orderDetails: Array<{
      id: number;
      quantity: number;
      product: {
        title: string;
      };
    }>;
  };
}

// Prep request interface
export interface PrepRequest {
  isPrepped?: boolean;
}

// Prep result interface
export interface PrepResult {
  success: boolean;
  message: string;
  order?: any;
  error?: string;
}

export class PrepPackingSupplyOrderService {
  /**
   * Get packing supply order preparation task details for display
   * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (lines 643-696)
   */
  async getPrepTask(orderId: number): Promise<PrepPackingSupplyOrderTask | null> {
    try {
      const packingSupplyOrder = await prisma.packingSupplyOrder.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          contactName: true,
          contactEmail: true,
          contactPhone: true,
          deliveryAddress: true,
          deliveryDate: true,
          totalPrice: true,
          onfleetTaskShortId: true,
          isPrepped: true,
          status: true,
          assignedDriver: {
            select: {
              firstName: true,
              lastName: true
              
            }
          },
          orderDetails: {
            select: {
              id: true,
              quantity: true,
              product: {
                select: {
                  title: true
                }
              }
            }
          }
        }
      });

      if (!packingSupplyOrder) {
        return null;
      }

      // Only return task if order is not prepped and not canceled
      if (packingSupplyOrder.isPrepped || packingSupplyOrder.status === 'Canceled') {
        return null;
      }

      const formattedDate = formatTaskDate(packingSupplyOrder.deliveryDate);
      const driverName = packingSupplyOrder.assignedDriver 
        ? `${packingSupplyOrder.assignedDriver.firstName} ${packingSupplyOrder.assignedDriver.lastName}`
        : 'Unassigned driver';

      // Generate task ID in the expected format
      const taskId = `prep-packing-supply-${orderId}`;

      return {
        id: taskId,
        title: 'Prep Packing Supply Order',
        description: 'Organize packing supply order and prep it for pickup',
        action: 'Mark as Prepped',
        color: 'darkAmber',
        details: `<strong>Order #:</strong> ${packingSupplyOrder.onfleetTaskShortId || packingSupplyOrder.id}<br><strong>Customer:</strong> ${packingSupplyOrder.contactName}<br><strong>Delivery Date:</strong> ${formattedDate}`,
        customerName: packingSupplyOrder.contactName,
        deliveryAddress: packingSupplyOrder.deliveryAddress,
        driverName: driverName,
        onfleetTaskShortId: packingSupplyOrder.onfleetTaskShortId,
        packingSupplyOrder: packingSupplyOrder
      };
    } catch (error) {
      console.error('Error getting prep packing supply order task:', error);
      return null;
    }
  }

  /**
   * Process packing supply order preparation
   * @source boombox-10.0/src/app/api/admin/packing-supplies/[orderId]/prep/route.ts
   */
  async markOrderAsPrepped(
    orderId: number,
    adminId: number,
    request: PrepRequest
  ): Promise<PrepResult> {
    try {
      const { isPrepped = true } = request;

      // Validate order can be prepped
      const validation = await validatePackingSupplyOrderForPrep(orderId);
      if (!validation.valid) {
        return {
          success: false,
          message: '',
          error: validation.error || 'Validation failed'
        };
      }

      // Execute prep with database transaction
      const result = await markPackingSupplyOrderAsPrepped(orderId, adminId, isPrepped);

      return {
        success: true,
        message: 'Packing supply order marked as prepped successfully',
        order: result.updatedOrder
      };

    } catch (error) {
      console.error('Error marking packing supply order as prepped:', error);
      return {
        success: false,
        message: '',
        error: 'Failed to mark packing supply order as prepped'
      };
    }
  }

  /**
   * Check if packing supply order needs preparation
   * Used by the task listing service to determine if tasks should be created
   */
  async isPrepNeeded(orderId: number): Promise<boolean> {
    try {
      const order = await prisma.packingSupplyOrder.findUnique({
        where: { id: orderId },
        select: { isPrepped: true, status: true }
      });

      return order?.isPrepped === false && order?.status !== 'Canceled';
    } catch (error) {
      console.error('Error checking prep need:', error);
      return false;
    }
  }

  /**
   * Get all packing supply orders that need preparation
   * Helper method for task generation
   * @source boombox-10.0/src/app/api/admin/tasks/route.ts (lines 320-354)
   */
  async getAllUnpreppedOrders() {
    try {
      return await prisma.packingSupplyOrder.findMany({
        where: {
          isPrepped: false,
          status: {
            not: 'Canceled'
          }
        },
        select: {
          id: true,
          contactName: true,
          contactEmail: true,
          contactPhone: true,
          deliveryAddress: true,
          deliveryDate: true,
          totalPrice: true,
          onfleetTaskShortId: true,
          assignedDriver: {
            select: {
              firstName: true,
              lastName: true
              
            }
          },
          orderDetails: {
            select: {
              id: true,
              quantity: true,
              product: {
                select: {
                  title: true
                }
              }
            }
          }
        },
        orderBy: {
          deliveryDate: 'asc' // Earliest delivery first for priority
        }
      });
    } catch (error) {
      console.error('Error getting unprepped orders:', error);
      return [];
    }
  }

  /**
   * Get prep history for a packing supply order
   * Helper method for detailed tracking
   */
  async getPrepHistory(orderId: number) {
    try {
      return await prisma.adminLog.findMany({
        where: { 
          targetType: 'PackingSupplyOrder',
          targetId: orderId.toString(),
          action: 'PREP_PACKING_SUPPLY_ORDER'
        },
        include: {
          admin: {
            select: {
              email: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (error) {
      console.error('Error getting prep history:', error);
      return [];
    }
  }

  /**
   * Get order summary with products for prep workflow
   * Helper method for detailed order preparation
   */
  async getOrderSummary(orderId: number) {
    try {
      const order = await prisma.packingSupplyOrder.findUnique({
        where: { id: orderId },
        include: {
          orderDetails: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  category: true
                }
              }
            }
          },
          assignedDriver: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true
            }
          }
        }
      });

      if (!order) return null;

      // Calculate summary statistics
      const totalItems = order.orderDetails.reduce((sum, detail) => sum + detail.quantity, 0);
      const uniqueProducts = order.orderDetails.length;

      return {
        ...order,
        summary: {
          totalItems,
          uniqueProducts,
          totalPrice: order.totalPrice
        }
      };
    } catch (error) {
      console.error('Error getting order summary:', error);
      return null;
    }
  }
}