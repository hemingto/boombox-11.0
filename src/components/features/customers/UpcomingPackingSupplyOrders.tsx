/**
 * @fileoverview Container component that displays a list of upcoming packing supply orders for a customer.
 * @source boombox-10.0/src/app/components/user-page/upcomingpackingsupplyorders.tsx
 *
 * COMPONENT FUNCTIONALITY:
 * - Receives orders as props from parent (page-level data fetching)
 * - Maps orders to PackingSupplyDeliveryCard components
 * - Handles order cancellation by updating parent state
 * - Formats dates and times for display
 *
 * ARCHITECTURE:
 * - Data is fetched at page level via useCustomerHomePageData hook
 * - Component receives data as props, no internal data fetching
 * - Parent handles conditional rendering (component only mounts when data exists)
 *
 * DESIGN SYSTEM UPDATES:
 * - Uses semantic spacing classes
 *
 * @refactor Migrated to page-level data fetching pattern, removed internal loading/fetching
 */

'use client';

import { PackingSupplyDeliveryCard } from './PackingSupplyDeliveryCard';
import { type PackingSupplyOrderDisplay } from '@/lib/services/customerDataService';
import { addDateSuffix } from '@/lib/utils';

export interface UpcomingPackingSupplyOrdersProps {
  userId: string;
  orders: PackingSupplyOrderDisplay[];
  onOrdersChange: React.Dispatch<React.SetStateAction<PackingSupplyOrderDisplay[]>>;
}

export function UpcomingPackingSupplyOrders({
  userId,
  orders,
  onOrdersChange,
}: UpcomingPackingSupplyOrdersProps) {
  const handleCancellation = (orderId: number) => {
    onOrdersChange((prev) => prev.filter((order) => order.id !== orderId));
  };

  const formatDeliveryTime = () => {
    // Default delivery window is typically 12 PM - 7 PM
    return 'between 12:00pm - 7:00pm';
  };

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
