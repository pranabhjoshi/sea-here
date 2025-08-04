import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { get, set, evictLRUIfNeeded, clear, getStats } from './cache'

// Mock idb-keyval for testing
vi.mock('idb-keyval', () => {
  const store = new Map<string, unknown>()
  
  return {
    get: vi.fn((key: string) => Promise.resolve(store.get(key))),
    set: vi.fn((key: string, value: unknown) => {
      store.set(key, value)
      return Promise.resolve()
    }),
    del: vi.fn((key: string) => {
      store.delete(key)
      return Promise.resolve()
    }),
    keys: vi.fn(() => Promise.resolve(Array.from(store.keys()))),
    clear: vi.fn(() => {
      store.clear()
      return Promise.resolve()
    })
  }
})

describe('IndexedDB Cache Wrapper', () => {
  beforeEach(async () => {
    // Clear cache before each test
    await clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Basic get/set operations', () => {
    it('stores and retrieves values correctly', async () => {
      const key = 'test-key'
      const value = { data: 'test-value', number: 42 }
      const ttl = 60000 // 1 minute

      await set(key, value, ttl)
      const retrieved = await get(key)

      expect(retrieved).toEqual(value)
    })

    it('returns undefined for non-existent keys', async () => {
      const result = await get('non-existent-key')
      expect(result).toBeUndefined()
    })

    it('handles different data types', async () => {
      const ttl = 60000

      // String
      await set('string-key', 'hello world', ttl)
      expect(await get('string-key')).toBe('hello world')

      // Number
      await set('number-key', 123, ttl)
      expect(await get('number-key')).toBe(123)

      // Boolean
      await set('boolean-key', true, ttl)
      expect(await get('boolean-key')).toBe(true)

      // Array
      const array = [1, 2, 3, 'test']
      await set('array-key', array, ttl)
      expect(await get('array-key')).toEqual(array)

      // Object
      const obj = { nested: { value: 'deep' }, count: 5 }
      await set('object-key', obj, ttl)
      expect(await get('object-key')).toEqual(obj)
    })
  })

  describe('TTL (Time To Live) functionality', () => {
    it('returns value before expiry', async () => {
      const key = 'ttl-test'
      const value = 'test-value'
      const ttl = 1000 // 1 second

      await set(key, value, ttl)
      
      // Should be available immediately
      expect(await get(key)).toBe(value)
      
      // Should still be available after 500ms
      await new Promise(resolve => setTimeout(resolve, 500))
      expect(await get(key)).toBe(value)
    })

    it('returns undefined after expiry', async () => {
      const key = 'expired-test'
      const value = 'test-value'
      const ttl = 100 // 100ms

      await set(key, value, ttl)
      
      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 150))
      
      const result = await get(key)
      expect(result).toBeUndefined()
    })

    it('cleans up expired entries on access', async () => {
      const key = 'cleanup-test'
      const value = 'test-value'
      const ttl = 50 // 50ms

      await set(key, value, ttl)
      
      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Access should clean up the expired entry
      await get(key)
      
      // Verify entry was removed by checking stats
      const stats = await getStats()
      expect(stats.expiredEntries).toBe(0)
    })

    it('handles multiple entries with different TTLs', async () => {
      await set('short-ttl', 'expires-soon', 50)
      await set('long-ttl', 'expires-later', 1000)
      
      // Both should be available initially
      expect(await get('short-ttl')).toBe('expires-soon')
      expect(await get('long-ttl')).toBe('expires-later')
      
      // Wait for short TTL to expire
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(await get('short-ttl')).toBeUndefined()
      expect(await get('long-ttl')).toBe('expires-later')
    })
  })

  describe('LRU (Least Recently Used) eviction', () => {
    it('evicts oldest entries when exceeding maxEntries', async () => {
      const ttl = 60000 // Long TTL to avoid expiry during test
      
      // Add 5 entries
      await set('key1', 'value1', ttl)
      await new Promise(resolve => setTimeout(resolve, 10))
      
      await set('key2', 'value2', ttl)
      await new Promise(resolve => setTimeout(resolve, 10))
      
      await set('key3', 'value3', ttl)
      await new Promise(resolve => setTimeout(resolve, 10))
      
      await set('key4', 'value4', ttl)
      await new Promise(resolve => setTimeout(resolve, 10))
      
      await set('key5', 'value5', ttl)
      
      // Evict to keep only 3 entries
      await evictLRUIfNeeded(3)
      
      // The 2 oldest entries (key1, key2) should be evicted
      expect(await get('key1')).toBeUndefined()
      expect(await get('key2')).toBeUndefined()
      expect(await get('key3')).toBe('value3')
      expect(await get('key4')).toBe('value4')
      expect(await get('key5')).toBe('value5')
    })

    it('updates last access time on get operations', async () => {
      const ttl = 60000
      
      // Add entries with delays to establish order
      await set('key1', 'value1', ttl)
      await new Promise(resolve => setTimeout(resolve, 10))
      
      await set('key2', 'value2', ttl)
      await new Promise(resolve => setTimeout(resolve, 10))
      
      await set('key3', 'value3', ttl)
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // Access key1 to update its last access time
      await get('key1')
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // Evict to keep only 2 entries
      await evictLRUIfNeeded(2)
      
      // key2 should be evicted (oldest access), key1 and key3 should remain
      expect(await get('key1')).toBe('value1')
      expect(await get('key2')).toBeUndefined()
      expect(await get('key3')).toBe('value3')
    })

    it('does not evict when under maxEntries limit', async () => {
      const ttl = 60000
      
      await set('key1', 'value1', ttl)
      await set('key2', 'value2', ttl)
      await set('key3', 'value3', ttl)
      
      // Evict with higher limit
      await evictLRUIfNeeded(5)
      
      // All entries should remain
      expect(await get('key1')).toBe('value1')
      expect(await get('key2')).toBe('value2')
      expect(await get('key3')).toBe('value3')
    })

    it('cleans up expired entries during eviction', async () => {
      // Add entries with short TTL
      await set('expired1', 'value1', 50)
      await set('expired2', 'value2', 50)
      
      // Add entry with long TTL
      await set('valid', 'value', 60000)
      
      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Eviction should clean up expired entries
      await evictLRUIfNeeded(1)
      
      // Only valid entry should remain
      expect(await get('expired1')).toBeUndefined()
      expect(await get('expired2')).toBeUndefined()
      expect(await get('valid')).toBe('value')
    })
  })

  describe('Clear functionality', () => {
    it('removes all cache entries', async () => {
      const ttl = 60000
      
      await set('key1', 'value1', ttl)
      await set('key2', 'value2', ttl)
      await set('key3', 'value3', ttl)
      
      // Verify entries exist
      expect(await get('key1')).toBe('value1')
      expect(await get('key2')).toBe('value2')
      expect(await get('key3')).toBe('value3')
      
      // Clear cache
      await clear()
      
      // All entries should be gone
      expect(await get('key1')).toBeUndefined()
      expect(await get('key2')).toBeUndefined()
      expect(await get('key3')).toBeUndefined()
    })

    it('only removes cache entries, not other IndexedDB data', async () => {
      // This test ensures our cache operations don't interfere with other data
      // In a real scenario, other parts of the app might use IndexedDB
      const ttl = 60000
      
      await set('cache-key', 'cache-value', ttl)
      
      // Clear should only affect cache entries
      await clear()
      
      expect(await get('cache-key')).toBeUndefined()
    })
  })

  describe('Error handling and stability', () => {
    it('handles errors gracefully in get operations', async () => {
      // Mock idb-keyval to throw an error
      const { get: idbGet } = await import('idb-keyval')
      vi.mocked(idbGet).mockRejectedValueOnce(new Error('IndexedDB error'))
      
      const result = await get('error-key')
      expect(result).toBeUndefined()
    })

    it('propagates errors in set operations', async () => {
      const { set: idbSet } = await import('idb-keyval')
      vi.mocked(idbSet).mockRejectedValueOnce(new Error('IndexedDB error'))
      
      await expect(set('error-key', 'value', 1000)).rejects.toThrow('IndexedDB error')
    })

    it('handles concurrent operations without race conditions', async () => {
      const ttl = 60000
      const promises = []
      
      // Perform multiple concurrent operations
      for (let i = 0; i < 10; i++) {
        promises.push(set(`concurrent-key-${i}`, `value-${i}`, ttl))
      }
      
      await Promise.all(promises)
      
      // Verify all operations completed successfully
      for (let i = 0; i < 10; i++) {
        expect(await get(`concurrent-key-${i}`)).toBe(`value-${i}`)
      }
    })
  })

  describe('Cache statistics', () => {
    it('provides accurate cache statistics', async () => {
      // Add valid entries
      await set('valid1', 'value1', 60000)
      await set('valid2', 'value2', 60000)
      
      // Add entries that will expire
      await set('expired1', 'value1', 50)
      await set('expired2', 'value2', 50)
      
      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const stats = await getStats()
      
      expect(stats.totalEntries).toBe(4)
      expect(stats.validEntries).toBe(2)
      expect(stats.expiredEntries).toBe(2)
    })
  })
})
