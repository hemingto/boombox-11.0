/**
 * @fileoverview Service for handling negative feedback processing and email responses
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (feedback task display logic)
 * @source boombox-10.0/src/app/api/admin/feedback/[id]/respond/route.ts (feedback response processing logic)
 * 
 * SERVICE FUNCTIONALITY:
 * - Get negative feedback task details for display (both regular and packing supply)
 * - Process feedback responses with email sending and status updates
 * - Handle SendGrid email integration for customer communication
 * - Manage feedback status transitions and admin audit logging
 * - Support both appointment feedback and packing supply delivery feedback
 * 
 * USED BY:
 * - Admin task management interface for feedback review and response
 * - Customer service workflows for negative feedback resolution
 * - Email response and communication tracking systems
 * 
 * @refactor Extracted from monolithic admin tasks route for better organization
 */

import { prisma } from '@/lib/database/prismaClient';
import sgMail from '@sendgrid/mail';
import { 
  markFeedbackAsResponded,
  sendFeedbackResponseEmail,
  createFeedbackResponseLog
} from '@/lib/utils/adminTaskUtils';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Negative feedback task interface
export interface NegativeFeedbackTask {
  id: string;
  title: 'Negative Feedback' | 'Negative Packing Supply Feedback';
  description: string;
  action: 'Respond';
  color: 'amber';
  details: string;
  feedback: {
    id: number;
    rating: number;
    comment: string | null;
  };
  jobCode: string;
  appointment: {
    date: string;
    appointmentType: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

// Feedback response request interface
export interface FeedbackResponseRequest {
  emailSubject: string;
  emailBody: string;
  feedbackType?: 'regular' | 'packing-supply';
}

// Response processing result interface
export interface FeedbackResponseResult {
  success: boolean;
  message: string;
  updatedFeedback?: any;
  error?: string;
}

export class NegativeFeedbackService {
  /**
   * Get negative feedback task details for display
   * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (lines 127-211)
   */
  async getNegativeFeedbackTask(feedbackId: number): Promise<NegativeFeedbackTask | null> {
    try {
      // First try to find regular feedback
      const regularFeedback = await prisma.feedback.findUnique({
        where: { id: feedbackId },
        include: {
          appointment: {
            select: {
              id: true,
              jobCode: true,
              address: true,
              date: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        }
      });

      if (regularFeedback) {
        const taskId = `feedback-${feedbackId}`;
        
        return {
          id: taskId,
          title: 'Negative Feedback',
          description: 'Respond to customer via email',
          action: 'Respond',
          color: 'amber',
          details: `<strong>Job Code:</strong> ${regularFeedback.appointment.jobCode ?? ''}<br><strong>Rating:</strong> ${regularFeedback.rating}`,
          feedback: {
            id: regularFeedback.id,
            rating: regularFeedback.rating,
            comment: regularFeedback.comment
          },
          jobCode: regularFeedback.appointment.jobCode ?? '',
          appointment: {
            date: regularFeedback.appointment.date.toISOString(),
            appointmentType: 'Appointment',
            user: {
              firstName: regularFeedback.appointment.user.firstName,
              lastName: regularFeedback.appointment.user.lastName,
              email: regularFeedback.appointment.user.email
            }
          }
        };
      }

      // Try to find packing supply feedback
      const packingSupplyFeedback = await prisma.packingSupplyFeedback.findUnique({
        where: { id: feedbackId },
        include: {
          packingSupplyOrder: {
            select: {
              id: true,
              onfleetTaskShortId: true,
              contactName: true,
              contactEmail: true,
              deliveryAddress: true,
              deliveryDate: true
            }
          }
        }
      });

      if (packingSupplyFeedback) {
        const taskId = `packing-supply-feedback-${feedbackId}`;
        const nameParts = packingSupplyFeedback.packingSupplyOrder.contactName.split(' ');
        
        return {
          id: taskId,
          title: 'Negative Packing Supply Feedback',
          description: 'Respond to customer via email',
          action: 'Respond',
          color: 'amber',
          details: `<strong>Order #:</strong> ${packingSupplyFeedback.packingSupplyOrder.onfleetTaskShortId || packingSupplyFeedback.packingSupplyOrder.id}<br><strong>Rating:</strong> ${packingSupplyFeedback.rating}`,
          feedback: {
            id: packingSupplyFeedback.id,
            rating: packingSupplyFeedback.rating,
            comment: packingSupplyFeedback.comment
          },
          jobCode: packingSupplyFeedback.packingSupplyOrder.onfleetTaskShortId || `PS-${packingSupplyFeedback.packingSupplyOrder.id}`,
          appointment: {
            date: packingSupplyFeedback.packingSupplyOrder.deliveryDate.toISOString(),
            appointmentType: 'Packing Supply Delivery',
            user: {
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
              email: packingSupplyFeedback.packingSupplyOrder.contactEmail
            }
          }
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting negative feedback task:', error);
      return null;
    }
  }

  /**
   * Process feedback response with email sending and status updates
   * @source boombox-10.0/src/app/api/admin/feedback/[id]/respond/route.ts
   */
  async processFeedbackResponse(
    feedbackId: number,
    adminId: number,
    adminEmail: string,
    request: FeedbackResponseRequest
  ): Promise<FeedbackResponseResult> {
    try {
      const { emailSubject, emailBody } = request;
      
      let feedback: any = null;
      let userEmail: string = '';
      let userName: string = '';
      let jobCode: string = '';
      let isPackingSupplyFeedback = false;

      // First try to find regular feedback
      const regularFeedback = await prisma.feedback.findUnique({
        where: { id: feedbackId },
        include: {
          appointment: {
            include: {
              user: {
                select: {
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      if (regularFeedback) {
        feedback = regularFeedback;
        userEmail = regularFeedback.appointment.user.email;
        userName = `${regularFeedback.appointment.user.firstName} ${regularFeedback.appointment.user.lastName}`;
        jobCode = regularFeedback.appointment.jobCode || 'N/A';
        isPackingSupplyFeedback = false;
      } else {
        // Try to find packing supply feedback
        const packingSupplyFeedback = await prisma.packingSupplyFeedback.findUnique({
          where: { id: feedbackId },
          include: {
            packingSupplyOrder: {
              select: {
                contactEmail: true,
                contactName: true,
                onfleetTaskShortId: true,
              },
            },
          },
        });

        if (packingSupplyFeedback) {
          feedback = packingSupplyFeedback;
          userEmail = packingSupplyFeedback.packingSupplyOrder.contactEmail;
          userName = packingSupplyFeedback.packingSupplyOrder.contactName;
          jobCode = packingSupplyFeedback.packingSupplyOrder.onfleetTaskShortId || 'N/A';
          isPackingSupplyFeedback = true;
        }
      }

      if (!feedback) {
        return {
          success: false,
          message: '',
          error: 'Feedback not found'
        };
      }

      // Send email using SendGrid
      const emailMessage = await sendFeedbackResponseEmail(
        userEmail,
        adminEmail,
        emailSubject,
        emailBody
      );

      try {
        await sgMail.send(emailMessage);
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        return {
          success: false,
          message: '',
          error: 'Failed to send email response'
        };
      }

      // Update feedback record
      const updatedFeedback = await markFeedbackAsResponded(
        feedbackId,
        emailBody,
        isPackingSupplyFeedback
      );

      // Create admin log entry
      await createFeedbackResponseLog(
        adminId,
        feedbackId,
        jobCode,
        isPackingSupplyFeedback
      );

      return {
        success: true,
        message: 'Feedback response sent successfully',
        updatedFeedback: updatedFeedback
      };

    } catch (error) {
      console.error('Error processing feedback response:', error);
      return {
        success: false,
        message: '',
        error: 'Failed to process feedback response'
      };
    }
  }

  /**
   * Check if feedback response is needed
   * Used by the task listing service to determine if tasks should be created
   */
  async isFeedbackResponseNeeded(feedbackId: number): Promise<boolean> {
    try {
      // Check regular feedback
      const regularFeedback = await prisma.feedback.findUnique({
        where: { id: feedbackId },
        select: { rating: true, responded: true }
      });

      if (regularFeedback) {
        return regularFeedback.rating <= 3 && !regularFeedback.responded;
      }

      // Check packing supply feedback
      const packingSupplyFeedback = await prisma.packingSupplyFeedback.findUnique({
        where: { id: feedbackId },
        select: { rating: true, responded: true }
      });

      if (packingSupplyFeedback) {
        return packingSupplyFeedback.rating <= 3 && !packingSupplyFeedback.responded;
      }

      return false;
    } catch (error) {
      console.error('Error checking feedback response need:', error);
      return false;
    }
  }

  /**
   * Get all unresponded negative feedback (both types)
   * Helper method for task generation
   */
  async getAllUnrespondedNegativeFeedback() {
    try {
      const [regularFeedback, packingSupplyFeedback] = await Promise.all([
        // Regular feedback
        prisma.feedback.findMany({
          where: {
            rating: { lte: 3 },
            responded: false
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
        }),
        // Packing supply feedback  
        prisma.packingSupplyFeedback.findMany({
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
        })
      ]);

      return {
        regularFeedback,
        packingSupplyFeedback
      };
    } catch (error) {
      console.error('Error getting unresponded negative feedback:', error);
      return {
        regularFeedback: [],
        packingSupplyFeedback: []
      };
    }
  }
}