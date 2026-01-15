/**
 * @fileoverview Admin vehicles management page component
 * @source boombox-10.0/src/app/admin/vehicles/page.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Complete vehicle management interface:
 * - Lists all vehicles with sortable columns
 * - Search vehicles by make, model, year, license plate
 * - Toggle column visibility
 * - View vehicle owners (driver or moving partner)
 * - Approve pending vehicles
 * - View vehicle photos (insurance, front, back)
 * - Sortable by all columns
 * 
 * DESIGN:
 * - Uses gold standard admin components
 * - AdminPageHeader with filters
 * - AdminTable with skeleton loading
 * - AdminActionButton and AdminBooleanBadge
 * - Headless UI Dialog for modals
 * 
 * API ROUTES:
 * - GET /api/admin/vehicles - Fetches all vehicles
 * - POST /api/admin/vehicles/[id]/approve - Approves vehicle
 * 
 * @refactor Refactored to use gold standard admin components
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import Image from 'next/image';
import { formatPhoneNumberForDisplay } from '@/lib/utils/phoneUtils';
import { AdminTable } from '@/components/features/admin/shared/table/AdminTable';
import { AdminActionButton } from '@/components/features/admin/shared/buttons/AdminActionButton';
import { AdminBooleanBadge } from '@/components/features/admin/shared/buttons/AdminBooleanBadge';
import { FilterDropdown } from '@/components/features/admin/shared/filters/FilterDropdown';
import { ColumnManagerDropdown } from '@/components/features/admin/shared/filters/ColumnManagerDropdown';
import { AdminPageHeader } from '@/components/features/admin/shared/filters/AdminPageHeader';

interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: string;
  licensePlate: string;
  isApproved: boolean;
  autoInsurancePhoto: string | null;
  hasTrailerHitch: boolean;
  frontVehiclePhoto: string | null;
  backVehiclePhoto: string | null;
  driver: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string | null;
  } | null;
  movingPartner: {
    id: number;
    name: string;
    email: string | null;
    phoneNumber: string | null;
  } | null;
}

type ColumnId =
  | 'make'
  | 'model'
  | 'year'
  | 'licensePlate'
  | 'isApproved'
  | 'hasTrailerHitch'
  | 'autoInsurancePhoto'
  | 'frontVehiclePhoto'
  | 'backVehiclePhoto'
  | 'driver'
  | 'movingPartner'
  | 'driverName'
  | 'moverName';

type RecordType = 'driver' | 'movingPartner';

interface Column {
  id: ColumnId;
  label: string;
  visible: boolean;
}

type SortConfig = {
  column: ColumnId | null;
  direction: 'asc' | 'desc';
};

const allColumns: Column[] = [
  { id: 'make', label: 'Make', visible: true },
  { id: 'model', label: 'Model', visible: true },
  { id: 'year', label: 'Year', visible: true },
  { id: 'licensePlate', label: 'License Plate', visible: true },
  { id: 'isApproved', label: 'Approved', visible: true },
  { id: 'autoInsurancePhoto', label: 'Insurance Photo', visible: true },
  { id: 'frontVehiclePhoto', label: 'Front Photo', visible: true },
  { id: 'backVehiclePhoto', label: 'Back Photo', visible: true },
  { id: 'hasTrailerHitch', label: 'Has Trailer Hitch', visible: false },
  { id: 'driverName', label: 'Driver Name', visible: false },
  { id: 'moverName', label: 'Mover Name', visible: false },
  { id: 'driver', label: 'Driver Record', visible: false },
  { id: 'movingPartner', label: 'Mover Record', visible: false },
];

/**
 * AdminVehiclesPage - Vehicle management interface
 * 
 * @example
 * ```tsx
 * // Used in: src/app/(dashboard)/admin/vehicles/page.tsx
 * <AdminVehiclesPage />
 * ```
 */
export function AdminVehiclesPage() {
  // State management
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [columns, setColumns] = useState<Column[]>(allColumns);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [showActionsFilter, setShowActionsFilter] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string>('');
  const [selectedRecordType, setSelectedRecordType] = useState<RecordType | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: null, direction: 'asc' });
  const [actionFilters, setActionFilters] = useState<Record<string, boolean>>({
    approve_vehicles: false,
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch vehicles
  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/admin/vehicles');
      if (!response.ok) throw new Error('Failed to fetch vehicles');
      const data = await response.json();
      setVehicles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Sorting
  const handleSort = (column: ColumnId) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.column === column && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ column, direction });
  };

  const getSortValue = (vehicle: Vehicle, column: ColumnId) => {
    switch (column) {
      case 'make':
      case 'model':
      case 'year':
      case 'licensePlate':
        return vehicle[column].toLowerCase();
      case 'driver':
      case 'driverName':
        return vehicle.driver ? `${vehicle.driver.firstName} ${vehicle.driver.lastName}`.toLowerCase() : '';
      case 'movingPartner':
      case 'moverName':
        return vehicle.movingPartner?.name.toLowerCase() || '';
      case 'isApproved':
      case 'hasTrailerHitch':
        return vehicle[column] ? 'true' : 'false';
      default:
        return '';
    }
  };

  const getSortedVehicles = (vehicles: Vehicle[]) => {
    if (!sortConfig.column) return vehicles;

    const sortColumn = sortConfig.column;
    return [...vehicles].sort((a, b) => {
      const aValue = getSortValue(a, sortColumn);
      const bValue = getSortValue(b, sortColumn);

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Filtering
  const filteredVehicles = vehicles
    .filter((vehicle) => {
      if (actionFilters.approve_vehicles) {
        return !vehicle.isApproved;
      }
      return true;
    })
    .filter((vehicle) => {
      if (!searchQuery) return true;
      const searchLower = searchQuery.toLowerCase();
      return (
        vehicle.make.toLowerCase().includes(searchLower) ||
        vehicle.model.toLowerCase().includes(searchLower) ||
        vehicle.year.toLowerCase().includes(searchLower) ||
        vehicle.licensePlate.toLowerCase().includes(searchLower) ||
        vehicle.driver?.firstName.toLowerCase().includes(searchLower) ||
        vehicle.driver?.lastName.toLowerCase().includes(searchLower) ||
        vehicle.driver?.email.toLowerCase().includes(searchLower) ||
        vehicle.movingPartner?.name.toLowerCase().includes(searchLower) ||
        vehicle.movingPartner?.email?.toLowerCase().includes(searchLower)
      );
    });

  const sortedVehicles = getSortedVehicles(filteredVehicles);

  // Actions
  const toggleColumn = (columnId: ColumnId) => {
    setColumns((prev) => prev.map((col) => (col.id === columnId ? { ...col, visible: !col.visible } : col)));
  };

  const toggleActionFilter = (action: string) => {
    setActionFilters((prev) => ({
      ...prev,
      [action]: !prev[action],
    }));
  };

  const handleApproveVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowApproveModal(true);
  };

  const handleApproveConfirm = async () => {
    if (!selectedVehicle) return;

    try {
      const response = await fetch(`/api/admin/vehicles/${selectedVehicle.id}/approve`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to approve vehicle');

      await fetchVehicles();
      setShowApproveModal(false);
      setSelectedVehicle(null);
    } catch (err) {
      console.error('Error approving vehicle:', err);
    }
  };

  const handleViewPhoto = (photoUrl: string) => {
    setSelectedPhotoUrl(photoUrl);
    setShowPhotoModal(true);
  };

  const handleViewRecord = (vehicle: Vehicle, recordType: RecordType) => {
    setSelectedVehicle(vehicle);
    setSelectedRecordType(recordType);
    setShowViewModal(true);
  };

  // Convert action filters to FilterDropdown format
  const actionFilterItems = [
    { id: 'approve_vehicles', label: 'Approve Vehicles', checked: actionFilters.approve_vehicles },
  ];

  return (
    <div>
      <AdminPageHeader title="Vehicles">
        <div className="relative">
          <input
            type="text"
            placeholder="Search vehicles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-zinc-950 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 font-semibold"
          />
        </div>
        <FilterDropdown
          label="Actions"
          filters={actionFilterItems}
          isOpen={showActionsFilter}
          onToggle={() => {
            setShowActionsFilter(!showActionsFilter);
            setShowColumnMenu(false);
          }}
          onToggleFilter={(id) => toggleActionFilter(id)}
          onToggleAll={() => toggleActionFilter('approve_vehicles')}
          allSelected={actionFilters.approve_vehicles}
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

      <AdminTable
        columns={[...columns, { id: 'actions' as ColumnId, label: 'Actions', visible: true }].map(col => ({
          ...col,
          sortable: ['make', 'model', 'year', 'licensePlate', 'driverName', 'moverName'].includes(col.id)
        }))}
        data={sortedVehicles}
        sortConfig={sortConfig}
        onSort={handleSort}
        loading={loading}
        error={error}
        emptyMessage="No vehicles found"
        onRetry={fetchVehicles}
        renderRow={(vehicle) => (
          <tr key={vehicle.id} className="hover:bg-gray-50">
            {columns.map((column) => {
              if (!column.visible) return null;

              let content: React.ReactNode = '-';

              if (column.id === 'isApproved') {
                content = <AdminBooleanBadge value={vehicle.isApproved} />;
              } else if (column.id === 'hasTrailerHitch') {
                content = vehicle.hasTrailerHitch ? 'Yes' : 'No';
              } else if (column.id === 'autoInsurancePhoto' || column.id === 'frontVehiclePhoto' || column.id === 'backVehiclePhoto') {
                const photoUrl = vehicle[column.id];
                content = photoUrl ? (
                  <AdminActionButton variant="indigo" onClick={() => handleViewPhoto(photoUrl)}>
                    View Photo
                  </AdminActionButton>
                ) : '-';
              } else if (column.id === 'driver') {
                content = vehicle.driver ? (
                  <AdminActionButton variant="indigo" onClick={() => handleViewRecord(vehicle, 'driver')}>
                    View Record
                  </AdminActionButton>
                ) : '-';
              } else if (column.id === 'movingPartner') {
                content = vehicle.movingPartner ? (
                  <AdminActionButton variant="indigo" onClick={() => handleViewRecord(vehicle, 'movingPartner')}>
                    View Record
                  </AdminActionButton>
                ) : '-';
              } else if (column.id === 'driverName') {
                content = vehicle.driver ? `${vehicle.driver.firstName} ${vehicle.driver.lastName}` : '-';
              } else if (column.id === 'moverName') {
                content = vehicle.movingPartner?.name || '-';
              } else {
                const value = vehicle[column.id as keyof Vehicle];
                content = value != null ? String(value) : '-';
              }

              return (
                <td key={column.id} className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                  {content}
                </td>
              );
            })}
            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
              {!vehicle.isApproved && (
                <AdminActionButton variant="green" onClick={() => handleApproveVehicle(vehicle)}>
                  Approve
                </AdminActionButton>
              )}
            </td>
          </tr>
        )}
      />

      {/* Approve Modal */}
      <Dialog open={showApproveModal} onClose={() => setShowApproveModal(false)} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-black bg-opacity-50" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white rounded-lg p-6 max-w-md w-full">
            <DialogTitle className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Approve Vehicle
            </DialogTitle>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to approve this vehicle: {selectedVehicle?.make} {selectedVehicle?.model} (
              {selectedVehicle?.licensePlate})?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowApproveModal(false)}
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveConfirm}
                className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:ml-3 sm:w-auto"
              >
                Approve
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* View Record Modal */}
      <Dialog open={showViewModal} onClose={() => setShowViewModal(false)} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-black bg-opacity-50" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <DialogTitle className="text-xl font-bold mb-4">
              {selectedRecordType === 'driver' ? 'Driver Details' : 'Moving Partner Details'}
            </DialogTitle>
            <div className="space-y-4">
              {selectedVehicle && selectedRecordType === 'driver' && selectedVehicle.driver && (
                <div className="border p-4 rounded-lg">
                  <p className="font-semibold">Name: {selectedVehicle.driver.firstName} {selectedVehicle.driver.lastName}</p>
                  <p>Email: {selectedVehicle.driver.email}</p>
                  <p>Phone: {selectedVehicle.driver.phoneNumber ? formatPhoneNumberForDisplay(selectedVehicle.driver.phoneNumber) : 'N/A'}</p>
                </div>
              )}

              {selectedVehicle && selectedRecordType === 'movingPartner' && selectedVehicle.movingPartner && (
                <div className="border p-4 rounded-lg">
                  <p className="font-semibold">Name: {selectedVehicle.movingPartner.name}</p>
                  <p>Email: {selectedVehicle.movingPartner.email || 'N/A'}</p>
                  <p>Phone: {selectedVehicle.movingPartner.phoneNumber ? formatPhoneNumberForDisplay(selectedVehicle.movingPartner.phoneNumber) : 'N/A'}</p>
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedRecordType(null);
                }}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Photo Modal */}
      <Dialog open={showPhotoModal} onClose={() => setShowPhotoModal(false)} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-black bg-opacity-50" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <DialogTitle className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Vehicle Photo
            </DialogTitle>
            <div className="relative w-full h-96">
              <Image
                src={selectedPhotoUrl}
                alt="Vehicle photo"
                fill
                className="object-contain"
              />
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowPhotoModal(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
