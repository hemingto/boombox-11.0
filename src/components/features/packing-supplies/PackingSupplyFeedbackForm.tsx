/**
 * @fileoverview Packing supply order feedback form with rating, tip, and driver feedback
 * @source boombox-10.0/src/app/components/packing-supplies/packingsupplyfeedbackform.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Allows customers to rate their packing supply delivery experience
 * - Provides star rating system (1-5 stars) for overall service
 * - Offers tip options (0%, 15%, 20%, 25%, custom) with calculated amounts
 * - Includes driver thumbs up/down rating when driver information is available
 * - Processes tip payments through Stripe with status feedback
 * - Prevents duplicate feedback submission by checking existing feedback
 * - Displays success/error states with appropriate messaging
 * 
 * API ROUTES UPDATED:
 * - Old: /api/packing-supplies/feedback/check → New: /api/admin/packing-supply-feedback/check
 * - Old: /api/packing-supplies/feedback/submit → New: /api/admin/packing-supply-feedback/submit
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded zinc-950/zinc-400/slate-100 with semantic color tokens
 * - Updated button styling to use btn-primary utility class
 * - Applied consistent status colors (success, error, warning) from design system
 * - Used semantic text colors (text-primary, text-secondary, text-tertiary)
 * - Applied consistent border and background colors from surface/border tokens
 * 
 * ACCESSIBILITY IMPROVEMENTS:
 * - Added aria-label to star rating buttons for screen readers
 * - Added aria-label to driver rating (thumbs up/down) buttons
 * - Added role="alert" to error and status messages for announcements
 * - Added aria-live="polite" to dynamic status messages
 * - Improved focus states with keyboard navigation support
 * 
 * @refactor Applied design system colors, updated API routes, enhanced accessibility
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import {
 CheckCircleIcon,
 ExclamationCircleIcon,
 HandThumbUpIcon,
 HandThumbDownIcon,
} from '@heroicons/react/24/outline';
import {
 HandThumbUpIcon as HandThumbUpIconSolid,
 HandThumbDownIcon as HandThumbDownIconSolid,
} from '@heroicons/react/24/solid';

interface PackingSupplyFeedbackFormProps {
 orderId: string;
 taskShortId: string;
 orderDate: string;
 deliveryAddress: string;
 invoiceTotal: number;
 userId?: string;
 driverName?: string;
 driverProfilePicture?: string;
 items: Array<{
  name: string;
  quantity: number;
  price: number;
 }>;
}

interface SubmissionResponse {
 id: number;
 tipProcessingStatus?: string;
 tipProcessingError?: string;
 tipPaymentStatus?: string;
}

export function PackingSupplyFeedbackForm({
 orderId,
 taskShortId,
 orderDate,
 deliveryAddress,
 invoiceTotal,
 userId,
 driverName,
 driverProfilePicture,
 items,
}: PackingSupplyFeedbackFormProps) {
 const router = useRouter();
 const [rating, setRating] = useState<number>(0);
 const [comment, setComment] = useState<string>('');
 const [tipPercentage, setTipPercentage] = useState<number>(15);
 const [customTip, setCustomTip] = useState<string>('');
 const [isCustomTip, setIsCustomTip] = useState<boolean>(false);
 const [driverRating, setDriverRating] = useState<'thumbs_up' | 'thumbs_down' | null>(null);
 const [ratingError, setRatingError] = useState<string | null>(null);
 const [submitted, setSubmitted] = useState<boolean>(false);
 const [errorMessage, setErrorMessage] = useState<string | null>(null);
 const [submitting, setSubmitting] = useState<boolean>(false);
 const [tipPaymentStatus, setTipPaymentStatus] = useState<string | null>(null);
 const [loading, setLoading] = useState<boolean>(true);

 useEffect(() => {
  // Check if feedback already exists for this order
  const checkFeedback = async () => {
   try {
    const response = await fetch(
     `/api/admin/packing-supply-feedback/check?taskShortId=${taskShortId}`
    );
    if (response.ok) {
     const data = await response.json();
     if (data.exists) {
      setSubmitted(true);
     }
    }
   } catch (error) {
    console.error('Error checking feedback:', error);
   } finally {
    setLoading(false);
   }
  };

  checkFeedback();
 }, [taskShortId]);

 const tipOptions = [
  { label: 'No tip', value: 0 },
  { label: '15%', value: 15 },
  { label: '20%', value: 20 },
  { label: '25%', value: 25 },
  { label: 'Custom Tip', value: 'custom' },
 ];

 const calculateTipAmount = (percentage: number) => {
  return ((percentage / 100) * invoiceTotal).toFixed(2);
 };

 const handleSubmit = async () => {
  if (rating === 0) {
   setRatingError('Please provide a rating');
   return;
  }

  setSubmitting(true);
  setErrorMessage(null);

  console.log('PackingSupplyFeedbackForm submitting with taskShortId:', taskShortId);

  try {
   const tipAmount = isCustomTip
    ? parseFloat(customTip || '0')
    : parseFloat(calculateTipAmount(tipPercentage));

   const payload = {
    taskShortId: taskShortId,
    rating,
    comment,
    tipAmount,
    driverRating,
   };

   console.log('Submitting packing supply feedback with payload:', payload);

   const response = await fetch('/api/admin/packing-supply-feedback/submit', {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
   });

   const data: SubmissionResponse = await response.json();

   if (response.ok) {
    console.log('Packing supply feedback submitted successfully:', data);

    // Handle tip payment status
    if (payload.tipAmount > 0) {
     if (data.tipProcessingStatus === 'failed' || data.tipProcessingStatus === 'error') {
      setTipPaymentStatus('failed');
      setErrorMessage(
       `Your feedback was submitted, but the tip payment failed: ${data.tipProcessingError || 'Payment processing error'}`
      );
     } else if (data.tipPaymentStatus === 'succeeded') {
      setTipPaymentStatus('succeeded');
     } else if (data.tipPaymentStatus === 'processing') {
      setTipPaymentStatus('processing');
     }
    }

    setSubmitted(true);
   } else {
    console.error('Error response from server:', data);
    setErrorMessage(
     `Failed to submit feedback: ${data.tipProcessingError || 'Unknown error'}`
    );
    if (data.tipProcessingError) {
     console.error('Error details:', data.tipProcessingError);
    }
   }
  } catch (error) {
   console.error('Error submitting packing supply feedback:', error);
   setErrorMessage('An error occurred while submitting your feedback. Please try again.');
  } finally {
   setSubmitting(false);
  }
 };

 const handleGoToHome = () => {
  router.push('/');
 };

 if (loading) {
  return <></>;
 }

 if (submitted) {
  return (
   <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
    {tipPaymentStatus === 'failed' ? (
     <ExclamationCircleIcon className="text-status-warning w-16 h-16 mx-auto mb-4" />
    ) : (
     <CheckCircleIcon className="text-status-success w-16 h-16 mx-auto mb-4" />
    )}

    <h1 className="text-2xl font-semibold mb-4">Thank you for your feedback!</h1>

    {tipPaymentStatus === 'failed' && (
     <div
      className="bg-status-bg-warning border border-border-warning rounded-md p-4 mb-6 max-w-md"
      role="alert"
      aria-live="polite"
     >
      <p className="text-status-warning text-sm mb-2">
       Your feedback was submitted successfully, but there was an issue processing your tip
       payment.
      </p>
      <p className="text-status-warning text-sm">
       {"Please contact support at help@boomboxstorage.com if you'd like to try again."}
      </p>
     </div>
    )}

    {tipPaymentStatus === 'processing' && (
     <div
      className="bg-status-bg-info border border-border-info rounded-md p-4 mb-6 max-w-md"
      role="alert"
      aria-live="polite"
     >
      <p className="text-status-info text-sm">
       Your tip payment is being processed and will be confirmed shortly.
      </p>
     </div>
    )}

    {tipPaymentStatus === 'succeeded' && (
     <div
      className="bg-status-bg-success border border-border-success rounded-md p-4 mb-6 max-w-md"
      role="alert"
      aria-live="polite"
     >
      <p className="text-status-success text-sm">
       Your tip was successfully processed to your default card on file.
      </p>
     </div>
    )}

    <button onClick={handleGoToHome} className="btn-primary block mt-10" aria-label="Return to home page">
     Back to Home
    </button>
   </div>
  );
 }

 return (
  <div className="max-w-2xl mx-auto px-4 py-8 min-h-[60vh] mb-24">
   <div className="flex items-center mb-4 border-b border-border pb-8">
    <div className="w-24 h-24 bg-surface-tertiary rounded-md mr-4 overflow-hidden flex items-center justify-center">
     <Image
      src="/img/logo.png"
      alt="Boombox Storage logo"
      width={96}
      height={96}
      className="rounded-md object-cover w-full h-full"
     />
    </div>
    <div>
     <h2 className="text-xl font-semibold">Boombox Packing Supplies</h2>
     <p className="text-text-secondary">{orderDate}</p>
     <p className="text-text-secondary">Order #{taskShortId}</p>
    </div>
   </div>

   {driverName && (
    <div className="mb-8 border-b border-border pb-8">
     <h3 className="text-xl font-semibold mb-4">Your Driver</h3>
     <div className="flex items-center justify-between">
      <div className="flex items-center">
       <div className="w-12 h-12 bg-surface-tertiary rounded-md mr-3 overflow-hidden flex items-center justify-center">
        {driverProfilePicture && (
         <Image
          src={
           driverProfilePicture.startsWith('https://')
            ? driverProfilePicture
            : `https://res.cloudinary.com/daezxeevr/image/upload/driver-profile-pictures/${driverProfilePicture}`
          }
          alt={`${driverName} profile picture`}
          width={48}
          height={48}
          className="rounded-md object-cover w-full h-full"
         />
        )}
       </div>
       <div>
        <p className="text-md font-semibold">{driverName}</p>
        <p className="text-sm text-text-secondary">Boombox Driver</p>
       </div>
      </div>
      <div className="flex gap-2">
       <button
        onClick={() =>
         setDriverRating(driverRating === 'thumbs_up' ? null : 'thumbs_up')
        }
        className={`p-3 rounded-full ${
         driverRating === 'thumbs_up'
          ? 'bg-status-bg-success border-border-success text-status-success'
          : 'bg-surface-tertiary text-text-tertiary hover:bg-surface-disabled'
        }`}
        aria-label={
         driverRating === 'thumbs_up'
          ? 'Remove thumbs up rating'
          : 'Rate driver with thumbs up'
        }
       >
        {driverRating === 'thumbs_up' ? (
         <HandThumbUpIconSolid className="w-6 h-6" />
        ) : (
         <HandThumbUpIcon className="w-6 h-6" />
        )}
       </button>
       <button
        onClick={() =>
         setDriverRating(driverRating === 'thumbs_down' ? null : 'thumbs_down')
        }
        className={`p-3 rounded-full ${
         driverRating === 'thumbs_down'
          ? 'bg-status-bg-error text-status-error'
          : 'bg-surface-tertiary text-text-tertiary hover:bg-surface-disabled'
        }`}
        aria-label={
         driverRating === 'thumbs_down'
          ? 'Remove thumbs down rating'
          : 'Rate driver with thumbs down'
        }
       >
        {driverRating === 'thumbs_down' ? (
         <HandThumbDownIconSolid className="w-6 h-6" />
        ) : (
         <HandThumbDownIcon className="w-6 h-6" />
        )}
       </button>
      </div>
     </div>
    </div>
   )}

   <div className="border-b border-border pb-8 mb-8">
    <h3 className="text-xl font-semibold mb-1">Add a tip</h3>
    <p className="text-text-secondary mb-6">Order total ${invoiceTotal.toFixed(2)}</p>
    <div className="flex flex-wrap gap-2">
     {tipOptions.map((option) => (
      <button
       key={option.label}
       onClick={() => {
        if (option.value === 'custom') {
         setIsCustomTip(true);
        } else {
         setIsCustomTip(false);
         setTipPercentage(option.value as number);
        }
       }}
       className={`px-4 py-2 rounded-full border ${
        (!isCustomTip && tipPercentage === option.value) ||
        (isCustomTip && option.value === 'custom')
         ? 'border-primary bg-primary text-text-inverse'
         : 'bg-surface-tertiary border-border hover:bg-surface-disabled'
       }`}
       aria-label={`Select ${option.label} tip ${option.value !== 0 && option.value !== 'custom' ? `($${calculateTipAmount(option.value as number)})` : ''}`}
      >
       {option.label}
       {option.value !== 0 && option.value !== 'custom' && (
        <span className="text-sm ml-1">
         (${calculateTipAmount(option.value as number)})
        </span>
       )}
      </button>
     ))}
    </div>

    {isCustomTip && (
     <div className="mt-4 relative">
      <span className="absolute text-lg left-4 top-1/2 -translate-y-1/2 text-text-primary">
       $
      </span>
      <input
       type="number"
       inputMode="decimal"
       step="0.01"
       min="0"
       value={customTip}
       onChange={(e) => {
        const value = e.target.value;
        setCustomTip(value);
       }}
       onBlur={(e) => {
        // Format to 2 decimal places on blur
        if (e.target.value) {
         const formatted = Number(e.target.value).toFixed(2);
         setCustomTip(formatted);
        }
       }}
       placeholder="0.00"
       className="text-lg w-full px-4 py-2 pl-8 border placeholder:text-text-primary border-border focus:outline-none focus:ring-0 focus:border-border-focus focus:ring-1 focus:ring-border-focus focus:bg-surface-primary bg-surface-tertiary rounded-md appearance-none"
       aria-label="Enter custom tip amount in dollars"
      />
      <style jsx>{`
       /* Hide spinner buttons for Chrome, Safari, Edge, Opera */
       input::-webkit-outer-spin-button,
       input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
       }

       /* Hide spinner buttons for Firefox */
       input[type='number'] {
        -moz-appearance: textfield;
       }
      `}</style>
     </div>
    )}
   </div>

   <div className="mb-4 pb-4">
    <h3 className="text-lg font-semibold mb-4">Rate your delivery experience</h3>
    <div className="flex gap-2 mb-2" role="group" aria-label="5 star rating">
     {[1, 2, 3, 4, 5].map((star) => (
      <button
       key={star}
       onClick={() => {
        setRating(star);
        setRatingError(null);
       }}
       className="text-2xl"
       aria-label={`Rate ${star} out of 5 stars`}
       aria-pressed={star <= rating}
      >
       {star <= rating ? (
        <StarIconSolid
         className={`w-8 h-8 ${ratingError ? 'text-status-error' : 'text-primary'}`}
        />
       ) : (
        <StarIcon
         className={`w-8 h-8 ${ratingError ? 'text-status-error' : 'text-primary'}`}
        />
       )}
      </button>
     ))}
    </div>
    {ratingError && (
     <p className="text-status-error text-sm" role="alert">
      {ratingError}
     </p>
    )}
   </div>

   <div className="mb-8 pb-8">
    <textarea
     value={comment}
     onChange={(e) => setComment(e.target.value)}
     placeholder="Please provide your feedback..."
     className="w-full h-36 sm:h-32 p-3 border border-border rounded-md bg-surface-tertiary placeholder:text-text-tertiary focus:placeholder:text-text-primary focus-within:ring-2 focus-within:ring-border-focus focus:bg-surface-primary focus:outline-none resize-none"
     aria-label="Additional comments about your delivery experience"
    />
   </div>

   {errorMessage && (
    <div
     className="mb-6 p-3 bg-status-bg-error border border-border-error rounded-md"
     role="alert"
    >
     <p className="text-status-error text-sm">{errorMessage}</p>
    </div>
   )}

   <button
    onClick={handleSubmit}
    disabled={submitting}
    className={`w-full font-semibold py-3 rounded-md ${
     submitting
      ? 'bg-primary-hover text-text-inverse cursor-not-allowed'
      : 'bg-primary text-text-inverse hover:bg-primary-hover'
    }`}
    aria-label={submitting ? 'Submitting feedback' : 'Submit feedback'}
   >
    {submitting ? (
     <span className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
      Processing...
     </span>
    ) : (
     'Submit'
    )}
   </button>
  </div>
 );
}

