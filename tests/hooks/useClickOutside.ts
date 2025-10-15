/**
 * @fileoverview Tests for useClickOutside hook
 */
import { renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';

describe('useClickOutside', () => {
  let container: HTMLDivElement;
  let element: HTMLDivElement;

  beforeEach(() => {
    // Create a container and an element
    container = document.createElement('div');
    element = document.createElement('div');
    container.appendChild(element);
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('calls handler when clicking outside the element', () => {
    const handler = jest.fn();
    const ref = { current: element };

    renderHook(() => useClickOutside(ref, handler));

    // Click outside the element
    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);
    
    const mouseEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
    });
    outsideElement.dispatchEvent(mouseEvent);

    expect(handler).toHaveBeenCalledTimes(1);
    document.body.removeChild(outsideElement);
  });

  it('does not call handler when clicking inside the element', () => {
    const handler = jest.fn();
    const ref = { current: element };

    renderHook(() => useClickOutside(ref, handler));

    // Click inside the element
    const mouseEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
    });
    element.dispatchEvent(mouseEvent);

    expect(handler).not.toHaveBeenCalled();
  });

  it('handles touch events', () => {
    const handler = jest.fn();
    const ref = { current: element };

    renderHook(() => useClickOutside(ref, handler));

    // Touch outside the element
    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);
    
    const touchEvent = new TouchEvent('touchstart', {
      bubbles: true,
      cancelable: true,
    });
    outsideElement.dispatchEvent(touchEvent);

    expect(handler).toHaveBeenCalledTimes(1);
    document.body.removeChild(outsideElement);
  });

  it('does not call handler when disabled', () => {
    const handler = jest.fn();
    const ref = { current: element };

    renderHook(() => useClickOutside(ref, handler, false));

    // Click outside the element
    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);
    
    const mouseEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
    });
    outsideElement.dispatchEvent(mouseEvent);

    expect(handler).not.toHaveBeenCalled();
    document.body.removeChild(outsideElement);
  });

  it('does not call handler when ref is null', () => {
    const handler = jest.fn();
    const ref = { current: null };

    renderHook(() => useClickOutside(ref, handler));

    // Click anywhere
    const mouseEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
    });
    document.body.dispatchEvent(mouseEvent);

    expect(handler).not.toHaveBeenCalled();
  });

  it('cleans up event listeners on unmount', () => {
    const handler = jest.fn();
    const ref = { current: element };
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() => useClickOutside(ref, handler));

    // Verify listeners were added
    expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));

    // Unmount and verify cleanup
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('updates handler when dependencies change', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    const ref = { current: element };

    const { rerender } = renderHook(
      ({ handler }) => useClickOutside(ref, handler),
      { initialProps: { handler: handler1 } }
    );

    // Click outside with first handler
    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);
    
    let mouseEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
    });
    outsideElement.dispatchEvent(mouseEvent);

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).not.toHaveBeenCalled();

    // Update to second handler
    rerender({ handler: handler2 });

    // Click outside with second handler
    mouseEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
    });
    outsideElement.dispatchEvent(mouseEvent);

    expect(handler1).toHaveBeenCalledTimes(1); // Still 1
    expect(handler2).toHaveBeenCalledTimes(1); // Now called

    document.body.removeChild(outsideElement);
  });
});
