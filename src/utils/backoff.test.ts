/**
 * Tests for backoff utility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withBackoff, createBackoff } from './backoff';

describe('Backoff Utility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('withBackoff', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');

      const result = await withBackoff(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');

      const promise = withBackoff(operation, { maxRetries: 2 });

      // Fast-forward through delays
      await vi.runAllTimersAsync();

      const result = await promise;

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should throw last error after max retries', async () => {
      const finalError = new Error('final failure');
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockRejectedValue(finalError);

      const promise = withBackoff(operation, { maxRetries: 2 });

      // Fast-forward through delays
      await vi.runAllTimersAsync();
      
      await expect(promise).rejects.toThrow('final failure');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should use exponential backoff delays', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');

      const promise = withBackoff(operation, { 
        maxRetries: 2, 
        baseDelayMs: 100 
      });

      // First call fails immediately
      await vi.advanceTimersByTimeAsync(0);
      expect(operation).toHaveBeenCalledTimes(1);

      // Wait for first backoff (100ms)
      await vi.advanceTimersByTimeAsync(100);
      expect(operation).toHaveBeenCalledTimes(2);

      // Wait for second backoff (200ms)
      await vi.advanceTimersByTimeAsync(200);
      expect(operation).toHaveBeenCalledTimes(3);

      const result = await promise;
      expect(result).toBe('success');
    });

    it('should respect maxDelayMs', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');

      const promise = withBackoff(operation, { 
        maxRetries: 2, 
        baseDelayMs: 1000,
        maxDelayMs: 500 
      });

      // First call fails immediately
      await vi.advanceTimersByTimeAsync(0);
      expect(operation).toHaveBeenCalledTimes(1);

      // Wait for first backoff (should be capped at 500ms, not 1000ms)
      await vi.advanceTimersByTimeAsync(500);
      expect(operation).toHaveBeenCalledTimes(2);

      // Wait for second backoff (should be capped at 500ms, not 2000ms)
      await vi.advanceTimersByTimeAsync(500);
      expect(operation).toHaveBeenCalledTimes(3);

      const result = await promise;
      expect(result).toBe('success');
    });

    it('should handle non-Error exceptions', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce('string error')
        .mockRejectedValueOnce(42)
        .mockRejectedValue(null);

      const promise = withBackoff(operation, { maxRetries: 2 });

      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow('null');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should use default options when none provided', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockRejectedValue(new Error('final fail'));

      const promise = withBackoff(operation);

      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow('final fail');
      expect(operation).toHaveBeenCalledTimes(3); // 1 + 2 retries (default)
    });
  });

  describe('createBackoff', () => {
    it('should create a backoff function with pre-configured options', async () => {
      const backoff = createBackoff({ maxRetries: 1, baseDelayMs: 50 });
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');

      const promise = backoff(operation);

      await vi.runAllTimersAsync();

      const result = await promise;

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should work with default options', async () => {
      const backoff = createBackoff();
      const operation = vi.fn().mockResolvedValue('immediate success');

      const result = await backoff(operation);

      expect(result).toBe('immediate success');
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });
});
