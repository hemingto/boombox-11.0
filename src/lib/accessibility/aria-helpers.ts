/**
 * @fileoverview ARIA helper utilities for accessibility
 * Consistent patterns for ARIA attributes, focus management, and screen reader support
 */

/**
 * Generate unique IDs for ARIA relationships
 */
export function generateAriaId(prefix: string = 'aria'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * ARIA label helpers for common patterns
 */
export const ariaLabels = {
  /**
   * Loading state labels
   */
  loading: {
    'aria-live': 'polite' as const,
    'aria-busy': true,
    'aria-label': 'Loading content',
  },
  
  /**
   * Error state labels
   */
  error: {
    'aria-live': 'assertive' as const,
    role: 'alert' as const,
  },
  
  /**
   * Success state labels
   */
  success: {
    'aria-live': 'polite' as const,
    role: 'status' as const,
  },
  
  /**
   * Form field labels
   */
  required: {
    'aria-required': true,
  },
  
  invalid: {
    'aria-invalid': true,
  },
  
  /**
   * Navigation labels
   */
  skipLink: {
    'aria-label': 'Skip to main content',
  },
  
  breadcrumb: {
    'aria-label': 'Breadcrumb navigation',
  },
  
  /**
   * Modal/Dialog labels
   */
  modal: {
    role: 'dialog' as const,
    'aria-modal': true,
  },
  
  modalOverlay: {
    'aria-hidden': true,
  },
  
  /**
   * Button labels
   */
  closeButton: {
    'aria-label': 'Close',
  },
  
  menuButton: {
    'aria-haspopup': true,
    'aria-expanded': false,
  },
} as const;

/**
 * Focus management utilities
 */
export const focusHelpers = {
  /**
   * Trap focus within an element
   */
  trapFocus(container: HTMLElement) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };
    
    container.addEventListener('keydown', handleTabKey);
    
    // Focus first element
    firstElement?.focus();
    
    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  },
  
  /**
   * Restore focus to previously focused element
   */
  restoreFocus(previousElement: HTMLElement | null) {
    if (previousElement && typeof previousElement.focus === 'function') {
      previousElement.focus();
    }
  },
  
  /**
   * Move focus to element and announce to screen readers
   */
  announceFocus(element: HTMLElement, message?: string) {
    element.focus();
    
    if (message) {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = message;
      
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }
  },
};

/**
 * Screen reader utilities
 */
export const screenReaderHelpers = {
  /**
   * Create screen reader only text
   */
  createSROnlyText(text: string): HTMLSpanElement {
    const span = document.createElement('span');
    span.className = 'sr-only';
    span.textContent = text;
    return span;
  },
  
  /**
   * Announce message to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },
  
  /**
   * Update screen reader announcement
   */
  updateAnnouncement(element: HTMLElement, message: string) {
    element.textContent = message;
  },
};

/**
 * Keyboard navigation helpers
 */
export const keyboardHelpers = {
  /**
   * Handle arrow key navigation in lists/menus
   */
  handleArrowNavigation(
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    options: {
      loop?: boolean;
      vertical?: boolean;
      horizontal?: boolean;
    } = {}
  ) {
    const { loop = true, vertical = true, horizontal = false } = options;
    let newIndex = currentIndex;
    
    switch (event.key) {
      case 'ArrowDown':
        if (vertical) {
          newIndex = loop && currentIndex === items.length - 1 ? 0 : Math.min(currentIndex + 1, items.length - 1);
          event.preventDefault();
        }
        break;
      case 'ArrowUp':
        if (vertical) {
          newIndex = loop && currentIndex === 0 ? items.length - 1 : Math.max(currentIndex - 1, 0);
          event.preventDefault();
        }
        break;
      case 'ArrowRight':
        if (horizontal) {
          newIndex = loop && currentIndex === items.length - 1 ? 0 : Math.min(currentIndex + 1, items.length - 1);
          event.preventDefault();
        }
        break;
      case 'ArrowLeft':
        if (horizontal) {
          newIndex = loop && currentIndex === 0 ? items.length - 1 : Math.max(currentIndex - 1, 0);
          event.preventDefault();
        }
        break;
      case 'Home':
        newIndex = 0;
        event.preventDefault();
        break;
      case 'End':
        newIndex = items.length - 1;
        event.preventDefault();
        break;
    }
    
    if (newIndex !== currentIndex) {
      items[newIndex]?.focus();
      return newIndex;
    }
    
    return currentIndex;
  },
  
  /**
   * Handle escape key to close modals/dropdowns
   */
  handleEscapeKey(event: KeyboardEvent, callback: () => void) {
    if (event.key === 'Escape') {
      callback();
      event.preventDefault();
    }
  },
};

/**
 * Color contrast utilities
 */
export const contrastHelpers = {
  /**
   * Calculate color contrast ratio
   */
  getContrastRatio(color1: string, color2: string): number {
    const getLuminance = (color: string) => {
      // Convert hex to RGB
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      
      // Calculate relative luminance
      const sRGB = [r, g, b].map(c => {
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      
      return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
    };
    
    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  },
  
  /**
   * Check if color combination meets WCAG standards
   */
  meetsWCAG(color1: string, color2: string, level: 'AA' | 'AAA' = 'AA'): boolean {
    const ratio = this.getContrastRatio(color1, color2);
    return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
  },
}; 