/**
 * @fileoverview Feedback page - appointment feedback form with JWT token
 * @source boombox-10.0/src/app/feedback/[token]/page.tsx
 * @refactor Migrated to (public) route group with proper error handling
 */

import { prisma } from '@/lib/database/prismaClient';
import { format } from 'date-fns';
import { FeedbackForm } from '@/components/features/orders';
import { notFound } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

// Define the token payload structure
interface TokenPayload {
  appointmentId: number;
  taskId: string;
  webhookTime: number;
  triggerName: string;
  exp: number;
  iat: number;
}

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  // Await the dynamic token
  const { token } = await params;

  // Decode the JWT token to extract appointmentId
  let decoded: TokenPayload;
  let appointmentId: number;

  try {
    // Decode the token
    decoded = jwtDecode<TokenPayload>(token);
    appointmentId = decoded.appointmentId;

    if (typeof appointmentId !== 'number' || isNaN(appointmentId)) {
      return notFound();
    }
  } catch (error) {
    return notFound();
  }

  try {
    // Find the appointment by ID
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        movingPartner: {
          select: {
            name: true,
            imageSrc: true,
          },
        },
      },
    });

    if (!appointment) {
      return notFound();
    }

    let drivers: Array<{
      key: string;
      taskId: string;
      taskIds: string[];
      name: string;
      unitNumber: number;
      cloudinaryFile?: string;
      subtitle?: string;
    }> = [];

    if (decoded.taskId) {
      // Fetch all OnfleetTasks for this appointment to get all drivers
      const onfleetTasks = await prisma.onfleetTask.findMany({
        where: {
          appointmentId: appointmentId,
        },
        include: {
          driver: {
            select: {
              firstName: true,
              lastName: true,
              profilePicture: true,
            },
          },
        },
      });

      drivers = onfleetTasks
        .filter((task) => task.driver) // Only include tasks with drivers
        .reduce(
          (acc, task) => {
            const driverName = `${task.driver!.firstName} ${task.driver!.lastName}`;
            let subtitle = 'Boombox Driver';

            if (appointment.movingPartner?.name === 'Boombox Storage') {
              subtitle = 'Boombox Driver';
            } else if (appointment.movingPartner?.name) {
              subtitle = `${appointment.movingPartner.name} Driver`;
            }

            // Create a unique key for driver + unitNumber combination
            const key = `${task.driverId}-${task.unitNumber}`;

            // If we haven't seen this driver/unit combination, add it
            if (!acc.find((driver) => driver.key === key)) {
              acc.push({
                key,
                taskId: task.taskId,
                taskIds: [task.taskId],
                name: driverName,
                unitNumber: task.unitNumber,
                cloudinaryFile:
                  task.driver!.profilePicture === null
                    ? undefined
                    : task.driver!.profilePicture,
                subtitle,
              });
            } else {
              // If we've seen this driver/unit combo, add the taskId to the existing entry
              const existingDriver = acc.find((driver) => driver.key === key);
              if (existingDriver) {
                existingDriver.taskIds.push(task.taskId);
              }
            }

            return acc;
          },
          [] as Array<{
            key: string;
            taskId: string;
            taskIds: string[];
            name: string;
            unitNumber: number;
            cloudinaryFile?: string;
            subtitle?: string;
          }>
        );
    }

    // Format the date
    const formattedDate = format(new Date(appointment.date), 'EEEE, MMM do');

    return (
      <div className="min-h-screen bg-white">
        <FeedbackForm
          appointmentId={String(appointmentId)}
          appointmentType={appointment.appointmentType}
          appointmentDate={formattedDate}
          movingPartnerName={appointment.movingPartner?.name}
          movingPartnerCloudinaryFile={
            appointment.movingPartner?.imageSrc ?? undefined
          }
          invoiceTotal={appointment.invoiceTotal ?? 0}
          drivers={drivers}
        />
      </div>
    );
  } catch (error) {
    console.error('Error fetching data for feedback page:', error);
    return notFound();
  }
}

