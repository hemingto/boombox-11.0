/**
 * @fileoverview Storage unit icon component with error state support
 * @source boombox-10.0/src/app/components/icons/storageuniticon.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - SVG icon representing a storage unit container with detailed 3D perspective
 * - Support for error state with red coloring
 * - Responsive sizing via className prop
 * - Detailed storage unit door design with handle
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with design system tokens
 * - Error state uses status-error color (#ef4444) and error background (#fee2e2)
 * - Default state uses surface-tertiary (#f1f5f9) and currentColor for strokes
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
 * Storage unit icon component with detailed 3D perspective
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
  >
    <defs>
      <style>
        {`.storage_unit_icon-1,
          .storage_unit_icon-3,
          .storage_unit_icon-4
           {
            fill: ${hasError ? '#fee2e2' : '#f1f5f9'};
            
          }
          .storage_unit_icon-2 {
            fill: #fff;
            
          }

          .storage_unit_icon-6 {
            stroke: ${hasError ? '#ef4444' : 'currentColor'};
            fill: ${hasError ? '#ef4444' : 'currentColor'};
          }

          .storage_unit_icon-3,
          .storage_unit_icon-4,
          .storage_unit_icon-5
          {
            stroke: ${hasError ? '#ef4444' : 'currentColor'};
            
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
            fill: ${hasError ? '#fee2e2' : '#f1f5f9'};
            stroke-width: 3px;
          }`}
        </style>

      </defs>
      <g>
        <g>
          <path className="storage_unit_icon-1" d="M30.72,63.23l-.27,0L2.72,58A1.51,1.51,0,0,1,1.5,56.54V5.75A1.49,1.49,0,0,1,2.85,4.26L30.26,1.51h.15l.25,0,30.9,5.4A1.49,1.49,0,0,1,62.8,8.4l-.1,44.65a1.51,1.51,0,0,1-1.09,1.44L31.13,63.17A1.4,1.4,0,0,1,30.72,63.23Z"/>
          <path className="storage_unit_icon-6" d="M30.41,3,61.3,8.4l-.1,44.65L30.72,61.73,3,56.54V5.75L30.41,3m0-3-.3,0L2.7,2.77a3,3,0,0,0-2.7,3V56.54a3,3,0,0,0,2.45,3l27.72,5.18a2.57,2.57,0,0,0,.55.06,2.81,2.81,0,0,0,.82-.12L62,55.93a3,3,0,0,0,2.18-2.87L64.3,8.4a3,3,0,0,0-2.48-3L30.92,0a2.92,2.92,0,0,0-.51,0Z"/>
          <path className="storage_unit_icon-2" d="M30.37,4,60.3,9.24l-.1,43.05L30.68,60.7,4,55.71v-49L30.37,4m0-1L3,5.75V56.54l27.72,5.19L61.2,53.05,61.3,8.4,30.41,3Z"/>
          <polyline className="storage_unit_icon-3" points="61.63 50 30.59 58.05 2.77 53.54"/>
          <polygon className="storage_unit_icon-4" points="27.05 56.02 27.05 5.55 4.72 7.67 4.72 52.43 27.05 56.02"/>
          <polygon className="storage_unit_icon-4" points="23.58 31.58 19.48 31.3 19.63 33.57 23.72 33.88 23.58 31.58"/>
          <line className="storage_unit_icon-5" x1="30.72" y1="61.73" x2="30.72" y2="3"/>
        </g>
      </g>
    </svg>
  );
