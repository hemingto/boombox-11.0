/**
 * @fileoverview Custom hook for feedback form state management and business logic
 * @source boombox-10.0/src/app/components/feedback/feedbackform.tsx (extracted business logic)
 * @refactor Extracted form state, validation, API calls, and business logic into reusable hook
 */

import { useState, useCallback } from 'react';
import { calculateTip } from '@/lib/utils/currencyUtils';

export interface UseFeedbackFormOptions {
  appointmentId: string;
  drivers?: Array<{
    key: string;
    taskId: string;
    taskIds: string[];
    name: string;
    unitNumber: number;
    cloudinaryFile?: string;
    subtitle?: string;
  }>;
  invoiceTotal: number;
}

export interface SubmissionResponse {
  id: number;
  tipProcessingStatus?: string;
  tipProcessingError?: string;
  tipPaymentStatus?: string;
}

export interface UseFeedbackFormReturn {
  // Form state
  rating: number;
  setRating: (rating: number) => void;
  comment: string;
  setComment: (comment: string) => void;
  tipPercentage: number;
  setTipPercentage: (percentage: number) => void;
  customTip: string;
  setCustomTip: (tip: string) => void;
  isCustomTip: boolean;
  setIsCustomTip: (isCustom: boolean) => void;
  driverRatings: Record<string, 'thumbs_up' | 'thumbs_down' | null>;
  setDriverRatings: React.Dispatch<React.SetStateAction<Record<string, 'thumbs_up' | 'thumbs_down' | null>>>;
  
  // UI state
  ratingError: string | null;
  submitted: boolean;
  errorMessage: string | null;
  submitting: boolean;
  tipPaymentStatus: string | null;
  loading: boolean;
  
  // Actions
  handleSubmit: () => Promise<void>;
  checkExistingFeedback: () => Promise<void>;
}

/**
 * Custom hook for managing feedback form state and business logic
 */
export function useFeedbackForm({
  appointmentId,
  drivers = [],
  invoiceTotal
}: UseFeedbackFormOptions): UseFeedbackFormReturn {
  // Form state
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [tipPercentage, setTipPercentage] = useState<number>(15);
  const [customTip, setCustomTip] = useState<string>('');
  const [isCustomTip, setIsCustomTip] = useState<boolean>(false);
  const [driverRatings, setDriverRatings] = useState<Record<string, 'thumbs_up' | 'thumbs_down' | null>>({});

  // UI state
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [tipPaymentStatus, setTipPaymentStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * Check if feedback already exists for this appointment
   */
  const checkExistingFeedback = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/feedback/check?appointmentId=${appointmentId}`);
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
  }, [appointmentId]);

  /**
   * Validate form data before submission
   */
  const validateForm = useCallback((): boolean => {
    if (rating === 0) {
      setRatingError('Please provide a rating');
      return false;
    }
    setRatingError(null);
    return true;
  }, [rating]);

  /**
   * Calculate tip amount based on current selection
   */
  const calculateTipAmount = useCallback((): number => {
    if (isCustomTip) {
      return parseFloat(customTip || '0');
    }
    return calculateTip(invoiceTotal, tipPercentage);
  }, [isCustomTip, customTip, invoiceTotal, tipPercentage]);

  /**
   * Map driver ratings from UI keys to API taskIds
   */
  const mapDriverRatingsToTaskIds = useCallback((): Record<string, 'thumbs_up' | 'thumbs_down'> => {
    const taskIdRatings: Record<string, 'thumbs_up' | 'thumbs_down'> = {};
    
    if (drivers) {
      Object.entries(driverRatings).forEach(([driverKey, rating]) => {
        if (rating) {
          const driver = drivers.find(d => d.key === driverKey);
          if (driver) {
            // Apply the rating to all taskIds for this driver
            driver.taskIds.forEach(taskId => {
              taskIdRatings[taskId] = rating;
            });
          }
        }
      });
    }
    
    return taskIdRatings;
  }, [drivers, driverRatings]);

  /**
   * Handle feedback form submission
   */
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    console.log('FeedbackForm submitting with appointmentId:', appointmentId);

    try {
      const tipAmount = calculateTipAmount();
      const taskIdRatings = mapDriverRatingsToTaskIds();

      const payload = {
        appointmentId: parseInt(appointmentId, 10),
        rating,
        comment,
        tipAmount,
        driverRatings: taskIdRatings,
      };

      console.log('Submitting feedback with payload:', payload);

      const response = await fetch('/api/admin/feedback/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data: SubmissionResponse = await response.json();

      if (response.ok) {
        console.log('Feedback submitted successfully:', data);

        // Handle tip payment status
        if (payload.tipAmount > 0) {
          if (data.tipProcessingStatus === 'failed' || data.tipProcessingStatus === 'error') {
            setTipPaymentStatus('failed');
            setErrorMessage(`Your feedback was submitted, but the tip payment failed: ${data.tipProcessingError || 'Payment processing error'}`);
          } else if (data.tipPaymentStatus === 'succeeded') {
            setTipPaymentStatus('succeeded');
          } else if (data.tipPaymentStatus === 'processing') {
            setTipPaymentStatus('processing');
          }
        }

        setSubmitted(true);
      } else {
        console.error('Error response from server:', data);
        setErrorMessage(`Failed to submit feedback: ${data.tipProcessingError || 'Unknown error'}`);
        if (data.tipProcessingError) {
          console.error('Error details:', data.tipProcessingError);
        }
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setErrorMessage('An error occurred while submitting your feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [
    appointmentId,
    rating,
    comment,
    validateForm,
    calculateTipAmount,
    mapDriverRatingsToTaskIds
  ]);

  /**
   * Clear rating error when rating changes
   */
  const handleRatingChange = useCallback((newRating: number) => {
    setRating(newRating);
    setRatingError(null);
  }, []);

  return {
    // Form state
    rating,
    setRating: handleRatingChange,
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
  };
}
