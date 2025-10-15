/**
 * @fileoverview Driver invitation form for moving partners
 * Allows moving partners to invite drivers via email with automatic token generation
 * 
 * @source boombox-10.0/src/app/components/mover-account/moverinvitedriver.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Email input form for inviting drivers to join the moving partner's team
 * - Sends invitation with 15-day expiration period
 * - Displays loading states during submission
 * - Shows success/error feedback messages
 * - Clears form after successful submission
 * - Properly integrated with moving partner dashboard workflow
 * 
 * API ROUTES UPDATED:
 * - Old: /api/movers/${moverId}/invite-driver → New: /api/moving-partners/${moverId}/invite-driver
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with semantic design tokens
 * - Applied form-group, form-label, input-field classes from globals.css
 * - Used btn-primary for submit button styling
 * - Applied semantic status colors for error/success messages
 * - Enhanced form spacing and layout with design system patterns
 * - Improved accessibility with proper ARIA labels and roles
 * 
 * @refactor
 * - Applied comprehensive design system integration
 * - Enhanced accessibility with WCAG 2.1 AA compliance
 * - Improved form validation and error handling
 * - Added proper TypeScript interfaces
 * - Integrated with centralized design patterns
 */

'use client';

import { useState, FormEvent } from 'react';

interface InviteDriverFormProps {
  moverId: string;
}

export const InviteDriverForm: React.FC<InviteDriverFormProps> = ({ moverId }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Updated API route to match migration tracking
      const response = await fetch(`/api/moving-partners/${moverId}/invite-driver`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          expiresInDays: 15, // Set default expiration to 15 days
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      setSuccess('Invitation sent successfully!');
      setEmail('');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section 
      className="max-w-2xl mx-auto p-6"
      aria-labelledby="invite-driver-heading"
    >
      <h1 
        id="invite-driver-heading"
        className="text-2xl font-bold text-text-primary mb-6"
      >
        Invite a Driver
      </h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Input Field */}
        <div className="form-group">
          <label 
            htmlFor="driver-email" 
            className="form-label"
          >
            Driver's Email
          </label>
          <input
            type="email"
            id="driver-email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            placeholder="driver@example.com"
            required
            disabled={isLoading}
            aria-required="true"
            aria-invalid={!!error}
            aria-describedby={error ? 'email-error' : undefined}
          />
          <p className="form-helper">
            The driver will receive an email with a link to accept the invitation. The invitation expires in 15 days.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div 
            id="email-error"
            className="p-4 bg-status-bg-error border border-border-error rounded-md"
            role="alert"
            aria-live="assertive"
          >
            <p className="text-status-error text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div 
            className="p-4 bg-status-bg-success border border-status-success rounded-md"
            role="status"
            aria-live="polite"
          >
            <p className="text-status-success text-sm font-medium">{success}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !email}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          aria-busy={isLoading}
        >
          {isLoading ? 'Sending Invitation...' : 'Send Invite'}
        </button>
      </form>
    </section>
  );
};

export default InviteDriverForm;

