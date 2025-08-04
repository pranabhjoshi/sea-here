/**
 * Tests for InfoCard component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InfoCard } from './InfoCard';
import type { Species } from '../domain/types';

// Mock the repository
vi.mock('../data/repository', () => ({
  getSpecies: vi.fn(),
}));

// Mock the UI store
vi.mock('../state/ui', () => ({
  useUIStore: vi.fn(() => ({ ttsEnabled: false })),
}));

// Mock the announce utility
vi.mock('../utils/announce', () => ({
  announce: vi.fn(),
  announceSpeciesLoaded: vi.fn(),
  announceLoading: vi.fn(),
  announceError: vi.fn(),
  announceModalOpened: vi.fn(),
  announceModalClosed: vi.fn(),
}));

// Mock the VisuallyHidden component
vi.mock('./VisuallyHidden', () => ({
  VisuallyHidden: ({ children }: { children: React.ReactNode }) => <div data-testid="visually-hidden">{children}</div>,
}));

const mockSpecies: Species = {
  id: 'test-species',
  name: 'Test Species',
  endangerment: 'LC',
  bullets: {
    habitat: 'Test habitat',
    diet: 'Test diet',
    personality: 'Test personality',
  },
  photoURLs: ['/images/test-species.jpg'],
};

const defaultProps = {
  speciesId: 'test-species',
  isOpen: true,
  onClose: vi.fn(),
};

describe('InfoCard', () => {
  let mockGetSpecies: ReturnType<typeof vi.fn>;
  let mockUseUIStore: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Reset document body overflow
    document.body.style.overflow = '';
    
    // Setup mock implementations
    const repositoryModule = await import('../data/repository');
    const uiModule = await import('../state/ui');
    
    mockGetSpecies = vi.mocked(repositoryModule.getSpecies);
    mockUseUIStore = vi.mocked(uiModule.useUIStore);
    
    mockGetSpecies.mockResolvedValue(mockSpecies);
    mockUseUIStore.mockReturnValue({ ttsEnabled: false });
  });

  it('renders nothing when not open', () => {
    const { container } = render(<InfoCard {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders modal with species information after loading', async () => {
    render(<InfoCard {...defaultProps} />);
    
    // Should show loading state initially
    expect(screen.getByText('Loading species information...')).toBeInTheDocument();
    
    // Wait for species data to load
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Test Species')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Test habitat')).toBeInTheDocument();
    expect(screen.getByText('Test diet')).toBeInTheDocument();
    expect(screen.getByText('Test personality')).toBeInTheDocument();
    expect(mockGetSpecies).toHaveBeenCalledWith('test-species');
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    render(<InfoCard {...defaultProps} onClose={onClose} />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Test Species')).toBeInTheDocument();
    });
    
    const closeButton = screen.getByRole('button', { name: 'Close species information dialog' });
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const onClose = vi.fn();
    render(<InfoCard {...defaultProps} onClose={onClose} />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Test Species')).toBeInTheDocument();
    });
    
    const backdrop = document.querySelector('.info-card-backdrop');
    fireEvent.click(backdrop!);
    
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not close when clicking inside the modal', async () => {
    const onClose = vi.fn();
    render(<InfoCard {...defaultProps} onClose={onClose} />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Test Species')).toBeInTheDocument();
    });
    
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when Escape key is pressed', async () => {
    const onClose = vi.fn();
    render(<InfoCard {...defaultProps} onClose={onClose} />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Test Species')).toBeInTheDocument();
    });
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('focuses close button when opened', async () => {
    render(<InfoCard {...defaultProps} />);
    
    await waitFor(() => {
      const closeButton = screen.getByRole('button', { name: 'Close species information dialog' });
      expect(closeButton).toHaveFocus();
    });
  });

  it('does not render when isOpen is false', () => {
    render(<InfoCard {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockGetSpecies).not.toHaveBeenCalled();
  });

  it('restores body scroll when closed', () => {
    const { rerender } = render(<InfoCard {...defaultProps} />);
    
    expect(document.body.style.overflow).toBe('hidden');
    
    rerender(<InfoCard {...defaultProps} isOpen={false} />);
    
    expect(document.body.style.overflow).toBe('');
  });

  it('handles Tab key for focus trap', async () => {
    render(<InfoCard {...defaultProps} />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Test Species')).toBeInTheDocument();
    });
    
    const closeButton = screen.getByRole('button', { name: 'Close species information dialog' });
    
    // Simulate Tab key - should not throw errors
    expect(() => {
      fireEvent.keyDown(closeButton, { key: 'Tab' });
    }).not.toThrow();
  });

  it('handles Shift+Tab for reverse focus trap', async () => {
    render(<InfoCard {...defaultProps} />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Test Species')).toBeInTheDocument();
    });
    
    const closeButton = screen.getByRole('button', { name: 'Close species information dialog' });
    
    // Simulate Shift+Tab - should not throw errors
    expect(() => {
      fireEvent.keyDown(closeButton, { key: 'Tab', shiftKey: true });
    }).not.toThrow();
  });

  it('displays correct endangerment labels', async () => {
    const testCases = [
      { endangerment: 'LC', label: 'Least Concern' },
      { endangerment: 'NT', label: 'Near Threatened' },
      { endangerment: 'VU', label: 'Vulnerable' },
      { endangerment: 'EN', label: 'Endangered' },
      { endangerment: 'CR', label: 'Critically Endangered' },
    ] as const;

    for (const { endangerment, label } of testCases) {
      const species = { ...mockSpecies, endangerment };
      mockGetSpecies.mockResolvedValueOnce(species);
      
      const { unmount } = render(<InfoCard {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });
      
      unmount();
    }
  });

  it('uses placeholder image when no photoURLs provided', async () => {
    const speciesWithoutPhoto = {
      ...mockSpecies,
      photoURLs: [],
    };
    
    mockGetSpecies.mockResolvedValue(speciesWithoutPhoto);
    render(<InfoCard {...defaultProps} />);
    
    await waitFor(() => {
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', '/images/placeholder-species.jpg');
    });
  });

  it('includes accessibility instructions', async () => {
    render(<InfoCard {...defaultProps} />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Test Species')).toBeInTheDocument();
    });
    
    const instructions = screen.getByTestId('visually-hidden');
    expect(instructions).toHaveTextContent('Press Escape to close this dialog, or click the close button.');
  });

  it('applies correct CSS classes for endangerment status', async () => {
    const endangeredSpecies = { ...mockSpecies, endangerment: 'EN' as const };
    mockGetSpecies.mockResolvedValue(endangeredSpecies);
    
    render(<InfoCard {...defaultProps} />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Test Species')).toBeInTheDocument();
    });
    
    const statusBadge = screen.getByText('Endangered');
    expect(statusBadge).toHaveClass('endangerment-badge', 'endangerment-badge--en');
  });
});
