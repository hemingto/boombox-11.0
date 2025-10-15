# Admin Special Pages Migration Plan

**Created**: October 16, 2025  
**Status**: 📋 Ready to Execute  
**Total Components**: 4 admin special pages  
**Estimated Time**: 8-10 hours  
**Phase**: Phase 5 continuation (Feature Components)

---

## Overview

This plan details the migration of 4 remaining admin special page components from boombox-10.0 to boombox-11.0, following the component migration checklist methodology.

**Components to Migrate**:
1. AdminCalendarPage (Priority: HIGH) - 3 hours
2. AdminDeliveryRoutesPage (Priority: MEDIUM) - 2 hours  
3. AdminAskDatabasePage (Priority: MEDIUM) - 2 hours
4. AdminInvitesPage (Priority: LOW) - 1.5 hours

**Note**: `/admin/tasks/access/[taskId]` route confirmed as not needed - alternative route used instead.

---

## Migration Strategy

### Core Principles
- ✅ Follow component migration checklist (folder-by-folder approach)
- ✅ Extract business logic to hooks/services (check for redundancies FIRST)
- ✅ Use design system colors and utility classes
- ✅ Apply WCAG 2.1 AA accessibility standards
- ✅ Update API routes using migration tracking file
- ✅ Create comprehensive Jest tests
- ✅ Use shared admin components where applicable

### Shared Components Available
- `AdminDataTable` - Reusable table component
- `ColumnManagerMenu` - Column visibility toggle
- `SearchAndFilterBar` - Search + filters
- `useAdminTable` - Table state management hook
- `useAdminDataFetch` - Generic data fetching hook

---

## Component 1: AdminCalendarPage 📅

**Priority**: HIGH  
**Complexity**: HIGH (calendar UI + event handling)  
**Estimated Time**: 3 hours  
**Source**: `boombox-10.0/src/app/admin/calendar/page.tsx`  
**Target**: `src/components/features/admin/pages/AdminCalendarPage.tsx`

### Pre-Migration Analysis

#### Current Functionality (from boombox-10.0)
- Calendar view with day/week/month toggle
- Appointment visualization by date
- Driver availability display
- Quick appointment creation/editing
- Color-coded appointment types
- Time slot management

#### API Routes Used
- [ ] Identify: Scan component for API calls
- [ ] Map: Use `api-routes-migration-tracking.md`
- [ ] Expected routes:
  - `/api/admin/appointments` (list with date filters)
  - `/api/admin/calendar/availability` (driver availability)
  - `/api/admin/appointments/[id]` (appointment details)

#### Dependencies & Utilities
- [ ] Check for existing calendar/date utilities in `src/lib/utils/dateUtils.ts`
- [ ] Check for existing hooks: `useAdminDataFetch`
- [ ] Potential calendar library: Consider `react-big-calendar` or custom implementation
- [ ] **DO NOT create duplicate date formatting functions** - use existing `dateUtils.ts`

### Migration Steps

#### Step 1: Folder Analysis (15 min)
- [x] Component identified: Single calendar component
- [ ] Complexity: HIGH (calendar UI, multiple views, event handling)
- [ ] API routes: 3-4 routes for appointments and availability
- [ ] Target domain: `features/admin/pages/`

#### Step 2: Create Target Structure (10 min)
- [ ] Create: `src/components/features/admin/pages/AdminCalendarPage.tsx`
- [ ] Supporting files (if needed):
  - `src/components/features/admin/calendar/CalendarView.tsx` (calendar grid)
  - `src/components/features/admin/calendar/AppointmentCard.tsx` (event display)
  - `src/components/features/admin/calendar/QuickCreateModal.tsx` (quick create)

#### Step 3: Component Migration (2 hours)

##### 3a. Analyze Component
- [ ] Read source: `boombox-10.0/src/app/admin/calendar/page.tsx`
- [ ] Document props and state management
- [ ] Identify calendar rendering logic
- [ ] Note appointment color coding system
- [ ] Check for date range calculations

##### 3b. Create Migrated Component
- [ ] Create file with proper `@fileoverview` documentation
- [ ] Implement calendar view states (day/week/month)
- [ ] Add appointment data fetching with `useAdminDataFetch`
- [ ] Implement event click handlers
- [ ] Add quick create/edit modals

##### 3c. Apply Design System
- [ ] Status colors: `badge-success`, `badge-warning`, `badge-processing`
- [ ] Calendar cells: Use `surface` colors
- [ ] Selected dates: Use `primary` colors
- [ ] Buttons: `btn-primary`, `btn-secondary`

##### 3d. Substitute Primitives
- [ ] Use `Modal` for appointment details/creation
- [ ] Use `Spinner` for loading states
- [ ] Use `Button` components from UI primitives

##### 3e. No Image Placeholders Expected
- [ ] N/A - Calendar component (no images)

##### 3f. Update API Routes
- [ ] Update all API calls to new routes
- [ ] Verify date range parameters
- [ ] Test appointment loading

##### 3g. ARIA Accessibility
- [ ] Calendar grid: `role="grid"`, `aria-label="Appointment calendar"`
- [ ] Calendar cells: `role="gridcell"`, proper date labels
- [ ] Keyboard navigation: Arrow keys, Enter/Space for selection
- [ ] Screen reader: Announce selected date and appointments
- [ ] Focus management: Proper focus indicators

##### 3h. Extract Business Logic (CHECK FIRST!)
- [ ] **Pre-check existing utilities**:
  - [ ] Review `src/lib/utils/dateUtils.ts` for date formatting (DO NOT recreate)
  - [ ] Review `src/hooks/` for calendar-related hooks
- [ ] **Extract only if not found**:
  - [ ] Date range calculations → `dateUtils.ts` (if not exists)
  - [ ] Calendar grid generation → `src/hooks/useCalendarGrid.ts` (if complex)
  - [ ] Appointment filtering by date → component logic (simple enough)
- [ ] **Post-extraction**: Run `npm run utils:scan-duplicates`

#### Step 4: Create Jest Tests (30 min)
- [ ] Create: `tests/components/AdminCalendarPage.test.tsx`
- [ ] Test calendar view switching (day/week/month)
- [ ] Test appointment display and filtering
- [ ] Test date navigation
- [ ] Test accessibility with keyboard navigation
- [ ] Test modal interactions

#### Step 5: Update Exports (10 min)
- [ ] Update: `src/components/features/admin/pages/index.ts`
- [ ] Verify no linting errors
- [ ] Run redundancy check

### Completion Criteria
- [ ] Calendar displays appointments correctly
- [ ] View switching works (day/week/month)
- [ ] Quick create/edit modal functional
- [ ] All accessibility standards met
- [ ] Tests passing
- [ ] No duplicate utilities created

---

## Component 2: AdminDeliveryRoutesPage 🚚

**Priority**: MEDIUM  
**Complexity**: MEDIUM (route visualization)  
**Estimated Time**: 2 hours  
**Source**: `boombox-10.0/src/app/admin/delivery-routes/page.tsx`  
**Target**: `src/components/features/admin/pages/AdminDeliveryRoutesPage.tsx`

### Pre-Migration Analysis

#### Current Functionality
- Route listing with status
- Driver assignment to routes
- Route optimization integration (Onfleet)
- Status tracking (planned, active, completed)
- Route details view

#### API Routes Used
- [ ] Identify: Scan component for API calls
- [ ] Expected routes:
  - `/api/admin/delivery-routes` (list all routes)
  - `/api/admin/delivery-routes/[id]` (route details)
  - `/api/onfleet/routes` (Onfleet integration)

#### Dependencies & Utilities
- [ ] Check: `useAdminTable`, `useAdminDataFetch` (likely needed)
- [ ] Check: Existing Onfleet utilities in `src/lib/integrations/onfleet/`
- [ ] **DO NOT create duplicate Onfleet functions** - use existing

### Migration Steps

#### Step 1: Folder Analysis (15 min)
- [x] Component identified: Route management page
- [ ] Complexity: MEDIUM (table + Onfleet integration)
- [ ] API routes: 2-3 routes
- [ ] Target domain: `features/admin/pages/`

#### Step 2: Create Target Structure (10 min)
- [ ] Create: `src/components/features/admin/pages/AdminDeliveryRoutesPage.tsx`
- [ ] Use shared components: `AdminDataTable`, `SearchAndFilterBar`

#### Step 3: Component Migration (1 hour)

##### 3a-3g. Standard Migration Steps
- [ ] Follow same pattern as management pages (similar to AdminJobsPage)
- [ ] Use `AdminDataTable` for route listing
- [ ] Use `useAdminTable` hook for state management
- [ ] Apply design system colors for status badges
- [ ] Update API routes from migration tracking
- [ ] Add ARIA labels and keyboard navigation

##### 3h. Extract Business Logic (CHECK FIRST!)
- [ ] **Pre-check existing utilities**:
  - [ ] Review `src/lib/integrations/onfleet/` for Onfleet functions
  - [ ] Review `src/hooks/` for route-related hooks
- [ ] **Extract only if needed**:
  - [ ] Route optimization calls → Use existing Onfleet service
  - [ ] Status badge logic → Simple inline (not worth extracting)
- [ ] **Post-extraction**: Run `npm run utils:scan-duplicates`

#### Step 4: Create Jest Tests (30 min)
- [ ] Create: `tests/components/AdminDeliveryRoutesPage.test.tsx`
- [ ] Test route listing and filtering
- [ ] Test driver assignment
- [ ] Test status updates
- [ ] Test accessibility

#### Step 5: Update Exports (10 min)
- [ ] Update exports and verify

### Completion Criteria
- [ ] Route listing displays correctly
- [ ] Driver assignment functional
- [ ] Status tracking works
- [ ] Onfleet integration preserved
- [ ] Tests passing

---

## Component 3: AdminAskDatabasePage 🤖

**Priority**: MEDIUM  
**Complexity**: MEDIUM (AI query interface)  
**Estimated Time**: 2 hours  
**Source**: `boombox-10.0/src/app/admin/ask-database/page.tsx`  
**Target**: `src/components/features/admin/pages/AdminAskDatabasePage.tsx`

### Pre-Migration Analysis

#### Current Functionality
- Natural language query input
- AI query generation (likely OpenAI/Claude)
- Database query execution
- Results display (table format)
- Query history
- Export functionality (CSV/JSON)

#### API Routes Used
- [ ] Identify: Scan component for API calls
- [ ] Expected routes:
  - `/api/admin/ask-database/query` (submit query)
  - `/api/admin/ask-database/history` (query history)

#### Dependencies & Utilities
- [ ] Check: Existing AI integration utilities
- [ ] Check: `useAdminDataFetch` for data fetching
- [ ] Check: Export utilities in `src/lib/utils/`
- [ ] **DO NOT create duplicate export functions**

### Migration Steps

#### Step 1: Folder Analysis (15 min)
- [x] Component identified: AI query interface
- [ ] Complexity: MEDIUM (AI integration + results display)
- [ ] API routes: 2 routes
- [ ] Target domain: `features/admin/pages/`

#### Step 2: Create Target Structure (10 min)
- [ ] Create: `src/components/features/admin/pages/AdminAskDatabasePage.tsx`
- [ ] Supporting components (if complex):
  - `src/components/features/admin/ask-database/QueryInput.tsx`
  - `src/components/features/admin/ask-database/ResultsTable.tsx`
  - `src/components/features/admin/ask-database/QueryHistory.tsx`

#### Step 3: Component Migration (1 hour)

##### 3a-3g. Standard Migration Steps
- [ ] Read source component
- [ ] Implement query input form
- [ ] Add AI query processing
- [ ] Display results in table
- [ ] Implement query history
- [ ] Add export functionality
- [ ] Apply design system colors
- [ ] Add accessibility (keyboard shortcuts, screen reader support)

##### 3h. Extract Business Logic (CHECK FIRST!)
- [ ] **Pre-check existing utilities**:
  - [ ] Review `src/lib/services/` for AI service integration
  - [ ] Review `src/lib/utils/` for export utilities
- [ ] **Extract only if needed**:
  - [ ] AI query processing → `src/lib/services/AIQueryService.ts` (if complex)
  - [ ] CSV export → Use existing export utils or create in `exportUtils.ts`
  - [ ] Query history management → `src/hooks/useQueryHistory.ts` (if stateful)
- [ ] **Post-extraction**: Run `npm run utils:scan-duplicates`

#### Step 4: Create Jest Tests (30 min)
- [ ] Create: `tests/components/AdminAskDatabasePage.test.tsx`
- [ ] Test query input and submission
- [ ] Test results display
- [ ] Test query history
- [ ] Test export functionality
- [ ] Test accessibility

#### Step 5: Update Exports (10 min)
- [ ] Update exports and verify

### Completion Criteria
- [ ] Query input works
- [ ] AI processing functional
- [ ] Results display correctly
- [ ] Export works (CSV/JSON)
- [ ] Query history tracks queries
- [ ] Tests passing

---

## Component 4: AdminInvitesPage ✉️

**Priority**: LOW  
**Complexity**: LOW (simple CRUD)  
**Estimated Time**: 1.5 hours  
**Source**: `boombox-10.0/src/app/admin/invites/page.tsx`  
**Target**: `src/components/features/admin/pages/AdminInvitesPage.tsx`

### Pre-Migration Analysis

#### Current Functionality
- Admin invitation creation form
- Pending invites listing
- Invitation revocation
- Invite expiration tracking
- Role-based access control (SUPERADMIN only)

#### API Routes Used
- [ ] Identify: Scan component for API calls
- [ ] Expected routes:
  - `/api/admin/invites` (list invites)
  - `/api/admin/invites/create` (create invite)
  - `/api/admin/invites/[id]/revoke` (revoke invite)

#### Dependencies & Utilities
- [ ] Check: `useAdminTable`, `useAdminDataFetch`
- [ ] Check: Email validation in `validationUtils.ts` (DO NOT recreate)
- [ ] Check: Date formatting in `dateUtils.ts` (DO NOT recreate)

### Migration Steps

#### Step 1: Folder Analysis (15 min)
- [x] Component identified: Admin invites management (SUPERADMIN only)
- [ ] Complexity: LOW (simple table + form)
- [ ] API routes: 3 routes
- [ ] Target domain: `features/admin/pages/`

#### Step 2: Create Target Structure (10 min)
- [ ] Create: `src/components/features/admin/pages/AdminInvitesPage.tsx`
- [ ] Use shared components: `AdminDataTable`, `SearchAndFilterBar`, `Modal`

#### Step 3: Component Migration (45 min)

##### 3a-3g. Standard Migration Steps
- [ ] Read source component
- [ ] Implement invite list with `AdminDataTable`
- [ ] Add create invite modal with form
- [ ] Implement revoke functionality
- [ ] Show expiration status with badges
- [ ] Apply design system colors
- [ ] Add SUPERADMIN role check
- [ ] Add accessibility

##### 3h. Extract Business Logic (CHECK FIRST!)
- [ ] **Pre-check existing utilities**:
  - [ ] Review `src/lib/utils/validationUtils.ts` for email validation (DO NOT recreate)
  - [ ] Review `src/lib/utils/dateUtils.ts` for date formatting (DO NOT recreate)
  - [ ] Review `src/hooks/` for form handling hooks
- [ ] **Extract only if needed**:
  - [ ] Email validation → Already exists in `validationUtils.ts`
  - [ ] Date formatting → Already exists in `dateUtils.ts`
  - [ ] No extraction needed (simple CRUD)
- [ ] **Post-extraction**: Run `npm run utils:scan-duplicates`

#### Step 4: Create Jest Tests (20 min)
- [ ] Create: `tests/components/AdminInvitesPage.test.tsx`
- [ ] Test invite listing
- [ ] Test create invite form
- [ ] Test invite revocation
- [ ] Test SUPERADMIN access check
- [ ] Test accessibility

#### Step 5: Update Exports (10 min)
- [ ] Update exports and verify

### Completion Criteria
- [ ] Invite listing displays
- [ ] Create invite form works
- [ ] Revoke functionality works
- [ ] SUPERADMIN check working
- [ ] Expiration tracking shows correctly
- [ ] Tests passing

---

## Execution Timeline

### Sprint Plan (8-10 hours total)

#### Day 1: High Priority (3 hours)
**Morning Session (3h)**:
- [ ] AdminCalendarPage - Complete migration
  - Analysis + structure (25 min)
  - Component migration (2 hours)
  - Testing (30 min)
  - Verification (5 min)

#### Day 2: Medium Priority (4 hours)
**Morning Session (2h)**:
- [ ] AdminDeliveryRoutesPage - Complete migration
  - Analysis + structure (25 min)
  - Component migration (1 hour)
  - Testing (30 min)
  - Verification (5 min)

**Afternoon Session (2h)**:
- [ ] AdminAskDatabasePage - Complete migration
  - Analysis + structure (25 min)
  - Component migration (1 hour)
  - Testing (30 min)
  - Verification (5 min)

#### Day 3: Low Priority (1.5 hours)
**Morning Session (1.5h)**:
- [ ] AdminInvitesPage - Complete migration
  - Analysis + structure (25 min)
  - Component migration (45 min)
  - Testing (20 min)
  - Verification (10 min)

---

## Quality Checklist (ALL Components)

### Before Starting
- [ ] Run `npm run utils:scan-duplicates` to see baseline
- [ ] Review `api-routes-migration-tracking.md` for route mappings
- [ ] Review existing hooks in `src/hooks/index.ts`
- [ ] Review existing utilities in `src/lib/utils/index.ts`

### During Migration (Per Component)
- [ ] **CHECK FIRST**: Review existing utilities before creating new ones
- [ ] API routes updated from migration tracking
- [ ] Design system colors applied
- [ ] Shared admin components used where applicable
- [ ] ARIA accessibility standards met
- [ ] Business logic extracted (no duplicates!)
- [ ] Component file contains ONLY UI logic

### After Each Component
- [ ] Jest tests created and passing
- [ ] `npm run utils:scan-duplicates` passes clean
- [ ] No linting errors
- [ ] Component exports updated
- [ ] Functionality tested in dev environment

### Final Verification (All 4 Complete)
- [ ] All 4 placeholder pages replaced
- [ ] Zero `@REFACTOR-P9-TEMP` comments in admin pages
- [ ] All tests passing
- [ ] No duplicate utilities created
- [ ] Documentation updated
- [ ] Phase 6 fully complete (22/22 admin components)

---

## Common Utilities to Reuse (DO NOT RECREATE)

### From Existing Hooks
- `useAdminTable` - Table state management
- `useAdminDataFetch` - Generic data fetching
- `useClickOutside` - Click outside detection
- `usePhotoUpload` - File upload handling

### From Existing Utils
- `dateUtils.ts` - Date formatting, parsing, calculations
- `validationUtils.ts` - Email, phone validation
- `formatUtils.ts` - General formatting
- `currencyUtils.ts` - Currency formatting
- `phoneUtils.ts` - Phone formatting

### From Existing Services
- `MessageService` - Email/SMS messaging
- Onfleet integration - `src/lib/integrations/onfleet/`
- Stripe integration - `src/lib/integrations/stripe/`

---

## Risk Mitigation

### Potential Issues
1. **Calendar Complexity**: Calendar UI might be more complex than estimated
   - **Mitigation**: Consider using `react-big-calendar` library or simplified custom implementation
   
2. **AI Query Integration**: AI service might have breaking changes
   - **Mitigation**: Test API integration early, have fallback to manual query input

3. **Onfleet Route Visualization**: Route display might require mapping
   - **Mitigation**: Use simple list view initially, enhance with map later if needed

4. **Duplicate Utilities**: Risk of recreating existing functions
   - **Mitigation**: MANDATORY redundancy checks before and after each component

---

## Success Criteria

### Technical Success
- [ ] All 4 components migrated and functional
- [ ] Zero duplicate utilities created
- [ ] All API routes updated correctly
- [ ] Design system compliance 100%
- [ ] WCAG 2.1 AA accessibility met
- [ ] All tests passing (20+ tests total)

### Business Success
- [ ] 99.9% functional compatibility maintained
- [ ] Admin workflows uninterrupted
- [ ] Performance equal or better than boombox-10.0
- [ ] SUPERADMIN role restrictions working

### Phase 6 Complete
- [ ] 22/22 admin components complete (100%)
- [ ] Phase 6 fully closed
- [ ] Ready for Phase 7 (Testing & Validation)

---

**Document Status**: Ready to Execute  
**Next Step**: Begin with AdminCalendarPage (Priority: HIGH)  
**Estimated Completion**: 2-3 days (8-10 hours total)

**Related Docs**:
- `docs/component-migration-checklist.md` - Migration methodology
- `docs/admin-components-status.md` - Current status tracking
- `docs/api-routes-migration-tracking.md` - API route mappings
- `docs/PLACEHOLDER_COMPONENTS_TRACKING.md` - Component tracking

