/**
 * @fileoverview Service for handling per-unit storage unit return processing and inspection
 *
 * SERVICE FUNCTIONALITY:
 * - Get per-unit storage unit return task details for display
 * - Process individual unit returns with damage inspection, padlock tracking, and item verification
 * - Defer all billing until the last unit for an appointment is checked in
 * - Handle subscription adjustments and credit notes based on appointment type
 * - Create padlock invoices aggregated across all units
 *
 * USED BY:
 * - Admin task management interface
 * - Storage unit return processing workflows
 * - Damage inspection and reporting systems
 */

import { prisma } from '@/lib/database/prismaClient';

import {
  formatTaskDate,
  updateStorageUnitForReturn,
  updateStorageUnitUsageForAccess,
  createStorageReturnLog,
} from '@/lib/utils/adminTaskUtils';
import { StripeSubscriptionService } from '@/lib/services/stripe/stripeSubscriptionService';
import { StripeInvoiceService } from '@/lib/services/stripe/stripeInvoiceService';

export interface StorageUnitReturnTask {
  id: string;
  title: 'Storage Unit Return';
  description: string;
  action: 'Process Return';
  color: 'purple';
  details: string;
  movingPartner: {
    name: string;
    email: string;
    phoneNumber: string;
    imageSrc: string | null;
  } | null;
  driver: {
    firstName: string;
    lastName: string;
  } | null;
  jobCode: string;
  customerName: string;
  appointmentDate: string;
  appointmentAddress: string;
  storageUnitNumber: string;
  appointmentId: string;
  storageUnitId?: string;
  isLastUnit?: boolean;
  appointment: {
    date: string;
    appointmentType: string;
    user: {
      firstName: string;
      lastName: string;
    } | null;
  };
}

export interface PerUnitReturnRequest {
  storageUnitId: number;
  isStoringItems: boolean;
  hasDamage: boolean;
  damageDescription?: string | null;
  frontPhotos: string[];
  backPhotos: string[];
  padlockProvided: boolean;
}

export interface StorageUnitReturnResult {
  success: boolean;
  message: string;
  appointment?: any;
  billingTriggered?: boolean;
  error?: string;
}

interface PerUnitReturnEntry {
  appointmentId: number;
  storageUnitId: number;
  usageId: number;
  storageUnitNumber: string;
  jobCode: string;
  appointmentDate: string;
  appointmentType: string;
}

export class StorageUnitReturnService {
  /**
   * Get storage unit return task details for a specific unit
   */
  async getStorageUnitReturnTask(
    appointmentId: number,
    storageUnitId?: number
  ): Promise<StorageUnitReturnTask | null> {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: {
          id: true,
          jobCode: true,
          address: true,
          date: true,
          appointmentType: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          movingPartner: {
            select: {
              name: true,
              email: true,
              phoneNumber: true,
              imageSrc: true,
            },
          },
          onfleetTasks: {
            where: {
              driverId: { not: null },
            },
            select: {
              driver: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
            take: 1,
          },
          requestedStorageUnits: {
            include: {
              storageUnit: {
                select: {
                  id: true,
                  storageUnitNumber: true,
                },
              },
            },
          },
          storageStartUsages: {
            include: {
              storageUnit: {
                select: {
                  id: true,
                  storageUnitNumber: true,
                },
              },
            },
          },
        },
      });

      if (!appointment) {
        return null;
      }

      const formattedDate = formatTaskDate(appointment.date);
      const customerName =
        `${appointment.user?.firstName || ''} ${appointment.user?.lastName || ''}`.trim();

      let storageUnitInfo: { id: number; storageUnitNumber: string } | null =
        null;

      if (storageUnitId) {
        const requestedUnit = await prisma.requestedAccessStorageUnit.findFirst(
          {
            where: { appointmentId, storageUnitId },
            include: { storageUnit: true },
          }
        );

        if (requestedUnit?.storageUnit) {
          storageUnitInfo = {
            id: requestedUnit.storageUnit.id,
            storageUnitNumber: requestedUnit.storageUnit.storageUnitNumber,
          };
        } else {
          const usageRecord = await prisma.storageUnitUsage.findFirst({
            where: { startAppointmentId: appointmentId, storageUnitId },
            include: { storageUnit: true },
          });

          if (usageRecord?.storageUnit) {
            storageUnitInfo = {
              id: usageRecord.storageUnit.id,
              storageUnitNumber: usageRecord.storageUnit.storageUnitNumber,
            };
          } else {
            const storageUnit = await prisma.storageUnit.findUnique({
              where: { id: storageUnitId },
            });
            if (storageUnit) {
              storageUnitInfo = {
                id: storageUnit.id,
                storageUnitNumber: storageUnit.storageUnitNumber,
              };
            }
          }
        }
      } else {
        if (appointment.storageStartUsages.length > 0) {
          const firstUsage = appointment.storageStartUsages[0];
          if (firstUsage.storageUnit) {
            storageUnitInfo = {
              id: firstUsage.storageUnit.id,
              storageUnitNumber: firstUsage.storageUnit.storageUnitNumber,
            };
          }
        } else if (appointment.requestedStorageUnits.length > 0) {
          const firstRequest = appointment.requestedStorageUnits[0];
          if (firstRequest.storageUnit) {
            storageUnitInfo = {
              id: firstRequest.storageUnit.id,
              storageUnitNumber: firstRequest.storageUnit.storageUnitNumber,
            };
          }
        }
      }

      const taskId = storageUnitId
        ? `storage-return-${appointmentId}-${storageUnitId}`
        : `storage-return-${appointmentId}`;

      const driver = appointment.onfleetTasks?.[0]?.driver ?? null;

      // Determine if this is the last unprocessed unit
      const allUsages = await this.resolveUsagesForAppointment(appointmentId);
      const unprocessedCount = allUsages.filter(u => !u.returnProcessed).length;
      const isLastUnit = unprocessedCount <= 1;

      return {
        id: taskId,
        title: 'Storage Unit Return',
        description:
          'Check back in unit. Inspect for damage. Check for padlock.',
        action: 'Process Return',
        color: 'purple',
        details: `<strong>Job Code:</strong> ${appointment.jobCode ?? ''}<br><strong>Job Type:</strong> ${appointment.appointmentType ?? ''}${storageUnitInfo ? `<br><strong>Unit Number:</strong> ${storageUnitInfo.storageUnitNumber}` : ''}`,
        movingPartner: appointment.movingPartner
          ? {
              name: appointment.movingPartner.name,
              email: appointment.movingPartner.email ?? '',
              phoneNumber: appointment.movingPartner.phoneNumber ?? '',
              imageSrc: appointment.movingPartner.imageSrc,
            }
          : null,
        driver: driver
          ? {
              firstName: driver.firstName,
              lastName: driver.lastName,
            }
          : null,
        jobCode: appointment.jobCode ?? '',
        customerName,
        appointmentDate: formattedDate,
        appointmentAddress: appointment.address ?? '',
        storageUnitNumber: storageUnitInfo?.storageUnitNumber || 'Unknown',
        appointmentId: appointmentId.toString(),
        storageUnitId: storageUnitInfo?.id?.toString(),
        isLastUnit,
        appointment: {
          date: formattedDate,
          appointmentType: appointment.appointmentType ?? '',
          user: appointment.user,
        },
      };
    } catch (error) {
      console.error('Error getting storage unit return task:', error);
      return null;
    }
  }

  /**
   * Process a single unit's return. Saves answers to StorageUnitUsage,
   * updates StorageUnit status, creates damage report if needed.
   * When the last unit for the appointment is processed, triggers deferred billing.
   */
  async processPerUnitReturn(
    appointmentId: number,
    adminId: number,
    request: PerUnitReturnRequest
  ): Promise<StorageUnitReturnResult> {
    try {
      const {
        storageUnitId,
        isStoringItems,
        hasDamage,
        damageDescription,
        frontPhotos,
        backPhotos,
        padlockProvided,
      } = request;

      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              stripeCustomerId: true,
            },
          },
        },
      });

      if (!appointment) {
        return { success: false, message: '', error: 'Appointment not found' };
      }

      const appointmentType = appointment.appointmentType ?? '';

      // Find the StorageUnitUsage for this specific unit
      const usage = await this.findUsageForUnit(
        appointmentId,
        storageUnitId,
        appointment.userId
      );

      if (!usage) {
        return {
          success: false,
          message: '',
          error: `No usage record found for unit ${storageUnitId}`,
        };
      }

      // 1. Update StorageUnitUsage with return data
      const usageUpdateData: any = {
        returnProcessed: true,
        returnProcessedAt: new Date(),
        padlockProvided,
        isStoringItems,
      };

      // If empty, end the usage
      if (!isStoringItems) {
        usageUpdateData.usageEndDate = new Date();
        usageUpdateData.endAppointmentId = appointmentId;
      }

      await prisma.storageUnitUsage.update({
        where: { id: usage.id },
        data: usageUpdateData,
      });

      // 2. Update StorageUnit status
      if (isStoringItems) {
        await prisma.storageUnit.update({
          where: { id: storageUnitId },
          data: { status: 'Occupied' },
        });
      } else {
        await prisma.storageUnit.update({
          where: { id: storageUnitId },
          data: { status: 'Pending Cleaning' },
        });
      }

      // 3. Update warehouse location via existing helper
      if (
        appointmentType === 'Initial Pickup' ||
        appointmentType === 'Additional Storage'
      ) {
        await updateStorageUnitForReturn(usage, appointmentId, !isStoringItems);
      } else {
        await updateStorageUnitUsageForAccess(usage, appointmentId);
      }

      // 4. Create damage report for this single unit
      if (hasDamage) {
        await prisma.storageUnitDamageReport.create({
          data: {
            storageUnitId,
            appointmentId,
            adminId,
            damageDescription: damageDescription || '',
            damagePhotos: [...frontPhotos, ...backPhotos],
            status: 'Pending',
          },
        });
      }

      // 5. Create admin log entry
      const statusSuffix = isStoringItems ? 'OCCUPIED' : 'EMPTY';
      await createStorageReturnLog(
        adminId,
        appointmentId,
        appointmentType,
        hasDamage,
        `UNIT_${storageUnitId}_${statusSuffix}${padlockProvided ? '_PADLOCK' : ''}`
      );

      // 6. Check if all units are now processed
      const allUsages = await this.resolveUsagesForAppointment(appointmentId);
      const allProcessed = allUsages.every(u => u.returnProcessed);

      let billingTriggered = false;
      if (allProcessed) {
        console.log(
          `[StorageUnitReturn] All units processed for appointment ${appointmentId}, triggering deferred billing`
        );
        await this.processDeferredBilling(appointmentId, allUsages);
        billingTriggered = true;
      }

      return {
        success: true,
        message: billingTriggered
          ? 'Unit processed. All units complete — billing finalized.'
          : 'Unit processed successfully.',
        billingTriggered,
      };
    } catch (error) {
      console.error('Error processing per-unit return:', error);
      return {
        success: false,
        message: '',
        error: 'Failed to process storage unit return',
      };
    }
  }

  /**
   * Deferred billing: runs once when the last unit for an appointment is checked in.
   * Handles padlock invoicing, subscription adjustments, and credit notes.
   */
  private async processDeferredBilling(
    appointmentId: number,
    usages: Array<{
      id: number;
      storageUnitId: number;
      padlockProvided: boolean;
      isStoringItems: boolean | null;
      returnProcessed: boolean;
    }>
  ): Promise<void> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        user: {
          select: {
            id: true,
            stripeCustomerId: true,
          },
        },
      },
    });

    if (!appointment || !appointment.user.stripeCustomerId) {
      console.log(
        `[DeferredBilling] Skipping — no appointment or no stripeCustomerId for ${appointmentId}`
      );
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'Completed' },
      });
      return;
    }

    const appointmentType = appointment.appointmentType ?? '';
    const customerId = appointment.user.stripeCustomerId;
    const userId = appointment.user.id;

    // Step 1: Padlock invoice
    const padlockCount = usages.filter(u => u.padlockProvided).length;
    if (padlockCount > 0) {
      try {
        await StripeInvoiceService.createPadlockInvoice(
          customerId,
          appointmentId,
          padlockCount
        );
        console.log(
          `[DeferredBilling] Padlock invoice created: ${padlockCount} padlock(s)`
        );
      } catch (error) {
        console.error('[DeferredBilling] Padlock invoice failed:', error);
      }
    }

    // Step 2: Subscription/refund adjustments by appointment type
    const emptyUnitCount = usages.filter(
      u => u.isStoringItems === false
    ).length;

    if (
      appointmentType === 'Initial Pickup' ||
      appointmentType === 'Additional Storage'
    ) {
      await this.handleInitialPickupBilling(
        appointment,
        customerId,
        userId,
        emptyUnitCount
      );
    } else if (appointmentType === 'Storage Unit Access') {
      await this.handleAccessBilling(customerId, userId);
    } else if (
      appointmentType === 'End Storage Term' ||
      appointmentType === 'End Storage Plan'
    ) {
      await this.handleEndTermBilling(appointment, customerId, userId, usages);
    }

    // Step 3: Mark appointment as completed
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'Completed' },
    });

    console.log(
      `[DeferredBilling] Appointment ${appointmentId} marked as Completed`
    );
  }

  /**
   * Handle billing for Initial Pickup / Additional Storage.
   * Issues credit note for empty units and adjusts subscription.
   */
  private async handleInitialPickupBilling(
    appointment: any,
    customerId: string,
    userId: number,
    emptyUnitCount: number
  ): Promise<void> {
    // Credit note for empty units
    if (emptyUnitCount > 0 && appointment.stripeChargeId) {
      try {
        // Look up the Stripe invoice via the charge
        const charge = await (
          await import('@/lib/integrations/stripeClient')
        ).stripe.charges.retrieve(appointment.stripeChargeId);
        const invoiceId =
          typeof charge.invoice === 'string'
            ? charge.invoice
            : charge.invoice?.id;

        if (
          invoiceId &&
          appointment.monthlyStorageRate &&
          appointment.monthlyInsuranceRate
        ) {
          await StripeInvoiceService.createCreditNoteForEmptyUnits(
            invoiceId,
            emptyUnitCount,
            appointment.monthlyStorageRate,
            appointment.monthlyInsuranceRate,
            appointment.id
          );
          console.log(
            `[DeferredBilling] Credit note created for ${emptyUnitCount} empty unit(s)`
          );
        }
      } catch (error) {
        console.error('[DeferredBilling] Credit note creation failed:', error);
      }
    }

    // Adjust subscription quantity
    try {
      const adjustResult =
        await StripeSubscriptionService.adjustSubscriptionsForPartialTermination(
          userId,
          customerId
        );
      if (adjustResult.success) {
        console.log(
          `[DeferredBilling] Subscription adjusted: ${adjustResult.remainingUnits} units remaining`
        );
      } else {
        console.error(
          '[DeferredBilling] Subscription adjustment failed:',
          adjustResult.error
        );
      }
    } catch (error) {
      console.error('[DeferredBilling] Subscription adjustment error:', error);
    }
  }

  /**
   * Handle billing for Storage Unit Access.
   * Adjusts subscription based on remaining active usages.
   */
  private async handleAccessBilling(
    customerId: string,
    userId: number
  ): Promise<void> {
    try {
      const adjustResult =
        await StripeSubscriptionService.adjustSubscriptionsForPartialTermination(
          userId,
          customerId
        );
      if (adjustResult.success) {
        console.log(
          `[DeferredBilling] Access — subscription adjusted: ${adjustResult.remainingUnits} units remaining`
        );
      } else {
        console.error(
          '[DeferredBilling] Access — subscription adjustment failed:',
          adjustResult.error
        );
      }
    } catch (error) {
      console.error('[DeferredBilling] Access billing error:', error);
    }
  }

  /**
   * Handle billing for End Storage Term.
   * Cancels subscription if all units empty, otherwise adjusts to remaining count.
   */
  private async handleEndTermBilling(
    appointment: any,
    customerId: string,
    userId: number,
    usages: Array<{ isStoringItems: boolean | null }>
  ): Promise<void> {
    const occupiedCount = usages.filter(u => u.isStoringItems === true).length;

    try {
      if (occupiedCount === 0) {
        await StripeSubscriptionService.cancelAllUserSubscriptions(customerId);
        console.log('[DeferredBilling] End term — all subscriptions cancelled');

        // Fetch full appointment for handleEarlyTermination
        const fullAppointment = await prisma.appointment.findUnique({
          where: { id: appointment.id },
          include: {
            requestedStorageUnits: {
              select: { storageUnitId: true },
            },
            user: {
              select: { stripeCustomerId: true },
            },
          },
        });

        const firstUsage = await prisma.storageUnitUsage.findFirst({
          where: {
            OR: [
              { startAppointmentId: appointment.id },
              { endAppointmentId: appointment.id },
            ],
          },
        });

        if (fullAppointment && firstUsage) {
          await StripeSubscriptionService.handleEarlyTermination(
            {
              id: fullAppointment.id,
              appointmentType: fullAppointment.appointmentType ?? '',
              monthlyStorageRate: fullAppointment.monthlyStorageRate,
              monthlyInsuranceRate: fullAppointment.monthlyInsuranceRate,
              loadingHelpPrice: fullAppointment.loadingHelpPrice,
              numberOfUnits: fullAppointment.numberOfUnits,
              insuranceCoverage: fullAppointment.insuranceCoverage,
              storageTerm: fullAppointment.storageTerm as any,
              pickupFeeWaived: fullAppointment.pickupFeeWaived ?? false,
              returnFeeWaived: fullAppointment.returnFeeWaived ?? false,
              requestedStorageUnits: fullAppointment.requestedStorageUnits,
              user: {
                stripeCustomerId:
                  fullAppointment.user?.stripeCustomerId ?? null,
              },
            },
            {
              usageStartDate: firstUsage.usageStartDate,
              usageEndDate: firstUsage.usageEndDate,
              storageUnitId: firstUsage.storageUnitId,
              endAppointmentId: firstUsage.endAppointmentId,
            }
          );
        }
      } else {
        const adjustResult =
          await StripeSubscriptionService.adjustSubscriptionsForPartialTermination(
            userId,
            customerId
          );
        if (adjustResult.success) {
          console.log(
            `[DeferredBilling] End term — subscription adjusted: ${adjustResult.remainingUnits} units remaining`
          );
        } else {
          console.error(
            '[DeferredBilling] End term — subscription adjustment failed:',
            adjustResult.error
          );
        }
      }
    } catch (error) {
      console.error('[DeferredBilling] End term billing error:', error);
    }
  }

  /**
   * Find the StorageUnitUsage record for a specific unit in an appointment.
   * Handles both direct storageStartUsages and resolved access/end-term usages.
   */
  private async findUsageForUnit(
    appointmentId: number,
    storageUnitId: number,
    userId: number | null
  ): Promise<any | null> {
    // Try storageStartUsages first (Initial Pickup / Additional Storage)
    let usage = await prisma.storageUnitUsage.findFirst({
      where: { startAppointmentId: appointmentId, storageUnitId },
      include: { storageUnit: true },
    });

    if (usage) return usage;

    // Fall back to finding active usage for this unit (Access / End Term)
    if (userId) {
      usage = await prisma.storageUnitUsage.findFirst({
        where: {
          storageUnitId,
          userId,
          usageEndDate: null,
        },
        include: { storageUnit: true },
      });
    }

    return usage;
  }

  /**
   * Resolve all StorageUnitUsage records for an appointment,
   * regardless of appointment type.
   */
  private async resolveUsagesForAppointment(appointmentId: number): Promise<
    Array<{
      id: number;
      storageUnitId: number;
      padlockProvided: boolean;
      isStoringItems: boolean | null;
      returnProcessed: boolean;
    }>
  > {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        userId: true,
        appointmentType: true,
        storageStartUsages: {
          select: {
            id: true,
            storageUnitId: true,
            padlockProvided: true,
            isStoringItems: true,
            returnProcessed: true,
          },
        },
        requestedStorageUnits: {
          select: { storageUnitId: true },
        },
      },
    });

    if (!appointment) return [];

    const appointmentType = appointment.appointmentType ?? '';

    if (
      appointmentType === 'Initial Pickup' ||
      appointmentType === 'Additional Storage'
    ) {
      return appointment.storageStartUsages;
    }

    // For Access / End Term, resolve from requestedStorageUnits
    if (appointment.requestedStorageUnits.length > 0) {
      const unitIds = appointment.requestedStorageUnits.map(
        r => r.storageUnitId
      );
      return prisma.storageUnitUsage.findMany({
        where: {
          storageUnitId: { in: unitIds },
          userId: appointment.userId,
        },
        select: {
          id: true,
          storageUnitId: true,
          padlockProvided: true,
          isStoringItems: true,
          returnProcessed: true,
        },
        orderBy: { usageStartDate: 'desc' },
        distinct: ['storageUnitId'],
      });
    }

    return appointment.storageStartUsages;
  }

  /**
   * Check if appointment needs storage unit return processing
   */
  async isStorageReturnNeeded(appointmentId: number): Promise<boolean> {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: {
          appointmentType: true,
          status: true,
          storageStartUsages: {
            select: { id: true },
          },
          requestedStorageUnits: {
            select: { id: true },
          },
        },
      });

      if (!appointment) return false;

      const returnTypes = [
        'Initial Pickup',
        'Additional Storage',
        'Storage Unit Access',
        'End Storage Term',
        'End Storage Plan',
      ];
      const hasStorageUnits =
        appointment.storageStartUsages.length > 0 ||
        appointment.requestedStorageUnits.length > 0;

      return (
        returnTypes.includes(appointment.appointmentType ?? '') &&
        appointment.status === 'Awaiting Admin Check In' &&
        hasStorageUnits
      );
    } catch (error) {
      console.error('Error checking storage return need:', error);
      return false;
    }
  }

  /**
   * Get all per-unit storage returns that need processing.
   * Returns one entry per unprocessed unit (not per appointment).
   */
  async getAllStorageReturnsNeeded(): Promise<PerUnitReturnEntry[]> {
    try {
      const appointments = await prisma.appointment.findMany({
        where: {
          appointmentType: {
            in: [
              'Initial Pickup',
              'Additional Storage',
              'Storage Unit Access',
              'End Storage Term',
              'End Storage Plan',
            ],
          },
          status: 'Awaiting Admin Check In',
        },
        select: {
          id: true,
          jobCode: true,
          date: true,
          userId: true,
          appointmentType: true,
          storageStartUsages: {
            select: {
              id: true,
              storageUnitId: true,
              returnProcessed: true,
              storageUnit: {
                select: {
                  id: true,
                  storageUnitNumber: true,
                },
              },
            },
          },
          requestedStorageUnits: {
            select: {
              storageUnitId: true,
              storageUnit: {
                select: {
                  id: true,
                  storageUnitNumber: true,
                },
              },
            },
          },
        },
        orderBy: {
          date: 'asc',
        },
      });

      const entries: PerUnitReturnEntry[] = [];

      for (const appointment of appointments) {
        const formattedDate = new Date(appointment.date).toLocaleDateString(
          'en-US',
          { weekday: 'short', month: 'short', day: 'numeric' }
        );
        const appointmentType = appointment.appointmentType ?? '';

        if (
          appointmentType === 'Initial Pickup' ||
          appointmentType === 'Additional Storage'
        ) {
          for (const usage of appointment.storageStartUsages) {
            if (usage.returnProcessed) continue;
            entries.push({
              appointmentId: appointment.id,
              storageUnitId: usage.storageUnit.id,
              usageId: usage.id,
              storageUnitNumber: usage.storageUnit.storageUnitNumber,
              jobCode: appointment.jobCode ?? '',
              appointmentDate: formattedDate,
              appointmentType,
            });
          }
        } else {
          // Access / End Term — resolve active usages from requestedStorageUnits
          const unitIds = appointment.requestedStorageUnits.map(
            r => r.storageUnitId
          );

          if (unitIds.length > 0) {
            const activeUsages = await prisma.storageUnitUsage.findMany({
              where: {
                storageUnitId: { in: unitIds },
                userId: appointment.userId,
                returnProcessed: false,
              },
              include: {
                storageUnit: {
                  select: {
                    id: true,
                    storageUnitNumber: true,
                  },
                },
              },
              orderBy: { usageStartDate: 'desc' },
              distinct: ['storageUnitId'],
            });

            for (const usage of activeUsages) {
              entries.push({
                appointmentId: appointment.id,
                storageUnitId: usage.storageUnit.id,
                usageId: usage.id,
                storageUnitNumber: usage.storageUnit.storageUnitNumber,
                jobCode: appointment.jobCode ?? '',
                appointmentDate: formattedDate,
                appointmentType,
              });
            }
          }
        }
      }

      return entries;
    } catch (error) {
      console.error('Error getting all storage returns needed:', error);
      return [];
    }
  }
}
