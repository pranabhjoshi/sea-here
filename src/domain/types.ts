// Endangerment status based on IUCN Red List categories
export type Endangerment = 'LC' | 'NT' | 'VU' | 'EN' | 'CR'

// Species information structure
export interface Species {
  id: string
  name: string
  endangerment: Endangerment
  bullets: {
    habitat: string
    diet: string
    personality: string
  }
  photoURLs: string[]
}

// Population data point for charts
export interface PopulationPoint {
  year: number
  count: number
}

// Type guard for Species validation
export function isSpecies(obj: unknown): obj is Species {
  if (typeof obj !== 'object' || obj === null) {
    return false
  }

  const species = obj as Record<string, unknown>

  return (
    typeof species.id === 'string' &&
    typeof species.name === 'string' &&
    typeof species.endangerment === 'string' &&
    ['LC', 'NT', 'VU', 'EN', 'CR'].includes(species.endangerment) &&
    typeof species.bullets === 'object' &&
    species.bullets !== null &&
    typeof (species.bullets as Record<string, unknown>).habitat === 'string' &&
    typeof (species.bullets as Record<string, unknown>).diet === 'string' &&
    typeof (species.bullets as Record<string, unknown>).personality === 'string' &&
    Array.isArray(species.photoURLs) &&
    species.photoURLs.every((url) => typeof url === 'string')
  )
}

// Type guard for PopulationPoint validation
export function isPopulationPoint(obj: unknown): obj is PopulationPoint {
  if (typeof obj !== 'object' || obj === null) {
    return false
  }

  const point = obj as Record<string, unknown>

  return (
    typeof point.year === 'number' &&
    typeof point.count === 'number' &&
    Number.isInteger(point.year) &&
    point.year > 0 &&
    point.count >= 0
  )
}

// Type guard for array of Species
export function isSpeciesArray(obj: unknown): obj is Species[] {
  return Array.isArray(obj) && obj.every(isSpecies)
}

// Endangerment status display information
export const endangermentInfo: Record<Endangerment, { label: string; color: string }> = {
  LC: { label: 'Least Concern', color: 'var(--algae-green)' },
  NT: { label: 'Near Threatened', color: 'var(--seafoam-blue)' },
  VU: { label: 'Vulnerable', color: 'var(--mediterranean-blue)' },
  EN: { label: 'Endangered', color: 'var(--coral-orange)' },
  CR: { label: 'Critically Endangered', color: 'var(--purple-star)' },
}
