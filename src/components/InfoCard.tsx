/**
 * InfoCard component - Modal dialog for species information with real data
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Species } from '../domain/types';
import { getSpecies } from '../data/repository';
import { useUIStore } from '../state/ui';
import { VisuallyHidden } from './VisuallyHidden';
import { announce, announceSpeciesLoaded, announceLoading, announceError, announceModalOpened, announceModalClosed } from '../utils/announce';
import './InfoCard.css';

export interface InfoCardProps {
  speciesId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function InfoCard({ speciesId, isOpen, onClose }: InfoCardProps) {
  const [species, setSpecies] = useState<Species | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  
  const { ttsEnabled } = useUIStore();
  const navigate = useNavigate();

  // Fetch species data when modal opens
  useEffect(() => {
    if (!isOpen || !speciesId) {
      setSpecies(null);
      setError(null);
      setCurrentImageIndex(0);
      return;
    }

    const fetchSpeciesData = async () => {
      setLoading(true);
      setError(null);
      announceLoading();

      try {
        const speciesData = await getSpecies(speciesId);
        if (speciesData) {
          setSpecies(speciesData);
          announceSpeciesLoaded(speciesData.name);
          announceModalOpened(speciesData.name);
        } else {
          setError('Species not found');
          announceError('Species not found');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load species';
        setError(errorMessage);
        announceError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchSpeciesData();
  }, [isOpen, speciesId]);

  // Focus management and escape key handling
  useEffect(() => {
    if (!isOpen) return;

    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Focus the close button when modal opens
    setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 100);

    // Handle escape key
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // Trap focus within the modal
    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusableElements = dialog.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleTabKey);

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTabKey);
      document.body.style.overflow = '';

      // Announce modal closed
      if (species) {
        announceModalClosed();
      }

      // Restore focus to previously active element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  // Handle carousel navigation
  const handlePreviousImage = () => {
    if (!species || species.photoURLs.length <= 1) return;
    setCurrentImageIndex(prev => 
      prev === 0 ? species.photoURLs.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    if (!species || species.photoURLs.length <= 1) return;
    setCurrentImageIndex(prev => 
      prev === species.photoURLs.length - 1 ? 0 : prev + 1
    );
  };

  // Handle TTS for species information
  const handleTTS = () => {
    if (!species || !ttsEnabled) return;
    
    const text = `${species.name}. Habitat: ${species.bullets.habitat}. Diet: ${species.bullets.diet}. Personality: ${species.bullets.personality}.`;
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
      announce('Reading species information aloud');
    }
  };

  const handleLearnMore = () => {
    if (!species) return;
    
    // Navigate to deeper dive page
    navigate(`/species/${species.id}/deep`);
    announce(`Navigating to detailed information for ${species.name}`);
  };

  if (!isOpen) return null;

  // Loading state
  if (loading) {
    return (
      <div 
        className="info-card-backdrop"
        onClick={(e) => e.target === e.currentTarget && onClose()}
        role="presentation"
      >
        <div
          ref={dialogRef}
          className="info-card info-card--loading"
          role="dialog"
          aria-modal="true"
          aria-labelledby="info-card-loading"
        >
          <div className="info-card__loading">
            <div className="info-card__spinner" aria-hidden="true"></div>
            <h2 id="info-card-loading" className="info-card__loading-text">
              Loading species information...
            </h2>
            <button
              ref={closeButtonRef}
              className="info-card__close"
              onClick={onClose}
              aria-label="Close loading dialog"
              type="button"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !species) {
    return (
      <div 
        className="info-card-backdrop"
        onClick={(e) => e.target === e.currentTarget && onClose()}
        role="presentation"
      >
        <div
          ref={dialogRef}
          className="info-card info-card--error"
          role="dialog"
          aria-modal="true"
          aria-labelledby="info-card-error"
        >
          <div className="info-card__error">
            <h2 id="info-card-error" className="info-card__error-text">
              {error || 'Species not found'}
            </h2>
            <p className="info-card__error-description">
              Unable to load species information. Please try again.
            </p>
            <button
              ref={closeButtonRef}
              className="info-card__close"
              onClick={onClose}
              aria-label="Close error dialog"
              type="button"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentImageUrl = species.photoURLs[currentImageIndex] || '/images/placeholder-species.jpg';
  const hasMultipleImages = species.photoURLs.length > 1;

  return (
    <div 
      className="info-card-backdrop"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="info-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="info-card-title"
        aria-describedby="info-card-description"
      >
        <header className="info-card__header">
          <div className="info-card__title-section">
            <h2 id="info-card-title" className="info-card__title">
              {species.name}
            </h2>
            <span className={`endangerment-badge endangerment-badge--${species.endangerment.toLowerCase()}`}>
              {getEndangermentLabel(species.endangerment)}
            </span>
          </div>
          <div className="info-card__header-actions">
            {ttsEnabled && (
              <button
                className="info-card__tts"
                onClick={handleTTS}
                aria-label={`Read ${species.name} information aloud`}
                type="button"
                title="Read aloud"
              >
                <span className="tts-icon" aria-hidden="true">🔊</span>
              </button>
            )}
            <button
              className="info-card__learn-more-button"
              onClick={handleLearnMore}
              aria-label={`Learn more about ${species.name}`}
              type="button"
            >
              Learn More  📚 
            </button>
            <button
              ref={closeButtonRef}
              className="info-card__close"
              onClick={onClose}
              aria-label="Close species information dialog"
              type="button"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        </header>

        <div className="info-card__content">
          <div className="info-card__image-container">
            {hasMultipleImages && (
              <button
                className="info-card__carousel-button info-card__carousel-button--prev"
                onClick={handlePreviousImage}
                aria-label="Previous image"
                type="button"
              >
                <span aria-hidden="true">‹</span>
              </button>
            )}
            <img
              src={currentImageUrl}
              alt={`${species.name} - Image ${currentImageIndex + 1} of ${species.photoURLs.length}`}
              className="info-card__image"
            />
            {hasMultipleImages && (
              <button
                className="info-card__carousel-button info-card__carousel-button--next"
                onClick={handleNextImage}
                aria-label="Next image"
                type="button"
              >
                <span aria-hidden="true">›</span>
              </button>
            )}
            {hasMultipleImages && (
              <div className="info-card__carousel-indicators" aria-hidden="true">
                {species.photoURLs.map((_, index) => (
                  <button
                    key={index}
                    className={`info-card__carousel-indicator ${
                      index === currentImageIndex ? 'info-card__carousel-indicator--active' : ''
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                    aria-label={`Go to image ${index + 1}`}
                    type="button"
                  />
                ))}
              </div>
            )}
          </div>

          <div id="info-card-description" className="info-card__details">
            <div className="info-card__section">
              <h3 className="info-card__section-title">Habitat</h3>
              <p className="info-card__section-content">
                {species.bullets.habitat}
              </p>
            </div>

            <div className="info-card__section">
              <h3 className="info-card__section-title">Diet</h3>
              <p className="info-card__section-content">
                {species.bullets.diet}
              </p>
            </div>

            <div className="info-card__section">
              <h3 className="info-card__section-title">Personality</h3>
              <p className="info-card__section-content">
                {species.bullets.personality}
              </p>
            </div>


          </div>
        </div>

        <VisuallyHidden>
          <p>Press Escape to close this dialog, or click the close button. {hasMultipleImages ? 'Use arrow buttons to navigate through images.' : ''}</p>
        </VisuallyHidden>
      </div>
    </div>
  );
}

// Helper function to get human-readable endangerment labels
function getEndangermentLabel(endangerment: string): string {
  const labels: Record<string, string> = {
    'LC': 'Least Concern',
    'NT': 'Near Threatened',
    'VU': 'Vulnerable',
    'EN': 'Endangered',
    'CR': 'Critically Endangered',
  };
  return labels[endangerment] || endangerment;
}
