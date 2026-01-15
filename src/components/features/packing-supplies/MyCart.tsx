"use client";

/**
 * @fileoverview Unified MyCart component for packing supplies with responsive design
 * @source boombox-10.0/src/app/components/packing-supplies/mycart.tsx
 * @source boombox-10.0/src/app/components/packing-supplies/mobilemycart.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Responsive cart component for packing supplies with integrated checkout.
 * Desktop: Fixed sidebar with cart details and help information
 * Mobile: Expandable bottom drawer with collapsible interface
 * Handles cart display, form validation, Stripe payment processing, and order submission.
 * 
 * API ROUTES UPDATED:
 * - Old: /api/packing-supplies/create-order → New: /api/orders/packing-supplies/create
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with semantic tokens (bg-primary, text-text-inverse)
 * - Replaced custom error styling with form-error class
 * - Updated button styling to use design system color tokens
 * - Replaced hardcoded red colors with text-status-error and bg-status-bg-error
 * 
 * BUSINESS LOGIC EXTRACTION:
 * - Removed inline formatPhoneToE164 → uses normalizePhoneNumberToE164 from phoneUtils
 * - Removed inline email validation → uses isValidEmail from validationUtils
 * - Removed inline currency formatting → uses formatCurrency from currencyUtils
 * 
 * @refactor Combined desktop and mobile versions into single responsive component with unified business logic
 */

import { HelpIcon } from '@/components/icons';
import { TrashIcon } from '@heroicons/react/24/outline';
import React, { useState, useRef, useEffect } from 'react';
import { Tooltip } from '@/components/ui/primitives/Tooltip/Tooltip';
import { Button } from '@/components/ui/primitives/Button/Button';
import { useStripe, useElements } from '@stripe/react-stripe-js';
import { normalizePhoneNumberToE164 } from '@/lib/utils/phoneUtils';
import { isValidEmail } from '@/lib/utils/validationUtils';
import { formatCurrency } from '@/lib/utils/currencyUtils';
import { LoadingOverlay } from '@/components/ui/primitives/LoadingOverlay';

interface CartItem {
  name: string;
  quantity: number;
  price: number; // This represents the unit price of the item
}

interface MyCartProps {
  cartItems: CartItem[];
  removeItem: (name: string) => void;
  clearCart: () => void;
  onCheckout: () => void;
  isCheckout: boolean;
  // Order form data
  address: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  // Error states
  addressError: string | null;
  firstNameError: string | null;
  lastNameError: string | null;
  emailError: string | null;
  phoneError: string | null;
  // Error setters
  setAddressError: (error: string | null) => void;
  setFirstNameError: (error: string | null) => void;
  setLastNameError: (error: string | null) => void;
  setEmailError: (error: string | null) => void;
  setPhoneError: (error: string | null) => void;
  // Success handler
  onOrderSuccess: (orderData: any) => void;
  // Payment method data
  savedCards: SavedCard[];
  selectedPaymentMethod: string | null;
  // User ID for payment processing
  userId?: number;
}

interface SavedCard {
  id: number;
  stripePaymentMethodId: string;
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

export function MyCart({ 
  cartItems, 
  removeItem, 
  clearCart, 
  onCheckout, 
  isCheckout,
  address,
  firstName,
  lastName,
  email,
  phoneNumber,
  addressError,
  firstNameError,
  lastNameError,
  emailError,
  phoneError,
  setAddressError,
  setFirstNameError,
  setLastNameError,
  setEmailError,
  setPhoneError,
  onOrderSuccess,
  savedCards,
  selectedPaymentMethod,
  userId
}: MyCartProps) {
  // Mobile expansion state
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [contentHeight, setContentHeight] = useState<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Stripe hooks
  const stripe = useStripe();
  const elements = useElements();

  // Calculate total price
  const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  // Update mobile content height when expanded state changes
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [isExpanded, cartItems]);

  const handleSubmitOrder = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Validate form fields
      let hasErrors = false;

      if (!address.trim()) {
        setAddressError("Please enter your delivery address");
        hasErrors = true;
      }

      if (!firstName.trim()) {
        setFirstNameError("Please enter your first name");
        hasErrors = true;
      }

      if (!lastName.trim()) {
        setLastNameError("Please enter your last name");
        hasErrors = true;
      }

      if (!email.trim() || !isValidEmail(email)) {
        setEmailError("Please enter a valid email address");
        hasErrors = true;
      }

      if (!phoneNumber.trim()) {
        setPhoneError("Please enter your phone number");
        hasErrors = true;
      }

      // Determine payment method details
      let paymentMethodId = null;
      let isUsingSavedCard = false;
      let needsNewCardInfo = false;
      
      // Check if user has selected a saved card
      if (selectedPaymentMethod && savedCards.length > 0) {
        const selectedCard = savedCards.find(card => 
          card.stripePaymentMethodId === selectedPaymentMethod
        );
        if (selectedCard) {
          paymentMethodId = selectedCard.stripePaymentMethodId;
          isUsingSavedCard = true;
        } else if (selectedPaymentMethod === "Add new card") {
          needsNewCardInfo = true;
        }
      } else if (savedCards.length === 0) {
        // No saved cards - must use new card
        needsNewCardInfo = true;
      }

      // Validate payment method selection
      if (!isUsingSavedCard && !needsNewCardInfo) {
        setSubmitError("Please select a payment method to continue");
        hasErrors = true;
      }

      // Validate card details for new card entry
      if (needsNewCardInfo && !hasErrors) {
        if (!stripe || !elements) {
          setSubmitError("Payment system not ready. Please try again.");
          hasErrors = true;
        } else {
          const cardElement = elements.getElement('cardNumber');
          if (!cardElement) {
            setSubmitError("Please enter your card information to continue");
            hasErrors = true;
          }
        }
      }

      if (hasErrors) {
        setIsSubmitting(false);
        return;
      }

      // Create payment method for new card
      if (needsNewCardInfo) {
        const cardElement = elements!.getElement('cardNumber')!;

        const { error: stripeError, paymentMethod } = await stripe!.createPaymentMethod({
          type: 'card',
          card: cardElement,
          billing_details: {
            name: `${firstName} ${lastName}`,
            email: email,
            phone: normalizePhoneNumberToE164(phoneNumber),
            address: {
              line1: address,
              country: 'US',
            }
          },
        });

        if (stripeError) {
          setSubmitError(stripeError.message || 'Failed to process card information. Please check your card details and try again.');
          setIsSubmitting(false);
          return;
        }

        paymentMethodId = paymentMethod.id;
        isUsingSavedCard = false;
      }

      // Submit order to API - Updated route path
      const formattedPhone = normalizePhoneNumberToE164(phoneNumber);
      const response = await fetch('/api/orders/packing-supplies/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: `${firstName} ${lastName}`,
          customerEmail: email,
          customerPhone: formattedPhone,
          deliveryAddress: address,
          cartItems: cartItems,
          totalPrice: totalPrice,
          paymentMethod: isUsingSavedCard ? 'saved_card' : 'new_card',
          stripePaymentMethodId: paymentMethodId,
          userId: userId,
          deliveryNotes: '',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ API validation error:', result);
        if (result.details) {
          console.error('Validation details:', result.details);
        }
        throw new Error(result.error || 'Failed to create order');
      }

      console.log('✅ Order created successfully:', result);
      onOrderSuccess(result);

    } catch (error) {
      console.error('❌ Error submitting order:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleButtonClick = () => {
    if (isCheckout) {
      handleSubmitOrder();
    } else {
      onCheckout();
    }
  };

  return (
    <>
      {/* Loading Overlay - Show during order submission */}
      <LoadingOverlay 
        visible={isSubmitting} 
        message="Processing Order..."
        spinnerSize="xl"
      />

      {/* Desktop Layout */}
      <div className="hidden md:block w-full max-w-md mx-auto md:mx-0 md:ml-auto">
        <div className="p-6 bg-surface-primary rounded-md shadow-custom-shadow">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-border">
            <h2 className="text-2xl font-semibold text-text-primary">My Cart</h2>
            <button
              onClick={cartItems.length > 0 ? clearCart : undefined}
              disabled={cartItems.length === 0}
              className={cartItems.length === 0 ? 'cursor-not-allowed' : 'p-2 cursor-pointer hover:bg-surface-tertiary active:bg-surface-disabled rounded-full'}
              aria-label="Clear cart"
            >
              <TrashIcon
                className={`w-5 h-5 ${
                  cartItems.length === 0 ? 'text-slate-200' : 'text-text-primary'
                }`}
                aria-hidden="true"
              />
            </button>
          </div>
          
          <h3 className="text-xl font-semibold mb-4 text-text-primary">Price details</h3>
          <div className="space-y-4 border-b border-border pb-4">
            {cartItems.length > 0 ? (
              cartItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <p className="text-text-primary">
                    <span className="font-medium">{item.quantity}</span> {item.name}
                  </p>
                  <div className="flex items-center space-x-2">
                    <p className="text-text-primary">{formatCurrency(item.price * item.quantity)}</p>
                    <button
                      onClick={() => removeItem(item.name)}
                      className="text-xs text-text-tertiary underline underline-offset-2 decoration-dotted"
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex justify-between items-center">
                <p className="text-text-primary">---</p>
                <div className="flex items-center space-x-2">
                  <p className="text-text-primary">---</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mt-4 mb-8">
            <div className="flex items-center gap-1">
              <p className="text-xl font-semibold text-text-primary">Total</p>
              <Tooltip text="This is the total amount you will pay including taxes and delivery fees" />
            </div>
            <p className="text-xl font-semibold text-text-primary">{formatCurrency(totalPrice)}</p>
          </div>

          {submitError && (
            <div className="mb-4 p-3 bg-status-bg-error border border-border-error rounded-md" role="alert">
              <p className="text-sm text-status-error">{submitError}</p>
            </div>
          )}

          <Button
            variant="primary"
            fullWidth
            disabled={cartItems.length === 0}
            onClick={handleButtonClick}
            aria-label={isCheckout ? 'Place order' : 'Proceed to checkout'}
          >
            {isCheckout ? 'Place Order' : 'Checkout'}
          </Button>
        </div>
        
        <div className="flex items-center space-x-2 mt-6">
          <HelpIcon className="mx-2 w-8 h-8 text-text-primary shrink-0" />
          <p className="text-sm text-text-primary">
            {isCheckout 
              ? 'We will send text notifications to track your delivery order' 
              : 'Delivery estimates range from same day to next day depending on when your order was placed'}
          </p>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-primary text-text-inverse z-50">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`absolute -top-8 left-1/2 transform -translate-x-1/2 w-16 h-8 ${isExpanded ? 'bg-zinc-800' : 'bg-primary'} text-text-inverse rounded-t-full flex items-center justify-center`}
          aria-label={isExpanded ? 'Collapse cart' : 'Expand cart'}
          aria-expanded={isExpanded}
        >
          <svg
            className={`w-6 h-6 mt-1 text-text-inverse transition-transform ${isExpanded ? 'rotate-0' : 'rotate-180'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div
          className="transition-all bg-zinc-800 duration-300 ease-in-out overflow-hidden"
          style={{ maxHeight: isExpanded ? `${contentHeight}px` : '0px' }}
        >
          <div ref={contentRef} className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            <div className="pt-4 px-4">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-zinc-700">
                <h3 className="text-2xl font-semibold text-text-inverse">My Cart</h3>
                <button
                  onClick={cartItems.length > 0 ? clearCart : undefined}
                  disabled={cartItems.length === 0}
                  className={cartItems.length === 0 ? 'cursor-not-allowed' : 'cursor-pointer'}
                  aria-label="Clear cart"
                >
                  <TrashIcon
                    className={`w-5 h-5 ${cartItems.length === 0 ? 'text-slate-300' : 'text-text-inverse'}`}
                    aria-hidden="true"
                  />
                </button>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-text-inverse">Price details</h3>
              <div className="pb-4">
                {cartItems.length > 0 ? (
                  cartItems.map((item, index) => (
                    <div key={index} className="flex justify-between mb-2">
                      <p className="text-text-inverse">
                        <span className="font-medium">{item.quantity}</span> {item.name}
                      </p>
                      <div className="flex gap-2">
                        <p className="text-text-inverse">{formatCurrency(item.price * item.quantity)}</p>
                        <button
                          onClick={() => removeItem(item.name)}
                          className="text-xs text-text-inverse underline underline-offset-2 decoration-dotted"
                          aria-label={`Remove ${item.name} from cart`}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between mb-2">
                    <p className="text-text-inverse">---</p>
                    <p className="text-text-inverse">---</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4">
          {submitError && (
            <div className="mb-4 p-3 bg-status-bg-error border border-border-error rounded-md" role="alert">
              <p className="text-sm text-status-error">{submitError}</p>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <div className="flex gap-1">
              <p className="text-xl font-semibold text-text-inverse">Total</p>
              <Tooltip text="This is the total amount you will pay including taxes and delivery fees" className="text-text-inverse" />
            </div>
            <div>
              <div className="flex items-center">
                <p className="text-xl font-semibold text-text-inverse mr-4">{formatCurrency(totalPrice)}</p>
                <Button
                  variant="white"
                  size="md"
                  fullWidth
                  disabled={cartItems.length === 0}
                  onClick={handleButtonClick}
                  aria-label={isCheckout ? 'Place order' : 'Proceed to checkout'}
                >
                  {isCheckout ? 'Place Order' : 'Checkout'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

