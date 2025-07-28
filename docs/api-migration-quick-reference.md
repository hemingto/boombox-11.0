# API Migration Quick Reference

## **Pre-Migration Checklist (Do BEFORE migrating any domain)**

### 0. Check Current Duplication Status (5 min) 🆕
```bash
npm run utils:scan-duplicates
```
**Review**: Current redundancies, establish baseline

### 1. Analyze Domain (30 min)
```bash
npm run migration:analyze <domain-name>
```
**Review**: What utilities to reuse vs create new

### 2. Check Cross-Domain Duplicates (15 min)  
```bash
npm run migration:check-duplicates
```
**Review**: Utilities needed by multiple domains

### 3. Plan Utility Placement (10 min)
- **Shared (2+ domains)**: `src/lib/utils/` (phoneUtils, dateUtils, validationUtils)
- **Domain-specific**: `src/lib/utils/` (appointmentUtils, packingSupplyUtils)  
- **Complex business logic**: `src/lib/services/` (billing, stripe, availability)

## **During Route Migration (Per Route)**

### ✅ ALWAYS CHECK FIRST:
1. **Existing Utilities**: Search `src/lib/utils/index.ts` exports
2. **Analysis Results**: Check domain analysis for reuse recommendations
3. **Similar Patterns**: Look for similar logic in migrated routes

### ✅ IMPORT BEFORE CREATING:
```typescript
// ✅ Reuse existing utilities
import { 
  normalizePhoneNumberToE164,    // phoneUtils
  formatDateForDisplay,          // dateUtils
  isValidEmail,                  // validationUtils
  generateJobCode               // formatUtils
} from '@/lib/utils';

// ✅ Reuse existing services
import { MessageService } from '@/lib/messaging/MessageService';
import { StripeInvoiceService } from '@/lib/services/stripe';
```

### ✅ CREATE NEW ONLY IF:
- Analysis shows utility is truly unique to this route/domain
- No existing utility provides the same functionality
- Consolidation analysis recommends creating domain-specific utility

## **Common Utilities Quick Reference**

### **Phone Numbers** 📞
```typescript
import { normalizePhoneNumberToE164, formatPhoneNumberForDisplay } from '@/lib/utils';
```
**Used by**: auth, drivers, customers, orders

### **Date/Time** 📅
```typescript
import { 
  formatDateForDisplay, 
  formatDateTime, 
  calculateDeliveryWindow 
} from '@/lib/utils';
```
**Used by**: orders, onfleet, admin, drivers

### **Email Validation** ✉️
```typescript
import { isValidEmail, isValidEmailStrict } from '@/lib/utils';
```
**Used by**: auth, drivers, customers, admin

### **Messaging** 💬
```typescript
import { MessageService } from '@/lib/messaging/MessageService';
// Templates: src/lib/messaging/templates/sms/{domain}/
```
**Used by**: ALL domains

### **Business Calculations** 💰
```typescript
import { 
  parseLoadingHelpPrice, 
  calculateMonthlyStorageCost,
  isInServiceArea 
} from '@/lib/utils';
```
**Used by**: orders, payments, admin

### **Validation Schemas** 🔒
```typescript
import { 
  positiveIntSchema, 
  phoneSchema, 
  emailSchema 
} from '@/lib/validations/api.validations';
```
**Used by**: ALL API routes

## **Red Flags (DON'T DO THIS)**

❌ **Creating duplicate phone utilities**:
```typescript
// DON'T create new phone functions
function normalizePhone() { /* duplicate */ }
function formatPhoneNumber() { /* duplicate */ }
```

❌ **Creating duplicate validation**:
```typescript
// DON'T create new email validation
function isValidEmail() { /* duplicate */ }
const emailRegex = /.../ /* duplicate */
```

❌ **Creating duplicate messaging**:
```typescript
// DON'T create inline SMS sending
twilioClient.messages.create() /* use MessageService */
```

❌ **Creating duplicate date formatting**:
```typescript
// DON'T create new date functions
function formatDate() { /* duplicate */ }
function parseDateTime() { /* duplicate */ }
```

## **Integrated Migration Workflow** 🆕

### Complete Workflow with Duplication Prevention

```bash
# Step 0: Check baseline duplications (5 min)
npm run utils:scan-duplicates

# Step 1: Analyze domain for migration planning (30 min)
npm run migration:analyze <domain-name>

# Step 2: Check cross-domain conflicts (15 min)
npm run migration:check-duplicates

# Step 3: Plan utility placement (10 min)
# Review analysis results and plan reuse strategy

# Step 4: Migrate routes using centralized utilities
# ... follow 6-step migration pattern ...

# Step 5: Verify no new duplicates after migration (2 min)
npm run utils:scan-duplicates

# Step 6: Compare before/after duplication counts
# Ensure duplicates decreased or stayed same
```

### Quality Gates

- ✅ **Before Migration**: Baseline duplication scan completed
- ✅ **During Migration**: Use existing utilities before creating new
- ✅ **After Migration**: No new duplicates introduced
- ✅ **Domain Complete**: Overall duplication reduced

## **Emergency Duplicate Check**

If unsure whether a utility exists:

```bash
# Quick search for existing utilities
grep -r "function functionName" src/lib/utils/
grep -r "export.*functionName" src/lib/utils/
```

## **Post-Migration Verification**

After migrating each route:

```bash
# Verify no duplicates were created
npm run utils:scan-duplicates

# Should show consistent or reduced duplication counts
```

After completing a domain:

```bash
# Comprehensive verification
npm run migration:check-duplicates
npm run utils:scan-duplicates

# Should show: ✅ No new duplicates found, reduced redundancy
```

## **Quick Decision Tree**

```
Need utility function?
├── Does it exist in src/lib/utils/index.ts? 
│   ├── YES → Import and use ✅
│   └── NO → Continue...
├── Is it needed by 2+ domains?
│   ├── YES → Create in shared utils ✅  
│   └── NO → Continue...
├── Is it domain-specific business logic?
│   ├── YES → Create in domain utils ✅
│   └── NO → Create in appropriate category ✅
```

---

**Remember**: When in doubt, check existing utilities first! The analysis tools will guide you to the right decision. 