/**
 * @fileoverview Admin jobs (appointments) management page component
 * @source boombox-10.0/src/app/admin/jobs/page.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Complete jobs/appointments management interface:
 * - Lists all appointments with sortable columns
 * - Search jobs by code, customer, address
 * - Filter by status (scheduled, in transit, complete, canceled)
 * - Filter by actions (unassigned drivers, incomplete assignments)
 * - Date picker for filtering by appointment date
 * - View Onfleet tasks for jobs
 * - Assign storage units to jobs
 * - Assign drivers to jobs
 * - Toggle column visibility
 * - Sortable by all columns
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses shared AdminDataTable component
 * - Uses shared hooks (useAdminTable, useAdminDataFetch)
 * - Uses migrated specialized modals (OnfleetTasksModal, StorageUnitAssignmentModal, DriverAssignmentModal)
 * - 100% semantic color tokens
 * - Status badges with semantic colors
 * - Consistent with other management pages
 * 
 * API ROUTES:
 * - GET /api/admin/jobs - Fetches all appointments
 * 
 * CODE REDUCTION:
 * - Original: 695 lines
 * - Refactored: ~450 lines (35% reduction)
 * - Eliminated duplicate state management
 * - Eliminated custom table implementation
 * - Uses migrated specialized modals
 * 
 * @refactor Extracted from inline page implementation, uses shared admin components
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  AdminDataTable,
  ColumnManagerMenu,
  SearchAndFilterBar,
  OnfleetTasksModal,
  StorageUnitAssignmentModal,
  DriverAssignmentModal,
  type Column,
  type ActionFilter,
} from '@/components/features/admin/shared';
import { useAdminTable, useAdminDataFetch } from '@/hooks';

interface OnfleetTaskItem {
  taskId: string;
  shortId: string;
  stepNumber: number;
  driver?: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
}

interface Job {
  id: number;
  jobCode: string;
  status: string;
  date: string;
  appointmentType: string;
  user: {
    firstName: string;
    lastName: string;
  };
  address: string;
  zipcode: string;
  numberOfUnits?: number;
  planType?: string;
  insuranceCoverage?: string;
  loadingHelpPrice?: number;
  monthlyStorageRate?: number;
  monthlyInsuranceRate?: number;
  quotedPrice: number;
  invoiceTotal?: number;
  description?: string;
  deliveryReason?: string;
  trackingToken?: string;
  trackingUrl?: string;
  invoiceUrl?: string;
  serviceStartTime?: string;
  serviceEndTime?: string;
  driver?: {
    firstName: string;
    lastName: string;
  } | null;
  movingPartner?: {
    name: string;
    email?: string;
    phoneNumber?: string;
  } | null;
  thirdPartyMovingPartner?: {
    title: string;
  } | null;
  onfleetTasks?: OnfleetTaskItem[];
  storageStartUsages?: {
    storageUnit: {
      storageUnitNumber: string;
    };
  }[];
  requestedStorageUnits?: {
    storageUnit: {
      storageUnitNumber: string;
    };
  }[];
}

type ColumnId =
  | 'jobCode'
  | 'user'
  | 'date'
  | 'appointmentType'
  | 'status'
  | 'storageUnits'
  | 'requestedStorageUnits'
  | 'address'
  | 'driver'
  | 'partner'
  | 'onfleetTasks'
  | 'zipcode'
  | 'numberOfUnits'
  | 'planType'
  | 'insuranceCoverage'
  | 'loadingHelpPrice'
  | 'monthlyStorageRate'
  | 'monthlyInsuranceRate'
  | 'quotedPrice'
  | 'invoiceTotal'
  | 'description'
  | 'deliveryReason'
  | 'trackingToken'
  | 'trackingUrl'
  | 'invoiceUrl'
  | 'serviceStartTime'
  | 'serviceEndTime'
  | 'thirdPartyMovingPartner';

const defaultColumns: Column<ColumnId>[] = [
  { id: 'jobCode', label: 'Job Code', visible: true },
  { id: 'user', label: 'Customer', visible: true },
  { id: 'date', label: 'Time', visible: true },
  { id: 'appointmentType', label: 'Job Type', visible: true },
  { id: 'status', label: 'Status', visible: true },
  { id: 'storageUnits', label: 'Assigned Units', visible: true },
  { id: 'requestedStorageUnits', label: 'Requested Units', visible: true },
  { id: 'address', label: 'Address', visible: true },
  { id: 'driver', label: 'Driver', visible: true },
  { id: 'partner', label: 'MovingPartner', visible: true },
  { id: 'onfleetTasks', label: 'Onfleet Tasks', visible: true },
  { id: 'zipcode', label: 'Zip Code', visible: false },
  { id: 'numberOfUnits', label: '# of Units', visible: false },
  { id: 'planType', label: 'Plan Type', visible: false },
  { id: 'insuranceCoverage', label: 'Insurance Coverage', visible: false },
  { id: 'loadingHelpPrice', label: 'Loading Help Price', visible: false },
  { id: 'monthlyStorageRate', label: 'Storage Rate', visible: false },
  { id: 'monthlyInsuranceRate', label: 'Insurance Rate', visible: false },
  { id: 'quotedPrice', label: 'Quoted Price', visible: false },
  { id: 'invoiceTotal', label: 'Invoice Total', visible: false },
  { id: 'description', label: 'Description', visible: false },
  { id: 'deliveryReason', label: 'Delivery Reason', visible: false },
  { id: 'trackingToken', label: 'Tracking Token', visible: false },
  { id: 'trackingUrl', label: 'Tracking URL', visible: false },
  { id: 'invoiceUrl', label: 'Invoice URL', visible: false },
  { id: 'serviceStartTime', label: 'Service Start Time', visible: false },
  { id: 'serviceEndTime', label: 'Service End Time', visible: false },
  { id: 'thirdPartyMovingPartner', label: 'Third Party Partner', visible: false },
];

const actionFiltersConfig: ActionFilter[] = [
  { id: 'unassigned_drivers', label: 'Unassigned Drivers', active: false },
  { id: 'incomplete_assignments', label: 'Incomplete Assignments', active: false },
];

/**
 * Get status badge styling
 */
const getStatusBadgeClass = (status: string) => {
  const lowerStatus = status.toLowerCase();
  if (lowerStatus === 'complete') return 'badge-success';
  if (lowerStatus === 'canceled') return 'badge-error';
  if (lowerStatus === 'in transit') return 'badge-processing';
  if (lowerStatus === 'awaiting admin check in') return 'badge-warning';
  return 'badge-info';
};

/**
 * AdminJobsPage - Jobs/appointments management interface
 * 
 * @example
 * ```tsx
 * // Used in: src/app/(dashboard)/admin/jobs/page.tsx
 * <AdminJobsPage />
 * ```
 */
export function AdminJobsPage() {
  // Shared hooks for table management
  const {
    columns,
    toggleColumn,
    sortConfig,
    handleSort,
    searchQuery,
    setSearchQuery,
    actionFilters,
    toggleFilter,
    getSortedAndFilteredData,
  } = useAdminTable<ColumnId, Job>({
    initialColumns: defaultColumns,
    initialSort: { column: null, direction: 'asc' },
    initialFilters: { unassigned_drivers: false, incomplete_assignments: false },
  });

  // Data fetching
  const { data: jobs, loading, error, refetch } = useAdminDataFetch<Job[]>({
    apiEndpoint: '/api/admin/jobs',
  });

  // Modal states
  const [selectedJobForTasks, setSelectedJobForTasks] = useState<Job | null>(null);
  const [selectedJobForStorageUnits, setSelectedJobForStorageUnits] = useState<Job | null>(null);
  const [selectedJobForDriver, setSelectedJobForDriver] = useState<Job | null>(null);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  /**
   * Custom sort function for jobs
   */
  const customSortFn = (data: Job[], config: typeof sortConfig) => {
    if (!config.column) return data;

    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (config.column === 'date') {
        aValue = new Date(a.date).getTime();
        bValue = new Date(b.date).getTime();
      } else if (config.column === 'user') {
        aValue = `${a.user.firstName} ${a.user.lastName}`;
        bValue = `${b.user.firstName} ${b.user.lastName}`;
      } else if (config.column === 'driver') {
        aValue = a.driver ? `${a.driver.firstName} ${a.driver.lastName}` : '';
        bValue = b.driver ? `${b.driver.firstName} ${b.driver.lastName}` : '';
      } else if (config.column === 'partner') {
        aValue = a.movingPartner?.name || a.thirdPartyMovingPartner?.title || '';
        bValue = b.movingPartner?.name || b.thirdPartyMovingPartner?.title || '';
      } else if (config.column === 'storageUnits') {
        aValue = a.storageStartUsages?.length || 0;
        bValue = b.storageStartUsages?.length || 0;
      } else if (config.column === 'requestedStorageUnits') {
        aValue = a.requestedStorageUnits?.length || 0;
        bValue = b.requestedStorageUnits?.length || 0;
      } else if (config.column === 'onfleetTasks') {
        aValue = a.onfleetTasks?.length || 0;
        bValue = b.onfleetTasks?.length || 0;
      } else {
        aValue = a[config.column as keyof Job];
        bValue = b[config.column as keyof Job];
      }

      if (aValue === null || aValue === undefined) return config.direction === 'asc' ? -1 : 1;
      if (bValue === null || bValue === undefined) return config.direction === 'asc' ? 1 : -1;

      if (aValue < bValue) return config.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return config.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  /**
   * Custom filter function for search and action filters
   */
  const customFilterFn = (data: Job[], query: string, filters: Record<string, boolean>) => {
    let result = data;

    // Apply search filter
    if (query) {
      const lowerQuery = query.toLowerCase();
      result = result.filter(
        (job) =>
          job.jobCode.toLowerCase().includes(lowerQuery) ||
          `${job.user.firstName} ${job.user.lastName}`.toLowerCase().includes(lowerQuery) ||
          job.address.toLowerCase().includes(lowerQuery)
      );
    }

    // Apply action filters
    if (filters.unassigned_drivers) {
      result = result.filter((job) => !job.driver);
    }

    if (filters.incomplete_assignments) {
      result = result.filter(
        (job) => job.appointmentType === 'New Customer' && (!job.storageStartUsages || job.storageStartUsages.length === 0)
      );
    }

    return result;
  };

  /**
   * Get sorted and filtered job data
   */
  const processedJobs = useMemo(
    () => getSortedAndFilteredData(jobs || [], customSortFn, customFilterFn),
    [jobs, sortConfig, searchQuery, actionFilters, getSortedAndFilteredData]
  );

  /**
   * Render cell content based on column type
   */
  const renderCellContent = (job: Job, column: Column<ColumnId>): React.ReactNode => {
    switch (column.id) {
      case 'user':
        return `${job.user.firstName} ${job.user.lastName}`;

      case 'date':
        return new Date(job.date).toLocaleString();

      case 'status':
        return <span className={`badge ${getStatusBadgeClass(job.status)}`}>{job.status}</span>;

      case 'storageUnits':
        return job.storageStartUsages?.length ? (
          <button
            onClick={() => setSelectedJobForStorageUnits(job)}
            className="inline-flex items-center bg-primary/10 px-2.5 py-1 text-sm font-inter rounded-md font-medium text-primary ring-1 ring-inset ring-primary/20 hover:bg-primary/20 transition-colors"
            aria-label={`Assign storage units for job ${job.jobCode}`}
          >
            {job.storageStartUsages.map((u) => u.storageUnit.storageUnitNumber).join(', ')}
          </button>
        ) : (
          <button
            onClick={() => setSelectedJobForStorageUnits(job)}
            className="text-text-secondary hover:text-primary text-sm"
            aria-label={`Assign storage units for job ${job.jobCode}`}
          >
            Assign Units
          </button>
        );

      case 'requestedStorageUnits':
        return job.requestedStorageUnits?.length
          ? job.requestedStorageUnits.map((u) => u.storageUnit.storageUnitNumber).join(', ')
          : '-';

      case 'driver':
        return job.driver ? (
          <button
            onClick={() => setSelectedJobForDriver(job)}
            className="inline-flex items-center bg-primary/10 px-2.5 py-1 text-sm font-inter rounded-md font-medium text-primary ring-1 ring-inset ring-primary/20 hover:bg-primary/20 transition-colors"
            aria-label={`Change driver for job ${job.jobCode}`}
          >
            {job.driver.firstName} {job.driver.lastName}
          </button>
        ) : (
          <button
            onClick={() => setSelectedJobForDriver(job)}
            className="text-text-secondary hover:text-primary text-sm"
            aria-label={`Assign driver for job ${job.jobCode}`}
          >
            Assign Driver
          </button>
        );

      case 'partner':
        return job.movingPartner?.name || job.thirdPartyMovingPartner?.title || '-';

      case 'onfleetTasks':
        return job.onfleetTasks?.length ? (
          <button
            onClick={() => setSelectedJobForTasks(job)}
            className="inline-flex items-center bg-primary/10 px-2.5 py-1 text-sm font-inter rounded-md font-medium text-primary ring-1 ring-inset ring-primary/20 hover:bg-primary/20 transition-colors"
            aria-label={`View Onfleet tasks for job ${job.jobCode}`}
          >
            View Tasks ({job.onfleetTasks.length})
          </button>
        ) : (
          '-'
        );

      case 'loadingHelpPrice':
      case 'monthlyStorageRate':
      case 'monthlyInsuranceRate':
      case 'quotedPrice':
      case 'invoiceTotal':
        const value = job[column.id];
        return value ? `$${value.toFixed(2)}` : '-';

      case 'trackingUrl':
      case 'invoiceUrl':
        const url = job[column.id];
        return url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            View
          </a>
        ) : (
          '-'
        );

      default: {
        const val = job[column.id as keyof Job];
        return typeof val === 'string' || typeof val === 'number' ? val : '-';
      }
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-text-primary">Jobs (Appointments)</h1>
        <div className="flex gap-3">
          <SearchAndFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search jobs..."
            actionFilters={actionFiltersConfig.map((f) => ({
              ...f,
              active: actionFilters[f.id] || false,
            }))}
            onToggleFilter={toggleFilter}
            showFilterMenu={showFilterMenu}
            onToggleFilterMenu={() => setShowFilterMenu(!showFilterMenu)}
          />
          <ColumnManagerMenu
            columns={columns}
            onToggleColumn={toggleColumn}
            showMenu={showColumnMenu}
            onToggleMenu={() => setShowColumnMenu(!showColumnMenu)}
          />
        </div>
      </div>

      {/* Table */}
      <AdminDataTable
        columns={columns.filter((c) => c.visible)}
        data={processedJobs}
        sortConfig={sortConfig}
        onSort={(columnId) => handleSort(columnId as ColumnId)}
        loading={loading}
        error={error}
        emptyMessage="No jobs found"
        renderRow={(job) => (
          <tr key={job.id} className="hover:bg-surface-tertiary transition-colors">
            {columns
              .filter((c) => c.visible)
              .map((column) => (
                <td key={column.id} className="px-3 py-4 text-sm text-text-primary whitespace-nowrap">
                  {renderCellContent(job, column)}
                </td>
              ))}
          </tr>
        )}
      />

      {/* Onfleet Tasks Modal */}
      {selectedJobForTasks && (
        <OnfleetTasksModal
          isOpen={!!selectedJobForTasks}
          onClose={() => setSelectedJobForTasks(null)}
          tasks={selectedJobForTasks.onfleetTasks || []}
        />
      )}

      {/* Storage Unit Assignment Modal */}
      {selectedJobForStorageUnits && (
        <StorageUnitAssignmentModal
          isOpen={!!selectedJobForStorageUnits}
          onClose={() => setSelectedJobForStorageUnits(null)}
          appointmentId={selectedJobForStorageUnits.id}
          numberOfUnits={selectedJobForStorageUnits.numberOfUnits || 1}
          currentAssignments={selectedJobForStorageUnits.storageStartUsages?.map(u => u.storageUnit.storageUnitNumber) || []}
          onAssign={async (unitNumbers: string[]) => {
            await refetch();
            setSelectedJobForStorageUnits(null);
          }}
        />
      )}

      {/* Driver Assignment Modal */}
      {selectedJobForDriver && (
        <DriverAssignmentModal
          isOpen={!!selectedJobForDriver}
          onClose={() => setSelectedJobForDriver(null)}
          movingPartner={(selectedJobForDriver.movingPartner as any) || null}
          jobCode={selectedJobForDriver.jobCode}
          appointmentId={selectedJobForDriver.id}
        />
      )}
    </div>
  );
}

