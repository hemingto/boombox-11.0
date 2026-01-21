/**
 * @fileoverview Service for handling storage unit preparation for customer delivery/access appointments
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (prep-delivery task display logic)
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/prep-units-delivery/route.ts (unit prep processing logic)
 * 
 * SERVICE FUNCTIONALITY:
 * - Get unit delivery preparation task details for display
 * - Process unit preparation by marking storage units as ready for delivery
 * - Handle validation of unit numbers and appointment types
 * - Manage staging area preparation and physical unit organization
 * - Create prep audit trails and admin logging
 * 
 * USED BY:
 * - Admin task management interface for unit delivery preparation workflow
 * - Storage unit access appointment coordination
 * - Warehouse operations and unit staging management
 * - Customer service delivery scheduling
 * 
 * @refactor Extracted from monolithic admin tasks route for better organization
 */

import { prisma } from '@/lib/database/prismaClient';
import { 
  formatTaskDate,
  formatTaskTime,
  validateAppointmentForUnitsDelivery,
  markUnitsReadyForDelivery
} from '@/lib/utils/adminTaskUtils';

/**
 * Appointment statuses that should be excluded from task generation
 * Completed and Canceled/Cancelled appointments should not generate tasks
 */
const EXCLUDED_APPOINTMENT_STATUSES = ['Completed', 'Cancelled', 'Canceled'];

// Prep units delivery task interface
export interface PrepUnitsDeliveryTask {
  id: string;
  title: 'Prep Units for Delivery';
  description: string;
  action: 'Mark Complete';
  color: 'sky';
  details: string;
  jobCode: string;
  customerName: string;
  appointmentDate: string;
  appointmentAddress: string;
  requestedStorageUnits: Array<{
    id: number;
    storageUnitId: number;
    unitsReady: boolean;
    storageUnit: {
      id: number;
      storageUnitNumber: string;
    };
  }>;
}

// Unit prep request interface
export interface UnitsDeliveryPrepRequest {
  unitNumbers: string[];
}

// Prep result interface
export interface UnitsDeliveryPrepResult {
  success: boolean;
  message: string;
  updatedUnits?: number;
  error?: string;
}

export class PrepUnitsDeliveryService {
  /**
   * Get unit delivery preparation task details for display
   * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (lines 315-344)
   */
  async getPrepDeliveryTask(appointmentId: number): Promise<PrepUnitsDeliveryTask | null> {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: {
          id: true,
          jobCode: true,
          address: true,
          date: true,
          time: true,
          appointmentType: true,
          user: {
            select: {
              firstName: true,
              lastName: true
              
            }
          },
          requestedStorageUnits: {
            select: {
              id: true,
              storageUnitId: true,
              unitsReady: true,
              storageUnit: {
                select: {
                  id: true,
                  storageUnitNumber: true
                }
              }
            }
          }
        }
      });

      if (!appointment) {
        return null;
      }

      // Only return task for appointments that need unit delivery prep
      if (!['Storage Unit Access', 'End Storage Plan'].includes(appointment.appointmentType)) {
        return null;
      }

      // Only return if there are units that need preparation (unitsReady: false)
      const unreadyUnits = appointment.requestedStorageUnits.filter(unit => !unit.unitsReady);
      if (unreadyUnits.length === 0) {
        return null;
      }

      const formattedDate = formatTaskDate(appointment.date);
      const formattedTime = formatTaskTime(appointment.time);
      const customerName = `${appointment.user?.firstName || ''} ${appointment.user?.lastName || ''}`.trim();
      const unitNumbers = appointment.requestedStorageUnits.map(unit => unit.storageUnit.storageUnitNumber).join(', ');

      // Generate task ID in the expected format
      const taskId = `prep-delivery-${appointmentId}`;

      return {
        id: taskId,
        title: 'Prep Units for Delivery',
        description: 'Verify unit numbers and forklift them into staging area.',
        action: 'Mark Complete',
        color: 'sky',
        details: `<strong>Job Code:</strong> ${appointment.jobCode ?? ''}<br><strong>Job Date:</strong> ${formattedDate} - ${formattedTime}<br><strong>Unit Numbers:</strong> ${unitNumbers}`,
        jobCode: appointment.jobCode ?? '',
        customerName: customerName,
        appointmentDate: formattedDate,
        appointmentAddress: appointment.address ?? '',
        requestedStorageUnits: appointment.requestedStorageUnits
      };
    } catch (error) {
      console.error('Error getting prep units delivery task:', error);
      return null;
    }
  }

  /**
   * Process unit preparation for delivery by marking units as ready
   * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/prep-units-delivery/route.ts
   */
  async prepareUnitsForDelivery(
    appointmentId: number,
    adminId: number,
    request: UnitsDeliveryPrepRequest
  ): Promise<UnitsDeliveryPrepResult> {
    try {
      const { unitNumbers } = request;

      if (!unitNumbers || unitNumbers.length === 0) {
        return {
          success: false,
          message: '',
          error: 'Unit numbers are required'
        };
      }

      // Validate appointment for unit delivery preparation
      const validation = await validateAppointmentForUnitsDelivery(appointmentId);
      if (!validation.valid) {
        return {
          success: false,
          message: '',
          error: validation.error || 'Validation failed'
        };
      }

      // Execute unit preparation with database transaction
      const result = await markUnitsReadyForDelivery(appointmentId, unitNumbers, adminId);

      return {
        success: true,
        message: 'Storage units prepared for delivery successfully',
        updatedUnits: result.updatedUnits
      };

    } catch (error) {
      console.error('Error preparing units for delivery:', error);
      return {
        success: false,
        message: '',
        error: error instanceof Error ? error.message : 'Failed to prepare units for delivery'
      };
    }
  }

  /**
   * Check if appointment needs unit delivery preparation
   * Used by the task listing service to determine if tasks should be created
   */
  async isDeliveryPrepNeeded(appointmentId: number): Promise<boolean> {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: {
          appointmentType: true,
          date: true,
          requestedStorageUnits: {
            select: { unitsReady: true }
          }
        }
      });

      if (!appointment) return false;

      // Must be Storage Unit Access or End Storage Plan appointment
      if (!['Storage Unit Access', 'End Storage Plan'].includes(appointment.appointmentType)) {
        return false;
      }

      // Must be within next 2 days
      const today = new Date();
      const twoDaysFromNow = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
      const appointmentDate = new Date(appointment.date);
      
      if (appointmentDate < today || appointmentDate > twoDaysFromNow) {
        return false;
      }

      // Must have at least one unit that is not ready
      return appointment.requestedStorageUnits.some(unit => !unit.unitsReady);
    } catch (error) {
      console.error('Error checking delivery prep need:', error);
      return false;
    }
  }

  /**
   * Get all appointments that need unit delivery preparation
   * Helper method for task generation
   * @source boombox-10.0/src/app/api/admin/tasks/route.ts (lines 281-318)
   * Excludes canceled and completed appointments
   */
  async getAllAppointmentsNeedingPrep() {
    try {
      const today = new Date();
      const twoDaysFromNow = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);

      return await prisma.appointment.findMany({
        where: {
          appointmentType: {
            in: ['Storage Unit Access', 'End Storage Plan']
          },
          date: {
            gte: today,
            lt: twoDaysFromNow
          },
          requestedStorageUnits: {
            some: {
              unitsReady: false  // Only get appointments where units are not ready
            }
          },
          // Exclude canceled and completed appointments
          status: {
            notIn: EXCLUDED_APPOINTMENT_STATUSES
          }
        },
        select: {
          id: true,
          jobCode: true,
          date: true,
          time: true,
          appointmentType: true,
          address: true,
          user: {
            select: {
              firstName: true,
              lastName: true
              
            }
          },
          requestedStorageUnits: {
            include: {
              storageUnit: {
                select: {
                  storageUnitNumber: true
                }
              }
            }
          }
        },
        orderBy: {
          date: 'asc' // Earliest appointments first for priority
        }
      });
    } catch (error) {
      console.error('Error getting appointments needing prep:', error);
      return [];
    }
  }

  /**
   * Get prep history for an appointment
   * Helper method for detailed tracking
   */
  async getPrepHistory(appointmentId: number) {
    try {
      return await prisma.adminLog.findMany({
        where: { 
          targetType: 'Appointment',
          targetId: appointmentId.toString(),
          action: 'Prepared units for delivery'
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
   * Get unit readiness status for appointment
   * Helper method for delivery coordination
   */
  async getUnitReadinessStatus(appointmentId: number) {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: {
          id: true,
          jobCode: true,
          appointmentType: true,
          date: true,
          requestedStorageUnits: {
            select: {
              id: true,
              unitsReady: true,
              storageUnit: {
                select: {
                  storageUnitNumber: true,
                  status: true
                }
              }
            }
          }
        }
      });

      if (!appointment) return null;

      const totalUnits = appointment.requestedStorageUnits.length;
      const readyUnits = appointment.requestedStorageUnits.filter(unit => unit.unitsReady).length;
      const unreadyUnits = appointment.requestedStorageUnits.filter(unit => !unit.unitsReady);

      return {
        appointment: appointment,
        summary: {
          totalUnits,
          readyUnits,
          unreadyUnits: totalUnits - readyUnits,
          allReady: readyUnits === totalUnits
        },
        unreadyUnitNumbers: unreadyUnits.map(unit => unit.storageUnit.storageUnitNumber)
      };
    } catch (error) {
      console.error('Error getting unit readiness status:', error);
      return null;
    }
  }

  /**
   * Get upcoming delivery schedule
   * Helper method for warehouse planning
   */
  async getUpcomingDeliverySchedule(days: number = 7) {
    try {
      const today = new Date();
      const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

      const appointments = await prisma.appointment.findMany({
        where: {
          appointmentType: {
            in: ['Storage Unit Access', 'End Storage Plan']
          },
          date: {
            gte: today,
            lt: futureDate
          }
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          requestedStorageUnits: {
            include: {
              storageUnit: {
                select: {
                  storageUnitNumber: true,
                  status: true
                }
              }
            }
          }
        },
        orderBy: {
          date: 'asc'
        }
      });

      return appointments.map(appointment => {
        const readyUnits = appointment.requestedStorageUnits.filter(unit => unit.unitsReady).length;
        const totalUnits = appointment.requestedStorageUnits.length;
        
        return {
          ...appointment,
          prepStatus: {
            ready: readyUnits,
            total: totalUnits,
            needsPrep: readyUnits < totalUnits
          }
        };
      });
    } catch (error) {
      console.error('Error getting delivery schedule:', error);
      return [];
    }
  }
}