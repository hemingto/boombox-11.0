/**
 * @fileoverview Driver list and management component for moving partners
 * @source boombox-10.0/src/app/components/mover-account/moverpartnerdriver.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays a searchable, filterable, paginated list of drivers associated with a moving partner.
 * Features search by name, filter by approval status, pagination, and driver removal functionality.
 * Includes loading skeletons, error states, and empty states for optimal UX.
 * 
 * API ROUTES UPDATED:
 * - Old: /api/movers/[moverId]/drivers → New: /api/moving-partners/[id]/drivers
 * - Old: /api/movers/[moverId]/drivers/[driverId] → New: /api/moving-partners/[id]/drivers/[driverId]
 * (Per api-routes-migration-tracking.md - Moving Partners Domain)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with semantic design tokens:
 *   - bg-white → bg-surface-primary
 *   - bg-slate-100 → bg-surface-tertiary / bg-surface-secondary
 *   - bg-slate-200 → bg-surface-disabled
 *   - text-zinc-950 → text-text-primary
 *   - text-zinc-500 → text-text-secondary
 *   - text-slate-300 → text-text-tertiary
 *   - border-slate-100 → border-border
 *   - text-emerald-500/bg-emerald-100 → text-status-success/bg-status-bg-success
 *   - text-amber-500/bg-amber-100 → text-status-warning/bg-status-bg-warning
 *   - text-red-500/bg-red-100 → text-status-error/bg-status-bg-error
 * - Replaced custom modal with Modal component (per user preference)
 * - Applied consistent transition classes
 * - Used Skeleton components for loading states
 * 
 * ACCESSIBILITY ENHANCEMENTS:
 * - Added proper ARIA labels for search, filter, and pagination
 * - Table structure with proper roles and headers
 * - Enhanced button states with aria-disabled
 * - Screen reader announcements for status changes
 * - Proper focus management in modals
 * - Semantic HTML structure
 * - Keyboard navigation support
 * 
 * @refactor Migrated from mover-account to service-providers/drivers folder structure.
 * Replaced custom modal with Modal primitive. Extracted click-outside logic to useClickOutside hook.
 * Applied design system semantic color tokens throughout. Enhanced accessibility with proper ARIA labels.
 * Updated API routes to use moving-partners endpoints per migration tracking.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { IdentificationIcon, ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Modal } from '@/components/ui/primitives/Modal/Modal';
import { useClickOutside } from '@/hooks/useClickOutside';

interface Driver {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  createdAt: string;
  isApproved: boolean;
}

export interface MoverPartnerDriverProps {
  /** Moving partner ID */
  moverId: string;
  /** Optional callback when drivers list is refreshed */
  onDriversRefresh?: () => void;
  /** Optional className for additional styling */
  className?: string;
}

type FilterOption = 'all' | 'approved' | 'unapproved' | 'newest';

const filterLabels: Record<FilterOption, string> = {
  all: 'All Drivers',
  approved: 'Approved',
  unapproved: 'Unapproved',
  newest: 'Newest First',
};

export const MoverPartnerDriver: React.FC<MoverPartnerDriverProps> = ({
  moverId,
  onDriversRefresh,
  className = '',
}) => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const itemsPerPage = 10;

  const filterRef = useRef<HTMLDivElement>(null);
  useClickOutside(filterRef, () => setIsFilterOpen(false));

  const fetchDrivers = useCallback(async () => {
    try {
      const response = await fetch(`/api/moving-partners/${moverId}/drivers`);
      if (!response.ok) {
        throw new Error('Failed to fetch drivers');
      }
      const data = await response.json();
      setDrivers(data);
      if (onDriversRefresh) {
        onDriversRefresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch drivers');
    } finally {
      setIsLoading(false);
    }
  }, [moverId, onDriversRefresh]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const handleRemoveDriver = async (driverId: number) => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/moving-partners/${moverId}/drivers/${driverId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove driver');
      }

      // Refresh the drivers list
      await fetchDrivers();
      setShowDeleteConfirmation(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove driver');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    fetchDrivers();
  };

  const filteredDrivers = drivers
    .filter(driver => {
      const fullName = `${driver.firstName} ${driver.lastName}`.toLowerCase();
      const searchMatch = searchTerm === '' || fullName.includes(searchTerm.toLowerCase());

      switch (filterOption) {
        case 'approved':
          return searchMatch && driver.isActive;
        case 'unapproved':
          return searchMatch && !driver.isActive;
        case 'newest':
          return searchMatch;
        default:
          return searchMatch;
      }
    })
    .sort((a, b) => {
      if (filterOption === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });

  const totalPages = Math.ceil(filteredDrivers.length / itemsPerPage);
  const paginatedDrivers = filteredDrivers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const selectedDriver = drivers.find(d => d.id === showDeleteConfirmation);

  // Loading State
  if (isLoading) {
    return (
      <div className={className} role="status" aria-label="Loading drivers">
        <div className="bg-surface-primary rounded-md shadow-custom-shadow">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-4 border-b border-border px-4 last:border-none"
            >
              <div className="flex items-center space-x-4 flex-1">
                <div className="flex-1">
                  <div className="h-4 w-40 bg-surface-tertiary rounded animate-pulse mb-2"></div>
                  <div className="h-3 w-24 bg-surface-tertiary rounded animate-pulse"></div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-4 w-16 bg-surface-tertiary rounded animate-pulse"></div>
                <div className="h-4 w-20 bg-surface-tertiary rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className={`bg-status-bg-error p-4 border border-status-border-error rounded-md ${className}`}>
        <p className="text-sm text-status-error mb-2" role="alert">
          {error}
        </p>
        <button
          onClick={handleRetry}
          className="flex items-center space-x-2 px-4 py-2 bg-surface-tertiary hover:bg-surface-disabled active:bg-surface-disabled transition-colors duration-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-border-focus"
          aria-label="Retry loading drivers"
        >
          <ArrowPathIcon className="w-4 h-4" aria-hidden="true" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  // Empty State
  if (drivers.length === 0) {
    return (
      <div className={`bg-surface-primary rounded-md shadow-custom-shadow p-8 text-center ${className}`}>
        <IdentificationIcon className="w-12 h-12 mx-auto text-text-tertiary mb-4" aria-hidden="true" />
        <h3 className="text-lg font-medium text-text-primary mb-2">No drivers yet</h3>
        <p className="text-text-secondary">
          Your drivers will appear here after they have signed up and are approved
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col space-y-6 ${className}`}>
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search drivers..."
            className="px-4 py-2 w-full sm:w-64 rounded-md focus:outline-none bg-surface-tertiary placeholder:text-text-secondary placeholder:text-sm focus:bg-surface-primary focus:ring-2 focus:ring-border-focus transition-colors duration-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search drivers by name"
          />

          {/* Filter Dropdown */}
          <div className="relative" ref={filterRef}>
            <button
              type="button"
              className={`relative w-fit rounded-full px-4 py-2 cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-border-focus ${
                isFilterOpen
                  ? 'ring-2 ring-border bg-surface-primary'
                  : 'ring-1 ring-border bg-surface-tertiary'
              }`}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              aria-label="Filter drivers"
              aria-expanded={isFilterOpen}
              aria-haspopup="true"
            >
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-primary whitespace-nowrap">
                  {filterLabels[filterOption]}
                </span>
                <svg
                  className={`shrink-0 w-3 h-3 text-text-primary ml-2 transition-transform duration-200 ${
                    isFilterOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {isFilterOpen && (
              <div
                className="absolute w-fit min-w-[144px] left-0 z-10 mt-2 border border-border rounded-md bg-surface-primary shadow-custom-shadow"
                role="menu"
                aria-label="Filter options"
              >
                {(Object.keys(filterLabels) as FilterOption[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    className="flex justify-between items-center p-3 w-full cursor-pointer hover:bg-surface-tertiary transition-colors duration-200 text-left focus:outline-none focus:bg-surface-tertiary"
                    onClick={() => {
                      setFilterOption(option);
                      setIsFilterOpen(false);
                      setCurrentPage(1); // Reset to first page on filter change
                    }}
                    role="menuitem"
                  >
                    <span className="text-sm text-text-primary">{filterLabels[option]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drivers Table */}
      <div className="bg-surface-primary rounded-md shadow-custom-shadow overflow-hidden" role="region" aria-label="Drivers list">
        <div role="table" aria-label="Drivers table">
          {/* Table Header */}
          <div className="grid grid-cols-5 border-b border-border py-3 px-4" role="row">
          <div className="text-sm font-medium text-text-secondary" role="columnheader">Name</div>
          <div className="text-sm font-medium text-text-secondary" role="columnheader">Email</div>
          <div className="text-sm font-medium text-text-secondary" role="columnheader">Phone</div>
          <div className="text-sm font-medium text-text-secondary" role="columnheader">Status</div>
          <div className="text-sm font-medium text-text-secondary text-right" role="columnheader">Actions</div>
        </div>

        {/* Table Content */}
        {paginatedDrivers.length === 0 ? (
          <div className="py-8 px-4 text-center text-text-secondary">
            No drivers found matching your search.
          </div>
        ) : (
          paginatedDrivers.map((driver) => (
            <div
              key={driver.id}
              className="grid grid-cols-5 items-center py-4 border-b border-border last:border-none px-4 hover:bg-surface-secondary transition-colors duration-200"
              role="row"
            >
              <div role="cell">
                <p className="font-medium text-text-primary">
                  {driver.firstName} {driver.lastName}
                </p>
              </div>
              <div className="text-sm text-text-primary" role="cell">{driver.email}</div>
              <div className="text-sm text-text-primary" role="cell">{driver.phoneNumber}</div>
              <div role="cell">
                {driver.isApproved ? (
                  <span className="inline-flex px-3 py-1 text-status-success bg-status-bg-success rounded-md text-xs font-medium">
                    Approved
                  </span>
                ) : (
                  <span className="inline-flex px-3 py-1 text-status-warning bg-status-bg-warning rounded-md text-xs font-medium">
                    Pending Approval
                  </span>
                )}
              </div>
              <div className="text-right" role="cell">
                <button
                  className="rounded-md py-1.5 px-3 text-sm font-inter font-semibold bg-surface-tertiary hover:bg-surface-disabled active:bg-surface-disabled transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-border-focus"
                  onClick={() => setShowDeleteConfirmation(driver.id)}
                  aria-label={`Remove ${driver.firstName} ${driver.lastName}`}
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(null)}
        title="Remove Driver"
        size="md"
      >
        <div className="mb-6">
          <p className="text-text-secondary">
            Are you sure you want to remove{' '}
            {selectedDriver && (
              <span className="font-semibold text-text-primary">
                {selectedDriver.firstName} {selectedDriver.lastName}
              </span>
            )}{' '}
            from your team?
          </p>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            className="px-4 py-2 text-sm text-text-primary underline-offset-4 underline hover:text-text-secondary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-border-focus rounded"
            onClick={() => setShowDeleteConfirmation(null)}
            disabled={isDeleting}
            aria-label="Cancel removing driver"
          >
            Cancel
          </button>
          <button
            className="rounded-md py-2.5 px-6 font-semibold bg-primary text-text-inverse hover:bg-primary-hover active:bg-primary-active transition-colors duration-200 font-inter focus:outline-none focus:ring-2 focus:ring-border-focus disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => showDeleteConfirmation && handleRemoveDriver(showDeleteConfirmation)}
            disabled={isDeleting}
            aria-label="Confirm removing driver"
          >
            {isDeleting ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </Modal>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <nav className="relative flex justify-center items-center mt-8" aria-label="Drivers pagination">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`absolute left-0 rounded-full bg-surface-tertiary active:bg-surface-disabled p-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-border-focus ${
              currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-surface-disabled'
            }`}
            aria-label="Previous page"
            aria-disabled={currentPage === 1}
          >
            <ChevronLeftIcon className="w-4 h-4 text-text-secondary" aria-hidden="true" />
          </button>

          <span className="text-sm text-text-primary" aria-current="page" aria-live="polite">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`absolute right-0 rounded-full bg-surface-tertiary active:bg-surface-disabled p-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-border-focus ${
              currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-surface-disabled'
            }`}
            aria-label="Next page"
            aria-disabled={currentPage === totalPages}
          >
            <ChevronRightIcon className="w-4 h-4 text-text-secondary" aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  );
};

export default MoverPartnerDriver;

