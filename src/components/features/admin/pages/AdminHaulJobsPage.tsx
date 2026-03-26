'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  AdminPageHeader,
  AdminFilterDropdown,
  ColumnManagerDropdown,
  AdminTable,
  AdminActionButton,
  AdminStatusBadge,
  AdminDetailModal,
  type Column,
} from '@/components/features/admin/shared';
import { Button } from '@/components/ui/primitives/Button/Button';
import { Modal } from '@/components/ui/primitives/Modal/Modal';

interface HaulJob {
  id: number;
  jobCode: string;
  type: string;
  status: string;
  scheduledDate: string | null;
  scheduledTime: string | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  originWarehouse: { name: string; city: string };
  destinationWarehouse: { name: string; city: string };
  haulingPartner: { id: number; name: string } | null;
  units: { id: number; storageUnit: { storageUnitNumber: string } }[];
}

interface HaulingPartnerOption {
  id: number;
  name: string;
  email: string;
  isApproved: boolean;
}

interface EligibleUnit {
  id: number;
  storageUnit: { id: number; storageUnitNumber: string };
  user: { firstName: string; lastName: string };
  startAppointment: { storageTerm: string };
}

interface Warehouse {
  id: number;
  name: string;
  city: string;
  state: string;
}

type ColumnId =
  | 'jobCode'
  | 'type'
  | 'status'
  | 'route'
  | 'haulingPartner'
  | 'scheduledDate'
  | 'units'
  | 'action';

const defaultColumns: Column<ColumnId>[] = [
  { id: 'jobCode', label: 'Job Code', visible: true },
  { id: 'type', label: 'Type', visible: true },
  { id: 'status', label: 'Status', visible: true },
  { id: 'route', label: 'Route', visible: true },
  { id: 'haulingPartner', label: 'Hauling Partner', visible: true },
  { id: 'scheduledDate', label: 'Scheduled', visible: true },
  { id: 'units', label: 'Units', visible: true },
  { id: 'action', label: 'Action', visible: true },
];

const statusColorMap: Record<string, string> = {
  PENDING: 'amber',
  SCHEDULED: 'blue',
  IN_TRANSIT: 'indigo',
  UNLOADING: 'purple',
  COMPLETED: 'green',
  CANCELLED: 'red',
};

export function AdminHaulJobsPage() {
  const [jobs, setJobs] = useState<HaulJob[]>([]);
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

  const [statusFilters, setStatusFilters] = useState<Record<string, boolean>>({
    PENDING: false,
    SCHEDULED: false,
    IN_TRANSIT: false,
    COMPLETED: false,
  });
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showUnitsModal, setShowUnitsModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<HaulJob | null>(null);

  const [haulingPartners, setHaulingPartners] = useState<
    HaulingPartnerOption[]
  >([]);
  const [eligibleUnits, setEligibleUnits] = useState<EligibleUnit[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [createForm, setCreateForm] = useState({
    type: 'SSF_TO_STOCKTON' as string,
    originWarehouseId: '',
    destinationWarehouseId: '',
    storageUnitIds: [] as number[],
    haulingPartnerId: '',
    scheduledDate: '',
    scheduledTime: '',
    notes: '',
  });
  const [assignPartnerId, setAssignPartnerId] = useState('');

  useEffect(() => {
    fetchJobs();
    fetchHaulingPartners();
    fetchWarehouses();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/haul-jobs');
      if (!response.ok) throw new Error('Failed to fetch haul jobs');
      const data = await response.json();
      setJobs(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchHaulingPartners = async () => {
    try {
      const response = await fetch('/api/admin/hauling-partners');
      if (response.ok) {
        const data = await response.json();
        setHaulingPartners(
          data.filter((hp: HaulingPartnerOption) => hp.isApproved)
        );
      }
    } catch (err) {
      console.error('Error fetching hauling partners:', err);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/admin/warehouses');
      if (response.ok) {
        const data = await response.json();
        setWarehouses(data.warehouses || []);
      }
    } catch (err) {
      console.error('Error fetching warehouses:', err);
    }
  };

  const fetchEligibleUnits = async () => {
    try {
      const response = await fetch('/api/admin/haul-jobs/eligible-units');
      if (response.ok) {
        const data = await response.json();
        setEligibleUnits(data.units || []);
      }
    } catch (err) {
      console.error('Error fetching eligible units:', err);
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

  const toggleStatusFilter = (filterId: string) => {
    setStatusFilters(prev => ({ ...prev, [filterId]: !prev[filterId] }));
  };

  const toggleAllStatusFilters = () => {
    const allActive = Object.values(statusFilters).every(v => v);
    const newState: Record<string, boolean> = {};
    Object.keys(statusFilters).forEach(k => (newState[k] = !allActive));
    setStatusFilters(newState);
  };

  const allStatusFiltersSelected = Object.values(statusFilters).every(v => v);

  const statusFilterItems = Object.keys(statusFilters).map(key => ({
    id: key,
    label: key.replace('_', ' '),
    checked: statusFilters[key],
  }));

  const filteredAndSortedJobs = useMemo(() => {
    let result = [...jobs];

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        j =>
          j.jobCode.toLowerCase().includes(lowerQuery) ||
          j.haulingPartner?.name.toLowerCase().includes(lowerQuery) ||
          j.originWarehouse.name.toLowerCase().includes(lowerQuery) ||
          j.destinationWarehouse.name.toLowerCase().includes(lowerQuery)
      );
    }

    const activeStatusFilters = Object.entries(statusFilters)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (activeStatusFilters.length > 0) {
      result = result.filter(j => activeStatusFilters.includes(j.status));
    }

    if (sortConfig.column) {
      result.sort((a, b) => {
        let aVal: any, bVal: any;
        if (sortConfig.column === 'route') {
          aVal = a.originWarehouse.name;
          bVal = b.originWarehouse.name;
        } else if (sortConfig.column === 'haulingPartner') {
          aVal = a.haulingPartner?.name || '';
          bVal = b.haulingPartner?.name || '';
        } else {
          aVal = a[sortConfig.column as keyof HaulJob];
          bVal = b[sortConfig.column as keyof HaulJob];
        }
        if (aVal === null || aVal === undefined)
          return sortConfig.direction === 'asc' ? -1 : 1;
        if (bVal === null || bVal === undefined)
          return sortConfig.direction === 'asc' ? 1 : -1;
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [jobs, searchQuery, statusFilters, sortConfig]);

  const handleCreateJob = async () => {
    try {
      const response = await fetch('/api/admin/haul-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          originWarehouseId: parseInt(createForm.originWarehouseId, 10),
          destinationWarehouseId: parseInt(
            createForm.destinationWarehouseId,
            10
          ),
          haulingPartnerId: createForm.haulingPartnerId
            ? parseInt(createForm.haulingPartnerId, 10)
            : undefined,
          scheduledDate: createForm.scheduledDate || undefined,
          scheduledTime: createForm.scheduledTime || undefined,
          notes: createForm.notes || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create haul job');
      }

      await fetchJobs();
      setShowCreateModal(false);
      setCreateForm({
        type: 'SSF_TO_STOCKTON',
        originWarehouseId: '',
        destinationWarehouseId: '',
        storageUnitIds: [],
        haulingPartnerId: '',
        scheduledDate: '',
        scheduledTime: '',
        notes: '',
      });
    } catch (err) {
      console.error('Error creating haul job:', err);
    }
  };

  const handleAssignPartner = async () => {
    if (!selectedJob || !assignPartnerId) return;
    try {
      const response = await fetch(
        `/api/admin/haul-jobs/${selectedJob.id}/assign-partner`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            haulingPartnerId: parseInt(assignPartnerId, 10),
          }),
        }
      );
      if (!response.ok) throw new Error('Failed to assign hauling partner');
      await fetchJobs();
      setShowAssignModal(false);
      setSelectedJob(null);
      setAssignPartnerId('');
    } catch (err) {
      console.error('Error assigning partner:', err);
    }
  };

  const toggleUnitSelection = (unitId: number) => {
    setCreateForm(prev => ({
      ...prev,
      storageUnitIds: prev.storageUnitIds.includes(unitId)
        ? prev.storageUnitIds.filter(id => id !== unitId)
        : [...prev.storageUnitIds, unitId],
    }));
  };

  const renderCellContent = (
    job: HaulJob,
    column: Column<ColumnId>
  ): React.ReactNode => {
    switch (column.id) {
      case 'jobCode':
        return <span className="font-mono font-medium">{job.jobCode}</span>;

      case 'type':
        return (
          <span className="text-xs font-medium">
            {job.type.replace(/_/g, ' ')}
          </span>
        );

      case 'status':
        return (
          <AdminStatusBadge
            status={job.status.replace(/_/g, ' ')}
            color={statusColorMap[job.status] || 'gray'}
          />
        );

      case 'route':
        return (
          <span className="text-sm">
            {job.originWarehouse.city} → {job.destinationWarehouse.city}
          </span>
        );

      case 'haulingPartner':
        return (
          job.haulingPartner?.name || (
            <AdminActionButton
              variant="indigo"
              onClick={() => {
                setSelectedJob(job);
                setShowAssignModal(true);
              }}
            >
              Assign
            </AdminActionButton>
          )
        );

      case 'scheduledDate':
        return job.scheduledDate
          ? new Date(job.scheduledDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : '-';

      case 'units':
        return (
          <AdminActionButton
            variant="indigo"
            onClick={() => {
              setSelectedJob(job);
              setShowUnitsModal(true);
            }}
          >
            {job.units.length} units
          </AdminActionButton>
        );

      case 'action':
        if (job.status === 'PENDING' && !job.haulingPartner) {
          return (
            <AdminActionButton
              variant="green"
              onClick={() => {
                setSelectedJob(job);
                setShowAssignModal(true);
              }}
            >
              Assign Partner
            </AdminActionButton>
          );
        }
        return null;

      default:
        return '-';
    }
  };

  return (
    <div>
      <AdminPageHeader title="Haul Jobs">
        <div className="relative">
          <input
            type="text"
            placeholder="Search haul jobs..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-zinc-950 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 font-semibold"
          />
        </div>
        <AdminFilterDropdown
          label="Status"
          filters={statusFilterItems}
          isOpen={showStatusFilter}
          onToggle={() => {
            setShowStatusFilter(!showStatusFilter);
            setShowColumnMenu(false);
          }}
          onToggleFilter={toggleStatusFilter}
          onToggleAll={toggleAllStatusFilters}
          allSelected={allStatusFiltersSelected}
          allLabel="All Statuses"
        />
        <ColumnManagerDropdown
          columns={columns}
          isOpen={showColumnMenu}
          onToggle={() => {
            setShowColumnMenu(!showColumnMenu);
            setShowStatusFilter(false);
          }}
          onToggleColumn={toggleColumn}
        />
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            fetchEligibleUnits();
            setShowCreateModal(true);
          }}
        >
          Create Haul Job
        </Button>
      </AdminPageHeader>

      <AdminTable
        columns={columns.map(col => ({
          ...col,
          sortable: col.id !== 'action' && col.id !== 'units',
        }))}
        data={filteredAndSortedJobs}
        sortConfig={sortConfig}
        onSort={handleSort}
        loading={loading}
        error={error?.message ?? null}
        emptyMessage="No haul jobs found"
        onRetry={fetchJobs}
        renderRow={job => (
          <tr key={job.id} className="hover:bg-slate-50">
            {columns
              .filter(c => c.visible)
              .map(column => (
                <td
                  key={column.id}
                  className="whitespace-nowrap px-3 py-4 text-sm text-gray-900"
                >
                  {renderCellContent(job, column)}
                </td>
              ))}
          </tr>
        )}
      />

      {/* Create Job Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Haul Job"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="form-label">Job Type</label>
            <select
              value={createForm.type}
              onChange={e =>
                setCreateForm({ ...createForm, type: e.target.value })
              }
              className="input-field"
            >
              <option value="SSF_TO_STOCKTON">SSF → Stockton</option>
              <option value="STOCKTON_TO_SSF">Stockton → SSF</option>
              <option value="STOCKTON_DIRECT_DELIVERY">
                Stockton Direct Delivery
              </option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Origin Warehouse</label>
              <select
                value={createForm.originWarehouseId}
                onChange={e =>
                  setCreateForm({
                    ...createForm,
                    originWarehouseId: e.target.value,
                  })
                }
                className="input-field"
              >
                <option value="">Select origin</option>
                {warehouses.map(wh => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Destination Warehouse</label>
              <select
                value={createForm.destinationWarehouseId}
                onChange={e =>
                  setCreateForm({
                    ...createForm,
                    destinationWarehouseId: e.target.value,
                  })
                }
                className="input-field"
              >
                <option value="">Select destination</option>
                {warehouses.map(wh => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Hauling Partner (optional)</label>
            <select
              value={createForm.haulingPartnerId}
              onChange={e =>
                setCreateForm({
                  ...createForm,
                  haulingPartnerId: e.target.value,
                })
              }
              className="input-field"
            >
              <option value="">Assign later</option>
              {haulingPartners.map(hp => (
                <option key={hp.id} value={hp.id}>
                  {hp.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Scheduled Date</label>
              <input
                type="date"
                value={createForm.scheduledDate}
                onChange={e =>
                  setCreateForm({
                    ...createForm,
                    scheduledDate: e.target.value,
                  })
                }
                className="input-field"
              />
            </div>
            <div>
              <label className="form-label">Scheduled Time</label>
              <input
                type="time"
                value={createForm.scheduledTime}
                onChange={e =>
                  setCreateForm({
                    ...createForm,
                    scheduledTime: e.target.value,
                  })
                }
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="form-label">
              Select Storage Units ({createForm.storageUnitIds.length} selected)
            </label>
            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-1">
              {eligibleUnits.length === 0 ? (
                <p className="text-sm text-gray-500 p-2">
                  No eligible units found
                </p>
              ) : (
                eligibleUnits.map(eu => (
                  <label
                    key={eu.storageUnit.id}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={createForm.storageUnitIds.includes(
                        eu.storageUnit.id
                      )}
                      onChange={() => toggleUnitSelection(eu.storageUnit.id)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <span className="text-sm font-medium">
                      {eu.storageUnit.storageUnitNumber}
                    </span>
                    <span className="text-xs text-gray-500">
                      — {eu.user.firstName} {eu.user.lastName} (
                      {eu.startAppointment?.storageTerm})
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div>
            <label className="form-label">Notes (optional)</label>
            <textarea
              value={createForm.notes}
              onChange={e =>
                setCreateForm({ ...createForm, notes: e.target.value })
              }
              className="input-field"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="ghost"
              size="md"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleCreateJob}
              disabled={
                !createForm.originWarehouseId ||
                !createForm.destinationWarehouseId ||
                createForm.storageUnitIds.length === 0
              }
            >
              Create Haul Job
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign Partner Modal */}
      <Modal
        open={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedJob(null);
          setAssignPartnerId('');
        }}
        title="Assign Hauling Partner"
        size="md"
      >
        <div className="space-y-6">
          <p className="text-gray-900">
            Assign a hauling partner to job{' '}
            <strong>{selectedJob?.jobCode}</strong>
          </p>
          <div>
            <label className="form-label">Hauling Partner</label>
            <select
              value={assignPartnerId}
              onChange={e => setAssignPartnerId(e.target.value)}
              className="input-field"
            >
              <option value="">Select partner</option>
              {haulingPartners.map(hp => (
                <option key={hp.id} value={hp.id}>
                  {hp.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              size="md"
              onClick={() => {
                setShowAssignModal(false);
                setSelectedJob(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleAssignPartner}
              disabled={!assignPartnerId}
            >
              Assign Partner
            </Button>
          </div>
        </div>
      </Modal>

      {/* Units Detail Modal */}
      <AdminDetailModal
        isOpen={showUnitsModal}
        onClose={() => {
          setShowUnitsModal(false);
          setSelectedJob(null);
        }}
        title={`Units in ${selectedJob?.jobCode || ''}`}
        data={selectedJob?.units || []}
        renderContent={() =>
          selectedJob ? (
            <div className="space-y-2">
              {selectedJob.units.map(u => (
                <div
                  key={u.id}
                  className="flex items-center justify-between border-b border-gray-200 pb-2"
                >
                  <span className="text-sm font-medium">
                    {u.storageUnit.storageUnitNumber}
                  </span>
                </div>
              ))}
            </div>
          ) : null
        }
        size="md"
      />
    </div>
  );
}
