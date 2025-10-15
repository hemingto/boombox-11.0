/**
 * @fileoverview Admin task page for prepping packing supply orders for delivery
 * @source boombox-10.0/src/app/admin/tasks/[taskId]/prep-packing-supply-order/page.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays packing supply order details and items
 * - Provides checklist interface for marking items as collected
 * - Confirms order is prepped and in pickup area before completion
 * - Updates order status and completes task
 * 
 * API ROUTES USED:
 * - GET /api/admin/packing-supplies/[orderId] - Fetch order details
 * - PATCH /api/admin/packing-supplies/[orderId]/prep - Mark order as prepped
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses semantic color tokens (text-text-primary, bg-status-warning)
 * - Uses form-error class for validation messages
 * - Uses btn-primary utility class for submit button
 * - Replaced hardcoded amber colors with status-warning variants
 * 
 * @refactor Extracted from inline page implementation into feature component
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon, CheckIcon } from '@heroicons/react/24/outline';
import { ArchiveBoxIcon } from '@heroicons/react/24/solid';
import { useTask } from '@/hooks';
import YesOrNoRadio from '@/components/forms/YesOrNoRadio';
import { Transition } from '@headlessui/react';

interface PrepPackingSupplyOrderPageProps {
  taskId: string;
}

interface OrderDetail {
  id: number;
  quantity: number;
  price: number;
  product: {
    id: number;
    title: string;
    description: string;
    category: string;
    imageSrc: string;
  };
}

export function PrepPackingSupplyOrderPage({ taskId }: PrepPackingSupplyOrderPageProps) {
  const { task, isLoading: hookLoading } = useTask(taskId);
  const [isPrepped, setIsPrepped] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [allItemsChecked, setAllItemsChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([]);
  const router = useRouter();

  // Fetch order details when task is loaded
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!task || !taskId) return;
      
      const orderId = taskId.split('-')[3]; // Extract order ID from task ID
      if (!orderId) return;
      
      try {
        const response = await fetch(`/api/admin/packing-supplies/${orderId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch order details');
        }
        const orderData = await response.json();
        
        if (orderData.orderDetails) {
          setOrderDetails(orderData.orderDetails);
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
      }
    };

    fetchOrderDetails();
  }, [task, taskId]);

  // Check if all items are checked
  useEffect(() => {
    if (orderDetails.length > 0 && Object.keys(checkedItems).length > 0) {
      const allChecked = orderDetails.every(detail => checkedItems[detail.id] === true);
      setAllItemsChecked(allChecked);
    } else {
      setAllItemsChecked(false);
    }
  }, [checkedItems, orderDetails]);

  const handleUpdateTask = async () => {
    if (!task || isPrepped !== 'Yes' || !allItemsChecked) return;

    const orderId = task.id.split('-')[3]; // Extract order ID from task ID
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/packing-supplies/${orderId}/prep`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPrepped: true
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      router.push('/admin/tasks');
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleItemCheck = (itemId: number, checked: boolean) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: checked
    }));
  };

  if (hookLoading) {
    return (
      <div className="mt-4 mb-20">
        <div className="w-full sm:max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-surface-tertiary rounded w-1/3 mb-4"></div>
            <div className="space-y-4">
              <div className="h-4 bg-surface-tertiary rounded w-3/4"></div>
              <div className="h-4 bg-surface-tertiary rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="mt-4 mb-20">
        <div className="w-full sm:max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-text-primary">Task not found</h1>
            <p className="mt-2 text-text-secondary">The requested task could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 mb-20">
      <div className="w-full sm:max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-text-primary hover:text-text-secondary"
            aria-label="Go back"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-text-primary">{task.title}</h1>
            <p className="text-text-primary mt-1 text-sm">
              {task.description}
            </p>
          </div>
        </div>

        <div className="bg-surface-primary">
          <div className="p-6 space-y-6">
            {/* Order Header Card */}
            <div className="bg-status-warning rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative bg-status-warning-hover rounded-full h-12 w-12 flex items-center justify-center">
                    <ArchiveBoxIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">
                      {task.onfleetTaskIds?.[0] ? `Order #${task.onfleetTaskIds[0]}` : `Order #${task.id.split('-')[3]}`}
                    </h4>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-border pb-4">
              <div className="border-r border-border pr-6">
                <h3 className="font-medium text-text-primary font-semibold">Customer</h3>
                <p className="mt-1 text-sm text-text-primary">{task.customerName}</p>
              </div>
              <div className="md:border-r border-border pr-6">
                <h3 className="font-medium text-text-primary font-semibold">Delivery Driver</h3>
                <p className="mt-1 text-sm text-text-primary">
                  {task.driver ? `${task.driver.firstName} ${task.driver.lastName}` : 'Unassigned'}
                </p>
              </div>
              <div>
                <h3 className="font-medium text-text-primary font-semibold">Address</h3>
                <p className="mt-1 text-sm text-text-primary">
                  {task.appointmentAddress}
                </p>
              </div>
            </div>

            {/* Order Details Section */}
            <div className="space-y-6 border-b border-border pb-6">
              <div>
                <h3 className="font-medium text-text-primary font-semibold mb-6">Collect order items for delivery</h3>
                <p className="text-text-primary mb-4 text-sm">Check off item once collected and ready for delivery</p>
                
                {orderDetails && orderDetails.length > 0 ? (
                  <div className="space-y-1 mb-8">
                    {orderDetails.map((detail) => (
                      <div 
                        key={detail.id} 
                        className={`${checkedItems[detail.id] ? 'bg-surface-primary' : 'bg-surface-tertiary'} rounded-md max-w-lg`}
                      >
                        <div
                          className="flex items-center cursor-pointer w-full p-4"
                          onClick={() => handleItemCheck(detail.id, !checkedItems[detail.id])}
                        >
                          <div className="relative h-5 w-5">
                            <input
                              type="checkbox"
                              checked={checkedItems[detail.id] || false}
                              onChange={() => {}}
                              onClick={(e) => e.stopPropagation()}
                              className="appearance-none border checked:border-status-warning h-5 w-5 border-border rounded focus:ring-status-warning checked:bg-status-warning hover:checked:bg-status-warning-hover"
                            />
                            {checkedItems[detail.id] && (
                              <CheckIcon className="h-4 w-4 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                            )}
                          </div>
                          <span className="ml-3 text-md text-text-primary">
                            <span className="font-semibold">{detail.quantity}</span> - {detail.product.title}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 text-sm text-text-secondary">
                    Loading order details...
                  </div>
                )}

                {/* Confirmation Section with Transition */}
                <Transition
                  show={allItemsChecked}
                  enter="transition-all duration-300 ease-in-out"
                  enterFrom="opacity-0 max-h-0 overflow-hidden"
                  enterTo="opacity-100 max-h-96 overflow-visible"
                  leave="transition-all duration-200 ease-in-out"
                  leaveFrom="opacity-100 max-h-96 overflow-visible"
                  leaveTo="opacity-0 max-h-0 overflow-hidden"
                >
                  <div className="mt-8">
                    <p className="mb-4 text-sm text-text-primary font-medium">
                      Is the complete order prepped for delivery and placed in the pickup area?
                    </p>
                    <YesOrNoRadio
                      value={isPrepped}
                      onChange={setIsPrepped}
                      hasError={false}
                    />
                  </div>
                </Transition>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleUpdateTask}
                disabled={isSubmitting || isPrepped !== 'Yes' || !allItemsChecked}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Update task status"
              >
                {isSubmitting ? 'Updating...' : 'Update Task'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

