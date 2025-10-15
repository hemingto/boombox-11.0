/**
 * @fileoverview Storage unit selection logic
 * @source Extracted from boombox-10.0/src/app/components/getquote/quotebuilder.tsx
 * 
 * Custom hook for managing storage unit count selection with text descriptions.
 * Handles increment/decrement with min/max bounds (1-5 units).
 */

import { useState, useCallback } from 'react';
import { getStorageUnitText } from '@/lib/utils/storageUtils';

/**
 * Custom hook for storage unit selection
 * 
 * @param initialCount - Initial storage unit count (default: 1)
 * @returns Storage unit state and actions
 * 
 * @example
 * ```tsx
 * const { count, text, increment, decrement, canIncrement, canDecrement } = 
 *   useStorageUnitSelection(1);
 * ```
 */
export function useStorageUnitSelection(initialCount: number = 1) {
  const [count, setCount] = useState(initialCount);
  const [text, setText] = useState(getStorageUnitText(initialCount));
  
  /**
   * Increment storage unit count (max 5)
   */
  const increment = useCallback(() => {
    if (count < 5) {
      const newCount = count + 1;
      setCount(newCount);
      setText(getStorageUnitText(newCount));
    }
  }, [count]);
  
  /**
   * Decrement storage unit count (min 1)
   */
  const decrement = useCallback(() => {
    if (count > 1) {
      const newCount = count - 1;
      setCount(newCount);
      setText(getStorageUnitText(newCount));
    }
  }, [count]);
  
  /**
   * Set specific count (validated to be between 1-5)
   */
  const setStorageCount = useCallback((newCount: number) => {
    if (newCount >= 1 && newCount <= 5) {
      setCount(newCount);
      setText(getStorageUnitText(newCount));
    }
  }, []);
  
  return {
    count,
    text,
    increment,
    decrement,
    setCount: setStorageCount,
    canIncrement: count < 5,
    canDecrement: count > 1,
  };
}

