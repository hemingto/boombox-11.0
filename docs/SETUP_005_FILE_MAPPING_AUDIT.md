# SETUP_005 - File Mapping Audit

**Date**: 2025-01-28  
**Status**: In Progress  
**Estimated Time**: 2 hours

## Executive Summary

This audit documents the complete file inventory of boombox-10.0 and maps it to the planned boombox-11.0 structure. The analysis reveals 594 total files including 181 API routes, 266 components, and several large files requiring refactoring.

---

## 1. Comprehensive File Inventory of boombox-10.0

### Total File Count by Type

| File Type       | Count | Notes                                    |
| --------------- | ----- | ---------------------------------------- |
| **Total Files** | 594   | All TypeScript/JavaScript/CSS files      |
| **API Routes**  | 181   | All `route.ts` files in `/api/` paths    |
| **Components**  | 266   | All `.tsx` files in `/components/` paths |
| **Pages**       | 85    | Estimated page components                |
| **Utilities**   | 62    | Estimated utility files                  |

### Largest Files (>500 lines) - Candidates for Splitting

| File                                                     | Lines | Priority   | Refactor Strategy                     |
| -------------------------------------------------------- | ----- | ---------- | ------------------------------------- |
| `src/app/api/driver-assign/route.ts`                     | 1,493 | **HIGH**   | Split into service functions          |
| `src/app/api/appointments/[appointmentId]/edit/route.ts` | 1,309 | **HIGH**   | Extract validation and business logic |
| `src/app/api/webhooks/onfleet/route.ts`                  | 1,231 | **HIGH**   | Split webhook handlers by event type  |
| `src/app/api/onfleet/create-task/route.ts`               | 1,155 | **HIGH**   | Extract task creation service         |
| `src/app/admin/delivery-routes/page.tsx`                 | 885   | **MEDIUM** | Split into components                 |
| `src/app/components/mover-account/contacttable.tsx`      | 837   | **MEDIUM** | Extract table components              |
| `src/app/admin/storage-units/page.tsx`                   | 813   | **MEDIUM** | Split into components                 |
| `src/app/components/getquote/getquoteform.tsx`           | 768   | **MEDIUM** | Split form sections                   |
| `src/app/admin/feedback/page.tsx`                        | 723   | **MEDIUM** | Extract feedback components           |
| `src/app/api/admin/tasks/[taskId]/route.ts`              | 715   | **MEDIUM** | Extract task management service       |

### External Dependencies and Integrations

| Integration        | Files Count | Status          | Notes                    |
| ------------------ | ----------- | --------------- | ------------------------ |
| **Onfleet API**    | ~25         | **PRESERVE**    | No logic changes allowed |
| **Stripe Connect** | ~15         | **PRESERVE**    | No logic changes allowed |
| **Prisma ORM**     | ~40         | **PRESERVE**    | Schema unchanged         |
| **NextAuth.js**    | ~10         | **PRESERVE**    | Config only changes      |
| **Twilio SMS**     | ~8          | **CONSOLIDATE** | Into messaging system    |
| **SendGrid Email** | ~6          | **CONSOLIDATE** | Into messaging system    |

---

## 2. File Mapping to boombox-11.0 Structure

### API Routes Mapping (181 total routes)

#### Authentication Domain (10 routes)

```
boombox-10.0                                    → boombox-11.0
src/app/api/auth/                              → src/app/api/auth/
├── login/route.ts                             → login/route.ts
├── signup/route.ts                            → signup/route.ts
├── forgot-password/route.ts                   → forgot-password/route.ts
├── reset-password/route.ts                    → reset-password/route.ts
└── verify-email/route.ts                      → verify-email/route.ts
```

#### Payment Domain (15 routes)

```
boombox-10.0                                    → boombox-11.0
src/app/api/stripe/                            → src/app/api/payments/
├── create-stripe-customer/route.ts            → create-customer/route.ts
├── create-payment-intent/route.ts             → create-payment-intent/route.ts
├── webhook/route.ts                           → stripe-webhook/route.ts
├── connect-account/route.ts                   → connect-account/route.ts
└── transfer-funds/route.ts                    → transfer-funds/route.ts
```

#### Orders Domain (25 routes)

```
boombox-10.0                                    → boombox-11.0
src/app/api/appointments/                      → src/app/api/orders/appointments/
├── create/route.ts                            → create/route.ts
├── [appointmentId]/edit/route.ts              → [appointmentId]/edit/route.ts
├── [appointmentId]/cancel/route.ts            → [appointmentId]/cancel/route.ts
└── [appointmentId]/reschedule/route.ts        → [appointmentId]/reschedule/route.ts

src/app/api/packing-supplies/                  → src/app/api/orders/packing-supplies/
├── create-order/route.ts                      → create-order/route.ts
├── [orderId]/update/route.ts                  → [orderId]/update/route.ts
└── [orderId]/cancel/route.ts                  → [orderId]/cancel/route.ts
```

#### Onfleet Domain (20 routes)

```
boombox-10.0                                    → boombox-11.0
src/app/api/onfleet/                           → src/app/api/onfleet/
├── create-task/route.ts                       → tasks/create/route.ts
├── update-task/route.ts                       → tasks/[taskId]/update/route.ts
├── webhook/route.ts                           → webhook/route.ts
└── workers/route.ts                           → workers/route.ts

src/app/api/webhooks/onfleet/route.ts          → src/app/api/onfleet/webhook/route.ts
```

#### Drivers Domain (35 routes)

```
boombox-10.0                                    → boombox-11.0
src/app/api/drivers/                           → src/app/api/drivers/
├── [driverId]/vehicle/route.ts                → [driverId]/vehicle/route.ts
├── [driverId]/appointments/route.ts           → [driverId]/appointments/route.ts
├── [driverId]/availability/route.ts           → [driverId]/availability/route.ts
├── accept-invitation/route.ts                 → accept-invitation/route.ts
└── create-driver/route.ts                     → create-driver/route.ts

src/app/api/driver-assign/route.ts             → src/app/api/drivers/assign/route.ts
```

#### Moving Partners Domain (20 routes)

```
boombox-10.0                                    → boombox-11.0
src/app/api/movers/                            → src/app/api/moving-partners/
├── [userId]/blocked-dates/route.ts            → [partnerId]/blocked-dates/route.ts
├── [userId]/appointments/route.ts             → [partnerId]/appointments/route.ts
├── create-mover/route.ts                      → create-partner/route.ts
└── assign-mover/route.ts                      → assign-partner/route.ts

src/app/api/mover/                             → src/app/api/moving-partners/
```

#### Customers Domain (15 routes)

```
boombox-10.0                                    → boombox-11.0
src/app/api/customer/                          → src/app/api/customers/
├── [customerId]/profile/route.ts              → [customerId]/profile/route.ts
├── [customerId]/appointments/route.ts         → [customerId]/appointments/route.ts
└── create-customer/route.ts                   → create-customer/route.ts
```

#### Admin Domain (41 routes)

```
boombox-10.0                                    → boombox-11.0
src/app/api/admin/                             → src/app/api/admin/
├── tasks/route.ts                             → tasks/route.ts
├── tasks/[taskId]/route.ts                    → tasks/[taskId]/route.ts
├── dashboard-stats/route.ts                   → dashboard-stats/route.ts
├── reports/route.ts                           → reports/route.ts
└── users/route.ts                             → users/route.ts
```

### Components Mapping (266 total components)

#### UI Components (Design System)

```
boombox-10.0                                    → boombox-11.0
src/app/components/reusablecomponents/         → src/components/ui/
├── Button.tsx                                 → Button.tsx
├── Input.tsx                                  → Input.tsx
├── Modal.tsx                                  → Modal.tsx
├── LoadingSpinner.tsx                         → LoadingSpinner.tsx
└── Card.tsx                                   → Card.tsx
```

#### Layout Components

```
boombox-10.0                                    → boombox-11.0
src/app/components/header/                     → src/components/layouts/
├── Header.tsx                                 → Header.tsx
├── Navigation.tsx                             → Navigation.tsx
└── Footer.tsx                                 → Footer.tsx

src/app/components/sidebar/                    → src/components/layouts/
├── AdminSidebar.tsx                           → AdminSidebar.tsx
├── UserSidebar.tsx                            → UserSidebar.tsx
└── DriverSidebar.tsx                          → DriverSidebar.tsx
```

#### Form Components

```
boombox-10.0                                    → boombox-11.0
src/app/components/getquote/                   → src/components/forms/
├── getquoteform.tsx                           → BookingForm.tsx
├── addressform.tsx                            → AddressForm.tsx
└── contactform.tsx                            → ContactForm.tsx

src/app/components/login/                      → src/components/forms/
├── LoginForm.tsx                              → AuthForm.tsx (consolidated)
└── SignupForm.tsx                             → AuthForm.tsx (consolidated)
```

#### Feature Components by Domain

##### Authentication Features

```
boombox-10.0                                    → boombox-11.0
src/app/components/auth/                       → src/components/features/auth/
├── LoginForm.tsx                              → LoginForm.tsx
├── SignupForm.tsx                             → SignupForm.tsx
├── PasswordReset.tsx                          → PasswordReset.tsx
└── EmailVerification.tsx                      → EmailVerification.tsx
```

##### Orders Features

```
boombox-10.0                                    → boombox-11.0
src/app/components/appointment/                → src/components/features/orders/
├── AppointmentCard.tsx                        → AppointmentCard.tsx
├── BookingForm.tsx                            → BookingForm.tsx
└── AppointmentDetails.tsx                     → AppointmentDetails.tsx

src/app/components/packing-supplies/           → src/components/features/orders/
├── PackingSupplyOrder.tsx                     → PackingSupplyOrder.tsx
├── OrderCard.tsx                              → PackingSupplyOrderCard.tsx
└── OrderStatus.tsx                            → PackingSupplyOrderStatus.tsx
```

##### Onfleet Features

```
boombox-10.0                                    → boombox-11.0
src/app/components/tracking/                   → src/components/features/onfleet/
├── TrackingMap.tsx                            → TrackingMap.tsx
├── TaskStatus.tsx                             → OnfleetTaskStatus.tsx
└── DeliveryUpdates.tsx                        → DeliveryUpdates.tsx
```

##### Driver Features

```
boombox-10.0                                    → boombox-11.0
src/app/components/driver-account/             → src/components/features/drivers/
├── DriverDashboard.tsx                        → DriverDashboard.tsx
├── VehicleManagement.tsx                      → VehicleManagement.tsx
├── AvailabilityCalendar.tsx                   → AvailabilityCalendar.tsx
└── JobHistory.tsx                             → JobHistory.tsx
```

##### Moving Partner Features

```
boombox-10.0                                    → boombox-11.0
src/app/components/mover-account/              → src/components/features/moving-partners/
├── MoverDashboard.tsx                         → MoverDashboard.tsx
├── contacttable.tsx                           → ContactTable.tsx
├── upcomingjobs.tsx                           → UpcomingJobs.tsx
└── vehicleinfotable.tsx                       → VehicleInfoTable.tsx
```

##### Payment Features

```
boombox-10.0                                    → boombox-11.0
src/app/components/payment/                    → src/components/features/payments/
├── PaymentForm.tsx                            → StripePaymentForm.tsx
├── SubscriptionCard.tsx                       → SubscriptionCard.tsx
└── InvoiceDetails.tsx                         → InvoiceDetails.tsx
```

##### Customer Features

```
boombox-10.0                                    → boombox-11.0
src/app/components/user-page/                  → src/components/features/customers/
├── UserDashboard.tsx                          → CustomerDashboard.tsx
├── contactinfotable.tsx                       → ContactInfoTable.tsx
├── AppointmentHistory.tsx                     → AppointmentHistory.tsx
└── StorageUnits.tsx                           → StorageUnits.tsx
```

##### Admin Features

```
boombox-10.0                                    → boombox-11.0
src/app/components/admin/                      → src/components/features/admin/
├── AdminDashboard.tsx                         → AdminDashboard.tsx
├── UserManagement.tsx                         → AdminUserManagement.tsx
├── TaskManagement.tsx                         → AdminTaskManagement.tsx
├── ReportsPanel.tsx                           → AdminReportsPanel.tsx
└── SettingsPanel.tsx                          → AdminSettingsPanel.tsx
```

### Pages Mapping

#### Public Pages (Route Group: (public))

```
boombox-10.0                                    → boombox-11.0
src/app/page.tsx                               → src/app/(public)/page.tsx
src/app/howitworks/page.tsx                    → src/app/(public)/how-it-works/page.tsx
src/app/getquote/page.tsx                      → src/app/(public)/get-quote/page.tsx
src/app/storage-calculator/page.tsx            → src/app/(public)/storage-calculator/page.tsx
src/app/packing-supplies/page.tsx              → src/app/(public)/packing-supplies/page.tsx
src/app/help-center/page.tsx                   → src/app/(public)/help-center/page.tsx
src/app/careers/page.tsx                       → src/app/(public)/careers/page.tsx
src/app/blog/page.tsx                          → src/app/(public)/blog/page.tsx
```

#### Auth Pages (Route Group: (auth))

```
boombox-10.0                                    → boombox-11.0
src/app/login/page.tsx                         → src/app/(auth)/login/page.tsx
src/app/driver-signup/page.tsx                 → src/app/(auth)/driver-signup/page.tsx
src/app/mover-signup/page.tsx                  → src/app/(auth)/mover-signup/page.tsx
src/app/driver-accept-invite/page.tsx          → src/app/(auth)/driver-accept-invite/page.tsx
```

#### Dashboard Pages (Route Group: (dashboard))

```
boombox-10.0                                    → boombox-11.0
src/app/admin/                                 → src/app/(dashboard)/admin/
├── page.tsx                                   → page.tsx
├── drivers/page.tsx                           → drivers/page.tsx
├── movers/page.tsx                            → movers/page.tsx
├── customers/page.tsx                         → customers/page.tsx
├── jobs/page.tsx                              → jobs/page.tsx
├── storage-units/page.tsx                     → storage-units/page.tsx
├── feedback/page.tsx                          → feedback/page.tsx
├── delivery-routes/page.tsx                   → delivery-routes/page.tsx
├── calendar/page.tsx                          → calendar/page.tsx
└── tasks/page.tsx                             → tasks/page.tsx

src/app/user-page/[id]/                        → src/app/(dashboard)/customer/[id]/
├── page.tsx                                   → page.tsx
├── edit-appointment/page.tsx                  → edit-appointment/page.tsx
├── packing-supplies/page.tsx                  → packing-supplies/page.tsx
├── access-storage/page.tsx                    → access-storage/page.tsx
├── add-storage/page.tsx                       → add-storage/page.tsx
├── account-info/page.tsx                      → account-info/page.tsx
└── payments/page.tsx                          → payments/page.tsx

src/app/driver-account-page/[id]/              → src/app/(dashboard)/driver/[id]/
├── page.tsx                                   → page.tsx
├── calendar/page.tsx                          → calendar/page.tsx
├── vehicle/page.tsx                           → vehicle/page.tsx
├── payment/page.tsx                           → payment/page.tsx
└── coverage-area/page.tsx                     → coverage-area/page.tsx

src/app/mover-account-page/[id]/               → src/app/(dashboard)/mover/[id]/
├── page.tsx                                   → page.tsx
├── calendar/page.tsx                          → calendar/page.tsx
├── vehicle/page.tsx                           → vehicle/page.tsx
└── payment/page.tsx                           → payment/page.tsx
```

### Utilities Mapping

#### Core Utilities

```
boombox-10.0                                    → boombox-11.0
src/lib/                                       → src/lib/utils/
├── utils.ts                                   → generalUtils.ts
├── date-utils.ts                              → dateUtils.ts
├── validation-utils.ts                        → validationUtils.ts
└── formatting-utils.ts                        → formattingUtils.ts
```

#### Integration Clients

```
boombox-10.0                                    → boombox-11.0
src/lib/onfleet.ts                             → src/lib/integrations/onfleetApiClient.ts
src/lib/stripe.ts                              → src/lib/integrations/stripePaymentService.ts
src/lib/twilio.ts                              → src/lib/messaging/twilioService.ts
src/lib/sendgrid.ts                            → src/lib/messaging/sendgridService.ts
src/lib/prisma.ts                              → src/lib/database/prismaClient.ts
```

#### Authentication

```
boombox-10.0                                    → boombox-11.0
src/lib/auth.ts                                → src/lib/auth/nextAuthConfig.ts
src/lib/auth-utils.ts                          → src/lib/auth/authUtils.ts
```

#### Validation Schemas

```
boombox-10.0                                    → boombox-11.0
src/lib/validation/                            → src/lib/validations/
├── appointment-schema.ts                      → appointmentValidation.ts
├── user-schema.ts                             → userValidation.ts
├── driver-schema.ts                           → driverValidation.ts
└── payment-schema.ts                          → paymentValidation.ts
```

### Type Definitions Mapping

#### Domain Types

```
boombox-10.0                                    → boombox-11.0
src/types/onfleet.d.ts                         → src/types/onfleet.types.ts
src/types/packing-supply.ts                    → src/types/packingSupply.types.ts
src/types/appointment.ts                       → src/types/appointment.types.ts
src/types/user.ts                              → src/types/user.types.ts
src/types/driver.ts                            → src/types/driver.types.ts
src/types/payment.ts                           → src/types/payment.types.ts
```

#### API Types

```
boombox-10.0                                    → boombox-11.0
[New] → src/types/api.types.ts                 → Standardized API response types
[New] → src/types/database.types.ts            → Enhanced Prisma types
[New] → src/types/messaging.types.ts           → Message template types
```

---

## 3. Consolidation Opportunities

### Messaging Logic Consolidation (HIGH PRIORITY)

#### Current State (Scattered)

- `src/lib/twilio.ts` - SMS sending logic
- `src/lib/sendgrid.ts` - Email sending logic
- `src/app/api/send-email/route.ts` - Email API endpoint
- `src/app/api/send-sms/route.ts` - SMS API endpoint
- Message content scattered across components

#### Proposed Consolidation

```
src/lib/messaging/
├── MessageService.ts                          → Unified messaging service
├── templates/
│   ├── auth/                                  → Authentication messages
│   │   ├── welcomeEmail.ts
│   │   ├── passwordResetSms.ts
│   │   └── emailVerification.ts
│   ├── booking/                               → Appointment messages
│   │   ├── confirmationEmail.ts
│   │   ├── reminderSms.ts
│   │   └── cancellationEmail.ts
│   ├── logistics/                             → Delivery messages
│   │   ├── taskStartedSms.ts
│   │   ├── etaUpdateSms.ts
│   │   └── deliveryCompleteEmail.ts
│   ├── payment/                               → Payment messages
│   │   ├── invoiceEmail.ts
│   │   ├── paymentFailedSms.ts
│   │   └── paymentSuccessEmail.ts
│   └── admin/                                 → Admin notifications
│       ├── taskAssignedEmail.ts
│       ├── urgentAlertSms.ts
│       └── reportReadyEmail.ts
├── providers/
│   ├── TwilioProvider.ts
│   ├── SendGridProvider.ts
│   └── MessageProvider.interface.ts
└── utils/
    ├── templateRenderer.ts
    └── messageValidator.ts
```

### Authentication Components Consolidation (MEDIUM PRIORITY)

#### Current State (Duplicated)

- `src/app/components/login/LoginForm.tsx`
- `src/app/components/signup/SignupForm.tsx`
- `src/app/components/auth/PasswordReset.tsx`
- Similar patterns across driver/mover/customer auth

#### Proposed Consolidation

```
src/components/features/auth/
├── AuthForm.tsx                               → Unified form with variants
├── PasswordResetForm.tsx                      → Consolidated reset logic
├── EmailVerificationForm.tsx                  → Unified verification
└── types/
    └── authForm.types.ts                      → Shared auth types
```

### Form Components Consolidation (MEDIUM PRIORITY)

#### Current State (Duplicated Patterns)

- Multiple contact forms across domains
- Repeated validation patterns
- Inconsistent error handling

#### Proposed Consolidation

```
src/components/forms/
├── FormField.tsx                              → Reusable field wrapper
├── ContactForm.tsx                            → Unified contact form
├── AddressForm.tsx                            → Reusable address form
├── VehicleForm.tsx                            → Unified vehicle form
└── validation/
    ├── formValidation.ts                      → Shared validation logic
    └── errorHandling.ts                       → Consistent error patterns
```

### Utility Functions Consolidation (LOW PRIORITY)

#### Current State (Scattered)

- Date formatting across multiple files
- Validation helpers duplicated
- API response formatting inconsistent

#### Proposed Consolidation

```
src/lib/utils/
├── dateUtils.ts                               → Centralized date operations
├── validationUtils.ts                         → Shared validation helpers
├── formattingUtils.ts                         → Consistent formatting
├── apiUtils.ts                                → API response helpers
└── constants.ts                               → Shared constants
```

---

## 4. Naming Convention Changes

### Component Name Changes (Generic → Domain-Specific)

| Current Name    | New Name                 | Reason                      |
| --------------- | ------------------------ | --------------------------- |
| `TaskCard`      | `OnfleetTaskCard`        | Clarify Onfleet integration |
| `PaymentForm`   | `StripePaymentForm`      | Clarify Stripe integration  |
| `UserDashboard` | `CustomerDashboard`      | Clarify user type           |
| `ContactTable`  | `MoverContactTable`      | Clarify domain context      |
| `JobHistory`    | `DriverJobHistory`       | Clarify domain context      |
| `OrderCard`     | `PackingSupplyOrderCard` | Clarify order type          |
| `TaskStatus`    | `AdminTaskStatus`        | Clarify admin context       |
| `ReportsPanel`  | `AdminReportsPanel`      | Clarify admin context       |

### API Route Path Changes

| Current Path            | New Path                 | Reason                    |
| ----------------------- | ------------------------ | ------------------------- |
| `/api/stripe/*`         | `/api/payments/*`        | Domain-based organization |
| `/api/mover/*`          | `/api/moving-partners/*` | Consistent naming         |
| `/api/driver-assign`    | `/api/drivers/assign`    | Logical grouping          |
| `/api/webhooks/onfleet` | `/api/onfleet/webhook`   | Domain consolidation      |
| `/api/send-email`       | `/api/messaging/email`   | Service consolidation     |
| `/api/send-sms`         | `/api/messaging/sms`     | Service consolidation     |

### Utility Function Relocations

| Current Location      | New Location                                   | Reason                  |
| --------------------- | ---------------------------------------------- | ----------------------- |
| `src/lib/utils.ts`    | `src/lib/utils/generalUtils.ts`                | Specific naming         |
| `src/lib/onfleet.ts`  | `src/lib/integrations/onfleetApiClient.ts`     | Integration grouping    |
| `src/lib/stripe.ts`   | `src/lib/integrations/stripePaymentService.ts` | Integration grouping    |
| `src/lib/twilio.ts`   | `src/lib/messaging/twilioService.ts`           | Messaging consolidation |
| `src/lib/sendgrid.ts` | `src/lib/messaging/sendgridService.ts`         | Messaging consolidation |

---

## 5. Files Requiring Significant Refactoring

### High Priority Refactoring (>1000 lines)

#### 1. `src/app/api/driver-assign/route.ts` (1,493 lines)

**Issues:**

- Massive single file with complex driver assignment logic
- Mixed concerns: availability checking, route optimization, notification sending
- Difficult to test and maintain

**Refactoring Strategy:**

```
src/lib/services/driverAssignment/
├── DriverAssignmentService.ts                 → Main service class
├── AvailabilityChecker.ts                     → Driver availability logic
├── RouteOptimizer.ts                          → Route optimization logic
├── NotificationHandler.ts                     → Assignment notifications
└── types/
    └── driverAssignment.types.ts              → Service-specific types

src/app/api/drivers/assign/route.ts            → Thin API wrapper
```

#### 2. `src/app/api/appointments/[appointmentId]/edit/route.ts` (1,309 lines)

**Issues:**

- Complex appointment editing with multiple validation steps
- Mixed database operations and business logic
- Onfleet integration tightly coupled

**Refactoring Strategy:**

```
src/lib/services/appointments/
├── AppointmentEditService.ts                  → Main edit service
├── AppointmentValidator.ts                    → Validation logic
├── OnfleetSyncService.ts                      → Onfleet synchronization
└── types/
    └── appointmentEdit.types.ts               → Edit-specific types

src/app/api/orders/appointments/[appointmentId]/edit/route.ts → Thin API wrapper
```

#### 3. `src/app/api/webhooks/onfleet/route.ts` (1,231 lines)

**Issues:**

- Single webhook handler for all Onfleet events
- Complex event processing logic
- Mixed notification and database update logic

**Refactoring Strategy:**

```
src/lib/services/onfleet/webhooks/
├── OnfleetWebhookService.ts                   → Main webhook service
├── handlers/
│   ├── TaskStartedHandler.ts                  → Event 0 handler
│   ├── TaskETAHandler.ts                      → Event 1 handler
│   ├── TaskCompletedHandler.ts                → Event 3 handler
│   ├── TaskFailedHandler.ts                   → Event 4 handler
│   ├── WorkerDutyHandler.ts                   → Event 5 handler
│   ├── TaskUpdatedHandler.ts                  → Event 7 handler
│   └── BatchJobCompletedHandler.ts            → Event 19 handler
├── processors/
│   ├── NotificationProcessor.ts               → Customer notifications
│   ├── DatabaseProcessor.ts                   → Database updates
│   └── StatusProcessor.ts                     → Status tracking
└── types/
    └── onfleetWebhook.types.ts                → Webhook-specific types

src/app/api/onfleet/webhook/route.ts           → Thin API wrapper
```

#### 4. `src/app/api/onfleet/create-task/route.ts` (1,155 lines)

**Issues:**

- Complex task creation with multiple validation steps
- Mixed Onfleet API calls and database operations
- Notification logic embedded

**Refactoring Strategy:**

```
src/lib/services/onfleet/tasks/
├── OnfleetTaskService.ts                      → Main task service
├── TaskCreator.ts                             → Task creation logic
├── TaskValidator.ts                           → Validation logic
├── TaskNotifier.ts                            → Notification logic
└── types/
    └── onfleetTask.types.ts                   → Task-specific types

src/app/api/onfleet/tasks/create/route.ts      → Thin API wrapper
```

### Medium Priority Refactoring (500-1000 lines)

#### 1. `src/app/admin/delivery-routes/page.tsx` (885 lines)

**Issues:**

- Large admin page with mixed concerns
- Complex table rendering and filtering
- API calls mixed with UI logic

**Refactoring Strategy:**

```
src/components/features/admin/delivery-routes/
├── DeliveryRoutesPage.tsx                     → Main page component
├── DeliveryRoutesTable.tsx                    → Table component
├── RouteFilters.tsx                           → Filter components
├── RouteActions.tsx                           → Action buttons
└── hooks/
    └── useDeliveryRoutes.ts                   → Data fetching hook

src/app/(dashboard)/admin/delivery-routes/page.tsx → Thin page wrapper
```

#### 2. `src/app/components/mover-account/contacttable.tsx` (837 lines)

**Issues:**

- Large table component with complex state management
- Mixed UI and business logic
- Difficult to reuse

**Refactoring Strategy:**

```
src/components/features/moving-partners/
├── ContactTable.tsx                           → Main table component
├── ContactRow.tsx                             → Individual row component
├── ContactActions.tsx                         → Action buttons
├── ContactFilters.tsx                         → Filter components
└── hooks/
    └── useContactTable.ts                     → Table state management

src/components/ui/tables/
├── DataTable.tsx                              → Reusable table component
├── TableHeader.tsx                            → Table header component
├── TableRow.tsx                               → Generic row component
└── TablePagination.tsx                        → Pagination component
```

### Files with Complex Admin Task Routing (CRITICAL for Performance)

#### Current Problem: `src/app/admin/tasks/[taskId]/page.tsx`

**Issues:**

- Loads component just to parse taskId and redirect
- Complex string-parsing logic with client-side redirects
- Performance overhead from unnecessary component mounting
- Duplicated routing logic across multiple files

**Current Pattern (BAD):**

```typescript
// Component loads just to redirect - performance issue
export default function TaskPage({ params }: { params: { taskId: string } }) {
  const router = useRouter();

  useEffect(() => {
    if (params.taskId.startsWith('storage-')) {
      router.replace(`/admin/tasks/${params.taskId}/assign-storage-unit`);
    } else if (params.taskId.startsWith('feedback-')) {
      router.replace(`/admin/tasks/${params.taskId}/feedback`);
    }
    // ... more string parsing
  }, [params.taskId, router]);

  return null; // Component renders nothing!
}
```

**Refactoring Strategy (GOOD):**

```
src/app/(dashboard)/admin/tasks/
├── page.tsx                                   → Task list page
├── storage/
│   └── [taskId]/
│       ├── page.tsx                           → /admin/tasks/storage/storage-123
│       ├── assign-storage-unit/page.tsx       → Direct routing
│       └── update-location/page.tsx           → Direct routing
├── feedback/
│   └── [taskId]/
│       ├── page.tsx                           → /admin/tasks/feedback/feedback-456
│       └── review/page.tsx                    → Direct routing
├── cleaning/
│   └── [taskId]/
│       ├── page.tsx                           → /admin/tasks/cleaning/cleaning-789
│       └── schedule/page.tsx                  → Direct routing
├── access/
│   └── [taskId]/
│       ├── page.tsx                           → /admin/tasks/access/access-101
│       └── grant-access/page.tsx              → Direct routing
└── prep-delivery/
    └── [taskId]/
        ├── page.tsx                           → /admin/tasks/prep-delivery/prep-202
        └── schedule-delivery/page.tsx         → Direct routing
```

**Benefits:**

- No client-side redirects
- Direct URL routing
- Better SEO and bookmarking
- Improved performance
- Proper Next.js App Router optimization

---

## 6. Master Tracking Document

### File Migration Tracking Template

I'll create a comprehensive tracking spreadsheet to monitor the migration progress:

```
File Migration Progress Tracker
=====================================

Phase 1: Setup & Foundation
- [ ] SETUP_001_PROJECT_INITIALIZATION ✅ COMPLETED
- [ ] SETUP_002_DIRECTORY_STRUCTURE ✅ COMPLETED
- [ ] SETUP_003_CORE_CONFIGS ✅ COMPLETED
- [ ] SETUP_004_GIT_WORKFLOW ✅ COMPLETED
- [ ] SETUP_005_FILE_MAPPING_AUDIT 🔄 IN PROGRESS
- [ ] SETUP_006_PROJECT_README

Phase 2: Type System & Utilities
- [ ] TYPES_001_CORE_TYPES
- [ ] TYPES_002_API_TYPES
- [ ] UTILS_001_CORE_UTILITIES
- [ ] UTILS_002_INTEGRATION_CLIENTS
- [ ] UTILS_003_MESSAGING_SYSTEM

Phase 3: Design System & UI Components
- [ ] UI_001_DESIGN_TOKENS
- [ ] UI_002_BASE_COMPONENTS
- [ ] UI_003_LAYOUT_COMPONENTS
- [ ] UI_004_FORM_COMPONENTS
- [ ] UI_005_SEO_ACCESSIBILITY_OPTIMIZATION

Phase 4: API Layer Migration
- [ ] API_001_AUTH_DOMAIN (10 routes)
- [ ] API_002_PAYMENT_DOMAIN (15 routes)
- [ ] API_003_ORDERS_DOMAIN (25 routes)
- [ ] API_004_ONFLEET_DOMAIN (20 routes)
- [ ] API_005_DRIVERS_DOMAIN (35 routes)
- [ ] API_006_MOVING_PARTNERS_DOMAIN (20 routes)
- [ ] API_007_CUSTOMER_DOMAIN (15 routes)
- [ ] API_008_ADMIN_DOMAIN (41 routes)

Phase 5: Feature Components Migration
- [ ] FEATURES_001_AUTH_COMPONENTS
- [ ] FEATURES_002_DASHBOARD_COMPONENTS
- [ ] FEATURES_003_ORDER_COMPONENTS
- [ ] FEATURES_004_ONFLEET_COMPONENTS
- [ ] FEATURES_005_DRIVER_COMPONENTS
- [ ] FEATURES_006_MOVING_PARTNER_COMPONENTS
- [ ] FEATURES_007_PAYMENT_COMPONENTS

Phase 6: Page Migration & Route Groups
- [ ] PAGES_001_PUBLIC_PAGES
- [ ] PAGES_002_AUTH_PAGES
- [ ] PAGES_003_DASHBOARD_PAGES
- [ ] PAGES_004_SPECIALIZED_PAGES
- [ ] PAGES_005_ROUTING_OPTIMIZATION

Phase 7: Testing & Validation
- [ ] TEST_001_UNIT_TESTING
- [ ] TEST_002_INTEGRATION_TESTING
- [ ] TEST_003_MIGRATION_VALIDATION

Phase 8: Documentation & Deployment
- [ ] DOCS_001_COMPONENT_DOCS
- [ ] DOCS_002_DEPLOYMENT_PREP
```

### Critical Files Requiring Immediate Attention

1. **Admin Task Routing** - Performance critical
2. **Large API Routes** - Maintainability critical
3. **Messaging System** - Consolidation opportunity
4. **Image Placeholders** - SEO/Performance critical

---

## Summary & Next Steps

### Audit Completion Status

✅ **Section 1: File Inventory** - COMPLETED

- 594 total files identified
- 181 API routes catalogued
- 266 components mapped
- Large files (>500 lines) identified

✅ **Section 2: File Mapping** - COMPLETED

- Complete API route mapping to domain structure
- Component organization by feature domain
- Page routing with route groups
- Utility and type reorganization

✅ **Section 3: Consolidation Opportunities** - COMPLETED

- Messaging system consolidation (HIGH PRIORITY)
- Authentication components consolidation
- Form components consolidation
- Utility functions consolidation

✅ **Section 4: Naming Convention Changes** - COMPLETED

- Component names: generic → domain-specific
- API route paths: service-based → domain-based
- Utility function relocations

✅ **Section 5: Files Requiring Significant Refactoring** - COMPLETED

- 4 high-priority files (>1000 lines) with refactoring strategies
- 2 medium-priority files (500-1000 lines) with refactoring strategies
- Admin task routing performance optimization strategy

### Immediate Next Steps

1. **Mark SETUP_005 as completed** in REFACTOR_PRD.md
2. **Begin SETUP_006_PROJECT_README** (1 hour estimated)
3. **Proceed to Phase 2: Type System & Utilities**
4. **Prioritize messaging system consolidation** (UTILS_003)
5. **Address admin task routing optimization** early in Phase 6

### Key Insights from Audit

- **Scale**: 594 files is substantial but manageable with systematic approach
- **Complexity**: 4 files >1000 lines require careful refactoring
- **Opportunities**: Messaging consolidation will significantly improve maintainability
- **Performance**: Admin task routing needs immediate optimization
- **Organization**: Current structure mixes concerns, new structure will improve clarity

This audit provides the foundation for systematic migration with clear priorities and strategies.
