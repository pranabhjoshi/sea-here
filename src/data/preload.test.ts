import { describe, it, expect } from 'vitest'
import { 
  coreSpecies, 
  coreSpeciesById, 
  CORE_SPECIES_COUNT,
  getCoreSpeciesById,
  isCoreSpecies 
} from './preload'
import { isSpecies } from '../domain/types'

describe('Preload Manifest', () => {
  describe('Core species validation', () => {
    it('has exactly 7 species', () => {
      expect(coreSpecies).toHaveLength(CORE_SPECIES_COUNT)
      expect(coreSpecies).toHaveLength(7)
    })

    it('all species are valid Species objects', () => {
      coreSpecies.forEach((species, index) => {
        expect(isSpecies(species), `Species at index ${index} should be valid`).toBe(true)
      })
    })

    it('all species have required fields', () => {
      coreSpecies.forEach((species) => {
        // Required top-level fields
        expect(species.id, `Species "${species.name}" missing id`).toBeTruthy()
        expect(species.name, `Species "${species.name}" missing name`).toBeTruthy()
        expect(species.endangerment, `Species "${species.name}" missing endangerment`).toBeTruthy()
        expect(species.bullets, `Species "${species.name}" missing bullets`).toBeTruthy()
        expect(species.photoURLs, `Species "${species.name}" missing photoURLs`).toBeTruthy()

        // Required bullet fields
        expect(species.bullets.habitat, `Species "${species.name}" missing habitat`).toBeTruthy()
        expect(species.bullets.diet, `Species "${species.name}" missing diet`).toBeTruthy()
        expect(species.bullets.personality, `Species "${species.name}" missing personality`).toBeTruthy()

        // Photo URLs validation
        expect(species.photoURLs.length, `Species "${species.name}" has no photos`).toBeGreaterThan(0)
        species.photoURLs.forEach((url, urlIndex) => {
          expect(typeof url, `Photo URL ${urlIndex} for "${species.name}" should be string`).toBe('string')
          expect(url.length, `Photo URL ${urlIndex} for "${species.name}" should not be empty`).toBeGreaterThan(0)
        })
      })
    })

    it('all species have unique IDs', () => {
      const ids = coreSpecies.map(species => species.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('all species have unique names', () => {
      const names = coreSpecies.map(species => species.name)
      const uniqueNames = new Set(names)
      expect(uniqueNames.size).toBe(names.length)
    })

    it('includes expected core species', () => {
      const expectedSpecies = [
        'sea-otter',
        'giant-pacific-octopus',
        'harbor-seal',
        'wolf-eel',
        'rockfish',
        'indo-pacific-leopard-shark',
        'moon-jelly'
      ]

      expectedSpecies.forEach(expectedId => {
        const species = coreSpecies.find(s => s.id === expectedId)
        expect(species, `Expected species "${expectedId}" not found`).toBeDefined()
      })
    })

    it('has valid endangerment levels', () => {
      const validLevels = ['LC', 'NT', 'VU', 'EN', 'CR']
      
      coreSpecies.forEach(species => {
        expect(validLevels.includes(species.endangerment), 
          `Species "${species.name}" has invalid endangerment level: ${species.endangerment}`
        ).toBe(true)
      })
    })
  })

  describe('Species lookup by ID', () => {
    it('creates correct lookup object', () => {
      expect(Object.keys(coreSpeciesById)).toHaveLength(7)
      
      coreSpecies.forEach(species => {
        expect(coreSpeciesById[species.id]).toEqual(species)
      })
    })

    it('getCoreSpeciesById returns correct species', () => {
      const seaOtter = getCoreSpeciesById('sea-otter')
      expect(seaOtter).toBeDefined()
      expect(seaOtter?.name).toBe('Sea Otter')
      expect(seaOtter?.endangerment).toBe('EN')
    })

    it('getCoreSpeciesById returns undefined for non-existent ID', () => {
      expect(getCoreSpeciesById('non-existent')).toBeUndefined()
    })

    it('isCoreSpecies correctly identifies core species', () => {
      expect(isCoreSpecies('sea-otter')).toBe(true)
      expect(isCoreSpecies('giant-pacific-octopus')).toBe(true)
      expect(isCoreSpecies('non-existent')).toBe(false)
      expect(isCoreSpecies('')).toBe(false)
    })
  })

  describe('Data quality', () => {
    it('all species have meaningful content', () => {
      coreSpecies.forEach(species => {
        // Names should be properly formatted
        expect(species.name.length).toBeGreaterThan(3)
        expect(species.name).toMatch(/^[A-Z]/) // Should start with capital letter

        // Bullets should have substantial content
        expect(species.bullets.habitat.length).toBeGreaterThan(10)
        expect(species.bullets.diet.length).toBeGreaterThan(10)
        expect(species.bullets.personality.length).toBeGreaterThan(10)

        // Photo URLs should look like file paths
        species.photoURLs.forEach(url => {
          expect(url).toMatch(/\.(jpg|jpeg|png|webp)$/i)
        })
      })
    })

    it('has diverse endangerment levels', () => {
      const endangermentLevels = new Set(coreSpecies.map(s => s.endangerment))
      expect(endangermentLevels.size).toBeGreaterThan(1) // Should have variety
    })

    it('species represent Pacific Northwest marine life', () => {
      // Check that we have representative species
      const speciesNames = coreSpecies.map(s => s.name.toLowerCase())
      
      // Should include some iconic PNW species
      expect(speciesNames.some(name => name.includes('otter'))).toBe(true)
      expect(speciesNames.some(name => name.includes('octopus'))).toBe(true)
      expect(speciesNames.some(name => name.includes('seal'))).toBe(true)
    })
  })
})
