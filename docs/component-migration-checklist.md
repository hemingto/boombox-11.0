# Component Migration Checklist - Folder-by-Folder Approach

## Overview

This checklist provides a systematic folder-by-folder approach for migrating React components from boombox-10.0 to boombox-11.0. Each folder will be processed completely before moving to the next, ensuring organized and thorough migration.

## Migration Strategy

### **Core Principles**
1. **Folder-by-folder migration** - Complete entire folders before moving to next
2. **No consolidation** - Refactor components in place, maintain existing structure
3. **Design system compliance** - Use established design tokens and colors
4. **Jest testing** - Create comprehensive tests for each component
5. **API route updates** - Map old API routes to new ones using migration tracking
6. **Business logic extraction** - Separate API calls into services, state management into hooks
7. **Clean component architecture** - Components focus purely on UI rendering and interactions
8. **No Storybook** - Skip Storybook files during migration
9. **🔥 CRITICAL: Check for redundancies** - Always verify existing utilities/hooks before creating new ones to prevent duplication

---

## Pre-Migration Setup

### **🚨 REDUNDANCY PREVENTION SYSTEM**

Before migrating any component, use this systematic approach:

#### **Pre-Migration Analysis** (Required for each folder):
```bash
# 1. Check current utility state before folder migration
npm run utils:scan-duplicates

# 2. Review existing utilities in relevant domains
# Check: src/lib/utils/[domain]Utils.ts files
# Check: src/lib/services/[domain]Service.ts files
# Check: src/hooks/use[Domain].ts custom hooks
```

#### **Migration Execution** (Per component):
- ✅ **Identify extractable functions**: Look for event handlers, validations, calculations, API calls
- ✅ **Check existing utilities FIRST**: Review `@/hooks/index.ts` and `@/lib/utils/index.ts` for existing functionality
- ✅ **Reuse before creating**: Only create new utilities if truly needed and not duplicating existing code
- ✅ **Organize properly**: 
  - React hooks (with state/effects) → `src/hooks/`
  - Pure functions (no React) → `src/lib/utils/`
  - API/external calls → `src/lib/services/`
- ✅ **Document new utilities**: Add @source comments and update exports
- ✅ **Verify no duplicates**: Run `npm run utils:scan-duplicates` after component migration

**📖 See Step 3g below for detailed extraction guidance and examples.**

---

## Folder Migration Process

### **5-Step Folder Migration Pattern**

#### **Step 1: Folder Analysis** ⏱️ 15-20 minutes
- [ ] List all components in the folder
- [ ] Identify component complexity and dependencies
- [ ] Check for API route usage and map to new routes using `boombox-11.0/api-routes-migration-tracking.md`
- [ ] Document any shared logic or utilities used
- [ ] Note design system compliance gaps

#### **Step 2: Create Target Structure** ⏱️ 10-15 minutes
- [ ] Map folder to appropriate `src/components/features/[domain]/` location
- [ ] Create folder structure in boombox-11.0
- [ ] Plan component organization within the domain

#### **Step 3: Component-by-Component Migration** ⏱️ 30-45 minutes per component
For each component in the folder:

##### **3a. Analyze Component**
- [ ] Examine source component: `boombox-10.0/src/app/components/[folder]/[ComponentName].tsx`
- [ ] Document props interface and functionality
- [ ] Identify API routes used and find new equivalents in migration tracking file
- [ ] Check for inline styles or non-design-system patterns

##### **3b. Create Migrated Component**
- [ ] Create new component: `src/components/features/[domain]/[ComponentName].tsx`
- [ ] **IMPORTANT**: Rename component file to PascalCase (e.g., `getquoteform.tsx` → `GetQuoteForm.tsx`)
- [ ] **CRITICAL**: Add comprehensive @fileoverview documentation:
  ```typescript
  /**
   * @fileoverview [Component description and functionality]
   * @source boombox-10.0/src/app/components/[folder]/[ComponentName].tsx
   * 
   * COMPONENT FUNCTIONALITY:
   * [Detailed description of what this component does]
   * 
   * API ROUTES UPDATED:
   * - Old: [old-api-route] → New: [new-api-route]
   * 
   * DESIGN SYSTEM UPDATES:
   * - [Changes made to align with design system colors]
   * 
   * @refactor [Description of structural changes made during migration]
   */
  ```

##### **3c. Apply Design System Colors**
- [ ] Replace custom colors with design system tokens from `tailwind.config.ts` and `src/app/globals.css`
- [ ] Update semantic color usage (primary, secondary, success, error, etc.)
- [ ] Use predefined utility classes (`.btn-primary`, `.badge-success`, `.input-field`, etc.) from `globals.css`
- [ ] Ensure consistent hover/focus states using design system colors
- [ ] Replace hardcoded color values with semantic color tokens

##### **3d. Substitute Primitive Components**
- [ ] Replace custom modals with `@/components/ui/primitives/Modal`
- [ ] Replace custom loading states with `@/components/ui/primitives/Spinner` or `LoadingOverlay`
- [ ] **Replace ALL placeholder divs with `@/components/ui/primitives/OptimizedImage`** (see Image Optimization Pattern below)

##### **3e. Replace Placeholder Divs with OptimizedImage (CRITICAL)**

**🚨 MANDATORY: All `bg-slate-*` placeholder divs MUST be replaced with OptimizedImage component**

###### **Identification:**
- [ ] Scan component for divs with `bg-slate-100`, `bg-slate-200`, `bg-gray-100`, or similar
- [ ] Check for divs with `aspect-square`, `aspect-video`, or other aspect ratio classes
- [ ] Look for comments like "TODO: Replace with image" or "placeholder"

###### **Replacement Pattern:**
```tsx
// ❌ OLD: Placeholder div
<div className="bg-slate-100 aspect-square w-full rounded-md"></div>

// ✅ NEW: OptimizedImage component
import { OptimizedImage } from '@/components/ui/primitives/OptimizedImage/OptimizedImage';

<OptimizedImage
  src="/placeholder.jpg"  // or actual image path
  alt="Descriptive alt text"
  width={500}
  height={500}
  aspectRatio="square"
  containerClassName="w-full rounded-md"
  className="object-cover rounded-md"
  loading="lazy"
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

###### **Configuration Guide:**
- **Above the fold** (hero, top section): `loading="eager"`, `priority={true}`, `quality={90}`
- **Below the fold** (content): `loading="lazy"`, `quality={85}`
- **Thumbnails/cards**: `loading="lazy"`, `quality={80}`, add responsive `sizes`
- **Aspect ratios**: `square` (1:1), `video` (16:9), `portrait` (3:4), `landscape` (4:3), `wide` (21:9)

###### **Alt Text Best Practices:**
- [ ] Write descriptive alt text (10-15 words)
- [ ] Include context about what the image shows
- [ ] Don't start with "Image of..." or "Picture of..."
- [ ] Example: ✅ "Boombox storage service - convenient mobile storage solution"
- [ ] Example: ❌ "Image" or "Placeholder"

###### **Test Updates Required:**
- [ ] Change test from `expect(div).toHaveClass('bg-slate-100')` to `expect(img).toHaveAttribute('src')`
- [ ] Update accessibility tests to check `img` role instead of `div` with `role="img"`
- [ ] Verify alt text in tests: `expect(image).toHaveAttribute('alt', 'description')`

##### **3f. Update API Routes**
- [ ] Find old API routes in component code
- [ ] Look up new API route paths in `boombox-11.0/api-routes-migration-tracking.md`
- [ ] Update all API calls to use new route paths
- [ ] Verify request/response formats match new API structure

##### **3g. Ensure ARIA Accessibility Standards**
- [ ] Add proper ARIA labels (`aria-label`, `aria-labelledby`, `aria-describedby`)
- [ ] Ensure interactive elements have appropriate roles (`button`, `link`, `dialog`, etc.)
- [ ] Add keyboard navigation support (focus management, tab order)
- [ ] Include semantic HTML elements where appropriate (`nav`, `main`, `section`, `article`)
- [ ] Verify color contrast meets WCAG 2.1 AA standards (4.5:1 for normal text)
- [ ] Add focus indicators for keyboard navigation
- [ ] Include screen reader announcements for dynamic content changes
- [ ] Test with keyboard-only navigation

##### **3h. Extract Business Logic & Check for Redundancies (CRITICAL)**

**🚨 REDUNDANCY PREVENTION IS MANDATORY - This prevents creating duplicate utilities that already exist elsewhere in the codebase.**

###### **Pre-Extraction Analysis** (Do this FIRST):
- [ ] **Scan for existing similar functionality**:
  ```bash
  # Check existing hooks
  ls src/hooks/ | grep -i [keyword]
  
  # Check existing utilities
  ls src/lib/utils/ | grep -i [keyword]
  
  # Search for similar patterns in codebase
  grep -r "functionName" src/hooks/ src/lib/utils/
  ```

- [ ] **Identify functions to extract** - Look for these patterns in the component:
  - [ ] Event handlers that don't use component state (e.g., `handleClickOutside`, `handleKeyDown`)
  - [ ] Data transformations (e.g., `formatDate`, `parseAddress`, `calculateTotal`)
  - [ ] Validation logic (e.g., `validateEmail`, `validatePhone`)
  - [ ] API calls or fetch operations
  - [ ] Complex calculations or business rules
  - [ ] Browser API interactions (e.g., localStorage, clipboard)
  - [ ] Reusable state management patterns

- [ ] **Categorize functions** - Determine where each function belongs:
  - **Custom Hook** (`src/hooks/`) - If it:
    - Uses React hooks (useState, useEffect, useRef, etc.)
    - Manages component lifecycle or side effects
    - Provides reusable stateful logic
    - Examples: `useClickOutside`, `useFormValidation`, `useDebounce`
  
  - **Utility Function** (`src/lib/utils/`) - If it:
    - Is a pure function with no React dependencies
    - Performs data transformation or formatting
    - Contains business logic calculations
    - Examples: `formatCurrency`, `parseAddress`, `validateEmail`
  
  - **Service Class** (`src/lib/services/`) - If it:
    - Makes API calls or external requests
    - Interacts with third-party services
    - Handles data persistence
    - Examples: `MessageService`, `OnfleetService`, `StripeService`

###### **Check Existing Utilities** (MANDATORY):
- [ ] **Review existing hooks** in `src/hooks/index.ts` for similar functionality
- [ ] **Review existing utilities** in `src/lib/utils/index.ts` for similar patterns
- [ ] **Common patterns that already exist** (DO NOT recreate):
  - `useClickOutside` - Click outside detection (13+ components use this)
  - `useNameInput` - Name input validation
  - `useEmailInput` - Email validation
  - `usePhotoUpload` - File upload handling
  - `formatCurrency` - Currency formatting in `currencyUtils.ts`
  - `formatPhoneNumber` - Phone formatting in `phoneUtils.ts`
  - `validateEmail` - Email validation in `validationUtils.ts`

###### **Extract Functions** (Only if not found above):
- [ ] **Separate API calls**: Extract all API calls to dedicated service classes in `src/lib/services/`
- [ ] **Create custom hooks**: Move complex state management and business logic to custom hooks in `src/hooks/`
- [ ] **Extract utilities**: Move pure functions to domain-specific utils in `src/lib/utils/`
- [ ] **Component focus**: Ensure component only handles UI rendering and user interactions
- [ ] **Verify separation**: Component should not contain fetch calls, business logic, or complex calculations

###### **Post-Extraction Verification**:
- [ ] **Run redundancy scanner**: `npm run utils:scan-duplicates`
- [ ] **Update exports**: Add new utilities/hooks to appropriate `index.ts` files
- [ ] **Create tests**: Write tests for extracted utilities/hooks in `tests/hooks/` or `tests/utils/`
- [ ] **Document extraction**: Add `@source` comments linking back to original component
- [ ] **Verify component works**: Run component tests to ensure extraction didn't break functionality

###### **Example Extraction Patterns**:

```typescript
// ❌ BAD: Utility function in component
function MyComponent() {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // ... click outside logic
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // ... component logic
}

// ✅ GOOD: Import from centralized utilities
import { formatCurrency } from '@/lib/utils/currencyUtils';
import { useClickOutside } from '@/hooks/useClickOutside';

function MyComponent() {
  const ref = useRef<HTMLDivElement>(null);
  
  useClickOutside(ref, () => {
    // Handle click outside
  });
  
  // ... component logic using formatCurrency()
}
```

#### **Step 4: Create Jest Tests** ⏱️ 20-30 minutes per component
- [ ] Create test file: `tests/components/[ComponentName].test.tsx`
- [ ] Write comprehensive component unit tests
- [ ] Test all props and state variations
- [ ] Test user interactions and event handlers
- [ ] Test API integration (mock API calls)
- [ ] Ensure good test coverage
- [ ] Verify tests pass: `npm run test:components`

#### **Step 5: Update Exports and Verify** ⏱️ 10-15 minutes
- [ ] Update exports in `src/components/features/[domain]/index.ts`
- [ ] Update main export in `src/components/index.ts`
- [ ] Run final redundancy check: `npm run utils:scan-duplicates`
- [ ] Verify no linting errors
- [ ] Test component functionality in development environment

---

## Design System Color Guidelines

### **Design System Location**
The design system is defined in:
- **`tailwind.config.ts`** - Color tokens, semantic aliases, animations, spacing
- **`src/app/globals.css`** - Component utility classes, CSS custom properties

### **Color Token Usage**
Replace all hardcoded colors with design system tokens:

```typescript
// ❌ Old approach
className="bg-blue-500 text-white hover:bg-blue-600"

// ✅ New approach - use design system colors
className="bg-primary text-text-inverse hover:bg-primary-hover"

// ✅ Even better - use utility classes from globals.css
className="btn-primary"
```

### **Available Utility Classes** (from `globals.css`)
- **Buttons**: `.btn-primary`, `.btn-secondary`, `.btn-destructive`
- **Badges**: `.badge-success`, `.badge-warning`, `.badge-error`, `.badge-info`, `.badge-pending`, `.badge-processing`
- **Forms**: `.input-field`, `.input-field--error`, `.form-group`, `.form-label`, `.form-error`
- **Cards**: `.card`, `.card-elevated`
- **Skeletons**: `.skeleton`, `.skeleton-text`, `.skeleton-title`, `.skeleton-avatar`

### **Semantic Color Categories** (from `tailwind.config.ts`)
- **Primary**: `bg-primary`, `text-primary` - Main brand colors (zinc-950)
- **Status**: `bg-status-success`, `bg-status-error`, etc. - Status indicators
- **Surface**: `bg-surface-primary`, `bg-surface-secondary` - Background layers  
- **Text**: `text-text-primary`, `text-text-secondary` - Text hierarchy
- **Border**: `border-border`, `border-border-focus` - Border styles

---

## Quality Standards & Completion Criteria

### **Folder Completion Checklist**
- [ ] **All components migrated**: Every component in folder has been migrated
- [ ] **API routes updated**: All API calls use new route paths from migration tracking
- [ ] **Design system compliance**: All colors use design system tokens
- [ ] **Primitive substitution**: Appropriate UI primitives used where applicable
- [ ] **Jest tests created**: Comprehensive tests for all components
- [ ] **Business logic extracted**: No duplicate utilities created
- [ ] **Documentation complete**: All components have @fileoverview documentation
- [ ] **Exports updated**: All components properly exported
- [ ] **No redundancy**: `npm run utils:scan-duplicates` passes clean

### **Component Quality Standards**
- [ ] **Functional Compatibility**: 99.9% preserved functionality
- [ ] **File Naming**: Component files use PascalCase naming convention
- [ ] **Type Safety**: Comprehensive TypeScript interfaces
- [ ] **Performance**: Proper loading states and error handling
- [ ] **Accessibility**: WCAG 2.1 AA compliance with proper ARIA labels and keyboard navigation
- [ ] **Source Documentation**: Comprehensive @fileoverview comments
- [ ] **Business Logic Separation**: API calls in services, state management in hooks, components focus on UI
- [ ] **Clean Architecture**: No fetch calls or complex business logic in component files
- [ ] **Utility Extraction**: All reusable functions extracted to hooks or utils (not in component file)
- [ ] **No Redundancy**: Verified no duplicate utilities created - checked existing hooks/utils first
- [ ] **Proper Organization**: Functions are in correct location (hooks vs utils vs services)

---

## Migration Tracking Template

### **Folder Migration Status**
```markdown
## Folder Migration: [FOLDER_NAME]

### Pre-Migration Analysis
- [ ] Components inventoried: [count] components
- [ ] API routes identified: [list of routes used]
- [ ] Complexity assessment: [simple/medium/complex]
- [ ] Target domain identified: [features/domain]

### Migration Progress
- [ ] **Step 1**: Folder analysis complete
- [ ] **Step 2**: Target structure created
- [ ] **Step 3**: Components migrated ([x]/[total])
  - [ ] [ComponentName1] - API routes updated, accessibility verified, utilities extracted, tests created
  - [ ] [ComponentName2] - API routes updated, accessibility verified, utilities extracted, tests created
- [ ] **Step 4**: Jest tests created for all components
- [ ] **Step 5**: Exports updated and verified

### Validation Checklist
- [ ] All API routes updated using migration tracking file
- [ ] Design system colors applied throughout
- [ ] Primitive components substituted where applicable
- [ ] **Utility extraction verified**: All reusable functions moved to hooks/utils/services
- [ ] **No redundant utilities**: Checked existing hooks/utils before creating new ones
- [ ] Business logic extracted without creating duplicates
- [ ] Jest tests passing for all components (`npm run test:components`)
- [ ] No duplicate utilities created (`npm run utils:scan-duplicates`)
- [ ] All components documented with @fileoverview
- [ ] Component files contain ONLY UI logic (no utility functions, API calls, or complex calculations)
```

---

## Tools and Commands

### **Essential Commands**
```bash
# Check for duplicate utilities (CRITICAL)
npm run utils:scan-duplicates

# Run Jest component tests
npm run test:components

# Check for linting errors
npm run lint

# Check API route migration tracking
# Reference: boombox-11.0/api-routes-migration-tracking.md
```

### **File Structure Pattern**
Each component migration creates/modifies:
1. `src/components/features/[domain]/[ComponentName].tsx` - Migrated component (**PascalCase filename**)
2. `tests/components/[ComponentName].test.tsx` - Jest component tests (**PascalCase filename**)
3. `src/components/features/[domain]/index.ts` - Updated exports
4. `src/components/index.ts` - Updated main exports

**Naming Convention**: All component files must use PascalCase naming:
- `getquoteform.tsx` → `GetQuoteForm.tsx`
- `drivertips.tsx` → `DriverTips.tsx`
- `confirmappointment.tsx` → `ConfirmAppointment.tsx`

---

## Getting Started

1. **Complete entire folders before moving to next phase**
2. **Follow the 5-step folder migration pattern**
3. **Use the API routes migration tracking file for all API updates**
4. **Apply design system colors consistently**
5. **Create comprehensive Jest tests for each component**
6. **Prevent utility duplication through systematic checking**

**Remember**: We're doing folder-by-folder migration with no consolidation, focusing on refactoring in place while maintaining the existing component structure and ensuring full design system compliance.