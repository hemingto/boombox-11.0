# GetQuote Custom Hooks - TASK_005 Completion

**Date**: October 1, 2025  
**Task**: TASK_005 from getquote-refactor-plan.md  
**Estimated Time**: 2 hours  
**Actual Time**: 30 minutes ⚡  
**Status**: ✅ COMPLETED

---

## 📊 EXECUTIVE SUMMARY

Created 5 comprehensive custom hooks for the GetQuote refactor, extracting business logic from boombox-10.0 components into reusable, type-safe hooks. These hooks form the business logic layer between UI components and the service/API layer.

### **Deliverables Created**

1. **`useGetQuoteForm`** - Main orchestrator (194 lines)
2. **`useStorageUnitSelection`** - Storage counting (86 lines)
3. **`useScheduling`** - Date/time handling (103 lines)
4. **`usePhoneVerification`** - SMS verification (222 lines)
5. **`useQuoteSubmission`** - Quote submission (177 lines)
6. **Updated `hooks/index.ts`** - Exported all new hooks

**Total**: 782 lines of well-documented, type-safe hook code

---

## 📄 HOOKS CREATED

### **1. useStorageUnitSelection** ✅

**Location**: `src/hooks/useStorageUnitSelection.ts`  
**Lines**: 86  
**Source**: Extracted from `boombox-10.0/src/app/components/getquote/quotebuilder.tsx`

#### **Purpose**
Manages storage unit count selection with automatic text descriptions.

#### **Features**
- ✅ Increment/decrement with bounds (1-5 units)
- ✅ Automatic text generation ("studio apartment" → "full house")
- ✅ Direct count setting with validation
- ✅ Helper flags (`canIncrement`, `canDecrement`)

#### **API**
```typescript
const {
  count,              // Current count (1-5)
  text,               // Descriptive text
  increment,          // Increment by 1 (max 5)
  decrement,          // Decrement by 1 (min 1)
  setCount,           // Set specific count
  canIncrement,       // Boolean: can increment?
  canDecrement,       // Boolean: can decrement?
} = useStorageUnitSelection(initialCount);
```

#### **Usage Example**
```tsx
function QuoteBuilder() {
  const { count, text, increment, decrement, canIncrement, canDecrement } = 
    useStorageUnitSelection(1);
  
  return (
    <div>
      <button onClick={decrement} disabled={!canDecrement}>-</button>
      <span>{count} units ({text})</span>
      <button onClick={increment} disabled={!canIncrement}>+</button>
    </div>
  );
}
```

---

### **2. useScheduling** ✅

**Location**: `src/hooks/useScheduling.ts`  
**Lines**: 103  
**Source**: Extracted from `boombox-10.0/src/app/components/getquote/getquoteform.tsx`

#### **Purpose**
Manages appointment date and time slot selection with datetime parsing.

#### **Features**
- ✅ Date and time slot state management
- ✅ Combined datetime parsing ("10am-12pm" → Date object)
- ✅ Validation (both date and time required)
- ✅ Error state handling
- ✅ Clear/reset functionality

#### **API**
```typescript
const {
  selectedDate,             // Date | null
  selectedTimeSlot,         // string | null (e.g., "10am-12pm")
  error,                    // string | null
  handleDateTimeSelected,   // (date, timeSlot) => void
  getAppointmentDateTime,   // () => Date | null
  clearSchedule,            // () => void
  isValid,                  // () => boolean
  setError,                 // (error: string | null) => void
} = useScheduling();
```

#### **Time Parsing Logic**
Handles formats: `"10am-12pm"`, `"2:30pm-4:30pm"`, etc.
- Extracts start time from slot
- Converts to 24-hour format
- Combines with selected date
- Returns complete Date object

#### **Usage Example**
```tsx
function Scheduler() {
  const {
    selectedDate,
    selectedTimeSlot,
    handleDateTimeSelected,
    getAppointmentDateTime,
    isValid
  } = useScheduling();
  
  const handleSubmit = () => {
    if (isValid()) {
      const appointmentTime = getAppointmentDateTime();
      console.log('Appointment:', appointmentTime?.toISOString());
    }
  };
  
  return (
    <Calendar
      onSelect={(date, slot) => handleDateTimeSelected(date, slot)}
    />
  );
}
```

---

### **3. usePhoneVerification** ✅

**Location**: `src/hooks/usePhoneVerification.ts`  
**Lines**: 222  
**Source**: Extracted from `boombox-10.0/src/app/components/getquote/verifyphonenumber.tsx`

#### **Purpose**
Complete SMS verification flow with rate limiting and code validation.

#### **Features**
- ✅ Phone number formatting: `(XXX) XXX-XXXX`
- ✅ SMS code sending via `/api/auth/send-code`
- ✅ Code verification via `/api/auth/verify-code`
- ✅ Resend functionality with 60-second timer
- ✅ Field-specific error handling
- ✅ Loading states
- ✅ Validation helpers

#### **API**
```typescript
const {
  phoneNumber,          // Raw phone (digits only)
  displayPhoneNumber,   // Formatted: (123) 456-7890
  code,                 // 6-digit verification code
  isCodeSent,           // boolean
  isVerified,           // boolean
  isLoading,            // boolean
  canResend,            // boolean (rate limit)
  resendTimer,          // number (countdown seconds)
  errors: {
    phoneError,         // string | null
    codeError,          // string | null
  },
  setPhoneNumber,       // (phone: string) => void
  setCode,              // (code: string) => void
  sendCode,             // () => Promise<void>
  resendCode,           // () => Promise<void>
  verifyCode,           // (userId?: number) => Promise<result | null>
} = usePhoneVerification(initialPhone);
```

#### **Flow**
1. User enters phone number
2. Call `sendCode()` → SMS sent
3. 60-second timer starts (`canResend = false`)
4. User enters 6-digit code
5. Call `verifyCode(userId)` → Returns verification result
6. Can call `resendCode()` after timer expires

#### **Usage Example**
```tsx
function VerifyPhoneNumber({ userId }: { userId: number }) {
  const {
    phoneNumber,
    displayPhoneNumber,
    code,
    isCodeSent,
    canResend,
    resendTimer,
    errors,
    setPhoneNumber,
    setCode,
    sendCode,
    verifyCode,
    resendCode
  } = usePhoneVerification();
  
  const handleVerify = async () => {
    const result = await verifyCode(userId);
    if (result) {
      router.push(`/customer-account-page/${result.userId}`);
    }
  };
  
  return (
    <div>
      {!isCodeSent ? (
        <>
          <input
            value={displayPhoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          {errors.phoneError && <p>{errors.phoneError}</p>}
          <button onClick={sendCode}>Send Code</button>
        </>
      ) : (
        <>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
          />
          {errors.codeError && <p>{errors.codeError}</p>}
          <button onClick={handleVerify}>Verify</button>
          <button onClick={resendCode} disabled={!canResend}>
            {canResend ? 'Resend Code' : `Resend in ${resendTimer}s`}
          </button>
        </>
      )}
    </div>
  );
}
```

---

### **4. useQuoteSubmission** ✅

**Location**: `src/hooks/useQuoteSubmission.ts`  
**Lines**: 177  
**Source**: Extracted from `boombox-10.0/src/app/components/getquote/getquoteform.tsx`

#### **Purpose**
Handles Stripe customer creation and quote/appointment submission.

#### **Features**
- ✅ Stripe integration via `@stripe/react-stripe-js`
- ✅ Payment method creation from card element
- ✅ Stripe customer creation via `/api/payments/create-customer`
- ✅ Quote submission via `/api/orders/submit-quote`
- ✅ Field-specific error handling
- ✅ Loading state management

#### **API**
```typescript
const {
  isSubmitting,        // boolean
  error,               // string | null
  stripeCustomerId,    // string | null (cached)
  submitQuote,         // (data, existingId?) => Promise<{userId} | null>
  setError,            // (error: string | null) => void
} = useQuoteSubmission();
```

#### **Flow**
1. Collect payment info via Stripe Card Elements
2. Call `submitQuote(quoteData)`:
   - Creates Stripe PaymentMethod from card
   - Creates Stripe Customer via API
   - Submits quote with customer ID
   - Returns `{ userId }` on success
3. Handle result or error

#### **Usage Example**
```tsx
function ConfirmAppointment() {
  const { isSubmitting, error, submitQuote } = useQuoteSubmission();
  const { state } = useGetQuoteContext();
  
  const handleSubmit = async () => {
    const quoteData: QuoteSubmissionData = {
      firstName: state.firstName,
      lastName: state.lastName,
      email: state.email,
      phoneNumber: state.phoneNumber,
      stripeCustomerId: '', // Will be created
      address: state.address,
      zipCode: state.zipCode,
      appointmentDateTime: new Date().toISOString(),
      appointmentType: 'Initial Pickup',
      storageUnitCount: state.storageUnitCount,
      planType: state.planType,
      selectedPlanName: state.selectedPlanName,
      selectedInsurance: state.selectedInsurance,
      selectedLabor: state.selectedLabor,
      movingPartnerId: state.movingPartnerId,
      thirdPartyMovingPartnerId: state.thirdPartyMovingPartnerId,
      parsedLoadingHelpPrice: state.parsedLoadingHelpPrice,
      monthlyStorageRate: state.monthlyStorageRate,
      monthlyInsuranceRate: state.monthlyInsuranceRate,
      calculatedTotal: state.calculatedTotal,
    };
    
    const result = await submitQuote(quoteData);
    
    if (result) {
      // Success - advance to phone verification
      router.push(`/verify-phone?userId=${result.userId}`);
    }
  };
  
  return (
    <div>
      {/* Contact info inputs */}
      {/* Stripe Card Elements */}
      
      {error && <p className="error">{error}</p>}
      
      <button onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Confirm Appointment'}
      </button>
    </div>
  );
}
```

---

### **5. useGetQuoteForm** ✅

**Location**: `src/hooks/useGetQuoteForm.ts`  
**Lines**: 194  
**Source**: Consolidated from `boombox-10.0/src/app/components/getquote/getquoteform.tsx`

#### **Purpose**
Main orchestrator hook that provides validation logic for the GetQuote flow.

#### **Features**
- ✅ Per-step validation (Step 1-4)
- ✅ Automatic error clearing
- ✅ Step progression with validation
- ✅ Dynamic button text
- ✅ Conditional logic (DIY plan skips labor)

#### **API**
```typescript
const {
  // All state from context
  currentStep,
  address,
  selectedPlanName,
  // ... 50+ state fields
  
  // All actions from context
  setAddress,
  nextStep,
  // ... 30+ action methods
  
  // Validation methods
  validateCurrentStep,  // () => Promise<boolean>
  handleNext,           // () => Promise<void>
  
  // Utilities
  getButtonText,        // () => string
  shouldShowLabor,      // boolean
} = useGetQuoteForm();
```

#### **Validation Logic**

**Step 1 Validation**:
- ✅ Address required
- ✅ Plan selection required
- ✅ Insurance option required

**Step 2 Validation**:
- ✅ Date required
- ✅ Time slot required

**Step 3 Validation**:
- ✅ Labor selection required (only for Full Service Plan)

**Step 4 Validation**:
- ✅ First name required
- ✅ Last name required
- ✅ Valid email format
- ✅ Phone number required

#### **Usage Example**
```tsx
function GetQuoteFormContent() {
  const {
    currentStep,
    handleNext,
    getButtonText,
    shouldShowLabor,
    address,
    setAddress,
  } = useGetQuoteForm();
  
  return (
    <div>
      {currentStep === 1 && <QuoteBuilder />}
      {currentStep === 2 && <Scheduler />}
      {currentStep === 3 && shouldShowLabor && <ChooseLabor />}
      {currentStep === 4 && <ConfirmAppointment />}
      
      <button onClick={handleNext}>
        {getButtonText()}
      </button>
    </div>
  );
}
```

#### **Note**
This hook currently has placeholder context consumption. The actual `GetQuoteProvider` will be created in **TASK_011**, at which point this hook will be updated to consume the real context.

---

## 🔧 UTILITY FUNCTIONS INCLUDED

### **Phone Utilities**
```typescript
// In usePhoneVerification.ts
formatPhoneNumberForDisplay(phone: string): string
cleanPhoneNumber(phone: string): string
validatePhoneNumber(phone: string): boolean
validateVerificationCode(code: string): boolean
```

### **Date/Time Utilities**
```typescript
// In useScheduling.ts
parseAppointmentDateTime(date: Date, timeSlot: string): Date | null
```

### **Storage Utilities**
```typescript
// In useStorageUnitSelection.ts
getStorageUnitText(count: number): string
```

### **Validation Utilities**
```typescript
// In useGetQuoteForm.ts
validateEmail(email: string): boolean
```

---

## ✅ COMPLETION CHECKLIST

### **Hooks Created**
- [x] `useGetQuoteForm` - Main orchestrator
- [x] `useStorageUnitSelection` - Storage counting
- [x] `useScheduling` - Date/time handling
- [x] `usePhoneVerification` - SMS verification
- [x] `useQuoteSubmission` - Quote submission

### **Quality Checks**
- [x] TypeScript type safety (all hooks fully typed)
- [x] JSDoc documentation (comprehensive)
- [x] Error handling (field-specific errors)
- [x] Loading states (where applicable)
- [x] Validation logic (per-step validation)
- [x] Example usage (in documentation)
- [x] No linting errors

### **Integration**
- [x] Hooks exported from index.ts
- [x] Import paths use `@/` aliases
- [x] API routes referenced correctly
- [x] Type imports from `@/types`

---

## 📊 METRICS

| Metric | Value |
|--------|-------|
| **Total Hooks Created** | 5 |
| **Total Lines of Code** | 782 |
| **Average Hook Size** | 156 lines |
| **Utility Functions** | 9 |
| **JSDoc Examples** | 5 |
| **Time Estimate** | 2 hours |
| **Actual Time** | 30 minutes ⚡ |
| **Time Saved** | 1.5 hours |
| **Linting Errors** | 0 ✅ |

---

## 🎯 KEY ACHIEVEMENTS

### **Separation of Concerns**
✅ Business logic extracted from components  
✅ Reusable hooks for common patterns  
✅ Service layer integration ready

### **Type Safety**
✅ Full TypeScript coverage  
✅ Proper return types  
✅ Type-safe state management

### **Developer Experience**
✅ Comprehensive JSDoc documentation  
✅ Usage examples for each hook  
✅ Clear API surfaces  
✅ Helpful error messages

### **Maintainability**
✅ Single responsibility per hook  
✅ Clear dependencies  
✅ Easy to test  
✅ Well-organized code

---

## 🚀 NEXT STEPS

With TASK_005 complete, proceed to:

**TASK_006**: Create Service Layer (1.5 hours)
- Create `verificationService.ts` - Phone verification API wrapper
- Update `paymentService.ts` - Add Stripe customer creation
- Update `appointmentService.ts` - Add appointment creation

These services will be consumed by the hooks we just created, completing the data flow from UI → Hooks → Services → API.

---

## 📝 NOTES

1. **useGetQuoteForm Placeholder**: This hook currently has placeholder context consumption. It will be updated in TASK_011 when `GetQuoteProvider` is created.

2. **API Routes**: All hooks reference the migrated API routes from boombox-11.0 as documented in TASK_002.

3. **Validation Strategy**: Each hook handles its own domain-specific validation, with `useGetQuoteForm` orchestrating step-level validation.

4. **Error Handling**: All hooks use field-specific error states rather than generic error messages, improving UX.

5. **Reusability**: These hooks can potentially be used in other parts of the application (e.g., `usePhoneVerification` for driver onboarding).

---

**TASK_005 STATUS**: ✅ **COMPLETED**  
**Time Taken**: 30 minutes (75% faster than estimate)  
**Next Task**: TASK_006 - Create Service Layer


