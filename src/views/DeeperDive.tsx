/**
 * DeeperDive view - Detailed species conservation information
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getSpecies } from '../data/repository';
import type { Species } from '../domain/types';
import { announce } from '../utils/announce';
import './DeeperDive.css';

export function DeeperDive() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [species, setSpecies] = useState<Species | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSpecies = async () => {
      if (!id) {
        setError('Species ID not provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        announce('Loading detailed species information');
        
        const speciesData = await getSpecies(id);
        if (speciesData) {
          setSpecies(speciesData);
          announce(`Loaded detailed information for ${speciesData.name}`);
        } else {
          setError('Species not found');
          announce('Species not found');
        }
      } catch (err) {
        const errorMessage = 'Failed to load species information';
        setError(errorMessage);
        announce(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadSpecies();
  }, [id]);

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  if (loading) {
    return (
      <main className="deeper-dive" aria-live="polite">
        <div className="deeper-dive__loading">
          <div className="deeper-dive__spinner" aria-hidden="true"></div>
          <p>Loading detailed species information...</p>
        </div>
      </main>
    );
  }

  if (error || !species) {
    return (
      <main className="deeper-dive" role="main">
        <div className="deeper-dive__error">
          <h1>Species Not Found</h1>
          <p>{error || 'The requested species could not be found.'}</p>
          <button 
            onClick={handleBack}
            className="deeper-dive__back-button"
            type="button"
          >
            ← Back
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="deeper-dive" role="main">
      <div className="deeper-dive__header">
        <button 
          onClick={handleBack}
          className="deeper-dive__back-button"
          type="button"
          aria-label="Go back to previous page"
        >
          ← Back
        </button>
        <h1 className="deeper-dive__title">{species.name}</h1>
        <p className="deeper-dive__subtitle">Conservation Deep Dive</p>
      </div>

      <div className="deeper-dive__content">
        {/* Species Overview Section */}
        <section className="deeper-dive__section" aria-labelledby="overview-heading">
          <h2 id="overview-heading" className="deeper-dive__section-title">
            Species Overview
          </h2>
          <div className="deeper-dive__overview">
            <div className="deeper-dive__image-container">
              <img 
                src={species.photoURLs[0]} 
                alt={species.name}
                className="deeper-dive__image"
              />
            </div>
            <div className="deeper-dive__overview-text">
              <p><strong>Species ID:</strong> {species.id}</p>
              <p><strong>Conservation Status:</strong> {species.endangerment}</p>
              <p><strong>Habitat:</strong> {species.bullets.habitat}</p>
              <p><strong>Diet:</strong> {species.bullets.diet}</p>
            </div>
          </div>
        </section>

        {/* Conservation Chart Section */}
        <section className="deeper-dive__section" aria-labelledby="conservation-heading">
          <h2 id="conservation-heading" className="deeper-dive__section-title">
            Conservation Data
          </h2>
          <div className="deeper-dive__chart-container">
            <div className="deeper-dive__chart-placeholder">
              <div className="deeper-dive__chart-icon" aria-hidden="true">📊</div>
              <h3>Population Trends</h3>
              <p>Interactive conservation charts coming soon!</p>
              <div className="deeper-dive__chart-stub">
                <div className="deeper-dive__chart-bars">
                  <div className="deeper-dive__chart-bar" style={{ height: '60%' }}></div>
                  <div className="deeper-dive__chart-bar" style={{ height: '45%' }}></div>
                  <div className="deeper-dive__chart-bar" style={{ height: '30%' }}></div>
                  <div className="deeper-dive__chart-bar" style={{ height: '25%' }}></div>
                </div>
                <div className="deeper-dive__chart-labels">
                  <span>2000</span>
                  <span>2010</span>
                  <span>2020</span>
                  <span>2024</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Threats & Protection Section */}
        <section className="deeper-dive__section" aria-labelledby="threats-heading">
          <h2 id="threats-heading" className="deeper-dive__section-title">
            Threats & Protection
          </h2>
          <div className="deeper-dive__threats">
            <div className="deeper-dive__threat-item">
              <h3>🌊 Climate Change</h3>
              <p>Ocean warming and acidification affect marine ecosystems.</p>
            </div>
            <div className="deeper-dive__threat-item">
              <h3>🎣 Overfishing</h3>
              <p>Reduced prey availability impacts species survival.</p>
            </div>
            <div className="deeper-dive__threat-item">
              <h3>🏭 Pollution</h3>
              <p>Plastic waste and chemical runoff harm marine life.</p>
            </div>
          </div>
        </section>

        {/* How to Help Section */}
        <section className="deeper-dive__section" aria-labelledby="help-heading">
          <h2 id="help-heading" className="deeper-dive__section-title">
            How You Can Help
          </h2>
          <div className="deeper-dive__help-actions">
            <div className="deeper-dive__help-item">
              <span className="deeper-dive__help-icon">♻️</span>
              <h3>Reduce Plastic Use</h3>
              <p>Choose reusable items and support plastic-free initiatives.</p>
            </div>
            <div className="deeper-dive__help-item">
              <span className="deeper-dive__help-icon">🐟</span>
              <h3>Sustainable Seafood</h3>
              <p>Choose sustainably sourced seafood options.</p>
            </div>
            <div className="deeper-dive__help-item">
              <span className="deeper-dive__help-icon">💚</span>
              <h3>Support Conservation</h3>
              <p>Donate to marine conservation organizations.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
