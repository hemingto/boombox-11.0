# GetQuote Flow Analysis - TASK_001 Completion

**Date**: October 1, 2025  
**Task**: TASK_001 from getquote-refactor-plan.md  
**Estimated Time**: 1.5 hours  
**Status**: ✅ COMPLETED

---

## 📊 EXECUTIVE SUMMARY

The GetQuote flow consists of **5 major components** totaling **1,493 lines of code** with **43+ useState hooks**. The system guides users through a 6-step booking process with conditional logic, real-time validation, and integration with Stripe, Twilio, and Google Places APIs.

### **Complexity Metrics**
| Component | LOC | useState | Complexity | API Calls |
|-----------|-----|----------|------------|-----------|
| GetQuoteForm | 768 | 25+ | Very High | 2 |
| VerifyPhoneNumber | 299 | 6+ | High | 2 |
| ConfirmAppointment | 254 | 1 | Medium | 0 (Stripe via parent) |
| QuoteBuilder | 172 | 0 | Low | 0 |
| **TOTAL** | **1,493** | **32+** | - | **4** |

---

## 🗺️ COMPLETE USER FLOW MAPPING

### **Step-by-Step Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│                     STEP 1: Build Quote                          │
│                  (QuoteBuilder Component)                         │
├─────────────────────────────────────────────────────────────────┤
│ User Actions:                                                    │
│ • Enter delivery address (Google Places autocomplete)            │
│ • Select number of storage units (1-5)                           │
│ • Choose loading help option:                                    │
│   - "Do It Yourself Plan" (Free 1st hour)                       │
│   - "Full Service Plan" ($189/hr estimate)                      │
│ • Select insurance coverage option                               │
│                                                                  │
│ Validation:                                                      │
│ • Address must be selected from dropdown (not typed)             │
│ • Loading help plan required                                     │
│ • Insurance option required                                      │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                    STEP 2: Schedule Appointment                  │
│                      (Scheduler Component)                       │
├─────────────────────────────────────────────────────────────────┤
│ User Actions:                                                    │
│ • Select appointment date from calendar                          │
│ • Choose time slot from available windows                        │
│                                                                  │
│ Conditional Logic:                                               │
│ • Availability depends on:                                       │
│   - Plan type (DIY vs Full Service)                             │
│   - Number of storage units                                      │
│   - Geographic location                                          │
│                                                                  │
│ Validation:                                                      │
│ • Both date and time slot required                               │
│ • Selected time must be available                                │
└─────────────────────────────────────────────────────────────────┘
                               ↓
                    ┌──────────────────┐
                    │  DECISION POINT  │
                    └──────────────────┘
                               ↓
              ┌────────────────┴────────────────┐
              ↓                                 ↓
   ┌──────────────────────┐          ┌──────────────────────┐
   │   DIY Plan Selected  │          │ Full Service Selected│
   │   SKIP to STEP 4     │          │   GO TO STEP 3       │
   └──────────────────────┘          └──────────────────────┘
                                                 ↓
              ┌─────────────────────────────────────────────────┐
              │            STEP 3: Choose Labor                 │
              │          (ChooseLabor Component)                │
              ├─────────────────────────────────────────────────┤
              │ User Actions:                                   │
              │ • Select moving partner from available options  │
              │ • View partner ratings and pricing              │
              │                                                 │
              │ API Integration:                                │
              │ • GET /api/moving-partners/search               │
              │   - Filters by city, date, availability         │
              │   - Returns partner details with Onfleet IDs    │
              │                                                 │
              │ Conditional Display:                            │
              │ • Only shows partners available at selected     │
              │   date/time                                     │
              │ • If no partners available, shows error message │
              │                                                 │
              │ Validation:                                     │
              │ • Moving partner selection required             │
              └─────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                 STEP 4: Confirm Appointment                      │
│              (ConfirmAppointment Component)                      │
├─────────────────────────────────────────────────────────────────┤
│ User Actions:                                                    │
│ • Enter first name                                               │
│ • Enter last name                                                │
│ • Enter email address                                            │
│ • Enter phone number                                             │
│ • Enter credit card details (Stripe Elements):                   │
│   - Card number                                                  │
│   - Expiration date                                              │
│   - CVC                                                          │
│                                                                  │
│ Backend Processing (on submit):                                  │
│ 1. Validate all contact information                              │
│ 2. Create Stripe PaymentMethod from card element                │
│ 3. API: POST /api/stripe/create-stripe-customer                 │
│    - Creates Stripe customer                                     │
│    - Attaches payment method                                     │
│ 4. API: POST /api/submitQuote                                    │
│    - Creates user account in database                            │
│    - Creates appointment record                                  │
│    - Links Stripe customer ID                                    │
│    - Returns userId for verification step                        │
│                                                                  │
│ Validation:                                                      │
│ • All fields required                                            │
│ • Email format validation                                        │
│ • Phone number format validation                                 │
│ • Stripe card validation (real-time)                             │
│                                                                  │
│ Error Handling:                                                  │
│ • Field-specific errors displayed inline                         │
│ • Stripe errors shown below card inputs                          │
│ • General submission errors at top                               │
│ • Loading overlay during submission                              │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                   STEP 5: Verify Phone Number                    │
│              (VerifyPhoneNumber Component)                       │
├─────────────────────────────────────────────────────────────────┤
│ Automatic Actions (on step load):                                │
│ • API: POST /api/auth/send-code                                  │
│   - Sends SMS verification code via Twilio                       │
│   - Uses phoneNumber from previous step                          │
│                                                                  │
│ User Actions:                                                    │
│ • Enter 6-digit verification code from SMS                       │
│ • Click "Verify" button                                          │
│ • OR click "Resend Code" if not received                         │
│                                                                  │
│ API Integration:                                                 │
│ • POST /api/auth/verify-code                                     │
│   - Validates verification code                                  │
│   - Marks phone number as verified                               │
│   - Updates user record                                          │
│                                                                  │
│ Rate Limiting:                                                   │
│ • Maximum 5 verification attempts                                │
│ • 60-second cooldown between resend requests                     │
│                                                                  │
│ Success Action:                                                  │
│ • Redirects to customer account page                             │
│ • URL: /customer-account-page/${userId}                          │
│                                                                  │
│ Validation:                                                      │
│ • Code must be exactly 6 digits                                  │
│ • Code must match SMS code sent                                  │
└─────────────────────────────────────────────────────────────────┘
```

### **Conditional Logic Points**

1. **Step 1 → Step 2**: Always proceeds
2. **Step 2 → Step 3/4**: 
   - If `selectedPlanName === 'Do It Yourself Plan'` → Skip to Step 4
   - If `selectedPlanName === 'Full Service Plan'` → Proceed to Step 3
3. **Step 3 → Step 4**: Always proceeds (only shown for Full Service)
4. **Step 4 → Step 5**: Only proceeds after successful API submission
5. **Step 5 → Success**: Redirects to customer dashboard after verification

### **State Dependencies Between Steps**

| State Variable | Set In Step | Used In Steps | Critical For |
|---------------|-------------|---------------|--------------|
| `address` | 1 | 1, 4, Sidebar | Stripe billing, API submission |
| `zipCode` | 1 | 1, 4, Sidebar | Pricing, Stripe billing |
| `coordinates` | 1 | 1, Sidebar | Google Maps integration |
| `cityName` | 1 | 3 | Moving partner filtering |
| `storageUnitCount` | 1 | 1, 2, Sidebar | Availability, Pricing |
| `selectedPlanName` | 1 | 1, 2, 3, 4, Sidebar | Navigation logic, pricing |
| `selectedInsurance` | 1 | 1, 4, Sidebar | Pricing, API submission |
| `scheduledDate` | 2 | 2, 3, Sidebar | Partner availability, API |
| `scheduledTimeSlot` | 2 | 2, 3, Sidebar | Partner availability, API |
| `selectedLabor` | 3 | 3, 4, Sidebar | Pricing, API submission |
| `movingPartnerId` | 3 | 4 | API submission (Onfleet) |
| `firstName` | 4 | 4 | Stripe customer, API |
| `lastName` | 4 | 4 | Stripe customer, API |
| `email` | 4 | 4 | User creation, Stripe |
| `phoneNumber` | 4 | 4, 5 | User creation, SMS verification |
| `stripeCustomerId` | 4 | 4 | Payment processing |
| `userId` | 4 | 5 | Phone verification |

---

## 📄 COMPONENT ANALYSIS

### **1. GetQuoteForm.tsx** (768 lines)

#### **State Management Inventory**

**Address & Location (5 states)**:
```typescript
const [address, setAddress] = useState<string>('');
const [cityName, setCityName] = useState<string>('');
const [zipCode, setZipCode] = useState<string>(initialZipCode);
const [coordinates, setCoordinates] = useState<google.maps.LatLngLiteral | null>(null);
const [addressError, setAddressError] = useState<string | null>(null);
```

**Storage & Plan Selection (8 states)**:
```typescript
const [storageUnitCount, setStorageUnitCount] = useState<number>(initialStorageUnitCount);
const [storageUnitText, setStorageUnitText] = useState<string>(getStorageUnitText(initialStorageUnitCount));
const [selectedPlan, setSelectedPlan] = useState<string>('');
const [selectedPlanName, setSelectedPlanName] = useState<string>('');
const [planType, setPlanType] = useState<string>('');
const [isPlanDetailsVisible, setIsPlanDetailsVisible] = useState(false);
const [planError, setPlanError] = useState<string | null>(null);
const [selectedInsurance, setSelectedInsurance] = useState<InsuranceOption | null>(null);
```

**Labor & Moving Partners (7 states)**:
```typescript
const [loadingHelpPrice, setLoadingHelpPrice] = useState<string>('---');
const [loadingHelpDescription, setLoadingHelpDescription] = useState<string>('');
const [selectedLabor, setSelectedLabor] = useState<{id: string, price: string, title: string, onfleetTeamId?: string} | null>(null);
const [parsedLoadingHelpPrice, setParsedLoadingHelpPrice] = useState<number>(0);
const [movingPartnerId, setMovingPartnerId] = useState<number | null>(null);
const [thirdPartyMovingPartnerId, setThirdPartyMovingPartnerId] = useState<number | null>(null);
const [laborError, setLaborError] = useState<string | null>(null);
```

**Scheduling (3 states)**:
```typescript
const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
const [scheduledTimeSlot, setScheduledTimeSlot] = useState<string | null>(null);
const [scheduleError, setScheduleError] = useState<string | null>(null);
```

**Contact Information (8 states)**:
```typescript
const [email, setEmail] = useState<string>('');
const [emailError, setEmailError] = useState<string | null>(null);
const [phoneNumber, setPhoneNumber] = useState<string>('');
const [phoneError, setPhoneError] = useState<string | null>(null);
const [firstName, setFirstName] = useState<string>('');
const [firstNameError, setFirstNameError] = useState<string | null>(null);
const [lastName, setLastName] = useState<string>('');
const [lastNameError, setLastNameError] = useState<string | null>(null);
```

**Pricing & Calculations (4 states)**:
```typescript
const [calculatedTotal, setCalculatedTotal] = useState<number>(0);
const [monthlyStorageRate, setMonthlyStorageRate] = useState<number>(0);
const [monthlyInsuranceRate, setMonthlyInsuranceRate] = useState<number>(0);
const [insuranceError, setInsuranceError] = useState<string | null>(null);
```

**Stripe Payment (2 states)**:
```typescript
const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
const [stripeErrors, setStripeErrors] = useState<TempStripeErrors>({});
```

**UI & Flow Control (8 states)**:
```typescript
const [currentStep, setCurrentStep] = useState<number>(1);
const [contentHeight, setContentHeight] = useState<number | null>(null);
const [error, setError] = useState<string | null>(null);
const [submitError, setSubmitError] = useState<string | null>(null);
const [isSubmitting, setIsSubmitting] = useState(false);
const [unavailableLaborError, setUnavailableLaborError] = useState<string | null>(null);
const [verificationCodeSent, setVerificationCodeSent] = useState(false);
const contentRef = useRef<HTMLDivElement>(null);
```

**Session Management (3 states)**:
```typescript
const [showSessionWarning, setShowSessionWarning] = useState(false);
const [isProcessingLogout, setIsProcessingLogout] = useState(false);
const [pendingSubmitData, setPendingSubmitData] = useState<any>(null);
```

**Additional State (2)**:
```typescript
const [appointmentType, setappointmentType] = useState<string>('Initial Pickup');
const [userId, setUserId] = useState<number | null>(null);
```

**TOTAL: 50+ useState hooks**

#### **Inline Functions to Extract**

**Utility Functions** (Move to `@/lib/utils/`):
```typescript
// Lines 754-768: getStorageUnitText()
// → Extract to: src/lib/utils/storageUtils.ts
function getStorageUnitText(count: number): string

// Lines 122-130: parseLoadingHelpPrice()
// → Extract to: src/lib/utils/priceUtils.ts or formatUtils.ts
const parseLoadingHelpPrice = useCallback((price: string): number => { ... })

// Lines 524-527: validateEmail()
// → Extract to: src/lib/utils/validationUtils.ts
const validateEmail = (email: string): boolean
```

**Custom Hooks** (Move to `@/hooks/`):
```typescript
// Lines 270-287: getAppointmentDateTime()
// → Extract to: src/hooks/useAppointmentDateTime.ts
const getAppointmentDateTime = useCallback((): Date | null => { ... })

// Lines 132-169: handleLaborChange()
// → Extract to: src/hooks/useGetQuoteForm.ts
const handleLaborChange = useCallback((id, price, title, onfleetTeamId) => { ... })

// Lines 585-604: handleDateTimeSelected()
// → Extract to: src/hooks/useScheduling.ts
const handleDateTimeSelected = useCallback((date, timeSlot) => { ... })

// Lines 607-614: handleUnavailableLabor()
// → Extract to: src/hooks/useLabor.ts
const handleUnavailableLabor = useCallback((hasError, message) => { ... })
```

**Service Layer** (Move to `@/lib/services/`):
```typescript
// Lines 294-367: createStripeCustomer()
// → Extract to: src/lib/services/paymentService.ts
const createStripeCustomer = async () => { ... }

// Lines 480-519: Submission API call in validateForm()
// → Extract to: src/lib/services/appointmentService.ts
const submitQuote = async (submissionData) => { ... }

// Lines 95-114: Send verification code (in useEffect)
// → Extract to: src/lib/services/verificationService.ts
const sendInitialVerificationCode = async () => { ... }
```

#### **API Calls**

1. **POST `/api/auth/send-code`** (Line 100)
   - Purpose: Send SMS verification code
   - Triggered: Automatically when reaching step 5
   - Payload: `{ phoneNumber: string }`
   - Response: Success/error status

2. **POST `/api/stripe/create-stripe-customer`** (Line 346)
   - Purpose: Create Stripe customer with payment method
   - Triggered: During step 4 validation before submission
   - Payload: 
     ```typescript
     {
       email, firstName, lastName, phoneNumber,
       address, zipCode, paymentMethodId
     }
     ```
   - Response: `{ stripeCustomerId: string }`

3. **POST `/api/submitQuote`** (Line 481)
   - Purpose: Create user account and appointment
   - Triggered: After successful Stripe customer creation
   - Payload: 
     ```typescript
     {
       firstName, lastName, email, phoneNumber,
       stripeCustomerId, address, zipCode,
       storageUnitCount, selectedPlanName,
       selectedInsurance, selectedLabor,
       parsedLoadingHelpPrice, monthlyStorageRate,
       monthlyInsuranceRate, calculatedTotal,
       planType, appointmentType,
       appointmentDateTime, movingPartnerId,
       thirdPartyMovingPartnerId
     }
     ```
   - Response: `{ userId: number, ... }`

#### **Validation Logic**

**Step 1 Validation** (Lines 386-394):
```typescript
if (!address) { setAddressError("..."); isValid = false; }
if (!selectedPlanName) { setPlanError("..."); isValid = false; }
if (!selectedInsurance) { setInsuranceError("..."); isValid = false; }
```

**Step 2 Validation** (Lines 396-403):
```typescript
if (!scheduledDate || !scheduledTimeSlot) {
  setScheduleError("...");
  isValid = false;
}
```

**Step 3 Validation** (Lines 404-412):
```typescript
if (selectedPlanName === "Full Service Plan") {
  if (!selectedLabor) {
    setLaborError("...");
    isValid = false;
  }
}
```

**Step 4 Validation** (Lines 417-431):
```typescript
if (!firstName) { setFirstNameError("..."); isValid = false; }
if (!lastName) { setLastNameError("..."); isValid = false; }
if (!validateEmail(email)) { setEmailError("..."); isValid = false; }
if (!phoneNumber) { setPhoneError("..."); isValid = false; }

const appointmentDateTimeObj = getAppointmentDateTime();
if (!appointmentDateTimeObj) {
  setScheduleError("...");
  isValid = false;
}
```

#### **Error Handling**

**Field-Specific Errors**:
- Each form field has corresponding error state
- Errors cleared when user interacts with field
- Errors displayed inline below inputs

**API Error Handling** (Lines 492-507):
```typescript
if (!response.ok) {
  if (result.errors && Array.isArray(result.errors)) {
    // Field-specific errors from API
    result.errors.forEach((err) => {
      if (err.field === 'email') setEmailError(err.message);
      else if (err.field === 'phoneNumber') setPhoneError(err.message);
      else setSubmitError(err.message);
    });
  } else if (result.error) {
    setSubmitError(result.error);
  } else {
    setSubmitError('An unexpected API error occurred.');
  }
}
```

**Network Error Handling** (Lines 513-516):
```typescript
catch (e: any) {
  console.error('Submission fetch error:', e);
  setSubmitError(e.message || 'Failed to submit quote...');
}
```

#### **Component Dependencies**

**Imported Components**:
- `MyQuote` - Sidebar quote summary (desktop)
- `MobileMyQuote` - Mobile quote summary
- `QuoteBuilder` - Step 1 form
- `Scheduler` - Step 2 date/time picker
- `ChooseLabor` - Step 3 labor selection (✅ Already refactored)
- `ConfirmAppointment` - Step 4 contact/payment
- `VerifyPhoneNumber` - Step 5 SMS verification
- `HelpIcon` - Help icon component
- `SessionWarningModal` - Modal for session conflicts

**External Dependencies**:
- `@stripe/react-stripe-js` - Stripe integration
- `next-auth/react` - Session management
- `next/navigation` - Router/search params
- Google Maps API (via AddressInput)

---

### **2. ConfirmAppointment.tsx** (254 lines)

#### **State Management**

**Local State (1 state)**:
```typescript
const [localStripeErrors, setLocalStripeErrors] = useState<{
  cardNumber: string | null;
  cardExpiry: string | null;
  cardCvc: string | null;
}>({
  cardNumber: null,
  cardExpiry: null,
  cardCvc: null
});
```

**Passed State (13 props from parent)**:
- `email`, `setEmail`
- `emailError`, `setEmailError`
- `phoneNumber`, `setPhoneNumber`
- `phoneError`, `setPhoneError`
- `firstName`, `setFirstName`
- `firstNameError`, `setFirstNameError`
- `lastName`, `setLastName`
- `lastNameError`, `setLastNameError`
- `stripe`, `elements` (Stripe instances)
- `parentStripeErrors`
- `isLoading`
- `submitError`

#### **Stripe Integration Touchpoints**

**Card Element Change Handlers** (Lines 78-97):
```typescript
const handleCardNumberChange = (event: StripeElementChangeEvent) => {
  setLocalStripeErrors(prev => ({
    ...prev,
    cardNumber: event.error ? event.error.message : null
  }));
};

const handleCardExpiryChange = (event: StripeElementChangeEvent) => {
  setLocalStripeErrors(prev => ({
    ...prev,
    cardExpiry: event.error ? event.error.message : null
  }));
};

const handleCardCvcChange = (event: StripeElementChangeEvent) => {
  setLocalStripeErrors(prev => ({
    ...prev,
    cardCvc: event.error ? event.error.message : null
  }));
};
```

**Stripe Elements Used**:
- `CardNumberInput` - Card number field
- `CardExpirationDateInput` - Expiry date field
- `CardCvcInput` - CVC field

**Error Display** (Lines 99-116):
```typescript
const renderStripeErrors = () => {
  const activeErrors = Object.values(localStripeErrors).filter(error => error !== null);
  if (activeErrors.length === 0) return null;

  return (
    <div className="mt-2 space-y-1">
      {localStripeErrors.cardNumber && <p className="text-red-500 text-sm">{localStripeErrors.cardNumber}</p>}
      {localStripeErrors.cardExpiry && <p className="text-red-500 text-sm">{localStripeErrors.cardExpiry}</p>}
      {localStripeErrors.cardCvc && <p className="text-red-500 text-sm">{localStripeErrors.cardCvc}</p>}
    </div>
  );
};
```

**NOTE**: Actual Stripe customer creation and payment method attachment happens in **parent component** (`GetQuoteForm.createStripeCustomer()`), not in this component.

#### **Quote Summary Display**

This component does NOT display quote summary. The summary is shown in the **MyQuote sidebar** which is rendered separately in the parent component.

**ConfirmAppointment focuses on**:
1. Contact information collection
2. Payment method collection via Stripe
3. Informational messaging about charges

#### **Success/Error State Handling**

**Submit Error Display** (Lines 118-121):
```typescript
const renderSubmitError = () => {
  if (!submitError) return null;
  return <p className="text-red-500 text-sm mt-2">{submitError}</p>;
};
```

**Loading State**: 
- Passed via `isLoading` prop
- Used in parent to show loading overlay

**Navigation**:
- `goBackToStep1()` - Back to step 1
- `goBackToStep2()` - Back to step 2 or 3 (depending on plan type)

#### **Reusable Components Used**

- `EmailInput` - Email input with validation
- `PhoneNumberInput` - Phone input with formatting
- `FirstNameInput` - First name input
- `LastNameInput` - Last name input
- `CardNumberInput` - Stripe card number
- `CardExpirationDateInput` - Stripe expiry
- `CardCvcInput` - Stripe CVC
- `InformationalPopup` - "When will I be charged?" popup
- `StripeLogo` - Powered by Stripe badge

#### **User Messaging**

**Payment Information** (Lines 220-232):
```
"You won't be charged anything today. We need your payment info 
to hold your appointment time."

When will I be charged?
- Reserving is free!
- Charged for first month + pickup fee AFTER appointment
- Pre-authorization check 7 days before (or immediately if < 7 days)
- Hold released after check

What if I need to reschedule?
- 48 hours notice: Free
- Same day cancellation: $100 fee
- Day of appointment: $200 fee
```

---

### **3. QuoteBuilder.tsx** (172 lines)

#### **State Management**

**No Local State** - All state passed via props

**Props Inventory (17 props)**:
```typescript
interface QuoteBuilderProps {
  address: string;
  addressError: string | null;
  onAddressChange: (address, zipCode, coordinates, cityName) => void;
  clearAddressError: () => void;
  
  storageUnitCount: number;
  initialStorageUnitCount: number;
  onStorageUnitChange: (count: number, text: string) => void;
  
  selectedPlan: string;
  planError: string | null;
  onPlanChange: (id: string, plan: string, description: string) => void;
  clearPlanError: () => void;
  
  isPlanDetailsVisible: boolean;
  togglePlanDetails: () => void;
  contentHeight: number | null;
  contentRef: React.RefObject<HTMLDivElement>;
  
  selectedInsurance: InsuranceOption | null;
  insuranceError: string | null;
  onInsuranceChange: (option: InsuranceOption | null) => void;
  clearInsuranceError: () => void;
  
  onPlanTypeChange: (planType: string) => void;
}
```

#### **Storage Unit Selection Logic**

**Counter Component** (Line 81):
```typescript
<StorageUnitCounter 
  onCountChange={onStorageUnitChange} 
  initialCount={storageUnitCount} 
/>
```

**Callback** (in parent):
```typescript
const handleStorageUnitChange = (count: number, text: string) => {
  setStorageUnitCount(count); 
  setStorageUnitText(text);    
};
```

**Text Mapping** (in parent):
```typescript
function getStorageUnitText(count: number): string {
  switch (count) {
    case 1: return 'studio apartment';
    case 2: return '1 bedroom apt';
    case 3: return '2 bedroom apt';
    case 4:
    case 5: return 'full house';
    default: return 'studio apartment';
  }
}
```

#### **Pricing Calculation Patterns**

**NOTE**: Pricing calculations happen in the **MyQuote component**, not in QuoteBuilder.

QuoteBuilder only:
1. Collects plan selection
2. Passes selection to parent
3. Parent updates pricing state

**Plan Options**:
- **Option 1 (DIY)**: "Free! 1st hour" → `$0/hr`
- **Option 2 (Full Service)**: "$189/hr estimate" → `$189/hr`

#### **Interactive UI Components**

**Address Input** (Lines 75-80):
```typescript
<AddressInput 
  value={address}
  onAddressChange={onAddressChange}
  hasError={!!addressError}
  onClearError={clearAddressError}
/>
```

**Radio Cards for Plans** (Lines 98-128):
```typescript
<RadioCards
  id="option1"
  title="No, I'll load my storage unit myself"
  description="Free! 1st hour"
  plan="Do It Yourself Plan"
  icon={<FurnitureIcon />}
  checked={selectedPlan === 'option1'}
  onChange={onPlanChange}
  hasError={!!planError}
  onClearError={clearPlanError}
/>

<RadioCards
  id="option2"
  title="Yes, I would love some help loading"
  description="$189/hr estimate"
  plan="Full Service Plan"
  icon={<MovingHelpIcon />}
  checked={selectedPlan === 'option2'}
  onChange={onPlanChange}
  hasError={!!planError}
  onClearError={clearPlanError}
/>
```

**Expandable Plan Details** (Lines 144-156):
```typescript
<div
  ref={contentRef}
  style={{
    height: isPlanDetailsVisible ? `${contentHeight}px` : '0px',
    overflow: 'hidden',
    transition: 'height 0.5s ease',
  }}
  className={`transition-all ${
    isPlanDetailsVisible ? 'opacity-100' : 'opacity-0'
  }`}
>
  <LaborPlanDetailsDiv />
</div>
```

**Insurance Input** (Line 160):
```typescript
<InsuranceInput 
  value={selectedInsurance}
  onInsuranceChange={onInsuranceChange}
  hasError={!!insuranceError}
  onClearError={clearInsuranceError}
/>
```

#### **Links to External Resources**

**Storage Calculator** (Lines 85-92):
```typescript
<Link 
  href="/storage-calculator" 
  className="underline" 
  target="_blank" 
  rel="noopener noreferrer"
>
  here
</Link>
```

**Plan Details Trigger** (Lines 138-140):
```typescript
<span 
  className="underline cursor-pointer" 
  onClick={togglePlanDetails}
>
  here
</span>
```

---

### **4. VerifyPhoneNumber.tsx** (299 lines)

#### **State Management**

**Local State (10 states)**:
```typescript
const [phoneNumber, setPhoneNumber] = useState<string>(initialPhoneNumber || '');
const [displayPhoneNumber, setDisplayPhoneNumber] = useState<string>('');
const [code, setCode] = useState<string>('');
const [phoneError, setPhoneError] = useState<string | null>(null);
const [codeError, setCodeError] = useState<string | null>(null);
const [isLoading, setIsLoading] = useState<boolean>(false);
const [isCodeSent, setIsCodeSent] = useState<boolean>(false);
const [resendTimer, setResendTimer] = useState<number>(0);
const [canResend, setCanResend] = useState<boolean>(true);
const [isVerified, setIsVerified] = useState<boolean>(false);
```

**Props Received**:
```typescript
interface VerifyPhoneNumberProps {
  initialPhoneNumber?: string;
  userId: number | null;
}
```

#### **SMS Verification Flow**

**Step 1: Phone Number Entry** (if not pre-filled):
```typescript
// Lines 85-109: handleSendCode()
const handleSendCode = async () => {
  setPhoneError(null);
  setCodeError(null);
  
  // Validate phone number
  const cleaned = phoneNumber.replace(/\D/g, '');
  if (cleaned.length !== 10) {
    setPhoneError('Please enter a valid 10-digit phone number');
    return;
  }
  
  setIsLoading(true);
  
  try {
    const response = await fetch('/api/auth/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: cleaned }),
    });
    
    if (response.ok) {
      setIsCodeSent(true);
      startResendTimer();
    } else {
      const data = await response.json();
      setPhoneError(data.error || 'Failed to send verification code');
    }
  } catch (error) {
    setPhoneError('Network error. Please try again.');
  } finally {
    setIsLoading(false);
  }
};
```

**Step 2: Code Verification**:
```typescript
// Lines 153-185: handleVerifyCode()
const handleVerifyCode = async () => {
  setCodeError(null);
  
  // Validate code format
  if (code.length !== 6) {
    setCodeError('Please enter the 6-digit code');
    return;
  }
  
  setIsLoading(true);
  
  try {
    const response = await fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: phoneNumber.replace(/\D/g, ''),
        code,
        userId
      }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      setIsVerified(true);
      // Redirect to customer account
      router.push(`/customer-account-page/${userId}`);
    } else {
      setCodeError(data.error || 'Invalid verification code');
    }
  } catch (error) {
    setCodeError('Network error. Please try again.');
  } finally {
    setIsLoading(false);
  }
};
```

#### **Twilio Integration Points**

**API Endpoint 1: Send Code** (Line 99):
- **Route**: `POST /api/auth/send-code`
- **Payload**: `{ phoneNumber: string }` (10 digits, no formatting)
- **Purpose**: Sends SMS via Twilio
- **Response**: Success or error

**API Endpoint 2: Verify Code** (Line 169):
- **Route**: `POST /api/auth/verify-code`
- **Payload**: `{ phoneNumber: string, code: string, userId: number }`
- **Purpose**: Validates code against Twilio
- **Response**: Success or error
- **Success Action**: Redirects to `/customer-account-page/${userId}`

#### **Verification Code Validation Logic**

**Code Format Validation** (Lines 156-160):
```typescript
if (code.length !== 6) {
  setCodeError('Please enter the 6-digit code');
  return;
}
```

**Phone Number Validation** (Lines 88-92):
```typescript
const cleaned = phoneNumber.replace(/\D/g, '');
if (cleaned.length !== 10) {
  setPhoneError('Please enter a valid 10-digit phone number');
  return;
}
```

**Input Restrictions** (Line 250):
```typescript
<input
  type="text"
  pattern="[0-9]*"
  inputMode="numeric"
  maxLength={6}
  value={code}
  onChange={(e) => {
    const value = e.target.value.replace(/\D/g, '');
    setCode(value);
    setCodeError(null);
  }}
/>
```

#### **Rate Limiting & Resend Logic**

**Resend Timer** (Lines 111-122):
```typescript
const startResendTimer = () => {
  setCanResend(false);
  setResendTimer(60); // 60 seconds
  
  const interval = setInterval(() => {
    setResendTimer((prev) => {
      if (prev <= 1) {
        clearInterval(interval);
        setCanResend(true);
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
};
```

**Resend Functionality** (Lines 124-151):
```typescript
const handleResendCode = async () => {
  if (!canResend) return;
  
  setCodeError(null);
  setCode(''); // Clear previous code
  setIsLoading(true);
  
  try {
    const response = await fetch('/api/auth/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        phoneNumber: phoneNumber.replace(/\D/g, '') 
      }),
    });
    
    if (response.ok) {
      startResendTimer();
    } else {
      const data = await response.json();
      setCodeError(data.error || 'Failed to resend code');
    }
  } catch (error) {
    setCodeError('Network error. Please try again.');
  } finally {
    setIsLoading(false);
  }
};
```

**Timer Display** (Lines 266-270):
```typescript
{!canResend && resendTimer > 0 && (
  <p className="text-sm text-gray-600">
    Resend code in {resendTimer}s
  </p>
)}
```

#### **Phone Number Formatting**

**Display Formatting** (Lines 57-83):
```typescript
useEffect(() => {
  if (!phoneNumber) {
    setDisplayPhoneNumber('');
    return;
  }
  
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  let formatted = '';
  if (cleaned.length === 0) {
    formatted = '';
  } else if (cleaned.length <= 3) {
    formatted = `(${cleaned}`;
  } else if (cleaned.length <= 6) {
    formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  } else {
    formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  }
  
  setDisplayPhoneNumber(formatted);
}, [phoneNumber]);
```

**Format Pattern**: `(XXX) XXX-XXXX`

#### **UI States**

**State 1: Phone Number Entry** (if not pre-filled):
- Input field for phone number
- "Send Code" button
- Validation errors display

**State 2: Code Sent**:
- Shows formatted phone number
- Edit button to change number
- 6-digit code input
- "Verify" button
- "Resend Code" button (with timer)
- Validation errors display

**State 3: Loading**:
- Disabled inputs
- Loading text in button

**State 4: Verified**:
- Success message
- Automatic redirect

---

## 🗺️ API ROUTE MAPPING

### **Current API Routes (boombox-10.0)**

| Route | Method | Purpose | Used In Component |
|-------|--------|---------|-------------------|
| `/api/auth/send-code` | POST | Send SMS verification code | GetQuoteForm, VerifyPhoneNumber |
| `/api/auth/verify-code` | POST | Verify SMS code | VerifyPhoneNumber |
| `/api/stripe/create-stripe-customer` | POST | Create Stripe customer | GetQuoteForm |
| `/api/submitQuote` | POST | Create appointment | GetQuoteForm |

### **Migration to boombox-11.0**

According to `api-routes-migration-tracking.md`:

| Old Route | New Route | Status | Notes |
|-----------|-----------|--------|-------|
| `/api/auth/send-code` | `/api/auth/send-verification-code` | ⚠️ Update | Standardize naming |
| `/api/auth/verify-code` | `/api/auth/verify-phone` | ⚠️ Update | Standardize naming |
| `/api/stripe/create-stripe-customer` | `/api/payments/create-customer` | ⚠️ Update | New payments namespace |
| `/api/submitQuote` | `/api/orders/appointments/create` | ⚠️ Update | RESTful structure |

### **Request/Response Formats**

#### **1. Send Verification Code**

**OLD**: `POST /api/auth/send-code`  
**NEW**: `POST /api/auth/send-verification-code`

**Request**:
```typescript
{
  phoneNumber: string; // 10 digits, no formatting
}
```

**Response (Success)**:
```typescript
{
  success: true;
  message: "Verification code sent";
}
```

**Response (Error)**:
```typescript
{
  error: string;
}
```

#### **2. Verify Phone Code**

**OLD**: `POST /api/auth/verify-code`  
**NEW**: `POST /api/auth/verify-phone`

**Request**:
```typescript
{
  phoneNumber: string; // 10 digits
  code: string; // 6 digits
  userId: number;
}
```

**Response (Success)**:
```typescript
{
  success: true;
  message: "Phone verified";
}
```

**Response (Error)**:
```typescript
{
  error: string;
}
```

#### **3. Create Stripe Customer**

**OLD**: `POST /api/stripe/create-stripe-customer`  
**NEW**: `POST /api/payments/create-customer`

**Request**:
```typescript
{
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  zipCode: string;
  paymentMethodId: string; // From Stripe.createPaymentMethod()
}
```

**Response (Success)**:
```typescript
{
  stripeCustomerId: string;
}
```

**Response (Error)**:
```typescript
{
  error: string;
}
```

#### **4. Submit Quote / Create Appointment**

**OLD**: `POST /api/submitQuote`  
**NEW**: `POST /api/orders/appointments/create`

**Request**:
```typescript
{
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  stripeCustomerId: string;
  address: string;
  zipCode: string;
  storageUnitCount: number;
  selectedPlanName: string;
  selectedInsurance: InsuranceOption;
  selectedLabor: {
    id: string;
    price: string;
    title: string;
    onfleetTeamId?: string;
  } | null;
  parsedLoadingHelpPrice: number;
  monthlyStorageRate: number;
  monthlyInsuranceRate: number;
  calculatedTotal: number;
  planType: string;
  appointmentType: string;
  appointmentDateTime: string; // ISO format
  movingPartnerId: number | null;
  thirdPartyMovingPartnerId: number | null;
}
```

**Response (Success)**:
```typescript
{
  userId: number;
  // ... other appointment details
}
```

**Response (Error - Field Validation)**:
```typescript
{
  errors: Array<{
    field: string;
    message: string;
  }>;
}
```

**Response (Error - General)**:
```typescript
{
  error: string;
}
```

---

## 🔧 EXTRACTION OPPORTUNITIES

### **1. Custom Hooks to Create**

#### **A. `useGetQuoteForm.ts`** (PRIORITY: CRITICAL)
**Purpose**: Centralized state management for entire quote flow

**State to Consolidate**:
- All 50+ useState hooks from GetQuoteForm
- Step navigation logic
- Validation coordination

**Functions to Include**:
```typescript
export function useGetQuoteForm() {
  return {
    // State
    currentStep,
    formData: { address, zipCode, ... },
    errors: { addressError, planError, ... },
    
    // Actions
    setAddress,
    setStorageUnitCount,
    setSelectedPlan,
    setSchedule,
    setContactInfo,
    nextStep,
    prevStep,
    
    // Validation
    validateCurrentStep,
    
    // Utilities
    isStepValid,
    canProceed,
  };
}
```

#### **B. `useStorageUnitSelection.ts`**
**Purpose**: Storage unit counting and text generation

**Functions**:
```typescript
export function useStorageUnitSelection(initialCount: number = 1) {
  const [count, setCount] = useState(initialCount);
  const [text, setText] = useState(getStorageUnitText(initialCount));
  
  const increment = () => {
    if (count < 5) {
      const newCount = count + 1;
      setCount(newCount);
      setText(getStorageUnitText(newCount));
    }
  };
  
  const decrement = () => {
    if (count > 1) {
      const newCount = count - 1;
      setCount(newCount);
      setText(getStorageUnitText(newCount));
    }
  };
  
  return { count, text, increment, decrement, setCount };
}
```

#### **C. `useScheduling.ts`**
**Purpose**: Date/time slot selection logic

**Functions**:
```typescript
export function useScheduling() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleDateTimeSelected = (date: Date, timeSlot: string) => {
    setSelectedDate(date);
    setSelectedTimeSlot(timeSlot);
    setError(null);
  };
  
  const getAppointmentDateTime = (): Date | null => {
    if (!selectedDate || !selectedTimeSlot) return null;
    // ... parsing logic
  };
  
  return {
    selectedDate,
    selectedTimeSlot,
    error,
    handleDateTimeSelected,
    getAppointmentDateTime,
  };
}
```

#### **D. `usePhoneVerification.ts`**
**Purpose**: SMS verification flow management

**Functions**:
```typescript
export function usePhoneVerification(initialPhone?: string) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhone || '');
  const [code, setCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const [errors, setErrors] = useState({
    phoneError: null,
    codeError: null,
  });
  
  const sendCode = async () => {
    // ... API call to send code
  };
  
  const verifyCode = async () => {
    // ... API call to verify code
  };
  
  const resendCode = async () => {
    // ... resend logic with timer
  };
  
  return {
    phoneNumber,
    code,
    isCodeSent,
    canResend,
    resendTimer,
    errors,
    setPhoneNumber,
    setCode,
    sendCode,
    verifyCode,
    resendCode,
  };
}
```

#### **E. `useQuoteSubmission.ts`**
**Purpose**: Final submission and payment processing

**Functions**:
```typescript
export function useQuoteSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const createStripeCustomer = async (data: CustomerData) => {
    // ... Stripe customer creation
  };
  
  const submitQuote = async (data: QuoteSubmissionData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // 1. Create Stripe customer
      const customerId = await createStripeCustomer(...);
      
      // 2. Submit quote
      const response = await appointmentService.createAppointment({
        ...data,
        stripeCustomerId: customerId,
      });
      
      return response;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return { isSubmitting, error, submitQuote };
}
```

### **2. Service Layer Functions**

#### **A. `appointmentService.ts`**

**Location**: `src/lib/services/appointmentService.ts`

**Functions**:
```typescript
export const appointmentService = {
  /**
   * Create new appointment
   * @source boombox-10.0/src/app/components/getquote/getquoteform.tsx (validateForm)
   */
  async createAppointment(data: QuoteSubmissionData): Promise<AppointmentResponse> {
    const response = await fetch('/api/orders/appointments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create appointment');
    }
    
    return response.json();
  },
  
  /**
   * Check appointment availability
   */
  async checkAvailability(
    date: Date,
    timeSlot: string,
    planType: string,
    numberOfUnits: number
  ): Promise<boolean> {
    // ... availability check logic
  }
};
```

#### **B. `verificationService.ts`**

**Location**: `src/lib/services/verificationService.ts`

**Functions**:
```typescript
export const verificationService = {
  /**
   * Send SMS verification code
   * @source boombox-10.0/src/app/components/getquote/verifyphonenumber.tsx
   */
  async sendVerificationCode(phoneNumber: string): Promise<void> {
    const response = await fetch('/api/auth/send-verification-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send verification code');
    }
  },
  
  /**
   * Verify SMS code
   * @source boombox-10.0/src/app/components/getquote/verifyphonenumber.tsx
   */
  async verifyCode(
    phoneNumber: string,
    code: string,
    userId: number
  ): Promise<boolean> {
    const response = await fetch('/api/auth/verify-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, code, userId }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Invalid verification code');
    }
    
    return true;
  }
};
```

#### **C. `paymentService.ts`** (Update existing)

**Location**: `src/lib/services/paymentService.ts`

**Functions to Add**:
```typescript
export const paymentService = {
  /**
   * Create Stripe customer with payment method
   * @source boombox-10.0/src/app/components/getquote/getquoteform.tsx (createStripeCustomer)
   */
  async createCustomer(data: CustomerData): Promise<string> {
    const response = await fetch('/api/payments/create-customer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create Stripe customer');
    }
    
    const result = await response.json();
    return result.stripeCustomerId;
  },
  
  /**
   * Create payment intent for appointment
   */
  async createPaymentIntent(data: PaymentIntentData): Promise<string> {
    const response = await fetch('/api/payments/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create payment intent');
    }
    
    const result = await response.json();
    return result.clientSecret;
  }
};
```

### **3. Utility Functions**

#### **A. `storageUtils.ts`**

**Location**: `src/lib/utils/storageUtils.ts`

**Functions**:
```typescript
/**
 * Get storage unit text description
 * @source boombox-10.0/src/app/components/getquote/getquoteform.tsx (getStorageUnitText)
 */
export function getStorageUnitText(count: number): string {
  switch (count) {
    case 1: return 'studio apartment';
    case 2: return '1 bedroom apt';
    case 3: return '2 bedroom apt';
    case 4:
    case 5: return 'full house';
    default: return 'studio apartment';
  }
}

/**
 * Calculate storage unit price based on count, location, plan
 */
export function calculateStorageUnitPrice(
  unitCount: number,
  zipCode: string,
  planType: string
): number {
  // ... pricing calculation logic
}
```

#### **B. `priceUtils.ts` or `formatUtils.ts`**

**Location**: `src/lib/utils/priceUtils.ts`

**Functions**:
```typescript
/**
 * Parse loading help price from formatted string
 * @source boombox-10.0/src/app/components/getquote/getquoteform.tsx (parseLoadingHelpPrice)
 */
export function parseLoadingHelpPrice(price: string): number {
  if (price === '---') return 0;
  
  const priceMatch = price.match(/\$(\d+)/);
  if (priceMatch) {
    return parseInt(priceMatch[1], 10);
  }
  
  return 0;
}

/**
 * Format price as hourly rate
 */
export function formatHourlyRate(price: number): string {
  return `$${price}/hr`;
}
```

#### **C. `validationUtils.ts`** (Update existing)

**Location**: `src/lib/utils/validationUtils.ts`

**Functions to Add**:
```typescript
/**
 * Validate email format
 * @source boombox-10.0/src/app/components/getquote/getquoteform.tsx (validateEmail)
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (10 digits)
 */
export function validatePhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10;
}

/**
 * Validate verification code (6 digits)
 */
export function validateVerificationCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}
```

#### **D. `phoneUtils.ts`** (Update existing)

**Location**: `src/lib/utils/phoneUtils.ts`

**Functions to Add**:
```typescript
/**
 * Format phone number for display: (XXX) XXX-XXXX
 * @source boombox-10.0/src/app/components/getquote/verifyphonenumber.tsx
 */
export function formatPhoneNumberForDisplay(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 0) return '';
  if (cleaned.length <= 3) return `(${cleaned}`;
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
}

/**
 * Clean phone number to digits only
 */
export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}
```

#### **E. `dateUtils.ts`** (Update existing)

**Location**: `src/lib/utils/dateUtils.ts`

**Functions to Add**:
```typescript
/**
 * Parse appointment date/time from selected date and time slot
 * @source boombox-10.0/src/app/components/getquote/getquoteform.tsx (getAppointmentDateTime)
 */
export function parseAppointmentDateTime(
  date: Date,
  timeSlot: string
): Date | null {
  const appointmentDate = new Date(date);
  const [timeSlotStart] = timeSlot.split('-');
  
  const timeRegex = /(\d{1,2})(?:\:(\d{2}))?(am|pm)/i;
  const timeMatch = timeSlotStart.match(timeRegex);
  
  if (!timeMatch) return null;
  
  let hours = parseInt(timeMatch[1]);
  const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
  const period = timeMatch[3].toLowerCase();
  
  if (period === 'pm' && hours < 12) hours += 12;
  if (period === 'am' && hours === 12) hours = 0;
  
  appointmentDate.setHours(hours, minutes, 0, 0);
  return appointmentDate;
}
```

---

## 📊 DELIVERABLES SUMMARY

### ✅ **1. Component Dependency Map**

```
GetQuoteForm (Main Orchestrator)
├── QuoteBuilder (Step 1)
│   ├── AddressInput
│   ├── StorageUnitCounter
│   ├── RadioCards (x2)
│   ├── InsuranceInput
│   └── LaborPlanDetailsDiv
│
├── Scheduler (Step 2)
│   └── (External component - calendar/time selection)
│
├── ChooseLabor (Step 3) ✅ Already Refactored
│   └── (Integrates with moving partner API)
│
├── ConfirmAppointment (Step 4)
│   ├── EmailInput
│   ├── PhoneNumberInput
│   ├── FirstNameInput
│   ├── LastNameInput
│   ├── CardNumberInput (Stripe)
│   ├── CardExpirationDateInput (Stripe)
│   ├── CardCvcInput (Stripe)
│   ├── InformationalPopup
│   └── StripeLogo
│
├── VerifyPhoneNumber (Step 5)
│   └── (Standalone component with SMS integration)
│
└── Sidebar (Always visible except step 5)
    ├── MyQuote (Desktop)
    └── MobileMyQuote (Mobile)
```

### ✅ **2. State Management Inventory**

**Total useState Hooks**: 50+ (43 in GetQuoteForm + 10 in VerifyPhoneNumber + 1 in ConfirmAppointment)

**Categories**:
- Address & Location: 5 states
- Storage & Plan: 8 states
- Labor & Partners: 7 states
- Scheduling: 3 states
- Contact Info: 8 states
- Pricing: 4 states
- Stripe: 2 states
- UI Control: 8 states
- Session: 3 states
- Other: 2 states
- VerifyPhoneNumber: 10 states
- ConfirmAppointment: 1 state

### ✅ **3. API Route Mapping**

| Current Route | New Route | Component | Purpose |
|--------------|-----------|-----------|---------|
| `/api/auth/send-code` | `/api/auth/send-verification-code` | GetQuoteForm, VerifyPhoneNumber | Send SMS |
| `/api/auth/verify-code` | `/api/auth/verify-phone` | VerifyPhoneNumber | Verify SMS |
| `/api/stripe/create-stripe-customer` | `/api/payments/create-customer` | GetQuoteForm | Stripe setup |
| `/api/submitQuote` | `/api/orders/appointments/create` | GetQuoteForm | Create appointment |

### ✅ **4. Extraction Opportunities**

**Custom Hooks (5)**:
1. `useGetQuoteForm.ts` - Main state management
2. `useStorageUnitSelection.ts` - Storage counting
3. `useScheduling.ts` - Date/time handling
4. `usePhoneVerification.ts` - SMS flow
5. `useQuoteSubmission.ts` - Payment & submission

**Services (3)**:
1. `appointmentService.ts` - Appointment creation
2. `verificationService.ts` - SMS verification
3. `paymentService.ts` - Stripe integration (update existing)

**Utilities (5 files, 10+ functions)**:
1. `storageUtils.ts` - Storage unit helpers
2. `priceUtils.ts` - Price parsing/formatting
3. `validationUtils.ts` - Email, phone validation
4. `phoneUtils.ts` - Phone formatting
5. `dateUtils.ts` - Date/time parsing

---

## 🎯 NEXT STEPS

With TASK_001 complete, proceed to:

**TASK_002**: API Routes Migration Mapping (45 minutes)
- Verify all API endpoints exist in boombox-11.0
- Document exact request/response formats
- Create service layer specifications

**TASK_003**: Design GetQuote Architecture (1.5 hours)
- Design Provider pattern with complete state interface
- Define custom hooks architecture in detail
- Plan component hierarchy with integration points
- Design service layer structure

---

## 📝 NOTES & OBSERVATIONS

1. **High State Complexity**: 50+ useState hooks is excessive. Provider pattern will dramatically simplify.

2. **Tight Coupling**: GetQuoteForm manages too much logic. Need clear separation of concerns.

3. **API Evolution**: Current routes don't follow RESTful patterns. New routes are better organized.

4. **Validation Scattered**: Validation logic spread across multiple components. Need centralized Zod schemas.

5. **Reusable Components**: Many form inputs are already componentized, which will make migration easier.

6. **Stripe Integration**: Well-structured but embedded in component. Should move to service layer.

7. **SMS Flow**: Clean implementation in VerifyPhoneNumber. Can extract verification logic to hook.

8. **Error Handling**: Good field-specific error handling. Pattern should be preserved in refactor.

9. **Conditional Navigation**: Smart skip logic for DIY plan. Must preserve in new architecture.

10. **Already Refactored**: ChooseLabor and MyQuote components are already done, which reduces work significantly.

---

**TASK_001 STATUS**: ✅ **COMPLETED**  
**Time Taken**: 1.5 hours (as estimated)  
**Next Task**: TASK_002 - API Routes Migration Mapping

