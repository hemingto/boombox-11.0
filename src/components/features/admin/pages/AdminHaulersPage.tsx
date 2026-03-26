'use client';

import React, { useState, useMemo, useEffect } from 'react';
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

interface HaulingPartner {
  id: number;
  name: string;
  email: string;
  phoneNumber: string | null;
  website: string | null;
  description: string | null;
  numberOfEmployees: string | null;
  priceSsfToStockton: number | null;
  priceStocktonToSsf: number | null;
  trailerUnitCapacity: number;
  onfleetTeamId: string | null;
  isApproved: boolean;
  applicationComplete: boolean;
  status: string;
  vehicles: {
    id: number;
    make: string;
    model: string;
    year: string;
    licensePlate: string;
    vehicleCategory: string | null;
    vehicleType: string | null;
    unitCapacity: number | null;
  }[];
  drivers: {
    id: number;
    driver: {
      firstName: string;
      lastName: string;
      email: string;
    };
    isActive: boolean;
  }[];
  haulJobs: {
    id: number;
    jobCode: string;
    status: string;
  }[];
}

type ColumnId =
  | 'name'
  | 'email'
  | 'phoneNumber'
  | 'status'
  | 'isApproved'
  | 'applicationComplete'
  | 'priceSsfToStockton'
  | 'priceStocktonToSsf'
  | 'trailerUnitCapacity'
  | 'vehicles'
  | 'drivers'
  | 'haulJobs'
  | 'action';

type RecordType = 'vehicles' | 'drivers' | 'haulJobs';

const defaultColumns: Column<ColumnId>[] = [
  { id: 'name', label: 'Name', visible: true },
  { id: 'email', label: 'Email', visible: true },
  { id: 'phoneNumber', label: 'Phone', visible: true },
  { id: 'status', label: 'Status', visible: true },
  { id: 'isApproved', label: 'Approved', visible: true },
  { id: 'action', label: 'Action', visible: true },
  { id: 'applicationComplete', label: 'App Complete', visible: false },
  { id: 'priceSsfToStockton', label: 'SSF → Stockton', visible: false },
  { id: 'priceStocktonToSsf', label: 'Stockton → SSF', visible: false },
  { id: 'trailerUnitCapacity', label: 'Capacity', visible: false },
  { id: 'vehicles', label: 'Vehicles', visible: false },
  { id: 'drivers', label: 'Drivers', visible: false },
  { id: 'haulJobs', label: 'Haul Jobs', visible: false },
];

export function AdminHaulersPage() {
  const [haulers, setHaulers] = useState<HaulingPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [columns, setColumns] = useState<Column<ColumnId>[]>(defaultColumns);
  const [sortConfig, setSortConfig] = useState<{
    column: ColumnId | null;
    direction: 'asc' | 'desc';
  }>({
    column: null,
    direction: 'asc',
  });
  const [searchQuery, setSearchQuery] = useState('');

  const [actionFilters, setActionFilters] = useState({
    approve_haulers: false,
  });
  const [showActionsFilter, setShowActionsFilter] = useState(false);
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const [selectedHauler, setSelectedHauler] = useState<HaulingPartner | null>(
    null
  );
  const [showViewModal, setShowViewModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedRecordType, setSelectedRecordType] =
    useState<RecordType | null>(null);

  useEffect(() => {
    fetchHaulers();
  }, []);

  const fetchHaulers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/hauling-partners');
      if (!response.ok) throw new Error('Failed to fetch hauling partners');
      const data = await response.json();
      setHaulers(data.haulers);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const toggleColumn = (columnId: ColumnId) => {
    setColumns(prev =>
      prev.map(col =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const handleSort = (columnId: ColumnId) => {
    setSortConfig(prev => ({
      column: columnId,
      direction:
        prev.column === columnId && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const toggleActionFilter = (filterId: string) => {
    setActionFilters(prev => ({
      ...prev,
      [filterId]: !prev[filterId as keyof typeof prev],
    }));
  };

  const toggleAllActionFilters = () => {
    const allActive = Object.values(actionFilters).every(v => v);
    setActionFilters({ approve_haulers: !allActive });
  };

  const allActionFiltersSelected = Object.values(actionFilters).every(v => v);

  const actionFilterItems = [
    {
      id: 'approve_haulers',
      label: 'Approve Hauling Partners',
      checked: actionFilters.approve_haulers,
    },
  ];

  const filteredAndSortedHaulers = useMemo(() => {
    let result = [...haulers];

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        h =>
          h.name.toLowerCase().includes(lowerQuery) ||
          h.email.toLowerCase().includes(lowerQuery) ||
          (h.phoneNumber && h.phoneNumber.includes(searchQuery))
      );
    }

    if (actionFilters.approve_haulers) {
      result = result.filter(h => !h.isApproved);
    }

    if (sortConfig.column) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.column as keyof HaulingPartner];
        const bValue = b[sortConfig.column as keyof HaulingPartner];
        if (aValue === null || aValue === undefined)
          return sortConfig.direction === 'asc' ? -1 : 1;
        if (bValue === null || bValue === undefined)
          return sortConfig.direction === 'asc' ? 1 : -1;
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [haulers, searchQuery, actionFilters, sortConfig]);

  const handleViewRecord = (hauler: HaulingPartner, recordType: RecordType) => {
    setSelectedHauler(hauler);
    setSelectedRecordType(recordType);
    setShowViewModal(true);
  };

  const handleApproveHauler = (hauler: HaulingPartner) => {
    setSelectedHauler(hauler);
    setShowApproveModal(true);
  };

  const handleApproveConfirm = async () => {
    if (!selectedHauler) return;
    try {
      const response = await fetch(
        `/api/admin/hauling-partners/${selectedHauler.id}/approve`,
        {
          method: 'POST',
        }
      );
      if (!response.ok) throw new Error('Failed to approve hauling partner');
      await fetchHaulers();
      setShowApproveModal(false);
      setSelectedHauler(null);
    } catch (err) {
      console.error('Error approving hauling partner:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-emerald-700 bg-emerald-50';
      case 'PENDING':
        return 'text-amber-700 bg-amber-50';
      case 'INACTIVE':
        return 'text-gray-700 bg-gray-50';
      case 'SUSPENDED':
        return 'text-red-700 bg-red-50';
      default:
        return 'text-gray-700 bg-gray-50';
    }
  };

  const renderCellContent = (
    hauler: HaulingPartner,
    column: Column<ColumnId>
  ): React.ReactNode => {
    switch (column.id) {
      case 'phoneNumber':
        return hauler.phoneNumber
          ? formatPhoneNumberForDisplay(hauler.phoneNumber)
          : '-';

      case 'status':
        return (
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(hauler.status)}`}
          >
            {hauler.status}
          </span>
        );

      case 'isApproved':
      case 'applicationComplete':
        return <AdminBooleanBadge value={hauler[column.id]} />;

      case 'priceSsfToStockton':
        return hauler.priceSsfToStockton != null
          ? `$${hauler.priceSsfToStockton}`
          : '-';

      case 'priceStocktonToSsf':
        return hauler.priceStocktonToSsf != null
          ? `$${hauler.priceStocktonToSsf}`
          : '-';

      case 'action':
        return !hauler.isApproved ? (
          <AdminActionButton
            variant="green"
            onClick={() => handleApproveHauler(hauler)}
          >
            Approve
          </AdminActionButton>
        ) : null;

      case 'vehicles':
      case 'drivers':
      case 'haulJobs': {
        const records = hauler[column.id];
        return records?.length > 0 ? (
          <AdminActionButton
            variant="indigo"
            onClick={() => handleViewRecord(hauler, column.id)}
          >
            View ({records.length})
          </AdminActionButton>
        ) : (
          '-'
        );
      }

      default: {
        const value = hauler[column.id as keyof HaulingPartner];
        return typeof value === 'string' || typeof value === 'number'
          ? value
          : '-';
      }
    }
  };

  const renderModalContent = () => {
    if (!selectedHauler || !selectedRecordType) return null;

    if (selectedRecordType === 'vehicles') {
      return (
        <div className="space-y-4">
          {selectedHauler.vehicles.map(vehicle => (
            <div
              key={vehicle.id}
              className="border-b border-gray-300 pb-4 last:border-0"
            >
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
                  <span className="text-gray-500">Category:</span>
                  <span className="ml-2 text-gray-900">
                    {vehicle.vehicleCategory || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Type:</span>
                  <span className="ml-2 text-gray-900">
                    {vehicle.vehicleType || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Unit Capacity:</span>
                  <span className="ml-2 text-gray-900">
                    {vehicle.unitCapacity || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">License Plate:</span>
                  <span className="ml-2 text-gray-900">
                    {vehicle.licensePlate}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (selectedRecordType === 'drivers') {
      return (
        <div className="space-y-4">
          {selectedHauler.drivers.map(assoc => (
            <div
              key={assoc.id}
              className="border-b border-border pb-4 last:border-0"
            >
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Driver:</span>
                  <span className="ml-2 text-text-primary font-medium">
                    {assoc.driver.firstName} {assoc.driver.lastName}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Email:</span>
                  <span className="ml-2 text-gray-900">
                    {assoc.driver.email}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Active:</span>
                  <span className="ml-2 text-gray-900">
                    {assoc.isActive ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (selectedRecordType === 'haulJobs') {
      return (
        <div className="space-y-4">
          {selectedHauler.haulJobs.map(job => (
            <div
              key={job.id}
              className="border-b border-border pb-4 last:border-0"
            >
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Job Code:</span>
                  <span className="ml-2 text-text-primary font-medium">
                    {job.jobCode}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className="ml-2 text-gray-900">{job.status}</span>
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
      <AdminPageHeader title="Hauling Partners">
        <div className="relative">
          <input
            type="text"
            placeholder="Search hauling partners..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
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
          onToggleFilter={id => toggleActionFilter(id)}
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

      <AdminTable
        columns={columns.map(col => ({
          ...col,
          sortable: col.id !== 'action',
        }))}
        data={filteredAndSortedHaulers}
        sortConfig={sortConfig}
        onSort={handleSort}
        loading={loading}
        error={error?.message ?? null}
        emptyMessage="No hauling partners found"
        onRetry={fetchHaulers}
        renderRow={hauler => (
          <tr key={hauler.id} className="hover:bg-slate-50">
            {columns
              .filter(c => c.visible)
              .map(column => (
                <td
                  key={column.id}
                  className="whitespace-nowrap px-3 py-4 text-sm text-gray-900"
                >
                  {renderCellContent(hauler, column)}
                </td>
              ))}
          </tr>
        )}
      />

      <AdminDetailModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedHauler(null);
          setSelectedRecordType(null);
        }}
        title={
          selectedRecordType === 'vehicles'
            ? 'Hauling Partner Vehicles'
            : selectedRecordType === 'drivers'
              ? 'Hauling Partner Drivers'
              : 'Hauling Partner Jobs'
        }
        data={
          selectedHauler && selectedRecordType
            ? selectedHauler[selectedRecordType]
            : null
        }
        renderContent={renderModalContent}
        size="lg"
      />

      <Modal
        open={showApproveModal}
        onClose={() => {
          setShowApproveModal(false);
          setSelectedHauler(null);
        }}
        title="Approve Hauling Partner"
        size="md"
      >
        <div className="space-y-12">
          <p className="text-gray-900">
            Are you sure you want to approve{' '}
            <strong>{selectedHauler?.name}</strong>? This will create a
            dedicated Onfleet team for this hauling partner.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => {
                setShowApproveModal(false);
                setSelectedHauler(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="approve"
              size="md"
              onClick={handleApproveConfirm}
            >
              Approve Hauling Partner
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
