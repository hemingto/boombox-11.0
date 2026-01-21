/**
 * @fileoverview Admin moving partners management page component
 * @source boombox-10.0/src/app/admin/movers/page.tsx
 * 
 * GOLD STANDARD REFACTORING:
 * - AdminPageHeader with search and filters
 * - FilterDropdown for action filters  
 * - ColumnManagerDropdown for column visibility
 * - AdminTable for data display
 * - AdminActionButton for actions
 * - AdminBooleanBadge for boolean fields
 * - Dropdown coordination
 * 
 * API ROUTES:
 * - GET /api/admin/moving-partners
 * - POST /api/admin/moving-partners/[id]/approve
 */

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import {
 AdminPageHeader,
  AdminFilterDropdown,
 ColumnManagerDropdown,
 AdminTable,
 AdminActionButton,
 AdminBooleanBadge,
 AdminDetailModal,
 type Column,
} from '@/components/features/admin/shared';
import { Button } from '@/components/ui/primitives/Button/Button';
import { formatPhoneNumberForDisplay } from '@/lib/utils';
import { Modal } from '@/components/ui/primitives/Modal/Modal';

interface MovingPartner {
 id: number;
 name: string;
 description: string | null;
 phoneNumber: string | null;
 verifiedPhoneNumber: boolean | null;
 email: string | null;
 hourlyRate: number | null;
 website: string | null;
 featured: string | null;
 imageSrc: string | null;
 onfleetTeamId: string | null;
 isApproved: boolean | null;
 numberOfEmployees: string | null;
 applicationComplete: boolean | null;
 appointments: {
  id: number;
  date: string;
  status: string;
  jobCode: string;
  user: {
   firstName: string;
   lastName: string;
  };
 }[];
 availability: {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
 }[];
 feedback: {
  id: number;
  rating: number;
  comment: string;
 }[];
 approvedDrivers: {
  driver: {
   firstName: string;
   lastName: string;
  };
 }[];
 driverInvitations: {
  id: number;
  email: string;
  status: string;
 }[];
 vehicles: {
  id: number;
  make: string;
  model: string;
  year: string;
  licensePlate: string;
  isApproved: boolean;
 }[];
 moverCancellations: {
  id: number;
  cancellationReason: string;
  cancellationDate: string;
 }[];
}

type ColumnId =
 | 'imageSrc'
 | 'name'
 | 'email'
 | 'phoneNumber'
 | 'hourlyRate'
 | 'website'
 | 'isApproved'
 | 'applicationComplete'
 | 'numberOfEmployees'
 | 'appointments'
 | 'availability'
 | 'feedback'
 | 'approvedDrivers'
 | 'driverInvitations'
 | 'vehicles'
 | 'moverCancellations'
 | 'action';

type RecordType =
 | 'appointments'
 | 'availability'
 | 'feedback'
 | 'approvedDrivers'
 | 'driverInvitations'
 | 'vehicles'
 | 'moverCancellations';

const defaultColumns: Column<ColumnId>[] = [
 { id: 'imageSrc', label: 'Photo', visible: true },
 { id: 'name', label: 'Name', visible: true },
 { id: 'email', label: 'Email', visible: true },
 { id: 'phoneNumber', label: 'Phone', visible: true },
 { id: 'hourlyRate', label: 'Hourly Rate', visible: true },
 { id: 'isApproved', label: 'Approved', visible: true },
 { id: 'action', label: 'Action', visible: true },
 { id: 'website', label: 'Website', visible: false },
 { id: 'applicationComplete', label: 'App Complete', visible: false },
 { id: 'numberOfEmployees', label: '# of Employees', visible: false },
 { id: 'appointments', label: 'Appointments', visible: false },
 { id: 'availability', label: 'Availability', visible: false },
 { id: 'vehicles', label: 'Vehicles', visible: false },
 { id: 'feedback', label: 'Feedback', visible: false },
 { id: 'approvedDrivers', label: 'Drivers', visible: false },
 { id: 'driverInvitations', label: 'Driver Invites', visible: false },
 { id: 'moverCancellations', label: 'Cancellations', visible: false },
];

/**
 * AdminMoversPage - Moving partners management interface
 * 
 * @example
 * ```tsx
 * // Used in: src/app/(dashboard)/admin/movers/page.tsx
 * <AdminMoversPage />
 * ```
 */
export function AdminMoversPage() {
 // Data state
 const [movers, setMovers] = useState<MovingPartner[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<Error | null>(null);

 // Table state
 const [columns, setColumns] = useState<Column<ColumnId>[]>(defaultColumns);
 const [sortConfig, setSortConfig] = useState<{ column: ColumnId | null; direction: 'asc' | 'desc' }>({
  column: null,
  direction: 'asc',
 });
 const [searchQuery, setSearchQuery] = useState('');
 
 // Filter state
 const [actionFilters, setActionFilters] = useState({ approve_movers: false });
 const [showActionsFilter, setShowActionsFilter] = useState(false);
 const [showColumnMenu, setShowColumnMenu] = useState(false);

 // Modal states
 const [selectedMover, setSelectedMover] = useState<MovingPartner | null>(null);
 const [showViewModal, setShowViewModal] = useState(false);
 const [showApproveModal, setShowApproveModal] = useState(false);
 const [selectedRecordType, setSelectedRecordType] = useState<RecordType | null>(null);

 // Fetch data
 useEffect(() => {
  fetchMovers();
 }, []);

 const fetchMovers = async () => {
  try {
   setLoading(true);
   setError(null);
   const response = await fetch('/api/admin/moving-partners');
   if (!response.ok) throw new Error('Failed to fetch moving partners');
   const data = await response.json();
   setMovers(data);
  } catch (err) {
   setError(err instanceof Error ? err : new Error('Unknown error'));
  } finally {
   setLoading(false);
  }
 };

 // Column management
 const toggleColumn = (columnId: ColumnId) => {
  setColumns((prev) =>
   prev.map((col) => (col.id === columnId ? { ...col, visible: !col.visible } : col))
  );
 };

 // Sorting
 const handleSort = (columnId: ColumnId) => {
  setSortConfig((prev) => ({
   column: columnId,
   direction: prev.column === columnId && prev.direction === 'asc' ? 'desc' : 'asc',
  }));
 };

 // Filter management
 const toggleActionFilter = (filterId: string) => {
  setActionFilters((prev) => ({
   ...prev,
   [filterId]: !prev[filterId as keyof typeof prev],
  }));
 };

 const toggleAllActionFilters = () => {
  const allActive = Object.values(actionFilters).every((v) => v);
  setActionFilters({ approve_movers: !allActive });
 };

 const allActionFiltersSelected = Object.values(actionFilters).every((v) => v);

 // Create filter items for FilterDropdown
 const actionFilterItems = [
  { id: 'approve_movers', label: 'Approve Moving Partners', checked: actionFilters.approve_movers },
 ];

 /**
  * Filtered and sorted data
  */
 const filteredAndSortedMovers = useMemo(() => {
  let result = [...movers];

  // Apply search filter
  if (searchQuery) {
   const lowerQuery = searchQuery.toLowerCase();
   result = result.filter(
    (mover) =>
     mover.name.toLowerCase().includes(lowerQuery) ||
     (mover.email && mover.email.toLowerCase().includes(lowerQuery)) ||
     (mover.phoneNumber && mover.phoneNumber.includes(searchQuery))
   );
  }

  // Apply action filters
  if (actionFilters.approve_movers) {
   result = result.filter((mover) => !mover.isApproved);
  }

  // Apply sorting
  if (sortConfig.column) {
   result.sort((a, b) => {
    const aValue = a[sortConfig.column as keyof MovingPartner];
    const bValue = b[sortConfig.column as keyof MovingPartner];

    if (aValue === null || aValue === undefined) return sortConfig.direction === 'asc' ? -1 : 1;
    if (bValue === null || bValue === undefined) return sortConfig.direction === 'asc' ? 1 : -1;

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
   });
  }

  return result;
 }, [movers, searchQuery, actionFilters, sortConfig]);

 /**
  * Handle viewing nested records
  */
 const handleViewRecord = (mover: MovingPartner, recordType: RecordType) => {
  setSelectedMover(mover);
  setSelectedRecordType(recordType);
  setShowViewModal(true);
 };

 /**
  * Handle mover approval
  */
 const handleApproveMover = (mover: MovingPartner) => {
  setSelectedMover(mover);
  setShowApproveModal(true);
 };

 const handleApproveConfirm = async () => {
  if (!selectedMover) return;

  try {
   const response = await fetch(`/api/admin/moving-partners/${selectedMover.id}/approve`, {
    method: 'POST',
   });

   if (!response.ok) throw new Error('Failed to approve moving partner');

   await fetchMovers();
   setShowApproveModal(false);
   setSelectedMover(null);
  } catch (err) {
   console.error('Error approving moving partner:', err);
  }
 };

 /**
  * Render cell content based on column type
  */
 const renderCellContent = (mover: MovingPartner, column: Column<ColumnId>): React.ReactNode => {
  switch (column.id) {
   case 'imageSrc':
    return mover.imageSrc ? (
     <Image
      src={mover.imageSrc}
      alt={mover.name}
      className="w-10 h-10 rounded object-cover"
      width={40}
      height={40}
     />
    ) : (
     <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center">
      <span className="text-gray-500 text-xs font-semibold">{mover.name[0]}</span>
     </div>
    );

   case 'phoneNumber':
    return mover.phoneNumber ? formatPhoneNumberForDisplay(mover.phoneNumber) : '-';

   case 'hourlyRate':
    return mover.hourlyRate ? `$${mover.hourlyRate}/hr` : '-';

   case 'isApproved':
   case 'applicationComplete':
    const value = mover[column.id];
    return <AdminBooleanBadge value={value ?? false} />;

   case 'action':
    return !mover.isApproved ? (
     <AdminActionButton
      variant="green"
      onClick={() => handleApproveMover(mover)}
     >
      Approve
     </AdminActionButton>
    ) : null;

   case 'appointments':
   case 'availability':
   case 'feedback':
   case 'approvedDrivers':
   case 'driverInvitations':
   case 'vehicles':
   case 'moverCancellations': {
    const recordType = column.id;
    return mover[recordType]?.length > 0 ? (
     <AdminActionButton
      variant="indigo"
      onClick={() => handleViewRecord(mover, recordType)}
     >
      View Records ({mover[recordType].length})
     </AdminActionButton>
    ) : (
     '-'
    );
   }

   default: {
    const value = mover[column.id as keyof MovingPartner];
    return typeof value === 'string' || typeof value === 'number' ? value : '-';
   }
  }
 };

 /**
  * Render modal content based on record type
  */
 const renderModalContent = () => {
  if (!selectedMover || !selectedRecordType) return null;

  const records = selectedMover[selectedRecordType];

  if (selectedRecordType === 'appointments') {
   return (
    <div className="space-y-4">
     {records.map((apt: any) => (
      <div key={apt.id} className="border-b border-gray-300 pb-4 last:border-0">
       <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
         <span className="text-gray-500">Job Code:</span>
         <span className="ml-2 text-text-primary font-medium">{apt.jobCode}</span>
        </div>
        <div>
         <span className="text-gray-500">Status:</span>
         <span className="ml-2 text-gray-900">{apt.status}</span>
        </div>
        <div>
         <span className="text-gray-500">Customer:</span>
         <span className="ml-2 text-gray-900">
          {apt.user.firstName} {apt.user.lastName}
         </span>
        </div>
        <div>
         <span className="text-gray-500">Date:</span>
         <span className="ml-2 text-gray-900">
          {new Date(apt.date).toLocaleDateString()}
         </span>
        </div>
       </div>
      </div>
     ))}
    </div>
   );
  }

  if (selectedRecordType === 'availability') {
   return (
    <div className="space-y-4">
     {records.map((avail: any) => (
      <div key={avail.id} className="border-b border-border pb-4 last:border-0">
       <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
         <span className="text-gray-500">Day:</span>
         <span className="ml-2 text-text-primary font-medium">{avail.dayOfWeek}</span>
        </div>
        <div>
         <span className="text-gray-500">Time:</span>
         <span className="ml-2 text-gray-900">
          {avail.startTime} - {avail.endTime}
         </span>
        </div>
        <div>
         <span className="text-gray-500">Max Capacity:</span>
         <span className="ml-2 text-gray-900">{avail.maxCapacity}</span>
        </div>
       </div>
      </div>
     ))}
    </div>
   );
  }

  if (selectedRecordType === 'feedback') {
   return (
    <div className="space-y-4">
     {records.map((fb: any) => (
      <div key={fb.id} className="border-b border-border pb-4 last:border-0">
       <div className="space-y-2 text-sm">
        <div>
         <span className="text-gray-500">Rating:</span>
         <span className="ml-2 text-text-primary font-medium">{'⭐'.repeat(fb.rating)}</span>
        </div>
        <div>
         <span className="text-gray-500">Comment:</span>
         <p className="mt-1 text-gray-900">{fb.comment}</p>
        </div>
       </div>
      </div>
     ))}
    </div>
   );
  }

  if (selectedRecordType === 'approvedDrivers') {
   return (
    <div className="space-y-4">
     {records.map((assoc: any, idx: number) => (
      <div key={idx} className="border-b border-border pb-4 last:border-0">
       <div className="text-sm">
        <span className="text-text-secondary">Driver:</span>
        <span className="ml-2 text-text-primary font-medium">
         {assoc.driver.firstName} {assoc.driver.lastName}
        </span>
       </div>
      </div>
     ))}
    </div>
   );
  }

  if (selectedRecordType === 'driverInvitations') {
   return (
    <div className="space-y-4">
     {records.map((invite: any) => (
      <div key={invite.id} className="border-b border-border pb-4 last:border-0">
       <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
         <span className="text-gray-500">Email:</span>
         <span className="ml-2 text-gray-900">{invite.email}</span>
        </div>
        <div>
         <span className="text-gray-500">Status:</span>
         <span className="ml-2 text-gray-900">{invite.status}</span>
        </div>
       </div>
      </div>
     ))}
    </div>
   );
  }

  if (selectedRecordType === 'vehicles') {
   return (
    <div className="space-y-4">
     {records.map((vehicle: any) => (
      <div key={vehicle.id} className="border-b border-border pb-4 last:border-0">
       <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
         <span className="text-gray-500">Make/Model:</span>
         <span className="ml-2 text-text-primary font-medium">
          {vehicle.make} {vehicle.model}
         </span>
        </div>
        <div>
         <span className="text-gray-500">Year:</span>
         <span className="ml-2 text-gray-900">{vehicle.year}</span>
        </div>
        <div>
         <span className="text-gray-500">License Plate:</span>
         <span className="ml-2 text-gray-900">{vehicle.licensePlate}</span>
        </div>
        <div>
         <span className="text-gray-500">Approved:</span>
         <span className="ml-2 text-gray-900">{vehicle.isApproved ? 'Yes' : 'No'}</span>
        </div>
       </div>
      </div>
     ))}
    </div>
   );
  }

  if (selectedRecordType === 'moverCancellations') {
   return (
    <div className="space-y-4">
     {records.map((cancel: any) => (
      <div key={cancel.id} className="border-b border-border pb-4 last:border-0">
       <div className="space-y-2 text-sm">
        <div>
         <span className="text-gray-500">Reason:</span>
         <p className="mt-1 text-gray-900">{cancel.cancellationReason}</p>
        </div>
        <div>
         <span className="text-gray-500">Date:</span>
         <span className="ml-2 text-gray-900">
          {new Date(cancel.cancellationDate).toLocaleDateString()}
         </span>
        </div>
       </div>
      </div>
     ))}
    </div>
   );
  }

  return null;
 };

 return (
  <div>
   {/* Header with Search, Filters, and Column Manager */}
   <AdminPageHeader title="Moving Partners">
    <div className="relative">
     <input
      type="text"
      placeholder="Search moving partners..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-zinc-950 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 font-semibold"
     />
    </div>
    <AdminFilterDropdown
     label="Actions"
     filters={actionFilterItems}
     isOpen={showActionsFilter}
     onToggle={() => {
      setShowActionsFilter(!showActionsFilter);
      setShowColumnMenu(false);
     }}
     onToggleFilter={(id) => toggleActionFilter(id)}
     onToggleAll={toggleAllActionFilters}
     allSelected={allActionFiltersSelected}
     allLabel="All Actions"
    />
    <ColumnManagerDropdown
     columns={columns}
     isOpen={showColumnMenu}
     onToggle={() => {
      setShowColumnMenu(!showColumnMenu);
      setShowActionsFilter(false);
     }}
     onToggleColumn={toggleColumn}
    />
   </AdminPageHeader>

   {/* Table */}
   <AdminTable
    columns={columns.map((col) => ({
     ...col,
     sortable: col.id !== 'imageSrc' && col.id !== 'phoneNumber',
    }))}
    data={filteredAndSortedMovers}
    sortConfig={sortConfig}
    onSort={handleSort}
    loading={loading}
    error={error?.message ?? null}
    emptyMessage="No moving partners found"
    onRetry={fetchMovers}
    renderRow={(mover) => (
     <tr key={mover.id} className="hover:bg-slate-50">
      {columns
       .filter((c) => c.visible)
       .map((column) => (
        <td key={column.id} className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
         {renderCellContent(mover, column)}
        </td>
       ))}
     </tr>
    )}
   />

   {/* Detail Modal */}
   <AdminDetailModal
    isOpen={showViewModal}
    onClose={() => {
     setShowViewModal(false);
     setSelectedMover(null);
     setSelectedRecordType(null);
    }}
    title={
     selectedRecordType === 'appointments'
      ? 'Moving Partner Appointments'
      : selectedRecordType === 'availability'
      ? 'Moving Partner Availability'
      : selectedRecordType === 'feedback'
      ? 'Moving Partner Feedback'
      : selectedRecordType === 'approvedDrivers'
      ? 'Approved Drivers'
      : selectedRecordType === 'driverInvitations'
      ? 'Driver Invitations'
      : selectedRecordType === 'vehicles'
      ? 'Moving Partner Vehicles'
      : 'Moving Partner Cancellations'
    }
    data={selectedMover && selectedRecordType ? selectedMover[selectedRecordType] : null}
    renderContent={renderModalContent}
    size="lg"
   />

   {/* Approve Confirmation Modal */}
   <Modal
    open={showApproveModal}
    onClose={() => {
     setShowApproveModal(false);
     setSelectedMover(null);
    }}
    title="Approve Moving Partner"
    size="md"
   >
    <div className="space-y-12">
     <p className="text-gray-900">
      Are you sure you want to approve <strong>{selectedMover?.name}</strong>?
     </p>
     <div className="flex justify-end gap-3">
     <Button
      type="button"
      variant="ghost"
      size="md"
      onClick={() => {
       setShowApproveModal(false);
       setSelectedMover(null);
      }}
     >
      Cancel
     </Button>
     <Button type="button" variant="approve" size="md" onClick={handleApproveConfirm}>
      Approve Moving Partner
     </Button>
     </div>
    </div>
   </Modal>
  </div>
 );
}

