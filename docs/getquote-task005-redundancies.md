# GetQuote Task 5 - Redundancy Analysis

**Date**: October 1, 2025  
**Status**: ⚠️ REDUNDANCIES FOUND - Need cleanup

---

## 📊 SUMMARY

During TASK_005 (Create Custom Hooks), several utility functions were created inline within hooks. Upon analysis, some of these utilities **already exist** in the codebase or are **duplicated across multiple files**.

---

## 🔍 REDUNDANCIES FOUND

### 1. Phone Utility Functions ⚠️ DUPLICATE

**Location**: `src/hooks/usePhoneVerification.ts` (lines 21-49)

**Functions Created**:
```typescript
function formatPhoneNumberForDisplay(phone: string): string
function cleanPhoneNumber(phone: string): string
function validatePhoneNumber(phone: string): boolean
function validateVerificationCode(code: string): boolean
```

**Already Exists**: `src/lib/utils/phoneUtils.ts`
```typescript
✅ formatPhoneNumberForDisplay() - ALREADY EXISTS (line 42)
✅ extractPhoneDigits() - Same as cleanPhoneNumber() (line 75)
✅ isValidPhoneNumber() - Same as validatePhoneNumber() (line 63)
```

**Action Required**:
- [ ] Replace inline functions in `usePhoneVerification.ts` with imports from `@/lib/utils/phoneUtils`
- [ ] Add `validateVerificationCode()` to validationUtils.ts (currently only in Zod schema)

---

### 2. Email Validation ⚠️ DUPLICATE

**Location**: `src/hooks/useGetQuoteForm.ts` (lines 18-22)

**Function Created**:
```typescript
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

**Already Exists**: `src/lib/utils/validationUtils.ts`
```typescript
✅ isValidEmail(email: string): boolean - ALREADY EXISTS (line 46)
```

**Action Required**:
- [ ] Replace inline `validateEmail()` with import: `import { isValidEmail } from '@/lib/utils/validationUtils'`

---

### 3. Storage Unit Text ⚠️ MASSIVE DUPLICATION

**Location**: `src/hooks/useStorageUnitSelection.ts` (lines 14-29)

**Function Created**:
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

**CRITICAL ISSUE**: This function is duplicated in **5 FILES**:
1. ✅ `src/hooks/useStorageUnitSelection.ts` (NEW - Task 5)
2. ❌ `src/components/forms/StorageUnitCounter.tsx` (line 194)
3. ❌ `src/hooks/useAddStorageForm.ts` (line 73)
4. ❌ `src/hooks/useAddStorageFormPersistence.ts` (line 100)
5. ❌ `src/components/features/orders/AddStorageProvider.tsx` (line 126)

**Listed but Missing**: `src/lib/utils/index.ts` exports `getStorageUnitText` from `pricingUtils`, but the function doesn't actually exist in `pricingUtils.ts`!

**Action Required**:
- [ ] Create `getStorageUnitText()` in `src/lib/utils/storageUtils.ts` (or add to existing file)
- [ ] Update ALL 5 files to import from centralized utils
- [ ] Fix `pricingUtils.ts` export or remove from `index.ts`

---

### 4. Appointment DateTime Parsing ✅ NO DUPLICATION (New Function)

**Location**: `src/hooks/useScheduling.ts` (lines 19-48)

**Function Created**:
```typescript
function parseAppointmentDateTime(date: Date, timeSlot: string): Date | null {
  // Parses time slots like "10am-12pm" and combines with date
}
```

**Status**: ✅ **UNIQUE** - This function does NOT exist elsewhere in utils

**Note**: `dateUtils.ts` has a comment about `getAppointmentDateTime` from boombox-10.0 edit-appointment components, but the actual function was never migrated to utils.

**Recommendation**: 
- ⚠️ Consider extracting to `src/lib/utils/dateUtils.ts` for reusability
- OR keep in hook since it's specific to scheduling flow

---

## 📋 CLEANUP CHECKLIST

### High Priority (Blocking Duplication)

- [ ] **Phone Utils Cleanup** (15 minutes)
  - [ ] Update `usePhoneVerification.ts` to import from `phoneUtils.ts`
  - [ ] Remove inline phone utility functions
  - [ ] Add `validateVerificationCode()` to `validationUtils.ts`
  - [ ] Test phone verification flow

- [ ] **Storage Unit Text Cleanup** (30 minutes) ⚠️ CRITICAL
  - [ ] Create canonical `getStorageUnitText()` in utils
  - [ ] Update all 5 files to use centralized version
  - [ ] Run tests for all affected components
  - [ ] Fix pricingUtils export issue

- [ ] **Email Validation Cleanup** (5 minutes)
  - [ ] Update `useGetQuoteForm.ts` to import `isValidEmail`
  - [ ] Remove inline `validateEmail()`

### Medium Priority (Optimization)

- [ ] **Consider Extracting** `parseAppointmentDateTime()` to dateUtils
  - Only if needed by other components
  - Currently only used in scheduling flow

---

## 🎯 IMPACT ASSESSMENT

### Current State
- **3 redundant function implementations** in Task 5 hooks
- **1 massive duplication** (`getStorageUnitText` in 5 files)
- **Broken export** in utils index (references non-existent function)

### After Cleanup
- ✅ All utilities centralized
- ✅ Single source of truth
- ✅ Easier to maintain and test
- ✅ Reduced bundle size
- ✅ Consistent behavior across codebase

---

## 🚀 RECOMMENDED ACTION PLAN

### Option 1: Clean Up Now (45 minutes)
- Fix all redundancies before proceeding to TASK_007
- Ensures no additional duplicates created
- Clean foundation for Phase 3 component refactoring

### Option 2: Document and Defer
- Add to TASK_007 (Extract Utility Functions)
- Clean up all utilities together
- Risk: More duplicates might be created in meantime

### Option 3: Fix Critical, Defer Others
- Fix `getStorageUnitText` duplication NOW (critical - 5 files)
- Defer phone/email utils to TASK_007

---

## 📝 NOTES

1. **Why This Happened**: Hooks were created based on Task 3 architecture doc, which didn't cross-reference existing utils

2. **Prevention**: Always run redundancy check before creating new utilities:
   ```bash
   grep -r "functionName" src/lib/utils/
   grep -r "functionName" src/hooks/
   ```

3. **Good Practice**: The component-migration-checklist.md has redundancy prevention steps - should apply to hook creation too

---

**RECOMMENDATION**: Proceed with **Option 1** - clean up now before TASK_007 to prevent cascading duplications.


