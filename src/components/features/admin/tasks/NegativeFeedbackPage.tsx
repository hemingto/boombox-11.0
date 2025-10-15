/**
 * @fileoverview Admin task page for responding to negative customer feedback
 * @source boombox-10.0/src/app/admin/tasks/[taskId]/negative-feedback/page.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays customer feedback with rating and comments
 * - Shows appointment details and service provider information
 * - Allows admin to compose and send email response to customer
 * - Supports both appointment and packing supply feedback types
 * 
 * API ROUTES USED:
 * - GET /api/admin/tasks/[taskId] - Fetch task and feedback data
 * - POST /api/admin/feedback/[id]/respond - Send email response
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses semantic color tokens (text-text-primary, bg-status-warning)
 * - Uses form-error class for validation messages
 * - Uses input-field class for form inputs
 * - Replaced hardcoded amber colors with status-warning variants
 * 
 * @refactor Extracted from inline page implementation into feature component
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { useTask } from '@/hooks';

interface NegativeFeedbackPageProps {
  taskId: string;
}

// Helper to format date in a friendly format
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

export function NegativeFeedbackPage({ taskId }: NegativeFeedbackPageProps) {
  const router = useRouter();
  const { task, isLoading } = useTask(taskId);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (task?.appointment) {
      const formattedDate = formatDate(task.appointment.date);
      setEmailSubject(`Boombox - ${task.appointment.appointmentType} Feedback (${formattedDate})`);
    }
  }, [task]);

  const handleSendResponse = async () => {
    if (!emailBody.trim()) {
      setShowError(true);
      return;
    }

    // Ensure task and task.feedback are available before trying to use task.feedback.id
    if (!task || !task.feedback) {
      console.error('Task or feedback data is missing.');
      setShowError(true);
      return;
    }

    setIsSending(true);
    try {
      // Determine feedback type based on task ID
      const isPackingSupplyFeedback = taskId.startsWith('packing-supply-feedback-');

      const response = await fetch(`/api/admin/feedback/${task.feedback.id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailSubject,
          emailBody,
          feedbackType: isPackingSupplyFeedback ? 'packing-supply' : 'appointment',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send response: ${response.status} ${errorText}`);
      }

      router.push('/admin/tasks');
    } catch (error) {
      console.error('Error sending response:', error);
      setShowError(true);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
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
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
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
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-text-primary hover:text-text-secondary transition-colors"
            aria-label="Go back"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-semibold text-text-primary">{task.title}</h1>
              <p className="text-text-primary mt-1 text-sm">{task.description}</p>
            </div>
          </div>
        </div>

        <div className="bg-surface-primary rounded-lg shadow-sm">
          <div className="p-6 space-y-6">
            {/* Customer Card */}
            <div className="bg-status-bg-warning rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative bg-white rounded-full h-12 w-12 overflow-hidden">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                      <span className="text-text-primary text-xl font-medium">
                        {(task.appointment?.user?.firstName || '?')[0]}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">
                      {task.appointment?.user?.firstName} {task.appointment?.user?.lastName}
                    </h4>
                    <p className="text-white/90 text-xs">customer</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mr-4">
                  <a
                    href={`mailto:${task.appointment?.user?.email}`}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    aria-label={`Email ${task.appointment?.user?.email}`}
                  >
                    <div className="bg-status-warning p-2 rounded-full">
                      <EnvelopeIcon className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-white text-sm">{task.appointment?.user?.email}</p>
                  </a>
                </div>
              </div>
            </div>

            {/* Job Details */}
            <div className="grid grid-cols-3 gap-6 border-b border-border pb-4">
              <div className="border-r border-border pr-6">
                <h3 className="font-medium text-text-primary font-semibold">Job Code</h3>
                <p className="mt-1 text-sm text-text-primary">
                  {task.jobCode || 'No job code available'}
                </p>
              </div>
              <div className="border-r border-border pr-6">
                <h3 className="font-medium text-text-primary font-semibold">Date</h3>
                <p className="mt-1 text-sm text-text-primary">
                  {task.appointment?.date ? formatDate(task.appointment.date) : 'No date available'}
                </p>
              </div>
              <div>
                <h3 className="font-medium text-text-primary font-semibold">
                  {taskId.startsWith('packing-supply-feedback-') ? 'Service Type' : 'Moving Partner'}
                </h3>
                <p className="mt-1 text-sm text-text-primary">
                  {taskId.startsWith('packing-supply-feedback-')
                    ? 'Packing Supply Delivery'
                    : task.movingPartner?.name ||
                      (task.driver
                        ? `${task.driver.firstName} ${task.driver.lastName}`
                        : 'Not assigned')}
                </p>
              </div>
            </div>

            {/* Feedback Details */}
            <div className="space-y-4 border-b border-border pb-6">
              <div>
                <h3 className="font-medium text-text-primary font-semibold">Rating</h3>
                <div className="mt-2 flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`h-5 w-5 ${
                        i < (task.feedback?.rating || 0)
                          ? 'text-status-warning'
                          : 'text-surface-disabled'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="sr-only">{task.feedback?.rating || 0} out of 5 stars</span>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-text-primary font-semibold">Feedback Comment</h3>
                <p className="mt-2 text-sm text-text-primary whitespace-pre-wrap">
                  &quot;{task.feedback?.comment || 'No comment provided'}&quot;
                </p>
              </div>
            </div>

            {/* Response Section */}
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-text-primary font-semibold">Send Response</h3>
                <div className="mt-4 space-y-4">
                  <div className="form-group">
                    <label htmlFor="subject" className="form-label">
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="body" className="form-label">
                      Response
                    </label>
                    <textarea
                      id="body"
                      rows={6}
                      value={emailBody}
                      placeholder="Write your response here..."
                      onChange={(e) => {
                        setEmailBody(e.target.value);
                        setShowError(false);
                      }}
                      className={`input-field ${showError ? 'input-field--error' : ''}`}
                      aria-invalid={showError}
                      aria-describedby={showError ? 'body-error' : undefined}
                    />
                    {showError && (
                      <p id="body-error" className="form-error">
                        Please enter a response message
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Send Response Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleSendResponse}
                  disabled={isSending}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Send response email to customer"
                >
                  {isSending ? 'Sending...' : 'Send Response'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

