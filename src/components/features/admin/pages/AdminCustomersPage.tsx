/**
 * @fileoverview Admin customers management page component
 * @source boombox-10.0/src/app/admin/customers/page.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Complete customer management interface:
 * - Lists all customers with sortable columns
 * - Search customers by name, email, phone
 * - Toggle column visibility
 * - View customer appointments, storage units, and packing supply orders
 * - Sortable by all columns
 * 
 * DESIGN:
 * - Uses gold standard admin components
 * - AdminPageHeader with search and column manager
 * - AdminTable with integrated states
 * - AdminBooleanBadge for verified phone status
 * - AdminActionButton for view records
 * 
 * API ROUTES:
 * - GET /api/admin/customers - Fetches all customers
 * 
 * @refactor Refactored to use gold standard admin components
 */

'use client';

import React, { useState, useEffect } from 'react';
import { formatPhoneNumberForDisplay } from '@/lib/utils/phoneUtils';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import {
  AdminPageHeader,
  ColumnManagerDropdown,
  AdminTable,
  AdminBooleanBadge,
  AdminActionButton,
} from '@/components/features/admin/shared';
import { Button } from '@/components/ui/primitives/Button/Button';

interface Customer {
 id: number;
 firstName: string;
 lastName: string;
 email: string;
 phoneNumber: string;
 verifiedPhoneNumber: boolean;
 stripeCustomerId: string | null;
 appointments: {
  id: number;
  date: string;
  status: string;
  appointmentType: string;
  jobCode: string;
 }[];
 storageUnitUsages: {
  id: number;
  storageUnit: {
   storageUnitNumber: string;
  };
  usageStartDate: string;
  usageEndDate: string | null;
 }[];
 packingSupplyOrders: {
  id: number;
  orderDate: string;
  status: string;
  totalPrice: number;
 }[];
}

type ColumnId =
  | 'id'
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phoneNumber'
  | 'verifiedPhoneNumber'
  | 'stripeCustomerId'
  | 'appointments'
  | 'storageUnitUsages'
  | 'packingSupplyOrders';

interface Column {
  id: ColumnId;
  label: string;
  visible: boolean;
}

type SortConfig = {
  column: keyof Customer | null;
  direction: 'asc' | 'desc';
};

const defaultColumns: Column[] = [
  { id: 'id', label: 'ID', visible: true },
  { id: 'firstName', label: 'First Name', visible: true },
  { id: 'lastName', label: 'Last Name', visible: true },
  { id: 'email', label: 'Email', visible: true },
  { id: 'phoneNumber', label: 'Phone', visible: true },
  { id: 'verifiedPhoneNumber', label: 'Verified Phone', visible: true },
  { id: 'stripeCustomerId', label: 'Stripe ID', visible: true },
  { id: 'appointments', label: 'Appointments', visible: true },
  { id: 'storageUnitUsages', label: 'Storage Units', visible: true },
  { id: 'packingSupplyOrders', label: 'Packing Supply Orders', visible: true },
];

/**
 * AdminCustomersPage - Customer management interface
 * 
 * @example
 * ```tsx
 * // Used in: src/app/(dashboard)/admin/customers/page.tsx
 * <AdminCustomersPage />
 * ```
 */
export function AdminCustomersPage() {
  // State management
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [columns, setColumns] = useState<Column[]>(defaultColumns);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRecordType, setSelectedRecordType] = useState<
    'appointments' | 'storageUnitUsages' | 'packingSupplyOrders' | null
  >(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: 'id',
    direction: 'asc',
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch customers
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/admin/customers');
      if (!response.ok) throw new Error('Failed to fetch customers');
      const data = await response.json();
      setCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Sorting
  const handleSort = (column: keyof Customer) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.column === column && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ column, direction });
  };

  const getSortedCustomers = (customers: Customer[]) => {
    if (!sortConfig.column) return customers;

    return [...customers].sort((a, b) => {
      const aValue = a[sortConfig.column!];
      const bValue = b[sortConfig.column!];

      if (aValue === null || bValue === null) {
        if (aValue === null && bValue === null) return 0;
        if (aValue === null) return sortConfig.direction === 'asc' ? -1 : 1;
        return sortConfig.direction === 'asc' ? 1 : -1;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.toLowerCase().localeCompare(bValue.toLowerCase())
          : bValue.toLowerCase().localeCompare(aValue.toLowerCase());
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Filtering
  const filteredCustomers = customers.filter((customer) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      customer.firstName.toLowerCase().includes(searchLower) ||
      customer.lastName.toLowerCase().includes(searchLower) ||
      customer.email.toLowerCase().includes(searchLower) ||
      customer.phoneNumber.toLowerCase().includes(searchLower) ||
      customer.stripeCustomerId?.toLowerCase().includes(searchLower) || false
    );
  });

  const sortedCustomers = getSortedCustomers(filteredCustomers);

  // Column management
  const toggleColumn = (columnId: ColumnId) => {
    setColumns((prev) =>
      prev.map((col) => (col.id === columnId ? { ...col, visible: !col.visible } : col))
    );
  };

  // View records
  const handleViewRecord = (
    customer: Customer,
    recordType: 'appointments' | 'storageUnitUsages' | 'packingSupplyOrders'
  ) => {
    setSelectedCustomer(customer);
    setSelectedRecordType(recordType);
    setShowViewModal(true);
  };

  // Render cell content
  const renderCellContent = (customer: Customer, column: Column): React.ReactNode => {
    switch (column.id) {
      case 'phoneNumber':
        return customer.phoneNumber ? formatPhoneNumberForDisplay(customer.phoneNumber) : '-';
      case 'verifiedPhoneNumber':
        return <AdminBooleanBadge value={customer.verifiedPhoneNumber} />;
      case 'stripeCustomerId':
        return customer.stripeCustomerId || '-';
      case 'appointments':
      case 'storageUnitUsages':
      case 'packingSupplyOrders': {
        const recordType = column.id as 'appointments' | 'storageUnitUsages' | 'packingSupplyOrders';
        return customer[recordType].length > 0 ? (
          <AdminActionButton
            variant="indigo"
            onClick={() => handleViewRecord(customer, recordType)}
          >
            View Records
          </AdminActionButton>
        ) : (
          '-'
        );
      }
      default: {
        const value = customer[column.id as keyof Customer];
        return typeof value === 'string' || typeof value === 'number' ? value : '-';
      }
    }
  };

  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div>
      {/* Header */}
      <AdminPageHeader title="Customers">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-zinc-950 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 font-semibold"
          />
        </div>

        {/* Column Customize */}
        <ColumnManagerDropdown
          columns={columns}
          isOpen={showColumnMenu}
          onToggle={() => setShowColumnMenu(!showColumnMenu)}
          onToggleColumn={toggleColumn}
        />
      </AdminPageHeader>

      {/* Table */}
      <AdminTable
        columns={columns.map(col => ({
          ...col,
          sortable: ['firstName', 'lastName', 'email'].includes(col.id)
        }))}
        data={sortedCustomers}
        sortConfig={sortConfig}
        onSort={handleSort}
        loading={loading}
        error={error ? 'Failed to load customers' : null}
        emptyMessage="No customers found"
        onRetry={fetchCustomers}
        renderRow={(customer) => (
          <tr key={customer.id} className="hover:bg-slate-50">
            {columns.map(
              (column) =>
                column.visible && (
                  <td key={column.id} className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                    {renderCellContent(customer, column)}
                  </td>
                )
            )}
          </tr>
        )}
      />

      {/* View Modal */}
      <Dialog open={showViewModal} onClose={() => setShowViewModal(false)} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-black bg-opacity-50" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <DialogTitle className="text-xl font-bold mb-4">
              {selectedRecordType === 'appointments'
                ? 'Appointments Details'
                : selectedRecordType === 'storageUnitUsages'
                ? 'Storage Unit Usage Details'
                : 'Packing Supply Orders Details'}
            </DialogTitle>
            <div className="space-y-4">
              {selectedCustomer && selectedRecordType === 'appointments' &&
                selectedCustomer.appointments.map((appointment) => (
                  <div key={appointment.id} className="border p-4 rounded-lg">
                    <p className="font-semibold">Date: {new Date(appointment.date).toLocaleDateString()}</p>
                    <p>Status: {appointment.status}</p>
                    <p>Type: {appointment.appointmentType}</p>
                    <p>Job Code: {appointment.jobCode}</p>
                  </div>
                ))}

              {selectedCustomer && selectedRecordType === 'storageUnitUsages' &&
                selectedCustomer.storageUnitUsages.map((usage) => (
                  <div key={usage.id} className="border p-4 rounded-lg">
                    <p className="font-semibold">Unit Number: {usage.storageUnit.storageUnitNumber}</p>
                    <p>Start Date: {new Date(usage.usageStartDate).toLocaleDateString()}</p>
                    <p>
                      End Date: {usage.usageEndDate ? new Date(usage.usageEndDate).toLocaleDateString() : 'Active'}
                    </p>
                  </div>
                ))}

              {selectedCustomer && selectedRecordType === 'packingSupplyOrders' &&
                selectedCustomer.packingSupplyOrders.map((order) => (
                  <div key={order.id} className="border p-4 rounded-lg">
                    <p className="font-semibold">Order Date: {new Date(order.orderDate).toLocaleDateString()}</p>
                    <p>Status: {order.status}</p>
                    <p>Total Price: ${order.totalPrice.toFixed(2)}</p>
                  </div>
                ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedRecordType(null);
                }}
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

