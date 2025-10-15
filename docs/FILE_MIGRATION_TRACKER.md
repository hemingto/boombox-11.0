# File Migration Progress Tracker

**Project**: boombox-10.0 → boombox-11.0 Refactoring  
**Date Created**: 2025-01-28  
**Last Updated**: 2025-01-28

## Overview

This document tracks the migration of 594 files from boombox-10.0 to boombox-11.0 across 8 phases.

### Migration Statistics

| Category       | Total Files | Completed | In Progress | Pending |
| -------------- | ----------- | --------- | ----------- | ------- |
| **API Routes** | 181         | 0         | 0           | 181     |
| **Components** | 266         | 0         | 0           | 266     |
| **Pages**      | 85          | 0         | 0           | 85      |
| **Utilities**  | 62          | 0         | 0           | 62      |
| **TOTAL**      | **594**     | **0**     | **0**       | **594** |

---

## Phase Progress Tracking

### Phase 1: Foundation Setup ✅ COMPLETED

**Progress**: ██████████ 100% (6/6 tasks completed)

- [x] SETUP_001_PROJECT_INITIALIZATION ✅ COMPLETED
- [x] SETUP_002_DIRECTORY_STRUCTURE ✅ COMPLETED
- [x] SETUP_003_CORE_CONFIGS ✅ COMPLETED
- [x] SETUP_004_GIT_WORKFLOW ✅ COMPLETED
- [x] SETUP_005_FILE_MAPPING_AUDIT ✅ COMPLETED
- [ ] SETUP_006_PROJECT_README

### Phase 2: Type System & Utilities

**Progress**: ░░░░░░░░░░ 0% (0/5 tasks completed)

- [ ] TYPES_001_CORE_TYPES
- [ ] TYPES_002_API_TYPES
- [ ] UTILS_001_CORE_UTILITIES
- [ ] UTILS_002_INTEGRATION_CLIENTS
- [ ] UTILS_003_MESSAGING_SYSTEM

### Phase 3: Design System & UI Components

**Progress**: ░░░░░░░░░░ 0% (0/5 tasks completed)

- [ ] UI_001_DESIGN_TOKENS
- [ ] UI_002_BASE_COMPONENTS
- [ ] UI_003_LAYOUT_COMPONENTS
- [ ] UI_004_FORM_COMPONENTS
- [ ] UI_005_SEO_ACCESSIBILITY_OPTIMIZATION

### Phase 4: API Layer Migration

**Progress**: ░░░░░░░░░░ 0% (0/8 tasks completed)

- [ ] API_001_AUTH_DOMAIN (10 routes)
- [ ] API_002_PAYMENT_DOMAIN (15 routes)
- [ ] API_003_ORDERS_DOMAIN (25 routes)
- [ ] API_004_ONFLEET_DOMAIN (20 routes)
- [ ] API_005_DRIVERS_DOMAIN (35 routes)
- [ ] API_006_MOVING_PARTNERS_DOMAIN (20 routes)
- [ ] API_007_CUSTOMER_DOMAIN (15 routes)
- [ ] API_008_ADMIN_DOMAIN (41 routes)

### Phase 5: Feature Components Migration

**Progress**: ░░░░░░░░░░ 0% (0/7 tasks completed)

- [ ] FEATURES_001_AUTH_COMPONENTS
- [ ] FEATURES_002_DASHBOARD_COMPONENTS
- [ ] FEATURES_003_ORDER_COMPONENTS
- [ ] FEATURES_004_ONFLEET_COMPONENTS
- [ ] FEATURES_005_DRIVER_COMPONENTS
- [ ] FEATURES_006_MOVING_PARTNER_COMPONENTS
- [ ] FEATURES_007_PAYMENT_COMPONENTS

### Phase 6: Page Migration & Route Groups

**Progress**: ░░░░░░░░░░ 0% (0/5 tasks completed)

- [ ] PAGES_001_PUBLIC_PAGES
- [ ] PAGES_002_AUTH_PAGES
- [ ] PAGES_003_DASHBOARD_PAGES
- [ ] PAGES_004_SPECIALIZED_PAGES
- [ ] PAGES_005_ROUTING_OPTIMIZATION

### Phase 7: Testing & Validation

**Progress**: ░░░░░░░░░░ 0% (0/3 tasks completed)

- [ ] TEST_001_UNIT_TESTING
- [ ] TEST_002_INTEGRATION_TESTING
- [ ] TEST_003_MIGRATION_VALIDATION

### Phase 8: Documentation & Deployment

**Progress**: ░░░░░░░░░░ 0% (0/2 tasks completed)

- [ ] DOCS_001_COMPONENT_DOCS
- [ ] DOCS_002_DEPLOYMENT_PREP

---

## Detailed File Migration Tracking

### API Routes Migration (181 files)

#### Authentication Domain (10 routes)

| Source File                                 | Target File                                 | Status     | Notes       |
| ------------------------------------------- | ------------------------------------------- | ---------- | ----------- |
| `src/app/api/auth/login/route.ts`           | `src/app/api/auth/login/route.ts`           | ⏳ Pending | Direct copy |
| `src/app/api/auth/signup/route.ts`          | `src/app/api/auth/signup/route.ts`          | ⏳ Pending | Direct copy |
| `src/app/api/auth/forgot-password/route.ts` | `src/app/api/auth/forgot-password/route.ts` | ⏳ Pending | Direct copy |
| `src/app/api/auth/reset-password/route.ts`  | `src/app/api/auth/reset-password/route.ts`  | ⏳ Pending | Direct copy |
| `src/app/api/auth/verify-email/route.ts`    | `src/app/api/auth/verify-email/route.ts`    | ⏳ Pending | Direct copy |

#### Payment Domain (15 routes)

| Source File                                          | Target File                                           | Status     | Notes       |
| ---------------------------------------------------- | ----------------------------------------------------- | ---------- | ----------- |
| `src/app/api/stripe/create-stripe-customer/route.ts` | `src/app/api/payments/create-customer/route.ts`       | ⏳ Pending | Rename path |
| `src/app/api/stripe/create-payment-intent/route.ts`  | `src/app/api/payments/create-payment-intent/route.ts` | ⏳ Pending | Rename path |
| `src/app/api/stripe/webhook/route.ts`                | `src/app/api/payments/stripe-webhook/route.ts`        | ⏳ Pending | Rename path |
| `src/app/api/stripe/connect-account/route.ts`        | `src/app/api/payments/connect-account/route.ts`       | ⏳ Pending | Rename path |
| `src/app/api/stripe/transfer-funds/route.ts`         | `src/app/api/payments/transfer-funds/route.ts`        | ⏳ Pending | Rename path |

#### Orders Domain (25 routes)

| Source File                                                | Target File                                                       | Status     | Notes                      |
| ---------------------------------------------------------- | ----------------------------------------------------------------- | ---------- | -------------------------- |
| `src/app/api/appointments/create/route.ts`                 | `src/app/api/orders/appointments/create/route.ts`                 | ⏳ Pending | Reorganize                 |
| `src/app/api/appointments/[appointmentId]/edit/route.ts`   | `src/app/api/orders/appointments/[appointmentId]/edit/route.ts`   | ⏳ Pending | **REFACTOR** (1,309 lines) |
| `src/app/api/appointments/[appointmentId]/cancel/route.ts` | `src/app/api/orders/appointments/[appointmentId]/cancel/route.ts` | ⏳ Pending | Reorganize                 |
| `src/app/api/packing-supplies/create-order/route.ts`       | `src/app/api/orders/packing-supplies/create-order/route.ts`       | ⏳ Pending | **REFACTOR** (666 lines)   |
| `src/app/api/packing-supplies/[orderId]/update/route.ts`   | `src/app/api/orders/packing-supplies/[orderId]/update/route.ts`   | ⏳ Pending | Reorganize                 |

#### Onfleet Domain (20 routes)

| Source File                                | Target File                                          | Status     | Notes                      |
| ------------------------------------------ | ---------------------------------------------------- | ---------- | -------------------------- |
| `src/app/api/onfleet/create-task/route.ts` | `src/app/api/onfleet/tasks/create/route.ts`          | ⏳ Pending | **REFACTOR** (1,155 lines) |
| `src/app/api/onfleet/update-task/route.ts` | `src/app/api/onfleet/tasks/[taskId]/update/route.ts` | ⏳ Pending | Reorganize                 |
| `src/app/api/webhooks/onfleet/route.ts`    | `src/app/api/onfleet/webhook/route.ts`               | ⏳ Pending | **REFACTOR** (1,231 lines) |
| `src/app/api/onfleet/workers/route.ts`     | `src/app/api/onfleet/workers/route.ts`               | ⏳ Pending | Direct copy                |

#### Drivers Domain (35 routes)

| Source File                                            | Target File                                            | Status     | Notes                      |
| ------------------------------------------------------ | ------------------------------------------------------ | ---------- | -------------------------- |
| `src/app/api/driver-assign/route.ts`                   | `src/app/api/drivers/assign/route.ts`                  | ⏳ Pending | **REFACTOR** (1,493 lines) |
| `src/app/api/drivers/[driverId]/vehicle/route.ts`      | `src/app/api/drivers/[driverId]/vehicle/route.ts`      | ⏳ Pending | Direct copy                |
| `src/app/api/drivers/[driverId]/appointments/route.ts` | `src/app/api/drivers/[driverId]/appointments/route.ts` | ⏳ Pending | Direct copy                |
| `src/app/api/drivers/[driverId]/availability/route.ts` | `src/app/api/drivers/[driverId]/availability/route.ts` | ⏳ Pending | Direct copy                |
| `src/app/api/drivers/accept-invitation/route.ts`       | `src/app/api/drivers/accept-invitation/route.ts`       | ⏳ Pending | Direct copy                |

#### Moving Partners Domain (20 routes)

| Source File                                         | Target File                                                      | Status     | Notes       |
| --------------------------------------------------- | ---------------------------------------------------------------- | ---------- | ----------- |
| `src/app/api/mover/[userId]/blocked-dates/route.ts` | `src/app/api/moving-partners/[partnerId]/blocked-dates/route.ts` | ⏳ Pending | Rename path |
| `src/app/api/mover/[userId]/appointments/route.ts`  | `src/app/api/moving-partners/[partnerId]/appointments/route.ts`  | ⏳ Pending | Rename path |
| `src/app/api/movers/create-mover/route.ts`          | `src/app/api/moving-partners/create-partner/route.ts`            | ⏳ Pending | Rename path |
| `src/app/api/movers/assign-mover/route.ts`          | `src/app/api/moving-partners/assign-partner/route.ts`            | ⏳ Pending | Rename path |

#### Customer Domain (15 routes)

| Source File                                               | Target File                                                | Status     | Notes       |
| --------------------------------------------------------- | ---------------------------------------------------------- | ---------- | ----------- |
| `src/app/api/customer/[customerId]/profile/route.ts`      | `src/app/api/customers/[customerId]/profile/route.ts`      | ⏳ Pending | Direct copy |
| `src/app/api/customer/[customerId]/appointments/route.ts` | `src/app/api/customers/[customerId]/appointments/route.ts` | ⏳ Pending | Direct copy |
| `src/app/api/customer/create-customer/route.ts`           | `src/app/api/customers/create-customer/route.ts`           | ⏳ Pending | Direct copy |

#### Admin Domain (41 routes)

| Source File                                  | Target File                                  | Status     | Notes                    |
| -------------------------------------------- | -------------------------------------------- | ---------- | ------------------------ |
| `src/app/api/admin/tasks/route.ts`           | `src/app/api/admin/tasks/route.ts`           | ⏳ Pending | **REFACTOR** (642 lines) |
| `src/app/api/admin/tasks/[taskId]/route.ts`  | `src/app/api/admin/tasks/[taskId]/route.ts`  | ⏳ Pending | **REFACTOR** (715 lines) |
| `src/app/api/admin/dashboard-stats/route.ts` | `src/app/api/admin/dashboard-stats/route.ts` | ⏳ Pending | Direct copy              |
| `src/app/api/admin/reports/route.ts`         | `src/app/api/admin/reports/route.ts`         | ⏳ Pending | Direct copy              |

### Component Migration (266 files)

#### UI Components (Design System)

| Source File                                                | Target File                            | Status     | Notes             |
| ---------------------------------------------------------- | -------------------------------------- | ---------- | ----------------- |
| `src/app/components/reusablecomponents/Button.tsx`         | `src/components/ui/Button.tsx`         | ⏳ Pending | Move to UI system |
| `src/app/components/reusablecomponents/Input.tsx`          | `src/components/ui/Input.tsx`          | ⏳ Pending | Move to UI system |
| `src/app/components/reusablecomponents/Modal.tsx`          | `src/components/ui/Modal.tsx`          | ⏳ Pending | Move to UI system |
| `src/app/components/reusablecomponents/LoadingSpinner.tsx` | `src/components/ui/LoadingSpinner.tsx` | ⏳ Pending | Move to UI system |
| `src/app/components/reusablecomponents/Card.tsx`           | `src/components/ui/Card.tsx`           | ⏳ Pending | Move to UI system |

#### Layout Components

| Source File                                   | Target File                               | Status     | Notes           |
| --------------------------------------------- | ----------------------------------------- | ---------- | --------------- |
| `src/app/components/header/Header.tsx`        | `src/components/layouts/Header.tsx`       | ⏳ Pending | Move to layouts |
| `src/app/components/header/Navigation.tsx`    | `src/components/layouts/Navigation.tsx`   | ⏳ Pending | Move to layouts |
| `src/app/components/footer/Footer.tsx`        | `src/components/layouts/Footer.tsx`       | ⏳ Pending | Move to layouts |
| `src/app/components/sidebar/AdminSidebar.tsx` | `src/components/layouts/AdminSidebar.tsx` | ⏳ Pending | Move to layouts |

#### Form Components

| Source File                                    | Target File                            | Status     | Notes                    |
| ---------------------------------------------- | -------------------------------------- | ---------- | ------------------------ |
| `src/app/components/getquote/getquoteform.tsx` | `src/components/forms/BookingForm.tsx` | ⏳ Pending | **REFACTOR** (768 lines) |
| `src/app/components/getquote/addressform.tsx`  | `src/components/forms/AddressForm.tsx` | ⏳ Pending | Move to forms            |
| `src/app/components/getquote/contactform.tsx`  | `src/components/forms/ContactForm.tsx` | ⏳ Pending | Move to forms            |
| `src/app/components/login/LoginForm.tsx`       | `src/components/forms/AuthForm.tsx`    | ⏳ Pending | **CONSOLIDATE**          |
| `src/app/components/signup/SignupForm.tsx`     | `src/components/forms/AuthForm.tsx`    | ⏳ Pending | **CONSOLIDATE**          |

#### Feature Components by Domain

##### Authentication Features

| Source File                                 | Target File                                      | Status     | Notes            |
| ------------------------------------------- | ------------------------------------------------ | ---------- | ---------------- |
| `src/app/components/auth/LoginForm.tsx`     | `src/components/features/auth/LoginForm.tsx`     | ⏳ Pending | Move to features |
| `src/app/components/auth/SignupForm.tsx`    | `src/components/features/auth/SignupForm.tsx`    | ⏳ Pending | Move to features |
| `src/app/components/auth/PasswordReset.tsx` | `src/components/features/auth/PasswordReset.tsx` | ⏳ Pending | Move to features |

##### Orders Features

| Source File                                                  | Target File                                                 | Status     | Notes              |
| ------------------------------------------------------------ | ----------------------------------------------------------- | ---------- | ------------------ |
| `src/app/components/appointment/AppointmentCard.tsx`         | `src/components/features/orders/AppointmentCard.tsx`        | ⏳ Pending | Move to features   |
| `src/app/components/appointment/BookingForm.tsx`             | `src/components/features/orders/BookingForm.tsx`            | ⏳ Pending | Move to features   |
| `src/app/components/packing-supplies/PackingSupplyOrder.tsx` | `src/components/features/orders/PackingSupplyOrder.tsx`     | ⏳ Pending | Move to features   |
| `src/app/components/packing-supplies/OrderCard.tsx`          | `src/components/features/orders/PackingSupplyOrderCard.tsx` | ⏳ Pending | Rename for clarity |

##### Onfleet Features

| Source File                                       | Target File                                             | Status     | Notes              |
| ------------------------------------------------- | ------------------------------------------------------- | ---------- | ------------------ |
| `src/app/components/tracking/TrackingMap.tsx`     | `src/components/features/onfleet/TrackingMap.tsx`       | ⏳ Pending | Move to features   |
| `src/app/components/tracking/TaskStatus.tsx`      | `src/components/features/onfleet/OnfleetTaskStatus.tsx` | ⏳ Pending | Rename for clarity |
| `src/app/components/tracking/DeliveryUpdates.tsx` | `src/components/features/onfleet/DeliveryUpdates.tsx`   | ⏳ Pending | Move to features   |

##### Driver Features

| Source File                                                  | Target File                                                | Status     | Notes            |
| ------------------------------------------------------------ | ---------------------------------------------------------- | ---------- | ---------------- |
| `src/app/components/driver-account/DriverDashboard.tsx`      | `src/components/features/drivers/DriverDashboard.tsx`      | ⏳ Pending | Move to features |
| `src/app/components/driver-account/VehicleManagement.tsx`    | `src/components/features/drivers/VehicleManagement.tsx`    | ⏳ Pending | Move to features |
| `src/app/components/driver-account/AvailabilityCalendar.tsx` | `src/components/features/drivers/AvailabilityCalendar.tsx` | ⏳ Pending | Move to features |

##### Moving Partner Features

| Source File                                             | Target File                                                    | Status     | Notes                    |
| ------------------------------------------------------- | -------------------------------------------------------------- | ---------- | ------------------------ |
| `src/app/components/mover-account/MoverDashboard.tsx`   | `src/components/features/moving-partners/MoverDashboard.tsx`   | ⏳ Pending | Move to features         |
| `src/app/components/mover-account/contacttable.tsx`     | `src/components/features/moving-partners/ContactTable.tsx`     | ⏳ Pending | **REFACTOR** (837 lines) |
| `src/app/components/mover-account/upcomingjobs.tsx`     | `src/components/features/moving-partners/UpcomingJobs.tsx`     | ⏳ Pending | **REFACTOR** (634 lines) |
| `src/app/components/mover-account/vehicleinfotable.tsx` | `src/components/features/moving-partners/VehicleInfoTable.tsx` | ⏳ Pending | **REFACTOR** (609 lines) |

##### Payment Features

| Source File                                       | Target File                                              | Status     | Notes              |
| ------------------------------------------------- | -------------------------------------------------------- | ---------- | ------------------ |
| `src/app/components/payment/PaymentForm.tsx`      | `src/components/features/payments/StripePaymentForm.tsx` | ⏳ Pending | Rename for clarity |
| `src/app/components/payment/SubscriptionCard.tsx` | `src/components/features/payments/SubscriptionCard.tsx`  | ⏳ Pending | Move to features   |
| `src/app/components/payment/InvoiceDetails.tsx`   | `src/components/features/payments/InvoiceDetails.tsx`    | ⏳ Pending | Move to features   |

##### Customer Features

| Source File                                           | Target File                                                | Status     | Notes                    |
| ----------------------------------------------------- | ---------------------------------------------------------- | ---------- | ------------------------ |
| `src/app/components/user-page/UserDashboard.tsx`      | `src/components/features/customers/CustomerDashboard.tsx`  | ⏳ Pending | Rename for clarity       |
| `src/app/components/user-page/contactinfotable.tsx`   | `src/components/features/customers/ContactInfoTable.tsx`   | ⏳ Pending | **REFACTOR** (708 lines) |
| `src/app/components/user-page/AppointmentHistory.tsx` | `src/components/features/customers/AppointmentHistory.tsx` | ⏳ Pending | Move to features         |

##### Admin Features

| Source File                                   | Target File                                             | Status     | Notes              |
| --------------------------------------------- | ------------------------------------------------------- | ---------- | ------------------ |
| `src/app/components/admin/AdminDashboard.tsx` | `src/components/features/admin/AdminDashboard.tsx`      | ⏳ Pending | Move to features   |
| `src/app/components/admin/UserManagement.tsx` | `src/components/features/admin/AdminUserManagement.tsx` | ⏳ Pending | Rename for clarity |
| `src/app/components/admin/TaskManagement.tsx` | `src/components/features/admin/AdminTaskManagement.tsx` | ⏳ Pending | Rename for clarity |
| `src/app/components/admin/ReportsPanel.tsx`   | `src/components/features/admin/AdminReportsPanel.tsx`   | ⏳ Pending | Rename for clarity |

### Page Migration (85 files)

#### Public Pages (Route Group: (public))

| Source File                           | Target File                                    | Status     | Notes               |
| ------------------------------------- | ---------------------------------------------- | ---------- | ------------------- |
| `src/app/page.tsx`                    | `src/app/(public)/page.tsx`                    | ⏳ Pending | Move to route group |
| `src/app/howitworks/page.tsx`         | `src/app/(public)/how-it-works/page.tsx`       | ⏳ Pending | Move to route group |
| `src/app/getquote/page.tsx`           | `src/app/(public)/get-quote/page.tsx`          | ⏳ Pending | Move to route group |
| `src/app/storage-calculator/page.tsx` | `src/app/(public)/storage-calculator/page.tsx` | ⏳ Pending | Move to route group |
| `src/app/packing-supplies/page.tsx`   | `src/app/(public)/packing-supplies/page.tsx`   | ⏳ Pending | Move to route group |
| `src/app/help-center/page.tsx`        | `src/app/(public)/help-center/page.tsx`        | ⏳ Pending | Move to route group |
| `src/app/careers/page.tsx`            | `src/app/(public)/careers/page.tsx`            | ⏳ Pending | Move to route group |
| `src/app/blog/page.tsx`               | `src/app/(public)/blog/page.tsx`               | ⏳ Pending | Move to route group |

#### Auth Pages (Route Group: (auth))

| Source File                             | Target File                                    | Status     | Notes               |
| --------------------------------------- | ---------------------------------------------- | ---------- | ------------------- |
| `src/app/login/page.tsx`                | `src/app/(auth)/login/page.tsx`                | ⏳ Pending | Move to route group |
| `src/app/driver-signup/page.tsx`        | `src/app/(auth)/driver-signup/page.tsx`        | ⏳ Pending | Move to route group |
| `src/app/mover-signup/page.tsx`         | `src/app/(auth)/mover-signup/page.tsx`         | ⏳ Pending | Move to route group |
| `src/app/driver-accept-invite/page.tsx` | `src/app/(auth)/driver-accept-invite/page.tsx` | ⏳ Pending | Move to route group |

#### Dashboard Pages (Route Group: (dashboard))

##### Admin Dashboard

| Source File                              | Target File                                          | Status     | Notes                    |
| ---------------------------------------- | ---------------------------------------------------- | ---------- | ------------------------ |
| `src/app/admin/page.tsx`                 | `src/app/(dashboard)/admin/page.tsx`                 | ⏳ Pending | Move to route group      |
| `src/app/admin/drivers/page.tsx`         | `src/app/(dashboard)/admin/drivers/page.tsx`         | ⏳ Pending | **REFACTOR** (668 lines) |
| `src/app/admin/movers/page.tsx`          | `src/app/(dashboard)/admin/movers/page.tsx`          | ⏳ Pending | **REFACTOR** (613 lines) |
| `src/app/admin/customers/page.tsx`       | `src/app/(dashboard)/admin/customers/page.tsx`       | ⏳ Pending | Move to route group      |
| `src/app/admin/jobs/page.tsx`            | `src/app/(dashboard)/admin/jobs/page.tsx`            | ⏳ Pending | **REFACTOR** (694 lines) |
| `src/app/admin/storage-units/page.tsx`   | `src/app/(dashboard)/admin/storage-units/page.tsx`   | ⏳ Pending | **REFACTOR** (813 lines) |
| `src/app/admin/feedback/page.tsx`        | `src/app/(dashboard)/admin/feedback/page.tsx`        | ⏳ Pending | **REFACTOR** (723 lines) |
| `src/app/admin/delivery-routes/page.tsx` | `src/app/(dashboard)/admin/delivery-routes/page.tsx` | ⏳ Pending | **REFACTOR** (885 lines) |
| `src/app/admin/calendar/page.tsx`        | `src/app/(dashboard)/admin/calendar/page.tsx`        | ⏳ Pending | Move to route group      |
| `src/app/admin/tasks/page.tsx`           | `src/app/(dashboard)/admin/tasks/page.tsx`           | ⏳ Pending | **ROUTING REFACTOR**     |

##### Customer Dashboard

| Source File                                        | Target File                                                   | Status     | Notes               |
| -------------------------------------------------- | ------------------------------------------------------------- | ---------- | ------------------- |
| `src/app/user-page/[id]/page.tsx`                  | `src/app/(dashboard)/customer/[id]/page.tsx`                  | ⏳ Pending | Move to route group |
| `src/app/user-page/[id]/edit-appointment/page.tsx` | `src/app/(dashboard)/customer/[id]/edit-appointment/page.tsx` | ✅ Completed | Moved to route group |
| `src/app/user-page/[id]/packing-supplies/page.tsx` | `src/app/(dashboard)/customer/[id]/packing-supplies/page.tsx` | ⏳ Pending | Move to route group |
| `src/app/user-page/[id]/access-storage/page.tsx`   | `src/app/(dashboard)/customer/[id]/access-storage/page.tsx`   | ⏳ Pending | Move to route group |
| `src/app/user-page/[id]/add-storage/page.tsx`      | `src/app/(dashboard)/customer/[id]/add-storage/page.tsx`      | ⏳ Pending | Move to route group |
| `src/app/user-page/[id]/account-info/page.tsx`     | `src/app/(dashboard)/customer/[id]/account-info/page.tsx`     | ⏳ Pending | Move to route group |
| `src/app/user-page/[id]/payments/page.tsx`         | `src/app/(dashboard)/customer/[id]/payments/page.tsx`         | ⏳ Pending | Move to route group |

##### Driver Dashboard

| Source File                                               | Target File                                              | Status     | Notes               |
| --------------------------------------------------------- | -------------------------------------------------------- | ---------- | ------------------- |
| `src/app/driver-account-page/[id]/page.tsx`               | `src/app/(dashboard)/driver/[id]/page.tsx`               | ⏳ Pending | Move to route group |
| `src/app/driver-account-page/[id]/calendar/page.tsx`      | `src/app/(dashboard)/driver/[id]/calendar/page.tsx`      | ⏳ Pending | Move to route group |
| `src/app/driver-account-page/[id]/vehicle/page.tsx`       | `src/app/(dashboard)/driver/[id]/vehicle/page.tsx`       | ⏳ Pending | Move to route group |
| `src/app/driver-account-page/[id]/payment/page.tsx`       | `src/app/(dashboard)/driver/[id]/payment/page.tsx`       | ⏳ Pending | Move to route group |
| `src/app/driver-account-page/[id]/coverage-area/page.tsx` | `src/app/(dashboard)/driver/[id]/coverage-area/page.tsx` | ⏳ Pending | Move to route group |

##### Mover Dashboard

| Source File                                         | Target File                                        | Status     | Notes               |
| --------------------------------------------------- | -------------------------------------------------- | ---------- | ------------------- |
| `src/app/mover-account-page/[id]/page.tsx`          | `src/app/(dashboard)/mover/[id]/page.tsx`          | ⏳ Pending | Move to route group |
| `src/app/mover-account-page/[id]/calendar/page.tsx` | `src/app/(dashboard)/mover/[id]/calendar/page.tsx` | ⏳ Pending | Move to route group |
| `src/app/mover-account-page/[id]/vehicle/page.tsx`  | `src/app/(dashboard)/mover/[id]/vehicle/page.tsx`  | ⏳ Pending | Move to route group |
| `src/app/mover-account-page/[id]/payment/page.tsx`  | `src/app/(dashboard)/mover/[id]/payment/page.tsx`  | ⏳ Pending | Move to route group |

### Utility Migration (62 files)

#### Core Utilities

| Source File                   | Target File                        | Status     | Notes              |
| ----------------------------- | ---------------------------------- | ---------- | ------------------ |
| `src/lib/utils.ts`            | `src/lib/utils/generalUtils.ts`    | ⏳ Pending | Rename for clarity |
| `src/lib/date-utils.ts`       | `src/lib/utils/dateUtils.ts`       | ⏳ Pending | Move to utils      |
| `src/lib/validation-utils.ts` | `src/lib/utils/validationUtils.ts` | ⏳ Pending | Move to utils      |
| `src/lib/formatting-utils.ts` | `src/lib/utils/formattingUtils.ts` | ⏳ Pending | Move to utils      |

#### Integration Clients

| Source File           | Target File                                    | Status     | Notes                |
| --------------------- | ---------------------------------------------- | ---------- | -------------------- |
| `src/lib/onfleet.ts`  | `src/lib/integrations/onfleetApiClient.ts`     | ⏳ Pending | Move to integrations |
| `src/lib/stripe.ts`   | `src/lib/integrations/stripePaymentService.ts` | ⏳ Pending | Move to integrations |
| `src/lib/twilio.ts`   | `src/lib/messaging/twilioService.ts`           | ⏳ Pending | **CONSOLIDATE**      |
| `src/lib/sendgrid.ts` | `src/lib/messaging/sendgridService.ts`         | ⏳ Pending | **CONSOLIDATE**      |
| `src/lib/prisma.ts`   | `src/lib/database/prismaClient.ts`             | ⏳ Pending | Move to database     |

#### Authentication

| Source File             | Target File                      | Status     | Notes        |
| ----------------------- | -------------------------------- | ---------- | ------------ |
| `src/lib/auth.ts`       | `src/lib/auth/nextAuthConfig.ts` | ⏳ Pending | Move to auth |
| `src/lib/auth-utils.ts` | `src/lib/auth/authUtils.ts`      | ⏳ Pending | Move to auth |

#### Validation Schemas

| Source File                                | Target File                                    | Status     | Notes               |
| ------------------------------------------ | ---------------------------------------------- | ---------- | ------------------- |
| `src/lib/validation/appointment-schema.ts` | `src/lib/validations/appointmentValidation.ts` | ⏳ Pending | Move to validations |
| `src/lib/validation/user-schema.ts`        | `src/lib/validations/userValidation.ts`        | ⏳ Pending | Move to validations |
| `src/lib/validation/driver-schema.ts`      | `src/lib/validations/driverValidation.ts`      | ⏳ Pending | Move to validations |
| `src/lib/validation/payment-schema.ts`     | `src/lib/validations/paymentValidation.ts`     | ⏳ Pending | Move to validations |

---

## Critical Issues Requiring Immediate Attention

### 1. Performance Issues (CRITICAL)

- **Admin Task Routing**: String-parsing with client-side redirects
- **Large Files**: 4 files >1000 lines need refactoring
- **Image Placeholders**: bg-slate divs need Next.js Image replacement

### 2. Consolidation Opportunities (HIGH PRIORITY)

- **Messaging System**: Twilio/SendGrid scattered across codebase
- **Authentication Components**: Duplicated login/signup patterns
- **Form Components**: Repeated validation and error handling

### 3. SEO & Accessibility Issues (HIGH PRIORITY)

- **Image Optimization**: Replace placeholder divs with proper images
- **Semantic HTML**: Improve heading hierarchy and landmarks
- **Performance**: Core Web Vitals optimization needed

---

## Legend

### Status Indicators

- ✅ **COMPLETED**: Task finished and validated
- 🔄 **IN PROGRESS**: Currently being worked on
- ⏳ **PENDING**: Not yet started
- 🚫 **BLOCKED**: Waiting for dependencies

### Priority Indicators

- **CRITICAL**: Must be addressed immediately
- **HIGH**: Important for project success
- **MEDIUM**: Should be completed in phase
- **LOW**: Nice to have, can be deferred

### Migration Types

- **Direct Copy**: No changes needed
- **Rename Path**: Only path/name changes
- **Move to Features**: Reorganize by domain
- **REFACTOR**: Significant code changes needed
- **CONSOLIDATE**: Merge multiple files
- **ROUTING REFACTOR**: Fix routing performance issues

---

## Next Steps

1. **Complete SETUP_006_PROJECT_README** (1 hour)
2. **Begin Phase 2: Type System & Utilities**
3. **Prioritize UTILS_003_MESSAGING_SYSTEM** (consolidation opportunity)
4. **Address admin task routing** in Phase 6
5. **Focus on large file refactoring** throughout migration

---

**Last Updated**: 2025-01-28  
**Total Progress**: 5/6 setup tasks completed (83%)  
**Next Milestone**: Phase 2 Type System & Utilities
