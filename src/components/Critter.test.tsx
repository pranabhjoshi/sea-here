/**
 * Tests for Critter component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Critter } from './Critter';
import type { Species } from '../domain/types';

// Mock CSS imports
vi.mock('./Critter.css', () => ({}));

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

describe('Critter', () => {
  const defaultProps = {
    species: mockSpecies,
    position: { x: 50, y: 50 },
    onTap: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with correct aria-label', () => {
    render(<Critter {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: 'Open Test Species info' });
    expect(button).toBeInTheDocument();
  });

  it('displays species image', () => {
    render(<Critter {...defaultProps} />);
    
    // Image has alt="" so it has presentation role, not img role
    const image = document.querySelector('img');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/images/test-species.jpg');
    expect(image).toHaveAttribute('alt', '');
    expect(image).toHaveAttribute('draggable', 'false');
  });

  it('includes visually hidden species name', () => {
    render(<Critter {...defaultProps} />);
    
    const name = screen.getByText('Test Species');
    expect(name).toBeInTheDocument();
    expect(name).toHaveClass('visually-hidden');
  });

  it('calls onTap when clicked', () => {
    const onTap = vi.fn();
    render(<Critter {...defaultProps} onTap={onTap} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(onTap).toHaveBeenCalledWith(mockSpecies);
  });

  it('calls onTap when Enter key is pressed', () => {
    const onTap = vi.fn();
    render(<Critter {...defaultProps} onTap={onTap} />);
    
    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: 'Enter' });
    
    expect(onTap).toHaveBeenCalledWith(mockSpecies);
  });

  it('calls onTap when Space key is pressed', () => {
    const onTap = vi.fn();
    render(<Critter {...defaultProps} onTap={onTap} />);
    
    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: ' ' });
    
    expect(onTap).toHaveBeenCalledWith(mockSpecies);
  });

  it('does not call onTap for other keys', () => {
    const onTap = vi.fn();
    render(<Critter {...defaultProps} onTap={onTap} />);
    
    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: 'Tab' });
    fireEvent.keyDown(button, { key: 'Escape' });
    
    expect(onTap).not.toHaveBeenCalled();
  });

  it('applies pressed state on mouse down', () => {
    render(<Critter {...defaultProps} />);
    
    const button = screen.getByRole('button');
    fireEvent.mouseDown(button);
    
    expect(button).toHaveClass('critter--pressed');
  });

  it('removes pressed state on mouse up', () => {
    render(<Critter {...defaultProps} />);
    
    const button = screen.getByRole('button');
    fireEvent.mouseDown(button);
    fireEvent.mouseUp(button);
    
    expect(button).not.toHaveClass('critter--pressed');
  });

  it('removes pressed state on mouse leave', () => {
    render(<Critter {...defaultProps} />);
    
    const button = screen.getByRole('button');
    fireEvent.mouseDown(button);
    fireEvent.mouseLeave(button);
    
    expect(button).not.toHaveClass('critter--pressed');
  });

  it('applies custom className', () => {
    render(<Critter {...defaultProps} className="custom-class" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('critter', 'custom-class');
  });

  it('uses placeholder image when no photoURLs provided', () => {
    const speciesWithoutPhoto: Species = {
      ...mockSpecies,
      photoURLs: [],
    };
    
    render(<Critter {...defaultProps} species={speciesWithoutPhoto} />);
    
    const images = screen.queryAllByRole('img');
    if (images.length > 0) {
      const image = images[0];
      expect(image).toHaveAttribute('src', '/images/placeholder-critter.svg');
    }
  });

  it('has correct button type', () => {
    render(<Critter {...defaultProps} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'button');
  });
});
