/**
 * @fileoverview Service for orchestrating all admin task services to generate comprehensive task listings
 * @source boombox-10.0/src/app/api/admin/tasks/route.ts (complete task listing logic)
 * 
 * SERVICE FUNCTIONALITY:
 * - Orchestrates all individual admin task services
 * - Generates comprehensive task listings for admin dashboard
 * - Handles task formatting and prioritization
 * - Provides unified interface for all admin task types
 * - Manages task categorization and organization
 * 
 * USED BY:
 * - Admin dashboard for displaying all pending tasks
 * - Task management interfaces for comprehensive overview
 * - Admin workflow coordination and task assignment
 * - Management reporting and task analytics
 * 
 * @refactor Extracted from monolithic admin tasks route to leverage service architecture
 */

import { prisma } from '@/lib/database/prismaClient';
import {
  AssignStorageUnitService,
  UnassignedDriverService,
  StorageUnitReturnService,
  AssignRequestedUnitService,
  NegativeFeedbackService,
  PendingCleaningService,
  PrepPackingSupplyOrderService,
  PrepUnitsDeliveryService,
  UpdateLocationService
} from '@/lib/services';

/**
 * Appointment statuses that should be excluded from task generation
 * Completed and Canceled/Cancelled appointments should not generate tasks
 */
const EXCLUDED_APPOINTMENT_STATUSES = ['Completed', 'Cancelled', 'Canceled'];

// Individual task services
export class AdminTaskListingService {
  private assignStorageUnitService = new AssignStorageUnitService();
  private unassignedDriverService = new UnassignedDriverService();
  private storageUnitReturnService = new StorageUnitReturnService();
  private assignRequestedUnitService = new AssignRequestedUnitService();
  private negativeFeedbackService = new NegativeFeedbackService();
  private pendingCleaningService = new PendingCleaningService();
  private prepPackingSupplyOrderService = new PrepPackingSupplyOrderService();
  private prepUnitsDeliveryService = new PrepUnitsDeliveryService();
  private updateLocationService = new UpdateLocationService();

  /**
   * Get all pending admin tasks from all services
   * @source boombox-10.0/src/app/api/admin/tasks/route.ts (entire GET endpoint)
   */
  async getAllPendingTasks() {
    try {
      // Run all task generation queries in parallel for optimal performance
      const [
        unassignedJobs,
        negativeFeedback,
        negativePackingSupplyFeedback,
        pendingCleaning,
        adminCheck,
        storageUnitNeeded,
        requestedAccessUnits,
        storageReturns,
        pendingLocationUpdate,
        prepUnitsDelivery,
        unpreppedPackingSupplyOrders
      ] = await Promise.all([
        this.getUnassignedJobs(),
        this.getNegativeFeedback(),
        this.getNegativePackingSupplyFeedback(),
        this.getPendingCleaning(),
        this.getAdminCheck(),
        this.getStorageUnitNeeded(),
        this.getRequestedAccessUnits(),
        this.getStorageReturns(),
        this.getPendingLocationUpdate(),
        this.getPrepUnitsDelivery(),
        this.getUnpreppedPackingSupplyOrders()
      ]);

      // Combine all tasks into unified response
      const allTasks = [
        ...unassignedJobs,
        ...negativeFeedback,
        ...negativePackingSupplyFeedback,
        ...pendingCleaning,
        ...adminCheck,
        ...storageUnitNeeded,
        ...requestedAccessUnits,
        ...storageReturns,
        ...pendingLocationUpdate,
        ...prepUnitsDelivery,
        ...unpreppedPackingSupplyOrders
      ];

      return {
        tasks: allTasks,
        summary: {
          total: allTasks.length,
          byType: this.getTaskSummaryByType(allTasks)
        }
      };
    } catch (error) {
      console.error('Error getting all pending tasks:', error);
      throw new Error('Failed to fetch pending tasks');
    }
  }

  /**
   * Get unassigned driver jobs using UnassignedDriverService
   * @source boombox-10.0/src/app/api/admin/tasks/route.ts (lines 15-57 + 368-395)
   */
  private async getUnassignedJobs() {
    try {
      const appointments = await this.getUnassignedDriverAppointments();
      
      return appointments.map(job => {
        const formattedDate = new Date(job.date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        return {
          id: `unassigned-${job.id}`,
          title: 'Unassigned Driver',
          description: 'Call moving partner and remind them to assign driver to job',
          details: `<strong>Job Code:</strong> ${job.jobCode}<br><strong>Job Date:</strong> ${formattedDate} - ${this.formatTime(job.time)}`,
          action: 'Remind Mover',
          actionUrl: `/admin/drivers?jobId=${job.id}`,
          color: 'rose',
          calledMovingPartner: job.calledMovingPartner,
          movingPartner: job.movingPartner,
          jobCode: job.jobCode,
          onfleetTaskIds: job.onfleetTasks?.map((task: { taskId: string }) => task.taskId).join(', ') || '',
          customerName: `${job.user?.firstName || ''} ${job.user?.lastName || ''}`,
          appointmentDate: formattedDate,
          appointmentAddress: job.address
        };
      });
    } catch (error) {
      console.error('Error getting unassigned jobs:', error);
      return [];
    }
  }

  /**
   * Get negative feedback tasks using NegativeFeedbackService
   * @source boombox-10.0/src/app/api/admin/tasks/route.ts (lines 58-78 + 396-404)
   */
  private async getNegativeFeedback() {
    try {
      const feedback = await this.getNegativeFeedbackRecords();
      
      return feedback.map(feedback => ({
        id: `feedback-${feedback.id}`,
        title: 'Negative Feedback',
        description: 'Respond to customer via email',
        details: `<strong>Job Code:</strong> ${feedback.appointment.jobCode}<br><strong>Rating:</strong> ${feedback.rating}`,
        action: 'Respond',
        actionUrl: `/admin/tasks/feedback-${feedback.id}/negative-feedback`,
        color: 'amber'
      }));
    } catch (error) {
      console.error('Error getting negative feedback:', error);
      return [];
    }
  }

  /**
   * Get negative packing supply feedback tasks
   * @source boombox-10.0/src/app/api/admin/tasks/route.ts (lines 79-103 + 405-421)
   */
  private async getNegativePackingSupplyFeedback() {
    try {
      const feedback = await prisma.packingSupplyFeedback.findMany({
        where: {
          rating: { lte: 3 },
          responded: false
        },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          packingSupplyOrder: {
            select: {
              id: true,
              onfleetTaskShortId: true,
              contactName: true,
              contactEmail: true,
              deliveryAddress: true
            }
          }
        }
      });

      return feedback.map(feedback => ({
        id: `packing-supply-feedback-${feedback.id}`,
        title: 'Negative Packing Supply Feedback',
        description: 'Respond to customer via email',
        details: `<strong>Order #:</strong> ${feedback.packingSupplyOrder.onfleetTaskShortId || feedback.packingSupplyOrder.id}<br><strong>Rating:</strong> ${feedback.rating}`,
        action: 'Respond',
        actionUrl: `/admin/tasks/packing-supply-feedback-${feedback.id}/negative-feedback`,
        color: 'amber'
      }));
    } catch (error) {
      console.error('Error getting negative packing supply feedback:', error);
      return [];
    }
  }

  /**
   * Get pending cleaning tasks using PendingCleaningService
   */
  private async getPendingCleaning() {
    try {
      const units = await this.pendingCleaningService.getAllPendingCleaningUnits();
      
      return units.map(unit => ({
        id: `pending-cleaning-${unit.id}`,
        title: 'Pending Cleaning',
        description: 'Clean storage unit and mark as complete',
        details: `<strong>Unit Number:</strong> ${unit.storageUnitNumber}`,
        action: 'Mark as Clean',
        actionUrl: `/admin/tasks/pending-cleaning-${unit.id}/pending-cleaning`,
        color: 'cyan',
        storageUnitNumber: unit.storageUnitNumber
      }));
    } catch (error) {
      console.error('Error getting pending cleaning:', error);
      return [];
    }
  }

  /**
   * Get admin check tasks (appointments needing admin review)
   * @source boombox-10.0/src/app/api/admin/tasks/route.ts (admin check query)
   * Excludes canceled and completed appointments
   */
  private async getAdminCheck() {
    try {
      // Get appointments that need storage unit assignment
      // These are Initial Pickup and Additional Storage appointments where units haven't been assigned yet
      const appointments = await prisma.appointment.findMany({
        where: {
          appointmentType: {
            in: ['Initial Pickup', 'Additional Storage']
          },
          date: {
            gte: new Date(),
            lt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // Next 2 days
          },
          // Appointments without storage unit usages that should have them
          storageStartUsages: {
            none: {}
          },
          // Exclude canceled and completed appointments
          status: {
            notIn: EXCLUDED_APPOINTMENT_STATUSES
          }
        },
        select: {
          id: true,
          jobCode: true,
          address: true,
          date: true,
          time: true,
          appointmentType: true,
          numberOfUnits: true,
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      return appointments.flatMap(appointment => {
        const numberOfUnits = appointment.numberOfUnits || 1;
        const tasks = [];
        
        for (let i = 1; i <= numberOfUnits; i++) {
          const formattedDate = new Date(appointment.date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short', 
            day: 'numeric'
          });
          
          tasks.push({
            id: `storage-${appointment.id}${numberOfUnits > 1 ? `-${i}` : ''}`,
            title: 'Assign Storage Unit',
            description: 'Assign storage unit to job. Verify job code and driver.',
            details: `<strong>Job Code:</strong> ${appointment.jobCode}<br><strong>Job Date:</strong> ${formattedDate}${numberOfUnits > 1 ? `<br><strong>Unit:</strong> ${i} of ${numberOfUnits}` : ''}`,
            action: 'Assign',
            actionUrl: `/admin/tasks/storage-${appointment.id}${numberOfUnits > 1 ? `-${i}` : ''}/assign-storage-unit`,
            color: 'orange',
            jobCode: appointment.jobCode,
            customerName: `${appointment.user?.firstName || ''} ${appointment.user?.lastName || ''}`,
            appointmentDate: formattedDate,
            appointmentId: appointment.id
          });
        }
        
        return tasks;
      });
    } catch (error) {
      console.error('Error getting admin check tasks:', error);
      return [];
    }
  }

  /**
   * Get storage unit needed tasks using AssignStorageUnitService
   */
  private async getStorageUnitNeeded() {
    try {
      // Already handled by adminCheck - this was duplicate logic
      return [];
    } catch (error) {
      console.error('Error getting storage unit needed:', error);
      return [];
    }
  }

  /**
   * Get requested access units using AssignRequestedUnitService
   */
  private async getRequestedAccessUnits() {
    try {
      const units = await this.assignRequestedUnitService.getAllRequestedUnitsNeedingAssignment();
      
      return units.map(unit => ({
        id: `requested-unit-${unit.appointmentId}-${unit.unitIndex || 1}`,
        title: 'Assign Requested Unit',
        description: 'Customer requested specific storage unit for access',
        details: `<strong>Job Code:</strong> ${unit.jobCode}<br><strong>Requested Unit:</strong> ${unit.requestedUnitNumber}`,
        action: 'Assign Unit',
        actionUrl: `/admin/tasks/requested-unit-${unit.appointmentId}-${unit.unitIndex || 1}/assign-requested-unit`,
        color: 'purple',
        appointmentId: unit.appointmentId
      }));
    } catch (error) {
      console.error('Error getting requested access units:', error);
      return [];
    }
  }

  /**
   * Get storage returns using StorageUnitReturnService
   * Handles all appointment types: Initial Pickup, Additional Storage, Storage Unit Access, End Storage Term/Plan
   */
  private async getStorageReturns() {
    try {
      const returns = await this.storageUnitReturnService.getAllStorageReturnsNeeded();
      
      return returns.map(returnItem => ({
        id: `storage-return-${returnItem.appointmentId}`,
        title: 'Storage Unit Return',
        description: 'Process storage unit return and damage assessment',
        details: `<strong>Job Code:</strong> ${returnItem.jobCode}<br><strong>Type:</strong> ${returnItem.appointmentType}<br><strong>Return Date:</strong> ${returnItem.appointmentDate}`,
        action: 'Process Return',
        actionUrl: `/admin/tasks/storage-return-${returnItem.appointmentId}/storage-unit-return`,
        color: 'indigo',
        appointmentId: returnItem.appointmentId
      }));
    } catch (error) {
      console.error('Error getting storage returns:', error);
      return [];
    }
  }

  /**
   * Get pending location updates using UpdateLocationService
   */
  private async getPendingLocationUpdate() {
    try {
      const usages = await this.updateLocationService.getAllUsagesNeedingLocationUpdate();
      
      return usages.map(usage => ({
        id: `update-location-${usage.id}`,
        title: 'Update Location',
        description: 'Update warehouse location for storage unit',
        details: `<strong>Unit Number:</strong> ${usage.storageUnit.storageUnitNumber}`,
        action: 'Update',
        actionUrl: `/admin/tasks/update-location-${usage.id}/update-location`,
        color: 'emerald',
        storageUnitNumber: usage.storageUnit.storageUnitNumber,
        customerName: `${usage.user?.firstName || ''} ${usage.user?.lastName || ''}`,
        usageId: usage.id
      }));
    } catch (error) {
      console.error('Error getting pending location updates:', error);
      return [];
    }
  }

  /**
   * Get prep units delivery using PrepUnitsDeliveryService
   */
  private async getPrepUnitsDelivery() {
    try {
      const appointments = await this.prepUnitsDeliveryService.getAllAppointmentsNeedingPrep();
      
      return appointments.map(appointment => {
        const formattedDate = new Date(appointment.date).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });
        
        return {
          id: `prep-delivery-${appointment.id}`,
          title: 'Prep Units for Delivery',
          description: 'Verify unit numbers and forklift them into staging area.',
          details: `<strong>Job Code:</strong> ${appointment.jobCode}<br><strong>Job Date:</strong> ${formattedDate} - ${this.formatTime(appointment.time)}<br><strong>Unit Numbers:</strong> ${appointment.requestedStorageUnits.map(unit => unit.storageUnit.storageUnitNumber).join(', ')}`,
          action: 'Mark Complete',
          actionUrl: `/admin/tasks/prep-delivery-${appointment.id}`,
          color: 'sky',
          jobCode: appointment.jobCode,
          customerName: `${appointment.user?.firstName || ''} ${appointment.user?.lastName || ''}`,
          appointmentDate: formattedDate,
          requestedStorageUnits: appointment.requestedStorageUnits
        };
      }).filter(Boolean);
    } catch (error) {
      console.error('Error getting prep units delivery:', error);
      return [];
    }
  }

  /**
   * Get unprepped packing supply orders using PrepPackingSupplyOrderService
   */
  private async getUnpreppedPackingSupplyOrders() {
    try {
      const orders = await this.prepPackingSupplyOrderService.getAllUnpreppedOrders();
      
      return orders.map(order => {
        const formattedDate = new Date(order.deliveryDate).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });
        
        return {
          id: `prep-packing-supply-${order.id}`,
          title: 'Prep Packing Supply Order',
          description: 'Organize packing supply order and prep it for pickup',
          details: `<strong>Order #:</strong> ${order.onfleetTaskShortId || order.id}<br><strong>Customer:</strong> ${order.contactName}<br><strong>Delivery Date:</strong> ${formattedDate}`,
          action: 'Prep Order',
          actionUrl: `/admin/delivery-routes`,
          color: 'darkAmber',
          customerName: order.contactName,
          deliveryAddress: order.deliveryAddress,
          driverName: order.assignedDriver ? `${order.assignedDriver.firstName} ${order.assignedDriver.lastName}` : 'Unassigned driver',
          onfleetTaskShortId: order.onfleetTaskShortId
        };
      });
    } catch (error) {
      console.error('Error getting unprepped packing supply orders:', error);
      return [];
    }
  }

  /**
   * Helper method to get unassigned driver appointments
   * Uses direct query since UnassignedDriverService doesn't have bulk method yet
   * Excludes canceled and completed appointments
   */
  private async getUnassignedDriverAppointments() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return await prisma.appointment.findMany({
      where: {
        date: {
          gte: today,
          lt: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)
        },
        onfleetTasks: {
          none: {
            driverId: { not: null }
          }
        },
        movingPartner: {
          isNot: null
        },
        // Exclude canceled and completed appointments
        status: {
          notIn: EXCLUDED_APPOINTMENT_STATUSES
        }
      },
      select: {
        id: true,
        jobCode: true,
        address: true,
        date: true,
        time: true,
        calledMovingPartner: true,
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        movingPartner: {
          select: {
            name: true,
            email: true,
            phoneNumber: true,
            imageSrc: true
          }
        },
        onfleetTasks: {
          select: {
            taskId: true
          }
        }
      }
    });
  }

  /**
   * Helper method to get negative feedback records
   * Uses direct query since NegativeFeedbackService doesn't have bulk method yet
   * Only excludes feedback for canceled appointments (not completed - feedback comes after completion)
   */
  private async getNegativeFeedbackRecords() {
    return await prisma.feedback.findMany({
      where: {
        rating: { lte: 3 },
        responded: false,
        // Only exclude feedback for canceled appointments (feedback is submitted after completion)
        appointment: {
          status: {
            notIn: ['Cancelled', 'Canceled']
          }
        }
      },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        appointment: {
          select: {
            id: true,
            jobCode: true,
            address: true
          }
        }
      }
    });
  }

  /**
   * Helper method to format time consistently
   * @source boombox-10.0/src/app/api/admin/tasks/route.ts (lines 358-364)
   */
  private formatTime(dateTime: Date): string {
    const hours = dateTime.getHours();
    const minutes = dateTime.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    const hour12 = hours % 12 || 12;
    return `${hour12}${minutes === 0 ? '' : ':' + minutes.toString().padStart(2, '0')}${ampm}`;
  }

  /**
   * Helper method to generate task summary by type
   */
  private getTaskSummaryByType(tasks: any[]) {
    const summary: Record<string, number> = {};
    
    tasks.forEach(task => {
      const type = task.title;
      summary[type] = (summary[type] || 0) + 1;
    });
    
    return summary;
  }

  /**
   * Get task statistics for dashboard
   */
  async getTaskStatistics() {
    try {
      const tasks = await this.getAllPendingTasks();
      const tasksByType = tasks.summary.byType;
      
      return {
        totalTasks: tasks.summary.total,
        criticalTasks: tasksByType['Unassigned Driver'] || 0,
        urgentTasks: (tasksByType['Negative Feedback'] || 0) + (tasksByType['Negative Packing Supply Feedback'] || 0),
        tasksByType: tasksByType,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting task statistics:', error);
      return {
        totalTasks: 0,
        criticalTasks: 0,
        urgentTasks: 0,
        tasksByType: {},
        lastUpdated: new Date().toISOString()
      };
    }
  }
}