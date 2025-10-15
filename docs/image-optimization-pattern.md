# Image Optimization Pattern - Standard Process

## Overview

This document describes the standardized process for replacing `bg-slate-*` placeholder divs with the **OptimizedImage** component during component migration from boombox-10.0 to boombox-11.0.

**Documented in:**
- ✅ `.cursor/rules` - Line 341-419 (Image Optimization Pattern section)
- ✅ `docs/component-migration-checklist.md` - Step 3e (Replace Placeholder Divs)
- ✅ `REFACTOR_PRD.md` - Updated throughout Phase 5 & 6 tasks

---

## Quick Reference

### The Pattern

**❌ OLD (boombox-10.0):**
```tsx
<div className="bg-slate-100 aspect-square w-full rounded-md"></div>
```

**✅ NEW (boombox-11.0):**
```tsx
import { OptimizedImage } from '@/components/ui/primitives/OptimizedImage/OptimizedImage';

<OptimizedImage
  src="/placeholder.jpg"
  alt="Descriptive alt text for SEO and accessibility"
  width={500}
  height={500}
  aspectRatio="square"
  containerClassName="w-full rounded-md"
  className="object-cover rounded-md"
  loading="lazy"
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

---

## Why This Matters

### Performance Benefits
- ✅ **Automatic optimization** - Next.js automatically optimizes images
- ✅ **Lazy loading** - Images load only when in viewport
- ✅ **Responsive sizing** - Serves appropriate image sizes per device
- ✅ **WebP format** - Modern format with better compression
- ✅ **Blur placeholder** - Smooth loading experience

### SEO Benefits
- ✅ **Proper `<img>` tags** - Search engines can index images
- ✅ **Descriptive alt text** - Improves search rankings
- ✅ **Semantic HTML** - Better than div with role="img"
- ✅ **Structured data** - Can add image schema

### Accessibility Benefits
- ✅ **Native img semantics** - Screen readers handle properly
- ✅ **Alt text support** - Describes content to assistive technology
- ✅ **Better than div** - No need for aria-label on div

### User Experience Benefits
- ✅ **Skeleton loading** - Smooth transition while loading
- ✅ **Error handling** - Fallback support built-in
- ✅ **Progressive loading** - Low quality → High quality
- ✅ **Faster page load** - Optimized file sizes

---

## Common Patterns

### 1. Hero Images (Above the Fold)
```tsx
<OptimizedImage
  src="/img/hero-image.jpg"
  alt="Boombox mobile storage - convenient storage delivered to your door"
  width={1200}
  height={600}
  aspectRatio="wide"
  loading="eager"
  priority
  quality={90}
  containerClassName="w-full rounded-lg"
  className="object-cover"
/>
```

**Configuration:**
- `loading="eager"` - Load immediately
- `priority={true}` - High priority for LCP
- `quality={90}` - High quality for hero
- `aspectRatio="wide"` - 21:9 ratio

### 2. Content Images (Below the Fold)
```tsx
<OptimizedImage
  src="/img/feature-section.jpg"
  alt="Boombox storage unit being delivered to customer location"
  width={800}
  height={600}
  aspectRatio="landscape"
  loading="lazy"
  quality={85}
  containerClassName="w-full rounded-md"
  className="object-cover"
  sizes="(max-width: 768px) 100vw, 75vw"
/>
```

**Configuration:**
- `loading="lazy"` - Lazy load
- `quality={85}` - Standard quality
- `aspectRatio="landscape"` - 4:3 ratio
- `sizes` - Responsive sizing

### 3. Thumbnail/Card Images
```tsx
<OptimizedImage
  src="/img/product-thumbnail.jpg"
  alt="5x5 storage unit - perfect for bedroom furniture"
  width={400}
  height={400}
  aspectRatio="square"
  loading="lazy"
  quality={80}
  containerClassName="w-full rounded-md"
  className="object-cover"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

**Configuration:**
- `loading="lazy"` - Lazy load
- `quality={80}` - Lower quality for thumbnails
- `aspectRatio="square"` - 1:1 ratio
- `sizes` - Multiple breakpoints

### 4. Avatar/Profile Images
```tsx
<OptimizedImage
  src="/img/customer-avatar.jpg"
  alt="Customer review by Sarah Johnson"
  width={128}
  height={128}
  aspectRatio="square"
  loading="lazy"
  quality={90}
  containerClassName="rounded-full"
  className="object-cover"
  sizes="(max-width: 768px) 64px, 128px"
/>
```

**Configuration:**
- `containerClassName="rounded-full"` - Circle avatar
- `quality={90}` - High quality for faces
- Small `sizes` - Specific pixel values

---

## Migration Checklist

### Step 1: Identify Placeholders
- [ ] Scan for `bg-slate-100`, `bg-slate-200`, `bg-gray-100`
- [ ] Look for `aspect-square`, `aspect-video`, etc.
- [ ] Check for TODO comments about images

### Step 2: Replace with OptimizedImage
- [ ] Import OptimizedImage component
- [ ] Set appropriate `src` (use `/placeholder.jpg` initially if no real image)
- [ ] Write descriptive alt text (10-15 words)
- [ ] Configure aspect ratio
- [ ] Set loading strategy (eager/lazy)
- [ ] Configure quality based on image type
- [ ] Add responsive `sizes` attribute

### Step 3: Update Tests
- [ ] Change `expect(div).toHaveClass('bg-slate-100')` to `expect(img).toHaveAttribute('src')`
- [ ] Update from `querySelector('[role="img"]')` to `getByRole('img')`
- [ ] Verify alt text: `expect(image).toHaveAttribute('alt', 'description')`
- [ ] Test loading attribute: `expect(image).toHaveAttribute('loading', 'lazy')`

### Step 4: Documentation
- [ ] Update component @fileoverview with image optimization notes
- [ ] Remove old TODO comments about replacing placeholders
- [ ] Add note about OptimizedImage usage

---

## Alt Text Best Practices

### ✅ Good Alt Text Examples
- "Boombox storage service - convenient mobile storage solution"
- "5x5 storage unit delivered to customer's driveway in San Francisco"
- "Customer review by Sarah Johnson for Boombox storage service"
- "Boombox driver loading furniture into mobile storage unit"

### ❌ Bad Alt Text Examples
- "Image" ❌ Too generic
- "Placeholder" ❌ Not descriptive
- "Picture of storage" ❌ Don't start with "Picture of..."
- "storage-unit.jpg" ❌ Don't use filenames

### Alt Text Guidelines
1. **Be specific** - Describe what's actually in the image
2. **Include context** - Add relevant business/product context
3. **10-15 words** - Long enough to be descriptive, short enough to be concise
4. **Skip redundancy** - Don't start with "Image of..." or "Picture of..."
5. **Include keywords** - Naturally include relevant SEO keywords

---

## Configuration Guide

### Aspect Ratios
- `square` - 1:1 (avatars, product thumbnails)
- `video` - 16:9 (standard video ratio)
- `portrait` - 3:4 (vertical images)
- `landscape` - 4:3 (standard photo ratio)
- `wide` - 21:9 (hero banners)

### Loading Strategy
- **Above the fold**: `loading="eager"` + `priority={true}`
- **Below the fold**: `loading="lazy"`
- **Hero images**: Always eager + priority
- **Thumbnails**: Always lazy

### Quality Settings
- **Hero images**: 90
- **Content images**: 85
- **Thumbnails**: 80
- **Avatars**: 90 (faces need higher quality)

### Sizes Attribute
```tsx
// Full width on mobile, 75% on tablet, 50% on desktop
sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 50vw"

// Grid layout - 1 column mobile, 2 columns tablet, 3 columns desktop
sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"

// Fixed sizes for avatars
sizes="(max-width: 768px) 64px, 128px"
```

---

## Real Example: GetQuoteHowItWorks Component

### Before (boombox-10.0)
```tsx
<div className="flex place-content-end basis-1/2">
  <div className="bg-slate-100 aspect-square w-full md:ml-8 rounded-md"></div>
</div>
```

### After (boombox-11.0)
```tsx
import { OptimizedImage } from '@/components/ui/primitives/OptimizedImage/OptimizedImage';

<div className="flex place-content-end basis-1/2">
  <OptimizedImage
    src="/placeholder.jpg"
    alt="Boombox storage service - convenient mobile storage solution"
    width={500}
    height={500}
    aspectRatio="square"
    containerClassName="w-full md:ml-8 rounded-md"
    className="object-cover rounded-md"
    loading="lazy"
    sizes="(max-width: 768px) 100vw, 50vw"
  />
</div>
```

### Test Updates
```tsx
// Before
it('renders the image placeholder', () => {
  const { container } = render(<GetQuoteHowItWorks />);
  const placeholder = container.querySelector('.bg-slate-100');
  expect(placeholder).toBeInTheDocument();
});

// After
it('renders the optimized image', () => {
  render(<GetQuoteHowItWorks />);
  const image = screen.getByRole('img');
  expect(image).toHaveAttribute('src');
  expect(image).toHaveAttribute('alt', 'Boombox storage service - convenient mobile storage solution');
  expect(image).toHaveAttribute('loading', 'lazy');
});
```

---

## Benefits Summary

| Aspect | Placeholder Div | OptimizedImage |
|--------|----------------|----------------|
| **Performance** | ❌ No optimization | ✅ Automatic optimization |
| **SEO** | ❌ Not indexed | ✅ Indexed by search engines |
| **Accessibility** | ⚠️ Needs role="img" | ✅ Native semantics |
| **Loading** | ❌ Always renders | ✅ Lazy/eager options |
| **File Size** | ❌ N/A | ✅ Optimized WebP |
| **Responsive** | ❌ Manual | ✅ Automatic sizing |
| **User Experience** | ❌ Gray box | ✅ Skeleton → Image |
| **Error Handling** | ❌ None | ✅ Fallback support |

---

## Implementation Checklist

For every component migration:

- [ ] ✅ Cursor rules updated with Image Optimization Pattern
- [ ] ✅ Component migration checklist includes step 3e
- [ ] ✅ REFACTOR_PRD references OptimizedImage
- [ ] ✅ All placeholder divs replaced
- [ ] ✅ Alt text is descriptive (10-15 words)
- [ ] ✅ Appropriate loading strategy (eager/lazy)
- [ ] ✅ Quality configured based on image type
- [ ] ✅ Sizes attribute for responsive images
- [ ] ✅ Tests updated to check img attributes
- [ ] ✅ Documentation updated

---

## Questions?

**Q: What if I don't have the actual image yet?**  
A: Use `/placeholder.jpg` temporarily and add a TODO comment. The component works with any image.

**Q: Should I always use lazy loading?**  
A: No. Use `eager` + `priority` for above-the-fold images (hero sections). Use `lazy` for everything else.

**Q: What aspect ratio should I use?**  
A: Match the original div's aspect ratio. Common: `square` (1:1), `landscape` (4:3), `wide` (21:9).

**Q: Do I need to update tests?**  
A: Yes! Change from testing div classes to testing img attributes (src, alt, loading).

**Q: What if the placeholder div is for a decorative element?**  
A: Use OptimizedImage with appropriate alt text. If truly decorative, use `alt=""` but this is rare.

---

_Last Updated: October 2, 2025_  
_Established during GetQuoteHowItWorks component migration_

