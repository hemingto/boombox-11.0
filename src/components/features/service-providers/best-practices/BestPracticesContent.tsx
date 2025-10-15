/**
 * @fileoverview Main container component for best practices section
 * @source boombox-10.0/src/app/components/mover-account/bestpracticescontent.tsx
 *
 * COMPONENT FUNCTIONALITY:
 * Container component that displays driver tips and training video gallery for service providers.
 * Used in the mover/driver account dashboard to help them learn best practices.
 *
 * DESIGN SYSTEM UPDATES:
 * - Applied semantic color tokens for text
 * - Consistent spacing with design system patterns
 * - Updated layout padding to match design system standards
 *
 * ACCESSIBILITY:
 * - Proper heading hierarchy (h2 for section titles)
 * - Semantic HTML with main content wrapper
 * - Descriptive text content
 *
 * @refactor Extracted to service-providers/best-practices folder, updated imports to use absolute paths
 */

import { DriverTips } from './DriverTips';
import { BestPracticesVideoGallery } from './BestPracticesVideoGallery';

export function BestPracticesContent() {
  return (
    <div className="flex flex-col lg:px-16 px-6 max-w-5xl w-full mx-auto mb-10">
      <DriverTips userType="driver" />

      <h2 className="text-2xl mt-10 mb-4 text-text-primary">
        Youtube training videos
      </h2>
      <p className="mb-12 text-text-primary">
        Watch the following videos to learn how to properly pack and transport
        your customer&apos;s items.
      </p>

      <BestPracticesVideoGallery />
    </div>
  );
}

