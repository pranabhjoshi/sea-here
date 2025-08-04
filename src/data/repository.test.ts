/**
 * Tests for SpeciesRepository
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSpecies, search, getPopulation, clearCache } from './repository';
import * as cache from './cache';
import type { Species, PopulationPoint } from '../domain/types';

// Mock the cache module
vi.mock('./cache', () => ({
  get: vi.fn(),
  set: vi.fn(),
  clear: vi.fn(),
  getStats: vi.fn(),
}));

// Mock the preload module
vi.mock('./preload', () => ({
  coreSpecies: [
    {
      id: 'sea-otter',
      name: 'Sea Otter',
      endangerment: 'EN',
      bullets: {
        habitat: 'Kelp forests and coastal waters',
        diet: 'Sea urchins, crabs, mollusks',
        personality: 'Playful and social',
      },
      photoURLs: ['/images/sea-otter.jpg'],
    },
  ],
  getCoreSpeciesById: vi.fn(),
}));

// Mock the backoff utility
vi.mock('../utils/backoff', () => ({
  withBackoff: vi.fn((operation) => operation()),
}));

// Mock fetch globally
const mockFetch = vi.fn();
(globalThis as any).fetch = mockFetch;

// Test data
const mockSpecies: Species = {
  id: 'test-species',
  name: 'Test Species',
  endangerment: 'LC',
  bullets: {
    habitat: 'Test habitat',
    diet: 'Test diet',
    personality: 'Test personality',
  },
  photoURLs: ['/images/test-species.jpg'],
};

const mockPopulation: PopulationPoint[] = [
  { year: 2020, count: 1000 },
  { year: 2021, count: 1100 },
];

const preloadSpecies: Species = {
  id: 'sea-otter',
  name: 'Sea Otter',
  endangerment: 'EN',
  bullets: {
    habitat: 'Kelp forests and coastal waters',
    diet: 'Sea urchins, crabs, mollusks',
    personality: 'Playful and social',
  },
  photoURLs: ['/images/sea-otter.jpg'],
};

// Get mocked preload functions
const mockPreload = await import('./preload');
const mockGetCoreSpeciesById = vi.mocked(mockPreload.getCoreSpeciesById);

describe('SpeciesRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset cache mocks
    vi.mocked(cache.get).mockResolvedValue(undefined);
    vi.mocked(cache.set).mockResolvedValue();
    vi.mocked(cache.clear).mockResolvedValue();
    // Reset preload mocks
    mockGetCoreSpeciesById.mockImplementation((id: string) => 
      id === 'sea-otter' ? preloadSpecies : undefined
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getSpecies', () => {
    it('should return undefined for empty/invalid ID', async () => {
      expect(await getSpecies('')).toBeUndefined();
      expect(await getSpecies('   ')).toBeUndefined();
      // @ts-expect-error - testing runtime behavior
      expect(await getSpecies(null)).toBeUndefined();
    });

    it('should return cached species when available', async () => {
      vi.mocked(cache.get).mockResolvedValue(mockSpecies);

      const result = await getSpecies('test-species');

      expect(result).toEqual(mockSpecies);
      expect(cache.get).toHaveBeenCalledWith('species:test-species');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should fetch from API when not in cache', async () => {
      vi.mocked(cache.get).mockResolvedValue(undefined);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map([['ETag', '"abc123"']]),
        json: () => Promise.resolve(mockSpecies),
      });

      const result = await getSpecies('test-species');

      expect(result).toEqual(mockSpecies);
      expect(mockFetch).toHaveBeenCalledWith('/api/species/test-species', {
        headers: { 'Content-Type': 'application/json' },
      });
      expect(cache.set).toHaveBeenCalledWith('species:test-species', mockSpecies, 24 * 60 * 60 * 1000);
    });

    it('should use ETag header for conditional requests', async () => {
      const cachedETag = '"cached-etag"';
      vi.mocked(cache.get)
        .mockResolvedValueOnce(undefined) // species cache miss
        .mockResolvedValueOnce(cachedETag); // etag cache hit

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map([['ETag', '"new-etag"']]),
        json: () => Promise.resolve(mockSpecies),
      });

      await getSpecies('test-species');

      expect(mockFetch).toHaveBeenCalledWith('/api/species/test-species', {
        headers: {
          'Content-Type': 'application/json',
          'If-None-Match': cachedETag,
        },
      });
    });

    it('should handle 304 Not Modified response', async () => {
      vi.mocked(cache.get)
        .mockResolvedValueOnce(undefined) // species cache miss
        .mockResolvedValueOnce('"etag"') // etag cache hit
        .mockResolvedValueOnce(mockSpecies); // species cache hit after 304

      mockFetch.mockResolvedValue({
        ok: true,
        status: 304,
        headers: new Map(),
      });

      const result = await getSpecies('test-species');

      expect(result).toEqual(mockSpecies);
      expect(cache.get).toHaveBeenCalledTimes(3);
    });

    it('should fallback to preload manifest when API fails', async () => {
      vi.mocked(cache.get).mockResolvedValue(undefined);
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await getSpecies('sea-otter');

      expect(result).toEqual(preloadSpecies);
      expect(cache.set).toHaveBeenCalledWith('species:sea-otter', preloadSpecies, 24 * 60 * 60 * 1000);
    });

    it('should return undefined when species not found anywhere', async () => {
      vi.mocked(cache.get).mockResolvedValue(undefined);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Map(),
      });

      const result = await getSpecies('non-existent');

      expect(result).toBeUndefined();
    });

    it('should handle invalid API response data', async () => {
      vi.mocked(cache.get).mockResolvedValue(undefined);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map(),
        json: () => Promise.resolve({ invalid: 'data' }),
      });

      const result = await getSpecies('sea-otter');

      expect(result).toEqual(preloadSpecies); // Falls back to preload
    });
  });

  describe('search', () => {
    it('should return empty array for empty query', async () => {
      expect(await search('')).toEqual([]);
      expect(await search('   ')).toEqual([]);
    });

    it('should return cached search results when available', async () => {
      const cachedResults = [mockSpecies];
      vi.mocked(cache.get).mockResolvedValue(cachedResults);

      const result = await search('test');

      expect(result).toEqual(cachedResults);
      expect(cache.get).toHaveBeenCalledWith('search:test');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should perform fuzzy search on preload data', async () => {
      vi.mocked(cache.get).mockResolvedValue(undefined);
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await search('otter');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Sea Otter');
      expect(cache.set).toHaveBeenCalledWith('search:otter', result, 30 * 60 * 1000);
    });

    it('should merge local and remote search results', async () => {
      const remoteSpecies: Species = {
        id: 'remote-species',
        name: 'Remote Species',
        endangerment: 'VU',
        bullets: {
          habitat: 'Remote habitat',
          diet: 'Remote diet',
          personality: 'Remote personality',
        },
        photoURLs: ['/images/remote.jpg'],
      };

      vi.mocked(cache.get).mockResolvedValue(undefined);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map(),
        json: () => Promise.resolve([remoteSpecies]),
      });

      const result = await search('otter');

      expect(result).toHaveLength(2); // 1 local + 1 remote
      expect(result.some(s => s.name === 'Sea Otter')).toBe(true);
      expect(result.some(s => s.name === 'Remote Species')).toBe(true);
    });

    it('should deduplicate merged results', async () => {
      vi.mocked(cache.get).mockResolvedValue(undefined);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map(),
        json: () => Promise.resolve([preloadSpecies]), // Same as local
      });

      const result = await search('otter');

      expect(result).toHaveLength(1); // Deduplicated
      expect(result[0].name).toBe('Sea Otter');
    });

    it('should handle 304 Not Modified for search', async () => {
      const cachedResults = [mockSpecies];
      vi.mocked(cache.get)
        .mockResolvedValueOnce(undefined) // search cache miss
        .mockResolvedValueOnce('"search-etag"') // etag cache hit
        .mockResolvedValueOnce(cachedResults); // search cache hit after 304

      mockFetch.mockResolvedValue({
        ok: true,
        status: 304,
        headers: new Map(),
      });

      const result = await search('test');

      expect(result).toEqual(cachedResults);
    });

    it('should handle invalid remote search results', async () => {
      vi.mocked(cache.get).mockResolvedValue(undefined);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map(),
        json: () => Promise.resolve('invalid data'),
      });

      const result = await search('otter');

      expect(result).toHaveLength(1); // Only local results
      expect(result[0].name).toBe('Sea Otter');
    });
  });

  describe('getPopulation', () => {
    it('should return empty array for empty/invalid ID', async () => {
      expect(await getPopulation('')).toEqual([]);
      expect(await getPopulation('   ')).toEqual([]);
    });

    it('should return cached population data when available', async () => {
      vi.mocked(cache.get).mockResolvedValue(mockPopulation);

      const result = await getPopulation('test-species');

      expect(result).toEqual(mockPopulation);
      expect(cache.get).toHaveBeenCalledWith('population:test-species');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should fetch from API when not in cache', async () => {
      vi.mocked(cache.get).mockResolvedValue(undefined);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map([['ETag', '"pop-etag"']]),
        json: () => Promise.resolve(mockPopulation),
      });

      const result = await getPopulation('test-species');

      expect(result).toEqual(mockPopulation);
      expect(mockFetch).toHaveBeenCalledWith('/api/population/test-species', {
        headers: { 'Content-Type': 'application/json' },
      });
      expect(cache.set).toHaveBeenCalledWith('population:test-species', mockPopulation, 6 * 60 * 60 * 1000);
    });

    it('should return empty array when API fails (no preload fallback)', async () => {
      vi.mocked(cache.get).mockResolvedValue(undefined);
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await getPopulation('test-species');

      expect(result).toEqual([]);
    });

    it('should handle 404 response', async () => {
      vi.mocked(cache.get).mockResolvedValue(undefined);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Map(),
      });

      const result = await getPopulation('non-existent');

      expect(result).toEqual([]);
    });

    it('should handle invalid API response', async () => {
      vi.mocked(cache.get).mockResolvedValue(undefined);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map(),
        json: () => Promise.resolve('not an array'),
      });

      const result = await getPopulation('test-species');

      expect(result).toEqual([]);
    });
  });

  describe('clearCache', () => {
    it('should clear all cache data', async () => {
      await clearCache();

      expect(cache.clear).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle cache errors gracefully in getSpecies', async () => {
      vi.mocked(cache.get).mockRejectedValue(new Error('Cache error'));
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await getSpecies('sea-otter');

      expect(result).toEqual(preloadSpecies); // Falls back to preload
    });

    it('should handle cache errors gracefully in search', async () => {
      vi.mocked(cache.get).mockRejectedValue(new Error('Cache error'));
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await search('otter');

      expect(result).toHaveLength(1); // Falls back to local search
      expect(result[0].name).toBe('Sea Otter');
    });

    it('should handle cache errors gracefully in getPopulation', async () => {
      vi.mocked(cache.get).mockRejectedValue(new Error('Cache error'));
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await getPopulation('test-species');

      expect(result).toEqual([]); // No fallback for population
    });
  });

  describe('Backoff integration', () => {
    it('should use backoff for API requests', async () => {
      const { withBackoff } = await import('../utils/backoff');
      
      vi.mocked(cache.get).mockResolvedValue(undefined);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map(),
        json: () => Promise.resolve(mockSpecies),
      });

      await getSpecies('test-species');

      expect(withBackoff).toHaveBeenCalled();
    });
  });
});
