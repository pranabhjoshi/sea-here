/**
 * SpeciesRepository - Single source of truth for species and population data
 * Implements cache → API → preload fallback strategy with ETag support
 */

import type { Species, PopulationPoint } from '../domain/types';
import { isSpecies } from '../domain/types';
import { coreSpecies, getCoreSpeciesById } from './preload';
import * as cache from './cache';
import { withBackoff } from '../utils/backoff';

// Cache keys
const CACHE_KEYS = {
  species: (id: string) => `species:${id}`,
  population: (id: string) => `population:${id}`,
  etag: (url: string) => `etag:${url}`,
  searchResults: (query: string) => `search:${query}`,
} as const;

// Cache TTL values (in milliseconds)
const CACHE_TTL = {
  species: 24 * 60 * 60 * 1000, // 24 hours
  population: 6 * 60 * 60 * 1000, // 6 hours
  etag: 24 * 60 * 60 * 1000, // 24 hours
  search: 30 * 60 * 1000, // 30 minutes
} as const;

/**
 * Fetches data from API with ETag support and backoff retry
 */
async function fetchWithETag(url: string): Promise<Response> {
  const etagKey = CACHE_KEYS.etag(url);
  const cachedETag = await cache.get<string>(etagKey);

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (cachedETag) {
    headers['If-None-Match'] = cachedETag;
  }

  return withBackoff(async () => {
    const response = await fetch(url, { headers });

    // Cache the ETag for future requests
    const etag = response.headers.get('ETag');
    if (etag) {
      await cache.set(etagKey, etag, CACHE_TTL.etag);
    }

    return response;
  });
}

/**
 * Performs fuzzy search on preloaded species data
 */
function fuzzySearchPreload(query: string): Species[] {
  if (!query.trim()) return [];

  const searchTerm = query.toLowerCase().trim();
  
  return coreSpecies.filter((species: Species) => {
    const searchableText = [
      species.name,
      species.bullets.habitat,
      species.bullets.diet,
      species.bullets.personality,
    ].join(' ').toLowerCase();

    return searchableText.includes(searchTerm);
  });
}

/**
 * Merges local and remote search results, removing duplicates
 */
function mergeSearchResults(local: Species[], remote: Species[]): Species[] {
  const merged = [...local];
  const localIds = new Set(local.map(s => s.id));

  for (const species of remote) {
    if (!localIds.has(species.id)) {
      merged.push(species);
    }
  }

  return merged;
}

/**
 * Gets species data by ID with cache → API → preload fallback
 * @param id - Species ID
 * @returns Species data or undefined if not found
 */
export async function getSpecies(id: string): Promise<Species | undefined> {
  if (!id?.trim()) return undefined;

  const cacheKey = CACHE_KEYS.species(id);

  try {
    // 1. Try cache first
    const cached = await cache.get<Species>(cacheKey);
    if (cached && isSpecies(cached)) {
      return cached;
    }

    // 2. Try API
    try {
      const response = await fetchWithETag(`/api/species/${encodeURIComponent(id)}`);
      
      if (response.status === 304) {
        // Not modified, return cached version (should exist if we got 304)
        const cachedData = await cache.get<Species>(cacheKey);
        if (cachedData && isSpecies(cachedData)) {
          return cachedData;
        }
      }

      if (response.ok) {
        const data = await response.json();
        if (isSpecies(data)) {
          await cache.set(cacheKey, data, CACHE_TTL.species);
          return data;
        }
      }
    } catch (error) {
      // Network error, continue to fallback
      console.warn(`Network error fetching species ${id}:`, error);
    }

    // 3. Fallback to preload manifest
    const preloadSpecies = getCoreSpeciesById(id);
    if (preloadSpecies) {
      // Cache the preload data for future requests
      await cache.set(cacheKey, preloadSpecies, CACHE_TTL.species);
      return preloadSpecies;
    }

    return undefined;
  } catch (error) {
    console.error(`Error in getSpecies(${id}):`, error);
    
    // Last resort: try preload manifest
    return getCoreSpeciesById(id);
  }
}

/**
 * Searches for species with local fuzzy search + optional network merge
 * @param query - Search query string
 * @returns Array of matching species
 */
export async function search(query: string): Promise<Species[]> {
  if (!query?.trim()) return [];

  const cacheKey = CACHE_KEYS.searchResults(query);

  try {
    // Check cache first
    const cached = await cache.get<Species[]>(cacheKey);
    if (cached && Array.isArray(cached)) {
      return cached;
    }

    // Local fuzzy search on preload data
    const localResults = fuzzySearchPreload(query);

    try {
      // Try to merge with network results if available
      const response = await fetchWithETag(`/api/search?q=${encodeURIComponent(query)}`);
      
      if (response.status === 304) {
        // Return cached results
        const cachedResults = await cache.get<Species[]>(cacheKey);
        if (cachedResults && Array.isArray(cachedResults)) {
          return cachedResults;
        }
      }

      if (response.ok) {
        const remoteData = await response.json();
        if (Array.isArray(remoteData) && remoteData.every(isSpecies)) {
          const merged = mergeSearchResults(localResults, remoteData);
          await cache.set(cacheKey, merged, CACHE_TTL.search);
          return merged;
        }
      }
    } catch (error) {
      // Network error, use local results only
      console.warn(`Network error during search for "${query}":`, error);
    }

    // Cache and return local results
    await cache.set(cacheKey, localResults, CACHE_TTL.search);
    return localResults;
  } catch (error) {
    console.error(`Error in search("${query}"):`, error);
    
    // Fallback to local search only
    return fuzzySearchPreload(query);
  }
}

/**
 * Gets population data for a species with cache + API strategy
 * @param id - Species ID
 * @returns Array of population points (empty if not found)
 */
export async function getPopulation(id: string): Promise<PopulationPoint[]> {
  if (!id?.trim()) return [];

  const cacheKey = CACHE_KEYS.population(id);

  try {
    // Try cache first
    const cached = await cache.get<PopulationPoint[]>(cacheKey);
    if (cached && Array.isArray(cached)) {
      return cached;
    }

    // Try API
    try {
      const response = await fetchWithETag(`/api/population/${encodeURIComponent(id)}`);
      
      if (response.status === 304) {
        // Not modified, return cached version
        const cachedData = await cache.get<PopulationPoint[]>(cacheKey);
        if (cachedData && Array.isArray(cachedData)) {
          return cachedData;
        }
      }

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          await cache.set(cacheKey, data, CACHE_TTL.population);
          return data;
        }
      }
    } catch (error) {
      console.warn(`Network error fetching population for ${id}:`, error);
    }

    // No preload fallback for population data - return empty array
    return [];
  } catch (error) {
    console.error(`Error in getPopulation(${id}):`, error);
    return [];
  }
}

/**
 * Clears all repository caches
 */
export async function clearCache(): Promise<void> {
  await cache.clear();
}

/**
 * Gets cache statistics for debugging
 */
export async function getCacheStats() {
  return cache.getStats();
}
