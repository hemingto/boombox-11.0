/**
 * @fileoverview Order confirmation component for packing supplies
 * @source boombox-10.0/src/app/components/packing-supplies/orderconfirmation.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays order confirmation details after successful packing supply order placement.
 * Shows order tracking information, delivery window, driver assignment status, and
 * navigation options for users to track their order or continue shopping.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced emerald-500 with status-success for success icon
 * - Replaced zinc-950 with text-primary for headings
 * - Replaced slate-50 with surface-secondary for order details background
 * - Replaced gray-600 with text-tertiary for labels
 * - Replaced emerald-100/emerald-600 with status-bg-success/status-text-success for same-day badge
 * - Replaced slate-200 with border for divider
 * - Replaced zinc-950/zinc-800/zinc-700 with primary/primary-hover/primary-active for buttons
 * - Replaced slate-100/slate-300 with surface-disabled/text-secondary for loading states
 * - Replaced zinc-600 with text-tertiary for underline decoration
 * 
 * @refactor Applied design system colors, extracted date formatting to centralized utilities
 */

import { CheckCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useState } from 'react';
import { formatDateForDisplay } from '@/lib/utils/dateUtils';

interface OrderConfirmationProps {
  email: string;
  isLoggedIn?: boolean;
  userId?: string;
  orderData?: {
    orderId: number;
    onfleetTaskShortId: string;
    trackingUrl?: string;
    assignedDriverName?: string;
    deliveryWindow: {
      start: string;
      end: string;
      isSameDay: boolean;
      deliveryDate: string;
    };
    estimatedServiceTime: number;
    capacityInfo: {
      totalWeight: number;
      itemCount: number;
    };
  };
}

/**
 * Format time with timezone for delivery window display
 */
const formatTimeWithTimezone = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
};

/**
 * Parse date string and format for display to avoid timezone issues
 */
const formatDeliveryDate = (dateString: string): string => {
  // Parse date string in format "YYYY-MM-DD" to avoid timezone conversion
  const [year, month, day] = dateString.split('-').map(Number);
  const deliveryDate = new Date(year, month - 1, day); // month is 0-indexed
  
  return formatDateForDisplay(deliveryDate);
};

export const OrderConfirmation: React.FC<OrderConfirmationProps> = ({
  email,
  orderData,
  isLoggedIn = false,
  userId,
}) => {
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);

  const handleTrackingClick = () => {
    setIsTrackingLoading(true);
  };

  return (
    <div className="text-center max-w-xl mx-auto p-6 sm:p-0">
      <CheckCircleIcon 
        className="text-status-success w-16 h-16 mx-auto mb-2" 
        aria-hidden="true"
      />
      <h2 className="text-2xl text-text-primary font-bold mb-4">
        Awesome! Your order has been received
      </h2>
      <p className="mb-6">
        A receipt has been sent to your email {email} and we will send text
        updates regarding your order delivery
      </p>

      {orderData && (
        <div 
          className="bg-surface-secondary rounded-lg p-6 mb-8 text-left"
          role="region"
          aria-label="Order details"
        >
          <h3 className="font-semibold text-lg mb-2">Order Details</h3>

          <hr className="mt-2 mb-4 border-border" />

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-text-tertiary">Tracking ID:</span>
              <span className="font-medium">{orderData.onfleetTaskShortId}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-text-tertiary">Items:</span>
              <span className="font-medium">
                {orderData.capacityInfo.itemCount} items
              </span>
            </div>

            <div className="flex justify-between items-center max-h-[20px]">
              <span className="text-text-tertiary">Delivery Date:</span>
              <div className="flex items-center gap-2">
                {orderData.deliveryWindow.isSameDay && (
                  <span className="px-2 py-1 bg-status-bg-success rounded-full text-xs text-status-text-success whitespace-nowrap">
                    Same day!
                  </span>
                )}
                <span className="font-medium">
                  {formatDeliveryDate(orderData.deliveryWindow.deliveryDate)}
                </span>
              </div>
            </div>

            <div className="flex justify-between">
              <span className="text-text-tertiary">Delivery Window:</span>
              <span className="font-medium">
                {formatTimeWithTimezone(orderData.deliveryWindow.start)} -{' '}
                {formatTimeWithTimezone(orderData.deliveryWindow.end)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-text-tertiary">Driver:</span>
              <span className="font-medium">
                {orderData.assignedDriverName
                  ? orderData.assignedDriverName
                  : 'TBD (driver will be assigned shortly)'}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto text-center flex p-4 bg-surface-secondary rounded-md justify-between">
        <Link href={isLoggedIn ? `/user-page/${userId}` : '/getquote'}>
          <button
            className="block py-3 ml-3 text-text-primary text-md mx-auto underline decoration-text-tertiary hover:decoration-solid decoration-dotted underline-offset-4"
            aria-label={
              isLoggedIn
                ? 'Go to your homepage'
                : 'Get a quote for storage space'
            }
          >
            {isLoggedIn ? 'Go to homepage' : 'Need storage space?'}
          </button>
        </Link>

        {orderData?.trackingUrl && (
          <div className="text-center">
            <Link
              href={orderData.trackingUrl}
              className={`inline-block rounded-full py-2.5 px-6 font-semibold text-md ${
                isTrackingLoading
                  ? 'bg-surface-disabled text-text-secondary cursor-not-allowed'
                  : 'bg-primary text-text-inverse hover:bg-primary-hover active:bg-primary-active'
              }`}
              onClick={!isTrackingLoading ? handleTrackingClick : undefined}
              style={{ pointerEvents: isTrackingLoading ? 'none' : 'auto' }}
              aria-label="Track your packing supply order"
              aria-disabled={isTrackingLoading}
            >
              {isTrackingLoading ? 'Tracking Order...' : 'Track Your Order'}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

