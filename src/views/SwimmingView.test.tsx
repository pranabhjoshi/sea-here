/**
 * Tests for SwimmingView component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SwimmingView } from './SwimmingView';

// Mock CSS imports
vi.mock('./SwimmingView.css', () => ({}));

// Mock the preload module
vi.mock('../data/preload', () => ({
  coreSpecies: [
    {
      id: 'sea-otter',
      name: 'Sea Otter',
      endangerment: 'EN',
      bullets: {
        habitat: 'Kelp forests and coastal waters',
        diet: 'Sea urchins, crabs, mollusks',
        personality: 'Playful and social',
      },
      photoURLs: ['/images/sea-otter.jpg'],
    },
    {
      id: 'octopus',
      name: 'Giant Pacific Octopus',
      endangerment: 'LC',
      bullets: {
        habitat: 'Rocky reefs and caves',
        diet: 'Crabs, fish, sharks',
        personality: 'Intelligent and curious',
      },
      photoURLs: ['/images/octopus.jpg'],
    },
    {
      id: 'seal',
      name: 'Harbor Seal',
      endangerment: 'LC',
      bullets: {
        habitat: 'Coastal waters and beaches',
        diet: 'Fish, squid, crustaceans',
        personality: 'Social and playful',
      },
      photoURLs: ['/images/seal.jpg'],
    },
    {
      id: 'wolf-eel',
      name: 'Wolf Eel',
      endangerment: 'LC',
      bullets: {
        habitat: 'Rocky crevices and caves',
        diet: 'Sea urchins, crabs, fish',
        personality: 'Gentle and curious',
      },
      photoURLs: ['/images/wolf-eel.jpg'],
    },
  ],
}));

// Mock child components
vi.mock('../components/Critter', () => ({
  Critter: ({ species, onTap, position }: any) => (
    <button
      data-testid={`critter-${species.id}`}
      onClick={() => onTap(species)}
      style={{ left: `${position.x}%`, top: `${position.y}%` }}
    >
      {species.name}
    </button>
  ),
}));

vi.mock('../components/InfoCard', () => ({
  InfoCard: ({ species, isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="info-card" role="dialog">
        <h2>{species.name}</h2>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

describe('SwimmingView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the ocean environment', () => {
    render(<SwimmingView />);
    
    const ocean = screen.getByRole('group', { name: 'Marine creatures' });
    expect(ocean).toBeInTheDocument();
  });

  it('renders 4 critters from preload data', () => {
    render(<SwimmingView />);
    
    expect(screen.getByTestId('critter-sea-otter')).toBeInTheDocument();
    expect(screen.getByTestId('critter-octopus')).toBeInTheDocument();
    expect(screen.getByTestId('critter-seal')).toBeInTheDocument();
    expect(screen.getByTestId('critter-wolf-eel')).toBeInTheDocument();
  });

  it('displays critters with accessible names', () => {
    render(<SwimmingView />);
    
    expect(screen.getByText('Sea Otter')).toBeInTheDocument();
    expect(screen.getByText('Giant Pacific Octopus')).toBeInTheDocument();
    expect(screen.getByText('Harbor Seal')).toBeInTheDocument();
    expect(screen.getByText('Wolf Eel')).toBeInTheDocument();
  });

  it('shows instructions for users', () => {
    render(<SwimmingView />);
    
    const instructions = screen.getByText('Tap or click on marine creatures to learn more about them');
    expect(instructions).toBeInTheDocument();
  });

  it('opens InfoCard when critter is clicked', async () => {
    render(<SwimmingView />);
    
    // Verify no modal initially
    expect(screen.queryByTestId('info-card')).not.toBeInTheDocument();
    
    const seaOtterCritter = screen.getByTestId('critter-sea-otter');
    fireEvent.click(seaOtterCritter);
    
    await waitFor(() => {
      const infoCard = screen.getByTestId('info-card');
      expect(infoCard).toBeInTheDocument();
      // Check for the heading specifically in the modal
      const modalHeading = infoCard.querySelector('h2');
      expect(modalHeading).toHaveTextContent('Sea Otter');
    });
  });

  it('closes InfoCard when close button is clicked', async () => {
    render(<SwimmingView />);
    
    // Open the info card
    const seaOtterCritter = screen.getByTestId('critter-sea-otter');
    fireEvent.click(seaOtterCritter);
    
    await waitFor(() => {
      expect(screen.getByTestId('info-card')).toBeInTheDocument();
    });
    
    // Close the info card
    const infoCard = screen.getByTestId('info-card');
    const closeButton = infoCard.querySelector('button');
    expect(closeButton).toBeInTheDocument();
    fireEvent.click(closeButton!);
    
    await waitFor(() => {
      expect(screen.queryByTestId('info-card')).not.toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('can open different species InfoCards', async () => {
    render(<SwimmingView />);
    
    // Click on octopus
    const octopusCritter = screen.getByTestId('critter-octopus');
    fireEvent.click(octopusCritter);
    
    await waitFor(() => {
      const infoCard = screen.getByTestId('info-card');
      expect(infoCard).toBeInTheDocument();
      const modalHeading = infoCard.querySelector('h2');
      expect(modalHeading).toHaveTextContent('Giant Pacific Octopus');
    });
    
    // Close and open seal
    let infoCard = screen.getByTestId('info-card');
    const closeButton = infoCard.querySelector('button');
    fireEvent.click(closeButton!);
    
    await waitFor(() => {
      expect(screen.queryByTestId('info-card')).not.toBeInTheDocument();
    }, { timeout: 1000 });
    
    const sealCritter = screen.getByTestId('critter-seal');
    fireEvent.click(sealCritter);
    
    await waitFor(() => {
      infoCard = screen.getByTestId('info-card');
      expect(infoCard).toBeInTheDocument();
      const modalHeading = infoCard.querySelector('h2');
      expect(modalHeading).toHaveTextContent('Harbor Seal');
    });
  });

  it('applies custom className', () => {
    const { container } = render(<SwimmingView className="custom-class" />);
    
    const swimmingView = container.firstChild as HTMLElement;
    expect(swimmingView).toHaveClass('swimming-view', 'custom-class');
  });

  it('includes water effects for visual enhancement', () => {
    render(<SwimmingView />);
    
    const waterEffects = document.querySelector('.swimming-view__water-effects');
    expect(waterEffects).toBeInTheDocument();
    
    // Check for bubble elements
    const bubbles = document.querySelectorAll('.bubble');
    expect(bubbles).toHaveLength(3);
  });

  it('positions critters at different locations', () => {
    render(<SwimmingView />);
    
    const critters = [
      screen.getByTestId('critter-sea-otter'),
      screen.getByTestId('critter-octopus'),
      screen.getByTestId('critter-seal'),
      screen.getByTestId('critter-wolf-eel'),
    ];
    
    // Check that critters have different positions
    const positions = critters.map(critter => ({
      left: critter.style.left,
      top: critter.style.top,
    }));
    
    // All positions should be different
    const uniquePositions = new Set(positions.map(p => `${p.left}-${p.top}`));
    expect(uniquePositions.size).toBe(4);
  });

  it('has proper ARIA structure', () => {
    render(<SwimmingView />);
    
    // Check for proper grouping
    const critterGroup = screen.getByRole('group', { name: 'Marine creatures' });
    expect(critterGroup).toBeInTheDocument();
    
    // Check for live region
    const instructions = screen.getByText('Tap or click on marine creatures to learn more about them');
    const liveRegion = instructions.closest('[aria-live]');
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  });

  it('does not render InfoCard initially', () => {
    render(<SwimmingView />);
    
    expect(screen.queryByTestId('info-card')).not.toBeInTheDocument();
  });
});
