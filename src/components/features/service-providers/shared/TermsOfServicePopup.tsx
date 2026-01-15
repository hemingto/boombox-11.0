/**
 * @fileoverview Terms of service popup modal for service providers
 * @source boombox-10.0/src/app/components/mover-account/termsofservicepopup.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Modal that displays Terms of Service with scroll-to-bottom verification.
 * Users must scroll to the bottom before they can agree to terms.
 * Calls API to record agreement timestamp in database.
 * 
 * API ROUTES UPDATED:
 * - Old: /api/drivers/[driverId]/agree-to-terms → New: /api/drivers/[id]/agree-to-terms
 * - Old: /api/movers/[moverId]/agree-to-terms → New: /api/moving-partners/[id]/agree-to-terms
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses Modal primitive component instead of custom modal
 * - Replaced hardcoded zinc-950 with primary semantic token
 * - Applied bg-primary and hover:bg-primary-hover for buttons
 * - Uses text-text-secondary for helper text
 * - Applied bg-surface-disabled for disabled button state
 * 
 * @refactor Migrated to use Modal primitive and design system tokens
 */

'use client';

import { useState, useRef } from 'react';
import { Modal } from '@/components/ui/primitives/Modal/Modal';
import { Button } from '@/components/ui/primitives/Button/Button';

interface TermsOfServicePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onAgree: () => void;
  userId: string;
  userType: 'driver' | 'mover';
}

export const TermsOfServicePopup = ({
  isOpen,
  onClose,
  onAgree,
  userId,
  userType,
}: TermsOfServicePopupProps) => {
  const [canAgree, setCanAgree] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      const isAtBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight;
      setCanAgree(isAtBottom);
    }
  };

  const handleAgree = async () => {
    if (isLoading) return; // Prevent double submission
    
    setIsLoading(true);
    try {
      // Update API route based on user type
      const apiPath = userType === 'driver' 
        ? `/api/drivers/${userId}/agree-to-terms`
        : `/api/moving-partners/${userId}/agree-to-terms`;

      const response = await fetch(apiPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to update terms agreement');
      }

      onAgree();
    } catch (error) {
      console.error('Error updating terms agreement:', error);
      // TODO: Show error notification to user
      setIsLoading(false); // Reset loading state on error
    }
    // Note: We don't reset loading on success because the parent component will close the modal
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="lg"
      closeOnOverlayClick={false}
      className="bg-surface-primary rounded-xl overflow-hidden"
    >
      <div className="flex flex-col h-[80vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border flex-shrink-0">
          <h2 className="text-xl font-semibold text-text-primary">
            Terms of Service
          </h2>
        </div>

        {/* Scrollable Content - only this section scrolls */}
        <div
          ref={contentRef}
          onScroll={handleScroll}
          className="p-6 overflow-y-auto flex-1 min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          <div className="space-y-4 text-text-primary">
            <h3 className="font-semibold">1. Introduction</h3>
            <p>
              Welcome to our platform. These Terms of Service govern your use of
              our services.
            </p>

            <h3 className="font-semibold">2. User Responsibilities</h3>
            <p>As a {userType === 'driver' ? 'driver' : 'moving partner'} on our platform, you agree to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Maintain valid driver&apos;s license and insurance</li>
              <li>Keep your vehicle in good condition</li>
              <li>Provide accurate information</li>
              <li>Maintain professional conduct</li>
            </ul>

            {/* Additional terms sections to make content scrollable */}
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index}>
                <h3 className="font-semibold">{index + 3}. Additional Terms</h3>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                  eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                  enim ad minim veniam, quis nostrud exercitation ullamco laboris
                  nisi ut aliquip ex ea commodo consequat.
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer with Agree Button - always visible */}
        <div className="p-6 border-t border-border flex-shrink-0">
          <Button
            onClick={handleAgree}
            disabled={!canAgree}
            loading={isLoading}
            variant="primary"
            fullWidth
            aria-label="Agree to terms of service"
          >
            {isLoading ? 'Saving Response...' : 'I Agree'}
          </Button>
          {/* Grid container for smooth height transition */}
          <div 
            className={`grid transition-[grid-template-rows] duration-300 ease-out ${
              canAgree || isLoading ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'
            }`}
          >
            <div className="overflow-hidden">
              <p className="text-sm text-text-primary text-center mt-2">
                Please scroll to the bottom to accept the terms
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
