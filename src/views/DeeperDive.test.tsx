/**
 * DeeperDive component tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { DeeperDive } from './DeeperDive';
import type { Species } from '../domain/types';

// Mock the repository
vi.mock('../data/repository', () => ({
  getSpecies: vi.fn(),
}));

// Mock the announce utility
vi.mock('../utils/announce', () => ({
  announce: vi.fn(),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { getSpecies } from '../data/repository';
import { announce } from '../utils/announce';

const mockSpecies: Species = {
  id: 'sea-otter',
  name: 'Sea Otter',
  endangerment: 'EN',
  bullets: {
    habitat: 'Coastal waters of the Pacific Ocean',
    diet: 'Sea urchins, crabs, clams, and other marine invertebrates',
    personality: 'Playful, social, and highly intelligent marine mammals',
  },
  photoURLs: ['/images/sea-otter.svg'],
};

const renderDeeperDive = (speciesId = 'sea-otter') => {
  return render(
    <MemoryRouter initialEntries={[`/species/${speciesId}/deep`]}>
      <DeeperDive />
    </MemoryRouter>
  );
};

describe('DeeperDive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('shows loading spinner and message while fetching species data', async () => {
      vi.mocked(getSpecies).mockImplementation(() => new Promise(() => {})); // Never resolves
      
      renderDeeperDive();
      
      expect(screen.getByText('Loading detailed species information...')).toBeInTheDocument();
      expect(screen.getByRole('main')).toHaveAttribute('aria-live', 'polite');
      
      // Check for spinner
      const spinner = document.querySelector('.deeper-dive__spinner');
      expect(spinner).toBeInTheDocument();
    });

    it('announces loading state', async () => {
      vi.mocked(getSpecies).mockImplementation(() => new Promise(() => {}));
      
      renderDeeperDive();
      
      await waitFor(() => {
        expect(announce).toHaveBeenCalledWith('Loading detailed species information');
      });
    });
  });

  describe('Success State', () => {
    beforeEach(() => {
      vi.mocked(getSpecies).mockResolvedValue(mockSpecies);
    });

    it('renders species information with proper heading structure', async () => {
      renderDeeperDive();
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Sea Otter');
      });
      
      expect(screen.getByText('Conservation Deep Dive')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('has proper accessibility landmarks and headings', async () => {
      renderDeeperDive();
      
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
      
      // Check for h1
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Sea Otter');
      
      // Check for section headings
      expect(screen.getByRole('heading', { name: 'Species Overview' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Conservation Data' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Threats & Protection' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'How You Can Help' })).toBeInTheDocument();
    });

    it('displays species overview information', async () => {
      renderDeeperDive();
      
      await waitFor(() => {
        expect(screen.getByText('Sea Otter')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Species ID:')).toBeInTheDocument();
      expect(screen.getByText('sea-otter')).toBeInTheDocument();
      expect(screen.getByText('Conservation Status:')).toBeInTheDocument();
      expect(screen.getByText('EN')).toBeInTheDocument();
      expect(screen.getByText('Habitat:')).toBeInTheDocument();
      expect(screen.getByText('Coastal waters of the Pacific Ocean')).toBeInTheDocument();
    });

    it('displays conservation chart placeholder', async () => {
      renderDeeperDive();
      
      await waitFor(() => {
        expect(screen.getByText('Population Trends')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Interactive conservation charts coming soon!')).toBeInTheDocument();
      
      // Check for chart stub elements
      expect(screen.getByText('2000')).toBeInTheDocument();
      expect(screen.getByText('2010')).toBeInTheDocument();
      expect(screen.getByText('2020')).toBeInTheDocument();
      expect(screen.getByText('2024')).toBeInTheDocument();
    });

    it('displays threats and protection information', async () => {
      renderDeeperDive();
      
      await waitFor(() => {
        expect(screen.getByText('🌊 Climate Change')).toBeInTheDocument();
      });
      
      expect(screen.getByText('🎣 Overfishing')).toBeInTheDocument();
      expect(screen.getByText('🏭 Pollution')).toBeInTheDocument();
    });

    it('displays how to help section', async () => {
      renderDeeperDive();
      
      await waitFor(() => {
        expect(screen.getByText('♻️')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Reduce Plastic Use')).toBeInTheDocument();
      expect(screen.getByText('Sustainable Seafood')).toBeInTheDocument();
      expect(screen.getByText('Support Conservation')).toBeInTheDocument();
    });

    it('announces successful species loading', async () => {
      renderDeeperDive();
      
      await waitFor(() => {
        expect(announce).toHaveBeenCalledWith('Loaded detailed information for Sea Otter');
      });
    });
  });

  describe('Error State', () => {
    it('shows error message when species not found', async () => {
      vi.mocked(getSpecies).mockResolvedValue(undefined);
      
      renderDeeperDive();
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Species Not Found');
      });
      
      expect(screen.getByText('Species not found')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('shows error message when API fails', async () => {
      vi.mocked(getSpecies).mockRejectedValue(new Error('API Error'));
      
      renderDeeperDive();
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Species Not Found');
      });
      
      expect(screen.getByText('Failed to load species information')).toBeInTheDocument();
    });

    it('announces error state', async () => {
      vi.mocked(getSpecies).mockRejectedValue(new Error('API Error'));
      
      renderDeeperDive();
      
      await waitFor(() => {
        expect(announce).toHaveBeenCalledWith('Failed to load species information');
      });
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      vi.mocked(getSpecies).mockResolvedValue(mockSpecies);
    });

    it('has accessible back button', async () => {
      renderDeeperDive();
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Go back to previous page' })).toBeInTheDocument();
      });
    });

    it('navigates back when back button is clicked', async () => {
      const user = userEvent.setup();
      renderDeeperDive();
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Go back to previous page' })).toBeInTheDocument();
      });
      
      const backButton = screen.getByRole('button', { name: 'Go back to previous page' });
      await user.click(backButton);
      
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('shows back button in error state', async () => {
      vi.mocked(getSpecies).mockResolvedValue(undefined);
      
      renderDeeperDive();
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
      });
    });
  });

  describe('Missing Species ID', () => {
    it('shows error when no species ID provided', async () => {
      render(
        <MemoryRouter initialEntries={['/species//deep']}>
          <DeeperDive />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Species ID not provided')).toBeInTheDocument();
      });
      
      expect(getSpecies).not.toHaveBeenCalled();
    });
  });
});
