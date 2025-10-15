/**
 * @fileoverview Container component that displays a list of upcoming packing supply orders for a customer.
 * @source boombox-10.0/src/app/components/user-page/upcomingpackingsupplyorders.tsx
 *
 * COMPONENT FUNCTIONALITY:
 * - Fetches active packing supply orders from customer utils.
 * - Displays loading state with skeleton cards.
 * - Maps orders to PackingSupplyDeliveryCard components.
 * - Handles order cancellation by filtering from list.
 * - Notifies parent component of state changes via callback.
 * - Formats dates and times for display.
 * - Returns null when no orders exist.
 *
 * DESIGN SYSTEM UPDATES:
 * - Uses SkeletonCard primitive directly for loading state (no custom skeleton component).
 * - Uses semantic spacing classes.
 *
 * @refactor Migrated to boombox-11.0 customer features, replaced custom skeleton with primitives, and extracted date utility function.
 */

'use client';

import { useState, useEffect } from 'react';
import { PackingSupplyDeliveryCard } from './PackingSupplyDeliveryCard';
import { getActivePackingSupplyOrders, type PackingSupplyOrderDisplay } from '@/lib/utils/customerUtils';
import { SkeletonCard, SkeletonTitle, SkeletonText } from '@/components/ui/primitives/Skeleton';
import { addDateSuffix } from '@/lib/utils/dateUtils';

export interface UpcomingPackingSupplyOrdersProps {
  userId: string;
  onStateChange?: (hasOrders: boolean, loading: boolean) => void;
}

export function UpcomingPackingSupplyOrders({
  userId,
  onStateChange,
}: UpcomingPackingSupplyOrdersProps) {
  const [orders, setOrders] = useState<PackingSupplyOrderDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const activeOrders = await getActivePackingSupplyOrders(userId);
        setOrders(activeOrders);
      } catch (error) {
        console.error('Error fetching packing supply orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [userId]);

  // Notify parent component about state changes
  useEffect(() => {
    if (onStateChange) {
      onStateChange(orders.length > 0, isLoading);
    }
  }, [orders.length, isLoading, onStateChange]);

  const handleCancellation = (orderId: number) => {
    setOrders((prev) => prev.filter((order) => order.id !== orderId));
  };

  const formatDeliveryTime = () => {
    // Default delivery window is typically 12 PM - 7 PM
    return 'between 12:00pm - 7:00pm';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col sm:mb-4 mb-2">
        {[1, 2].map((i) => (
          <div key={i} className="mt-4">
            <SkeletonCard className="p-6">
              <div className="mb-4 h-32 bg-surface-tertiary rounded-t-md"></div>
              <SkeletonTitle />
              <SkeletonText className="mb-2" />
              <SkeletonText className="mb-2" />
              <SkeletonText className="w-1/2" />
            </SkeletonCard>
          </div>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return null; // Don't render anything if no orders
  }

  return (
    <div className="flex flex-col sm:mb-4 mb-2">
      {orders.map((order) => (
        <div key={order.id} className="mt-4">
          <PackingSupplyDeliveryCard
            orderId={order.id}
            deliveryAddress={order.deliveryAddress}
            contactName={order.contactName}
            contactEmail={order.contactEmail}
            contactPhone={order.contactPhone}
            orderDate={order.orderDate.toISOString()}
            deliveryDate={order.deliveryDate.toISOString()}
            displayDeliveryDate={(() => {
              // Fix timezone issue - use UTC methods to get correct day of week and date
              const date = new Date(order.deliveryDate);
              const weekdays = [
                'Sunday',
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
              ];
              const months = [
                'Jan',
                'Feb',
                'Mar',
                'Apr',
                'May',
                'Jun',
                'Jul',
                'Aug',
                'Sep',
                'Oct',
                'Nov',
                'Dec',
              ];
              const weekday = weekdays[date.getUTCDay()];
              const month = months[date.getUTCMonth()];
              const day = date.getUTCDate();
              return `${weekday}, ${month} ${addDateSuffix(day)}`;
            })()}
            deliveryTime={formatDeliveryTime()}
            totalPrice={order.totalPrice}
            status={order.status}
            paymentStatus={order.paymentStatus || 'pending'}
            trackingUrl={order.trackingUrl}
            userId={userId}
            orderDetails={order.orderDetails}
            onCancellation={handleCancellation}
          />
        </div>
      ))}
    </div>
  );
}

