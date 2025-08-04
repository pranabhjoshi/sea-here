import { type Species, isSpeciesArray } from '../domain/types'

// Import the core species manifest
import coreSpeciesData from '../../public/data/core-species.json'

// Validate and export the core species manifest
function validateCoreSpecies(data: unknown): Species[] {
  if (!isSpeciesArray(data)) {
    throw new Error('Invalid core species data: does not match Species[] schema')
  }

  if (data.length !== 7) {
    throw new Error(`Expected exactly 7 core species, got ${data.length}`)
  }

  // Validate that all required fields are present for each species
  data.forEach((species, index) => {
    if (!species.id || !species.name || !species.endangerment || !species.bullets || !species.photoURLs) {
      throw new Error(`Species at index ${index} is missing required fields`)
    }

    if (!species.bullets.habitat || !species.bullets.diet || !species.bullets.personality) {
      throw new Error(`Species "${species.name}" is missing required bullet points`)
    }

    if (species.photoURLs.length === 0) {
      throw new Error(`Species "${species.name}" has no photo URLs`)
    }
  })

  return data
}

// Export validated core species
export const coreSpecies: Species[] = validateCoreSpecies(coreSpeciesData)

// Export individual species by ID for easy lookup
export const coreSpeciesById: Record<string, Species> = coreSpecies.reduce(
  (acc, species) => {
    acc[species.id] = species
    return acc
  },
  {} as Record<string, Species>
)

// Export species count for validation
export const CORE_SPECIES_COUNT = 7

// Helper function to get species by ID
export function getCoreSpeciesById(id: string): Species | undefined {
  return coreSpeciesById[id]
}

// Helper function to check if a species ID is in core manifest
export function isCoreSpecies(id: string): boolean {
  return id in coreSpeciesById
}
