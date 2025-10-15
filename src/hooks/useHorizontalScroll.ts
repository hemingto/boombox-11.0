/**
 * @fileoverview Custom hook for horizontal scrolling with snap-to-item behavior
 * @source boombox-10.0/src/app/components/storage-unit-prices/additionalinfosection.tsx (scroll logic)
 * @refactor Extracted horizontal scroll logic into reusable custom hook
 */

import { useRef, useState, useEffect, useCallback } from 'react';

export interface UseHorizontalScrollOptions {
  /**
   * Gap between items in pixels (default: 16)
   */
  gap?: number;
}

export interface UseHorizontalScrollReturn {
  /**
   * Ref to attach to the scroll container
   */
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  /**
   * Scroll to the next/previous item
   */
  scrollToItem: (direction: 'left' | 'right') => void;
  /**
   * Scroll left handler
   */
  handleScrollLeft: () => void;
  /**
   * Scroll right handler
   */
  handleScrollRight: () => void;
}

/**
 * Custom hook for horizontal scrolling with snap-to-item behavior
 * 
 * @example
 * ```tsx
 * const { scrollContainerRef, handleScrollLeft, handleScrollRight } = useHorizontalScroll();
 * 
 * return (
 *   <div>
 *     <button onClick={handleScrollLeft}>Previous</button>
 *     <button onClick={handleScrollRight}>Next</button>
 *     <div ref={scrollContainerRef} className="overflow-x-auto">
 *       {items.map(item => <div key={item.id}>{item.content}</div>)}
 *     </div>
 *   </div>
 * );
 * ```
 */
export function useHorizontalScroll(
  options: UseHorizontalScrollOptions = {}
): UseHorizontalScrollReturn {
  const { gap = 16 } = options;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [itemWidth, setItemWidth] = useState(297.6 + gap); // Default to mobile width + gap

  useEffect(() => {
    const updateItemWidth = () => {
      if (scrollContainerRef.current) {
        const firstItem = scrollContainerRef.current.querySelector(
          '#item-container > a > div, #item-container > div:first-child'
        );
        if (firstItem) {
          const width = firstItem.getBoundingClientRect().width;
          setItemWidth(width + gap);
        }
      }
    };

    // Update on mount
    updateItemWidth();

    // Update on window resize
    window.addEventListener('resize', updateItemWidth);

    // Use ResizeObserver for more accurate updates
    const resizeObserver = new ResizeObserver(updateItemWidth);
    if (scrollContainerRef.current) {
      resizeObserver.observe(scrollContainerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateItemWidth);
      resizeObserver.disconnect();
    };
  }, [gap]);

  const scrollToItem = useCallback(
    (direction: 'left' | 'right') => {
      if (scrollContainerRef.current) {
        const scrollLeft = scrollContainerRef.current.scrollLeft;
        const offset = direction === 'left' ? -itemWidth : itemWidth;

        // Find the nearest item index
        const nearestIndex = Math.round(scrollLeft / itemWidth);
        const newScrollPosition = nearestIndex * itemWidth + offset;

        // Scroll to the nearest item position
        scrollContainerRef.current.scrollTo({
          left: newScrollPosition,
          behavior: 'smooth',
        });
      }
    },
    [itemWidth]
  );

  const handleScrollLeft = useCallback(() => scrollToItem('left'), [scrollToItem]);
  const handleScrollRight = useCallback(() => scrollToItem('right'), [scrollToItem]);

  return {
    scrollContainerRef,
    scrollToItem,
    handleScrollLeft,
    handleScrollRight,
  };
}

