# Boombox 11.0 - Clean Slate Refactoring PRD

## Product Requirements Document

**Version:** 1.0  
**Date:** 2025-01-28  
**Status:** Planning Phase  
**Target:** Clean refactor from boombox-10.0 to boombox-11.0

---

## 1. Executive Summary

### Objective

Refactor the entire boombox-10.0 codebase into a clean, modern boombox-11.0 structure while maintaining 99.9% functional compatibility. Focus on code organization, efficiency, maintainability, and readability.

### Strategy

- **Clean Slate Approach**: Build boombox-11.0 from scratch copying/refactoring code systematically
- **Atomic Tasks**: Break down work into 2-4 hour chunks for maximum AI assistance
- **Git-Based Safety**: Use git commits as primary safety mechanism (no complex backup systems)
- **Progressive Migration**: Complete one domain at a time, validate, then move to next

### Key Principles

1. **Preserve Functionality**: 99.9% functional compatibility required (if a change is a much better option, and makes the code more efficient, make your case and we will make a decision together)
2. **Modernize Structure**: Follow Next.js 15+ App Router best practices
3. **Maintain Dependencies**: Keep Onfleet, Stripe, Prisma, NextAuth exactly as-is
4. **Upgrade Safely**: Latest stable versions only if no functionality changes
5. **Design System**: Create organized Tailwind patterns and reusable components
6. **Efficiency Improvements**: Implement centralized systems (e.g., messaging templates) that improve maintainability without changing functionality
7. **Industry Standard Naming**: Follow Next.js and React best practices for file naming, with clear traceability from boombox-10.0 sources
8. **SEO & Accessibility First**: All refactored code must meet WCAG 2.1 AA standards and implement proper SEO practices
9. **Performance Optimization**: Target Core Web Vitals standards (LCP < 2.5s, FID < 100ms, CLS < 0.1) and optimize bundle size
10. **Image Optimization**: Replace ALL bg-slate placeholder divs with proper Next.js Image components for better performance, SEO, and accessibility
11. **Routing Optimization**: Replace complex client-side routing logic with industry-standard Next.js App Router patterns, eliminate unnecessary redirects, and implement proper route group organization

---

## 2. Current State Analysis

### Boombox-10.0 Architecture

- **Framework**: Next.js 15.3.1 with App Router
- **Database**: PostgreSQL with Prisma ORM (shared with 11.0)
- **Authentication**: NextAuth.js
- **Payments**: Stripe with Connect (DO NOT CHANGE)
- **Logistics**: Onfleet integration (DO NOT CHANGE)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

### Key Business Domains

1. **Authentication & User Management**
2. **Storage Services** (mobile storage units)
3. **Packing Supplies** (Onfleet delivery)
4. **Driver/Mover Management**
5. **Payment Processing** (Stripe)
6. **Admin Operations**
7. **Customer Portal**

### Issues to Resolve

- Components mixed in app directory (181 API routes need organization)
- Inconsistent file organization patterns
- Missing centralized type definitions
- No established component library patterns
- Limited testing infrastructure
- **Large bg-slate placeholder divs** throughout the codebase that should be replaced with optimized Next.js Image components (ask if unsure if the div is an image placeholder or not)
- **Complex admin routing logic** with string-parsing, client-side redirects, and duplicated routing patterns that violate Next.js best practices

---

## 3. Target Architecture

### Boombox-11.0 Structure

```
boombox-11.0/
├── src/
│   ├── app/                     # Next.js App Router (pages & API only)
│   │   ├── (public)/           # Public pages route group
│   │   ├── (auth)/             # Auth pages route group
│   │   ├── (dashboard)/        # Dashboard pages route group
│   │   ├── api/                # API routes organized by domain
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/              # All React components
│   │   ├── ui/                 # Design system components
│   │   ├── forms/              # Form components
│   │   ├── layouts/            # Layout components
│   │   ├── features/           # Business domain components
│   │   └── icons/              # Icon components
│   ├── lib/                    # Utilities & configurations
│   │   ├── auth/               # NextAuth config
│   │   ├── database/           # Prisma client & utilities
│   │   ├── integrations/       # External API clients
│   │   ├── messaging/          # Centralized messaging system
│   │   ├── utils/              # Utility functions
│   │   └── validations/        # Zod schemas
│   ├── hooks/                  # Custom React hooks
│   ├── types/                  # TypeScript definitions
│   ├── styles/                 # Design system & CSS
│   └── constants/              # App constants
├── tests/                      # Testing infrastructure
├── docs/                       # Documentation
│   ├── api/                   # Internal API documentation
│   ├── components/            # Component documentation
│   ├── external-api-docs/     # Third-party API documentation
│   └── workflows/             # Business workflow documentation
└── tools/                      # Development tools
```

---

## 4. Naming Conventions & File Mapping

### File Naming Standards

#### Component Files

- **Format**: PascalCase with descriptive, functional names
- **Pattern**: `{Domain}{Component}{Type}.tsx`
- **Examples**:
  ```
  ✅ UserAuthForm.tsx          (vs generic LoginForm.tsx)
  ✅ PackingSupplyOrderCard.tsx (vs generic OrderCard.tsx)
  ✅ OnfleetTaskStatus.tsx     (vs generic TaskStatus.tsx)
  ✅ StripePaymentForm.tsx     (vs generic PaymentForm.tsx)
  ```

#### Page Files (Next.js App Router)

- **Route Pages**: Always `page.tsx`
- **Layouts**: Always `layout.tsx`
- **Loading States**: Always `loading.tsx`
- **Error Boundaries**: Always `error.tsx`
- **Not Found**: Always `not-found.tsx`

#### API Route Files

- **Format**: `route.ts` (Next.js App Router standard)
- **Directory**: Descriptive kebab-case
- **Examples**:
  ```
  src/app/api/auth/login/route.ts
  src/app/api/payments/stripe-webhook/route.ts
  src/app/api/logistics/onfleet-webhook/route.ts
  src/app/api/customers/booking-request/route.ts
  ```

#### Utility and Service Files

- **Format**: camelCase with clear purpose
- **Pattern**: `{domain}{Purpose}.ts`
- **Examples**:
  ```
  ✅ onfleetApiClient.ts       (vs generic apiClient.ts)
  ✅ stripePaymentService.ts   (vs generic paymentService.ts)
  ✅ messageTemplateEngine.ts  (vs generic templateEngine.ts)
  ✅ customerValidationUtils.ts (vs generic validationUtils.ts)
  ```

#### Type Definition Files

- **Format**: Domain-based with clear scope
- **Pattern**: `{domain}.types.ts` or `{feature}.types.ts`
- **Examples**:
  ```
  ✅ onfleet.types.ts         (Onfleet API types)
  ✅ stripe.types.ts          (Stripe integration types)
  ✅ booking.types.ts         (Booking/appointment types)
  ✅ messaging.types.ts       (Message template types)
  ```

### File Mapping from Boombox-10.0

Each refactored file must document its source(s) using this format:

```typescript
/**
 * @fileoverview User authentication form component
 * @source boombox-10.0/src/app/components/login/LoginForm.tsx
 * @source boombox-10.0/src/app/components/signup/SignupForm.tsx (consolidated)
 * @refactor Consolidated login/signup into unified auth form with variants
 */
```

#### Common Consolidation Patterns

```typescript
// Single file refactor
/**
 * @fileoverview Onfleet task management service
 * @source boombox-10.0/src/app/api/onfleet/tasks/route.ts
 * @refactor Moved to domain-based API structure
 */

// Multiple file consolidation
/**
 * @fileoverview Centralized messaging service
 * @source boombox-10.0/src/lib/twilio.ts
 * @source boombox-10.0/src/lib/sendgrid.ts
 * @source boombox-10.0/src/app/api/send-email/route.ts
 * @refactor Consolidated messaging into template-based system
 */

// Component extraction
/**
 * @fileoverview Reusable button component
 * @source boombox-10.0/src/app/components/reusablecomponents/Button.tsx
 * @source boombox-10.0/src/app/components/admin/AdminButton.tsx (patterns)
 * @refactor Extracted into design system with consistent variants
 */
```

### Directory Naming Standards

#### Route Groups

```
src/app/
├── (public)/           # Public marketing pages
├── (auth)/             # Authentication pages
└── (dashboard)/        # Protected dashboard pages
```

#### API Organization

```
src/app/api/
├── auth/               # Authentication endpoints
├── payments/           # Stripe payment processing
├── orders/             # Appointments, packing supply orders
├── onfleet/            # Onfleet integration, tasks, webhooks
├── drivers/            # Driver management, availability
├── moving-partners/    # Moving partner operations
├── customers/          # Customer management, profiles
├── admin/              # Admin operations, reporting
└── webhooks/           # External webhook handlers (non-Onfleet)
```

#### Component Organization

```
src/components/
├── ui/                 # Design system components
│   ├── forms/         # Form-specific UI
│   ├── navigation/    # Navigation components
│   └── feedback/      # Alerts, toasts, modals
├── features/          # Business domain components
│   ├── auth/          # Authentication components
│   ├── orders/        # Booking/appointment, packing supply components
│   ├── payments/      # Payment form components
│   ├── onfleet/       # Onfleet integration components
│   ├── drivers/       # Driver management components
│   ├── moving-partners/ # Moving partner components
│   ├── customers/     # Customer management components
│   └── admin/         # Admin dashboard components
└── layouts/           # Page layout components
```

### Functional Naming Principles

1. **Descriptive over Generic**: `OnfleetTaskCard` vs `TaskCard`
2. **Domain Prefix**: Include business domain when relevant
3. **Action-Oriented**: `CreateBookingForm` vs `BookingForm`
4. **Consistent Patterns**: Use same suffixes (`Service`, `Utils`, `Types`)
5. **Avoid Abbreviations**: `customer` not `cust`, `appointment` not `appt`

### Migration Documentation Template

For each major refactoring task, create a mapping file:

```markdown
# TASK_NAME - File Mapping

## New Files Created

- `src/components/ui/Button.tsx` ← `boombox-10.0/src/app/components/reusablecomponents/Button.tsx`
- `src/lib/messaging/MessageService.ts` ← Consolidated from multiple files

## Files Consolidated

### MessageService.ts

- **Sources**:
  - `boombox-10.0/src/lib/twilio.ts`
  - `boombox-10.0/src/lib/sendgrid.ts`
  - `boombox-10.0/src/app/api/send-email/route.ts`
- **Reason**: Centralized messaging with template system

## Files Renamed

- `boombox-10.0/src/app/components/admin/UserManagement.tsx` → `src/components/features/admin/AdminUserManagement.tsx`
- **Reason**: Added domain prefix for clarity
```

---

## 5. Implementation Phases

## Phase 1: Foundation Setup (Week 1) - [3/6 tasks completed]

**Status**: In Progress  
**Progress**: █████░░░░░ 50% (3/6 tasks completed)  
**Goal**: Establish clean project structure and core infrastructure

### SETUP_001_PROJECT_INITIALIZATION ✅ COMPLETED

**Completed**: 2025-01-28 by AI Assistant  
**Time Taken**: 2.5 hours (vs 3 hours estimated)  
**Git Commit**: bc0d710 - "SETUP_001: Complete project initialization"  
**Notes**: Successfully removed flagged packages, upgraded dependencies to latest stable versions, configured Tailwind v3 for compatibility with boombox-10.0 custom configuration

- [x] Initialize Next.js 15+ project in boombox-11.0
- [x] **Package Audit & Optimization**:
  - Scanned boombox-10.0 package.json for potentially unused dependencies
  - Used manual analysis to identify unused packages
  - Flagged packages that were candidates for removal (mini-css-extract-plugin, @types/uuid, etc.)
  - Created list of flagged packages with usage analysis for human review
  - **CRITICAL**: Did NOT remove any packages without explicit human approval
  - **PRESERVED**: Kept all Onfleet, Stripe, Prisma, NextAuth, Twilio, SendGrid packages
- [x] Copy package.json dependencies (upgrade to latest stable, exclude human-approved removals)
- [x] Set up TypeScript configuration
- [x] Configure Tailwind CSS
- [x] Copy environment variables

### SETUP_002_DIRECTORY_STRUCTURE ✅ COMPLETED

**Completed**: 2025-01-28 by AI Assistant  
**Time Taken**: 2 hours (vs 1 hour estimated)  
**Git Commit**: 396ff2e - "SETUP_002: Complete directory structure with index.ts files"  
**Notes**: Successfully created complete directory structure following PRD architecture with all business domains organized, route groups implemented, and absolute imports configured. Fixed file placement issue where index.ts files were initially created outside boombox-11.0 directory.

- [x] Create complete directory structure
- [x] Add index.ts files for clean imports
- [x] Set up absolute import paths (@/)
- [x] Configure path mapping in tsconfig.json

### SETUP_003_CORE_CONFIGS ✅ COMPLETED

**Completed**: 2025-01-28 by AI Assistant  
**Time Taken**: 2 hours (vs 2 hours estimated)  
**Git Commit**: 4ce528c - "SETUP_003: Complete core configurations"  
**Notes**: Successfully configured all core development tools. Updated Next.js config with Onfleet integration settings, added Prettier with formatting standards, copied complete Prisma schema and migrations, and set up Jest for testing. All configurations tested and working correctly.

- [x] Copy and update next.config.mjs
- [x] Set up ESLint configuration
- [x] Configure Prettier
- [x] Copy Prisma schema (no changes)
- [x] Set up jest configuration

### SETUP_004_GIT_WORKFLOW

**Automation Level**: High | **Time**: 1 hour

- [ ] Initialize git repository
- [ ] Create .gitignore
- [ ] Set up basic pre-commit hooks
- [ ] Create initial commit structure

### SETUP_005_FILE_MAPPING_AUDIT

**Automation Level**: Medium | **Time**: 2 hours

- [ ] Create comprehensive file inventory of boombox-10.0
- [ ] Map current files to planned boombox-11.0 structure
- [ ] Identify consolidation opportunities (e.g., messaging, auth components)
- [ ] Document naming convention changes
- [ ] Create file mapping template for each refactoring task

### SETUP_006_PROJECT_README

**Automation Level**: High | **Time**: 1 hour

- [ ] Create comprehensive root README.md
- [ ] Document project overview and architecture
- [ ] Add setup and development instructions
- [ ] Include environment variable documentation
- [ ] Add deployment and testing guidelines
- [ ] Document key integrations (Onfleet, Stripe, etc.)

## Phase 2: Type System & Utilities (Week 1-2) - [0/4 tasks completed]

**Status**: Not Started  
**Progress**: ░░░░░░░░░░ 0% (0/4 tasks completed)  
**Goal**: Establish type-safe foundation before component migration

### TYPES_001_CORE_TYPES

**Automation Level**: High | **Time**: 3 hours

- [ ] Extract all type definitions from boombox-10.0
- [ ] Organize into domain-based type files
- [ ] Create enhanced Prisma types
- [ ] Set up Zod validation schemas

### TYPES_002_API_TYPES

**Automation Level**: Medium | **Time**: 3 hours

- [ ] Define standardized API response types
- [ ] Create request/response interfaces for all endpoints
- [ ] Add validation schemas for API inputs
- [ ] Set up error handling types

### UTILS_001_CORE_UTILITIES

**Automation Level**: High | **Time**: 2 hours

- [ ] Copy and organize utility functions
- [ ] Create date/time utilities
- [ ] Set up formatting utilities
- [ ] Add validation utilities

### UTILS_002_INTEGRATION_CLIENTS

**Automation Level**: Medium | **Time**: 4 hours

- [ ] Copy Onfleet integration (NO CHANGES)
- [ ] Copy Stripe integration (NO CHANGES)
- [ ] Copy Prisma database client
- [ ] Copy NextAuth configuration
- [ ] Add proper error handling

### UTILS_003_MESSAGING_SYSTEM

**Automation Level**: Medium | **Time**: 3 hours

- [ ] Create centralized messaging template system
- [ ] Extract all Twilio/SendGrid message content into templates
- [ ] Build MessageService for multi-channel communication
- [ ] Organize templates by business domain (auth, booking, logistics, payment, admin)
- [ ] Add template variable validation and rendering engine
- [ ] Update all message sending to use centralized system

## Phase 3: Design System & UI Components (Week 2) - [0/5 tasks completed]

**Status**: Not Started  
**Progress**: ░░░░░░░░░░ 0% (0/5 tasks completed)  
**Goal**: Create reusable component library following design patterns

### UI_001_DESIGN_TOKENS

**Automation Level**: Medium | **Time**: 3 hours

- [ ] Audit existing Tailwind usage patterns
- [ ] Define design tokens (colors, spacing, typography)
- [ ] Create CSS custom properties
- [ ] Set up component utility classes

### UI_002_BASE_COMPONENTS

**Automation Level**: Medium | **Time**: 4 hours

- [ ] Create Button component with variants
- [ ] Create Input/TextArea/Select components
- [ ] Create Modal/Dialog components
- [ ] Create Loading/Spinner components
- [ ] Add proper TypeScript interfaces

### UI_003_LAYOUT_COMPONENTS

**Automation Level**: Medium | **Time**: 3 hours

- [ ] Create Header/Footer components
- [ ] Create Navigation components
- [ ] Create Page layout components
- [ ] Create Container/Grid components

### UI_004_FORM_COMPONENTS

**Automation Level**: Medium | **Time**: 3 hours

- [ ] Create FormField wrapper component
- [ ] Create form validation patterns
- [ ] Set up React Hook Form integration
- [ ] Create error display components

### UI_005_SEO_ACCESSIBILITY_OPTIMIZATION

**Automation Level**: Medium | **Time**: 4 hours

- [ ] **SEO Foundation**:
  - Implement Next.js Metadata API for all page templates
  - Create SEO utility functions for dynamic meta tags
  - Add structured data (JSON-LD) schemas for business, reviews, services
  - Ensure proper heading hierarchy in all layouts
- [ ] **Accessibility Foundation**:
  - Add ARIA landmarks to all layout components
  - Implement focus management patterns
  - Create accessible form validation messages
  - Add keyboard navigation support to all interactive components
  - Ensure color contrast compliance in design tokens
- [ ] **Performance Foundation**:
  - Set up Next.js Image component with optimized defaults
  - Create dynamic import patterns for heavy components
  - Implement font optimization with next/font
  - Add bundle analyzer for monitoring
- [ ] **Image Placeholder Replacement** (CRITICAL for Performance):
  - **Replace ALL bg-slate placeholder divs** with proper Next.js Image components
  - Target components: techenabledsection, whatfitssection, customerreviewsection, howitworksstepsection, etc.
  - Use proper alt text, sizing, and lazy loading
  - Implement proper loading states with Next.js Image placeholder system
  - Maintain skeleton loading for data-driven content only
- [ ] **Testing Setup**:
  - Configure accessibility testing with @axe-core/react
  - Set up Lighthouse CI for performance monitoring
  - Create accessibility testing checklist

## Phase 4: API Layer Migration (Week 3) - [0/8 tasks completed]

**Status**: Not Started  
**Progress**: ░░░░░░░░░░ 0% (0/8 tasks completed)  
**Goal**: Migrate and organize all API routes by business domain

### API_001_AUTH_DOMAIN

**Automation Level**: High | **Time**: 3 hours

- [ ] Copy authentication API routes
- [ ] Add comprehensive route documentation comments to each file:
  - Brief description of route functionality
  - List of boombox-10.0 files/components that use this route
  - Source file path from boombox-10.0
- [ ] Organize in /api/auth/ structure
- [ ] Add input validation with Zod
- [ ] Standardize response formats
- [ ] Test all auth endpoints

### API_002_PAYMENT_DOMAIN

**Automation Level**: Medium | **Time**: 4 hours

- [ ] Copy Stripe payment routes (NO LOGIC CHANGES)
- [ ] Add comprehensive route documentation comments to each file:
  - Brief description of route functionality
  - List of boombox-10.0 files/components that use this route
  - Source file path from boombox-10.0
- [ ] Organize in /api/payments/ structure
- [ ] Add proper error handling
- [ ] Validate webhook endpoints
- [ ] Test payment flows

### API_003_ORDERS_DOMAIN

**Automation Level**: Medium | **Time**: 4 hours

- [ ] Copy appointment/booking creation routes
- [ ] Copy packing supply order management routes
- [ ] Add comprehensive route documentation comments to each file:
  - Brief description of route functionality
  - List of boombox-10.0 files/components that use this route
  - Source file path from boombox-10.0
- [ ] Organize in /api/orders/ structure
- [ ] Copy storage unit management APIs
- [ ] Test order creation and management workflows

### API_004_ONFLEET_DOMAIN

**Automation Level**: Medium | **Time**: 3 hours

- [ ] Copy Onfleet integration routes (NO LOGIC CHANGES)
- [ ] Copy Onfleet webhook handlers (NO LOGIC CHANGES)
- [ ] Add comprehensive route documentation comments to each file:
  - Brief description of route functionality
  - List of boombox-10.0 files/components that use this route
  - Source file path from boombox-10.0
- [ ] Organize in /api/onfleet/ structure
- [ ] Test Onfleet webhooks and task management

### API_005_DRIVERS_DOMAIN

**Automation Level**: High | **Time**: 3 hours

- [ ] Copy driver management APIs
- [ ] Copy driver availability and scheduling routes
- [ ] Copy driver assignment logic routes
- [ ] Add comprehensive route documentation comments to each file:
  - Brief description of route functionality
  - List of boombox-10.0 files/components that use this route
  - Source file path from boombox-10.0
- [ ] Organize in /api/drivers/ structure
- [ ] Test driver workflows

### API_006_MOVING_PARTNERS_DOMAIN

**Automation Level**: High | **Time**: 3 hours

- [ ] Copy moving partner management APIs
- [ ] Copy moving partner assignment routes
- [ ] Copy third-party moving partner integration routes
- [ ] Add comprehensive route documentation comments to each file:
  - Brief description of route functionality
  - List of boombox-10.0 files/components that use this route
  - Source file path from boombox-10.0
- [ ] Organize in /api/moving-partners/ structure
- [ ] Test moving partner workflows

### API_007_CUSTOMER_DOMAIN

**Automation Level**: High | **Time**: 3 hours

- [ ] Copy customer management APIs
- [ ] Copy customer profile management routes
- [ ] Add comprehensive route documentation comments to each file:
  - Brief description of route functionality
  - List of boombox-10.0 files/components that use this route
  - Source file path from boombox-10.0
- [ ] Organize in /api/customers/ structure
- [ ] Add proper validation
- [ ] Test customer workflows

### API_008_ADMIN_DOMAIN

**Automation Level**: High | **Time**: 3 hours

- [ ] Copy admin dashboard APIs
- [ ] Copy reporting APIs
- [ ] Add comprehensive route documentation comments to each file:
  - Brief description of route functionality
  - List of boombox-10.0 files/components that use this route
  - Source file path from boombox-10.0
- [ ] Organize in /api/admin/ structure
- [ ] Add proper authorization checks
- [ ] Test admin functions

## Phase 5: Feature Components Migration (Week 4) - [0/7 tasks completed]

**Status**: Not Started  
**Progress**: ░░░░░░░░░░ 0% (0/7 tasks completed)  
**Goal**: Migrate business logic components organized by domain

### FEATURES_001_AUTH_COMPONENTS

**Automation Level**: Medium | **Time**: 4 hours

- [ ] Copy login/signup components
- [ ] Copy password reset components
- [ ] Update to use new UI components
- [ ] **Replace bg-slate placeholder divs** with Next.js Image components where applicable
- [ ] Migrate to /components/features/auth/
- [ ] Test authentication flows

### FEATURES_002_DASHBOARD_COMPONENTS

**Automation Level**: Medium | **Time**: 4 hours

- [ ] Copy admin dashboard components
- [ ] Copy customer dashboard components
- [ ] Copy driver dashboard components
- [ ] **Replace bg-slate placeholder divs** with proper loading skeletons or Next.js Images
- [ ] Update imports and organize structure
- [ ] Test dashboard functionality

### FEATURES_003_ORDER_COMPONENTS

**Automation Level**: Medium | **Time**: 4 hours

- [ ] Copy appointment booking components
- [ ] Copy storage unit components
- [ ] Copy packing supply order components
- [ ] **Replace bg-slate placeholder divs** with Next.js Image components for product images
- [ ] Migrate to /components/features/orders/
- [ ] Update to use design system
- [ ] Test order workflows

### FEATURES_004_ONFLEET_COMPONENTS

**Automation Level**: Medium | **Time**: 3 hours

- [ ] Copy Onfleet integration components (NO LOGIC CHANGES)
- [ ] Copy tracking components
- [ ] Copy task status components
- [ ] Migrate to /components/features/onfleet/
- [ ] Update imports and styling
- [ ] Test Onfleet functionality

### FEATURES_005_DRIVER_COMPONENTS

**Automation Level**: Medium | **Time**: 3 hours

- [ ] Copy driver management components
- [ ] Copy driver availability components
- [ ] Copy driver assignment components
- [ ] Migrate to /components/features/drivers/
- [ ] Update to use design system
- [ ] Test driver workflows

### FEATURES_006_MOVING_PARTNER_COMPONENTS

**Automation Level**: Medium | **Time**: 3 hours

- [ ] Copy moving partner management components
- [ ] Copy moving partner assignment components
- [ ] Copy third-party integration components
- [ ] Migrate to /components/features/moving-partners/
- [ ] Update to use design system
- [ ] Test moving partner workflows

### FEATURES_007_PAYMENT_COMPONENTS

**Automation Level**: Medium | **Time**: 3 hours

- [ ] Copy payment form components (NO LOGIC CHANGES)
- [ ] Copy subscription components
- [ ] Copy invoice components
- [ ] Migrate to /components/features/payments/
- [ ] Update styling only
- [ ] Test payment forms

## Phase 6: Page Migration & Route Groups (Week 5) - [0/5 tasks completed]

**Status**: Not Started  
**Progress**: ░░░░░░░░░░ 0% (0/5 tasks completed)  
**Goal**: Migrate all pages with proper route group organization and optimized routing patterns

### PAGES_001_PUBLIC_PAGES

**Automation Level**: Medium | **Time**: 3 hours

- [ ] Copy landing page components
- [ ] Copy about/pricing/help pages
- [ ] **CRITICAL: Replace ALL bg-slate image placeholders** with actual Next.js Image components
  - Landing page hero images, section graphics, customer photos
  - Add proper alt text for SEO and accessibility
  - Implement responsive image sizing
- [ ] Organize in /(public)/ route group
- [ ] Update component imports
- [ ] Test public navigation

### PAGES_002_AUTH_PAGES

**Automation Level**: Medium | **Time**: 2 hours

- [ ] Copy login/signup pages
- [ ] Copy password reset pages
- [ ] Organize in /(auth)/ route group
- [ ] Update component imports
- [ ] Test auth workflows

### PAGES_003_DASHBOARD_PAGES

**Automation Level**: Medium | **Time**: 4 hours

- [ ] Copy admin dashboard pages
- [ ] Copy customer dashboard pages
- [ ] Copy driver/mover dashboard pages
- [ ] **CRITICAL: Refactor admin task routing logic**:
  - Replace string-parsing task ID logic with proper Next.js route structure
  - Eliminate client-side redirects using router.replace()
  - Create proper route hierarchy: `/admin/tasks/[type]/[taskId]`
  - Consolidate duplicated routing logic between task list and task detail pages
  - Implement route groups for task categories (storage, feedback, cleaning, etc.)
- [ ] Organize in /(dashboard)/ route group
- [ ] Test dashboard access and functionality

### PAGES_004_SPECIALIZED_PAGES

**Automation Level**: Medium | **Time**: 3 hours

- [ ] Copy tracking pages
- [ ] Copy booking pages
- [ ] Copy feedback pages
- [ ] Update imports and test functionality

### PAGES_005_ROUTING_OPTIMIZATION

**Automation Level**: High | **Time**: 4 hours

- [ ] **Admin Task Routing Refactor** (CRITICAL Performance Issue):
  - **Current Problem**: boombox-10.0 uses complex string-parsing logic with client-side redirects
    - `/admin/tasks/[taskId]/page.tsx` loads just to parse taskId and redirect
    - Duplicated routing logic in task list and detail pages
    - Performance overhead from unnecessary component mounting/unmounting
  - **Solution**: Implement proper Next.js App Router structure
    ```
    /admin/tasks/
    ├── page.tsx                          # Task list
    ├── storage/
    │   └── [taskId]/page.tsx            # /admin/tasks/storage/storage-123
    ├── feedback/
    │   └── [taskId]/page.tsx            # /admin/tasks/feedback/feedback-456
    ├── cleaning/
    │   └── [taskId]/page.tsx            # /admin/tasks/cleaning/cleaning-789
    ├── access/
    │   └── [taskId]/page.tsx            # /admin/tasks/access/access-101
    └── prep-delivery/
        └── [taskId]/page.tsx            # /admin/tasks/prep-delivery/prep-delivery-202
    ```
  - **Benefits**: Direct routing, no redirects, better SEO, improved performance
- [ ] **Navigation Optimization**:
  - Replace hardcoded URL building with typed route helpers
  - Implement breadcrumb navigation for task hierarchies
  - Add proper loading states for route transitions
- [ ] **Route Group Implementation**:
  - Organize admin routes: `(admin-dashboard)`, `(admin-tasks)`, `(admin-management)`
  - Implement proper layout hierarchies with shared components
  - Add route-level authorization and role checking
- [ ] **Performance Validation**:
  - Measure and compare navigation performance vs boombox-10.0
  - Eliminate all unnecessary client-side redirects
  - Validate proper Next.js static optimization
- [ ] **Testing**:
  - Test all task routing scenarios
  - Validate deep-linking to specific tasks works correctly
  - Ensure backward compatibility for any bookmarked URLs

## Phase 7: Testing & Validation (Week 6) - [0/3 tasks completed]

**Status**: Not Started  
**Progress**: ░░░░░░░░░░ 0% (0/3 tasks completed)  
**Goal**: Implement testing infrastructure and validate functionality

### TEST_001_UNIT_TESTING

**Automation Level**: Medium | **Time**: 4 hours

- [ ] Set up Jest configuration
- [ ] Create utility function tests
- [ ] Create component tests for UI library
- [ ] Add API route tests
- [ ] Set up test coverage reporting

### TEST_002_INTEGRATION_TESTING

**Automation Level**: Low | **Time**: 4 hours

- [ ] Test authentication flows end-to-end
- [ ] Test payment processing (without real charges)
- [ ] Test Onfleet integration (test environment)
- [ ] Test database operations
- [ ] Validate all critical user journeys

### TEST_003_MIGRATION_VALIDATION

**Automation Level**: Low | **Time**: 3 hours

- [ ] Side-by-side comparison testing
- [ ] Validate 99.9% functional compatibility
- [ ] Performance comparison
- [ ] Bundle size analysis
- [ ] Final deployment validation

## Phase 8: Documentation & Deployment (Week 6-7) - [0/2 tasks completed]

**Status**: Not Started  
**Progress**: ░░░░░░░░░░ 0% (0/2 tasks completed)  
**Goal**: Document new structure and prepare for production

### DOCS_001_COMPONENT_DOCS

**Automation Level**: Medium | **Time**: 3 hours

- [ ] Document design system components
- [ ] Create component usage examples
- [ ] Document API patterns
- [ ] Create migration guide

### DOCS_002_DEPLOYMENT_PREP

**Automation Level**: High | **Time**: 2 hours

- [ ] Update deployment configuration
- [ ] Test build process
- [ ] Validate environment variables
- [ ] Prepare production deployment

---

## 5. API Route Documentation Template

When refactoring API routes in Phase 4, each route file must include comprehensive documentation comments at the top of the file following this template:

```typescript
/**
 * @fileoverview [Brief description of API route functionality]
 * @source boombox-10.0/src/app/api/[original-path]/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * [Detailed description of what this route does, including HTTP methods supported]
 *
 * USED BY (boombox-10.0 files):
 * - src/app/components/[component-path]/[ComponentName].tsx (line X: specific usage context)
 * - src/app/[page-path]/page.tsx (line Y: specific usage context)
 * - [Additional files that call this API route]
 *
 * INTEGRATION NOTES:
 * - [Any special notes about external service integrations like Stripe/Onfleet]
 * - [Critical business logic that must be preserved]
 * - [Security/authorization requirements]
 *
 * @refactor [Description of any organizational changes made during refactor]
 */
```

### Example Documentation:

```typescript
/**
 * @fileoverview Stripe customer creation with payment method attachment
 * @source boombox-10.0/src/app/api/stripe/create-stripe-customer/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint that creates a new Stripe customer and attaches a payment method.
 * Sets up customer with shipping address and default payment method for invoicing.
 *
 * USED BY (boombox-10.0 files):
 * - src/app/components/getquote/getquoteform.tsx (line 345: Customer registration during quote submission)
 *
 * INTEGRATION NOTES:
 * - Critical Stripe integration - DO NOT modify payment logic
 * - Creates SetupIntent for off-session payments
 * - Requires paymentMethodId from Stripe Elements on frontend
 *
 * @refactor Moved from /api/stripe/ to /api/payments/ structure
 */
```

---

## 6. Task Dependencies

### Sequential Dependencies

- **SETUP** phases must complete before **TYPES**
- **TYPES** must complete before **UI**
- **UI** must complete before **FEATURES**
- **API** can run parallel to **UI** and **FEATURES**
- **PAGES** requires **FEATURES** and **API** completion
- **TESTING** requires all previous phases
- **DOCS** can run parallel to **TESTING**

### Critical Path Tasks

1. SETUP_001 → SETUP_002 → SETUP_003
2. TYPES_001 → TYPES_002
3. UI_001 → UI_002 → UI_003 → UI_004
4. All API tasks can run in parallel
5. All FEATURES tasks require UI completion
6. All PAGES tasks require FEATURES completion

---

## 7. Automation Guidelines

### High Automation Tasks (>80%)

- File copying and directory creation
- Import path updates
- Basic configuration setup
- Type extraction and organization
- Simple component migration

### Medium Automation Tasks (50-80%)

- Component refactoring with design system integration
- API route organization with validation
- Complex import updates
- Integration testing setup

### Low Automation Tasks (<50%)

- Business logic validation
- End-to-end testing
- Performance optimization
- Complex component patterns

---

## 8. Success Criteria

### Functional Requirements

- [ ] 99.9% functional compatibility with boombox-10.0
- [ ] All Onfleet integrations work identically
- [ ] All Stripe payments process identically
- [ ] All user workflows function as expected
- [ ] Performance equal or better than boombox-10.0

### Technical Requirements

- [ ] Zero TypeScript compilation errors
- [ ] All tests passing
- [ ] Production build successful
- [ ] Clean file organization following Next.js best practices
- [ ] Consistent code patterns throughout

### Quality Requirements

- [ ] Improved code maintainability
- [ ] Consistent design system implementation
- [ ] Better component reusability
- [ ] Clear documentation for new structure
- [ ] Streamlined development workflow

### SEO, Accessibility & Performance Requirements

- [ ] **SEO Optimization**: Proper semantic HTML, meta tags, structured data, heading hierarchy
- [ ] **Accessibility Compliance**: WCAG 2.1 AA standards, keyboard navigation, screen reader support
- [ ] **Performance Optimization**: Core Web Vitals targets (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- [ ] **Bundle Size**: Maintain or improve bundle size from boombox-10.0
- [ ] **Image Optimization**: All images use Next.js Image component with proper sizing
- [ ] **Code Splitting**: Heavy components use dynamic imports
- [ ] **Font Optimization**: Use next/font for better loading performance
- [ ] **Routing Performance**: Eliminate client-side redirects, implement proper route structure, improve navigation speed

---

## 9. Task Tracking Workflow

### **CRITICAL**: Mark Tasks as Completed in PRD

When a task is completed, it **MUST** be marked off directly in this PRD file using this workflow:

#### 1. **Update Task Status**

Change the task checkbox from `- [ ]` to `- [x]` in the relevant Phase section.

#### 2. **Add Completion Details**

Add completion information directly after the task:

```markdown
### TASK_ID_TASK_NAME ✅ COMPLETED

**Completed**: [Date] by [Person/AI]
**Time Taken**: X hours (vs Y hours estimated)
**Git Commit**: [commit hash or branch name]
**Notes**: [Any important notes, issues encountered, or deviations]
```

#### 3. **Update Phase Progress**

At the top of each Phase section, maintain a progress tracker:

```markdown
## Phase X: Phase Name (Week Y) - [X/Y tasks completed]

**Status**: Not Started | In Progress | Completed
**Progress**: ██████░░░░ 60% (3/5 tasks completed)
```

### Task Tracking Template

Each new task should follow this format:

```markdown
### TASK_ID_TASK_NAME

**Status**: Not Started | In Progress | Completed | Blocked
**Automation Level**: High | Medium | Low
**Estimated Time**: X hours
**Dependencies**: [List of prerequisite tasks]
**Validation**: [How to verify completion]

#### Subtasks:

- [ ] Subtask 1
- [ ] Subtask 2
- [ ] Subtask 3

#### Completion Criteria:

- [ ] All subtasks completed
- [ ] Source documentation added to all new files (@source comments)
- [ ] File mapping documentation updated
- [ ] **SEO Requirements**: Semantic HTML, proper headings, meta tags implemented
- [ ] **Accessibility Requirements**: ARIA labels, keyboard navigation, color contrast verified
- [ ] **Performance Requirements**: Images optimized, dynamic imports used, bundle size checked
- [ ] **Image Optimization**: ALL bg-slate placeholder divs replaced with Next.js Image components
- [ ] **Routing Optimization**: No client-side redirects, proper Next.js App Router structure implemented
- [ ] Tests passing
- [ ] Functionality validated
- [ ] Code committed to git
```

### Progress Tracking Examples

#### ✅ Completed Task Example:

```markdown
### SETUP_001_PROJECT_INITIALIZATION ✅ COMPLETED

**Completed**: 2025-01-28 by AI Assistant
**Time Taken**: 1.5 hours (vs 2 hours estimated)
**Git Commit**: abc123f - "Initial Next.js 15 project setup"
**Notes**: Upgraded to Next.js 15.1.2, no issues encountered

- [x] Initialize Next.js 15+ project in boombox-11.0
- [x] Copy package.json dependencies (upgrade to latest stable)
- [x] Set up TypeScript configuration
- [x] Configure Tailwind CSS
- [x] Copy environment variables
```

#### 🔄 In Progress Task Example:

```markdown
### UI_002_BASE_COMPONENTS 🔄 IN PROGRESS

**Started**: 2025-01-28 by Developer
**Progress**: 2/4 subtasks completed

- [x] Create Button component with variants
- [x] Create Input/TextArea/Select components
- [ ] Create Modal/Dialog components
- [ ] Create Loading/Spinner components
```

---

## 10. Next Steps

### Immediate Actions (Next 24 hours)

1. [ ] Approve this PRD
2. [ ] Begin SETUP_001_PROJECT_INITIALIZATION
3. [ ] Set up git repository and initial structure
4. [ ] Start SETUP_002_DIRECTORY_STRUCTURE

### Week 1 Goals

- [ ] Complete all SETUP tasks
- [ ] Complete TYPES_001 and TYPES_002
- [ ] Begin UI_001_DESIGN_TOKENS

### Risk Mitigation

- **Git Safety**: Commit after each completed task
- **Validation**: Test each domain completely before moving to next
- **Rollback Plan**: Git revert if any task breaks functionality
- **Communication**: Regular progress updates and blocker identification

---

_This PRD serves as the master reference for the boombox-10.0 to boombox-11.0 refactoring project. All tasks are designed for maximum AI assistance while maintaining safety and quality._
