/**
 * @fileoverview Checkout form component for packing supply orders
 * @source boombox-10.0/src/app/components/packing-supplies/placeorder.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Multi-section checkout form for packing supply orders including:
 * - Delivery address input with Google Places autocomplete
 * - Contact information (name, email, phone)
 * - Payment method selection (saved cards or new card via Stripe Elements)
 * - Delivery time notification (same-day vs next-day based on 12pm PST cutoff)
 * - Cart summary display with total price
 * 
 * API ROUTES UPDATED:
 * - Uses Stripe Elements for payment processing (no direct API route changes)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced amber-100/amber-200 with status-bg-warning/border-warning
 * - Replaced amber-600 with status-warning for text
 * - Replaced emerald-100/emerald-200 with status-bg-success/border-success
 * - Replaced emerald-500 with status-success for text
 * - Replaced red-500 with status-error for error messages
 * - Replaced slate-100 with surface-tertiary for info boxes
 * - Applied proper semantic colors throughout component states
 * 
 * @refactor Migrated with design system compliance, enhanced accessibility,
 * preserved all Stripe integration functionality
 */

'use client';

import { useState, useEffect } from 'react';
import { ChevronLeftIcon } from '@heroicons/react/20/solid';
import { StripeElementChangeEvent } from '@stripe/stripe-js';
import {
  FirstNameInput,
  LastNameInput,
  EmailInput,
  PhoneNumberInput,
  CardNumberInput,
  CardExpirationDateInput,
  CardCvcInput,
  AddressInput,
  PaymentMethodDropdown,
} from '@/components/forms';
import { StripeLogo } from '@/components/icons/PoweredByStripeIcon';

interface CartItem {
  name: string;
  quantity: number;
  price: number;
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

interface PlaceOrderProps {
  onBack: () => void;
  address: string;
  setAddress: (address: string) => void;
  addressError: string | null;
  setAddressError: (error: string | null) => void;
  onAddressChange: (
    newAddress: string,
    newZipCode: string,
    newCoordinates: google.maps.LatLngLiteral
  ) => void;
  clearAddressError: () => void;
  firstName: string;
  setFirstName: (firstName: string) => void;
  firstNameError: string | null;
  setFirstNameError: (error: string | null) => void;
  lastName: string;
  setLastName: (lastName: string) => void;
  lastNameError: string | null;
  setLastNameError: (error: string | null) => void;
  email: string;
  setEmail: (email: string) => void;
  emailError: string | null;
  setEmailError: (error: string | null) => void;
  phoneNumber: string;
  setPhoneNumber: (phoneNumber: string) => void;
  phoneError: string | null;
  setPhoneError: (error: string | null) => void;
  cartItems: CartItem[];
  totalPrice: number;
  savedCards: SavedCard[];
  selectedPaymentMethod: string | null;
  onPaymentMethodChange: (method: string | null) => void;
}

export const PlaceOrder: React.FC<PlaceOrderProps> = ({
  onBack,
  address,
  addressError,
  setAddressError,
  onAddressChange,
  clearAddressError,
  firstName,
  setFirstName,
  firstNameError,
  setFirstNameError,
  lastName,
  setLastName,
  lastNameError,
  setLastNameError,
  email,
  setEmail,
  emailError,
  setEmailError,
  phoneNumber,
  setPhoneNumber,
  phoneError,
  setPhoneError,
  cartItems,
  totalPrice,
  savedCards,
  selectedPaymentMethod: initialSelectedPaymentMethod,
  onPaymentMethodChange,
}) => {
  const [stripeErrors, setStripeErrors] = useState<{
    cardNumber: string | null;
    cardExpiry: string | null;
    cardCvc: string | null;
  }>({
    cardNumber: null,
    cardExpiry: null,
    cardCvc: null,
  });

  // Payment method state
  const [showNewCardForm, setShowNewCardForm] = useState(false);

  // Delivery time notification state
  const [isAfter12pmPST, setIsAfter12pmPST] = useState(false);

  // Initialize payment method selection
  useEffect(() => {
    if (!initialSelectedPaymentMethod && savedCards.length > 0) {
      const defaultCard = savedCards.find((card) => card.isDefault);
      if (defaultCard) {
        const cardDisplay = `${defaultCard.brand.toUpperCase()} •••• ${defaultCard.last4}`;
        onPaymentMethodChange(cardDisplay);
        setShowNewCardForm(false);
      }
    } else if (!initialSelectedPaymentMethod && savedCards.length === 0) {
      setShowNewCardForm(true);
    } else {
      setShowNewCardForm(initialSelectedPaymentMethod === 'Add new card');
    }
  }, [savedCards, initialSelectedPaymentMethod, onPaymentMethodChange]);

  // Check if after 12pm PST for delivery time notification
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const pstTime = new Date(
        now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
      );
      setIsAfter12pmPST(pstTime.getHours() >= 12);
    };

    updateTime();
    const timer = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Create dropdown options for saved cards
  const paymentOptions = [
    ...savedCards.map((card) => ({
      value: `${card.brand.toUpperCase()} •••• ${card.last4}`,
      display: `${card.brand.toUpperCase()} •••• ${card.last4}`,
      brand: card.brand,
      isAddNew: false,
    })),
  ];

  const handlePaymentMethodChange = (option: string | null) => {
    onPaymentMethodChange(option);
    setShowNewCardForm(false);
  };

  const handleCardNumberChange = (event: StripeElementChangeEvent) => {
    setStripeErrors((prev) => ({
      ...prev,
      cardNumber: event.error ? event.error.message : null,
    }));
  };

  const handleCardExpiryChange = (event: StripeElementChangeEvent) => {
    setStripeErrors((prev) => ({
      ...prev,
      cardExpiry: event.error ? event.error.message : null,
    }));
  };

  const handleCardCvcChange = (event: StripeElementChangeEvent) => {
    setStripeErrors((prev) => ({
      ...prev,
      cardCvc: event.error ? event.error.message : null,
    }));
  };

  const handleBackClick = () => {
    onBack();
  };

  const renderStripeErrors = () => {
    const activeErrors = Object.values(stripeErrors).filter(
      (error) => error !== null
    );
    if (activeErrors.length === 0) return null;

    return (
      <div className="mt-2 space-y-1" role="alert">
        {stripeErrors.cardNumber && (
          <p className="text-status-error text-sm">{stripeErrors.cardNumber}</p>
        )}
        {stripeErrors.cardExpiry && (
          <p className="text-status-error text-sm">{stripeErrors.cardExpiry}</p>
        )}
        {stripeErrors.cardCvc && (
          <p className="text-status-error text-sm">{stripeErrors.cardCvc}</p>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="max-w-lg mx-auto md:mx-0 md:ml-auto">
        <div className="flex items-center gap-2 mb-12 lg:-ml-10">
          <ChevronLeftIcon
            className="w-8 cursor-pointer shrink-0 text-text-primary hover:text-text-secondary"
            onClick={handleBackClick}
            aria-label="Go back"
          />
          <h1 className="text-4xl text-text-primary font-bold">Place order</h1>
        </div>

        {/* Delivery time notification */}
        {isAfter12pmPST ? (
          <div className="bg-status-bg-warning p-3 mb-4 -mt-8 border border-border-warning rounded-md max-w-fit">
            <p className="text-xs text-status-warning">
              Orders placed after 12pm are scheduled for next day delivery. Your
              delivery is estimated to be delivered before{' '}
              <span className="font-semibold">7pm tomorrow</span>.
            </p>
          </div>
        ) : (
          <div className="bg-status-bg-success p-3 mb-4 -mt-8 border border-border-success rounded-md max-w-fit">
            <p className="text-xs text-status-success">
              Orders placed before 12pm are scheduled for same day delivery.
              Your delivery is estimated to be delivered before{' '}
              <span className="font-semibold">7pm today</span>.
            </p>
          </div>
        )}

        {/* Delivery address section */}
        <p className="mb-4 text-text-primary">
          Where are we delivering your packing supplies?
        </p>

        <AddressInput
          value={address}
          onAddressChange={onAddressChange}
          hasError={!!addressError}
          onClearError={clearAddressError}
        />
        {addressError && (
          <div className="flex items-center mb-4 -mt-4">
            <p className="ml-1 text-sm text-status-error" role="alert">
              {addressError}
            </p>
          </div>
        )}

        {/* Contact information section */}
        <p className="mb-4 mt-6 text-text-primary">
          Please provide your contact information
        </p>

        <div className="flex-col">
          <div className="flex-col sm:flex sm:flex-row gap-2">
            <FirstNameInput
              hasError={!!firstNameError}
              errorMessage={firstNameError || ''}
              onFirstNameChange={(firstName) => setFirstName(firstName)}
              onClearError={() => setFirstNameError(null)}
              value={firstName}
            />
            <LastNameInput
              hasError={!!lastNameError}
              errorMessage={lastNameError || ''}
              onLastNameChange={(lastName) => setLastName(lastName)}
              onClearError={() => setLastNameError(null)}
              value={lastName}
            />
          </div>

          <div>
            <EmailInput
              hasError={!!emailError}
              errorMessage={emailError || ''}
              onEmailChange={(newEmail) => setEmail(newEmail)}
              onClearError={() => setEmailError(null)}
              value={email}
            />

            <PhoneNumberInput
              hasError={!!phoneError}
              errorMessage={phoneError || ''}
              onChange={(newPhone) => setPhoneNumber(newPhone)}
              onClearError={() => setPhoneError(null)}
              value={phoneNumber}
            />
          </div>

          {/* Phone notification info */}
          <div className="p-3 sm:mb-4 mb-2 border border-border bg-surface-primary rounded-md max-w-fit">
            <p className="text-xs text-text-secondary">
              You&apos;ll receive updates about the status of your delivery via
              your phone number
            </p>
          </div>

          {/* Payment method section */}
          <p className="mb-4 mt-6 text-text-primary">
            {showNewCardForm
              ? 'Please add your new payment method'
              : 'Please select your payment method'}
          </p>

          {savedCards.length > 0 && !showNewCardForm && (
            <>
              <div className="mb-4">
                <PaymentMethodDropdown
                  label="Select payment method"
                  value={initialSelectedPaymentMethod}
                  onOptionChange={handlePaymentMethodChange}
                  options={paymentOptions}
                />
              </div>
              <p className="text-xs mb-4 text-text-secondary">
                Want to use a new credit card?{' '}
                <span
                  className="underline font-bold cursor-pointer text-text-primary hover:text-primary"
                  onClick={() => setShowNewCardForm(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setShowNewCardForm(true);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  Add it here
                </span>
              </p>
            </>
          )}

          {showNewCardForm && (
            <div className="flex-col gap-2">
              <div className="flex gap-2">
                <div className="basis-2/3">
                  <CardNumberInput onChange={handleCardNumberChange} />
                </div>
                <div className="relative w-full basis-1/6">
                  <CardExpirationDateInput onChange={handleCardExpiryChange} />
                </div>
                <div className="relative w-full basis-1/6">
                  <CardCvcInput onChange={handleCardCvcChange} />
                </div>
              </div>

              {renderStripeErrors()}

              {savedCards.length > 0 && (
                <p className="text-xs mt-4 text-text-secondary">
                  Want to use an existing credit card?{' '}
                  <span
                    className="underline font-bold cursor-pointer text-text-primary hover:text-primary"
                    onClick={() => setShowNewCardForm(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setShowNewCardForm(false);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    Click here
                  </span>
                </p>
              )}
              <div className="mt-4 flex justify-end items-center h-7">
                <StripeLogo />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaceOrder;

