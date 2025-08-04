import { get as idbGet, set as idbSet, del as idbDel, keys as idbKeys, clear as idbClear } from 'idb-keyval'

// Cache entry structure
interface CacheEntry<T = unknown> {
  value: T
  expiresAt: number
  lastAccess: number
}

// Cache key prefix to avoid conflicts
const CACHE_PREFIX = 'sea-here-cache:'

// Helper to create prefixed keys
function getCacheKey(key: string): string {
  return `${CACHE_PREFIX}${key}`
}

// Helper to check if a key is a cache key
function isCacheKey(key: string): boolean {
  return key.startsWith(CACHE_PREFIX)
}

// Helper to extract original key from cache key
function getOriginalKey(cacheKey: string): string {
  return cacheKey.replace(CACHE_PREFIX, '')
}

/**
 * Get a value from the cache
 * Returns undefined if key doesn't exist or has expired
 */
export async function get<T>(key: string): Promise<T | undefined> {
  try {
    const cacheKey = getCacheKey(key)
    const entry = await idbGet<CacheEntry<T>>(cacheKey)
    
    if (!entry) {
      return undefined
    }
    
    const now = Date.now()
    
    // Check if expired
    if (now > entry.expiresAt) {
      // Remove expired entry
      await idbDel(cacheKey)
      return undefined
    }
    
    // Update last access time for LRU
    entry.lastAccess = now
    await idbSet(cacheKey, entry)
    
    return entry.value
  } catch (error) {
    console.error('Cache get error:', error)
    return undefined
  }
}

/**
 * Set a value in the cache with TTL
 */
export async function set<T>(key: string, value: T, ttlMs: number): Promise<void> {
  try {
    const now = Date.now()
    const cacheKey = getCacheKey(key)
    
    const entry: CacheEntry<T> = {
      value,
      expiresAt: now + ttlMs,
      lastAccess: now
    }
    
    await idbSet(cacheKey, entry)
  } catch (error) {
    console.error('Cache set error:', error)
    throw error
  }
}

/**
 * Evict least recently used entries if cache exceeds maxEntries
 */
export async function evictLRUIfNeeded(maxEntries: number): Promise<void> {
  try {
    const allKeys = await idbKeys()
    const cacheKeys = allKeys.filter(key => typeof key === 'string' && isCacheKey(key)) as string[]
    
    if (cacheKeys.length <= maxEntries) {
      return
    }
    
    // Get all cache entries with their last access times
    const entries: Array<{ key: string; lastAccess: number; expiresAt: number }> = []
    
    for (const cacheKey of cacheKeys) {
      const entry = await idbGet<CacheEntry>(cacheKey)
      if (entry) {
        const now = Date.now()
        
        // Skip expired entries (they'll be cleaned up)
        if (now <= entry.expiresAt) {
          entries.push({
            key: cacheKey,
            lastAccess: entry.lastAccess,
            expiresAt: entry.expiresAt
          })
        } else {
          // Clean up expired entry
          await idbDel(cacheKey)
        }
      }
    }
    
    // Sort by last access time (oldest first)
    entries.sort((a, b) => a.lastAccess - b.lastAccess)
    
    // Calculate how many entries to evict
    const entriesToEvict = entries.length - maxEntries
    
    if (entriesToEvict > 0) {
      // Evict the oldest entries
      const keysToEvict = entries.slice(0, entriesToEvict).map(entry => entry.key)
      
      for (const keyToEvict of keysToEvict) {
        await idbDel(keyToEvict)
      }
    }
  } catch (error) {
    console.error('Cache eviction error:', error)
    throw error
  }
}

/**
 * Clear all cache entries
 */
export async function clear(): Promise<void> {
  try {
    const allKeys = await idbKeys()
    const cacheKeys = allKeys.filter(key => typeof key === 'string' && isCacheKey(key)) as string[]
    
    for (const cacheKey of cacheKeys) {
      await idbDel(cacheKey)
    }
  } catch (error) {
    console.error('Cache clear error:', error)
    throw error
  }
}

/**
 * Get cache statistics for debugging
 */
export async function getStats(): Promise<{
  totalEntries: number
  expiredEntries: number
  validEntries: number
}> {
  try {
    const allKeys = await idbKeys()
    const cacheKeys = allKeys.filter(key => typeof key === 'string' && isCacheKey(key)) as string[]
    
    let expiredEntries = 0
    let validEntries = 0
    const now = Date.now()
    
    for (const cacheKey of cacheKeys) {
      const entry = await idbGet<CacheEntry>(cacheKey)
      if (entry) {
        if (now > entry.expiresAt) {
          expiredEntries++
        } else {
          validEntries++
        }
      }
    }
    
    return {
      totalEntries: cacheKeys.length,
      expiredEntries,
      validEntries
    }
  } catch (error) {
    console.error('Cache stats error:', error)
    return { totalEntries: 0, expiredEntries: 0, validEntries: 0 }
  }
}
