/**
 * @fileoverview Storage calculator section with interactive calculator widget
 * @source boombox-10.0/src/app/components/storagecalculator/storagecalculatorsection.tsx
 *
 * COMPONENT FUNCTIONALITY:
 * Displays an interactive storage calculator that allows users to:
 * - Select furniture items with quantities
 * - Filter by category (Bedroom, Living Room, Kitchen, Boxes)
 * - Add custom items with custom dimensions
 * - Calculate required number of Boombox storage units
 * - Navigate to get a quote
 *
 * DESIGN SYSTEM UPDATES:
 * - Uses Button, FilterDropdown, Modal, Input primitives
 * - Applied semantic surface colors and design tokens
 * - Used consistent spacing from design system
 * - Responsive layout for mobile and desktop
 *
 * @refactor
 * - Replaced placeholder with interactive StorageCalculatorWidget
 * - Added useStorageCalculator hook for state management
 * - Integrated with existing design system components
 */

'use client';

import { StorageCalculatorWidget } from './StorageCalculatorWidget';

/**
 * Storage Calculator Section Component
 *
 * Interactive section that allows users to:
 * - Select items they need to store
 * - Calculate how many Boombox units they need
 * - Get a quote for their storage needs
 */
export function StorageCalculatorSection() {
  return (
    <section
      className="lg:px-16 px-6 sm:mb-48 mb-24"
      aria-label="Storage calculator interactive section"
    >
      <StorageCalculatorWidget />
    </section>
  );
}

export default StorageCalculatorSection;
