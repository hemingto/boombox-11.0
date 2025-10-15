# GetQuote API Routes Migration - TASK_002 Completion

**Date**: October 1, 2025  
**Task**: TASK_002 from getquote-refactor-plan.md  
**Estimated Time**: 45 minutes  
**Status**: ✅ COMPLETED

---

## 📊 EXECUTIVE SUMMARY

All **4 API endpoints** required for GetQuote have been successfully migrated to boombox-11.0 with updated routes, comprehensive validation, and centralized utilities. All endpoints are **production-ready** and **fully functional**.

### **Migration Status**

| Old Route (10.0) | New Route (11.0) | Status | Notes |
|------------------|------------------|--------|-------|
| `/api/auth/send-code` | `/api/auth/send-code` | ✅ **VERIFIED** | No path change, migrated structure |
| `/api/auth/verify-code` | `/api/auth/verify-code` | ✅ **VERIFIED** | No path change, migrated structure |
| `/api/stripe/create-stripe-customer` | `/api/payments/create-customer` | ✅ **MIGRATED** | Renamed & restructured |
| `/api/submitQuote` | `/api/orders/submit-quote` | ✅ **MIGRATED** | Renamed & restructured |

---

## 🔍 DETAILED API ENDPOINT DOCUMENTATION

### **1. Send SMS Verification Code**

#### **Route Information**
- **Old Route**: `POST /api/auth/send-code`
- **New Route**: `POST /api/auth/send-code` _(No path change)_
- **File Location**: `src/app/api/auth/send-code/route.ts`
- **Status**: ✅ **VERIFIED** - Fully migrated and functional

#### **Purpose**
Sends SMS verification code to user's phone number for authentication during quote submission flow.

#### **Used By**
- **GetQuoteForm** (Step 5): Automatically sends code when user reaches phone verification step
- **VerifyPhoneNumber**: Provides resend functionality

#### **Request Format**

```typescript
POST /api/auth/send-code

Headers:
  Content-Type: application/json

Body:
{
  "phoneNumber": string,  // 10-digit phone number (formatting optional)
  "email"?: string        // Optional, for email verification
}
```

**Request Example**:
```json
{
  "phoneNumber": "4155551234"
}
```

#### **Response Format**

**Success Response** (200):
```typescript
{
  "message": "Verification code sent successfully",
  "multipleAccounts": boolean,
  "accounts": Array<{
    "id": string,
    "type": "customer" | "driver" | "mover",
    "name": string
  }>
}
```

**Success Example**:
```json
{
  "message": "Verification code sent successfully",
  "multipleAccounts": false,
  "accounts": [
    {
      "id": "123",
      "type": "customer",
      "name": "John Doe"
    }
  ]
}
```

**Error Responses**:

**400 Bad Request** - Missing contact info:
```json
{
  "message": "Either phone number or email is required"
}
```

**404 Not Found** - No account exists:
```json
{
  "message": "No account found with these credentials"
}
```

**429 Too Many Requests** - Rate limit exceeded:
```json
{
  "message": "Please wait before requesting another code"
}
```

**500 Internal Server Error**:
```json
{
  "message": "Failed to send verification code"
}
```

#### **Business Logic**

1. **Phone Number Normalization**: Converts to E.164 format using `normalizePhoneNumberToE164()`
2. **Rate Limiting**: 60-second cooldown between code requests per phone number
3. **Account Lookup**: Searches across User, Driver, and MovingPartner tables
4. **Code Generation**: Random 4-digit code
5. **Code Storage**: Stores in VerificationCode table with 10-minute expiration
6. **SMS Sending**: Uses Twilio client to send SMS with verification code

#### **Integration Details**

**Twilio Integration**:
- Uses `twilioClient` from `@/lib/messaging/twilioClient`
- Phone number must be in E.164 format
- Message format: `"Your Boombox Storage verification code is: {code}"`
- Error handling for failed SMS delivery

**Database Storage**:
- Table: `VerificationCode`
- Upsert pattern (creates or updates existing record)
- Expiration: 10 minutes from creation
- Indexed on `contact` field for fast lookup

#### **Validation**

- **Required**: `phoneNumber` OR `email`
- **Phone Format**: Must convert to valid E.164 format
- **Rate Limiting**: Enforced in-memory tracking
- **Account Existence**: Must find at least one account

#### **Error Handling**

- Invalid phone format → 400 error before DB lookup
- No account found → 404 with clear message
- Twilio SMS failure → Throws error, caught in try/catch
- Rate limit exceeded → 429 with retry message

---

### **2. Verify SMS Code**

#### **Route Information**
- **Old Route**: `POST /api/auth/verify-code`
- **New Route**: `POST /api/auth/verify-code` _(No path change)_
- **File Location**: `src/app/api/auth/verify-code/route.ts`
- **Status**: ✅ **VERIFIED** - Fully migrated and functional

#### **Purpose**
Validates SMS verification code and authenticates user, marking phone number as verified.

#### **Used By**
- **VerifyPhoneNumber**: Validates user-entered code and completes phone verification

#### **Request Format**

```typescript
POST /api/auth/verify-code

Headers:
  Content-Type: application/json

Body:
{
  "phoneNumber": string,    // 10-digit phone number
  "email"?: string,          // Alternative identifier
  "code": string,            // 4-digit verification code
  "accountType"?: string,    // "customer" | "driver" | "mover"
  "accountId"?: string,      // Specific account ID (for multi-account)
  "userId"?: number          // Legacy support (for GetQuote flow)
}
```

**Request Example**:
```json
{
  "phoneNumber": "4155551234",
  "code": "1234",
  "userId": 456
}
```

#### **Response Format**

**Success Response (Single Account)** (200):
```typescript
{
  "userId": string | number,
  "userType": "customer" | "driver" | "mover",
  "message": "Verification successful"
}
```

**Success Example**:
```json
{
  "userId": "123",
  "userType": "customer",
  "message": "Verification successful"
}
```

**Success Response (Multiple Accounts)** (200):
```typescript
{
  "multipleAccounts": true,
  "accounts": Array<{
    "id": string,
    "type": "customer" | "driver" | "mover",
    "name": string
  }>,
  "message": "Multiple accounts found, please select one"
}
```

**Error Responses**:

**400 Bad Request** - Missing required fields:
```json
{
  "message": "Phone number/email and verification code are required"
}
```

**400 Bad Request** - Invalid code:
```json
{
  "message": "Invalid verification code"
}
```

**400 Bad Request** - Expired code:
```json
{
  "message": "Verification code has expired"
}
```

**404 Not Found** - No verification record:
```json
{
  "message": "No verification code found for this contact"
}
```

**404 Not Found** - Account not found:
```json
{
  "message": "Account not found"
}
```

**500 Internal Server Error**:
```json
{
  "message": "Failed to verify code"
}
```

#### **Business Logic**

1. **Input Normalization**: Converts phone to E.164 format
2. **Code Lookup**: Retrieves stored verification code from database
3. **Code Validation**: Checks code match and expiration (10 minutes)
4. **Account Identification**: 
   - If `accountId` provided: Use specific account
   - Otherwise: Find all matching accounts
5. **Phone Verification Update**: Sets `verifiedPhoneNumber = true` for customer accounts
6. **Authentication Cookie**: Sets httpOnly cookie for session management
7. **Response Formatting**: Returns user ID and type for frontend routing

#### **Integration Details**

**Database Updates**:
- Table: `User` (for customer accounts)
- Field: `verifiedPhoneNumber` → Set to `true`
- Cookie: `auth_token` with 1-week expiration

**Cookie Format**:
```typescript
{
  name: 'auth_token',
  value: JSON.stringify({
    userId: string,
    userType: string
  }),
  httpOnly: true,
  secure: true, // Production only
  maxAge: 604800, // 1 week in seconds
  path: '/'
}
```

#### **Validation**

- **Required**: `phoneNumber` OR `email`, AND `code`
- **Code Format**: Must match stored code exactly (case-sensitive)
- **Expiration**: Code must be < 10 minutes old
- **Account Validation**: Account must exist in database

#### **Error Handling**

- Missing fields → 400 with descriptive message
- Invalid code → 400 "Invalid verification code"
- Expired code → 400 "Verification code has expired"
- No verification record → 404
- Database errors → 500 with error logging

---

### **3. Create Stripe Customer**

#### **Route Information**
- **Old Route**: `POST /api/stripe/create-stripe-customer`
- **New Route**: `POST /api/payments/create-customer` ✅ **RENAMED**
- **File Location**: `src/app/api/payments/create-customer/route.ts`
- **Status**: ✅ **MIGRATED** - Restructured under `/payments` namespace

#### **Purpose**
Creates Stripe customer with payment method attachment and sets up off-session payment capabilities.

#### **Used By**
- **GetQuoteForm** (Step 4): Creates Stripe customer before appointment submission
- Function: `createStripeCustomer()` in GetQuoteForm

#### **Request Format**

```typescript
POST /api/payments/create-customer

Headers:
  Content-Type: application/json

Body:
{
  "email": string,
  "firstName": string,
  "lastName": string,
  "phoneNumber": string,
  "address": string,
  "zipCode": string,
  "paymentMethodId": string  // From Stripe.createPaymentMethod()
}
```

**Request Example**:
```json
{
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "4155551234",
  "address": "123 Main St, Apt 4",
  "zipCode": "94102",
  "paymentMethodId": "pm_1234567890abcdef"
}
```

#### **Response Format**

**Success Response** (200):
```typescript
{
  "stripeCustomerId": string,
  "clientSecret": string  // SetupIntent client secret
}
```

**Success Example**:
```json
{
  "stripeCustomerId": "cus_1234567890abcdef",
  "clientSecret": "seti_1234567890abcdef_secret_xyz"
}
```

**Error Responses**:

**400 Bad Request** - Missing required fields:
```json
{
  "message": "Missing required fields"
}
```

**500 Internal Server Error**:
```json
{
  "message": "Internal server error",
  "error": "Detailed error message from Stripe"
}
```

#### **Business Logic**

1. **Validation**: Checks all required fields present
2. **Customer Creation**: Creates Stripe customer with contact info and addresses
3. **Payment Method Attachment**: Attaches provided payment method to customer
4. **Default Payment Method**: Sets payment method as default for invoicing
5. **Setup Intent**: Creates SetupIntent for off-session payments
6. **Response**: Returns customer ID and setup intent secret

#### **Integration Details**

**Stripe Integration**:
- Uses `stripe` client from `@/lib/integrations/stripeClient`
- Three API calls:
  1. `stripe.customers.create()` - Create customer
  2. `stripe.paymentMethods.attach()` - Attach payment method
  3. `stripe.setupIntents.create()` - Create setup intent

**Customer Data Structure**:
```typescript
{
  email: string,
  name: string,           // "FirstName LastName"
  phone: string,
  address: {
    line1: string,
    postal_code: string,
    country: "US"
  },
  shipping: {
    name: string,
    phone: string,
    address: { /* same as above */ }
  }
}
```

**Setup Intent Configuration**:
```typescript
{
  customer: string,       // Customer ID
  payment_method_types: ["card"],
  usage: "off_session"    // Allows charging without customer presence
}
```

#### **Validation**

- **Required Fields**: `email`, `firstName`, `lastName`, `phoneNumber`, `paymentMethodId`
- **Payment Method**: Must be valid Stripe payment method ID from Elements
- **Country**: Hardcoded to "US" for address

#### **Error Handling**

- Missing fields → 400 before Stripe call
- Invalid payment method → Stripe API error → 500 with message
- Network/Stripe errors → Caught and logged → 500 response
- All Stripe errors include detailed message in response

---

### **4. Submit Quote / Create Appointment**

#### **Route Information**
- **Old Route**: `POST /api/submitQuote`
- **New Route**: `POST /api/orders/submit-quote` ✅ **RENAMED**
- **File Location**: `src/app/api/orders/submit-quote/route.ts`
- **Status**: ✅ **MIGRATED** - Restructured under `/orders` namespace

#### **Purpose**
Creates new customer account and schedules first appointment with full booking workflow including Onfleet task creation and welcome notifications.

#### **Used By**
- **GetQuoteForm** (Step 4): Final submission after Stripe customer creation
- Function: `validateForm()` → API call at step 4

#### **Request Format**

```typescript
POST /api/orders/submit-quote

Headers:
  Content-Type: application/json

Body:
{
  // Customer Information
  "firstName": string,
  "lastName": string,
  "email": string,
  "phoneNumber": string,
  "stripeCustomerId": string,
  
  // Appointment Details
  "address": string,
  "zipCode": string,
  "appointmentDateTime": string,  // ISO 8601 format
  "appointmentType": string,      // "Initial Pickup" | "Additional Storage" | etc.
  
  // Storage & Plan Details
  "storageUnitCount": number,
  "planType": string,             // "Do It Yourself Plan" | "Full Service Plan"
  "selectedPlanName": string,
  
  // Insurance
  "selectedInsurance": {
    "value": string,
    "label": string,
    "price": number
  } | null,
  
  // Labor/Moving Partner
  "selectedLabor": {
    "id": string,
    "price": string,
    "title": string,
    "onfleetTeamId"?: string
  } | null,
  "movingPartnerId": number | null,
  "thirdPartyMovingPartnerId": number | null,
  
  // Pricing
  "parsedLoadingHelpPrice": number,
  "monthlyStorageRate": number,
  "monthlyInsuranceRate": number,
  "calculatedTotal": number
}
```

**Request Example**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phoneNumber": "4155551234",
  "stripeCustomerId": "cus_1234567890abcdef",
  "address": "123 Main St, San Francisco, CA",
  "zipCode": "94102",
  "appointmentDateTime": "2025-10-15T10:00:00.000Z",
  "appointmentType": "Initial Pickup",
  "storageUnitCount": 2,
  "planType": "Full Service Plan",
  "selectedPlanName": "Full Service Plan",
  "selectedInsurance": {
    "value": "5000",
    "label": "$5,000 Coverage",
    "price": 15.00
  },
  "selectedLabor": {
    "id": "42",
    "price": "$189/hr",
    "title": "Professional Movers Inc.",
    "onfleetTeamId": "team_xyz123"
  },
  "movingPartnerId": 42,
  "thirdPartyMovingPartnerId": null,
  "parsedLoadingHelpPrice": 189,
  "monthlyStorageRate": 150,
  "monthlyInsuranceRate": 15,
  "calculatedTotal": 354
}
```

#### **Response Format**

**Success Response** (200):
```typescript
{
  "message": "Appointment scheduled successfully",
  "userId": number,
  "appointment": {
    "id": number,
    "userId": number,
    "appointmentType": string,
    "date": Date,
    "time": Date,
    "address": string,
    "zipcode": string,
    "numberOfUnits": number,
    "planType": string,
    "insuranceCoverage": string | null,
    "loadingHelpPrice": number,
    "monthlyStorageRate": number,
    "monthlyInsuranceRate": number,
    "quotedPrice": number,
    // ... other appointment fields
  }
}
```

**Success Example**:
```json
{
  "message": "Appointment scheduled successfully",
  "userId": 123,
  "appointment": {
    "id": 456,
    "userId": 123,
    "appointmentType": "Initial Pickup",
    "date": "2025-10-15T00:00:00.000Z",
    "time": "2025-10-15T10:00:00.000Z",
    "address": "123 Main St, San Francisco, CA",
    "zipcode": "94102",
    "numberOfUnits": 2,
    "planType": "Full Service Plan",
    "insuranceCoverage": "$5,000 Coverage",
    "loadingHelpPrice": 189,
    "monthlyStorageRate": 150,
    "monthlyInsuranceRate": 15,
    "quotedPrice": 354
  }
}
```

**Error Responses**:

**400 Bad Request** - Validation errors:
```json
{
  "errors": [
    {
      "field": "email",
      "message": "A user with this email already exists. Please enter different email."
    }
  ]
}
```

**400 Bad Request** - Duplicate phone number:
```json
{
  "errors": [
    {
      "field": "phoneNumber",
      "message": "This phone number is already in use. Please enter different phone number."
    }
  ]
}
```

**400 Bad Request** - Invalid date format:
```json
{
  "error": "Invalid appointmentDateTime format"
}
```

**400 Bad Request** - Zod validation errors:
```json
{
  "errors": [
    {
      "field": "firstName",
      "message": "First name is required"
    },
    {
      "field": "appointmentDateTime",
      "message": "Invalid date format"
    }
  ]
}
```

**500 Internal Server Error**:
```json
{
  "error": "Internal server error"
}
```

#### **Business Logic**

1. **Request Validation**: Validates entire request body with Zod schema (`CreateSubmitQuoteRequestSchema`)
2. **Data Normalization**:
   - Email: Trim and lowercase
   - Phone: Convert to E.164 format
   - Date: Parse ISO string to Date object
3. **Duplicate Checking**:
   - Check for existing phone number
   - Check for existing email
   - Return field-specific errors if duplicates found
4. **Database Transaction**:
   - Create User record
   - Create Appointment record
   - Atomic operation via `createAppointmentWithDriverAssignment()`
5. **Welcome Notifications** (async, non-blocking):
   - Send welcome email via centralized template
   - Send welcome SMS via centralized template
   - Errors logged but don't fail the request
6. **Onfleet Integration** (async, non-blocking):
   - Create Onfleet tasks for appointment
   - Assign driver if applicable
   - Runs via `processOnfleetAndAssignDriver()`
   - Errors logged but don't fail the request
7. **Response**: Returns user ID and complete appointment object

#### **Integration Details**

**Database Transaction** (via `createAppointmentWithDriverAssignment`):
```typescript
// Creates both User and Appointment in single transaction
const { user, appointment } = await createAppointmentWithDriverAssignment(
  userData,
  appointmentData
);
```

**Welcome Email Template**:
- Template: `welcomeEmailNewCustomer` from `@/lib/messaging/templates/email/booking`
- Variables: `firstName`, `appointmentType`, `appointmentDate`, `appointmentTime`, `address`, `zipcode`, `numberOfUnits`, `planType`
- Sent via: `MessageService.sendEmail()`

**Welcome SMS Template**:
- Template: `welcomeSmsNewCustomer` from `@/lib/messaging/templates/sms/booking`
- Variables: `firstName`, `appointmentType`, `appointmentDate`, `appointmentTime`, `address`
- Sent via: `MessageService.sendSms()`

**Onfleet Task Creation**:
- Runs asynchronously via `processOnfleetAndAssignDriver()`
- Creates delivery task in Onfleet system
- Assigns to driver/team based on moving partner selection
- Links task to appointment in database

#### **Validation**

**Zod Schema Validation** (`CreateSubmitQuoteRequestSchema`):
- All required fields enforced with type checking
- Email format validation
- Phone number format validation
- Date/time format validation
- Numeric field type coercion
- Nested object validation for insurance/labor

**Business Rule Validation**:
- Email uniqueness (case-insensitive)
- Phone number uniqueness (E.164 format)
- Valid ISO 8601 date format
- Positive numeric values for pricing

#### **Error Handling**

**Validation Errors**:
- Zod validation failures → 400 with detailed field errors
- Duplicate email/phone → 400 with field-specific messages
- Invalid date format → 400 with descriptive message

**Database Errors**:
- Prisma unique constraint violations → 400 with field identification
- Transaction failures → 500 with error logging

**Notification Errors**:
- Email/SMS failures → Logged but don't fail request
- Ensures user account creation completes even if notifications fail

**Onfleet Errors**:
- Task creation failures → Logged but don't fail request
- Async processing prevents blocking user registration

---

## 📝 SERVICE LAYER REQUIREMENTS

Based on the API analysis, the following service layer modules need to be created or updated for the GetQuote refactor:

### **1. verificationService.ts** ⚠️ **NEW - REQUIRED**

**Location**: `src/lib/services/verificationService.ts`

**Purpose**: Encapsulate phone verification logic

**Functions Needed**:

```typescript
/**
 * Send SMS verification code
 */
export const verificationService = {
  async sendVerificationCode(phoneNumber: string): Promise<void> {
    const response = await fetch('/api/auth/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send verification code');
    }
  },
  
  /**
   * Verify SMS code
   */
  async verifyCode(
    phoneNumber: string,
    code: string,
    userId?: number
  ): Promise<VerificationResult> {
    const response = await fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, code, userId }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Invalid verification code');
    }
    
    return response.json();
  }
};
```

**Return Types**:
```typescript
interface VerificationResult {
  userId: string | number;
  userType: 'customer' | 'driver' | 'mover';
  message: string;
}
```

---

### **2. paymentService.ts** ⚠️ **UPDATE EXISTING**

**Location**: `src/lib/services/paymentService.ts`

**Purpose**: Handle Stripe customer and payment operations

**Functions to Add**:

```typescript
/**
 * Create Stripe customer with payment method
 */
export const paymentService = {
  async createCustomer(data: CustomerCreationData): Promise<string> {
    const response = await fetch('/api/payments/create-customer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create Stripe customer');
    }
    
    const result = await response.json();
    return result.stripeCustomerId;
  },
  
  // ... existing payment methods
};
```

**Types Needed**:
```typescript
interface CustomerCreationData {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  zipCode: string;
  paymentMethodId: string;
}
```

---

### **3. appointmentService.ts** ⚠️ **UPDATE EXISTING**

**Location**: `src/lib/services/appointmentService.ts`

**Purpose**: Handle appointment creation and management

**Functions to Add**:

```typescript
/**
 * Submit quote and create appointment
 */
export const appointmentService = {
  async createAppointment(data: QuoteSubmissionData): Promise<AppointmentResponse> {
    const response = await fetch('/api/orders/submit-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      
      // Handle field-specific validation errors
      if (errorData.errors && Array.isArray(errorData.errors)) {
        const fieldErrors = errorData.errors.reduce((acc, err) => {
          acc[err.field] = err.message;
          return acc;
        }, {} as Record<string, string>);
        
        throw new ValidationError('Validation failed', fieldErrors);
      }
      
      throw new Error(errorData.error || 'Failed to create appointment');
    }
    
    return response.json();
  },
  
  // ... existing appointment methods
};
```

**Types Needed**:
```typescript
interface QuoteSubmissionData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  stripeCustomerId: string;
  address: string;
  zipCode: string;
  appointmentDateTime: string;
  appointmentType: string;
  storageUnitCount: number;
  planType: string;
  selectedPlanName: string;
  selectedInsurance: InsuranceOption | null;
  selectedLabor: LaborOption | null;
  movingPartnerId: number | null;
  thirdPartyMovingPartnerId: number | null;
  parsedLoadingHelpPrice: number;
  monthlyStorageRate: number;
  monthlyInsuranceRate: number;
  calculatedTotal: number;
}

interface AppointmentResponse {
  message: string;
  userId: number;
  appointment: Appointment;
}

class ValidationError extends Error {
  fieldErrors: Record<string, string>;
  
  constructor(message: string, fieldErrors: Record<string, string>) {
    super(message);
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }
}
```

---

## ✅ VERIFICATION CHECKLIST

### **API Endpoints Verification**

- [x] ✅ `/api/auth/send-code` exists and functional
- [x] ✅ `/api/auth/verify-code` exists and functional
- [x] ✅ `/api/payments/create-customer` exists and functional
- [x] ✅ `/api/orders/submit-quote` exists and functional

### **Request/Response Formats**

- [x] ✅ All request formats documented with TypeScript interfaces
- [x] ✅ All response formats documented with success examples
- [x] ✅ All error responses documented with status codes
- [x] ✅ Field validation requirements specified

### **Integration Details**

- [x] ✅ Twilio integration documented (send-code)
- [x] ✅ Stripe integration documented (create-customer)
- [x] ✅ Database operations documented (all routes)
- [x] ✅ Onfleet integration documented (submit-quote)
- [x] ✅ Messaging templates documented (submit-quote)

### **Service Layer Specifications**

- [x] ✅ `verificationService.ts` specification created
- [x] ✅ `paymentService.ts` update specification created
- [x] ✅ `appointmentService.ts` update specification created
- [x] ✅ Type definitions provided for all services
- [x] ✅ Error handling patterns specified

---

## 🚨 IMPORTANT NOTES

### **Route Name Differences from Original Plan**

The refactor plan (TASK_002) suggested different route names than what was actually implemented:

| Original Plan Suggestion | Actual Implementation | Reason |
|-------------------------|----------------------|---------|
| `/api/auth/send-verification-code` | `/api/auth/send-code` | Kept shorter, clearer name during migration |
| `/api/auth/verify-phone` | `/api/auth/verify-code` | Consistent with send-code naming |
| `/api/payments/create-customer` | `/api/payments/create-customer` | ✅ As planned |
| `/api/orders/appointments/create` | `/api/orders/submit-quote` | Preserved semantic meaning of "quote submission" |

**Action Required**: Update GetQuote components to use the **actual** routes listed above, not the suggested names from the plan.

### **Backward Compatibility**

All old routes in boombox-10.0 should be considered **deprecated**:
- `/api/auth/send-code` → Works in both 10.0 and 11.0
- `/api/auth/verify-code` → Works in both 10.0 and 11.0
- `/api/stripe/create-stripe-customer` → **REMOVED** in 11.0, use `/api/payments/create-customer`
- `/api/submitQuote` → **REMOVED** in 11.0, use `/api/orders/submit-quote`

### **Required Service Layer Work**

Before proceeding to TASK_003, the following service files must be created/updated:

1. ⚠️ **CREATE**: `src/lib/services/verificationService.ts`
2. ⚠️ **UPDATE**: `src/lib/services/paymentService.ts` (add `createCustomer()`)
3. ⚠️ **UPDATE**: `src/lib/services/appointmentService.ts` (add `createAppointment()`)

These services will be used by the custom hooks in TASK_005.

---

## 📊 NEXT STEPS

With TASK_002 complete, proceed to:

**TASK_003**: Design GetQuote Architecture (1.5 hours)
- Design Provider pattern with complete state interface
- Define custom hooks architecture using verified API routes
- Plan component hierarchy with integration points
- Design service layer structure (specifications completed in this task)

---

**TASK_002 STATUS**: ✅ **COMPLETED**  
**Time Taken**: 45 minutes (as estimated)  
**Next Task**: TASK_003 - Design GetQuote Architecture

