/**
 * @fileoverview Packing supply feedback page with JWT token
 * @source boombox-10.0/src/app/packing-supplies/feedback/[token]/page.tsx
 * @refactor Migrated to (public) route group with proper error handling
 */

import { prisma } from '@/lib/database/prismaClient';
import { format } from 'date-fns';
import { PackingSupplyFeedbackForm } from '@/components/features/packing-supplies';
import { notFound } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

// Define the token payload structure
interface PackingSupplyFeedbackToken {
  taskShortId: string;
  exp: number;
  iat: number;
}

export default async function PackingSupplyFeedbackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  // Await the dynamic token
  const { token } = await params;

  // Decode the JWT token to extract taskShortId
  let decoded: PackingSupplyFeedbackToken;
  let taskShortId: string;

  try {
    // Decode the token
    decoded = jwtDecode<PackingSupplyFeedbackToken>(token);
    taskShortId = decoded.taskShortId;

    if (!taskShortId || typeof taskShortId !== 'string') {
      return notFound();
    }
  } catch (error) {
    return notFound();
  }

  try {
    // Find the packing supply order by task short ID
    const order = await prisma.packingSupplyOrder.findFirst({
      where: { onfleetTaskShortId: taskShortId },
      include: {
        assignedDriver: {
          select: {
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
        orderDetails: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });

    if (!order) {
      return notFound();
    }

    // Format the date
    const formattedDate = format(new Date(order.orderDate), 'EEEE, MMM do');

    // Format items for the feedback form
    const items = order.orderDetails.map((detail) => ({
      name: detail.product.title,
      quantity: detail.quantity,
      price: parseFloat(detail.price.toString()),
    }));

    // Get driver info if available
    const driverName = order.assignedDriver
      ? `${order.assignedDriver.firstName} ${order.assignedDriver.lastName}`
      : undefined;

    return (
      <div className="min-h-screen bg-surface-primary">
        <PackingSupplyFeedbackForm
          orderId={String(order.id)}
          taskShortId={taskShortId}
          orderDate={formattedDate}
          deliveryAddress={order.deliveryAddress}
          invoiceTotal={parseFloat(order.totalPrice.toString())}
          userId={order.userId?.toString()}
          driverName={driverName}
          driverProfilePicture={order.assignedDriver?.profilePicture ?? undefined}
          items={items}
        />
      </div>
    );
  } catch (error) {
    console.error('Error fetching data for packing supply feedback page:', error);
    return notFound();
  }
}

