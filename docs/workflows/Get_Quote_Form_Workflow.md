# Get Quote Form Workflow

This document outlines the high-level steps a user takes to complete the Get Quote form, create an appointment, and become a Boombox customer.

---

## Overview

The Get Quote form is a multi-step flow that allows new customers to:
1. Build their storage quote (address, units, plan, insurance)
2. Schedule their appointment (date and time)
3. Select moving help (if applicable)
4. Provide contact and payment information
5. Verify their phone number

---

## Step Flow Summary

```
Step 1: QuoteBuilder → Step 2: Scheduler → Step 3: ChooseLabor (conditional) → Step 4: ConfirmAppointment → Step 5: VerifyPhoneNumber
```

> **Note:** Step 3 (ChooseLabor) is skipped for "Do It Yourself Plan" users.

---

## Step 1: Build Your Quote (QuoteBuilder)

### User Actions
- Enter delivery address using Google Places autocomplete
- Select number of Boomboxes (1-5 units)
- Choose loading help plan:
  - **Do It Yourself Plan** – Free 1st hour, user loads their own unit
  - **Full Service Plan** – $189/hr estimate, professional movers assist
- Select insurance coverage level

### Data Captured
| Field | Description |
|-------|-------------|
| `address` | Full delivery address |
| `zipCode` | Extracted from address |
| `cityName` | Extracted from address |
| `coordinates` | Lat/lng from Google Places |
| `storageUnitCount` | Number of Boomboxes (1-5) |
| `selectedPlan` | Plan identifier (option1 or option2) |
| `selectedPlanName` | "Do It Yourself Plan" or "Full Service Plan" |
| `planType` | Plan type string for backend |
| `selectedInsurance` | Insurance coverage option |

### Validation
- Address must be valid with zipCode, cityName, and coordinates
- Plan must be selected
- Insurance option must be selected

### URL Parameters (Optional)
The form can accept pre-populated values via URL:
- `?storageUnitCount=3` – Pre-select number of units
- `?zipCode=94102` – Pre-populate zip code

---

## Step 2: Schedule Appointment (Scheduler)

### User Actions
- Select an available date from the calendar
- Select an available time slot for that date

### Data Flow
1. Calendar loads available dates for current month via `/api/orders/availability`
2. User selects a date → time slots fetched for that date
3. User selects a time slot → date and time stored in state

### Data Captured
| Field | Description |
|-------|-------------|
| `scheduledDate` | Selected appointment date |
| `scheduledTimeSlot` | Selected time slot (e.g., "9am-10am") |

### Availability Logic
- DIY and Full Service plans may have different availability
- Time slots vary based on:
  - Plan type
  - Number of units
  - Existing appointments
  - Warehouse capacity

### Validation
- Both date and time slot must be selected

---

## Step 3: Select Moving Help (ChooseLabor)

> **Conditional Step:** Only shown for Full Service Plan users. DIY plan users skip to Step 4.

### User Actions
- Browse available moving partners
- Sort by price, rating, or featured status
- Select a moving partner OR switch to DIY/third-party option

### Scenarios

#### Scenario A: Boombox Moving Partners Available
- Display list of available partners with:
  - Name, hourly rate, rating, reviews
  - Profile image and GMB link
- User selects preferred partner

#### Scenario B: No Boombox Partners Available
- Show warning message about limited availability
- Display third-party options (Lugg, Dolly, etc.)
- User can:
  - Select third-party option (redirected to external booking)
  - Switch to Do It Yourself Plan

#### Scenario C: User Changes Mind
- User can switch to DIY plan from this step
- Plan type updates and user proceeds to Step 4

### Data Captured
| Field | Description |
|-------|-------------|
| `selectedLabor` | Labor selection with id, price, title, onfleetTeamId |
| `movingPartnerId` | Boombox partner ID (if selected) |
| `thirdPartyMovingPartnerId` | Third-party partner ID (if selected) |
| `loadingHelpPrice` | Formatted price string (e.g., "$189/hr") |
| `parsedLoadingHelpPrice` | Numeric price value |

### Validation
- Moving partner must be selected (Full Service Plan only)

---

## Step 4: Confirm Appointment (ConfirmAppointment)

### User Actions
- Enter first name and last name
- Enter email address
- Enter phone number
- Enter payment card details (via Stripe Elements)
- Review billing information modal (optional)

### Data Captured
| Field | Description |
|-------|-------------|
| `firstName` | Customer first name |
| `lastName` | Customer last name |
| `email` | Customer email address |
| `phoneNumber` | Customer phone number |
| Card details | Captured by Stripe (not stored in app) |

### Payment Flow
1. User enters card details in Stripe Elements
2. On submit, Stripe creates a payment method
3. App calls `/api/payments/create-customer` with:
   - Customer contact info
   - Payment method ID
4. Stripe customer is created with payment method attached
5. Customer ID returned for quote submission

### Key Information
- **No charge today** – Card is stored for future billing
- Pre-authorization check runs 7 days before appointment
- Cancellation policy displayed (48hr notice required)

### Validation
- All contact fields required
- Card must pass Stripe validation
- Email must be unique (not already registered)
- Phone number must be unique (not already registered)

---

## Step 5: Verify Phone Number (VerifyPhoneNumber)

### User Actions
- View success message confirming appointment request
- Receive SMS with 4-digit verification code
- Enter verification code
- (Optional) Edit phone number if needed

### Phone Verification Flow
1. SMS sent automatically on component load
2. User enters 4-digit code
3. Code verified via `/api/auth/verify-code`
4. User signed in via NextAuth credentials
5. Redirect to user account page

### Edit Phone Number Scenario
1. User clicks "Edit" on phone number
2. Enters new phone number
3. App updates phone via `/api/updatephonenumber`
4. New verification code sent
5. User verifies new number

### Post-Verification
- User is authenticated and signed in
- Redirected to `/user-page/[userId]`
- Can view and manage appointments

---

## Backend Processing (On Submit)

When the user completes Step 4 and clicks "Confirm Appointment":

### 1. Create Stripe Customer
**Endpoint:** `POST /api/payments/create-customer`

- Creates Stripe customer with contact info
- Attaches payment method
- Sets up for off-session payments
- Returns `stripeCustomerId`

### 2. Submit Quote
**Endpoint:** `POST /api/orders/submit-quote`

Creates in a single transaction:
- New User record
- New Appointment record
- Associates Stripe customer ID

### 3. Send Welcome Notifications
- **Email:** Welcome message with appointment details
- **SMS:** Confirmation with date/time/address
- **In-app:** Appointment confirmation notification

### 4. Onfleet Integration (Async)
- Creates Onfleet tasks for delivery
- Assigns drivers based on plan type and availability
- Does not block API response

---

## Onfleet Task Creation & Driver Assignment

This section details how Onfleet tasks are created and drivers are assigned after appointment submission.

### Overview

When a quote is submitted, the system creates Onfleet tasks asynchronously via `processOnfleetAndAssignDriver()`. This process:
1. Creates 3 linked tasks per storage unit (pickup → customer → return)
2. Assigns tasks to the appropriate team
3. Finds and notifies available drivers
4. Handles driver acceptance/decline workflow

### Task Structure (Per Unit)

Each storage unit generates 3 linked Onfleet tasks:

| Step | Task Name | Location | Description |
|------|-----------|----------|-------------|
| 1 | Warehouse Pickup | Boombox Warehouse | Driver retrieves storage unit from warehouse |
| 2 | Customer Delivery | Customer Address | Driver delivers unit, customer loads/movers assist |
| 3 | Return to Warehouse | Boombox Warehouse | Driver returns loaded unit to warehouse |

Tasks are **linked with dependencies**:
- Step 2 depends on Step 1 completion
- Step 3 depends on Step 2 completion

### Multi-Unit Appointments

For appointments with multiple units:
- Each unit gets its own set of 3 tasks
- Units are **staggered by 45 minutes** to allow sequential handling
- Unit 1 starts at appointment time, Unit 2 at +45min, Unit 3 at +90min, etc.

### Team Assignment Logic

Teams determine which pool of drivers can see and accept tasks:

| Scenario | Team Assignment |
|----------|-----------------|
| **DIY Plan (all units)** | Boombox Delivery Network |
| **Full Service Plan - Unit 1** | Moving Partner's Onfleet Team |
| **Full Service Plan - Units 2+** | Boombox Delivery Network |

> **Key Insight:** For Full Service, only the first unit goes to the moving partner's team. Additional units are handled by Boombox drivers.

### Driver Assignment Flow

```
Task Created in Onfleet
         ↓
Assign to Team (MP or Boombox)
         ↓
Find Available Drivers (see criteria below)
         ↓
    ┌────────────────────────────────────────┐
    │                                        │
    ▼                                        ▼
Full Service (Unit 1)                    DIY or Additional Units
    │                                        │
    ▼                                        ▼
Auto-assign to MP Driver           Notify First Available Driver
(if available)                            via SMS
    │                                        │
    ▼                                        ▼
Notify Moving Partner              Driver has 2 hours to accept
                                            │
                               ┌────────────┴────────────┐
                               ▼                         ▼
                           Accepted                  Declined/Expired
                               │                         │
                               ▼                         ▼
                       Assign in Onfleet         Find Next Driver
                       Send Confirmation              or
                           SMS                  Notify Admin if none
```

### Driver Availability Criteria

Drivers are considered available if:

1. **Account Status:**
   - `isApproved: true`
   - `applicationComplete: true`
   - `status: 'Active'`
   - Has valid `onfleetWorkerId`

2. **Team Membership:**
   - Belongs to required Onfleet team (Boombox Delivery Network or Moving Partner team)

3. **Schedule Availability:**
   - Has availability set for the appointment day of week
   - Appointment time falls within their available hours
   - Time slot is not blocked

4. **No Scheduling Conflicts:**
   - No overlapping tasks on the same day
   - 1-hour buffer before and after each unit's full cycle
   - Unit cycle includes: prep (15min) + drive (30min) + service (45min) + return (30min) + padding (15min) = ~2.25 hours

### Full Service Plan - Moving Partner Flow

For Full Service appointments with a Moving Partner selected:

1. **Unit 1 Assignment:**
   - Fetch moving partner's approved drivers
   - Filter by availability and conflicts
   - Auto-assign best available driver
   - Assign task to driver in Onfleet
   - Notify moving partner via SMS/email with assignment details

2. **Moving Partner Notification Contains:**
   - Customer name
   - Appointment type, date, time
   - Customer address
   - Assigned driver name (if auto-assigned)
   - Appointment ID for reference

3. **If No Moving Partner Drivers Available:**
   - Moving partner is notified to manually assign in Onfleet
   - Task remains in team queue

### DIY Plan - Driver Notification Flow

For DIY appointments (or additional units):

1. **Find Available Drivers:**
   - Query Boombox Delivery Network drivers
   - Sort by: rating (highest first), then completed tasks

2. **Send Job Offer SMS:**
   - Driver receives SMS with job details
   - Link to web view for accept/decline

3. **SMS Contains:**
   - Appointment type (e.g., "Initial Pickup")
   - Date and time
   - Short address
   - Estimated payment
   - Accept/View URL

4. **Driver Response Window:**
   - **2 hours** to accept or decline
   - If no response, notification expires

### Driver Actions

| Action | Trigger | Result |
|--------|---------|--------|
| **Accept** | Driver clicks accept link | Tasks assigned to driver in Onfleet, confirmation SMS sent |
| **Decline** | Driver clicks decline link | Find and notify next available driver |
| **Expire** | No response in 2 hours | Cron job triggers retry with next driver |
| **Cancel** | Driver cancels accepted job | Unassign in Onfleet, find next driver, record cancellation |

### Messages Sent During Assignment

| Recipient | Message Type | When Sent |
|-----------|--------------|-----------|
| **Driver** | Job Offer SMS | When notified about available job |
| **Driver** | Job Accepted SMS | When driver accepts the job |
| **Driver** | Job Declined SMS | Confirmation when driver declines |
| **Driver** | In-App Notification | Job offer and assignment |
| **Moving Partner** | SMS/Email | When Full Service job is assigned to their team |
| **Admin** | Email | When no drivers available for a unit |

### Failure Scenarios

| Scenario | System Response |
|----------|-----------------|
| No drivers available | Admin notified via email with appointment details |
| Driver has no phone number | Skip to next driver |
| Notification send fails | Log error, try next driver |
| All drivers decline | Admin notified, manual assignment required |
| Onfleet API error | Log error, return partial success |

### Task Metadata Stored

Each Onfleet task includes metadata for tracking:

- `appointmentId` - Links to Boombox appointment
- `userId` - Links to customer
- `step` - Task step number (1, 2, or 3)
- `unitNumber` - Which unit this task is for
- `appointmentType` - Initial Pickup, Access, etc.
- `planType` - DIY or Full Service
- `stripeCustomerId` - For payment processing
- `insuranceCoverage` - Customer's insurance level
- `parsedLoadingHelpPrice` - Hourly rate for movers

### Database Records Created

| Table | Records Created |
|-------|-----------------|
| `OnfleetTask` | 3 records per unit (taskId, shortId, stepNumber, unitNumber) |
| `TimeSlotBooking` | 1 record if moving partner selected (blocks availability) |

### Timing Calculations

```
Unit 1: appointmentTime
Unit 2: appointmentTime + 45 min
Unit 3: appointmentTime + 90 min
...

Each unit's full cycle:
├── Prep at warehouse: 15 min before start
├── Drive to customer: ~30 min
├── Service time: 45 min (at customer)
├── Drive back: ~30 min
└── Safety padding: 15 min
Total: ~2.25 hours per unit
```

---

## Data Flow Diagram

```
User Input → GetQuoteProvider (State) → MyQuote (Display) → Submit
                    ↓
           Form Components
        (QuoteBuilder, Scheduler,
         ChooseLabor, ConfirmAppointment)
                    ↓
           useQuoteSubmission Hook
                    ↓
           Stripe Customer Creation
                    ↓
           Submit Quote API
                    ↓
        Database (User + Appointment)
                    ↓
        Notifications (Email + SMS)
                    ↓
        Onfleet Task (Async)
```

---

## Key Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| `GetQuoteForm` | Main orchestrator, step navigation, submit handler |
| `GetQuoteProvider` | Centralized state management via React Context |
| `QuoteBuilder` | Address, units, plan, insurance selection |
| `Scheduler` | Calendar and time slot selection |
| `ChooseLabor` | Moving partner selection (Full Service only) |
| `ConfirmAppointment` | Contact info and payment collection |
| `VerifyPhoneNumber` | Phone verification and sign-in |
| `MyQuote` | Quote summary sidebar with pricing display |
| `useQuoteSubmission` | Stripe integration and API submission |

---

## Error Scenarios

### Validation Errors (Step 1-4)
- Fields highlighted with error styling
- Error messages displayed inline
- User cannot proceed until resolved

### Duplicate Email/Phone
- Error returned from `/api/orders/submit-quote`
- Message displayed: "This email/phone is already in use"
- User must enter different contact info

### Stripe Payment Errors
- Card validation errors shown inline
- Payment method creation failures displayed
- User can retry with different card

### Network/API Errors
- Generic error message displayed
- User can retry submission

### Unavailable Moving Partner
- Warning shown if previously selected partner unavailable
- User prompted to select alternative

---

## MyQuote Sidebar

The MyQuote sidebar displays on desktop (sticky) and mobile (expandable bottom sheet):

### Information Displayed
- Map with delivery location
- Address
- Date and time (when selected)
- Price breakdown:
  - Boombox units (with promotional pricing)
  - Loading help plan
  - Insurance coverage
- Due today: $0
- Total amount (due on appointment day)

### Dynamic Button Text
| Step | Button Text |
|------|-------------|
| 1 | "Schedule Appointment" |
| 2 | "Reserve Appointment" |
| 3 | "Select Movers" |
| 4 | "Confirm Appointment" |

---

## State Management

### GetQuoteProvider State

The provider manages all form state including:

- **Location:** address, zipCode, cityName, coordinates
- **Storage:** storageUnitCount, storageUnitText
- **Plan:** selectedPlan, selectedPlanName, planType
- **Insurance:** selectedInsurance
- **Schedule:** scheduledDate, scheduledTimeSlot
- **Labor:** selectedLabor, movingPartnerId, thirdPartyMovingPartnerId
- **Contact:** firstName, lastName, email, phoneNumber
- **Payment:** stripeCustomerId
- **Pricing:** calculatedTotal, monthlyStorageRate, monthlyInsuranceRate
- **UI:** currentStep, isSubmitting, errors

### Step Navigation Logic
- DIY plan: Steps 1 → 2 → 4 → 5 (skip Step 3)
- Full Service: Steps 1 → 2 → 3 → 4 → 5

---

## API Routes Referenced

### Quote Form Flow

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/orders/availability` | GET | Fetch available dates/time slots |
| `/api/moving-partners/search` | GET | Search available moving partners |
| `/api/payments/create-customer` | POST | Create Stripe customer |
| `/api/orders/submit-quote` | POST | Submit quote, create user/appointment |
| `/api/auth/send-code` | POST | Send SMS verification code |
| `/api/auth/verify-code` | POST | Verify SMS code |
| `/api/updatephonenumber` | PATCH | Update phone number |

### Onfleet Integration

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/onfleet/create-task` | POST | Create linked Onfleet tasks for appointment |
| `/api/onfleet/driver-assign` | POST | Handle driver assignment actions (assign, accept, decline, retry, cancel) |
| `/api/onfleet/update-task` | PUT | Update existing Onfleet task details |

---

## Success Outcome

Upon successful completion:
1. ✅ User account created in database
2. ✅ Appointment scheduled with selected date/time
3. ✅ Stripe customer created with payment method
4. ✅ Welcome email and SMS sent to customer
5. ✅ In-app notification created for customer
6. ✅ Onfleet tasks created (3 per unit, async)
7. ✅ Driver notified via SMS (DIY) or auto-assigned (Full Service)
8. ✅ Moving partner notified (Full Service only)
9. ✅ User authenticated and redirected to account page

### Post-Submission Timeline

| Timeframe | Event |
|-----------|-------|
| Immediate | Customer receives welcome SMS and email |
| Immediate | Onfleet tasks created asynchronously |
| Immediate | Driver(s) notified or auto-assigned |
| Within 2 hours | Driver accepts or system retries with next driver |
| 7 days before appointment | Pre-authorization check on payment method |
| Appointment day | Customer charged for storage + services |

---

## Notes

- No payment is processed during the quote flow – card is stored for later billing
- Users cannot have duplicate email or phone numbers
- Moving partner availability is checked against the selected date/time
- Third-party moving partners require external booking (not integrated)
- Phone verification is required to access the user account
- Onfleet task creation is asynchronous and does not block the API response
- Driver acceptance window is 2 hours before system retries with next driver
- Full Service Unit 1 is auto-assigned to moving partner drivers; additional units go to Boombox drivers
- Admin users are notified via email when no drivers are available for assignment
- Tasks are staggered by 45 minutes per unit to allow proper sequencing
