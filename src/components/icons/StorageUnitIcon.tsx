/**
 * @fileoverview Storage unit icon component with error state support
 * @source boombox-10.0/src/app/components/icons/storageuniticon.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - SVG icon representing a storage unit container
 * - Support for error state with red coloring
 * - Responsive sizing via className prop
 * - Semantic color usage from design system
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with design system tokens
 * - Error state uses status-error color
 * - Default state uses surface-tertiary and text-primary colors
 * 
 * @refactor Applied design system colors, maintained original SVG structure
 */

import React from 'react';

interface StorageUnitIconProps {
  /** CSS classes for styling */
  className?: string;
  /** Whether to show error state (red coloring) */
  hasError?: boolean;
}

/**
 * Storage unit icon component
 * 
 * @example
 * ```tsx
 * <StorageUnitIcon className="w-12 h-12" />
 * <StorageUnitIcon className="w-8 h-8" hasError />
 * ```
 */
export const StorageUnitIcon: React.FC<StorageUnitIconProps> = ({ 
  className = "", 
  hasError = false 
}) => (
  <svg
    className={className}
    viewBox="0 0 64.3 64.73"
    role="img"
    aria-label="Storage unit"
  >
    <defs>
      <style>
        {`.storage_unit_icon-1,
          .storage_unit_icon-3,
          .storage_unit_icon-4 {
            fill: ${hasError ? 'rgb(254 226 226)' : 'rgb(241 245 249)'};
          }
          .storage_unit_icon-2 {
            fill: #fff;
          }
          .storage_unit_icon-6 {
            stroke: ${hasError ? 'rgb(239 68 68)' : 'currentColor'};
            fill: ${hasError ? 'rgb(239 68 68)' : 'currentColor'};
          }
          .storage_unit_icon-3,
          .storage_unit_icon-4,
          .storage_unit_icon-5 {
            stroke: ${hasError ? 'rgb(239 68 68)' : 'currentColor'};
          }
          .storage_unit_icon-3,
          .storage_unit_icon-5 {
            stroke-miterlimit: 10;
          }
          .storage_unit_icon-3 {
            stroke-width: 4px;
          }
          .storage_unit_icon-4 {
            stroke-linejoin: round;
          }
          .storage_unit_icon-5 {
            fill: ${hasError ? 'rgb(254 226 226)' : 'rgb(241 245 249)'};
            stroke-width: 3px;
          }`}
      </style>
    </defs>
    <g>
      <rect className="storage_unit_icon-1" x="2" y="2" width="60.3" height="60.73" rx="4" ry="4"/>
      <rect className="storage_unit_icon-2" x="8" y="8" width="48.3" height="48.73" rx="2" ry="2"/>
      <rect className="storage_unit_icon-3" x="12" y="12" width="40.3" height="40.73" rx="2" ry="2"/>
      <rect className="storage_unit_icon-4" x="16" y="16" width="32.3" height="32.73" rx="1" ry="1"/>
      <rect className="storage_unit_icon-5" x="20" y="20" width="24.3" height="24.73" rx="1" ry="1"/>
      <circle className="storage_unit_icon-6" cx="32.15" cy="32.37" r="4"/>
    </g>
  </svg>
);