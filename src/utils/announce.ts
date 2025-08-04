/**
 * Announce utility for posting messages to aria-live regions
 * Provides screen reader announcements for dynamic content changes
 */

// Global aria-live region element
let ariaLiveRegion: HTMLElement | null = null;

/**
 * Initialize the global aria-live region
 * This should be called once when the app starts
 */
export function initializeAriaLiveRegion(): void {
  if (ariaLiveRegion) return; // Already initialized

  try {
    ariaLiveRegion = document.createElement('div');
    ariaLiveRegion.setAttribute('aria-live', 'polite');
    ariaLiveRegion.setAttribute('aria-atomic', 'true');
    ariaLiveRegion.className = 'visually-hidden';
    ariaLiveRegion.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;

    document.body.appendChild(ariaLiveRegion);
  } catch (error) {
    console.warn('Failed to create aria-live region');
    ariaLiveRegion = null;
  }
}

/**
 * Announce a message to screen readers via aria-live region
 * @param message - The message to announce
 * @param priority - The aria-live priority ('polite' or 'assertive')
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  if (!message.trim()) return;

  // Initialize if not already done
  if (!ariaLiveRegion) {
    initializeAriaLiveRegion();
  }

  if (!ariaLiveRegion) {
    console.warn('Failed to create aria-live region');
    return;
  }

  // Update the aria-live priority if needed
  if (ariaLiveRegion.getAttribute('aria-live') !== priority) {
    ariaLiveRegion.setAttribute('aria-live', priority);
  }

  // Clear previous message first to ensure the new one is announced
  ariaLiveRegion.textContent = '';

  // Use a small delay to ensure screen readers pick up the change
  setTimeout(() => {
    if (ariaLiveRegion) {
      ariaLiveRegion.textContent = message;
    }
  }, 100);

  // Clear the message after a reasonable time to prevent clutter
  setTimeout(() => {
    if (ariaLiveRegion && ariaLiveRegion.textContent === message) {
      ariaLiveRegion.textContent = '';
    }
  }, 5000);
}

/**
 * Announce species information loaded
 * @param speciesName - Name of the species that was loaded
 */
export function announceSpeciesLoaded(speciesName: string): void {
  announce(`${speciesName} species information loaded`);
}

/**
 * Announce loading state
 */
export function announceLoading(): void {
  announce('Loading species information');
}

/**
 * Announce error state
 * @param error - Error message or generic error
 */
export function announceError(error?: string): void {
  const message = error || 'Failed to load species information';
  announce(message, 'assertive');
}

/**
 * Announce modal opened
 * @param speciesName - Name of the species
 */
export function announceModalOpened(speciesName: string): void {
  announce(`${speciesName} information dialog opened`);
}

/**
 * Announce modal closed
 */
export function announceModalClosed(): void {
  announce('Species information dialog closed');
}

/**
 * Clean up the aria-live region (useful for testing)
 */
export function cleanupAriaLiveRegion(): void {
  if (ariaLiveRegion && ariaLiveRegion.parentNode) {
    ariaLiveRegion.parentNode.removeChild(ariaLiveRegion);
    ariaLiveRegion = null;
  }
}
