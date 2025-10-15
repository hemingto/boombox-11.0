/**
 * @fileoverview Custom hook for managing expandable section height calculations
 * @source boombox-10.0/src/app/components/appointment-tracking/appointmenttracking.tsx (extracted height logic)
 * 
 * HOOK FUNCTIONALITY:
 * - Manages height calculations for expandable/collapsible sections
 * - Provides smooth animations using max-height transitions
 * - Handles multiple expandable sections with individual height tracking
 * - Automatically calculates content height using refs
 * 
 * @refactor Extracted from AppointmentTracking component to improve reusability
 * and separate concerns for expandable UI patterns
 */

import { useState, useRef, useCallback, RefObject } from 'react';

/**
 * Hook return interface
 */
export interface UseExpandableHeightReturn {
  /** Object mapping section IDs to their expanded state */
  expandedSections: string[];
  /** Object mapping section IDs to their calculated max-height values */
  maxHeights: { [key: string]: string };
  /** Ref object for content elements - assign to expandable content containers */
  contentRefs: RefObject<{ [key: string]: HTMLDivElement | null }>;
  /** Function to toggle a section's expanded state */
  toggleSection: (sectionId: string) => void;
  /** Function to expand a specific section */
  expandSection: (sectionId: string) => void;
  /** Function to collapse a specific section */
  collapseSection: (sectionId: string) => void;
  /** Function to set initial expanded sections */
  setInitialExpanded: (sectionIds: string[]) => void;
  /** Function to calculate and update height for a specific section */
  updateSectionHeight: (sectionId: string) => void;
}

/**
 * Custom hook for managing expandable section heights
 * 
 * Provides utilities for creating smooth expand/collapse animations
 * using max-height transitions with dynamically calculated heights.
 * 
 * @param initialExpanded - Array of section IDs that should be expanded initially
 * @returns Object containing state and utility functions for expandable sections
 * 
 * @example
 * ```tsx
 * const {
 *   expandedSections,
 *   maxHeights,
 *   contentRefs,
 *   toggleSection
 * } = useExpandableHeight(['section-1']);
 * 
 * return (
 *   <div>
 *     <button onClick={() => toggleSection('section-1')}>
 *       Toggle Section
 *     </button>
 *     <div
 *       ref={(el) => {
 *         if (contentRefs.current) {
 *           contentRefs.current['section-1'] = el;
 *         }
 *       }}
 *       style={{
 *         maxHeight: maxHeights['section-1'] || '0px',
 *         transition: 'max-height 0.3s ease'
 *       }}
 *       className="overflow-hidden"
 *     >
 *       <div>Expandable content here</div>
 *     </div>
 *   </div>
 * );
 * ```
 */
export function useExpandableHeight(
  initialExpanded: string[] = []
): UseExpandableHeightReturn {
  const [expandedSections, setExpandedSections] = useState<string[]>(initialExpanded);
  const [maxHeights, setMaxHeights] = useState<{ [key: string]: string }>({});
  const contentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  /**
   * Calculate and update height for a specific section
   */
  const updateSectionHeight = useCallback((sectionId: string) => {
    const element = contentRefs.current[sectionId];
    if (element) {
      const height = element.scrollHeight;
      setMaxHeights(prev => ({
        ...prev,
        [sectionId]: `${height}px`
      }));
    }
  }, []);

  /**
   * Toggle a section's expanded state
   */
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const isCurrentlyExpanded = prev.includes(sectionId);
      
      if (isCurrentlyExpanded) {
        // Collapsing - set height to 0
        setMaxHeights(prevHeights => ({
          ...prevHeights,
          [sectionId]: '0px'
        }));
        return prev.filter(id => id !== sectionId);
      } else {
        // Expanding - calculate and set height
        const element = contentRefs.current[sectionId];
        if (element) {
          const height = element.scrollHeight;
          setMaxHeights(prevHeights => ({
            ...prevHeights,
            [sectionId]: `${height}px`
          }));
        }
        return [...prev, sectionId];
      }
    });
  }, []);

  /**
   * Expand a specific section
   */
  const expandSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      if (!prev.includes(sectionId)) {
        // Calculate and set height
        const element = contentRefs.current[sectionId];
        if (element) {
          const height = element.scrollHeight;
          setMaxHeights(prevHeights => ({
            ...prevHeights,
            [sectionId]: `${height}px`
          }));
        }
        return [...prev, sectionId];
      }
      return prev;
    });
  }, []);

  /**
   * Collapse a specific section
   */
  const collapseSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      if (prev.includes(sectionId)) {
        setMaxHeights(prevHeights => ({
          ...prevHeights,
          [sectionId]: '0px'
        }));
        return prev.filter(id => id !== sectionId);
      }
      return prev;
    });
  }, []);

  /**
   * Set initial expanded sections (useful for dynamic initialization)
   */
  const setInitialExpanded = useCallback((sectionIds: string[]) => {
    setExpandedSections(sectionIds);
    
    // Calculate heights for initially expanded sections
    sectionIds.forEach(sectionId => {
      const element = contentRefs.current[sectionId];
      if (element) {
        const height = element.scrollHeight;
        setMaxHeights(prev => ({
          ...prev,
          [sectionId]: `${height}px`
        }));
      }
    });
  }, []);

  return {
    expandedSections,
    maxHeights,
    contentRefs,
    toggleSection,
    expandSection,
    collapseSection,
    setInitialExpanded,
    updateSectionHeight,
  };
}

export default useExpandableHeight;
