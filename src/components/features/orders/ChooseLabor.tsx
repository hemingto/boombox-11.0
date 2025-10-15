/**
 * @fileoverview Choose Labor component for moving partner selection with responsive design
 * @source boombox-10.0/src/app/components/getquote/chooselabor.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays available moving partners with sorting, pagination, and selection capabilities.
 * Handles labor selection, third-party options, and "Do It Yourself" plans.
 * Integrates with moving partner availability API and provides error handling.
 * 
 * API ROUTES UPDATED:
 * - Old: /api/moving-partners → New: /api/moving-partners/search (delegated to useMovingPartners hook via movingPartnerService)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with semantic design tokens
 * - Applied utility classes from globals.css
 * - Used design system spacing and typography patterns
 * 
 * @refactor Extracted business logic to custom hooks and utilities for clean architecture
 */

import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ArrowUpRightIcon } from '@heroicons/react/20/solid';
import { DoItYourselfCard, ThirdPartyLaborList, LaborRadioCard } from '@/components/forms';
import { useMovingPartners, useLaborSelection } from '@/hooks';
import { SORT_OPTIONS, getSortOptionLabel } from '@/lib/utils/sortingUtils';

interface ChooseLaborProps {
  goBackToStep1: () => void;
  onLaborSelect: (id: string, price: string, title: string, onfleetTeamId?: string) => void;
  onMovingPartnerSelect: (id: number | null) => void;
  laborError: string | null;
  clearLaborError: () => void;
  selectedLabor: { 
    id: string; 
    price: string; 
    title: string; 
    onfleetTeamId?: string 
  } | null;
  planType: string;
  cityName: string;
  selectedDateObject: Date | null;
  onPlanTypeChange: (planType: string) => void;
  onUnavailableLaborChange?: (hasError: boolean) => void;
  appointmentId?: string;
}

export function ChooseLabor({
  goBackToStep1,
  onLaborSelect,
  laborError,
  clearLaborError,
  selectedLabor,
  planType,
  cityName,
  selectedDateObject,
  onMovingPartnerSelect,
  onPlanTypeChange,
  onUnavailableLaborChange,
  appointmentId
}: ChooseLaborProps) {
  // Local UI state
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  // Moving partners hook
  const {
    movingPartners,
    currentItems,
    isLoading,
    error: movingPartnersError,
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    sortBy,
    setSortBy,
    nextPage,
    prevPage,
  } = useMovingPartners({
    selectedDate: selectedDateObject,
    appointmentId,
    itemsPerPage: 5,
  });

  // Labor selection hook
  const {
    selectedWeblink,
    unavailableLaborError,
    setSelectedWeblink,
  } = useLaborSelection({
    selectedLabor,
    planType,
    movingPartners,
    onUnavailableLaborChange,
  });

  // Handle weblink selection
  const handleWeblinkSelect = (weblink: string) => {
    setSelectedWeblink(weblink);
  };

  // Handle sort change
  const handleSortChange = (option: string) => {
    setSortBy(option as any);
    setIsSortDropdownOpen(false);
  };

  return (
    <div className="w-full basis-1/2">
      <div className="max-w-lg mx-auto md:mx-0 md:ml-auto">
        {/* Header */}
        <div className="flex items-center gap-2 mb-12 lg:-ml-10">
          <ChevronLeftIcon
            className="w-8 cursor-pointer text-text-primary hover:text-text-secondary"
            onClick={goBackToStep1}
          />
          <h1 className="text-4xl hidden sm:block text-text-primary">Select moving help</h1>
          <h1 className="text-4xl sm:hidden text-text-primary">Select movers</h1>
        </div>
        
        <p className="mb-3 text-text-secondary">Choose from our list of moving partners</p>    

        {/* Sort Dropdown - Only show if we have multiple partners */}
        {movingPartners.length > 2 && (
          <div className="mb-4">
            <div className="relative">
              <div
                className={`relative w-fit rounded-full p-2 cursor-pointer transition-colors ${
                  isSortDropdownOpen
                    ? "ring-2 ring-border-focus bg-surface-primary"
                    : "ring-1 ring-border bg-surface-tertiary hover:bg-surface-secondary"
                }`}
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                role="button"
                aria-expanded={isSortDropdownOpen}
                aria-haspopup="listbox"
                aria-label="Sort moving partners"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsSortDropdownOpen(!isSortDropdownOpen);
                  }
                }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs text-text-primary">
                    {getSortOptionLabel(sortBy)}
                  </span>
                  <svg
                    className="w-3 h-3 text-text-primary ml-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {isSortDropdownOpen && (
                <div className="absolute w-fit left-0 z-10 mt-2 border border-border rounded-md bg-surface-primary shadow-custom-shadow">
                  {SORT_OPTIONS.map((option) => (
                    <div
                      key={option.value}
                      className="flex justify-between items-center p-3 cursor-pointer hover:bg-surface-tertiary transition-colors"
                      onClick={() => handleSortChange(option.value)}
                    >
                      <span className="text-sm text-text-primary">
                        {option.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <>
            <div className="mb-4 w-full bg-surface-tertiary rounded-md max-w-lg h-36 skeleton animate-pulse"></div>
            <div className="mb-4 w-full bg-surface-tertiary rounded-md max-w-lg h-36 skeleton animate-pulse"></div>
          </>
        )}

        {/* Error Messages */}
        {unavailableLaborError && (
          <div 
            className="bg-status-bg-warning p-3 mb-4 border border-border-warning rounded-md max-w-fit"
            role="alert"
            aria-live="assertive"
          >
            <p className="text-sm text-status-warning">{unavailableLaborError}</p>
          </div>
        )}

        {laborError && (
          <div 
            className="bg-status-bg-error p-3 mb-4 border border-border-error rounded-md max-w-fit"
            role="alert"
            aria-live="assertive"
          >
            <p className="text-sm text-status-error">{laborError}</p>
          </div>
        )}

        {movingPartnersError && (
          <div 
            className="bg-status-bg-error p-3 mb-4 border border-border-error rounded-md max-w-fit"
            role="alert"
            aria-live="assertive"
          >
            <p className="text-sm text-status-error">{movingPartnersError}</p>
          </div>
        )}

        {/* No Partners Available */}
        {!isLoading && movingPartners.length === 0 ? (
          <>
            {!laborError && !selectedWeblink && (
              <div className="bg-status-bg-warning p-3 mb-4 border border-border-warning rounded-md max-w-fit">
                <p className="text-sm text-status-warning">
                  No Boombox moving partners match your selected date and location. Please choose from our list of recommended 3rd party loading help options or switch to the &quot;Do It Yourself&quot; Plan
                </p>
              </div>
            )}
            
            {selectedWeblink && selectedLabor?.title !== "Do It Yourself Plan" && (
              <div className="bg-status-bg-info p-3 mb-4 border border-border-info rounded-md max-w-fit">
                <p className="text-sm text-status-info">
                  To book third party loading help with <span className="font-semibold">{selectedLabor?.title}</span> please go to their website and book directly from the link below
                </p>
                <a
                  href={selectedWeblink || '#'}
                  rel="noopener noreferrer"
                  target="_blank"
                  className="block"
                >
                  <div className="flex rounded-full px-3 py-2 bg-primary mt-3 hover:bg-primary-hover active:bg-primary w-fit transition-colors">
                    <p className="text-sm text-text-inverse font-semibold font-inter">Book Here</p>
                    <ArrowUpRightIcon className="w-5 text-text-inverse ml-1" />
                  </div>
                </a>
              </div>
            )}

            <ThirdPartyLaborList
              selectedLabor={selectedLabor}
              onLaborSelect={onLaborSelect}
              onWeblinkSelect={handleWeblinkSelect}
              hasError={!!laborError}
              onClearError={clearLaborError}
              onPlanTypeChange={onPlanTypeChange} 
            />
            
            <DoItYourselfCard
              checked={selectedLabor?.id === 'Do It Yourself Plan'}
              onChange={(id, price, description) =>
                onLaborSelect(id, price, description)
              }
              hasError={!!laborError}
              onClearError={clearLaborError}
              onPlanTypeChange={onPlanTypeChange} 
            />
          </>
        ) : (
          /* Moving Partners List */
          currentItems.map((partner) => (
            <LaborRadioCard
              key={partner.id}
              id={partner.id.toString()}
              title={partner.name}
              description={partner.description}
              price={`$${partner.hourlyRate}/hr`}
              reviews={partner.numberOfReviews}
              rating={partner.rating}
              link={partner.gmbLink}
              imageSrc={partner.imageSrc}
              checked={selectedLabor?.id === partner.id.toString()}
              onChange={() => {
                onLaborSelect(
                  partner.id.toString(), 
                  partner.hourlyRate.toString(), 
                  partner.name,
                  partner.onfleetTeamId
                );
                onPlanTypeChange('Full Service Plan');
              }}
              hasError={!!laborError}
              onClearError={clearLaborError}
              featured={partner.featured}
            />
          ))
        )}

        {/* Pagination */}
        {movingPartners.length > 5 && (
          <div className="flex justify-center items-center mt-8 space-x-4">
            <button
              onClick={prevPage}
              disabled={!hasPrevPage}
              className="p-2 rounded-md text-text-secondary hover:bg-surface-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <span className="text-sm text-text-secondary">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={nextPage}
              disabled={!hasNextPage}
              className="p-2 rounded-md text-text-secondary hover:bg-surface-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChooseLabor;
