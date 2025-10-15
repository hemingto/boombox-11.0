/**
 * @fileoverview Custom hook for detecting clicks outside a referenced element
 * @source Extracted from multiple components with duplicated click-outside logic
 * @refactor Consolidated click-outside detection from 13+ components
 */

import { useEffect, RefObject } from 'react';

/**
 * Hook that handles clicks outside of the passed ref
 * 
 * @param ref - React ref object for the element to detect clicks outside of
 * @param handler - Callback function to execute when click outside is detected
 * @param enabled - Whether the click outside detection is enabled (default: true)
 * 
 * @example
 * ```tsx
 * const ref = useRef<HTMLDivElement>(null);
 * 
 * useClickOutside(ref, () => {
 *   setIsOpen(false);
 * });
 * 
 * return <div ref={ref}>Content</div>;
 * ```
 * 
 * @example With conditional enabling
 * ```tsx
 * useClickOutside(ref, handleClose, isDropdownOpen);
 * ```
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null> | RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void,
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      // Do nothing if clicking ref's element or descendent elements
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }

      handler(event);
    };

    // Bind the event listener
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [ref, handler, enabled]);
}

export default useClickOutside;
