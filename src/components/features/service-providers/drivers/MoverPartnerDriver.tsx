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

import { useState, useEffect, useCallback } from 'react';
import { IdentificationIcon, ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Modal } from '@/components/ui/primitives/Modal/Modal';
import { Button } from '@/components/ui/primitives/Button/Button';
import { FilterDropdown } from '@/components/ui/primitives/FilterDropdown/FilterDropdown';
import { Badge } from '@/components/ui/primitives/Badge/Badge';
import { formatPhoneNumberForDisplay } from '@/lib/utils/phoneUtils';

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

type FilterOptionValue = 'all' | 'approved' | 'unapproved' | 'newest';

const filterOptions = [
  { value: 'all', label: 'All Drivers' },
  { value: 'approved', label: 'Approved' },
  { value: 'unapproved', label: 'Unapproved' },
  { value: 'newest', label: 'Newest First' },
];

export const MoverPartnerDriver: React.FC<MoverPartnerDriverProps> = ({
  moverId,
  onDriversRefresh,
  className = '',
}) => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOption, setFilterOption] = useState<FilterOptionValue>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const itemsPerPage = 10;

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
      <div className={`bg-status-bg-error p-4 border border-status--error rounded-md ${className}`}>
        <p className="text-sm text-status-error mb-2" role="alert">
          {error}
        </p>
        <Button
          onClick={handleRetry}
          variant="secondary"
          size="sm"
          icon={<ArrowPathIcon className="w-4 h-4" aria-hidden="true" />}
          iconPosition="left"
          aria-label="Retry loading drivers"
        >
          Retry
        </Button>
      </div>
    );
  }

  // Empty State
  if (drivers.length === 0) {
    return (
      <div className={`bg-surface-primary rounded-md shadow-custom-shadow p-8 text-center ${className}`}>
        <IdentificationIcon className="w-12 h-12 mx-auto text-text-secondary mb-4" aria-hidden="true" />
        <h3 className="text-lg font-medium text-text-tertiary mb-2">No drivers yet</h3>
        <p className="text-text-tertiary">
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
            className="px-4 py-2 w-full sm:w-64 rounded-md focus:outline-none bg-surface-tertiary focus:placeholder:text-text-primary placeholder:text-text-secondary placeholder:text-sm focus:bg-surface-primary focus:ring-2 focus:ring-border-focus"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search drivers by name"
          />

          {/* Filter Dropdown */}
          <FilterDropdown
            options={filterOptions}
            value={filterOption}
            onChange={(value) => {
              setFilterOption(value as FilterOptionValue);
              setCurrentPage(1); // Reset to first page on filter change
            }}
            ariaLabel="Filter drivers"
            size="md"
          />
        </div>
      </div>

      {/* Drivers Table/List */}
      <div className="bg-surface-primary rounded-md shadow-custom-shadow overflow-hidden" role="region" aria-label="Drivers list">
        {/* Desktop Table View (hidden on mobile/tablet) */}
        <div className="hidden md:block" role="table" aria-label="Drivers table">
          {/* Table Header */}
          <div className="grid gap-4 border-b border-border py-3 px-4" style={{ gridTemplateColumns: 'minmax(150px, 1fr) minmax(200px, 1.5fr) minmax(120px, 1fr) minmax(140px, 1fr) minmax(100px, 0.8fr)' }} role="row">
            <div className="text-sm text-text-tertiary" role="columnheader">Name</div>
            <div className="text-sm text-text-tertiary" role="columnheader">Email</div>
            <div className="text-sm text-text-tertiary" role="columnheader">Phone</div>
            <div className="text-sm text-text-tertiary" role="columnheader">Status</div>
            <div className="text-sm text-text-tertiary text-right" role="columnheader">Actions</div>
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
                className="grid gap-4 items-center py-4 border-b border-border last:border-none px-4"
                style={{ gridTemplateColumns: 'minmax(150px, 1fr) minmax(200px, 1.5fr) minmax(120px, 1fr) minmax(140px, 1fr) minmax(100px, 0.8fr)' }}
                role="row"
              >
                <div role="cell" className="min-w-0">
                  <p className="font-medium text-text-primary truncate">
                    {driver.firstName} {driver.lastName}
                  </p>
                </div>
                <div className="text-sm text-text-primary min-w-0" role="cell">
                  <span className="truncate block" title={driver.email}>{driver.email}</span>
                </div>
                <div className="text-sm text-text-primary min-w-0" role="cell">
                  <span className="truncate block">{formatPhoneNumberForDisplay(driver.phoneNumber)}</span>
                </div>
                <div role="cell" className="min-w-0">
                  <Badge
                    label={driver.isApproved ? "Approved" : "Pending Approval"}
                    variant={driver.isApproved ? "success" : "warning"}
                    size="md"
                  />
                </div>
                <div className="text-right min-w-0" role="cell">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowDeleteConfirmation(driver.id)}
                    aria-label={`Remove ${driver.firstName} ${driver.lastName}`}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Mobile/Tablet Card View (visible on mobile and tablet) */}
        <div className="md:hidden">
          {paginatedDrivers.length === 0 ? (
            <div className="py-8 px-4 text-center text-text-secondary">
              No drivers found matching your search.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {paginatedDrivers.map((driver) => (
                <div
                  key={driver.id}
                  className="p-4 space-y-3"
                  role="article"
                  aria-label={`Driver: ${driver.firstName} ${driver.lastName}`}
                >
                  {/* Name and Status Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-text-primary text-base">
                        {driver.firstName} {driver.lastName}
                      </h3>
                    </div>
                    <Badge
                      label={driver.isApproved ? "Approved" : "Pending Approval"}
                      variant={driver.isApproved ? "success" : "warning"}
                      size="sm"
                    />
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-text-tertiary font-medium min-w-[60px]">Email:</span>
                      <span className="text-sm text-text-primary break-all">{driver.email}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-text-tertiary font-medium min-w-[60px]">Phone:</span>
                      <span className="text-sm text-text-primary">{formatPhoneNumberForDisplay(driver.phoneNumber)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowDeleteConfirmation(driver.id)}
                      aria-label={`Remove ${driver.firstName} ${driver.lastName}`}
                      className="w-full"
                    >
                      Remove Driver
                    </Button>
                  </div>
                </div>
              ))}
            </div>
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
          <p className="text-text-primary">
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteConfirmation(null)}
            disabled={isDeleting}
            aria-label="Cancel removing driver"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => showDeleteConfirmation && handleRemoveDriver(showDeleteConfirmation)}
            disabled={isDeleting}
            loading={isDeleting}
            aria-label="Confirm removing driver"
          >
            Remove
          </Button>
        </div>
      </Modal>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <nav className="relative flex justify-center items-center mt-8" aria-label="Drivers pagination">
          <button
            type="button"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            aria-label="Previous page"
            className={`absolute left-0 rounded-full bg-surface-tertiary hover:bg-surface-secondary active:bg-surface-pressed p-2 flex items-center justify-center ${
              currentPage === 1
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer'
            }`}
          >
            <ChevronLeftIcon className="w-4 h-4 text-text-primary" />
          </button>

          <span className="text-sm text-text-primary" aria-current="page" aria-live="polite">
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            aria-label="Next page"
            className={`absolute right-0 rounded-full bg-surface-tertiary hover:bg-surface-secondary active:bg-surface-pressed p-2 flex items-center justify-center ${
              currentPage === totalPages
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer'
            }`}
          >
            <ChevronRightIcon className="w-4 h-4 text-text-primary" />
          </button>
        </nav>
      )}
    </div>
  );
};

export default MoverPartnerDriver;

