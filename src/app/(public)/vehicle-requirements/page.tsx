/**
 * @fileoverview Vehicle requirements page - requirements for drivers
 * @source boombox-10.0/src/app/vehicle-requirements/page.tsx
 * @refactor Migrated to (public) route group with SEO metadata
 */

'use client';

import type { Metadata } from 'next';
import {
  VehicleReqHero,
  VehicleReqList,
  VehicleReqPictures,
} from '@/components/features/vehicle-requirements';
import { FaqSection, HelpCenterSection } from '@/components/features/landing';

// Note: Page is client component
// SEO metadata should be added via generateMetadata when converting to server component

export default function VehicleRequirements() {
  return (
    <>
      <VehicleReqHero />
      <VehicleReqList />
      <VehicleReqPictures />
      <FaqSection />
      <HelpCenterSection />
    </>
  );
}

