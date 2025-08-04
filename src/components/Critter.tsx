/**
 * Critter component - Interactive sprite button for species
 */

import { useState, useRef } from 'react';
import type { Species } from '../domain/types';
import './Critter.css';

export interface CritterProps {
  species: Species;
  position: { x: number; y: number };
  onTap: (species: Species) => void;
  className?: string;
}

export function Critter({ species, position, onTap, className = '' }: CritterProps) {
  const [isPressed, setIsPressed] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Generate random animation delay for floating effect
  const animationDelay = Math.random() * 2; // Random delay 0-2s
  
  // Create inline styles for positioning
  const critterStyle = {
    left: `${position.x}%`,
    top: `${position.y}%`,
    animationDelay: `${animationDelay}s`,
  };

  const handleClick = () => {
    onTap(species);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsPressed(true);
      onTap(species);
    }
  };

  const handleKeyUp = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      setIsPressed(false);
    }
  };

  const handleMouseDown = () => {
    setIsPressed(true);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleMouseLeave = () => {
    setIsPressed(false);
  };

  // Get the first photo URL as the sprite image
  const imageUrl = species.photoURLs[0] || '/images/placeholder-critter.svg';

  return (
    <button
      ref={buttonRef}
      className={`critter ${isPressed ? 'critter--pressed' : ''} ${className}`}
      style={critterStyle}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      aria-label={`Open ${species.name} info`}
      type="button"
    >
      <img
        src={imageUrl}
        alt=""
        className="critter__sprite"
        draggable={false}
      />
      <span className="critter__name visually-hidden">
        {species.name}
      </span>
    </button>
  );
}
