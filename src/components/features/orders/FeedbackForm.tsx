/**
 * @fileoverview Customer feedback form for completed appointments with ratings, comments, driver ratings, and tip processing
 * @source boombox-10.0/src/app/components/feedback/feedbackform.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays appointment and moving partner information
 * - Allows customers to rate their experience (1-5 stars)
 * - Provides thumbs up/down rating for individual drivers
 * - Enables tip selection (percentage or custom amount)
 * - Handles feedback submission with tip payment processing
 * - Shows submission status and payment confirmation
 * 
 * API ROUTES UPDATED:
 * - Old: /api/feedback/check → New: /api/admin/feedback/check
 * - Old: /api/feedback/submit → New: /api/admin/feedback/submit
 * 
 * DESIGN SYSTEM UPDATES:
 * - Applied semantic color tokens (text-status-error, bg-surface-tertiary, etc.)
 * - Used design system utility classes (btn-primary, form-error, etc.)
 * - Replaced hardcoded colors with design system equivalents
 * 
 * @refactor Extracted business logic into custom hook, applied design system, enhanced accessibility
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
 StarIcon, 
 CheckCircleIcon, 
 ExclamationCircleIcon, 
 HandThumbUpIcon, 
 HandThumbDownIcon 
} from '@heroicons/react/24/outline';
import { 
 StarIcon as StarIconSolid,
 HandThumbUpIcon as HandThumbUpIconSolid, 
 HandThumbDownIcon as HandThumbDownIconSolid 
} from '@heroicons/react/24/solid';

import { useFeedbackForm } from '@/hooks/useFeedbackForm';
import { formatCurrency } from '@/lib/utils/currencyUtils';
import { Spinner } from '@/components/ui/primitives/Spinner';
import { Button } from '@/components/ui/primitives/Button/Button';

export interface FeedbackFormProps {
 appointmentId: string;
 appointmentType: string;
 appointmentDate: string;
 movingPartnerName?: string;
 movingPartnerCloudinaryFile?: string;
 invoiceTotal: number;
 userId?: string;
 drivers?: Array<{
  key: string;
  taskId: string;
  taskIds: string[];
  name: string;
  unitNumber: number;
  cloudinaryFile?: string;
  subtitle?: string;
 }>;
}

export function FeedbackForm({
 appointmentId,
 appointmentType,
 appointmentDate,
 movingPartnerName,
 movingPartnerCloudinaryFile,
 invoiceTotal,
 userId,
 drivers = []
}: FeedbackFormProps) {
 const router = useRouter();
 
 const {
  // Form state
  rating,
  setRating,
  comment,
  setComment,
  tipPercentage,
  setTipPercentage,
  customTip,
  setCustomTip,
  isCustomTip,
  setIsCustomTip,
  driverRatings,
  setDriverRatings,
  
  // UI state
  ratingError,
  submitted,
  errorMessage,
  submitting,
  tipPaymentStatus,
  loading,
  
  // Actions
  handleSubmit,
  checkExistingFeedback,
 } = useFeedbackForm({ appointmentId, drivers, invoiceTotal });

 // Check for existing feedback on mount
 useEffect(() => {
  checkExistingFeedback();
 }, [appointmentId, checkExistingFeedback]);

 const handleGoToAccount = () => {
  if (userId) {
   router.push(`/customer/${userId}`);
  } else {
   router.push('/login');
  }
 };

 const tipOptions = [
  { label: 'No tip', value: 0 },
  { label: '15%', value: 15 },
  { label: '20%', value: 20 },
  { label: '25%', value: 25 },
  { label: 'Custom Tip', value: 'custom' }
 ] as const;

 if (loading) {
  return (
   <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-label="Loading feedback form">
    <Spinner size="lg" />
   </div>
  );
 }

 if (submitted) {
  return (
   <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
    {tipPaymentStatus === 'failed' ? (
     <ExclamationCircleIcon 
      className="text-status-warning w-16 h-16 mx-auto mb-4" 
      aria-hidden="true"
     />
    ) : (
     <CheckCircleIcon 
      className="text-status-success w-16 h-16 mx-auto mb-4" 
      aria-hidden="true"
     />
    )}
    
    <h1 className="text-2xl font-semibold mb-4 text-text-primary">
     Thank you for your feedback!
    </h1>
    
    {tipPaymentStatus === 'failed' && (
     <div className="bg-status-bg-warning border border-border-warning rounded-md p-4 mb-6 max-w-md" role="alert">
      <p className="text-status-warning text-sm mb-2">
       Your feedback was submitted successfully, but there was an issue processing your tip payment.
      </p>
      <p className="text-status-warning text-sm">
       Please contact support at help@boomboxstorage.com if you'd like to try again.
      </p>
     </div>
    )}
    
    {tipPaymentStatus === 'processing' && (
     <div className="bg-status-bg-info border border-status-info rounded-md p-4 mb-6 max-w-md" role="status">
      <p className="text-status-info text-sm">
       Your tip payment is being processed and will be confirmed shortly.
      </p>
     </div>
    )}
    
    {tipPaymentStatus === 'succeeded' && (
     <div className="bg-status-bg-success border border-status-success rounded-md p-4 mb-6 max-w-md" role="status">
      <p className="text-status-success text-sm">
       Your tip was successfully processed to your default card on file.
      </p>
     </div>
    )}
    
    <button
     onClick={handleGoToAccount}
     className="btn-primary mt-10"
     type="button"
    >
     Go to Account Page
    </button>
   </div>
  );
 }

 return (
  <main className="max-w-2xl mx-auto px-4 py-8 min-h-[60vh] mb-24">
   {/* Appointment Header */}
   <section className="flex items-center mb-4 border-b border-surface-tertiary pb-8" aria-labelledby="appointment-info">
    <div className="w-24 h-24 bg-surface-tertiary rounded-md mr-4 overflow-hidden flex items-center justify-center">
     {(() => {
      let src: string | null = null;
      let altText: string = '';

      if (movingPartnerName === 'Boombox Storage') {
       src = '/img/logo.png';
       altText = 'Boombox Storage logo';
      } else if (!movingPartnerName) {
       src = '/img/logo.png';
       altText = 'Boombox logo';
      } else if (movingPartnerCloudinaryFile) {
       src = `https://res.cloudinary.com/daezxeevr/image/upload/mover-company-pictures/${movingPartnerCloudinaryFile}`;
       altText = `${movingPartnerName} logo`;
      }

      if (src) {
       return (
        <Image
         src={src}
         alt={altText}
         width={96}
         height={96}
         className="rounded-md object-cover w-full h-full"
        />
       );
      }
      return null;
     })()}
    </div>
    <div>
     <h2 id="appointment-info" className="text-xl font-semibold text-text-primary">
      {movingPartnerName || 'Boombox'}
     </h2>
     <p className="text-text-secondary">
      {appointmentDate}
     </p>
     <p className="text-text-secondary">
      {appointmentType}
     </p>
    </div>
   </section>

   {/* Driver Ratings */}
   {drivers.length > 0 && (
    <section className="mb-8 border-b border-surface-tertiary pb-8" aria-labelledby="driver-ratings-heading">
     <h3 id="driver-ratings-heading" className="text-xl font-semibold mb-4 text-text-primary">
      {drivers.length > 1 ? 'Drivers' : 'Driver'}
     </h3>
     <div className="space-y-4">
      {drivers.map((driver) => (
       <div key={driver.taskId} className="flex items-center justify-between">
        <div className="flex items-center">
         <div className="w-12 h-12 bg-surface-tertiary rounded-md mr-3 overflow-hidden flex items-center justify-center">
          {driver.cloudinaryFile && (
           <Image
            src={driver.cloudinaryFile.startsWith('https://') 
             ? driver.cloudinaryFile 
             : `https://res.cloudinary.com/daezxeevr/image/upload/driver-profile-pictures/${driver.cloudinaryFile}`}
            alt={`${driver.name} profile picture`}
            width={48}
            height={48}
            className="rounded-md object-cover w-full h-full"
           />
          )}
         </div>
         <div>
          <p className="text-md font-semibold text-text-primary">{driver.name}</p>
          {driver.subtitle && (
           <p className="text-sm text-text-secondary">{driver.subtitle}</p>
          )}
         </div>
        </div>
        <div className="flex gap-2" role="group" aria-label={`Rate ${driver.name}`}>
         <button
          onClick={() => setDriverRatings(prev => ({
           ...prev,
           [driver.key]: prev[driver.key] === 'thumbs_up' ? null : 'thumbs_up'
          }))}
          className={`p-3 rounded-full ${
           driverRatings[driver.key] === 'thumbs_up'
            ? 'bg-status-bg-success border-status-success text-status-success'
            : 'bg-surface-tertiary text-text-secondary hover:bg-surface-disabled'
          }`}
          aria-label={`Give ${driver.name} a thumbs up`}
          aria-pressed={driverRatings[driver.key] === 'thumbs_up'}
          type="button"
         >
          {driverRatings[driver.key] === 'thumbs_up' ? (
           <HandThumbUpIconSolid className="w-6 h-6" aria-hidden="true" />
          ) : (
           <HandThumbUpIcon className="w-6 h-6" aria-hidden="true" />
          )}
         </button>
         <button
          onClick={() => setDriverRatings(prev => ({
           ...prev,
           [driver.key]: prev[driver.key] === 'thumbs_down' ? null : 'thumbs_down'
          }))}
          className={`p-3 rounded-full ${
           driverRatings[driver.key] === 'thumbs_down'
            ? 'bg-status-bg-error text-status-error'
            : 'bg-surface-tertiary text-text-secondary hover:bg-surface-disabled'
          }`}
          aria-label={`Give ${driver.name} a thumbs down`}
          aria-pressed={driverRatings[driver.key] === 'thumbs_down'}
          type="button"
         >
          {driverRatings[driver.key] === 'thumbs_down' ? (
           <HandThumbDownIconSolid className="w-6 h-6" aria-hidden="true" />
          ) : (
           <HandThumbDownIcon className="w-6 h-6" aria-hidden="true" />
          )}
         </button>
        </div>
       </div>
      ))}
     </div>
    </section>
   )}

   {/* Tip Selection */}
   <section className="border-b border-surface-tertiary pb-8 mb-8" aria-labelledby="tip-selection-heading">
    <h3 id="tip-selection-heading" className="text-xl font-semibold mb-1 text-text-primary">Add a tip</h3>
    <p className="text-text-secondary mb-6">
     Invoice total {formatCurrency(invoiceTotal)}
    </p>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Tip options">
     {tipOptions.map((option) => (
      <button
       key={option.label}
       onClick={() => {
        if (option.value === 'custom') {
         setIsCustomTip(true);
        } else {
         setIsCustomTip(false);
         setTipPercentage(option.value);
        }
       }}
       className={`px-4 py-2 rounded-full border ${
        (!isCustomTip && tipPercentage === option.value) || 
        (isCustomTip && option.value === 'custom')
         ? 'border-primary bg-primary text-white'
         : 'bg-surface-tertiary border-surface-tertiary hover:bg-surface-disabled text-text-primary'
       }`}
       aria-pressed={
        (!isCustomTip && tipPercentage === option.value) || 
        (isCustomTip && option.value === 'custom')
       }
       type="button"
      >
       {option.label}
       {option.value !== 0 && option.value !== 'custom' && (
        <span className="text-sm ml-1">
         ({formatCurrency((option.value / 100) * invoiceTotal)})
        </span>
       )}
      </button>
     ))}
    </div>
    
    {isCustomTip && (
     <div className="mt-4 relative">
      <label htmlFor="custom-tip-input" className="sr-only">
       Custom tip amount in dollars
      </label>
      <span className="absolute text-lg left-4 top-1/2 -translate-y-1/2 text-text-primary" aria-hidden="true">
       $
      </span>
      <input
       id="custom-tip-input"
       type="number"
       inputMode="decimal"
       step="0.01"
       min="0"
       value={customTip}
       onChange={(e) => setCustomTip(e.target.value)}
       onBlur={(e) => {
        if (e.target.value) {
         const formatted = Number(e.target.value).toFixed(2);
         setCustomTip(formatted);
        }
       }}
       placeholder="0.00"
       className="input-field text-lg pl-8"
       aria-describedby="custom-tip-help"
      />
      <p id="custom-tip-help" className="sr-only">
       Enter a custom tip amount in dollars and cents
      </p>
     </div>
    )}
   </section>

   {/* Rating Section */}
   <section className="mb-4 pb-4" aria-labelledby="rating-heading">
    <h3 id="rating-heading" className="text-lg font-semibold mb-4 text-text-primary">Rate your experience</h3>
    <div className="flex gap-2 mb-2" role="group" aria-label="Star rating">
     {[1, 2, 3, 4, 5].map((star) => (
      <button
       key={star}
       onClick={() => {
        setRating(star);
       }}
       className="text-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
       aria-label={`Rate ${star} out of 5 stars`}
       aria-pressed={star <= rating}
       type="button"
      >
       {star <= rating ? (
        <StarIconSolid 
         className={`w-8 h-8 ${ratingError ? 'text-status-error' : 'text-primary'}`} 
         aria-hidden="true"
        />
       ) : (
        <StarIcon 
         className={`w-8 h-8 ${ratingError ? 'text-status-error' : 'text-primary'}`} 
         aria-hidden="true"
        />
       )}
      </button>
     ))}
    </div>
    {ratingError && (
     <p className="form-error" role="alert" aria-live="polite">
      {ratingError}
     </p>
    )}
   </section>

   {/* Comment Section */}
   <section className="mb-8 pb-8" aria-labelledby="comment-heading">
    <label htmlFor="feedback-comment" className="sr-only">
     Additional feedback comments
    </label>
    <h3 id="comment-heading" className="sr-only">Comments</h3>
    <textarea
     id="feedback-comment"
     value={comment}
     onChange={(e) => setComment(e.target.value)}
     placeholder="Please provide your feedback..."
     className="w-full h-36 sm:h-32 p-3 border border-surface-tertiary rounded-md bg-surface-tertiary placeholder:text-text-secondary focus:placeholder:text-primary focus-within:ring-2 focus-within:ring-primary focus:bg-surface-primary focus:outline-none resize-none"
     aria-describedby="feedback-comment-help"
    />
    <p id="feedback-comment-help" className="sr-only">
     Optional: Share additional details about your experience
    </p>
   </section>

   {/* Error Message */}
   {errorMessage && (
    <div className="mb-6 p-3 bg-status-bg-error border border-status-error rounded-md" role="alert">
     <p className="text-status-error text-sm">{errorMessage}</p>
    </div>
   )}

   {/* Submit Button */}
   <Button
    onClick={handleSubmit}
    loading={submitting}
    fullWidth
    borderRadius="md"
    className="py-3 text-white"
    type="button"
    aria-describedby={submitting ? "submit-status" : undefined}
   >
    {submitting ? <span id="submit-status">Processing...</span> : 'Submit'}
   </Button>
  </main>
 );
}

export default FeedbackForm;
