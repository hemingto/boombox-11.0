# Boombox Design Tokens

This document outlines the design token system for Boombox 11.0, following a **Tailwind-first approach** with semantic extensions.

## Philosophy

We use Tailwind CSS as our foundational design system and extend it only when necessary for:

- Brand-specific colors
- Common component patterns
- Semantic aliases for better maintainability

## Color System

### Brand Colors

```css
/* Primary brand color (zinc-950) */
bg-primary          /* Default brand color */
bg-primary-hover    /* Hover state */
bg-primary-active   /* Active/pressed state */
text-primary        /* For text on light backgrounds */
```

**Usage**: Primary CTAs, navigation, key interactive elements

### Status Colors

Based on semantic meaning rather than specific colors:

```css
/* Success (green) */
bg-status-success, text-status-success
bg-status-bg-success, text-status-text-success (for badges)

/* Warning (amber) */
bg-status-warning, text-status-warning
bg-status-bg-warning, text-status-text-warning (for badges)

/* Error (red) */
bg-status-error, text-status-error
bg-status-bg-error, text-status-text-error (for badges)

/* Info (blue) */
bg-status-info, text-status-info
bg-status-bg-info, text-status-text-info (for badges)

/* Pending (amber) */
bg-status-pending, text-status-pending
bg-status-bg-pending, text-status-text-pending (for badges)

/* Processing (blue) */
bg-status-processing, text-status-processing
bg-status-bg-processing, text-status-text-processing (for badges)
```

### Surface Colors

```css
bg-surface-primary    /* White - main content areas */
bg-surface-secondary  /* Slate-50 - subtle backgrounds */
bg-surface-tertiary   /* Slate-100 - form fields, cards */
bg-surface-disabled   /* Slate-200 - disabled states */
```

### Text Colors

```css
text-text-primary     /* Zinc-950 - main text */
text-text-secondary   /* Zinc-400 - secondary text */
text-text-tertiary    /* Zinc-500 - helper text */
text-text-inverse     /* White - text on dark backgrounds */
```

### Border Colors

```css
border-border         /* Default borders (zinc-200) */
border-border-focus   /* Focus states (zinc-950) */
border-border-error   /* Error states (red-500) */
```

## Component Utility Classes

### Buttons

```css
.btn-primary          /* Primary action button */
.btn-secondary        /* Secondary action button */
.btn-destructive      /* Dangerous actions (delete, etc.) */
```

**Example**:

```tsx
<button className="btn-primary">Get Quote</button>
<button className="btn-secondary">Cancel</button>
<button className="btn-destructive">Delete Account</button>
```

### Form Elements

```css
.input-field          /* Standard input styling */
.input-field--error   /* Error state variant */

.form-group           /* Form field container */
.form-label           /* Field labels */
.form-error           /* Error messages */
.form-helper          /* Helper text */
```

**Example**:

```tsx
<div className="form-group">
  <label className="form-label">Email Address</label>
  <input
    type="email"
    className={`input-field ${hasError ? 'input-field--error' : ''}`}
    placeholder="Enter your email"
  />
  {hasError && <p className="form-error">Please enter a valid email</p>}
  <p className="form-helper">We'll never share your email</p>
</div>
```

### Status Badges

```css
.badge-success        /* Completed, Active, Paid */
.badge-warning        /* Pending, Busy */
.badge-error          /* Failed, Cancelled, Unpaid */
.badge-info           /* Scheduled, Processing */
.badge-pending        /* Pending states */
.badge-processing     /* In progress states */
```

**Example**:

```tsx
<span className="badge-success">Completed</span>
<span className="badge-pending">Pending Approval</span>
<span className="badge-error">Payment Failed</span>
```

### Cards

```css
.card                 /* Standard card with shadow */
.card-elevated        /* Elevated card with larger shadow */
```

### Loading States

```css
.skeleton             /* Base skeleton loader */
.skeleton-text        /* Text placeholder */
.skeleton-title       /* Title placeholder */
.skeleton-avatar      /* Avatar placeholder */
```

**Example**:

```tsx
{isLoading ? (
  <div className="skeleton-title w-48 mb-2" />
  <div className="skeleton-text w-32" />
) : (
  <h2>{title}</h2>
  <p>{description}</p>
)}
```

### Layout Utilities

```css
.page-container       /* Max-width container with padding */
.section-spacing      /* Consistent section spacing */
.modal-overlay        /* Modal backdrop */
.modal-content        /* Modal content box */
```

## Animation System

### Transitions

```css
.animate-fade-in      /* Fade in animation */
.animate-slide-in     /* Slide in from left */
.animate-shimmer      /* Loading shimmer effect */
```

### Loading States

```css
.bg-shimmer          /* Shimmer background for loading */
.animate-shimmer     /* Shimmer animation */
```

## Typography Scale

We use Tailwind's default typography scale with these additions:

```css
text-2xs             /* 10px - very small text */
```

Font families:

```css
font-inter           /* Primary font (Inter) */
font-poppins         /* Secondary font (Poppins) */
```

## Spacing Extensions

```css
spacing-18           /* 4.5rem (72px) - common in Boombox layouts */
```

## Shadow System

```css
shadow-card          /* Standard card shadow */
shadow-elevated      /* Elevated content shadow */
shadow-custom-shadow /* Legacy custom shadow (being phased out) */
```

## Best Practices

### 1. Use Semantic Classes First

```tsx
// ✅ Good - semantic and clear
<button className="btn-primary">Submit</button>
<span className="badge-success">Active</span>

// ❌ Avoid - too specific, hard to maintain
<button className="bg-zinc-950 text-white px-6 py-2.5 rounded-md">Submit</button>
```

### 2. Combine with Tailwind Utilities

```tsx
// ✅ Good - semantic base + Tailwind utilities
<div className="card p-6 mb-4">
  <h3 className="text-lg font-semibold mb-2">Card Title</h3>
  <p className="text-text-secondary">Card content</p>
</div>
```

### 3. Status Colors for Consistent Meaning

```tsx
// ✅ Good - semantic status colors
<span className="badge-error">Payment Failed</span>
<span className="badge-success">Order Delivered</span>

// ❌ Avoid - arbitrary color choices
<span className="bg-red-100 text-red-800">Payment Failed</span>
```

### 4. Use Design Tokens for Theming

```tsx
// ✅ Good - uses design tokens
<div className="bg-surface-secondary border-border">

// ❌ Avoid - hardcoded colors
<div className="bg-slate-50 border-zinc-200">
```

## Migration from Boombox-10.0

When migrating components from boombox-10.0:

1. **Identify patterns**: Look for repeated color/style combinations
2. **Use semantic classes**: Replace with appropriate utility classes
3. **Status colors**: Use the status color system for badges and states
4. **Button patterns**: Replace custom button styles with `.btn-*` classes
5. **Form patterns**: Use the form utility classes for consistency

### Common Replacements

```tsx
// Old boombox-10.0 pattern
className = 'bg-zinc-950 text-white px-6 py-2.5 rounded-md hover:bg-zinc-800';

// New boombox-11.0 pattern
className = 'btn-primary';

// Old status pattern
className =
  'bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-xs';

// New status pattern
className = 'badge-success';
```

## Accessibility

All design tokens include proper focus states and meet WCAG 2.1 AA standards:

- Focus rings are visible and high-contrast
- Color combinations meet contrast requirements
- Interactive elements have clear hover/active states
- Screen reader friendly semantic structure

## Future Considerations

This system is designed to be:

- **Extensible**: Easy to add new semantic tokens
- **Maintainable**: Clear patterns that scale with the team
- **Consistent**: Unified approach across all interfaces
- **Performance-oriented**: Uses Tailwind's optimizations and purging
