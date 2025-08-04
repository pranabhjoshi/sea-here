import { describe, it, expect } from 'vitest'
import { 
  type Species, 
  type PopulationPoint, 
  isSpecies, 
  isPopulationPoint, 
  isSpeciesArray,
  endangermentInfo 
} from './types'

describe('Domain Types', () => {
  describe('Species type guard', () => {
    it('validates correct Species object', () => {
      const validSpecies: Species = {
        id: 'test-species',
        name: 'Test Species',
        endangerment: 'LC',
        bullets: {
          habitat: 'Test habitat',
          diet: 'Test diet',
          personality: 'Test personality'
        },
        photoURLs: ['photo1.jpg', 'photo2.jpg']
      }

      expect(isSpecies(validSpecies)).toBe(true)
    })

    it('rejects invalid Species objects', () => {
      // Missing required fields
      expect(isSpecies({})).toBe(false)
      expect(isSpecies(null)).toBe(false)
      expect(isSpecies(undefined)).toBe(false)
      expect(isSpecies('not an object')).toBe(false)

      // Missing id
      expect(isSpecies({
        name: 'Test',
        endangerment: 'LC',
        bullets: { habitat: 'h', diet: 'd', personality: 'p' },
        photoURLs: ['photo.jpg']
      })).toBe(false)

      // Invalid endangerment
      expect(isSpecies({
        id: 'test',
        name: 'Test',
        endangerment: 'INVALID',
        bullets: { habitat: 'h', diet: 'd', personality: 'p' },
        photoURLs: ['photo.jpg']
      })).toBe(false)

      // Missing bullets fields
      expect(isSpecies({
        id: 'test',
        name: 'Test',
        endangerment: 'LC',
        bullets: { habitat: 'h', diet: 'd' }, // missing personality
        photoURLs: ['photo.jpg']
      })).toBe(false)

      // Invalid photoURLs
      expect(isSpecies({
        id: 'test',
        name: 'Test',
        endangerment: 'LC',
        bullets: { habitat: 'h', diet: 'd', personality: 'p' },
        photoURLs: 'not an array'
      })).toBe(false)
    })

    it('validates all endangerment levels', () => {
      const endangermentLevels = ['LC', 'NT', 'VU', 'EN', 'CR'] as const

      endangermentLevels.forEach(level => {
        const species = {
          id: 'test',
          name: 'Test',
          endangerment: level,
          bullets: { habitat: 'h', diet: 'd', personality: 'p' },
          photoURLs: ['photo.jpg']
        }
        expect(isSpecies(species)).toBe(true)
      })
    })
  })

  describe('PopulationPoint type guard', () => {
    it('validates correct PopulationPoint object', () => {
      const validPoint: PopulationPoint = {
        year: 2023,
        count: 1500
      }

      expect(isPopulationPoint(validPoint)).toBe(true)
    })

    it('rejects invalid PopulationPoint objects', () => {
      expect(isPopulationPoint({})).toBe(false)
      expect(isPopulationPoint(null)).toBe(false)
      expect(isPopulationPoint({ year: 'not a number', count: 100 })).toBe(false)
      expect(isPopulationPoint({ year: 2023, count: 'not a number' })).toBe(false)
      expect(isPopulationPoint({ year: -1, count: 100 })).toBe(false)
      expect(isPopulationPoint({ year: 2023, count: -1 })).toBe(false)
      expect(isPopulationPoint({ year: 2023.5, count: 100 })).toBe(false)
    })

    it('allows zero count', () => {
      expect(isPopulationPoint({ year: 2023, count: 0 })).toBe(true)
    })
  })

  describe('Species array type guard', () => {
    it('validates array of valid Species', () => {
      const species1: Species = {
        id: 'species1',
        name: 'Species 1',
        endangerment: 'LC',
        bullets: { habitat: 'h1', diet: 'd1', personality: 'p1' },
        photoURLs: ['photo1.jpg']
      }

      const species2: Species = {
        id: 'species2',
        name: 'Species 2',
        endangerment: 'EN',
        bullets: { habitat: 'h2', diet: 'd2', personality: 'p2' },
        photoURLs: ['photo2.jpg']
      }

      expect(isSpeciesArray([species1, species2])).toBe(true)
      expect(isSpeciesArray([])).toBe(true)
    })

    it('rejects invalid arrays', () => {
      expect(isSpeciesArray('not an array')).toBe(false)
      expect(isSpeciesArray([{ invalid: 'object' }])).toBe(false)
      expect(isSpeciesArray([null])).toBe(false)
    })
  })

  describe('Endangerment info', () => {
    it('has info for all endangerment levels', () => {
      const levels = ['LC', 'NT', 'VU', 'EN', 'CR'] as const
      
      levels.forEach(level => {
        expect(endangermentInfo[level]).toBeDefined()
        expect(endangermentInfo[level].label).toBeTruthy()
        expect(endangermentInfo[level].color).toBeTruthy()
      })
    })

    it('has correct labels', () => {
      expect(endangermentInfo.LC.label).toBe('Least Concern')
      expect(endangermentInfo.NT.label).toBe('Near Threatened')
      expect(endangermentInfo.VU.label).toBe('Vulnerable')
      expect(endangermentInfo.EN.label).toBe('Endangered')
      expect(endangermentInfo.CR.label).toBe('Critically Endangered')
    })
  })
})
