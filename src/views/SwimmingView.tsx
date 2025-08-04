/**
 * SwimmingView - Main interactive screen with drifting critters
 */

import { useState, useMemo } from 'react';
import { coreSpecies } from '../data/preload';
import { Critter } from '../components/Critter';
import { InfoCard } from '../components/InfoCard';
import type { Species } from '../domain/types';
import './SwimmingView.css';

export interface SwimmingViewProps {
  className?: string;
}

// Predefined positions for critters to avoid overlap
const CRITTER_POSITIONS = [
  { x: 15, y: 25 }, // Top left area - Sea Otter
  { x: 70, y: 20 }, // Top right area - Giant Pacific Octopus
  { x: 45, y: 40 }, // Center area - Harbor Seal
  { x: 25, y: 65 }, // Bottom left area - Wolf Eel
  { x: 65, y: 55 }, // Center right
  { x: 35, y: 75 }, // Bottom center
  { x: 80, y: 45 }, // Right center
];

export function SwimmingView({ className = '' }: SwimmingViewProps) {
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);

  // Select 3-4 critters from the preload manifest
  const displayedCritters = useMemo(() => {
    // Take first 4 species from core species
    const selectedSpecies = coreSpecies.slice(0, 4);
    
    return selectedSpecies.map((species, index) => ({
      species,
      position: CRITTER_POSITIONS[index] || CRITTER_POSITIONS[0],
      key: `critter-${species.id}`,
    }));
  }, []);

  const handleCritterTap = (species: Species) => {
    setSelectedSpeciesId(species.id);
  };

  const handleCloseModal = () => {
    setSelectedSpeciesId(null);
  };

  const handleCloseInstructions = () => {
    setShowInstructions(false);
  };

  return (
    <div className={`swimming-view ${className}`}>
      <div className="swimming-view__ocean">
        {/* Background elements could go here */}
        <div className="swimming-view__water-effects" aria-hidden="true">
          <div className="bubble bubble--1"></div>
          <div className="bubble bubble--2"></div>
          <div className="bubble bubble--3"></div>
        </div>

        {/* Render critters */}
        <div className="swimming-view__critters" role="group" aria-label="Marine creatures">
          {displayedCritters.map(({ species, position, key }) => (
            <Critter
              key={key}
              species={species}
              position={position}
              onTap={handleCritterTap}
              className="swimming-view__critter"
            />
          ))}
        </div>

        {/* Instructions for users */}
        {showInstructions && (
          <div className="swimming-view__instructions" aria-live="polite">
            <button
              className="swimming-view__instructions-close"
              onClick={handleCloseInstructions}
              aria-label="Close instructions"
              type="button"
            >
              <span aria-hidden="true">×</span>
            </button>
            <p className="swimming-view__instruction-text">
              Tap or click on marine creatures to learn more about them
            </p>
          </div>
        )}
      </div>

      {/* Info card modal */}
      {selectedSpeciesId !== null && (
        <InfoCard
          speciesId={selectedSpeciesId}
          isOpen={selectedSpeciesId !== null}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
