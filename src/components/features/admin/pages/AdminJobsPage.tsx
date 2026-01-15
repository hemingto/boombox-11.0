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
 * STYLING:
 * - Uses boombox-10.0 admin portal styling (indigo header, color-coded rows)
 * - Status-based row backgrounds (cyan, amber, purple, emerald, red)
 * - Custom filter dropdowns with checkboxes
 * - Date picker integration for appointment filtering
 * 
 * API ROUTES:
 * - GET /api/admin/jobs - Fetches all appointments
 * 
 * @refactor Maintains boombox-10.0 admin styling patterns
 */

'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { OnfleetTasksModal } from '@/components/features/admin/shared/OnfleetTasksModal';
import { StorageUnitAssignmentModal } from '@/components/features/admin/shared/StorageUnitAssignmentModal';
import { DriverAssignmentModal } from '@/components/features/admin/shared/DriverAssignmentModal';
import { AdminTable } from '@/components/features/admin/shared/table/AdminTable';
import { AdminActionButton } from '@/components/features/admin/shared/buttons/AdminActionButton';
import { AdminStatusBadge } from '@/components/features/admin/shared/buttons/AdminStatusBadge';
import { FilterDropdown } from '@/components/features/admin/shared/filters/FilterDropdown';
import { ColumnManagerDropdown } from '@/components/features/admin/shared/filters/ColumnManagerDropdown';
import { AdminPageHeader } from '@/components/features/admin/shared/filters/AdminPageHeader';
import { AdminDatePicker } from '@/components/features/admin/shared/AdminDatePicker';
import { getRowColor } from '@/lib/utils/adminStyles';
import { formatDateTimePST } from '@/lib/utils/adminDateUtils';

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

type ColumnId = 'jobCode' | 'user' | 'date' | 'appointmentType' | 'status' | 'storageUnits' | 'requestedStorageUnits' | 'address' | 'driver' | 'partner' | 'onfleetTasks' | 'zipcode' | 'numberOfUnits' | 'planType' | 'insuranceCoverage' | 'loadingHelpPrice' | 'monthlyStorageRate' | 'monthlyInsuranceRate' | 'quotedPrice' | 'invoiceTotal' | 'description' | 'deliveryReason' | 'trackingToken' | 'trackingUrl' | 'invoiceUrl' | 'serviceStartTime' | 'serviceEndTime' | 'thirdPartyMovingPartner';

interface Column {
  id: ColumnId;
  label: string;
  visible: boolean;
}

const defaultColumns: Column[] = [
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
];

const allColumns: Column[] = [
  ...defaultColumns,
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

type StatusType = 'scheduled' | 'in transit' | 'awaiting admin check in' | 'complete' | 'canceled';
type ActionType = 'unassigned_drivers' | 'incomplete_assignments';

type SortConfig = {
  column: ColumnId | null;
  direction: 'asc' | 'desc';
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
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [columns, setColumns] = useState<Column[]>(allColumns);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showActionsFilter, setShowActionsFilter] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedJobForTasks, setSelectedJobForTasks] = useState<Job | null>(null);
  const [selectedJobForStorageUnits, setSelectedJobForStorageUnits] = useState<Job | null>(null);
  const [selectedJobForDriver, setSelectedJobForDriver] = useState<Job | null>(null);
  const [statusFilters, setStatusFilters] = useState<Record<StatusType, boolean>>({
    'scheduled': true,
    'in transit': true,
    'awaiting admin check in': true,
    'complete': true,
    'canceled': true
  });
  const [actionFilters, setActionFilters] = useState<Record<ActionType, boolean>>({
    'unassigned_drivers': false,
    'incomplete_assignments': false
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: null, direction: 'asc' });
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [searchQuery, setSearchQuery] = useState('');

  const filteredJobs = jobs.filter(job => {
    const statusMatch = statusFilters[job.status.toLowerCase() as StatusType];
    const actionMatch = !actionFilters.unassigned_drivers && !actionFilters.incomplete_assignments ? true : (
      (actionFilters.unassigned_drivers && !job.driver) ||
      (actionFilters.incomplete_assignments && 
        job.appointmentType === 'New Customer' &&
        (!job.storageStartUsages?.length || job.storageStartUsages.length === 0))
    );
    const searchMatch = searchQuery === '' ? true : (
      job.jobCode.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return statusMatch && actionMatch && searchMatch;
  });

  const toggleStatusFilter = (status: StatusType) => {
    setStatusFilters(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  const allStatusesSelected = Object.values(statusFilters).every(Boolean);
  const toggleAllStatuses = () => {
    const newValue = !allStatusesSelected;
    setStatusFilters({
      'scheduled': newValue,
      'in transit': newValue,
      'awaiting admin check in': newValue,
      'complete': newValue,
      'canceled': newValue
    });
  };

  const toggleActionFilter = (action: ActionType) => {
    setActionFilters(prev => ({
      ...prev,
      [action]: !prev[action]
    }));
  };

  const allActionsSelected = Object.values(actionFilters).every(Boolean);
  const toggleAllActions = () => {
    const newValue = !allActionsSelected;
    setActionFilters({
      'unassigned_drivers': newValue,
      'incomplete_assignments': newValue
    });
  };

  const handleSort = (column: ColumnId) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.column === column && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ column, direction });
  };

  const getSortedJobs = (jobs: Job[]) => {
    if (!sortConfig.column) return jobs;

    const sortColumn = sortConfig.column;
    return [...jobs].sort((a, b) => {
      const aValue = getSortValue(a, sortColumn as ColumnId);
      const bValue = getSortValue(b, sortColumn as ColumnId);

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const getSortValue = (job: Job, column: ColumnId) => {
    switch (column) {
      case 'date':
        return new Date(job.date).getTime();
      case 'appointmentType':
        return job.appointmentType.toLowerCase();
      case 'status':
        return job.status.toLowerCase();
      case 'partner':
        return job.movingPartner?.name?.toLowerCase() || '';
      case 'requestedStorageUnits':
        return job.requestedStorageUnits?.map(unit => unit.storageUnit.storageUnitNumber).join(', ') || '';
      case 'storageUnits':
        return job.storageStartUsages?.map(usage => usage.storageUnit.storageUnitNumber).join(', ') || '';
      default:
        return '';
    }
  };

  const filteredAndSortedJobs = getSortedJobs(filteredJobs);

  const fetchJobs = useCallback(async () => {
    try {
      let url = '/api/admin/jobs';
      // Only add date parameter if there's no search query
      if (selectedDate && !searchQuery) {
        url += `?date=${selectedDate.toISOString()}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const data = await response.json();
      setJobs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, searchQuery]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const toggleColumn = (columnId: ColumnId) => {
    setColumns(columns.map(col => 
      col.id === columnId ? { ...col, visible: !col.visible } : col
    ));
  };

  const handleAssignStorageUnits = async (job: Job) => {
    setSelectedJobForStorageUnits(job);
  };

  const handleStorageUnitAssignmentComplete = async (unitNumbers: string[]) => {
    if (!selectedJobForStorageUnits) return;

    try {
      const response = await fetch(`/api/admin/appointments/${selectedJobForStorageUnits.id}/assign-storage-units`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storageUnitNumbers: unitNumbers }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign storage units');
      }

      // Refresh the jobs list
      await fetchJobs();
      setSelectedJobForStorageUnits(null);
    } catch (error) {
      console.error('Error assigning storage units:', error);
      setError(error instanceof Error ? error.message : 'Failed to assign storage units');
    }
  };

  const handleDateChange = (formattedDate: string, dateObject: Date | null) => {
    setSelectedDate(dateObject);
  };

  // Convert filters to FilterDropdown format
  const statusFilterItems = Object.keys(statusFilters).map((status) => ({
    id: status,
    label: status,
    checked: statusFilters[status as StatusType],
  }));

  const actionFilterItems = [
    { id: 'unassigned_drivers', label: 'Unassigned Drivers', checked: actionFilters.unassigned_drivers },
    { id: 'incomplete_assignments', label: 'Unassigned Unit', checked: actionFilters.incomplete_assignments },
  ];

  return (
    <div>
      <AdminPageHeader title="Jobs">
        <div className="relative">
          <input
            type="text"
            placeholder="Search job code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-zinc-950 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 font-semibold"
          />
        </div>
        <AdminDatePicker
          value={selectedDate}
          onDateChange={handleDateChange}
          allowPastDates={true}
          placeholder="Date"
          isOpen={showDatePicker}
          onToggle={() => {
            setShowDatePicker(!showDatePicker);
            setShowStatusFilter(false);
            setShowActionsFilter(false);
            setShowColumnMenu(false);
          }}
        />
        <FilterDropdown
          label="Status"
          filters={statusFilterItems}
          isOpen={showStatusFilter}
          onToggle={() => {
            setShowStatusFilter(!showStatusFilter);
            setShowActionsFilter(false);
            setShowColumnMenu(false);
            setShowDatePicker(false);
          }}
          onToggleFilter={(id) => toggleStatusFilter(id as StatusType)}
          onToggleAll={toggleAllStatuses}
          allSelected={allStatusesSelected}
          allLabel="All Statuses"
        />
        <FilterDropdown
          label="Actions"
          filters={actionFilterItems}
          isOpen={showActionsFilter}
          onToggle={() => {
            setShowActionsFilter(!showActionsFilter);
            setShowStatusFilter(false);
            setShowColumnMenu(false);
            setShowDatePicker(false);
          }}
          onToggleFilter={(id) => toggleActionFilter(id as ActionType)}
          onToggleAll={toggleAllActions}
          allSelected={allActionsSelected}
          allLabel="All Actions"
        />
        <ColumnManagerDropdown
          columns={columns}
          isOpen={showColumnMenu}
          onToggle={() => {
            setShowColumnMenu(!showColumnMenu);
            setShowStatusFilter(false);
            setShowActionsFilter(false);
            setShowDatePicker(false);
          }}
          onToggleColumn={toggleColumn}
        />
      </AdminPageHeader>

      <AdminTable
        columns={columns.map(col => ({
          ...col,
          sortable: ['date', 'appointmentType', 'status', 'partner', 'storageUnits', 'requestedStorageUnits'].includes(col.id)
        }))}
        data={filteredAndSortedJobs}
        sortConfig={sortConfig}
        onSort={handleSort}
        loading={loading}
        error={error}
        emptyMessage="No jobs booked for today"
        onRetry={fetchJobs}
        renderRow={(job) => (
          <tr key={job.id} className={getRowColor(job.status)}>
            {columns.map((column) => (
              column.visible && (
                <td
                  key={column.id}
                  className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6"
                >
                  {column.id === 'onfleetTasks' ? (
                    job.onfleetTasks?.length ? (
                      <AdminActionButton variant="indigo" onClick={() => setSelectedJobForTasks(job)}>
                        View Records
                      </AdminActionButton>
                    ) : '-'
                  ) : column.id === 'status' ? (
                    <AdminStatusBadge status={job.status} />
                  ) : column.id === 'user' ? (
                    `${job.user.firstName} ${job.user.lastName}`
                  ) : column.id === 'driver' ? (() => {
                    const driver = job.onfleetTasks?.find(task => task.driver)?.driver;
                    return driver ? (
                      `${driver.firstName} ${driver.lastName}`
                    ) : (
                      <AdminActionButton variant="red" onClick={() => setSelectedJobForDriver(job)}>
                        Driver Unassigned
                      </AdminActionButton>
                    );
                  })() : column.id === 'partner' ? (
                    job.movingPartner?.name || '-'
                  ) : column.id === 'date' ? (
                    formatDateTimePST(job.date)
                  ) : column.id === 'thirdPartyMovingPartner' ? (
                    job.thirdPartyMovingPartner?.title || '-'
                  ) : column.id === 'storageUnits' ? (
                    job.appointmentType === 'New Customer' ? (
                      job.storageStartUsages?.length ? (
                        job.storageStartUsages.length < (job.numberOfUnits || 0) ? (
                          <AdminActionButton variant="amber" onClick={() => handleAssignStorageUnits(job)}>
                            Incomplete
                          </AdminActionButton>
                        ) : (
                          <AdminActionButton variant="green" onClick={() => handleAssignStorageUnits(job)}>
                            {job.storageStartUsages.map(usage => usage.storageUnit.storageUnitNumber).join(', ')}
                          </AdminActionButton>
                        )
                      ) : (
                        <AdminActionButton variant="red" onClick={() => handleAssignStorageUnits(job)}>
                          Assign Unit
                        </AdminActionButton>
                      )
                    ) : '-'
                  ) : column.id === 'requestedStorageUnits' ? (
                    job.requestedStorageUnits?.length ? (
                      job.requestedStorageUnits.map(unit => unit.storageUnit.storageUnitNumber).join(', ')
                    ) : '-'
                  ) : (
                    String(job[column.id as keyof Job])
                  )}
                </td>
              )
            ))}
          </tr>
        )}
      />

      {selectedJobForTasks && (
        <OnfleetTasksModal
          isOpen={!!selectedJobForTasks}
          onClose={() => setSelectedJobForTasks(null)}
          tasks={selectedJobForTasks.onfleetTasks || []}
        />
      )}

      {selectedJobForStorageUnits && (
        <StorageUnitAssignmentModal
          isOpen={!!selectedJobForStorageUnits}
          onClose={() => setSelectedJobForStorageUnits(null)}
          appointmentId={selectedJobForStorageUnits.id}
          numberOfUnits={selectedJobForStorageUnits.numberOfUnits || 0}
          currentAssignments={selectedJobForStorageUnits.storageStartUsages?.map(usage => usage.storageUnit.storageUnitNumber) || []}
          onAssign={handleStorageUnitAssignmentComplete}
        />
      )}

      {selectedJobForDriver && (
        <DriverAssignmentModal
          isOpen={!!selectedJobForDriver}
          onClose={() => setSelectedJobForDriver(null)}
          movingPartner={selectedJobForDriver.movingPartner ? {
            name: selectedJobForDriver.movingPartner.name,
            email: selectedJobForDriver.movingPartner.email || '',
            phoneNumber: selectedJobForDriver.movingPartner.phoneNumber || ''
          } : null}
          jobCode={selectedJobForDriver.jobCode}
          appointmentId={selectedJobForDriver.id}
          planType={selectedJobForDriver.planType}
        />
      )}
    </div>
  );
}

