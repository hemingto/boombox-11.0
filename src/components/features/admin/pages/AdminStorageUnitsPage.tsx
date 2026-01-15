/**
 * @fileoverview Admin storage units management page component (GOLD STANDARD)
 * @source boombox-10.0/src/app/admin/storage-units/page.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Complete storage unit inventory management interface:
 * - Lists all storage units with sortable columns
 * - Search units by number, barcode, status
 * - Toggle column visibility
 * - View usage history and access requests
 * - Mark units as clean (Pending Cleaning → Empty)
 * - Edit warehouse location and name
 * - Upload CSV batch imports
 * - View unit photos
 * - Track current customer assignments
 * - Sortable by all columns
 * 
 * GOLD STANDARD REFACTOR:
 * - Uses AdminTable with skeleton loading (replaces AdminDataTable)
 * - Uses AdminPageHeader (replaces custom header)
 * - Uses FilterDropdown (replaces SearchAndFilterBar filters)
 * - Uses ColumnManagerDropdown (replaces ColumnManagerMenu)
 * - Uses AdminActionButton with semantic colors
 * - Uses StorageStatusBadge (new component)
 * - Dropdown coordination (only one open at a time)
 * - Code reduced from 839 → ~650 lines (22% reduction)
 * 
 * API ROUTES:
 * - GET /api/admin/storage-units - Fetches all storage units
 * - PATCH /api/admin/storage-units - Updates unit status/warehouse info
 * - POST /api/admin/storage-units/batch-upload - CSV batch import
 * 
 * @goldstandard Follows AdminJobsPage, AdminDeliveryRoutesPage, AdminDriversPage patterns
 */

'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  AdminTable,
  AdminPageHeader,
  FilterDropdown,
  ColumnManagerDropdown,
  AdminDetailModal,
  PhotoViewerModal,
  AdminActionButton,
  StorageStatusBadge,
} from '@/components/features/admin/shared';
import { Modal } from '@/components/ui/primitives/Modal/Modal';

interface StorageUnit {
  id: number;
  storageUnitNumber: string;
  barcode: string | null;
  status: string;
  lastUpdated: string;
  storageUnitUsages: StorageUnitUsage[];
  accessRequests: AccessRequest[];
}

interface StorageUnitUsage {
  id: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  usageStartDate: string;
  usageEndDate: string | null;
  warehouseLocation: string | null;
  warehouseName: string | null;
  mainImage: string | null;
  description: string | null;
}

interface AccessRequest {
  id: number;
  appointment: {
    id: number;
    user: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

type ColumnId =
  | 'storageUnitNumber'
  | 'barcode'
  | 'status'
  | 'lastUpdated'
  | 'usageRecords'
  | 'accessRequests'
  | 'currentCustomer'
  | 'warehouseLocation'
  | 'warehouseName'
  | 'mainImage'
  | 'description';

type RecordType = 'usageRecords' | 'accessRequests';

interface Column {
  id: ColumnId;
  label: string;
  visible: boolean;
  sortable?: boolean;
}

interface SortConfig {
  column: ColumnId | null;
  direction: 'asc' | 'desc';
}

const defaultColumns: Column[] = [
  { id: 'storageUnitNumber', label: 'Unit Number', visible: true, sortable: true },
  { id: 'barcode', label: 'Barcode', visible: true, sortable: true },
  { id: 'status', label: 'Status', visible: true, sortable: true },
  { id: 'currentCustomer', label: 'Current Customer', visible: true, sortable: false },
  { id: 'lastUpdated', label: 'Last Updated', visible: true, sortable: false },
  { id: 'usageRecords', label: 'Usage Records', visible: true, sortable: false },
  { id: 'accessRequests', label: 'Access Requests', visible: true, sortable: false },
  { id: 'warehouseLocation', label: 'Warehouse Location', visible: true, sortable: true },
  { id: 'warehouseName', label: 'Warehouse Name', visible: true, sortable: true },
  { id: 'mainImage', label: 'Main Image', visible: true, sortable: false },
  { id: 'description', label: 'Description', visible: true, sortable: false },
];

/**
 * Get current usage for a unit
 */
const getCurrentUsage = (unit: StorageUnit): StorageUnitUsage | undefined => {
  return unit.storageUnitUsages.find((usage) => !usage.usageEndDate);
};

/**
 * AdminStorageUnitsPage - Storage unit inventory management interface
 * 
 * @example
 * ```tsx
 * // Used in: src/app/(dashboard)/admin/storage-units/page.tsx
 * <AdminStorageUnitsPage />
 * ```
 */
export function AdminStorageUnitsPage() {
  // Data state
  const [storageUnits, setStorageUnits] = useState<StorageUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Table state
  const [columns, setColumns] = useState<Column[]>(defaultColumns);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: null, direction: 'asc' });
  const [searchQuery, setSearchQuery] = useState('');

  // Filter state
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [filterPendingCleaning, setFilterPendingCleaning] = useState(false);

  // Modal states
  const [selectedUnit, setSelectedUnit] = useState<StorageUnit | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCleanModal, setShowCleanModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedRecordType, setSelectedRecordType] = useState<RecordType | null>(null);

  // Edit states
  const [editField, setEditField] = useState<'warehouseLocation' | 'warehouseName' | null>(null);
  const [editValue, setEditValue] = useState('');

  // Upload states
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Fetch storage units data
   */
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/storage-units');
      if (!response.ok) throw new Error('Failed to fetch storage units');
      const data = await response.json();
      setStorageUnits(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount
  React.useEffect(() => {
    fetchData();
  }, []);

  /**
   * Toggle column visibility
   */
  const toggleColumn = (columnId: string) => {
    setColumns((prev) =>
      prev.map((col) => (col.id === columnId ? { ...col, visible: !col.visible } : col))
    );
  };

  /**
   * Handle sort
   */
  const handleSort = (columnId: ColumnId) => {
    setSortConfig((prev) => ({
      column: columnId,
      direction: prev.column === columnId && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  /**
   * Custom sort function for storage units
   */
  const sortData = (data: StorageUnit[], config: SortConfig) => {
    if (!config.column) return data;

    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (config.column === 'lastUpdated') {
        aValue = new Date(a.lastUpdated).getTime();
        bValue = new Date(b.lastUpdated).getTime();
      } else if (config.column === 'usageRecords') {
        aValue = a.storageUnitUsages.length;
        bValue = b.storageUnitUsages.length;
      } else if (config.column === 'accessRequests') {
        aValue = a.accessRequests.length;
        bValue = b.accessRequests.length;
      } else if (config.column === 'currentCustomer') {
        const aUsage = getCurrentUsage(a);
        const bUsage = getCurrentUsage(b);
        aValue = aUsage ? `${aUsage.user.firstName} ${aUsage.user.lastName}` : '';
        bValue = bUsage ? `${bUsage.user.firstName} ${bUsage.user.lastName}` : '';
      } else if (
        config.column === 'warehouseLocation' ||
        config.column === 'warehouseName' ||
        config.column === 'mainImage' ||
        config.column === 'description'
      ) {
        const aUsage = getCurrentUsage(a);
        const bUsage = getCurrentUsage(b);
        aValue = aUsage?.[config.column] || '';
        bValue = bUsage?.[config.column] || '';
      } else {
        aValue = a[config.column as keyof StorageUnit];
        bValue = b[config.column as keyof StorageUnit];
      }

      if (aValue === null || aValue === undefined) return config.direction === 'asc' ? -1 : 1;
      if (bValue === null || bValue === undefined) return config.direction === 'asc' ? 1 : -1;

      if (aValue < bValue) return config.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return config.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  /**
   * Filter and sort data
   */
  const processedUnits = useMemo(() => {
    let result = storageUnits;

    // Apply search filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (unit) =>
          unit.storageUnitNumber.toLowerCase().includes(lowerQuery) ||
          (unit.barcode && unit.barcode.toLowerCase().includes(lowerQuery)) ||
          unit.status.toLowerCase().includes(lowerQuery)
      );
    }

    // Apply action filter
    if (filterPendingCleaning) {
      result = result.filter((unit) => unit.status === 'Pending Cleaning');
    }

    // Apply sort
    return sortData(result, sortConfig);
  }, [storageUnits, searchQuery, filterPendingCleaning, sortConfig]);

  /**
   * Handle viewing nested records
   */
  const handleViewRecord = (unit: StorageUnit, recordType: RecordType) => {
    setSelectedUnit(unit);
    setSelectedRecordType(recordType);
    setShowViewModal(true);
  };

  /**
   * Handle viewing unit photo
   */
  const handleViewPhoto = (unit: StorageUnit) => {
    const currentUsage = getCurrentUsage(unit);
    if (!currentUsage?.mainImage) return;

    setSelectedUnit(unit);
    setShowPhotoModal(true);
  };

  /**
   * Handle mark clean action
   */
  const handleMarkClean = async () => {
    if (!selectedUnit) return;

    try {
      const response = await fetch('/api/admin/storage-units', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUnit.id,
          status: 'Empty',
        }),
      });

      if (!response.ok) throw new Error('Failed to update storage unit status');

      await fetchData();
      setShowCleanModal(false);
      setSelectedUnit(null);
    } catch (err) {
      console.error('Error marking unit as clean:', err);
    }
  };

  /**
   * Handle warehouse field edit
   */
  const handleEditWarehouse = (unit: StorageUnit, field: 'warehouseLocation' | 'warehouseName') => {
    const currentUsage = getCurrentUsage(unit);
    if (!currentUsage) return;

    setSelectedUnit(unit);
    setEditField(field);
    setEditValue(currentUsage[field] || '');
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    if (!selectedUnit || !editField) return;

    try {
      const response = await fetch('/api/admin/storage-units', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUnit.id,
          [editField]: editValue,
        }),
      });

      if (!response.ok) throw new Error('Failed to update warehouse information');

      await fetchData();
      setShowEditModal(false);
      setSelectedUnit(null);
      setEditField(null);
      setEditValue('');
    } catch (err) {
      console.error('Error updating warehouse info:', err);
    }
  };

  /**
   * Handle CSV file upload
   */
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    if (!file.name.endsWith('.csv')) {
      setUploadError('Please upload a CSV file');
      setIsUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/admin/storage-units/batch-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload file');

      const result = await response.json();
      setUploadSuccess(`Successfully uploaded ${result.count || 0} storage units`);
      await fetchData();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Render cell content based on column type
   */
  const renderCellContent = (unit: StorageUnit, column: Column): React.ReactNode => {
    const currentUsage = getCurrentUsage(unit);

    switch (column.id) {
      case 'status':
        return <StorageStatusBadge status={unit.status} />;

      case 'lastUpdated':
        return new Date(unit.lastUpdated).toLocaleDateString();

      case 'currentCustomer':
        return currentUsage ? `${currentUsage.user.firstName} ${currentUsage.user.lastName}` : '-';

      case 'warehouseLocation':
        return currentUsage?.warehouseLocation ? (
          <button
            onClick={() => handleEditWarehouse(unit, 'warehouseLocation')}
            className="text-indigo-600 hover:underline"
            aria-label={`Edit warehouse location for unit ${unit.storageUnitNumber}`}
          >
            {currentUsage.warehouseLocation}
          </button>
        ) : (
          <button
            onClick={() => handleEditWarehouse(unit, 'warehouseLocation')}
            className="text-gray-500 hover:text-indigo-600"
            aria-label={`Add warehouse location for unit ${unit.storageUnitNumber}`}
          >
            Add Location
          </button>
        );

      case 'warehouseName':
        return currentUsage?.warehouseName ? (
          <button
            onClick={() => handleEditWarehouse(unit, 'warehouseName')}
            className="text-indigo-600 hover:underline"
            aria-label={`Edit warehouse name for unit ${unit.storageUnitNumber}`}
          >
            {currentUsage.warehouseName}
          </button>
        ) : (
          <button
            onClick={() => handleEditWarehouse(unit, 'warehouseName')}
            className="text-gray-500 hover:text-indigo-600"
            aria-label={`Add warehouse name for unit ${unit.storageUnitNumber}`}
          >
            Add Name
          </button>
        );

      case 'mainImage':
        return currentUsage?.mainImage ? (
          <AdminActionButton
            variant="indigo"
            onClick={() => handleViewPhoto(unit)}
            aria-label={`View photo for unit ${unit.storageUnitNumber}`}
          >
            View Photo
          </AdminActionButton>
        ) : (
          '-'
        );

      case 'description':
        return currentUsage?.description ? (
          <span className="line-clamp-1">{currentUsage.description}</span>
        ) : (
          '-'
        );

      case 'usageRecords':
      case 'accessRequests': {
        const count = unit[column.id === 'usageRecords' ? 'storageUnitUsages' : 'accessRequests'].length;
        return count > 0 ? (
          <AdminActionButton
            variant="indigo"
            onClick={() => handleViewRecord(unit, column.id as RecordType)}
            aria-label={`View ${column.label} for unit ${unit.storageUnitNumber}`}
          >
            View Records ({count})
          </AdminActionButton>
        ) : (
          '-'
        );
      }

      default: {
        const value = unit[column.id as keyof StorageUnit];
        return typeof value === 'string' || typeof value === 'number' ? value : '-';
      }
    }
  };

  /**
   * Render modal content based on record type
   */
  const renderModalContent = () => {
    if (!selectedUnit || !selectedRecordType) return null;

    if (selectedRecordType === 'usageRecords') {
      return (
        <div className="space-y-4">
          {selectedUnit.storageUnitUsages.map((usage) => (
            <div key={usage.id} className="border-b border-gray-300 pb-4 last:border-0">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Customer:</span>
                  <span className="ml-2 text-zinc-950 font-medium">{usage.user.firstName} {usage.user.lastName}</span>
                </div>
                <div>
                  <span className="text-gray-500">Email:</span>
                  <span className="ml-2 text-gray-900">{usage.user.email}</span>
                </div>
                <div>
                  <span className="text-gray-500">Start Date:</span>
                  <span className="ml-2 text-gray-900">{new Date(usage.usageStartDate).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-gray-500">End Date:</span>
                  <span className="ml-2 text-gray-900">{usage.usageEndDate ? new Date(usage.usageEndDate).toLocaleDateString() : 'Active'}</span>
                </div>
                {usage.warehouseLocation && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Warehouse Location:</span>
                    <span className="ml-2 text-gray-900">{usage.warehouseLocation}</span>
                  </div>
                )}
                {usage.description && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Description:</span>
                    <p className="mt-1 text-gray-900">{usage.description}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (selectedRecordType === 'accessRequests') {
      return (
        <div className="space-y-4">
          {selectedUnit.accessRequests.map((request) => (
            <div key={request.id} className="border-b border-gray-300 pb-4 last:border-0">
              <div className="text-sm">
                <span className="text-gray-500">Customer:</span>
                <span className="ml-2 text-zinc-950 font-medium">{request.appointment.user.firstName} {request.appointment.user.lastName}</span>
              </div>
              <div className="text-sm mt-2">
                <span className="text-gray-500">Email:</span>
                <span className="ml-2 text-zinc-950">{request.appointment.user.email}</span>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  // Filter dropdown configuration
  const actionFilters = [
    { id: 'pending_cleaning', label: 'Pending Cleaning', checked: filterPendingCleaning },
  ];

  return (
    <>
      {/* Header with Controls */}
      <AdminPageHeader title="Storage Units">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search units..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-zinc-950 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 font-semibold"
          />
        </div>

        {/* Upload CSV Button */}
        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center text-sm gap-x-1.5 rounded-md bg-white px-3 py-2.5 font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          aria-label="Upload CSV batch file"
        >
          Upload CSV
        </button>

        {/* Action Filter */}
        <FilterDropdown
          label="Actions"
          filters={actionFilters}
          isOpen={showFilterMenu}
          onToggle={() => {
            setShowFilterMenu(!showFilterMenu);
            setShowColumnMenu(false);
          }}
          onToggleFilter={() => setFilterPendingCleaning(!filterPendingCleaning)}
          onToggleAll={() => setFilterPendingCleaning(false)}
          allSelected={!filterPendingCleaning}
          allLabel="All Units"
        />

        {/* Column Manager */}
        <ColumnManagerDropdown
          columns={columns}
          isOpen={showColumnMenu}
          onToggle={() => {
            setShowColumnMenu(!showColumnMenu);
            setShowFilterMenu(false);
          }}
          onToggleColumn={toggleColumn}
        />
      </AdminPageHeader>

      {/* Table */}
      <div>
        <AdminTable
          columns={columns}
          data={processedUnits}
          sortConfig={sortConfig}
          onSort={handleSort}
          loading={loading}
          error={error}
          emptyMessage="No storage units found"
          onRetry={fetchData}
          renderRow={(unit) => (
            <tr key={unit.id} className="hover:bg-slate-50">
              {columns
                .filter((c) => c.visible)
                .map((column) => (
                  <td key={column.id} className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                    {renderCellContent(unit, column)}
                  </td>
                ))}
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-right sm:pr-6">
                {unit.status === 'Pending Cleaning' && (
                  <AdminActionButton
                    variant="red"
                    onClick={() => {
                      setSelectedUnit(unit);
                      setShowCleanModal(true);
                    }}
                    aria-label={`Mark unit ${unit.storageUnitNumber} as clean`}
                  >
                    Mark Clean
                  </AdminActionButton>
                )}
              </td>
            </tr>
          )}
        />
      </div>

      {/* Detail Modal */}
      <AdminDetailModal isOpen={showViewModal} onClose={() => { setShowViewModal(false); setSelectedUnit(null); setSelectedRecordType(null); }} title={selectedRecordType === 'usageRecords' ? 'Usage History' : selectedRecordType === 'accessRequests' ? 'Access Requests' : ''} data={selectedUnit && selectedRecordType ? selectedUnit[selectedRecordType === 'usageRecords' ? 'storageUnitUsages' : 'accessRequests'] : null} renderContent={renderModalContent} size="lg" />

      {/* Photo Viewer Modal */}
      {selectedUnit && getCurrentUsage(selectedUnit)?.mainImage && (
        <PhotoViewerModal isOpen={showPhotoModal} onClose={() => { setShowPhotoModal(false); setSelectedUnit(null); }} photos={[getCurrentUsage(selectedUnit)!.mainImage!]} currentIndex={0} onNavigate={() => {}} title={`Unit ${selectedUnit.storageUnitNumber} Photo`} />
      )}

      {/* Mark Clean Confirmation Modal */}
      <Modal open={showCleanModal} onClose={() => { setShowCleanModal(false); setSelectedUnit(null); }} title="Mark Unit as Clean" size="sm">
        <div className="space-y-4">
          <p className="text-gray-900">
            Are you sure you want to mark unit <strong>{selectedUnit?.storageUnitNumber}</strong> as clean? This will change the status from "Pending Cleaning" to "Empty".
          </p>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => { setShowCleanModal(false); setSelectedUnit(null); }} className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Cancel</button>
            <button type="button" onClick={handleMarkClean} className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Mark Clean</button>
          </div>
        </div>
      </Modal>

      {/* Edit Warehouse Modal */}
      <Modal open={showEditModal} onClose={() => { setShowEditModal(false); setSelectedUnit(null); setEditField(null); setEditValue(''); }} title={`Edit ${editField === 'warehouseLocation' ? 'Warehouse Location' : 'Warehouse Name'}`} size="md">
        <div className="space-y-4">
          <div className="form-group">
            <label htmlFor="editValue" className="form-label">{editField === 'warehouseLocation' ? 'Warehouse Location' : 'Warehouse Name'}</label>
            <input type="text" id="editValue" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" placeholder={`Enter ${editField === 'warehouseLocation' ? 'location' : 'name'}`} />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => { setShowEditModal(false); setSelectedUnit(null); setEditField(null); setEditValue(''); }} className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Cancel</button>
            <button type="button" onClick={handleEditSave} className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Save</button>
          </div>
        </div>
      </Modal>

      {/* CSV Upload Modal */}
      <Modal open={showUploadModal} onClose={() => { setShowUploadModal(false); setUploadError(null); setUploadSuccess(null); }} title="Upload Storage Units CSV" size="md">
        <div className="space-y-4">
          <p className="text-gray-500 text-sm">Upload a CSV file to batch import storage units. The file should include columns for unit number and barcode.</p>
          <div className="form-group">
            <label htmlFor="csvFile" className="form-label">Select CSV File</label>
            <input type="file" id="csvFile" accept=".csv" onChange={handleFileUpload} disabled={isUploading} className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
          </div>
          {uploadError && <div className="p-3 rounded bg-red-50 text-red-600 text-sm" role="alert">{uploadError}</div>}
          {uploadSuccess && <div className="p-3 rounded bg-green-50 text-green-600 text-sm" role="alert">{uploadSuccess}</div>}
          {isUploading && <div className="p-3 rounded bg-slate-100 text-gray-500 text-sm text-center">Uploading...</div>}
          <div className="flex justify-end">
            <button type="button" onClick={() => { setShowUploadModal(false); setUploadError(null); setUploadSuccess(null); }} className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Close</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
