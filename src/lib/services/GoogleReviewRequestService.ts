import { prisma } from '@/lib/database/prismaClient';
import { MessageService } from '@/lib/messaging/MessageService';
import { googleReviewRequestSms } from '@/lib/messaging/templates/sms/customer/googleReviewRequest';
import { googleReviewRequestEmail } from '@/lib/messaging/templates/email/customer/googleReviewRequest';
import { normalizePhoneNumberToE164 } from '@/lib/utils/phoneUtils';

interface ReviewRequestResult {
  appointmentsSent: number;
  packingSupplySent: number;
  errors: number;
}

export class GoogleReviewRequestService {
  static async processEligibleFeedback(): Promise<ReviewRequestResult> {
    const result: ReviewRequestResult = {
      appointmentsSent: 0,
      packingSupplySent: 0,
      errors: 0,
    };

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [appointmentFeedback, packingSupplyFeedback] = await Promise.all([
      prisma.feedback.findMany({
        where: {
          rating: { gte: 4 },
          googleReviewRequestSent: false,
          createdAt: { lte: twentyFourHoursAgo },
        },
        include: {
          appointment: {
            include: { user: true },
          },
        },
      }),
      prisma.packingSupplyFeedback.findMany({
        where: {
          rating: { gte: 4 },
          googleReviewRequestSent: false,
          createdAt: { lte: twentyFourHoursAgo },
        },
        include: {
          packingSupplyOrder: {
            include: { user: true },
          },
        },
      }),
    ]);

    for (const feedback of appointmentFeedback) {
      try {
        const user = feedback.appointment.user;
        if (!user) {
          console.warn(
            `No user found for appointment feedback ${feedback.id}, skipping`
          );
          result.errors++;
          continue;
        }

        await this.sendReviewRequest(
          user.phoneNumber,
          user.email,
          user.firstName
        );

        await prisma.feedback.update({
          where: { id: feedback.id },
          data: { googleReviewRequestSent: true },
        });

        result.appointmentsSent++;
        console.log(
          `Sent Google review request for appointment feedback ${feedback.id}`
        );
      } catch (error) {
        console.error(
          `Failed to send review request for appointment feedback ${feedback.id}:`,
          error
        );
        result.errors++;
      }
    }

    for (const feedback of packingSupplyFeedback) {
      try {
        const order = feedback.packingSupplyOrder;
        const phone = order.user?.phoneNumber ?? order.contactPhone;
        const email = order.user?.email ?? order.contactEmail;
        const firstName =
          order.user?.firstName ?? order.contactName.split(' ')[0];

        await this.sendReviewRequest(phone, email, firstName);

        await prisma.packingSupplyFeedback.update({
          where: { id: feedback.id },
          data: { googleReviewRequestSent: true },
        });

        result.packingSupplySent++;
        console.log(
          `Sent Google review request for packing supply feedback ${feedback.id}`
        );
      } catch (error) {
        console.error(
          `Failed to send review request for packing supply feedback ${feedback.id}:`,
          error
        );
        result.errors++;
      }
    }

    return result;
  }

  private static async sendReviewRequest(
    phone: string,
    email: string,
    firstName: string
  ): Promise<void> {
    const variables = { firstName };
    const normalizedPhone = normalizePhoneNumberToE164(phone);

    const [smsResult, emailResult] = await Promise.all([
      MessageService.sendSms(
        normalizedPhone,
        googleReviewRequestSms,
        variables
      ),
      MessageService.sendEmail(email, googleReviewRequestEmail, variables),
    ]);

    if (!smsResult.success) {
      console.error(`SMS review request failed for ${phone}:`, smsResult.error);
    }
    if (!emailResult.success) {
      console.error(
        `Email review request failed for ${email}:`,
        emailResult.error
      );
    }
  }
}
