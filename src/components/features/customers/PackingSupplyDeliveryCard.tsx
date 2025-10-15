/**
 * @fileoverview Displays details for a single packing supply delivery order, including location, date, order items, and actions like cancellation and tracking.
 * @source boombox-10.0/src/app/components/user-page/packingsupplydeliverycard.tsx
 *
 * COMPONENT FUNCTIONALITY:
 * - Shows delivery details including address, date, time, and item count.
 * - Integrates Google Map to display delivery location.
 * - Provides a "Track Order" link if a tracking URL is available.
 * - Displays detailed order breakdown with expandable section.
 * - Allows cancellation of orders with a confirmation modal and reason selection.
 * - Shows status indicator for in-progress deliveries.
 * - Applies status-specific styling and visibility logic.
 *
 * API ROUTES UPDATED:
 * - Old: /api/packing-supplies/orders/${orderId}/cancel → New: /api/orders/packing-supplies/${orderId}/cancel
 *
 * DESIGN SYSTEM UPDATES:
 * - Uses semantic colors (e.g., bg-surface-primary, text-text-primary, border-border, bg-status-bg-success, text-status-success).
 * - Utilizes Modal and Tooltip primitives.
 *
 * @refactor Migrated to boombox-11.0 customer features, integrated design system, updated API routes, and replaced InformationalPopup with Modal primitive.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronRightIcon,
  NoSymbolIcon,
  ChevronDownIcon,
  DocumentCurrencyDollarIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { Modal } from '@/components/ui/primitives/Modal';
import { mapStyles } from '@/app/mapstyles';
import { formatCurrency } from '@/lib/utils/currencyUtils';

interface OrderDetail {
  id: number;
  productTitle: string;
  quantity: number;
  price: number;
  totalPrice: number; // quantity * price
}

export interface PackingSupplyDeliveryCardProps {
  orderId: number;
  deliveryAddress: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  orderDate: string; // Formatted date string
  deliveryDate: string; // Formatted date string
  displayDeliveryDate: string; // Human-readable date
  deliveryTime: string; // Time window or specific time
  totalPrice: number;
  status: string; // 'Pending Batch', 'In Progress', 'Completed', 'Cancelled'
  paymentStatus: string;
  trackingUrl: string | null;
  userId: string;
  orderDetails: OrderDetail[]; // Line items breakdown
  onCancellation: (orderId: number) => void;
}

export function PackingSupplyDeliveryCard({
  orderId,
  deliveryAddress,
  contactName,
  contactEmail,
  contactPhone,
  orderDate,
  deliveryDate,
  displayDeliveryDate,
  deliveryTime,
  totalPrice,
  status,
  paymentStatus,
  trackingUrl,
  userId,
  orderDetails,
  onCancellation,
}: PackingSupplyDeliveryCardProps) {
  const router = useRouter();
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);

  const cancelOrder = async () => {
    if (!cancellationReason) {
      console.error('Cancellation reason is required');
      return;
    }

    setIsCancelling(true);
    try {
      const response = await fetch(`/api/orders/packing-supplies/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cancellationReason,
          userId: parseInt(userId),
        }),
      });

      if (response.ok) {
        console.log('Order canceled successfully');
        onCancellation(orderId);
        setIsCancelModalOpen(false);
        router.refresh(); // Force a refresh to fetch fresh data
      } else {
        console.error('Failed to cancel order:', await response.json());
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsCancelling(false);
    }
  };

  const cancellationReasons = [
    'No longer need these items',
    'Ordered wrong items',
    'Found items elsewhere',
    'Delivery date no longer works',
    'Changed mind about purchase',
    'Other',
  ];

  const containerStyle = {
    width: '100%',
    height: '128px',
    borderTopLeftRadius: '0.375rem',
    borderTopRightRadius: '0.375rem',
    borderBottomLeftRadius: '0',
    borderBottomRightRadius: '0',
  };

  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(14);

  // Geocode location to coordinates
  useEffect(() => {
    if (deliveryAddress) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: deliveryAddress }, (results, status) => {
        if (status === 'OK' && results && results.length > 0) {
          const { lat, lng } = results[0].geometry.location;
          setMapCenter({ lat: lat(), lng: lng() });
        } else {
          console.error('Geocoding failed: ', status);
        }
      });
    }
  }, [deliveryAddress]);

  // Calculate subtotal from order details
  const subtotal = orderDetails.reduce((sum, item) => sum + item.totalPrice, 0);
  const itemCount = orderDetails.reduce((sum, item) => sum + item.quantity, 0);

  // Determine if order can be cancelled
  const canCancel = status === 'Pending Batch';

  // Determine if order is in progress (show status indicator and tracking)
  const isInProgress =
    status !== 'Pending Batch' && status !== 'Delivered' && status !== 'Cancelled';

  return (
    <div className="bg-surface-primary mb-4 rounded-md shadow-custom-shadow">
      <div className="w-full rounded-t-md shrink-0 relative">
        {/* Status indicator for in-progress deliveries */}
        {isInProgress && (
          <div className="text-sm flex items-center gap-2 absolute top-4 left-4 z-10 px-3 py-2 bg-status-bg-success rounded-full">
            <div className="w-2 h-2 bg-status-success rounded-full animate-pulse"></div>
            <p className="text-sm text-status-success">In Progress</p>
          </div>
        )}

        {/* Track order button */}
        {isInProgress && trackingUrl && (
          <a
            href={trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-4 right-4 z-10 bg-surface-primary rounded-md px-3 py-2 flex items-center gap-2 shadow-md hover:bg-surface-tertiary transition-colors"
          >
            <span className="text-sm font-semibold text-text-primary">Track Order</span>
          </a>
        )}

        <div className="rounded-t-md mb-4">
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={mapCenter || { lat: 37.75, lng: -122.294465 }}
            zoom={mapZoom}
            options={{
              styles: mapStyles,
              disableDefaultUI: false,
              fullscreenControl: false,
            }}
          >
            {mapCenter && <Marker position={mapCenter} />}
          </GoogleMap>
        </div>
      </div>

      <div className="flex px-4 pb-4 items-center gap-2">
        {/* Content */}
        <div className="w-full flex-col flex sm:flex-row items-start">
          {/* First item */}
          <div className="w-full sm:min-h-20 basis-1/3 sm:basis-1/2 pb-4 border-b sm:border-none border-border pr-4">
            <h3 className="text-lg font-semibold text-text-primary">Packing Supply Delivery</h3>
            <p className="text-sm text-text-primary">
              {itemCount} item{itemCount !== 1 ? 's' : ''} ordered
            </p>
          </div>

          {/* Second item with left border */}
          <div className="sm:min-h-20 pt-4 mb-1 sm:mb-0 sm:pt-0 flex grow flex-row sm:flex-col items-center sm:items-start sm:border-l border-border sm:px-4">
            <h3 className="text-base font-semibold mr-2 sm:mr-0">Delivery Address</h3>
            <p className="text-sm text-text-primary">{deliveryAddress}</p>
          </div>

          {/* Third item with left border */}
          <div className="grow-0 sm:min-h-20 flex flex-row sm:flex-col items-center sm:items-start sm:border-l border-border sm:px-4">
            <h3 className="text-base font-semibold mr-2 sm:mr-0">Delivery Date</h3>
            <p className="text-sm text-text-primary mr-1 sm:mr-0">{displayDeliveryDate}</p>
            <p className="text-sm text-text-primary">{deliveryTime}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-border">
        {/* Order Details Button */}
        <div className="border-b border-border">
          <button
            onClick={() => setIsOrderDetailsOpen(!isOrderDetailsOpen)}
            className="px-4 py-4 flex items-center justify-between w-full text-text-primary sm:hover:bg-surface-tertiary active:bg-surface-disabled transition"
          >
            <div className="flex items-center">
              <DocumentCurrencyDollarIcon className="w-5 h-5 mr-2 text-text-primary" />
              <span className="text-sm">Order Details</span>
            </div>
            {isOrderDetailsOpen ? (
              <ChevronUpIcon className="w-4 h-4 text-text-primary" />
            ) : (
              <ChevronDownIcon className="w-4 h-4 text-text-primary" />
            )}
          </button>

          {/* Order Details Content */}
          <div
            className={`transition-all duration-300 ease ${
              isOrderDetailsOpen ? 'max-h-96 overflow-y-auto' : 'max-h-0 overflow-hidden'
            }`}
          >
            <div className="bg-surface-tertiary relative">
              <div className="px-4 pt-4 pb-6">
                <div className="bg-surface-primary relative">
                  <div
                    className="absolute bottom-0 left-0 right-0 h-3 bg-surface-primary translate-y-full"
                    style={{
                      clipPath:
                        'polygon(0% 0%, 2% 100%, 4% 0%, 6% 100%, 8% 0%, 10% 100%, 12% 0%, 14% 100%, 16% 0%, 18% 100%, 20% 0%, 22% 100%, 24% 0%, 26% 100%, 28% 0%, 30% 100%, 32% 0%, 34% 100%, 36% 0%, 38% 100%, 40% 0%, 42% 100%, 44% 0%, 46% 100%, 48% 0%, 50% 100%, 52% 0%, 54% 100%, 56% 0%, 58% 100%, 60% 0%, 62% 100%, 64% 0%, 66% 100%, 68% 0%, 70% 100%, 72% 0%, 74% 100%, 76% 0%, 78% 100%, 80% 0%, 82% 100%, 84% 0%, 86% 100%, 88% 0%, 90% 100%, 92% 0%, 94% 100%, 96% 0%, 98% 100%, 100% 0%)',
                    }}
                  />
                  <div className="p-6">
                    <div className="space-y-2">
                      {/* Line items */}
                      {orderDetails.map((item) => (
                        <div key={item.id} className="flex justify-between items-center">
                          <span className="text-sm">
                            {item.quantity} {item.productTitle}
                          </span>

                          <span className="text-sm font-medium">{formatCurrency(item.totalPrice)}</span>
                        </div>
                      ))}

                      <div className="h-px bg-border my-2"></div>

                      {/* Subtotal */}
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold">Total</span>
                        <span className="text-sm font-semibold">{formatCurrency(subtotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conditional action buttons */}
        {canCancel && (
          <>
            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="px-4 py-4 flex items-center justify-between w-full text-text-primary sm:hover:bg-surface-tertiary active:bg-surface-disabled transition rounded-b-md"
            >
              <div className="flex items-center">
                <NoSymbolIcon className="w-5 h-5 mr-2 text-text-primary" />
                <span className="text-sm">Cancel Order</span>
              </div>
              <ChevronRightIcon className="w-4 h-4 text-text-primary" />
            </button>

            <Modal
              open={isCancelModalOpen}
              onClose={() => setIsCancelModalOpen(false)}
              title="Cancel Packing Supply Order"
              size="md"
            >
              <div className="p-6">
                <p className="mt-2 mb-4 text-lg">Tell us why you need to cancel</p>
                <div className="space-y-2">
                  {cancellationReasons.map((reason) => (
                    <label
                      key={reason}
                      className="flex items-center p-3 border border-border rounded-md cursor-pointer hover:bg-surface-tertiary transition-colors"
                    >
                      <input
                        type="radio"
                        name="cancellationReason"
                        value={reason}
                        checked={cancellationReason === reason}
                        onChange={(e) => setCancellationReason(e.target.value)}
                        className="mr-3"
                      />
                      <span className="text-sm">{reason}</span>
                    </label>
                  ))}
                </div>
                <p className="mt-4 text-sm text-text-secondary">
                  Once canceled, your order will be removed from our delivery schedule.
                </p>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setIsCancelModalOpen(false)}
                    className="btn-secondary"
                    disabled={isCancelling}
                  >
                    Keep Order
                  </button>
                  <button
                    onClick={cancelOrder}
                    disabled={isCancelling || !cancellationReason}
                    className="btn-destructive"
                  >
                    {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                </div>
              </div>
            </Modal>
          </>
        )}
      </div>
    </div>
  );
}

