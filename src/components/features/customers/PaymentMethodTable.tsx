/**
 * @fileoverview PaymentMethodTable component - Stripe payment method management
 * @source boombox-10.0/src/app/components/user-page/paymentmethodtable.tsx
 * @refactored Following REFACTOR_PRD.md and component-migration-checklist.md
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays user's saved payment methods
 * - Add new payment methods via Stripe Elements
 * - Remove payment methods with confirmation
 * - Set default payment method
 * - Stripe validation and error handling
 * 
 * API ROUTES UPDATED:
 * - Old: /api/stripe/fetch-saved-payment-methods → New: /api/payments/saved-payment-methods
 * - Old: /api/stripe/add-payment-method → New: /api/payments/add-payment-method
 * - Old: /api/stripe/remove-payment-method → New: /api/payments/remove-payment-method
 * - Old: /api/stripe/switch-default-payment-method → New: /api/payments/switch-default-payment-method
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced InformationalPopup with Modal primitive
 * - Used design system colors and badges
 * - Applied skeleton primitives for loading states
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { CreditCardIcon, EllipsisHorizontalIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useStripe, useElements } from '@stripe/react-stripe-js';
import { StripeElementChangeEvent } from '@stripe/stripe-js';
import { Modal } from '@/components/ui/primitives/Modal';
import CardNumberInput from '@/components/forms/CardNumberInput';
import CardExpirationDateInput from '@/components/forms/CardExpirationDateInput';
import CardCvcInput from '@/components/forms/CardCvcInput';
import { AddCreditCardIcon } from '@/components/icons/AddCreditCardIcon';
import { SkeletonCard, SkeletonText } from '@/components/ui/primitives/Skeleton';

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp: string;
  isDefault: boolean;
}

interface PaymentMethodsApiResponse {
  defaultPaymentMethodId: string;
  paymentMethods: StripePaymentMethod[];
}

interface StripePaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

export interface PaymentMethodTableProps {
  userId: string;
}

/**
 * PaymentMethodTable - Manage Stripe payment methods
 * 
 * Features:
 * - List saved payment methods
 * - Add new cards via Stripe Elements
 * - Remove payment methods
 * - Set default payment method
 * - Stripe validation
 */
export const PaymentMethodTable: React.FC<PaymentMethodTableProps> = ({ userId }) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showOptions, setShowOptions] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const stripe = useStripe();
  const elements = useElements();
  const [stripeErrors, setStripeErrors] = useState<{
    cardNumber: string | null;
    cardExpiry: string | null;
    cardCvc: string | null;
  }>({
    cardNumber: null,
    cardExpiry: null,
    cardCvc: null
  });

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<string | null>(null);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const optionsRef = useRef<HTMLDivElement | null>(null);

  const handleCardNumberChange = (event: StripeElementChangeEvent) => {
    setStripeErrors(prev => ({
      ...prev,
      cardNumber: event.error ? event.error.message : null
    }));
  };
  
  const handleCardExpiryChange = (event: StripeElementChangeEvent) => {
    setStripeErrors(prev => ({
      ...prev,
      cardExpiry: event.error ? event.error.message : null
    }));
  };
  
  const handleCardCvcChange = (event: StripeElementChangeEvent) => {
    setStripeErrors(prev => ({
      ...prev,
      cardCvc: event.error ? event.error.message : null
    }));
  };

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const response = await fetch(`/api/payments/saved-payment-methods?userId=${userId}`);
  
        if (!response.ok) {
          if (response.status === 404) {
            setPaymentMethods([]);
            return;
          }
          throw new Error('Failed to fetch payment methods');
        }
  
        const data: PaymentMethodsApiResponse = await response.json();
  
        const formattedMethods = data.paymentMethods.map((method) => ({
          id: method.id,
          brand: method.brand,
          last4: method.last4,
          exp: `${method.expMonth}/${method.expYear}`,
          isDefault: method.id === data.defaultPaymentMethodId,
        }));
  
        setPaymentMethods(formattedMethods);
        setError(null);
      } catch (error) {
        console.error('Error fetching payment methods:', error);
        setError('Failed to load payment methods');
        setPaymentMethods([]);
      } finally {
        setIsLoading(false);
      }
    };
  
    if (userId) {
      setIsLoading(true);
      fetchPaymentMethods();
    }
  }, [userId]);

  const handleRemove = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/payments/remove-payment-method', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          paymentMethodId: id
        })
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || 'Failed to remove payment method');
      }
  
      setPaymentMethods(prevMethods => {
        const updatedMethods = prevMethods.filter(method => method.id !== id);
        
        if (data.newDefaultPaymentMethodId) {
          return updatedMethods.map(method => ({
            ...method,
            isDefault: method.id === data.newDefaultPaymentMethodId
          }));
        }
        
        return updatedMethods;
      });
  
      setShowOptions(null);
      setError(null);
    } catch (error) {
      console.error('Error removing payment method:', error);
      setError('Failed to remove payment method');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetAsDefault = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/payments/switch-default-payment-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          paymentMethodId: id,
        }),
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to set default payment method');
      }
  
      setPaymentMethods(
        paymentMethods.map((method) =>
          method.id === id
            ? { ...method, isDefault: true }
            : { ...method, isDefault: false }
        )
      );
      setShowOptions(null);
      setError(null);
    } catch (error) {
      console.error('Error setting default payment method:', error);
      setError('Failed to set payment method as default');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
      setShowOptions(null);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAddPaymentMethod = async () => {
    try {
      if (!stripe || !elements) {
        console.error('Stripe has not been initialized');
        return;
      }

      setIsLoading(true);
      
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement('cardNumber')!,
      });

      if (stripeError) {
        console.error('Stripe error:', stripeError);
        setError(stripeError.message || 'Failed to process card');
        return;
      }

      const response = await fetch('/api/payments/add-payment-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          paymentMethodId: paymentMethod.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add payment method');
      }

      // Refresh payment methods list
      const refreshResponse = await fetch(`/api/payments/saved-payment-methods?userId=${userId}`);
      const refreshData: PaymentMethodsApiResponse = await refreshResponse.json();

      const formattedMethods = refreshData.paymentMethods.map((method) => ({
        id: method.id,
        brand: method.brand,
        last4: method.last4,
        exp: `${method.expMonth}/${method.expYear}`,
        isDefault: method.id === refreshData.defaultPaymentMethodId,
      }));

      setPaymentMethods(formattedMethods);
      
      // Clear form
      elements.getElement('cardNumber')?.clear();
      elements.getElement('cardExpiry')?.clear();
      elements.getElement('cardCvc')?.clear();
      
      setError(null);
      setShowAddCardModal(false);
    } catch (error) {
      console.error('Error adding payment method:', error);
      setError('Failed to add payment method');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStripeErrors = () => {
    const activeErrors = Object.values(stripeErrors).filter(error => error !== null);
    if (activeErrors.length === 0) return null;
  
    return (
      <div className="mt-2 space-y-1">
        {stripeErrors.cardNumber && (
          <p className="form-error">{stripeErrors.cardNumber}</p>
        )}
        {stripeErrors.cardExpiry && (
          <p className="form-error">{stripeErrors.cardExpiry}</p>
        )}
        {stripeErrors.cardCvc && (
          <p className="form-error">{stripeErrors.cardCvc}</p>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-5xl lg:px-16 px-6 mx-auto mb-12">
      <h2 className="text-2xl mb-8 text-text-primary">Payment methods</h2>
      
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-surface-tertiary rounded-md animate-pulse" />
                  <div className="space-y-2">
                    <SkeletonText className="w-40" />
                    <SkeletonText className="w-24" />
                  </div>
                </div>
                <div className="w-20 h-8 bg-surface-tertiary rounded-md animate-pulse" />
              </div>
            </SkeletonCard>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-md shadow-custom-shadow">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className="flex items-center justify-between py-4 border-b border-border last:border-none px-6"
            >
              <div className="flex items-center space-x-4">
                <CreditCardIcon className="w-8 h-8 text-text-primary" />
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {method.brand.charAt(0).toUpperCase() + method.brand.slice(1)} **** {method.last4}
                  </p>
                  <p className="text-xs text-text-secondary">Exp: {method.exp}</p>
                </div>
              </div>

              <div className="relative flex items-center space-x-2">
                {method.isDefault && (
                  <span className="badge-info">
                    Default
                  </span>
                )}
                <button onClick={() => setShowOptions(showOptions === method.id ? null : method.id)}>
                  <EllipsisHorizontalIcon className="w-8 h-8 text-text-primary" />
                </button>
                {showOptions === method.id && (
                  <div
                    ref={optionsRef}
                    className="absolute right-0 top-7 bg-white border border-border rounded-md shadow-custom-shadow z-10"
                  >
                    <button
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-tertiary text-text-primary"
                      onClick={() => {
                        setShowDeleteConfirmation(method.id);
                        setShowOptions(null);
                      }}
                    >
                      Remove
                    </button>
                    {!method.isDefault && (
                      <button
                        className="block w-full px-3 py-2 text-left text-nowrap text-sm hover:bg-surface-tertiary text-text-primary"
                        onClick={() => handleSetAsDefault(method.id)}
                      >
                        Set as Default
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirmation && (
            <Modal
              open={!!showDeleteConfirmation}
              onClose={() => setShowDeleteConfirmation(null)}
              title="Remove Payment Method"
              size="md"
            >
              <p className="mb-4 text-text-primary">Are you sure you want to remove this payment method?</p>
              {paymentMethods.find(m => m.id === showDeleteConfirmation)?.isDefault && (
                <div className="bg-status-bg-warning p-3 border border-border-warning rounded-md max-w-fit">
                  <p className="text-sm text-status-warning">
                    This is your default payment method. The next most recently added card will become your new default.
                  </p>
                </div>
              )}
              <div className="mt-10 flex justify-end space-x-2">
                <button
                  className="px-4 py-2 text-sm text-text-primary underline-offset-4 underline hover:text-text-secondary"
                  onClick={() => setShowDeleteConfirmation(null)}
                >
                  Close
                </button>
                <button
                  className="btn-destructive"
                  onClick={() => {
                    handleRemove(showDeleteConfirmation);
                    setShowDeleteConfirmation(null);
                  }}
                >
                  Remove
                </button>
              </div>
            </Modal>
          )}

          {/* Add Card Button */}
          <button
            className="flex items-center justify-between w-full py-4 sm:hover:bg-surface-tertiary active:bg-surface-disabled px-6 transition-colors"
            onClick={() => setShowAddCardModal(true)}
          >
            <div className="flex items-center space-x-4">
              <AddCreditCardIcon className="w-8 h-8 shrink-0" />
              <p className="text-sm text-text-primary">Add New Card</p>
            </div>
            <ChevronRightIcon className="shrink-0 w-4 h-4 ml-auto text-text-primary" />
          </button>
        </div>
      )}

      {/* Add Card Modal */}
      <Modal
        open={showAddCardModal}
        onClose={() => setShowAddCardModal(false)}
        title="Add new payment details"
        size="md"
      >
        <div className="flex-col gap-2">
          <div className="w-full">
            <CardNumberInput onChange={handleCardNumberChange} />
          </div>
          <div className="flex gap-2 mt-2">
            <div className="flex-1">
              <CardExpirationDateInput onChange={handleCardExpiryChange} />
            </div>
            <div className="flex-1">
              <CardCvcInput onChange={handleCardCvcChange} />
            </div>
          </div>
        </div>
        {renderStripeErrors()}
        <div className="flex justify-end">
          <button
            onClick={handleAddPaymentMethod}
            className="btn-primary mt-10"
            disabled={isLoading}
          >
            {isLoading ? 'Adding...' : 'Add Payment Details'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

