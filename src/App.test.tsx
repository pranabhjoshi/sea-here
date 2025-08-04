import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders Sea Here', () => {
    render(<App />)
    expect(screen.getByText('Sea Here')).toBeInTheDocument()
  })

  it('renders header, main, and footer landmarks', () => {
    render(<App />)
    expect(screen.getByRole('banner')).toBeInTheDocument() // header
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument() // footer
  })

  it('renders TTS toggle button with aria-label', () => {
    render(<App />)
    const ttsButton = screen.getByRole('button', { name: /toggle text-to-speech/i })
    expect(ttsButton).toBeInTheDocument()
    expect(ttsButton).toHaveAttribute('aria-label', 'Toggle text-to-speech')
  })

  it('renders tab bar with navigation buttons', () => {
    render(<App />)
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /home/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /list/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
  })

  it('has aria-live region for announcements', () => {
    const { container } = render(<App />)
    const liveRegion = container.querySelector('[aria-live="polite"]')
    expect(liveRegion).toBeInTheDocument()
    expect(liveRegion).toHaveAttribute('aria-live', 'polite')
    expect(liveRegion).toHaveAttribute('id', 'announcements')
  })

  it('aria-live region is visually hidden', () => {
    const { container } = render(<App />)
    const visuallyHidden = container.querySelector('.visually-hidden')
    expect(visuallyHidden).toBeInTheDocument()
    
    // Check that it has visually hidden styles
    const styles = window.getComputedStyle(visuallyHidden!)
    expect(styles.position).toBe('absolute')
    expect(styles.width).toBe('1px')
    expect(styles.height).toBe('1px')
  })
})
