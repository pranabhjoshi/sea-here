/**
 * Navigation integration tests for InfoCard to DeeperDive flow
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import type { Species } from '../domain/types';

// Mock the repository
vi.mock('../data/repository', () => ({
  getSpecies: vi.fn(),
}));

// Mock the announce utility
vi.mock('../utils/announce', () => ({
  announce: vi.fn(),
  initializeAriaLiveRegion: vi.fn(),
}));

// Mock UI store
vi.mock('../state/ui', () => ({
  useUIStore: () => ({
    ttsEnabled: false,
    toggleTTS: vi.fn(),
  }),
}));

// Mock preload data
vi.mock('../data/preload', () => ({
  coreSpecies: [
    {
      id: 'sea-otter',
      name: 'Sea Otter',
      endangerment: 'EN',
      bullets: {
        habitat: 'Coastal waters',
        diet: 'Sea urchins and crabs',
        personality: 'Playful and social',
      },
      photoURLs: ['/images/sea-otter.svg'],
    },
  ],
  getCoreSpeciesById: vi.fn(),
}));

import { getSpecies } from '../data/repository';

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

describe('Navigation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSpecies).mockResolvedValue(mockSpecies);
  });

  it('navigates from InfoCard to DeeperDive when Learn more button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    
    // Wait for SwimmingView to load
    await waitFor(() => {
      expect(screen.getByTestId('critter-sea-otter')).toBeInTheDocument();
    });
    
    // Click on a critter to open InfoCard
    const seaOtterCritter = screen.getByTestId('critter-sea-otter');
    await user.click(seaOtterCritter);
    
    // Wait for InfoCard to load species data
    await waitFor(() => {
      expect(screen.getByText('Sea Otter')).toBeInTheDocument();
    });
    
    // Find and click the Learn More button
    const learnMoreButton = screen.getByRole('button', { name: /learn more about sea otter/i });
    expect(learnMoreButton).toBeInTheDocument();
    
    await user.click(learnMoreButton);
    
    // Should navigate to DeeperDive page
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Sea Otter' })).toBeInTheDocument();
      expect(screen.getByText('Conservation Deep Dive')).toBeInTheDocument();
    });
    
    // Should show DeeperDive content
    expect(screen.getByText('Species Overview')).toBeInTheDocument();
    expect(screen.getByText('Conservation Data')).toBeInTheDocument();
    expect(screen.getByText('Population Trends')).toBeInTheDocument();
  });

  it('maintains accessibility when navigating between routes', async () => {
    const user = userEvent.setup();
    
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    
    // Start at SwimmingView - should have main landmark
    expect(screen.getByRole('main')).toBeInTheDocument();
    
    // Navigate to DeeperDive
    await waitFor(() => {
      expect(screen.getByTestId('critter-sea-otter')).toBeInTheDocument();
    });
    
    const seaOtterCritter = screen.getByTestId('critter-sea-otter');
    await user.click(seaOtterCritter);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /learn more/i })).toBeInTheDocument();
    });
    
    const learnMoreButton = screen.getByRole('button', { name: /learn more/i });
    await user.click(learnMoreButton);
    
    // DeeperDive should have main landmark and h1
    await waitFor(() => {
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });

  it('allows back navigation from DeeperDive to previous page', async () => {
    render(
      <MemoryRouter initialEntries={['/species/sea-otter/deep']}>
        <App />
      </MemoryRouter>
    );
    
    // Should be on DeeperDive page
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Sea Otter' })).toBeInTheDocument();
    });
    
    // Should have back button
    const backButton = screen.getByRole('button', { name: 'Go back to previous page' });
    expect(backButton).toBeInTheDocument();
    
    // Note: In a real test environment, we'd need to mock the browser history
    // to verify that navigate(-1) was called, which is already tested in DeeperDive.test.tsx
  });

  it('handles direct navigation to DeeperDive route', async () => {
    render(
      <MemoryRouter initialEntries={['/species/sea-otter/deep']}>
        <App />
      </MemoryRouter>
    );
    
    // Should load DeeperDive directly
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Sea Otter' })).toBeInTheDocument();
      expect(screen.getByText('Conservation Deep Dive')).toBeInTheDocument();
    });
    
    // Should have proper accessibility structure
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('handles invalid species ID in DeeperDive route', async () => {
    vi.mocked(getSpecies).mockResolvedValue(undefined);
    
    render(
      <MemoryRouter initialEntries={['/species/invalid-id/deep']}>
        <App />
      </MemoryRouter>
    );
    
    // Should show error state
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Species Not Found' })).toBeInTheDocument();
    });
    
    // Should still have proper accessibility structure
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });
});
