# DIY Plan - 1 Storage Unit - Initial Pickup Customer Journey

This document provides a comprehensive step-by-step workflow for a new customer ordering 1 storage unit with the Do It Yourself (DIY) plan. It covers the complete journey from quote submission through to the storage unit appearing in the customer's account, including all data changes, API calls, webhooks, and admin tasks.

---

## Quick Reference

| Phase | Actor | Duration |
|-------|-------|----------|
| 1. Quote Submission | Customer | 5-10 minutes |
| 2. Driver Assignment | System/Driver | Up to 2 hours per offer |
| 3. Appointment Execution | Driver/Admin | 2-3 hours |
| 4. Post-Appointment | Admin | 15-30 minutes |

---

## Phase 1: Customer Quote Submission

### Step 1.1: Customer Fills Out GetQuoteForm

**Component:** `src/components/features/orders/get-quote/GetQuoteForm.tsx`

The customer completes a multi-step form:

| Step | Component | Data Captured |
|------|-----------|---------------|
| 1 | `QuoteBuilder` | Address, zipCode, cityName, coordinates, storageUnitCount (1), selectedPlan ("Do It Yourself Plan"), selectedInsurance |
| 2 | `Scheduler` | scheduledDate, scheduledTimeSlot |
| 3 | *(Skipped for DIY)* | - |
| 4 | `ConfirmAppointment` | firstName, lastName, email, phoneNumber, payment card (stored in Stripe) |
| 5 | `VerifyPhoneNumber` | Phone verification code |

> **Note:** Step 3 (ChooseLabor) is automatically skipped for DIY plan customers.

### Step 1.2: Stripe Customer Creation

**API:** `POST /api/payments/create-customer`

**Triggered When:** Customer clicks "Confirm Appointment" button

**Data Created:**

| System | Record | Key Fields |
|--------|--------|------------|
| **Stripe** | Customer | email, name, phone, paymentMethod attached |

**Returns:** `stripeCustomerId` for quote submission

---

### Step 1.3: Quote Submission

**API:** `POST /api/orders/submit-quote`

**Service:** `createAppointmentWithDriverAssignment()` in `src/lib/services/appointmentService.ts`

#### Database Records Created (Transaction):

| Table | Fields Created | Notes |
|-------|----------------|-------|
| **User** | `id`, `firstName`, `lastName`, `email`, `phoneNumber`, `stripeCustomerId` | New customer account |
| **Appointment** | `id`, `userId`, `appointmentType: "Initial Pickup"`, `address`, `zipcode`, `date`, `time`, `numberOfUnits: 1`, `planType: "Do It Yourself Plan"`, `insuranceCoverage`, `loadingHelpPrice`, `monthlyStorageRate`, `monthlyInsuranceRate`, `quotedPrice`, `status: "Scheduled"`, `jobCode` | Main appointment record |

---

### Step 1.4: Welcome Notifications Sent

**Service:** `MessageService` (Twilio)

| Recipient | Type | Template | Content |
|-----------|------|----------|---------|
| Customer | SMS | `welcomeSmsNewCustomer` | Appointment confirmation with date/time/address |
| Customer | Email | `welcomeEmailNewCustomer` | Welcome email with appointment details |
| Customer | In-App | `NotificationService` | Appointment confirmation notification |

---

### Step 1.5: Onfleet Task Creation (Async)

**Service:** `processOnfleetAndAssignDriver()` → `createOnfleetTasksWithDatabaseSave()`

**Creates 3 linked Onfleet tasks per storage unit:**

| Step | Task Name | Location | Dependency |
|------|-----------|----------|------------|
| **1** | Warehouse Pickup | Boombox Warehouse (SSF) | None |
| **2** | Customer Delivery | Customer Address | Depends on Step 1 |
| **3** | Return to Warehouse | Boombox Warehouse (SSF) | Depends on Step 2 |

#### Database Records Created:

| Table | Count | Key Fields |
|-------|-------|------------|
| **OnfleetTask** | 3 | `taskId`, `shortId`, `appointmentId`, `stepNumber` (1, 2, 3), `unitNumber: 1`, `driverNotificationStatus: null` |

#### Task Metadata (Stored in Onfleet):

```json
{
  "appointmentId": 12345,
  "userId": 67890,
  "step": "1" | "2" | "3",
  "unitNumber": 1,
  "appointmentType": "Initial Pickup",
  "planType": "Do It Yourself Plan",
  "stripeCustomerId": "cus_xxx",
  "insuranceCoverage": "Standard Protection"
}
```

---

### Step 1.6: Phone Verification

**Component:** `VerifyPhoneNumber`

**APIs:**
- `POST /api/auth/send-code` - Send 4-digit verification code via SMS
- `POST /api/auth/verify-code` - Verify code and authenticate user

**Post-Verification:**
- User authenticated via NextAuth
- Redirected to `/customer/[userId]` dashboard

---

## Phase 2: Driver Assignment

### Step 2.1: Find Available Drivers

**Service:** `handleDIYPlanAssignment()` in `driver-assign/route.ts`

**Team:** Boombox Delivery Network

**Driver Eligibility Criteria:**

| Criteria | Requirement |
|----------|-------------|
| `isApproved` | `true` |
| `applicationComplete` | `true` |
| `status` | `"Active"` |
| `onfleetWorkerId` | Valid Onfleet ID |
| Team Membership | Boombox Delivery Network |
| Schedule | Available on appointment day/time |
| Conflicts | No overlapping tasks (1-hour buffer) |

**Sorting:** By rating (highest first), then by completed tasks count

---

### Step 2.2: Driver Offer Sent

**Service:** `notifyDriverAboutJob()` in `driverAssignmentUtils.ts`

**Sends to:** ONE driver at a time (first available from sorted list)

#### SMS Template: `driverJobOfferSms`

**Content includes:**
- Appointment type: "Initial Pickup"
- Date and time
- Short address (city, state)
- Estimated payment
- Accept/View URL with JWT token

#### Database Updates:

| Table | Field | Value |
|-------|-------|-------|
| **OnfleetTask** | `lastNotifiedDriverId` | Driver's ID |
| **OnfleetTask** | `driverNotificationStatus` | `"pending"` |
| **OnfleetTask** | `driverNotificationSentAt` | Current timestamp |
| **OnfleetTask** | `driverOfferToken` | JWT token for accept/decline |

---

### Step 2.3: Driver Response Window

**Duration:** 2 hours (`DRIVER_ACCEPTANCE_WINDOW`)

| Driver Action | API/Trigger | Result |
|---------------|-------------|--------|
| **Accept** | `POST /api/onfleet/driver-assign` (action: "accept") | Tasks assigned to driver in Onfleet |
| **Decline** | `POST /api/onfleet/driver-assign` (action: "decline") | Find and notify next driver |
| **No Response** | Cron job | Mark expired, notify next driver |

---

### Step 2.4: Driver Accepts Job

**API:** `POST /api/onfleet/driver-assign`

**Request:** `{ appointmentId, driverId, onfleetTaskId, action: "accept" }`

#### Actions Performed:

1. **Assign tasks in Onfleet** - All 3 tasks for unit 1 assigned to driver
2. **Update database:**

| Table | Field | Value |
|-------|-------|-------|
| **OnfleetTask** (all 3) | `driverId` | Driver's ID |
| **OnfleetTask** (all 3) | `driverNotificationStatus` | `"accepted"` |
| **OnfleetTask** (all 3) | `driverOfferAcceptedAt` | Current timestamp |

3. **Send confirmation SMS:** `driverJobAcceptedSms` to driver
4. **Create in-app notification** for driver

---

### Step 2.5: Driver Declines Job

**API:** `POST /api/onfleet/driver-assign`

**Request:** `{ appointmentId, driverId, onfleetTaskId, action: "decline" }`

#### Actions Performed:

1. **Update database:**

| Table | Field | Value |
|-------|-------|-------|
| **OnfleetTask** | `driverNotificationStatus` | `"declined"` |
| **Driver** | Increment `declinedTasksCount` | +1 |

2. **Send confirmation SMS:** `driverJobDeclinedSms` to driver
3. **Find next available driver** and repeat Step 2.2

#### If No Drivers Available:

- Send email to admin with appointment details
- Manual assignment required

---

## Phase 3: Appointment Execution

### Step 3.1: Driver Starts Step 1 Task (Warehouse Pickup)

**Webhook:** `POST /api/onfleet/webhook` (`triggerName: "taskStarted"`, `step: "1"`)

**Handler:** `StepOneHandler.handleTaskStarted()`

#### Actions:

| Action | Details |
|--------|---------|
| Update Appointment Status | `"Scheduled"` → `"In Transit"` |
| Generate Tracking Token | JWT with appointmentId, taskId, time, ETA |
| Store Tracking URL | `https://app.boomboxstorage.com/tracking/{token}` |
| Send Customer SMS | `storagePickupStartedTemplate` with crew name and tracking URL |

#### Database Updates:

| Table | Field | Value |
|-------|-------|-------|
| **Appointment** | `status` | `"In Transit"` |
| **Appointment** | `trackingToken` | Generated JWT |
| **Appointment** | `trackingUrl` | Tracking page URL |
| **OnfleetTask** | `webhookTime` | Timestamp from webhook |

---

### Step 3.2: Admin Completes "Assign Storage Unit" Task

**Admin Dashboard Task Type:** `assign-storage-unit`

**API:** `POST /api/admin/tasks/assign-storage-unit/[appointmentId]`

**When:** Driver arrives at warehouse, ready to load empty unit onto trailer

**Admin Actions:**
1. Select available storage unit (e.g., "Boombox 142")
2. Optionally upload trailer photos
3. Submit assignment

#### Database Records Created/Updated:

| Table | Action | Key Fields |
|-------|--------|------------|
| **StorageUnitUsage** | CREATE | `storageUnitId`, `userId`, `startAppointmentId`, `usageStartDate: now()`, `unitPickupPhotos[]` |
| **StorageUnit** | UPDATE | `status: "Available"` → `"Assigned"` |
| **OnfleetTask** | UPDATE | `storageUnitId` set on all 3 tasks |

---

### Step 3.3: Driver Completes Step 1 Task

**Webhook:** `POST /api/onfleet/webhook` (`triggerName: "taskCompleted"`, `step: "1"`)

#### Actions:
- Save completion photo to `OnfleetTask.completionPhotoUrl`
- Calculate actual task costs
- Log completion metrics

---

### Step 3.4: Driver Starts Step 2 Task (Customer Delivery)

**Webhook:** `POST /api/onfleet/webhook` (`triggerName: "taskStarted"`, `step: "2"`)

**Handler:** `StepTwoHandler.handleTaskStarted()`

#### Actions:

| Action | Details |
|--------|---------|
| Send Customer SMS | `storageDeliveryStartedTemplate` - "Your Boombox is on the way!" |

---

### Step 3.5: Driver Arrives at Customer Location

**Webhook:** `POST /api/onfleet/webhook` (`triggerName: "taskArrival"`, `step: "2"`)

**Handler:** `StepTwoHandler.handleTaskArrival()`

#### Actions:

| Action | Details |
|--------|---------|
| Start Service Timer | `Appointment.serviceStartTime` = webhook time (milliseconds) |
| Generate New Tracking Token | For arrival tracking |
| Send Customer SMS | `storageServiceArrivalTemplate` - "Your crew has arrived!" |

#### Database Updates:

| Table | Field | Value |
|-------|-------|-------|
| **Appointment** | `serviceStartTime` | Webhook timestamp (ms) |
| **Appointment** | `trackingToken` | New token for arrival |

---

### Step 3.6: Driver Completes Step 2 Task (Photo Required)

**Webhook:** `POST /api/onfleet/webhook` (`triggerName: "taskCompleted"`, `step: "2"`)

**Handler:** `StepTwoHandler.handleTaskCompleted()`

**Driver Action:** Takes photo of storage unit with door open showing packed contents

#### Actions Performed:

1. **Save completion photo:**

| Table | Field | Value |
|-------|-------|-------|
| **OnfleetTask** | `completionPhotoUrl` | Photo URL from Onfleet |
| **StorageUnitUsage** | `mainImage` | Same photo URL (this appears in customer account!) |

2. **Calculate service time:**
   ```
   serviceTimeMinutes = (completionTime - serviceStartTime) / 60000
   ```

3. **Process billing (via Stripe):**

**Service:** `AppointmentBillingService.processWebhookCompletion()`

| Charge Type | Calculation |
|-------------|-------------|
| Monthly Storage Rate | `$X × 1 unit` |
| Monthly Insurance | `$X × 1 unit` |
| Loading Help | `max(60, serviceTimeMinutes) × hourlyRate` (1 hour minimum) |

**Invoice created and charged immediately via Stripe**

4. **Create storage subscription:**

**Service:** `StripeSubscriptionService.createStorageSubscription()`

| Subscription | Billing |
|--------------|---------|
| Monthly Storage + Insurance | Recurring monthly |

5. **Update appointment status:**

| Table | Field | Value |
|-------|-------|-------|
| **Appointment** | `status` | `"Loading Complete"` |
| **Appointment** | `serviceEndTime` | Webhook timestamp |
| **Appointment** | `invoiceUrl` | Stripe invoice URL |
| **Appointment** | `invoiceTotal` | Total charged amount |

6. **Send customer SMS:** `storageLoadingCompletedTemplate` with feedback URL

---

### Step 3.7: Driver Starts Step 3 Task (Return to Warehouse)

**Webhook:** `POST /api/onfleet/webhook` (`triggerName: "taskStarted"`, `step: "3"`)

#### Actions:
- Log task start time
- No customer notification (return leg)

---

### Step 3.8: Driver Completes Step 3 Task (Arrives at Warehouse)

**Webhook:** `POST /api/onfleet/webhook` (`triggerName: "taskCompleted"`, `step: "3"`)

**Handler:** `StepThreeHandler.handleTaskCompleted()`

#### Actions:

| Action | Details |
|--------|---------|
| Update Appointment Status | `"Loading Complete"` → `"Awaiting Admin Check In"` |
| Process Driver Payout | *(If enabled)* |

#### Database Updates:

| Table | Field | Value |
|-------|-------|-------|
| **Appointment** | `status` | `"Awaiting Admin Check In"` |

---

## Phase 4: Admin Check-In

### Step 4.1: Admin Completes "Storage Unit Return" Task

**Admin Dashboard Task Type:** `storage-unit-return`

**API:** `PATCH /api/admin/tasks/storage-unit-return/[appointmentId]`

**When:** Storage unit has arrived back at warehouse

**Admin Actions:**
1. Inspect storage unit for damage
2. Record damage if any (photos, description)
3. Confirm unit is occupied (not empty)
4. Submit check-in

**Request Body:**
```json
{
  "hasDamage": false,
  "damageDescription": null,
  "frontPhotos": [],
  "backPhotos": [],
  "isStillStoringItems": true
}
```

#### Database Updates:

| Table | Field | Value |
|-------|-------|-------|
| **StorageUnit** | `status` | `"Assigned"` → `"Occupied"` |
| **StorageUnitUsage** | `warehouseLocation` | "Pending Update" |
| **StorageUnitUsage** | `warehouseName` | "South San Francisco" |
| **Appointment** | `status` | `"Awaiting Admin Check In"` → `"Complete"` |

#### If Damage Found:

| Table | Action |
|-------|--------|
| **StorageUnitDamageReport** | CREATE with damage details and photos |

---

### Step 4.2: Admin Completes "Update Location" Task

**Admin Dashboard Task Type:** `update-location`

**Component:** `src/components/features/admin/tasks/UpdateLocationPage.tsx`

**API:** `PATCH /api/admin/tasks/update-location/[usageId]`

**When:** After storage unit return check-in is complete, admin assigns specific warehouse location

**Admin Actions:**
1. View storage unit information
2. Enter specific warehouse location (e.g., "Row A, Slot 15")
3. Submit location update

**Request Body:**
```json
{
  "warehouseLocation": "Row A, Slot 15"
}
```

#### Database Updates:

| Table | Field | Value |
|-------|-------|-------|
| **StorageUnitUsage** | `warehouseLocation` | Specific location (replaces "Pending Update") |

---

### Step 4.3: Storage Unit Appears in Customer Account

**Component:** `src/components/features/customers/YourStorageUnits.tsx`

**API:** `GET /api/customers/storage-units-by-customer?userId={userId}`

**What Customer Sees:**

| Field | Value |
|-------|-------|
| Unit Title | "Boombox 142" |
| Main Image | Photo from Step 2 completion (`StorageUnitUsage.mainImage`) |
| Pick Up Date | `StorageUnitUsage.usageStartDate` |
| Location | Customer's address from appointment |
| Description | Editable by customer |
| "Access Storage" Button | Links to access storage flow |

---

## Complete Data Flow Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PHASE 1: QUOTE SUBMISSION                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ Customer → GetQuoteForm → Stripe Customer → Submit Quote API                │
│                                                                              │
│ Creates: User, Appointment (status: "Scheduled")                            │
│ Creates: 3 OnfleetTasks (step 1, 2, 3 for unit 1)                          │
│ Sends: Welcome SMS, Email, In-App Notification                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PHASE 2: DRIVER ASSIGNMENT                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ System finds available driver → Sends job offer SMS → Driver accepts/declines│
│                                                                              │
│ Updates: OnfleetTask.driverId, driverNotificationStatus                     │
│ Assigns: All 3 tasks to driver in Onfleet                                   │
│ Sends: Job offer SMS, acceptance confirmation SMS                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PHASE 3: APPOINTMENT EXECUTION                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ STEP 1 STARTED (Warehouse Pickup)                                           │
│   • Appointment.status → "In Transit"                                       │
│   • SMS: "Your Boombox is on the way!" + tracking link                     │
│                                                                              │
│ ADMIN: Assign Storage Unit                                                   │
│   • Creates StorageUnitUsage                                                │
│   • StorageUnit.status → "Assigned"                                         │
│                                                                              │
│ STEP 2 STARTED (Customer Delivery)                                          │
│   • SMS: "Your Boombox is on the way!"                                      │
│                                                                              │
│ STEP 2 ARRIVAL (At Customer Location)                                       │
│   • Appointment.serviceStartTime recorded                                   │
│   • SMS: "Your crew has arrived!"                                           │
│                                                                              │
│ STEP 2 COMPLETED (Customer finishes loading, driver takes photo)            │
│   • StorageUnitUsage.mainImage = completion photo                           │
│   • Billing processed (storage + insurance + loading help)                  │
│   • Stripe subscription created                                              │
│   • Appointment.status → "Loading Complete"                                 │
│   • SMS: "Your items are safely stored!" + feedback link                    │
│                                                                              │
│ STEP 3 COMPLETED (Return to Warehouse)                                      │
│   • Appointment.status → "Awaiting Admin Check In"                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PHASE 4: ADMIN CHECK-IN                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ Admin inspects unit → Records damage (if any) → Confirms check-in          │
│                                                                              │
│ Updates: StorageUnit.status → "Occupied"                                    │
│ Updates: Appointment.status → "Complete"                                    │
│ Updates: StorageUnitUsage.warehouseLocation → "Pending Update"              │
│                                                                              │
│ ADMIN: Update Location                                                       │
│   • Admin enters specific warehouse location (e.g., "Row A, Slot 15")       │
│   • StorageUnitUsage.warehouseLocation updated                              │
│                                                                              │
│ CUSTOMER ACCOUNT:                                                            │
│ Storage unit now visible with:                                               │
│   • Photo from driver (Step 2 completion)                                   │
│   • Unit number, pickup date, location                                      │
│   • "Access Storage" button for future access appointments                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Appointment Status Progression

```
Scheduled → In Transit → Loading Complete → Awaiting Admin Check In → Complete
    ↑           ↑              ↑                     ↑                    ↑
  Quote     Step 1         Step 2               Step 3              Admin
Submitted   Started       Completed            Completed           Check-In
```

---

## Storage Unit Status Progression

```
Available → Assigned → Occupied
    ↑          ↑          ↑
  Initial   Admin     Admin
   State   Assigns   Check-In
          to Appt   Completes
```

---

## All SMS Notifications (Twilio)

| When | Recipient | Template | Message Summary |
|------|-----------|----------|-----------------|
| Quote Submitted | Customer | `welcomeSmsNewCustomer` | Appointment confirmation |
| Driver Notified | Driver | `driverJobOfferSms` | Job offer with details |
| Driver Accepts | Driver | `driverJobAcceptedSms` | Acceptance confirmation |
| Driver Declines | Driver | `driverJobDeclinedSms` | Decline confirmation |
| Step 1 Started | Customer | `storagePickupStartedTemplate` | "On the way" + tracking |
| Step 2 Started | Customer | `storageDeliveryStartedTemplate` | "Delivering your Boombox" |
| Step 2 Arrival | Customer | `storageServiceArrivalTemplate` | "Crew has arrived" |
| Step 2 Completed | Customer | `storageLoadingCompletedTemplate` | "Safely stored" + feedback |

---

## All Admin Tasks

| Task Type | API Route | When Created | Admin Action |
|-----------|-----------|--------------|--------------|
| `assign-storage-unit` | `/api/admin/tasks/assign-storage-unit/[appointmentId]` | Driver starts Step 1 | Select unit, upload trailer photos |
| `storage-unit-return` | `/api/admin/tasks/storage-unit-return/[appointmentId]` | Step 3 completed | Inspect, record damage, confirm check-in |
| `update-location` | `/api/admin/tasks/update-location/[usageId]` | Storage unit return completed | Enter specific warehouse location |
| `unassigned-driver` | `/api/admin/tasks/unassigned-driver/[appointmentId]` | No drivers available | Manual driver assignment |

---

## Key API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/payments/create-customer` | POST | Create Stripe customer |
| `/api/orders/submit-quote` | POST | Create user and appointment |
| `/api/onfleet/create-task` | POST | Create Onfleet tasks |
| `/api/onfleet/driver-assign` | POST | Handle driver assignment actions |
| `/api/onfleet/webhook` | POST | Process Onfleet webhook events |
| `/api/admin/tasks` | GET | List all pending admin tasks |
| `/api/admin/tasks/assign-storage-unit/[appointmentId]` | POST | Assign storage unit |
| `/api/admin/tasks/storage-unit-return/[appointmentId]` | PATCH | Process storage return |
| `/api/admin/tasks/update-location/[usageId]` | PATCH | Update warehouse location |
| `/api/customers/storage-units-by-customer` | GET | Fetch customer's storage units |

---

## Failure Scenarios & Recovery

| Scenario | System Response |
|----------|-----------------|
| No drivers available | Admin notified via email; manual assignment required |
| All drivers decline | Admin notified; cron job retries assignment |
| Driver offer expires (2 hrs) | Cron job notifies next available driver |
| Stripe payment fails | Log error; invoice marked as failed; admin notified |
| Webhook delivery fails | Onfleet retries; idempotent handlers prevent duplicates |
| Onfleet API error | Error logged; partial success returned |

---

## API Simulation Guide

This section provides step-by-step instructions for running an end-to-end API simulation of the DIY 1-Unit Customer Journey. Use this to test the complete workflow without UI interaction.

### Prerequisites

1. **Dev server running** on `localhost:3000`
2. **Database connection** to dev environment
3. **Prisma client** regenerated (`npx prisma generate`)
4. **At least one driver** in the system with:
   - `isApproved: true`
   - `applicationComplete: true`
   - `status: "Active"`
   - Valid `onfleetWorkerId`

### Phase 1: Create Test Customer and Appointment

```bash
curl -s -X POST http://localhost:3000/api/orders/submit-quote \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "Customer",
    "email": "testcustomer_'$(date +%s)'@test.com",
    "phoneNumber": "+15551234567",
    "address": "123 Test Street, San Francisco, CA 94102",
    "zipCode": "94102",
    "appointmentDateTime": "'$(date -v+1d +%Y-%m-%dT10:00:00.000Z)'",
    "appointmentType": "Initial Pickup",
    "storageUnitCount": 1,
    "planType": "Do It Yourself Plan",
    "selectedPlanName": "Do It Yourself Plan",
    "selectedInsurance": {"label": "Standard Protection", "value": "standard"},
    "stripeCustomerId": "cus_test_'$(date +%s)'",
    "parsedLoadingHelpPrice": 0,
    "monthlyStorageRate": 179,
    "monthlyInsuranceRate": 29,
    "calculatedTotal": 208
  }' | jq .
```

**Expected Response:**
```json
{
  "message": "Appointment scheduled successfully",
  "userId": <USER_ID>,
  "appointment": {
    "id": <APPOINTMENT_ID>,
    "jobCode": "<JOB_CODE>",
    "status": "Scheduled"
  }
}
```

**Record these values for subsequent steps:**
- `APPOINTMENT_ID`
- `USER_ID`

### Phase 2: Verify Onfleet Tasks Created

Query the database for the created tasks:

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const tasks = await prisma.onfleetTask.findMany({ 
    where: { appointmentId: <APPOINTMENT_ID> },
    select: { id: true, taskId: true, shortId: true, stepNumber: true, unitNumber: true, driverId: true },
    orderBy: [{ unitNumber: 'asc' }, { stepNumber: 'asc' }]
  });
  console.log(JSON.stringify(tasks, null, 2));
}
main().finally(() => prisma.\$disconnect());
"
```

**Record these values:**
- `STEP1_TASK_ID` (taskId for stepNumber: 1)
- `STEP2_TASK_ID` (taskId for stepNumber: 2)
- `STEP3_TASK_ID` (taskId for stepNumber: 3)

### Phase 3: Simulate Driver Acceptance

Find an available driver ID, then accept the job:

```bash
# Get available driver
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const driver = await prisma.driver.findFirst({ 
    where: { isApproved: true, applicationComplete: true, status: 'Active', onfleetWorkerId: { not: null } },
    select: { id: true, firstName: true, lastName: true }
  });
  console.log(JSON.stringify(driver, null, 2));
}
main().finally(() => prisma.\$disconnect());
"
```

**Simulate driver acceptance:**

```bash
curl -s -X POST "http://localhost:3000/api/onfleet/driver-assign" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "accept",
    "appointmentId": <APPOINTMENT_ID>,
    "driverId": <DRIVER_ID>,
    "onfleetTaskId": "<STEP1_TASK_ID>"
  }' | jq .
```

**Expected Response:**
```json
{
  "message": "Driver successfully assigned to all tasks for this unit",
  "appointmentId": <APPOINTMENT_ID>,
  "unitNumber": 1,
  "tasksAssigned": [<TASK_IDS>],
  "driverId": <DRIVER_ID>
}
```

### Phase 4: Simulate Webhook Events

#### Step 1: Warehouse Pickup Started

```bash
curl -s -X POST "http://localhost:3000/api/onfleet/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "<STEP1_TASK_ID>",
    "time": '$(date +%s)',
    "triggerName": "taskStarted",
    "data": {
      "task": {
        "shortId": "<STEP1_SHORT_ID>",
        "metadata": [
          {"name": "step", "value": "1"},
          {"name": "appointmentId", "value": "<APPOINTMENT_ID>"},
          {"name": "unitNumber", "value": "1"}
        ]
      }
    }
  }' | jq .
```

#### Step 1: Warehouse Pickup Completed

```bash
curl -s -X POST "http://localhost:3000/api/onfleet/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "<STEP1_TASK_ID>",
    "time": '$(date +%s)',
    "triggerName": "taskCompleted",
    "data": {
      "task": {
        "shortId": "<STEP1_SHORT_ID>",
        "metadata": [
          {"name": "step", "value": "1"},
          {"name": "appointmentId", "value": "<APPOINTMENT_ID>"},
          {"name": "unitNumber", "value": "1"}
        ],
        "completionDetails": { "photoUploadId": null, "photoUploadIds": [] }
      }
    }
  }' | jq .
```

#### Step 2: Customer Delivery Started

```bash
curl -s -X POST "http://localhost:3000/api/onfleet/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "<STEP2_TASK_ID>",
    "time": '$(date +%s)',
    "triggerName": "taskStarted",
    "data": {
      "task": {
        "shortId": "<STEP2_SHORT_ID>",
        "metadata": [
          {"name": "step", "value": "2"},
          {"name": "appointmentId", "value": "<APPOINTMENT_ID>"},
          {"name": "unitNumber", "value": "1"}
        ]
      }
    }
  }' | jq .
```

#### Step 2: Driver Arrival (Service Timer Starts)

```bash
curl -s -X POST "http://localhost:3000/api/onfleet/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "<STEP2_TASK_ID>",
    "time": '$(date +%s)',
    "triggerName": "taskArrival",
    "data": {
      "task": {
        "shortId": "<STEP2_SHORT_ID>",
        "metadata": [
          {"name": "step", "value": "2"},
          {"name": "appointmentId", "value": "<APPOINTMENT_ID>"},
          {"name": "unitNumber", "value": "1"}
        ]
      }
    }
  }' | jq .
```

#### Step 2: Customer Delivery Completed (With Photo)

```bash
curl -s -X POST "http://localhost:3000/api/onfleet/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "<STEP2_TASK_ID>",
    "time": '$(date +%s)',
    "triggerName": "taskCompleted",
    "data": {
      "task": {
        "shortId": "<STEP2_SHORT_ID>",
        "metadata": [
          {"name": "step", "value": "2"},
          {"name": "appointmentId", "value": "<APPOINTMENT_ID>"},
          {"name": "unitNumber", "value": "1"}
        ],
        "completionDetails": {
          "photoUploadId": "test_photo_id_123",
          "photoUploadIds": ["test_photo_id_123"]
        }
      }
    }
  }' | jq .
```

> **Note:** This step will fail with "No such customer" if using a fake Stripe customer ID. This is expected behavior.

#### Step 3: Return to Warehouse Started

```bash
curl -s -X POST "http://localhost:3000/api/onfleet/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "<STEP3_TASK_ID>",
    "time": '$(date +%s)',
    "triggerName": "taskStarted",
    "data": {
      "task": {
        "shortId": "<STEP3_SHORT_ID>",
        "metadata": [
          {"name": "step", "value": "3"},
          {"name": "appointmentId", "value": "<APPOINTMENT_ID>"},
          {"name": "unitNumber", "value": "1"}
        ]
      }
    }
  }' | jq .
```

#### Step 3: Return to Warehouse Completed

```bash
curl -s -X POST "http://localhost:3000/api/onfleet/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "<STEP3_TASK_ID>",
    "time": '$(date +%s)',
    "triggerName": "taskCompleted",
    "data": {
      "task": {
        "shortId": "<STEP3_SHORT_ID>",
        "metadata": [
          {"name": "step", "value": "3"},
          {"name": "appointmentId", "value": "<APPOINTMENT_ID>"},
          {"name": "unitNumber", "value": "1"}
        ],
        "completionDetails": { "photoUploadId": null, "photoUploadIds": [] }
      }
    }
  }' | jq .
```

### Phase 5: Simulate Admin Tasks

Since admin endpoints require authentication, use direct database operations:

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const APPOINTMENT_ID = <APPOINTMENT_ID>;
  const USER_ID = <USER_ID>;
  const STORAGE_UNIT_ID = <AVAILABLE_STORAGE_UNIT_ID>;  // Find an 'Empty' unit first
  
  // 1. Create StorageUnitUsage (simulates Assign Storage Unit task)
  const usage = await prisma.storageUnitUsage.create({
    data: {
      storageUnitId: STORAGE_UNIT_ID,
      userId: USER_ID,
      startAppointmentId: APPOINTMENT_ID,
      usageStartDate: new Date(),
      mainImage: 'https://d15p8tr8p0vffz.cloudfront.net/test_photo_id_123/800x.png'
    }
  });
  console.log('Created StorageUnitUsage:', usage.id);
  
  // 2. Update storage unit status
  await prisma.storageUnit.update({
    where: { id: STORAGE_UNIT_ID },
    data: { status: 'Occupied' }
  });
  console.log('Updated StorageUnit to Occupied');
  
  // 3. Link OnfleetTasks to storage unit
  await prisma.onfleetTask.updateMany({
    where: { appointmentId: APPOINTMENT_ID, unitNumber: 1 },
    data: { storageUnitId: STORAGE_UNIT_ID }
  });
  console.log('Linked OnfleetTasks to StorageUnit');
  
  // 4. Complete admin check-in
  await prisma.appointment.update({
    where: { id: APPOINTMENT_ID },
    data: { status: 'Checked In' }
  });
  console.log('Appointment status updated to Checked In');
}
main().finally(() => prisma.\$disconnect());
"
```

### Phase 6: Verify Final State

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const APPOINTMENT_ID = <APPOINTMENT_ID>;
  
  const appointment = await prisma.appointment.findUnique({
    where: { id: APPOINTMENT_ID },
    include: { user: true, onfleetTasks: true }
  });
  
  const usage = await prisma.storageUnitUsage.findFirst({
    where: { startAppointmentId: APPOINTMENT_ID },
    include: { storageUnit: true }
  });
  
  console.log('=== FINAL STATE ===');
  console.log('Appointment Status:', appointment.status);
  console.log('Tasks Completed:', appointment.onfleetTasks.filter(t => t.completedAt).length);
  console.log('Storage Unit:', usage?.storageUnit?.storageUnitNumber);
  console.log('Main Image:', usage?.mainImage);
}
main().finally(() => prisma.\$disconnect());
"
```

### Phase 7: Cleanup Test Data

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const APPOINTMENT_ID = <APPOINTMENT_ID>;
  const USER_ID = <USER_ID>;
  const STORAGE_UNIT_ID = <STORAGE_UNIT_ID>;
  
  // Delete in order of dependencies
  await prisma.storageUnitUsage.deleteMany({ where: { startAppointmentId: APPOINTMENT_ID } });
  await prisma.onfleetTask.deleteMany({ where: { appointmentId: APPOINTMENT_ID } });
  await prisma.notification.deleteMany({ where: { recipientId: USER_ID } });
  await prisma.appointment.delete({ where: { id: APPOINTMENT_ID } });
  await prisma.user.delete({ where: { id: USER_ID } });
  await prisma.storageUnit.update({ where: { id: STORAGE_UNIT_ID }, data: { status: 'Empty' } });
  
  console.log('Cleanup complete');
}
main().finally(() => prisma.\$disconnect());
"
```

### Expected Results Summary

| Phase | Expected Outcome |
|-------|------------------|
| Phase 1 | User and Appointment created, 3 OnfleetTasks created |
| Phase 2 | OnfleetTasks exist with step 1, 2, 3 |
| Phase 3 | Driver assigned to all 3 tasks |
| Phase 4 | All webhooks return `{"success": true}`, appointment status progresses |
| Phase 5 | StorageUnitUsage created with mainImage, appointment status "Checked In" |
| Phase 6 | All data properly linked and visible |
| Phase 7 | All test data removed, storage unit restored to "Empty" |

### Known Limitations

1. **Stripe billing fails** with test customer IDs - expected behavior
2. **SMS notifications fail** with fake phone numbers - expected behavior  
3. **Driver availability** may not match - use direct assignment
4. **Admin endpoints require auth** - use direct database operations

### Troubleshooting

| Issue | Solution |
|-------|----------|
| "needsPhotoProcessing does not exist" | Run `npx prisma generate` and restart dev server |
| "Unauthorized" on admin endpoints | Use direct database operations instead |
| "No drivers found" | Manually assign driver via driver-assign API with action "accept" |
| Webhook returns error | Check dev server logs for detailed error message |

---

## Related Documentation

- [Get Quote Form Workflow](./Get_Quote_Form_Workflow.md) - Detailed quote submission flow
- API Route Migration Tracking - API route mappings between versions
- Component Migration Checklist - Frontend component migration status

