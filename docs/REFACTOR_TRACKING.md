# Refactor Tracking System

## Overview

This document tracks all temporary implementations, deferred refactorings, and cleanup tasks that need to be addressed in Phase 9: Post-Migration Cleanup.

## Tracking Comment Standards

Use these standardized comment formats throughout the codebase to mark items for Phase 9 cleanup:

### 1. Temporary Implementations
```typescript
// @REFACTOR-P9-TEMP: Replace placeholder with actual implementation when [dependency] is migrated
// Priority: High | Est: 2h | Dependencies: API_005_DRIVERS_DOMAIN
const processAppointmentPayout = async (appointmentId: number) => {
  console.log('PLACEHOLDER: processAppointmentPayout called for appointment', appointmentId);
  return { success: false, error: 'Placeholder implementation' };
};
```

### 2. Import Path Issues
```typescript
// @REFACTOR-P9-IMPORT: Update to use migrated boombox-11.0 imports when available
// Priority: Medium | Est: 30min | Dependencies: API_008_ADMIN_SYSTEM_DOMAIN
import { accessStorageUnitPricing } from '../../../../../boombox-10.0/src/app/data/accessStorageUnitPricing';
```

### 3. Type System Improvements
```typescript
// @REFACTOR-P9-TYPES: Replace any with proper typed interface
// Priority: Medium | Est: 1h | Dependencies: None
const routeMetrics: any = calculateMetrics();
```

### 4. Performance Optimizations
```typescript
// @REFACTOR-P9-PERF: Optimize database query with proper indexing/caching
// Priority: Low | Est: 2h | Dependencies: None
const result = await prisma.appointment.findMany({
  include: { /* large nested include */ }
});
```

### 5. Code Consolidation
```typescript
// @REFACTOR-P9-CONSOLIDATE: Extract duplicate logic into utility function
// Priority: Medium | Est: 1h | Dependencies: None
// Found similar logic in: src/api/orders/create.ts:45, src/api/appointments/edit.ts:123
```

### 6. ESLint/TypeScript Fixes
```typescript
// @REFACTOR-P9-LINT: Fix TypeScript errors and remove eslint-disable
// Priority: High | Est: 30min | Dependencies: None
// eslint-disable-next-line @typescript-eslint/no-explicit-any
```

### 7. Legacy Code Removal
```typescript
// @REFACTOR-P9-LEGACY: Remove backward compatibility once migration is complete
// Priority: Low | Est: 15min | Dependencies: All phases complete
export type LegacyAppointment = AppointmentDomainRecord; // Backward compatibility
```

## Priority Levels

- **High**: Functionality is missing, temporary, or creates technical debt
- **Medium**: Code quality improvements, better typing, moderate optimizations  
- **Low**: Nice-to-have improvements, minor optimizations

## Current Tracking Status

### High Priority Items

| File | Line | Type | Description | Dependencies | Est Time |
|------|------|------|-------------|--------------|----------|
| `src/app/api/onfleet/webhook/route.ts` | 29-80 | TEMP | Replace 9 placeholder functions with migrated services | API_005, API_006, API_008 | 8h |
| `src/lib/services/appointmentOnfleetService.ts` | 287-291 | TEMP | Replace legacy task creation with proper Onfleet API | API_004 | 6h |
| `src/app/api/onfleet/create-task/route.ts` | 111 | TEMP | Uses placeholder service implementation | API_004 | 2h |
| `src/app/api/onfleet/webhook/route.ts` | 21 | IMPORT | Fix import path issues when services are migrated | API_005, API_006 | 30min |

### Medium Priority Items

| File | Line | Type | Description | Dependencies | Est Time |
|------|------|------|-------------|--------------|----------|
| `src/components/forms/FormProvider.tsx` | 20-27 | LINT | Remove eslint-disable for any types | None | 30min |
| `src/app/api/onfleet/create-task/route.ts` | 172 | TYPES | Replace any payload type with proper interface | None | 30min |
| `src/app/api/onfleet/webhook/route.ts` | 124 | TYPES | Update Stripe API version to latest | None | 15min |
| `src/components/layouts/Header.tsx` | 45 | CONSOLIDATE | Remove unused nav variables | None | 15min |

### Low Priority Items

| File | Line | Type | Description | Dependencies | Est Time |
|------|------|------|-------------|--------------|----------|
| `src/types/api.types.ts` | Various | LEGACY | Remove backward compatibility aliases | All phases | 30min |

## Automated Collection Tools

### 1. Refactor Comment Scanner

Create a script to automatically scan the codebase for refactor comments:

```bash
# Run from project root
npm run refactor:scan
```

This will:
- Search for all `@REFACTOR-P9-*` comments
- Generate updated tracking tables
- Identify completed items (where dependencies are resolved)
- Create prioritized task lists for Phase 9

### 2. Dependency Resolution Checker

Check which refactor items are ready to be addressed:

```bash
# Check what's ready based on completed phases
npm run refactor:ready
```

### 3. Progress Reporting

Generate progress reports for Phase 9 planning:

```bash
# Generate Phase 9 cleanup report
npm run refactor:report
```

## Phase 9 Task Categories

Based on the tracking system, Phase 9 tasks will be organized into:

### CLEANUP_001_REMOVE_PLACEHOLDERS (High Priority)
- Replace all temporary/placeholder implementations
- Update import paths to use migrated code
- Remove dependency comments when dependencies are resolved

### CLEANUP_002_FIX_TYPE_SYSTEM (Medium Priority)  
- Remove all `eslint-disable` comments by fixing underlying issues
- Replace `any` types with proper interfaces
- Clean up temporary type aliases

### CLEANUP_003_OPTIMIZE_AND_CONSOLIDATE (Low Priority)
- Extract duplicate code into utilities
- Performance optimizations
- Remove legacy backward compatibility code
- Final code quality improvements

## Usage Guidelines

### For Developers

1. **Always add tracking comments** when creating temporary implementations
2. **Include realistic time estimates** and proper dependencies
3. **Update tracking when dependencies are resolved**
4. **Prioritize based on functional impact**

### For AI Assistants

1. **Automatically add tracking comments** when creating placeholder code
2. **Update REFACTOR_TRACKING.md** when adding new items
3. **Check for resolved dependencies** and suggest cleanup when ready
4. **Maintain consistent comment format** across all files

### Review Process

1. **Weekly reviews** during active development phases
2. **Dependency checking** at the end of each phase
3. **Pre-Phase 9 audit** to verify all items are properly tracked
4. **Post-cleanup verification** that all tracked items are resolved

## Example Integration

Here's how this was used in the Onfleet webhook refactoring:

```typescript
/**
 * @fileoverview Onfleet webhook endpoint for processing delivery notifications
 * @source boombox-10.0/src/app/api/webhooks/onfleet/route.ts
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import Stripe from 'stripe';

// @REFACTOR-P9-TEMP: Replace with migrated accessStorageUnitPricing when API_008 completes
// Priority: High | Est: 15min | Dependencies: API_008_ADMIN_SYSTEM_DOMAIN  
const accessStorageUnitPricing = 50;

// @REFACTOR-P9-TEMP: Replace with migrated payout service when API_005 completes
// Priority: High | Est: 2h | Dependencies: API_005_DRIVERS_DOMAIN
const processAppointmentPayout = async (appointmentId: number) => {
  console.log('PLACEHOLDER: processAppointmentPayout called for appointment', appointmentId);
  return { success: false, error: 'Placeholder implementation' };
};

// @REFACTOR-P9-TYPES: Replace Stripe API version with latest when dependencies support it
// Priority: Medium | Est: 30min | Dependencies: None
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia' // Should be '2025-06-30.basil'
});
```

This systematic approach ensures that Phase 9 cleanup is comprehensive, organized, and efficient!

---

## Recent Updates (2025-01-28)

### Files Updated with Tracking Comments

**✅ `src/lib/services/appointmentOnfleetService.ts`**
- Added tracking for legacy `createOnfleetTasksWithDatabaseSave` function
- Identified 6h of work needed to replace mock implementation with proper Onfleet API

**✅ `src/app/api/onfleet/create-task/route.ts`**
- Added tracking for placeholder service dependency
- Identified 2h of work dependent on API_004_ONFLEET_DOMAIN completion  
- Added tracking for TypeScript any type usage

**✅ `src/app/api/onfleet/webhook/route.ts`**
- Added comprehensive tracking for 9 placeholder functions
- Identified 8h+ of high-priority work dependent on driver/admin API migrations
- Added tracking for import path issues and Stripe API version updates

### Summary Statistics

**Current Status**: 29 tracked items (up from 14)
- **16 TEMP**: Temporary implementations requiring business logic restoration
- **4 TYPES**: TypeScript improvements and type safety fixes  
- **3 LINT**: ESLint/TypeScript fixes ready for immediate resolution
- **2 IMPORT**: Import path corrections waiting on API migrations
- **2 LEGACY**: Backward compatibility cleanup
- **1 PERF**: Performance optimization
- **1 CONSOLIDATE**: Code consolidation opportunity

**Phase 9 Readiness**: System now comprehensively tracks all deferred refactoring work with proper prioritization, time estimates, and dependency mapping. When API migration phases complete, Phase 9 cleanup can proceed systematically with zero guesswork. 