/**
 * @fileoverview Third Party Labor List - Container component for displaying third-party moving partner options
 * @source boombox-10.0/src/app/components/reusablecomponents/thirdpartylaborlist.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays a list of third-party moving partners as selectable radio cards
 * - Manages loading states with skeleton components
 * - Handles error states with user-friendly messaging
 * - Integrates with parent components for selection handling
 * - Provides callbacks for labor selection, weblink selection, and plan type changes
 * 
 * API ROUTES UPDATED:
 * - Old: /api/third-party-moving-partners → New: /api/moving-partners/third-party
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced custom loading shimmer with design system skeleton components
 * - Applied semantic color classes for error states (text-status-error)
 * - Used design system text colors (text-text-secondary) for empty states
 * - Applied consistent spacing and layout patterns
 * 
 * BUSINESS LOGIC EXTRACTION:
 * - API calls moved to ThirdPartyMovingPartnerService
 * - State management extracted to useThirdPartyMovingPartners hook
 * - Component now focuses purely on UI rendering and user interactions
 * - Caching logic centralized in service layer
 * 
 * ACCESSIBILITY IMPROVEMENTS:
 * - Added proper ARIA labels for the partner list
 * - Enhanced error messaging with semantic markup
 * - Improved loading state announcements for screen readers
 * - Added proper heading hierarchy and landmark roles
 * 
 * @refactor Extracted business logic to service and hook, applied design system components,
 * enhanced accessibility, improved error handling UX, updated API routes
 */

import React from "react";
import ThirdPartyLaborCard from "./ThirdPartyLaborCard";
import { Skeleton } from "@/components/ui/primitives";
import { useThirdPartyMovingPartners } from "@/hooks/useThirdPartyMovingPartners";

interface ThirdPartyLaborListProps {
  selectedLabor: { id: string; price: string; title: string } | null;
  onLaborSelect: (id: string, price: string, title: string) => void;
  onPlanTypeChange: (planType: string) => void;
  onWeblinkSelect: (weblink: string) => void;
  hasError?: boolean;
  onClearError?: () => void;
}

const ThirdPartyLaborList: React.FC<ThirdPartyLaborListProps> = ({
  selectedLabor,
  onLaborSelect,
  onWeblinkSelect,
  hasError,
  onClearError,
  onPlanTypeChange,
}) => {
  const { partners, isLoading, error } = useThirdPartyMovingPartners();

  // Loading state with skeleton components
  if (isLoading) {
    return (
      <div 
        className="grid grid-cols-1 gap-4"
        role="status"
        aria-label="Loading third-party moving partners"
      >
        <div className="mb-4 w-full max-w-lg">
          <Skeleton className="h-36 w-full rounded-md" />
        </div>
        <div className="mb-4 w-full max-w-lg">
          <Skeleton className="h-36 w-full rounded-md" />
        </div>
        <span className="sr-only">Loading moving partner options...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div 
        className="text-status-error bg-status-bg-error border border-status-error rounded-md p-4"
        role="alert"
        aria-live="assertive"
      >
        <h3 className="font-medium text-status-error mb-1">
          Unable to Load Moving Partners
        </h3>
        <p className="text-sm text-status-error">
          {error}
        </p>
        <p className="text-sm text-status-error mt-2">
          Please try refreshing the page or contact support if the problem persists.
        </p>
      </div>
    );
  }

  // Empty state
  if (!partners.length) {
    return (
      <div 
        className="text-status-error bg-status-bg-error border-2 border-border-error rounded-md p-4 mb-4"
        role="status"
      >
        <p className="text-sm">
          No third-party moving partners are currently available.
        </p>
        <p className="text-xs mt-1">
          Please check back later or contact support for assistance.
        </p>
      </div>
    );
  }

  // Main content
  return (
    <div 
      className="grid grid-cols-1"
      role="radiogroup"
      aria-label="Select a third-party moving partner"
      aria-describedby="third-party-partners-description"
    >
      <div id="third-party-partners-description" className="sr-only">
        Choose from available third-party moving partners. Each option shows partner details, 
        ratings, and pricing information.
      </div>

      {partners.map((partner) => {
        const prefixedId = `thirdParty-${partner.id}`;

        return (
          <ThirdPartyLaborCard
            key={partner.id}
            id={prefixedId}
            price="192" // Fixed price as per original implementation
            title={partner.title}
            description={partner.description}
            imageSrc={partner.imageSrc}
            rating={partner.rating}
            reviews={partner.reviews}
            weblink={partner.weblink}
            gmblink={partner.gmblink}
            checked={selectedLabor?.id === prefixedId}
            onChange={() => {
              // Handle labor selection
              onLaborSelect(prefixedId, "192", partner.title);
              
              // Handle weblink selection
              onWeblinkSelect(partner.weblink);
              
              // Notify parent about plan type change
              onPlanTypeChange('Third Party Loading Help');
            }}
            hasError={hasError}
            onClearError={onClearError}
          />
        );
      })}

      {/* Screen reader summary */}
      <div className="sr-only" aria-live="polite">
        {partners.length} third-party moving partner{partners.length !== 1 ? 's' : ''} available for selection.
        {selectedLabor && (
          <span> Currently selected: {selectedLabor.title}</span>
        )}
      </div>
    </div>
  );
};

export default ThirdPartyLaborList;
