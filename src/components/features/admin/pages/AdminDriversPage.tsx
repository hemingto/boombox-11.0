/**
 * @fileoverview Admin drivers management page component
 * @source boombox-10.0/src/app/admin/drivers/page.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Complete driver management interface:
 * - Lists all drivers with sortable columns
 * - Search drivers by name, email, phone
 * - Toggle column visibility
 * - View driver vehicles, availability, cancellations, and appointments
 * - Approve pending drivers
 * - View license photos
 * - Sortable by all columns
 * 
 * DESIGN:
 * - Uses boombox-10.0 styling patterns
 * - Indigo-950 header with white text
 * - Direct Tailwind colors (no design system tokens)
 * - Headless UI Dialog for modals
 * 
 * API ROUTES:
 * - GET /api/admin/drivers - Fetches all drivers
 * - POST /api/admin/drivers/[id]/approve - Approves driver
 * 
 * @refactor Migrated to boombox-10.0 styling with shared utilities
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
import { Button } from '@/components/ui/primitives/Button/Button';

interface Driver {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  verifiedPhoneNumber: boolean;
  services: string[];
  isApproved: boolean;
  applicationComplete: boolean;
  onfleetWorkerId: string | null;
  onfleetTeamIds: string[];
  driverLicenseFrontPhoto: string | null;
  driverLicenseBackPhoto: string | null;
  profilePicture: string | null;
  status: string;
  location: string;
  vehicleType: string;
  hasTrailerHitch: boolean;
  consentToBackgroundCheck: boolean;
  movingPartnerAssociations: {
    movingPartner: {
      name: string;
      onfleetTeamId: string | null;
    };
  }[];
  vehicles: {
    id: number;
    make: string;
    model: string;
    year: string;
    licensePlate: string;
    isApproved: boolean;
  }[];
  availability: {
    id: number;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    maxCapacity: number;
    isBlocked: boolean;
  }[];
  cancellations: {
    id: number;
    reason: string;
    createdAt: string;
  }[];
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
}

type ColumnId =
  | 'profilePicture'
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phoneNumber'
  | 'services'
  | 'movingPartner'
  | 'status'
  | 'location'
  | 'vehicleType'
  | 'hasTrailerHitch'
  | 'consentToBackgroundCheck'
  | 'vehicles'
  | 'availability'
  | 'cancellations'
  | 'appointments'
  | 'isApproved'
  | 'applicationComplete'
  | 'onfleetWorkerId'
  | 'onfleetTeamIds'
  | 'driverLicenseFrontPhoto'
  | 'driverLicenseBackPhoto';

type RecordType = 'vehicles' | 'availability' | 'cancellations' | 'appointments';

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
  { id: 'profilePicture', label: 'Photo', visible: true },
  { id: 'firstName', label: 'First Name', visible: true },
  { id: 'lastName', label: 'Last Name', visible: true },
  { id: 'email', label: 'Email', visible: true },
  { id: 'phoneNumber', label: 'Phone', visible: true },
  { id: 'services', label: 'Services', visible: true },
  { id: 'movingPartner', label: 'Moving Partner', visible: true },
  { id: 'vehicles', label: 'Vehicles', visible: true },
  { id: 'availability', label: 'Availability', visible: true },
  { id: 'cancellations', label: 'Cancellations', visible: true },
  { id: 'appointments', label: 'Appointments', visible: true },
  { id: 'status', label: 'Status', visible: false },
  { id: 'location', label: 'Location', visible: false },
  { id: 'vehicleType', label: 'Vehicle Type', visible: false },
  { id: 'hasTrailerHitch', label: 'Has Trailer Hitch', visible: false },
  { id: 'consentToBackgroundCheck', label: 'BG Check', visible: false },
  { id: 'isApproved', label: 'Approved', visible: false },
  { id: 'applicationComplete', label: 'App Complete', visible: false },
  { id: 'onfleetWorkerId', label: 'Onfleet Worker ID', visible: false },
  { id: 'onfleetTeamIds', label: 'Onfleet Teams', visible: false },
  { id: 'driverLicenseFrontPhoto', label: 'License Front', visible: false },
  { id: 'driverLicenseBackPhoto', label: 'License Back', visible: false },
];

/**
 * AdminDriversPage - Driver management interface
 */
export function AdminDriversPage() {
  // State management
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [columns, setColumns] = useState<Column[]>(allColumns);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [showActionsFilter, setShowActionsFilter] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string>('');
  const [selectedRecordType, setSelectedRecordType] = useState<RecordType | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: null, direction: 'asc' });
  const [actionFilters, setActionFilters] = useState<Record<string, boolean>>({
    approve_drivers: false,
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch drivers
  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/admin/drivers');
      if (!response.ok) throw new Error('Failed to fetch drivers');
      const data = await response.json();
      setDrivers(data);
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

  const getSortValue = (driver: Driver, column: ColumnId): any => {
    switch (column) {
      case 'firstName':
      case 'lastName':
      case 'email':
      case 'status':
      case 'location':
      case 'vehicleType':
        return driver[column]?.toLowerCase() || '';
      case 'movingPartner':
        return driver.movingPartnerAssociations[0]?.movingPartner?.name?.toLowerCase() || '';
      case 'services':
        return driver.services.join(',').toLowerCase();
      case 'isApproved':
      case 'applicationComplete':
      case 'hasTrailerHitch':
      case 'consentToBackgroundCheck':
        return driver[column] ? 'true' : 'false';
      default:
        return '';
    }
  };

  const getSortedDrivers = (drivers: Driver[]) => {
    if (!sortConfig.column) return drivers;

    const sortColumn = sortConfig.column;
    return [...drivers].sort((a, b) => {
      const aValue = getSortValue(a, sortColumn);
      const bValue = getSortValue(b, sortColumn);

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Filtering
  const filteredDrivers = drivers
    .filter((driver) => {
      if (actionFilters.approve_drivers) {
        return !driver.isApproved;
      }
      return true;
    })
    .filter((driver) => {
      if (!searchQuery) return true;
      const searchLower = searchQuery.toLowerCase();
      return (
        driver.firstName.toLowerCase().includes(searchLower) ||
        driver.lastName.toLowerCase().includes(searchLower) ||
        driver.email.toLowerCase().includes(searchLower) ||
        driver.phoneNumber?.toLowerCase().includes(searchLower)
      );
    });

  const sortedDrivers = getSortedDrivers(filteredDrivers);

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

  const handleApproveDriver = (driver: Driver) => {
    setSelectedDriver(driver);
    setShowApproveModal(true);
  };

  const handleApproveConfirm = async () => {
    if (!selectedDriver) return;

    try {
      const response = await fetch(`/api/admin/drivers/${selectedDriver.id}/approve`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to approve driver');

      await fetchDrivers();
      setShowApproveModal(false);
      setSelectedDriver(null);
    } catch (err) {
      console.error('Error approving driver:', err);
    }
  };

  const handleViewPhoto = (photoUrl: string) => {
    setSelectedPhotoUrl(photoUrl);
    setShowPhotoModal(true);
  };

  const handleViewRecord = (driver: Driver, recordType: RecordType) => {
    setSelectedDriver(driver);
    setSelectedRecordType(recordType);
    setShowViewModal(true);
  };

  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  // Convert action filters to FilterDropdown format
  const actionFilterItems = [
    { id: 'approve_drivers', label: 'Approve Drivers', checked: actionFilters.approve_drivers },
  ];

  return (
    <div>
      <AdminPageHeader title="Drivers">
        <div className="relative">
          <input
            type="text"
            placeholder="Search drivers..."
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
          onToggleAll={() => toggleActionFilter('approve_drivers')}
          allSelected={actionFilters.approve_drivers}
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
          sortable: ['firstName', 'lastName', 'email'].includes(col.id)
        }))}
        data={sortedDrivers}
        sortConfig={sortConfig}
        onSort={handleSort}
        loading={loading}
        error={error}
        emptyMessage="No drivers found"
        onRetry={fetchDrivers}
        renderRow={(driver) => (
          <tr key={driver.id} className="hover:bg-gray-50">
            {columns.map((column) => {
              if (!column.visible) return null;

              let content: React.ReactNode = '-';

              if (column.id === 'profilePicture') {
                content = driver.profilePicture ? (
                  <div className="h-10 w-10 rounded-full overflow-hidden relative">
                    <Image src={driver.profilePicture} alt={`${driver.firstName} ${driver.lastName}`} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                    {driver.firstName[0]}{driver.lastName[0]}
                  </div>
                );
              } else if (column.id === 'phoneNumber') {
                content = driver.phoneNumber ? formatPhoneNumberForDisplay(driver.phoneNumber) : '-';
              } else if (column.id === 'services') {
                content = driver.services?.length > 0 ? driver.services.join(', ') : '-';
              } else if (column.id === 'movingPartner') {
                content = driver.movingPartnerAssociations?.[0]?.movingPartner?.name || '-';
              } else if (column.id === 'isApproved' || column.id === 'applicationComplete') {
                content = <AdminBooleanBadge value={driver[column.id]} />;
              } else if (column.id === 'hasTrailerHitch' || column.id === 'consentToBackgroundCheck') {
                content = driver[column.id] ? 'Yes' : 'No';
              } else if (column.id === 'vehicles' || column.id === 'availability' || column.id === 'cancellations' || column.id === 'appointments') {
                const records = driver[column.id];
                content = records && records.length > 0 ? (
                  <AdminActionButton variant="indigo" onClick={() => handleViewRecord(driver, column.id as RecordType)}>
                    View Records ({records.length})
                  </AdminActionButton>
                ) : '-';
              } else if (column.id === 'driverLicenseFrontPhoto' || column.id === 'driverLicenseBackPhoto') {
                const photoUrl = driver[column.id];
                content = photoUrl ? (
                  <AdminActionButton variant="indigo" onClick={() => handleViewPhoto(photoUrl)}>
                    View Photo
                  </AdminActionButton>
                ) : '-';
              } else if (column.id === 'onfleetTeamIds') {
                content = driver.onfleetTeamIds?.length > 0 ? driver.onfleetTeamIds.join(', ') : '-';
              } else {
                const value = driver[column.id as keyof Driver];
                content = (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') 
                  ? String(value) 
                  : '-';
              }

              return (
                <td key={column.id} className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                  {content}
                </td>
              );
            })}
            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
              {!driver.isApproved && driver.applicationComplete && (
                <AdminActionButton variant="green" onClick={() => handleApproveDriver(driver)}>
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
              Approve Driver
            </DialogTitle>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to approve {selectedDriver?.firstName} {selectedDriver?.lastName}?
            </p>
            <div className="flex justify-end gap-3">
              <Button
                onClick={() => setShowApproveModal(false)}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleApproveConfirm}
                variant="primary"
                size="sm"
              >
                Approve
              </Button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* View Records Modal */}
      <Dialog open={showViewModal} onClose={() => setShowViewModal(false)} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-black bg-opacity-50" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <DialogTitle className="text-xl font-bold mb-4">
              {selectedRecordType === 'vehicles'
                ? 'Driver Vehicles'
                : selectedRecordType === 'availability'
                ? 'Driver Availability'
                : selectedRecordType === 'cancellations'
                ? 'Driver Cancellations'
                : 'Driver Appointments'}
            </DialogTitle>
            <div className="space-y-4">
              {selectedDriver && selectedRecordType === 'vehicles' &&
                selectedDriver.vehicles.map((vehicle) => (
                  <div key={vehicle.id} className="border p-4 rounded-lg">
                    <p className="font-semibold">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </p>
                    <p>License Plate: {vehicle.licensePlate}</p>
                    <p>Approved: {vehicle.isApproved ? 'Yes' : 'No'}</p>
                  </div>
                ))}

              {selectedDriver && selectedRecordType === 'availability' &&
                selectedDriver.availability.map((avail) => (
                  <div 
                    key={avail.id} 
                    className={`border p-4 rounded-lg relative ${
                      avail.isBlocked 
                        ? 'bg-gray-100 border-gray-300 text-gray-500' 
                        : ''
                    }`}
                  >
                    {avail.isBlocked && (
                      <span className="absolute top-4 right-4 inline-flex items-center rounded-full bg-gray-500 px-2 py-1 text-xs font-medium text-white">
                        Blocked
                      </span>
                    )}
                    <p className={`font-semibold ${avail.isBlocked ? 'text-gray-500' : ''}`}>
                      {avail.dayOfWeek}
                    </p>
                    <p className={avail.isBlocked ? 'text-gray-400' : ''}>
                      Time: {avail.startTime} - {avail.endTime}
                    </p>
                    <p className={avail.isBlocked ? 'text-gray-400' : ''}>
                      Max Capacity: {avail.maxCapacity}
                    </p>
                  </div>
                ))}

              {selectedDriver && selectedRecordType === 'cancellations' &&
                selectedDriver.cancellations.map((cancel) => (
                  <div key={cancel.id} className="border p-4 rounded-lg">
                    <p className="font-semibold">Reason: {cancel.reason}</p>
                    <p>Date: {new Date(cancel.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}

              {selectedDriver && selectedRecordType === 'appointments' &&
                selectedDriver.appointments.map((apt) => (
                  <div key={apt.id} className="border p-4 rounded-lg">
                    <p className="font-semibold">Job Code: {apt.jobCode}</p>
                    <p>Status: {apt.status}</p>
                    <p>Date: {new Date(apt.date).toLocaleDateString()}</p>
                    <p>
                      Customer: {apt.user.firstName} {apt.user.lastName}
                    </p>
                  </div>
                ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedRecordType(null);
                }}
                variant="ghost"
                size="sm"
              >
                Close
              </Button>
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
              Driver License Photo
            </DialogTitle>
            <div className="relative w-full h-96">
              <Image src={selectedPhotoUrl} alt="Driver license photo" fill className="object-contain" />
            </div>
            <div className="mt-4 flex justify-end">
              <Button 
                onClick={() => setShowPhotoModal(false)} 
                variant="ghost"
                size="sm"
              >
                Close
              </Button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
