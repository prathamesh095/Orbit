/**
 * Accessibility Utilities
 * Helpers for focus management, ARIA, and keyboard navigation
 */

/**
 * Focus management helpers
 */
export const focusManagement = {
  /**
   * Get all focusable elements within a container
   */
  getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    return Array.from(container.querySelectorAll<HTMLElement>(selector));
  },

  /**
   * Focus the first focusable element in a container
   */
  focusFirst(container: HTMLElement): boolean {
    const elements = this.getFocusableElements(container);
    if (elements.length > 0) {
      elements[0].focus();
      return true;
    }
    return false;
  },

  /**
   * Focus the last focusable element in a container
   */
  focusLast(container: HTMLElement): boolean {
    const elements = this.getFocusableElements(container);
    if (elements.length > 0) {
      elements[elements.length - 1].focus();
      return true;
    }
    return false;
  },

  /**
   * Create a focus trap for a modal/dialog
   */
  createFocusTrap(container: HTMLElement, onEscape?: () => void) {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        onEscape();
        return;
      }

      if (e.key !== 'Tab') return;

      const elements = this.getFocusableElements(container);
      if (elements.length === 0) return;

      const currentIndex = elements.indexOf(document.activeElement as HTMLElement);
      let nextIndex = currentIndex;

      if (e.shiftKey) {
        // Shift + Tab: go backward
        nextIndex = currentIndex <= 0 ? elements.length - 1 : currentIndex - 1;
      } else {
        // Tab: go forward
        nextIndex = currentIndex >= elements.length - 1 ? 0 : currentIndex + 1;
      }

      e.preventDefault();
      elements[nextIndex].focus();
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  },
};

/**
 * ARIA helpers
 */
export const aria = {
  /**
   * Set aria-label with fallback
   */
  setLabel(element: HTMLElement, label: string | undefined, fallback?: string) {
    if (label) {
      element.setAttribute('aria-label', label);
    } else if (fallback) {
      element.setAttribute('aria-label', fallback);
    } else {
      element.removeAttribute('aria-label');
    }
  },

  /**
   * Set aria-describedby
   */
  setDescription(element: HTMLElement, id: string | undefined) {
    if (id) {
      element.setAttribute('aria-describedby', id);
    } else {
      element.removeAttribute('aria-describedby');
    }
  },

  /**
   * Set aria-invalid for form validation
   */
  setInvalid(element: HTMLElement, invalid: boolean) {
    if (invalid) {
      element.setAttribute('aria-invalid', 'true');
    } else {
      element.setAttribute('aria-invalid', 'false');
    }
  },

  /**
   * Create a live region for announcements
   */
  createLiveRegion(message: string, politeness: 'polite' | 'assertive' = 'polite') {
    const region = document.createElement('div');
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', politeness);
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';
    region.textContent = message;
    document.body.appendChild(region);

    // Remove after announcement
    setTimeout(() => region.remove(), 1000);
  },

  /**
   * Announce a message to screen readers
   */
  announce(message: string, politeness: 'polite' | 'assertive' = 'polite') {
    this.createLiveRegion(message, politeness);
  },
};

/**
 * Keyboard navigation helpers
 */
export const keyboard = {
  /**
   * Check if a key event is for navigation
   */
  isNavigationKey(key: string): boolean {
    return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key);
  },

  /**
   * Check if a key event is for activation
   */
  isActivationKey(key: string): boolean {
    return ['Enter', ' '].includes(key);
  },

  /**
   * Check if a key event is for escape
   */
  isEscapeKey(key: string): boolean {
    return key === 'Escape';
  },

  /**
   * Handle keyboard navigation in a list
   */
  handleListNavigation(
    event: React.KeyboardEvent<HTMLElement>,
    items: HTMLElement[],
    currentIndex: number,
    loop: boolean = true
  ): number {
    const key = event.key;
    let nextIndex = currentIndex;

    if (key === 'ArrowDown' || key === 'ArrowRight') {
      nextIndex = currentIndex + 1;
      if (nextIndex >= items.length) {
        nextIndex = loop ? 0 : currentIndex;
      }
    } else if (key === 'ArrowUp' || key === 'ArrowLeft') {
      nextIndex = currentIndex - 1;
      if (nextIndex < 0) {
        nextIndex = loop ? items.length - 1 : currentIndex;
      }
    } else if (key === 'Home') {
      nextIndex = 0;
    } else if (key === 'End') {
      nextIndex = items.length - 1;
    }

    if (nextIndex !== currentIndex) {
      event.preventDefault();
      items[nextIndex]?.focus();
    }

    return nextIndex;
  },
};

/**
 * Color contrast helpers
 */
export const contrast = {
  /**
   * Calculate relative luminance of a color (for WCAG)
   */
  getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  /**
   * Calculate contrast ratio between two colors
   * Returns ratio between 1:1 (same color) and 21:1 (maximum contrast)
   */
  getContrastRatio(rgb1: [number, number, number], rgb2: [number, number, number]): number {
    const lum1 = this.getLuminance(...rgb1);
    const lum2 = this.getLuminance(...rgb2);
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
  },

  /**
   * Check if contrast ratio meets WCAG AA standard (4.5:1 for normal text)
   */
  meetsWCAGAA(ratio: number, largeText: boolean = false): boolean {
    return largeText ? ratio >= 3 : ratio >= 4.5;
  },

  /**
   * Check if contrast ratio meets WCAG AAA standard (7:1 for normal text)
   */
  meetsWCAGAAA(ratio: number, largeText: boolean = false): boolean {
    return largeText ? ratio >= 4.5 : ratio >= 7;
  },
};

/**
 * Skip link helper for keyboard navigation
 */
export function createSkipLink(targetSelector: string, label: string = 'Skip to main content') {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetSelector}`;
  skipLink.textContent = label;
  skipLink.className =
    'fixed top-0 left-0 px-4 py-2 bg-blue-apple text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 -translate-y-full focus-visible:translate-y-0 z-tooltip transition-transform';

  document.body.insertBefore(skipLink, document.body.firstChild);
}

export default {
  focusManagement,
  aria,
  keyboard,
  contrast,
  createSkipLink,
};
