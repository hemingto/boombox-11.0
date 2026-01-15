# Admin Component Patterns - Migration Guide

## Overview

**AdminJobsPage** represents the **gold standard** for admin management pages in boombox-11.0. This guide documents the superior patterns extracted from AdminJobsPage and how to migrate from older component patterns.

## Why AdminJobsPage is the Gold Standard

### 1. Skeleton Loading (Not Spinners)
**Superior UX**: Skeleton rows show table structure while loading, providing better perceived performance than spinners.

```tsx
// ❌ OLD: Spinner loading (poor UX)
{loading ? <Spinner /> : <Table data={data} />}

// ✅ GOLD STANDARD: Skeleton loading (better UX)
{loading ? <AdminTableSkeleton columns={columns} rowCount={5} /> : <Table data={data} />}
```

### 2. Semantic Action Colors
**Clear visual hierarchy**: Color-coded buttons communicate urgency and status at a glance.

- **Red**: Urgent actions needed (Driver Unassigned, Assign Unit)
- **Amber**: Warnings or partial completion (Incomplete)
- **Green**: Success or completed states (Assigned units display)
- **Indigo**: Informational actions (View Records)

### 3. Checkbox Filters with "All" Option
**Better UX**: Checkbox filters are more intuitive than toggle switches and support multi-selection.

```tsx
// ❌ OLD: Toggle switches or simple checkboxes
<Checkbox onChange={toggle} />

// ✅ GOLD STANDARD: Checkbox filters with "All" option
<FilterDropdown
  label="Status"
  filters={statusFilters}
  allSelected={allStatusesSelected}
  onToggleAll={toggleAllStatuses}
/>
```

### 4. Record-Based Filter State
**More flexible**: Using Record types instead of individual boolean states scales better.

```tsx
// ❌ OLD: Individual boolean states (doesn't scale)
const [scheduled, setScheduled] = useState(true);
const [complete, setComplete] = useState(true);

// ✅ GOLD STANDARD: Record-based state (scalable)
const [statusFilters, setStatusFilters] = useState<Record<StatusType, boolean>>({
  scheduled: true,
  'in transit': true,
  complete: true
});
```

## Component Migration Guide

### Table Components

#### AdminDataTable → AdminTable

**Why migrate**: AdminDataTable uses spinner loading; AdminTable uses skeleton loading.

```tsx
// ❌ OLD
import { AdminDataTable } from '@/components/features/admin/shared';

<AdminDataTable
  columns={columns}
  data={drivers}
  loading={loading}  // Shows spinner
  renderRow={(driver) => <tr>...</tr>}
/>

// ✅ GOLD STANDARD
import { AdminTable } from '@/components/features/admin/shared/table/AdminTable';

<AdminTable
  columns={columns}
  data={drivers}
  loading={loading}  // Shows skeleton rows
  sortConfig={sortConfig}
  onSort={handleSort}
  renderRow={(driver) => <tr>...</tr>}
/>
```

### Filter Components

#### SearchAndFilterBar → FilterDropdown + AdminPageHeader

**Why migrate**: AdminJobsPage separates concerns better with dedicated components.

```tsx
// ❌ OLD
import { SearchAndFilterBar } from '@/components/features/admin/shared';

<SearchAndFilterBar
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
  actionFilters={actionFilters}
  onToggleFilter={toggleFilter}
/>

// ✅ GOLD STANDARD
import { AdminPageHeader, FilterDropdown } from '@/components/features/admin/shared';

<AdminPageHeader title="Jobs">
  <input
    type="text"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    placeholder="Search job code..."
  />
  <FilterDropdown
    label="Status"
    filters={statusFilterItems}
    isOpen={showStatusFilter}
    onToggle={() => setShowStatusFilter(!showStatusFilter)}
    onToggleFilter={toggleStatusFilter}
    onToggleAll={toggleAllStatuses}
    allSelected={allStatusesSelected}
  />
</AdminPageHeader>
```

#### ColumnManagerMenu → ColumnManagerDropdown

**Why migrate**: ColumnManagerDropdown follows same pattern as FilterDropdown for consistency.

```tsx
// ❌ OLD
import { ColumnManagerMenu } from '@/components/features/admin/shared';

<ColumnManagerMenu
  columns={columns}
  showMenu={showMenu}
  onToggleMenu={() => setShowMenu(!showMenu)}
  onToggleColumn={toggleColumn}
/>

// ✅ GOLD STANDARD
import { ColumnManagerDropdown } from '@/components/features/admin/shared/filters/ColumnManagerDropdown';

<ColumnManagerDropdown
  columns={columns}
  isOpen={showColumnMenu}
  onToggle={() => setShowColumnMenu(!showColumnMenu)}
  onToggleColumn={toggleColumn}
/>
```

### Button Components

#### Inline Buttons → AdminActionButton

**Why migrate**: Semantic color variants provide visual consistency and clear meaning.

```tsx
// ❌ OLD: Inline button with hardcoded classes
<button className="inline-flex items-center bg-red-50 px-2.5 py-1 text-sm rounded-md font-medium font-inter text-red-700 ring-1 ring-inset ring-red-700/10 hover:bg-red-100">
  Assign Unit
</button>

// ✅ GOLD STANDARD: Semantic action button
import { AdminActionButton } from '@/components/features/admin/shared/buttons/AdminActionButton';

<AdminActionButton variant="red" onClick={handleAssign}>
  Assign Unit
</AdminActionButton>
```

**Available variants**:
- `red`: Urgent (Driver Unassigned, Assign Unit)
- `amber`: Warning (Incomplete)
- `green`: Success (Unit A-101, A-102)
- `indigo`: Info (View Records)

#### Inline Status Badges → AdminStatusBadge

```tsx
// ❌ OLD: Inline badge with utility function
<span className={`inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium ${getStatusBadgeColor(status)}`}>
  {status}
</span>

// ✅ GOLD STANDARD: Semantic status badge
import { AdminStatusBadge } from '@/components/features/admin/shared/buttons/AdminStatusBadge';

<AdminStatusBadge status={job.status} />
```

## Key Patterns from AdminJobsPage

### 1. Dropdown Coordination

Only one dropdown should be open at a time for cleaner UX.

```tsx
<button onClick={() => {
  setShowStatusFilter(!showStatusFilter);
  setShowActionsFilter(false);  // Close other dropdowns
  setShowColumnMenu(false);
  setShowDatePicker(false);
}}>
  Status
</button>
```

### 2. Sort Configuration

Use generic sort config with custom extraction function.

```tsx
const getSortValue = (job: Job, column: ColumnId) => {
  switch (column) {
    case 'date':
      return new Date(job.date).getTime();
    case 'status':
      return job.status.toLowerCase();
    default:
      return '';
  }
};
```

### 3. Filter Logic Pattern

Combine status, action, and search filters with clear separation.

```tsx
const filteredJobs = jobs.filter(job => {
  const statusMatch = statusFilters[job.status.toLowerCase() as StatusType];
  const actionMatch = !actionFilters.unassigned_drivers && !actionFilters.incomplete_assignments ? true : (
    (actionFilters.unassigned_drivers && !job.driver) ||
    (actionFilters.incomplete_assignments && !job.storageStartUsages?.length)
  );
  const searchMatch = searchQuery === '' || job.jobCode.toLowerCase().includes(searchQuery.toLowerCase());
  return statusMatch && actionMatch && searchMatch;
});
```

## Styling Consistency

All gold standard components use these patterns:

- **Primary color**: Indigo (`ring-indigo-600`, `focus:ring-indigo-600`)
- **Table headers**: Slate-100 background (`bg-slate-100`)
- **Buttons**: Font Inter (`font-inter`)
- **Semantic colors**: Red/amber/green/indigo for action states
- **Shadows**: `shadow-lg` for dropdowns
- **Borders**: `ring-1 ring-black ring-opacity-5` for dropdown containers

## File Structure

```
boombox-11.0/src/components/features/admin/shared/
├── table/                      # Gold standard table components
│   ├── AdminTable.tsx
│   ├── AdminTableSkeleton.tsx
│   ├── AdminEmptyState.tsx
│   └── AdminErrorState.tsx
├── filters/                    # Gold standard filter components
│   ├── FilterDropdown.tsx
│   ├── ColumnManagerDropdown.tsx
│   └── AdminPageHeader.tsx
├── buttons/                    # Gold standard button components
│   ├── AdminActionButton.tsx
│   └── AdminStatusBadge.tsx
├── AdminDataTable.tsx         # ⚠️ DEPRECATED
├── SearchAndFilterBar.tsx     # ⚠️ DEPRECATED
└── ColumnManagerMenu.tsx      # ⚠️ DEPRECATED
```

## Migration Checklist

When adopting AdminJobsPage patterns:

- [ ] Replace AdminDataTable with AdminTable (skeleton loading)
- [ ] Replace SearchAndFilterBar with FilterDropdown + AdminPageHeader
- [ ] Replace ColumnManagerMenu with ColumnManagerDropdown
- [ ] Use AdminActionButton for all semantic action buttons
- [ ] Use AdminStatusBadge for status displays
- [ ] Implement dropdown coordination (only one open at a time)
- [ ] Use Record-based filter state (not individual booleans)
- [ ] Apply semantic color patterns (red/amber/green/indigo)
- [ ] Ensure slate-100 table headers
- [ ] Use font-inter for action buttons

## Questions?

Reference **AdminJobsPage** (`boombox-11.0/src/components/features/admin/pages/AdminJobsPage.tsx`) as the living example of all these patterns in action.

