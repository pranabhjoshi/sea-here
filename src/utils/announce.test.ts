/**
 * Tests for announce utility
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  announce,
  announceSpeciesLoaded,
  announceLoading,
  announceError,
  announceModalOpened,
  announceModalClosed,
  initializeAriaLiveRegion,
  cleanupAriaLiveRegion,
} from './announce';

describe('announce utility', () => {
  beforeEach(() => {
    // Clean up any existing aria-live region
    cleanupAriaLiveRegion();
    
    // Clear any existing timers
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanupAriaLiveRegion();
    vi.useRealTimers();
  });

  describe('initializeAriaLiveRegion', () => {
    it('creates aria-live region with correct attributes', () => {
      initializeAriaLiveRegion();
      
      const region = document.querySelector('[aria-live="polite"]');
      expect(region).toBeInTheDocument();
      expect(region).toHaveAttribute('aria-live', 'polite');
      expect(region).toHaveAttribute('aria-atomic', 'true');
      expect(region).toHaveClass('visually-hidden');
    });

    it('does not create duplicate regions', () => {
      initializeAriaLiveRegion();
      initializeAriaLiveRegion();
      
      const regions = document.querySelectorAll('[aria-live="polite"]');
      expect(regions).toHaveLength(1);
    });
  });

  describe('announce', () => {
    it('creates aria-live region if not exists', () => {
      announce('Test message');
      
      const region = document.querySelector('[aria-live="polite"]');
      expect(region).toBeInTheDocument();
    });

    it('sets message content after delay', () => {
      announce('Test message');
      
      const region = document.querySelector('[aria-live="polite"]');
      expect(region?.textContent).toBe('');
      
      // Fast-forward past the initial delay
      vi.advanceTimersByTime(150);
      expect(region?.textContent).toBe('Test message');
    });

    it('clears message after timeout', () => {
      announce('Test message');
      
      const region = document.querySelector('[aria-live="polite"]');
      
      // Fast-forward past initial delay
      vi.advanceTimersByTime(150);
      expect(region?.textContent).toBe('Test message');
      
      // Fast-forward past clear timeout
      vi.advanceTimersByTime(5000);
      expect(region?.textContent).toBe('');
    });

    it('handles assertive priority', () => {
      announce('Urgent message', 'assertive');
      
      const region = document.querySelector('[aria-live="assertive"]');
      expect(region).toBeInTheDocument();
    });

    it('ignores empty messages', () => {
      announce('');
      announce('   ');
      
      const region = document.querySelector('[aria-live]');
      expect(region).toBeNull();
    });

    it('updates priority when changed', () => {
      announce('First message', 'polite');
      const region = document.querySelector('[aria-live]');
      expect(region).toHaveAttribute('aria-live', 'polite');
      
      announce('Second message', 'assertive');
      expect(region).toHaveAttribute('aria-live', 'assertive');
    });
  });

  describe('announceSpeciesLoaded', () => {
    it('announces species loaded message', () => {
      announceSpeciesLoaded('Sea Otter');
      
      vi.advanceTimersByTime(150);
      const region = document.querySelector('[aria-live]');
      expect(region?.textContent).toBe('Sea Otter species information loaded');
    });
  });

  describe('announceLoading', () => {
    it('announces loading message', () => {
      announceLoading();
      
      vi.advanceTimersByTime(150);
      const region = document.querySelector('[aria-live]');
      expect(region?.textContent).toBe('Loading species information');
    });
  });

  describe('announceError', () => {
    it('announces error with assertive priority', () => {
      announceError('Network error');
      
      const region = document.querySelector('[aria-live="assertive"]');
      expect(region).toBeInTheDocument();
      
      vi.advanceTimersByTime(150);
      expect(region?.textContent).toBe('Network error');
    });

    it('announces generic error when no message provided', () => {
      announceError();
      
      vi.advanceTimersByTime(150);
      const region = document.querySelector('[aria-live]');
      expect(region?.textContent).toBe('Failed to load species information');
    });
  });

  describe('announceModalOpened', () => {
    it('announces modal opened message', () => {
      announceModalOpened('Giant Pacific Octopus');
      
      vi.advanceTimersByTime(150);
      const region = document.querySelector('[aria-live]');
      expect(region?.textContent).toBe('Giant Pacific Octopus information dialog opened');
    });
  });

  describe('announceModalClosed', () => {
    it('announces modal closed message', () => {
      announceModalClosed();
      
      vi.advanceTimersByTime(150);
      const region = document.querySelector('[aria-live]');
      expect(region?.textContent).toBe('Species information dialog closed');
    });
  });

  describe('cleanupAriaLiveRegion', () => {
    it('removes aria-live region from DOM', () => {
      initializeAriaLiveRegion();
      expect(document.querySelector('[aria-live]')).toBeInTheDocument();
      
      cleanupAriaLiveRegion();
      expect(document.querySelector('[aria-live]')).toBeNull();
    });

    it('handles cleanup when no region exists', () => {
      expect(() => cleanupAriaLiveRegion()).not.toThrow();
    });
  });

  describe('console warnings', () => {
    it('warns when aria-live region creation fails', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Mock document.body.appendChild to fail
      const originalAppendChild = document.body.appendChild;
      document.body.appendChild = vi.fn().mockImplementation(() => {
        throw new Error('Failed to append');
      });
      
      // The error should be caught and a warning should be logged
      expect(() => announce('Test message')).not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create aria-live region');
      
      // Restore original method
      document.body.appendChild = originalAppendChild;
      consoleSpy.mockRestore();
    });
  });
});
