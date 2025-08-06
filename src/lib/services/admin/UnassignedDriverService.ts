/**
 * @fileoverview Service for handling unassigned driver tasks and moving partner reminders
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (unassigned task display logic)
 * @source boombox-10.0/src/app/api/admin/appointments/[id]/called-moving-partner/route.ts (contact tracking logic)
 * 
 * SERVICE FUNCTIONALITY:
 * - Get unassigned driver task details for display
 * - Process moving partner contact tracking
 * - Handle driver assignment reminders
 * - Create audit logs for admin actions
 * 
 * USED BY:
 * - Admin task management interface
 * - Driver assignment oversight workflows
 * - Moving partner communication tracking
 * 
 * @refactor Extracted from monolithic admin tasks route for better organization
 */

import { prisma } from '@/lib/database/prismaClient';
import { 
  formatTaskDate, 
  formatTaskTime,
  updateMovingPartnerContactFlags,
  createMovingPartnerContactLog
} from '@/lib/utils/adminTaskUtils';

// Unassigned driver task interface
export interface UnassignedDriverTask {
  id: string;
  title: 'Unassigned Driver';
  description: string;
  action: 'Remind Mover';
  color: 'rose';
  details: string;
  movingPartner: {
    name: string;
    email: string;
    phoneNumber: string;
    imageSrc: string | null;
  } | null;
  jobCode: string;
  appointmentDate: string;
  appointmentAddress: string;
  calledMovingPartner: boolean | null;
  onfleetTaskIds?: string;
  customerName: string;
}

// Moving partner contact request interface
export interface MovingPartnerContactRequest {
  calledMovingPartner: boolean;
  gotHoldOfMovingPartner?: boolean;
}

// Contact update result interface
export interface MovingPartnerContactResult {
  success: boolean;
  message: string;
  appointment?: any;
  error?: string;
}

export class UnassignedDriverService {
  /**
   * Get unassigned driver task details for display
   * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (lines 300-313)
   */
  async getUnassignedDriverTask(appointmentId: number): Promise<UnassignedDriverTask | null> {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
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

      if (!appointment) {
        return null;
      }

      const formattedDate = formatTaskDate(appointment.date);
      const customerName = `${appointment.user?.firstName || ''} ${appointment.user?.lastName || ''}`.trim();
      const onfleetTaskIds = appointment.onfleetTasks?.map(task => task.taskId).join(', ') || '';
      
      // Generate task ID in the expected format
      const taskId = `unassigned-${appointmentId}`;

      return {
        id: taskId,
        title: 'Unassigned Driver',
        description: 'Call moving partner and remind them to assign driver to job',
        action: 'Remind Mover',
        color: 'rose',
        details: `<strong>Job Code:</strong> ${appointment.jobCode ?? ''}<br><strong>Job Date:</strong> ${formattedDate}`,
        movingPartner: appointment.movingPartner ? {
          name: appointment.movingPartner.name,
          email: appointment.movingPartner.email ?? '',
          phoneNumber: appointment.movingPartner.phoneNumber ?? '',
          imageSrc: appointment.movingPartner.imageSrc
        } : null,
        jobCode: appointment.jobCode ?? '',
        appointmentDate: formattedDate,
        appointmentAddress: appointment.address ?? '',
        calledMovingPartner: appointment.calledMovingPartner,
        onfleetTaskIds: onfleetTaskIds,
        customerName: customerName
      };
    } catch (error) {
      console.error('Error getting unassigned driver task:', error);
      return null;
    }
  }

  /**
   * Update moving partner contact tracking
   * @source boombox-10.0/src/app/api/admin/appointments/[id]/called-moving-partner/route.ts
   */
  async updateMovingPartnerContact(
    appointmentId: number,
    adminId: number,
    request: MovingPartnerContactRequest
  ): Promise<MovingPartnerContactResult> {
    try {
      const { calledMovingPartner, gotHoldOfMovingPartner } = request;

      // Update appointment flags
      const updatedAppointment = await updateMovingPartnerContactFlags(
        appointmentId,
        calledMovingPartner,
        gotHoldOfMovingPartner
      );

      // Create admin log entry
      await createMovingPartnerContactLog(adminId, appointmentId, calledMovingPartner);

      return {
        success: true,
        message: calledMovingPartner ? 'Moving partner contact recorded' : 'Moving partner contact status updated',
        appointment: updatedAppointment
      };

    } catch (error) {
      console.error('Error updating moving partner contact:', error);
      return {
        success: false,
        message: '',
        error: 'Failed to update moving partner contact'
      };
    }
  }

  /**
   * Check if appointment has unassigned driver issue
   * Used by the task listing service to determine if tasks should be created
   */
  async isDriverUnassigned(appointmentId: number): Promise<boolean> {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: {
          movingPartner: {
            select: { id: true }
          },
          onfleetTasks: {
            select: {
              driverId: true
            }
          }
        }
      });

      if (!appointment || !appointment.movingPartner) {
        return false; // No moving partner means this isn't an unassigned driver issue
      }

      // Check if any onfleet tasks have assigned drivers
      const hasAssignedDriver = appointment.onfleetTasks.some(task => task.driverId !== null);
      
      return !hasAssignedDriver; // True if no drivers are assigned
    } catch (error) {
      console.error('Error checking driver assignment status:', error);
      return false;
    }
  }
}