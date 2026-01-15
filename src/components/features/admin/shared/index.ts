/**
 * @fileoverview Shared admin UI components exports
 * @source Created for boombox-11.0 admin component extraction
 * 
 * GOLD STANDARD COMPONENTS (from AdminJobsPage):
 * - table/* - Table components with skeleton loading
 * - filters/* - Filter dropdowns and page header
 * - buttons/* - Action buttons and status badges
 * 
 * DEPRECATED COMPONENTS:
 * - AdminDataTable → Use table/AdminTable
 * - SearchAndFilterBar → Use filters/FilterDropdown + filters/AdminPageHeader
 * - ColumnManagerMenu → Use filters/ColumnManagerDropdown
 * 
 * See ADMIN_PATTERNS.md for migration guide
 */

// ===== GOLD STANDARD COMPONENTS (from AdminJobsPage) =====
// Table Components
export { AdminTable } from './table/AdminTable';
export { AdminTableSkeleton } from './table/AdminTableSkeleton';
export { AdminEmptyState } from './table/AdminEmptyState';
export { AdminErrorState } from './table/AdminErrorState';

// Filter Components
export { FilterDropdown } from './filters/FilterDropdown';
export { ColumnManagerDropdown } from './filters/ColumnManagerDropdown';
export { AdminPageHeader } from './filters/AdminPageHeader';
export { AdminDatePicker } from './AdminDatePicker';

// Button Components
export { AdminActionButton } from './buttons/AdminActionButton';
export { AdminStatusBadge } from './buttons/AdminStatusBadge';
export { AdminBooleanBadge } from './buttons/AdminBooleanBadge';
export { RouteStatusBadge } from './buttons/RouteStatusBadge';
export { PayoutStatusBadge } from './buttons/PayoutStatusBadge';
export { StorageStatusBadge } from './buttons/StorageStatusBadge';

// Badge Components
export { FeedbackRatingDisplay } from './badges/FeedbackRatingDisplay';

// ===== DEPRECATED COMPONENTS (use gold standard alternatives above) =====
/**
 * @deprecated Use table/AdminTable instead - AdminJobsPage gold standard with skeleton loading
 */
export { AdminDataTable } from './AdminDataTable';

/**
 * @deprecated Use filters/FilterDropdown + filters/AdminPageHeader instead
 */
export { SearchAndFilterBar } from './SearchAndFilterBar';
export type { ActionFilter } from './SearchAndFilterBar';

/**
 * @deprecated Use filters/ColumnManagerDropdown instead
 */
export { ColumnManagerMenu } from './ColumnManagerMenu';
export type { Column } from './ColumnManagerMenu';

// ===== STILL VALID COMPONENTS =====
export { AdminDetailModal } from './AdminDetailModal';
export { PhotoViewerModal } from './PhotoViewerModal';
export { SortableTableHeader } from './SortableTableHeader';
export type { SortConfig } from './SortableTableHeader';

// Migrated Admin Components
export { StorageUnitSelector } from './StorageUnitSelector';
export { RequestedStorageUnitSelector } from './RequestedStorageUnitSelector';
export { DriverAssignmentModal } from './DriverAssignmentModal';
export { StorageUnitAssignmentModal } from './StorageUnitAssignmentModal';
export { OnfleetTasksModal } from './OnfleetTasksModal';
export { NaturalLanguageQuery } from './NaturalLanguageQuery';

