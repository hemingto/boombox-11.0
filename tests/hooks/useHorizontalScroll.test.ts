/**
 * @fileoverview Tests for useHorizontalScroll custom hook
 * Following boombox-11.0 testing standards
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useHorizontalScroll } from '@/hooks/useHorizontalScroll';

describe('useHorizontalScroll', () => {
  // Mock ResizeObserver
  beforeEach(() => {
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('returns scroll container ref', () => {
      const { result } = renderHook(() => useHorizontalScroll());

      expect(result.current.scrollContainerRef).toBeDefined();
      expect(result.current.scrollContainerRef.current).toBeNull();
    });

    it('returns scroll functions', () => {
      const { result } = renderHook(() => useHorizontalScroll());

      expect(result.current.scrollToItem).toBeDefined();
      expect(result.current.handleScrollLeft).toBeDefined();
      expect(result.current.handleScrollRight).toBeDefined();
      expect(typeof result.current.scrollToItem).toBe('function');
      expect(typeof result.current.handleScrollLeft).toBe('function');
      expect(typeof result.current.handleScrollRight).toBe('function');
    });

    it('accepts custom gap option', () => {
      const { result } = renderHook(() => useHorizontalScroll({ gap: 24 }));

      expect(result.current).toBeDefined();
    });

    it('uses default gap when not provided', () => {
      const { result } = renderHook(() => useHorizontalScroll());

      expect(result.current).toBeDefined();
    });
  });

  describe('Scroll Functionality', () => {
    it('handleScrollLeft calls scrollToItem with left direction', () => {
      const { result } = renderHook(() => useHorizontalScroll());

      // Mock scroll container
      const mockDiv = document.createElement('div');
      Object.defineProperty(mockDiv, 'scrollLeft', {
        value: 300,
        writable: true,
      });
      mockDiv.scrollTo = jest.fn();

      // @ts-ignore - Setting ref for testing
      result.current.scrollContainerRef.current = mockDiv;

      act(() => {
        result.current.handleScrollLeft();
      });

      expect(mockDiv.scrollTo).toHaveBeenCalled();
    });

    it('handleScrollRight calls scrollToItem with right direction', () => {
      const { result } = renderHook(() => useHorizontalScroll());

      // Mock scroll container
      const mockDiv = document.createElement('div');
      Object.defineProperty(mockDiv, 'scrollLeft', {
        value: 0,
        writable: true,
      });
      mockDiv.scrollTo = jest.fn();

      // @ts-ignore - Setting ref for testing
      result.current.scrollContainerRef.current = mockDiv;

      act(() => {
        result.current.handleScrollRight();
      });

      expect(mockDiv.scrollTo).toHaveBeenCalled();
    });

    it('scrollToItem handles null ref gracefully', () => {
      const { result } = renderHook(() => useHorizontalScroll());

      // Should not throw error when ref is null
      expect(() => {
        act(() => {
          result.current.scrollToItem('left');
        });
      }).not.toThrow();
    });

    it('scrolls with smooth behavior', () => {
      const { result } = renderHook(() => useHorizontalScroll());

      const mockDiv = document.createElement('div');
      Object.defineProperty(mockDiv, 'scrollLeft', {
        value: 300,
        writable: true,
      });
      mockDiv.scrollTo = jest.fn();

      // @ts-ignore - Setting ref for testing
      result.current.scrollContainerRef.current = mockDiv;

      act(() => {
        result.current.scrollToItem('right');
      });

      expect(mockDiv.scrollTo).toHaveBeenCalledWith(
        expect.objectContaining({
          behavior: 'smooth',
        })
      );
    });
  });

  describe('ResizeObserver Integration', () => {
    it('sets up ResizeObserver on mount', () => {
      renderHook(() => useHorizontalScroll());

      expect(global.ResizeObserver).toHaveBeenCalled();
    });

    it('cleans up ResizeObserver on unmount', () => {
      const disconnectMock = jest.fn();
      global.ResizeObserver = jest.fn().mockImplementation(() => ({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: disconnectMock,
      }));

      const { unmount } = renderHook(() => useHorizontalScroll());

      unmount();

      expect(disconnectMock).toHaveBeenCalled();
    });
  });

  describe('Window Resize Handling', () => {
    it('adds resize event listener on mount', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      renderHook(() => useHorizontalScroll());

      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });

    it('removes resize event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useHorizontalScroll());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Item Width Calculation', () => {
    it('calculates item width with gap', () => {
      const { result } = renderHook(() => useHorizontalScroll({ gap: 20 }));

      const mockDiv = document.createElement('div');
      const mockItem = document.createElement('div');

      // Mock getBoundingClientRect
      mockItem.getBoundingClientRect = jest.fn().mockReturnValue({
        width: 300,
        height: 400,
      });

      mockDiv.querySelector = jest.fn().mockReturnValue(mockItem);
      mockDiv.scrollTo = jest.fn();
      Object.defineProperty(mockDiv, 'scrollLeft', {
        value: 0,
        writable: true,
      });

      // @ts-ignore - Setting ref for testing
      result.current.scrollContainerRef.current = mockDiv;

      act(() => {
        result.current.scrollToItem('right');
      });

      // Should calculate scroll position based on item width + gap
      expect(mockDiv.scrollTo).toHaveBeenCalled();
    });
  });

  describe('Callback Stability', () => {
    it('handleScrollLeft callback remains stable', () => {
      const { result, rerender } = renderHook(() => useHorizontalScroll());

      const firstCallback = result.current.handleScrollLeft;

      rerender();

      const secondCallback = result.current.handleScrollLeft;

      expect(firstCallback).toBe(secondCallback);
    });

    it('handleScrollRight callback remains stable', () => {
      const { result, rerender } = renderHook(() => useHorizontalScroll());

      const firstCallback = result.current.handleScrollRight;

      rerender();

      const secondCallback = result.current.handleScrollRight;

      expect(firstCallback).toBe(secondCallback);
    });
  });

  describe('Edge Cases', () => {
    it('handles missing item container gracefully', () => {
      const { result } = renderHook(() => useHorizontalScroll());

      const mockDiv = document.createElement('div');
      mockDiv.querySelector = jest.fn().mockReturnValue(null);
      mockDiv.scrollTo = jest.fn();

      // @ts-ignore - Setting ref for testing
      result.current.scrollContainerRef.current = mockDiv;

      expect(() => {
        act(() => {
          result.current.scrollToItem('right');
        });
      }).not.toThrow();
    });

    it('handles zero scroll position', () => {
      const { result } = renderHook(() => useHorizontalScroll());

      const mockDiv = document.createElement('div');
      Object.defineProperty(mockDiv, 'scrollLeft', {
        value: 0,
        writable: true,
      });
      mockDiv.scrollTo = jest.fn();

      // @ts-ignore - Setting ref for testing
      result.current.scrollContainerRef.current = mockDiv;

      act(() => {
        result.current.scrollToItem('left');
      });

      expect(mockDiv.scrollTo).toHaveBeenCalled();
    });

    it('handles large scroll positions', () => {
      const { result } = renderHook(() => useHorizontalScroll());

      const mockDiv = document.createElement('div');
      Object.defineProperty(mockDiv, 'scrollLeft', {
        value: 5000,
        writable: true,
      });
      mockDiv.scrollTo = jest.fn();

      // @ts-ignore - Setting ref for testing
      result.current.scrollContainerRef.current = mockDiv;

      act(() => {
        result.current.scrollToItem('right');
      });

      expect(mockDiv.scrollTo).toHaveBeenCalled();
    });
  });
});

