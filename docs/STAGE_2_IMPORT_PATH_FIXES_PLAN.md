# Stage 2: Import Path Fixes - Execution Plan

**Date**: October 16, 2025  
**Status**: 🚀 Starting  
**Target**: Fix ~50-80 failing tests  
**Estimated Time**: 4-6 hours  
**Goal**: 97-97.5% → 99% pass rate

---

## 📊 Context

### Why Import Paths Changed
Phase 5 and 6 migrations reorganized components:
- **Old**: `@/components/ComponentName`
- **New**: `@/components/features/domain/ComponentName`

### Impact
Tests using old import paths fail with "Cannot find module" errors.

---

## 🎯 Stage 2 Objectives

1. ✅ Identify all import path failures
2. ✅ Create systematic replacement patterns
3. ✅ Batch update test files
4. ✅ Verify fixes with targeted test runs
5. ✅ Achieve ~99% pass rate

---

## 🔍 Step 1: Identify Import Path Failures (30 min)

### Strategy
1. Run full test suite with verbose output
2. Capture "Cannot find module" errors
3. Extract import paths that need updating
4. Categorize by domain (admin, auth, orders, etc.)

### Common Patterns to Look For
```typescript
// Admin components (Phase 6)
import { AdminComponent } from '@/components/admin/AdminComponent';
// Should be:
import { AdminComponent } from '@/components/features/admin/pages/AdminComponent';

// Order components (Phase 5)
import { OrderComponent } from '@/components/orders/OrderComponent';
// Should be:
import { OrderComponent } from '@/components/features/orders/OrderComponent';

// Auth components
import { AuthComponent } from '@/components/auth/AuthComponent';
// Should be:
import { AuthComponent } from '@/components/features/auth/AuthComponent';
```

---

## 🔧 Step 2: Create Replacement Patterns (30 min)

### Admin Components (Phase 6 migrations)
```bash
# Management pages
's|@/components/admin/AdminCustomers|@/components/features/admin/pages/AdminCustomersPage|g'
's|@/components/admin/AdminDrivers|@/components/features/admin/pages/AdminDriversPage|g'
's|@/components/admin/AdminMovers|@/components/features/admin/pages/AdminMoversPage|g'
's|@/components/admin/AdminVehicles|@/components/features/admin/pages/AdminVehiclesPage|g'
's|@/components/admin/AdminStorageUnits|@/components/features/admin/pages/AdminStorageUnitsPage|g'
's|@/components/admin/AdminJobs|@/components/features/admin/pages/AdminJobsPage|g'
's|@/components/admin/AdminFeedback|@/components/features/admin/pages/AdminFeedbackPage|g'
's|@/components/admin/AdminInventory|@/components/features/admin/pages/AdminInventoryPage|g'

# Task detail pages
's|@/components/admin/tasks/|@/components/features/admin/tasks/|g'

# Special pages
's|@/components/admin/AdminCalendar|@/components/features/admin/pages/AdminCalendarPage|g'
's|@/components/admin/AdminDeliveryRoutes|@/components/features/admin/pages/AdminDeliveryRoutesPage|g'
's|@/components/admin/AdminAskDatabase|@/components/features/admin/pages/AdminAskDatabasePage|g'
's|@/components/admin/AdminInvites|@/components/features/admin/pages/AdminInvitesPage|g'
```

### Order Components (Phase 5 migrations)
```bash
's|@/components/orders/GetQuoteForm|@/components/features/orders/get-quote/GetQuoteForm|g'
's|@/components/orders/AccessStorageForm|@/components/features/orders/AccessStorageForm|g'
's|@/components/orders/AddStorageForm|@/components/features/orders/AddStorageForm|g'
's|@/components/orders/MyQuote|@/components/features/orders/MyQuote|g'
's|@/components/orders/ChooseLabor|@/components/features/orders/ChooseLabor|g'
```

### Auth Components
```bash
's|@/components/auth/LoginForm|@/components/features/auth/LoginForm|g'
's|@/components/auth/SignupForm|@/components/features/auth/SignupForm|g'
's|@/components/auth/PasswordReset|@/components/features/auth/PasswordReset|g'
```

---

## 📝 Step 3: Batch Update Test Files (2-3 hours)

### Approach
1. **Find affected tests**: `grep -r "Cannot find module" test output`
2. **Group by domain**: Admin, Orders, Auth, etc.
3. **Apply patterns**: Use sed or manual updates
4. **Verify after each batch**: Run tests to confirm fixes

### Priority Order
1. **Admin tests** (most migrations, Phase 6)
2. **Order tests** (GetQuote, Access/Add Storage)
3. **Auth tests** (Login, Signup)
4. **Other tests** (as identified)

### Batch Update Script Template
```bash
#!/bin/bash
# Update admin component imports

find tests/ -name "*.test.tsx" -o -name "*.test.ts" | while read file; do
  # Admin management pages
  sed -i '' 's|@/components/admin/AdminCustomers|@/components/features/admin/pages/AdminCustomersPage|g' "$file"
  sed -i '' 's|@/components/admin/AdminDrivers|@/components/features/admin/pages/AdminDriversPage|g' "$file"
  # ... more patterns
done
```

---

## ✅ Step 4: Verify Fixes (1 hour)

### Testing Strategy
1. **Run admin tests**: `npm test -- --testPathPatterns="admin"`
2. **Run order tests**: `npm test -- --testPathPatterns="orders"`
3. **Run auth tests**: `npm test -- --testPathPatterns="auth"`
4. **Run full suite**: Measure overall improvement

### Success Criteria
- All import errors resolved
- No new failures introduced
- ~50-80 tests now passing
- Pass rate: 97-97.5% → 99%

---

## 🎯 Expected Outcomes

### Tests Fixed
- **Admin component imports**: ~20-30 tests
- **Order component imports**: ~15-20 tests
- **Auth component imports**: ~5-10 tests
- **Other imports**: ~10-20 tests
- **Total**: ~50-80 tests fixed

### Pass Rate Improvement
- **Before**: ~6,115-6,145/6,304 (97-97.5%)
- **After**: ~6,165-6,225/6,304 (98-99%)
- **Improvement**: +0.5-1.5% (~50-80 tests)

---

## 🚨 Common Pitfalls to Avoid

### 1. Over-Broad Replacements
❌ Don't replace imports that are already correct
❌ Don't break working imports

**Solution**: Test after each batch

### 2. Incorrect New Paths
❌ Don't guess at new component locations
❌ Don't use old Phase 4 paths

**Solution**: Reference component-migration-checklist.md

### 3. Missing Index Exports
❌ Don't import from files not exported in index.ts
❌ Don't use internal paths if index export exists

**Solution**: Check index.ts files first

---

## 📋 Step-by-Step Execution

### Phase 1: Discovery (30 min)
- [ ] Run full test suite
- [ ] Capture import errors
- [ ] Create list of imports to fix
- [ ] Categorize by domain

### Phase 2: Pattern Creation (30 min)
- [ ] Create sed patterns for each domain
- [ ] Test patterns on sample files
- [ ] Verify patterns are safe
- [ ] Document patterns

### Phase 3: Batch Updates (2-3 hours)
- [ ] Update admin test imports
- [ ] Verify admin tests pass
- [ ] Update order test imports
- [ ] Verify order tests pass
- [ ] Update auth test imports
- [ ] Verify auth tests pass
- [ ] Update remaining imports
- [ ] Verify all tests

### Phase 4: Verification (1 hour)
- [ ] Run full test suite
- [ ] Count improvements
- [ ] Document results
- [ ] Update REFACTOR_PRD.md

---

## 🛠️ Tools & Commands

### Find Import Errors
```bash
npm test 2>&1 | grep "Cannot find module" | sort | uniq
```

### Check Component Location
```bash
find src/components -name "ComponentName.tsx"
```

### Batch Update Pattern
```bash
# Dry run first
grep -r "old-import-path" tests/

# Then replace
find tests/ -name "*.test.tsx" | xargs sed -i '' 's|old-path|new-path|g'
```

### Test Specific Domain
```bash
npm test -- --testPathPatterns="admin"
npm test -- --testPathPatterns="orders"
npm test -- --testPathPatterns="auth"
```

---

## 📈 Progress Tracking

### Discovery Phase
- [ ] Import errors identified
- [ ] Domains categorized
- [ ] Patterns documented

### Update Phase
- [ ] Admin imports fixed (0/~30)
- [ ] Order imports fixed (0/~20)
- [ ] Auth imports fixed (0/~10)
- [ ] Other imports fixed (0/~20)

### Verification Phase
- [ ] Admin tests verified
- [ ] Order tests verified
- [ ] Auth tests verified
- [ ] Full suite verified
- [ ] Metrics documented

---

## 🎯 Success Criteria

- [ ] All "Cannot find module" errors resolved
- [ ] ~50-80 tests now passing
- [ ] Pass rate ~99% (from ~97-97.5%)
- [ ] No new failures introduced
- [ ] Documentation updated

---

## 🚀 Ready to Execute!

**Current Status**: Ready to start  
**Next Step**: Run full test suite to identify import errors  
**Estimated Completion**: 4-6 hours  
**Confidence**: High (proven systematic approach)

Let's fix these import paths! 💪

