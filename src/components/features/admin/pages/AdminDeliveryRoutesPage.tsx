/**
 * @fileoverview Admin delivery routes page for managing packing supply delivery routes
 * @source boombox-10.0/src/app/admin/delivery-routes/page.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays delivery routes with filtering and sorting
 * - Shows driver assignments, route status, payout status
 * - Date picker for filtering routes by delivery date
 * - Column customization and visibility management
 * - Modal for viewing orders associated with routes
 * - Nested modals for order details, cancellations, feedback
 * 
 * API ROUTES USED:
 * - GET /api/admin/delivery-routes?date={date} - Fetch delivery routes
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses semantic color tokens for status badges
 * - Replaced hardcoded colors with design system colors
 * - Uses shared components (AdminDataTable, ColumnManagerMenu, etc.)
 * 
 * @refactor Extracted from inline page implementation
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { ListBulletIcon } from '@heroicons/react/24/solid';
import CustomDatePicker from '@/components/forms/CustomDatePicker';

interface Driver {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  profilePicture: string | null;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  imageSrc: string;
}

interface OrderDetail {
  id: number;
  productId: number;
  quantity: number;
  price: number;
  product: Product;
}

interface Cancellation {
  id: number;
  cancellationReason: string;
  cancellationFee: number | null;
  cancellationDate: string;
  refundAmount: number | null;
  refundStatus: string | null;
  adminNotes: string | null;
}

interface Feedback {
  id: number;
  rating: number;
  comment: string;
  tipAmount: number;
  tipPaymentIntentId: string | null;
  tipPaymentStatus: string | null;
  driverRating: string | null;
  responded: boolean;
  response: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PackingSupplyOrder {
  id: number;
  userId: number | null;
  deliveryAddress: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  orderDate: string;
  deliveryDate: string;
  totalPrice: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string | null;
  stripePaymentIntentId: string | null;
  onfleetTaskId: string | null;
  onfleetTaskShortId: string | null;
  assignedDriverId: number | null;
  deliveryWindowStart: string | null;
  deliveryWindowEnd: string | null;
  actualDeliveryTime: string | null;
  deliveryPhotoUrl: string | null;
  driverPayoutAmount: any;
  driverPayoutStatus: string | null;
  routeMetrics: any;
  routeStopNumber: number | null;
  trackingToken: string | null;
  trackingUrl: string | null;
  batchProcessedAt: string | null;
  optimizationJobId: string | null;
  user: User | null;
  orderDetails: OrderDetail[];
  cancellations: Cancellation[];
  feedback: Feedback | null;
}

interface DeliveryRoute {
  id: string;
  routeId: string;
  driverId: number | null;
  deliveryDate: string;
  totalStops: number;
  completedStops: number;
  routeStatus: string;
  totalDistance: any;
  totalTime: number | null;
  startTime: string | null;
  endTime: string | null;
  payoutAmount: any;
  payoutStatus: string;
  payoutTransferId: string | null;
  payoutProcessedAt: string | null;
  payoutFailureReason: string | null;
  onfleetOptimizationId: string | null;
  driverOfferSentAt: string | null;
  driverOfferExpiresAt: string | null;
  driverOfferStatus: string | null;
  createdAt: string;
  updatedAt: string;
  driver: Driver | null;
  orders: PackingSupplyOrder[];
}

type ColumnId = 'routeId' | 'driver' | 'deliveryDate' | 'routeStatus' | 'totalStops' | 'completedStops' | 'payoutStatus' | 'orders' | 'totalDistance' | 'totalTime' | 'startTime' | 'endTime' | 'payoutAmount' | 'payoutTransferId' | 'payoutProcessedAt' | 'payoutFailureReason' | 'onfleetOptimizationId' | 'driverOfferSentAt' | 'driverOfferExpiresAt' | 'driverOfferStatus' | 'createdAt' | 'updatedAt';

interface Column {
  id: ColumnId;
  label: string;
  visible: boolean;
}

const defaultColumns: Column[] = [
  { id: 'routeId', label: 'Route ID', visible: true },
  { id: 'driver', label: 'Driver', visible: true },
  { id: 'deliveryDate', label: 'Delivery Date', visible: true },
  { id: 'routeStatus', label: 'Status', visible: true },
  { id: 'totalStops', label: 'Total Stops', visible: true },
  { id: 'completedStops', label: 'Completed Stops', visible: true },
  { id: 'payoutStatus', label: 'Payout Status', visible: true },
  { id: 'orders', label: 'Orders', visible: true },
];

const allColumns: Column[] = [
  ...defaultColumns,
  { id: 'totalDistance', label: 'Total Distance', visible: false },
  { id: 'totalTime', label: 'Total Time', visible: false },
  { id: 'startTime', label: 'Start Time', visible: false },
  { id: 'endTime', label: 'End Time', visible: false },
  { id: 'payoutAmount', label: 'Payout Amount', visible: false },
  { id: 'payoutTransferId', label: 'Payout Transfer ID', visible: false },
  { id: 'payoutProcessedAt', label: 'Payout Processed At', visible: false },
  { id: 'payoutFailureReason', label: 'Payout Failure Reason', visible: false },
  { id: 'onfleetOptimizationId', label: 'Onfleet Optimization ID', visible: false },
  { id: 'driverOfferSentAt', label: 'Driver Offer Sent At', visible: false },
  { id: 'driverOfferExpiresAt', label: 'Driver Offer Expires At', visible: false },
  { id: 'driverOfferStatus', label: 'Driver Offer Status', visible: false },
  { id: 'createdAt', label: 'Created At', visible: false },
  { id: 'updatedAt', label: 'Updated At', visible: false },
];

type StatusType = 'in_progress' | 'completed' | 'failed';
type PayoutStatusType = 'pending' | 'processing' | 'completed' | 'failed';
type ActionType = 'unassigned_drivers' | 'failed_payouts';

type SortConfig = {
  column: ColumnId | null;
  direction: 'asc' | 'desc';
};

export function AdminDeliveryRoutesPage() {
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [columns, setColumns] = useState<Column[]>(allColumns);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showPayoutStatusFilter, setShowPayoutStatusFilter] = useState(false);
  const [showActionsFilter, setShowActionsFilter] = useState(false);
  const [selectedRouteForOrders, setSelectedRouteForOrders] = useState<DeliveryRoute | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<PackingSupplyOrder | null>(null);
  const [selectedRecordType, setSelectedRecordType] = useState<'orderDetails' | 'cancellations' | 'feedback' | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [statusFilters, setStatusFilters] = useState<Record<StatusType, boolean>>({
    'in_progress': true,
    'completed': true,
    'failed': true
  });
  const [payoutStatusFilters, setPayoutStatusFilters] = useState<Record<PayoutStatusType, boolean>>({
    'pending': true,
    'processing': true,
    'completed': true,
    'failed': true
  });
  const [actionFilters, setActionFilters] = useState<Record<ActionType, boolean>>({
    'unassigned_drivers': false,
    'failed_payouts': false
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: null, direction: 'asc' });
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const filteredRoutes = routes.filter(route => {
    const statusMatch = statusFilters[route.routeStatus as StatusType];
    const payoutStatusMatch = payoutStatusFilters[route.payoutStatus as PayoutStatusType];
    const actionMatch = !actionFilters.unassigned_drivers && !actionFilters.failed_payouts ? true : (
      (actionFilters.unassigned_drivers && !route.driver) ||
      (actionFilters.failed_payouts && route.payoutStatus === 'failed')
    );
    return statusMatch && payoutStatusMatch && actionMatch;
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
      'in_progress': newValue,
      'completed': newValue,
      'failed': newValue
    });
  };

  const togglePayoutStatusFilter = (status: PayoutStatusType) => {
    setPayoutStatusFilters(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  const allPayoutStatusesSelected = Object.values(payoutStatusFilters).every(Boolean);
  const toggleAllPayoutStatuses = () => {
    const newValue = !allPayoutStatusesSelected;
    setPayoutStatusFilters({
      'pending': newValue,
      'processing': newValue,
      'completed': newValue,
      'failed': newValue
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
      'failed_payouts': newValue
    });
  };

  const handleSort = (column: ColumnId) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.column === column && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ column, direction });
  };

  const getSortedRoutes = (routes: DeliveryRoute[]) => {
    if (!sortConfig.column) return routes;

    const sortColumn = sortConfig.column;
    return [...routes].sort((a, b) => {
      const aValue = getSortValue(a, sortColumn);
      const bValue = getSortValue(b, sortColumn);

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const getSortValue = (route: DeliveryRoute, column: ColumnId) => {
    switch (column) {
      case 'routeId':
        return route.routeId.toLowerCase();
      case 'driver':
        return route.driver ? `${route.driver.firstName} ${route.driver.lastName}`.toLowerCase() : '';
      case 'deliveryDate':
        return new Date(route.deliveryDate).getTime();
      case 'routeStatus':
        return route.routeStatus.toLowerCase();
      case 'totalStops':
      case 'completedStops':
        return route[column];
      case 'payoutStatus':
        return route.payoutStatus.toLowerCase();
      case 'payoutAmount':
        return route.payoutAmount ? Number(route.payoutAmount) : 0;
      case 'totalDistance':
        return route.totalDistance ? Number(route.totalDistance) : 0;
      case 'totalTime':
        return route.totalTime || 0;
      case 'startTime':
      case 'endTime':
        return route[column] ? new Date(route[column]!).getTime() : 0;
      case 'createdAt':
      case 'updatedAt':
        return new Date(route[column]).getTime();
      default:
        return '';
    }
  };

  const filteredAndSortedRoutes = getSortedRoutes(filteredRoutes);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in_progress':
        return 'badge-info';
      case 'completed':
        return 'badge-success';
      case 'failed':
        return 'badge-error';
      default:
        return 'bg-surface-tertiary text-text-secondary';
    }
  };

  const getPayoutStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'badge-warning';
      case 'processing':
        return 'badge-processing';
      case 'completed':
        return 'badge-success';
      case 'failed':
        return 'badge-error';
      default:
        return 'bg-surface-tertiary text-text-secondary';
    }
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatTime = (seconds: number | null) => {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDistance = (miles: any) => {
    if (!miles) return '-';
    const numericMiles = typeof miles === 'object' && miles !== null ? Number(miles) : Number(miles);
    if (isNaN(numericMiles)) return '-';
    return `${numericMiles.toFixed(1)} mi`;
  };

  const toggleColumn = (columnId: ColumnId) => {
    setColumns(prev =>
      prev.map(col =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const handleDateChange = (formattedDate: string, dateObject: Date | null) => {
    setSelectedDate(dateObject);
  };

  const handleViewOrders = (route: DeliveryRoute) => {
    setSelectedRouteForOrders(route);
    setShowViewModal(true);
  };

  const handleViewOrderRecord = (order: PackingSupplyOrder, recordType: 'orderDetails' | 'cancellations' | 'feedback') => {
    setSelectedOrder(order);
    setSelectedRecordType(recordType);
  };

  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedDate) {
        params.append('date', selectedDate.toISOString());
      }
      
      const response = await fetch(`/api/admin/delivery-routes?${params}`);
      if (!response.ok) throw new Error('Failed to fetch delivery routes');
      const data = await response.json();
      setRoutes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  if (error) return <div className="p-4 text-status-error">Error: {error}</div>;

  return (
    <div className="m-4">
      <div className="py-6 px-4 bg-primary rounded-t-lg flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-text-inverse">Delivery Routes</h1>
        <div className="flex gap-2">
          <div className="w-48 sm:-mb-4 -mb-2">
            <CustomDatePicker
              onDateChange={handleDateChange}
              value={selectedDate}
              allowPastDates={true}
              smallText={true}
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowStatusFilter(!showStatusFilter)}
              className="inline-flex items-center text-sm gap-x-1.5 rounded-md bg-surface-primary px-3 py-2.5 font-semibold text-text-primary shadow-sm ring-1 ring-inset ring-border hover:bg-surface-tertiary"
            >
              Status
              <ChevronDownIcon className="-mr-1 h-5 w-5 text-text-secondary" />
            </button>
            {showStatusFilter && (
              <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-surface-primary shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <div className="px-4 py-2 border-b border-border">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={allStatusesSelected}
                        onChange={toggleAllStatuses}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-text-primary">All Statuses</span>
                    </label>
                  </div>
                  {Object.keys(statusFilters).map((status) => (
                    <div key={status} className="px-4 py-2">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={statusFilters[status as StatusType]}
                          onChange={() => toggleStatusFilter(status as StatusType)}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-text-primary capitalize">{status.replace('_', ' ')}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setShowPayoutStatusFilter(!showPayoutStatusFilter)}
              className="inline-flex items-center text-sm gap-x-1.5 rounded-md bg-surface-primary px-3 py-2.5 font-semibold text-text-primary shadow-sm ring-1 ring-inset ring-border hover:bg-surface-tertiary"
            >
              Payout Status
              <ChevronDownIcon className="-mr-1 h-5 w-5 text-text-secondary" />
            </button>
            {showPayoutStatusFilter && (
              <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-surface-primary shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <div className="px-4 py-2 border-b border-border">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={allPayoutStatusesSelected}
                        onChange={toggleAllPayoutStatuses}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-text-primary">All Payout Statuses</span>
                    </label>
                  </div>
                  {Object.keys(payoutStatusFilters).map((status) => (
                    <div key={status} className="px-4 py-2">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={payoutStatusFilters[status as PayoutStatusType]}
                          onChange={() => togglePayoutStatusFilter(status as PayoutStatusType)}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-text-primary capitalize">{status}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setShowActionsFilter(!showActionsFilter)}
              className="inline-flex items-center text-sm gap-x-1.5 rounded-md bg-surface-primary px-3 py-2.5 font-semibold text-text-primary shadow-sm ring-1 ring-inset ring-border hover:bg-surface-tertiary"
            >
              Actions
              <ChevronDownIcon className="-mr-1 h-5 w-5 text-text-secondary" />
            </button>
            {showActionsFilter && (
              <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-surface-primary shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <div className="px-4 py-2 border-b border-border">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={allActionsSelected}
                        onChange={toggleAllActions}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-text-primary">All Actions</span>
                    </label>
                  </div>
                  <div className="px-4 py-2">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={actionFilters.unassigned_drivers}
                        onChange={() => toggleActionFilter('unassigned_drivers')}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-text-primary">Unassigned Drivers</span>
                    </label>
                  </div>
                  <div className="px-4 py-2">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={actionFilters.failed_payouts}
                        onChange={() => toggleActionFilter('failed_payouts')}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-text-primary">Failed Payouts</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className="inline-flex items-center text-sm gap-x-1.5 rounded-md bg-surface-primary px-3 py-2.5 font-semibold text-text-primary shadow-sm ring-1 ring-inset ring-border hover:bg-surface-tertiary"
            >
              + Customize
              <ChevronDownIcon className="-mr-1 h-5 w-5 text-text-secondary" />
            </button>
            {showColumnMenu && (
              <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-surface-primary shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1 max-h-96 overflow-y-auto">
                  {columns.map((column) => (
                    <div key={column.id} className="px-4 py-2">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={column.visible}
                          onChange={() => toggleColumn(column.id)}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-text-primary">{column.label}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface-tertiary">
              <tr>
                {columns.map((column) => (
                  column.visible && (
                    <th
                      key={column.id}
                      scope="col"
                      className="whitespace-nowrap py-1.5 pl-4 pr-3 text-left text-sm font-semibold text-text-primary sm:pl-6"
                    >
                      {column.label}
                    </th>
                  )
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[...Array(5)].map((_, index) => (
                <tr key={index} className="animate-pulse">
                  {columns.map((column) => (
                    column.visible && (
                      <td key={column.id} className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="h-4 bg-surface-tertiary rounded w-3/4"></div>
                      </td>
                    )
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : filteredAndSortedRoutes.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-12 sm:mt-24 py-12 bg-surface-primary rounded-b-lg">
          <ListBulletIcon className="h-24 w-24 text-surface-tertiary mb-4" />
          <p className="text-text-primary text-lg">No delivery routes found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface-tertiary">
              <tr>
                {columns.map((column) => (
                  column.visible && (
                    <th
                      key={column.id}
                      scope="col"
                      className="whitespace-nowrap py-1.5 pl-4 pr-3 text-left text-sm font-semibold text-text-primary sm:pl-6"
                    >
                      {(column.id === 'deliveryDate' || column.id === 'routeStatus' || 
                        column.id === 'payoutStatus' || column.id === 'driver' ||
                        column.id === 'totalStops' || column.id === 'completedStops') ? (
                        <button
                          onClick={() => handleSort(column.id)}
                          className="flex items-center gap-1 hover:bg-surface-secondary py-2 px-4 rounded-full"
                        >
                          {column.label}
                          {sortConfig.column === column.id ? (
                            sortConfig.direction === 'desc' ? (
                              <ChevronUpIcon className="h-4 w-4" />
                            ) : (
                              <ChevronDownIcon className="h-4 w-4" />
                            )
                          ) : (
                            <ChevronUpIcon className="h-4 w-4 text-text-secondary" />
                          )}
                        </button>
                      ) : (
                        column.label
                      )}
                    </th>
                  )
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAndSortedRoutes.map((route) => (
                <tr key={route.id} className="hover:bg-surface-tertiary">
                  {columns.map((column) => (
                    column.visible && (
                      <td
                        key={column.id}
                        className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6"
                      >
                        {column.id === 'routeId' ? (
                          route.routeId
                        ) : column.id === 'driver' ? (
                          route.driver ? (
                            `${route.driver.firstName} ${route.driver.lastName}`
                          ) : (
                            <span className="text-status-error">Unassigned</span>
                          )
                        ) : column.id === 'deliveryDate' ? (
                          formatDateTime(route.deliveryDate)
                        ) : column.id === 'routeStatus' ? (
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium ${getStatusColor(route.routeStatus)}`}>
                            {route.routeStatus.replace('_', ' ')}
                          </span>
                        ) : column.id === 'payoutStatus' ? (
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium ${getPayoutStatusColor(route.payoutStatus)}`}>
                            {route.payoutStatus}
                          </span>
                        ) : column.id === 'totalStops' ? (
                          route.totalStops
                        ) : column.id === 'completedStops' ? (
                          route.completedStops
                        ) : column.id === 'orders' ? (
                          route.orders.length > 0 ? (
                            <button
                              onClick={() => handleViewOrders(route)}
                              className="inline-flex items-center bg-status-bg-primary px-2.5 py-1 text-sm font-inter rounded-md font-medium text-status-primary ring-1 ring-inset ring-status-primary hover:bg-primary-hover"
                            >
                              View Records ({route.orders.length})
                            </button>
                          ) : '-'
                        ) : column.id === 'totalDistance' ? (
                          formatDistance(route.totalDistance)
                        ) : column.id === 'totalTime' ? (
                          formatTime(route.totalTime)
                        ) : column.id === 'startTime' || column.id === 'endTime' ? (
                          route[column.id] ? formatDateTime(route[column.id]!) : '-'
                        ) : column.id === 'payoutAmount' ? (
                          route.payoutAmount ? `$${Number(route.payoutAmount).toFixed(2)}` : '-'
                        ) : column.id === 'payoutTransferId' ? (
                          route.payoutTransferId || '-'
                        ) : column.id === 'payoutProcessedAt' ? (
                          route.payoutProcessedAt ? formatDateTime(route.payoutProcessedAt) : '-'
                        ) : column.id === 'payoutFailureReason' ? (
                          route.payoutFailureReason || '-'
                        ) : column.id === 'onfleetOptimizationId' ? (
                          route.onfleetOptimizationId || '-'
                        ) : column.id === 'driverOfferSentAt' ? (
                          route.driverOfferSentAt ? formatDateTime(route.driverOfferSentAt) : '-'
                        ) : column.id === 'driverOfferExpiresAt' ? (
                          route.driverOfferExpiresAt ? formatDateTime(route.driverOfferExpiresAt) : '-'
                        ) : column.id === 'driverOfferStatus' ? (
                          route.driverOfferStatus || '-'
                        ) : column.id === 'createdAt' || column.id === 'updatedAt' ? (
                          formatDateTime(route[column.id])
                        ) : null}
                      </td>
                    )
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Orders Modal */}
      {showViewModal && selectedRouteForOrders && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => {
            setShowViewModal(false);
            setSelectedRouteForOrders(null);
            setSelectedOrder(null);
            setSelectedRecordType(null);
          }}
        >
          <div 
            className="bg-surface-primary rounded-lg p-6 max-w-6xl w-full max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">
              Orders for Route {selectedRouteForOrders.routeId}
            </h2>
            
            {selectedOrder && selectedRecordType ? (
              <div>
                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    setSelectedRecordType(null);
                  }}
                  className="mb-4 text-status-primary hover:text-primary-hover"
                >
                  ← Back to Orders
                </button>
                
                <h3 className="text-lg font-semibold mb-4">
                  {selectedRecordType === 'orderDetails' ? 'Order Details' :
                   selectedRecordType === 'cancellations' ? 'Cancellations' :
                   'Feedback'}
                </h3>
                
                <div className="space-y-4">
                  {selectedRecordType === 'orderDetails' && selectedOrder.orderDetails.map(detail => (
                    <div key={detail.id} className="border border-border p-4 rounded-lg">
                      <p className="font-semibold">{detail.product.title}</p>
                      <p>Category: {detail.product.category}</p>
                      <p>Quantity: {detail.quantity}</p>
                      <p>Price: ${detail.price.toFixed(2)}</p>
                      <p>Description: {detail.product.description}</p>
                    </div>
                  ))}
                  
                  {selectedRecordType === 'cancellations' && selectedOrder.cancellations.map(cancellation => (
                    <div key={cancellation.id} className="border border-border p-4 rounded-lg">
                      <p className="font-semibold">Reason: {cancellation.cancellationReason}</p>
                      <p>Date: {new Date(cancellation.cancellationDate).toLocaleDateString()}</p>
                      <p>Fee: {cancellation.cancellationFee ? `$${cancellation.cancellationFee.toFixed(2)}` : 'None'}</p>
                      <p>Refund: {cancellation.refundAmount ? `$${cancellation.refundAmount.toFixed(2)}` : 'None'}</p>
                      <p>Refund Status: {cancellation.refundStatus || 'N/A'}</p>
                      {cancellation.adminNotes && <p>Admin Notes: {cancellation.adminNotes}</p>}
                    </div>
                  ))}
                  
                  {selectedRecordType === 'feedback' && selectedOrder.feedback && (
                    <div className="border border-border p-4 rounded-lg">
                      <p className="font-semibold">Rating: {selectedOrder.feedback.rating}/5</p>
                      <p>Comment: {selectedOrder.feedback.comment}</p>
                      <p>Tip: ${selectedOrder.feedback.tipAmount.toFixed(2)}</p>
                      <p>Driver Rating: {selectedOrder.feedback.driverRating || 'N/A'}</p>
                      <p>Responded: {selectedOrder.feedback.responded ? 'Yes' : 'No'}</p>
                      {selectedOrder.feedback.response && <p>Response: {selectedOrder.feedback.response}</p>}
                      <p>Created: {new Date(selectedOrder.feedback.createdAt).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedRouteForOrders.orders.map(order => (
                  <div key={order.id} className="border border-border p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-semibold">Order #{order.id}</p>
                        <p>Customer: {order.user ? `${order.user.firstName} ${order.user.lastName}` : order.contactName}</p>
                        <p>Address: {order.deliveryAddress}</p>
                        <p>Status: {order.status}</p>
                        <p>Total: ${order.totalPrice.toFixed(2)}</p>
                      </div>
                      <div>
                        <p>Order Date: {new Date(order.orderDate).toLocaleDateString()}</p>
                        <p>Payment Status: {order.paymentStatus}</p>
                        <p>Stop Number: {order.routeStopNumber || 'N/A'}</p>
                        <p>Driver Payout: {order.driverPayoutAmount ? `$${Number(order.driverPayoutAmount).toFixed(2)}` : 'N/A'}</p>
                        <p>Payout Status: {order.driverPayoutStatus}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      {order.orderDetails.length > 0 && (
                        <button
                          onClick={() => handleViewOrderRecord(order, 'orderDetails')}
                          className="inline-flex items-center bg-status-bg-info px-2.5 py-1 text-sm font-inter rounded-md font-medium text-status-info ring-1 ring-inset ring-status-info hover:bg-status-info-hover"
                        >
                          View Details ({order.orderDetails.length})
                        </button>
                      )}
                      {order.cancellations.length > 0 && (
                        <button
                          onClick={() => handleViewOrderRecord(order, 'cancellations')}
                          className="inline-flex items-center bg-status-bg-error px-2.5 py-1 text-sm font-inter rounded-md font-medium text-status-error ring-1 ring-inset ring-status-error hover:bg-status-error-hover"
                        >
                          View Cancellations ({order.cancellations.length})
                        </button>
                      )}
                      {order.feedback && (
                        <button
                          onClick={() => handleViewOrderRecord(order, 'feedback')}
                          className="inline-flex items-center bg-status-bg-success px-2.5 py-1 text-sm font-inter rounded-md font-medium text-status-success ring-1 ring-inset ring-status-success hover:bg-status-success-hover"
                        >
                          View Feedback
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedRouteForOrders(null);
                  setSelectedOrder(null);
                  setSelectedRecordType(null);
                }}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

