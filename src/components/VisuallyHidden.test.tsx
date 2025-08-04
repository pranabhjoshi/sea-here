import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { VisuallyHidden } from './VisuallyHidden'

describe('VisuallyHidden', () => {
  it('renders children with visually hidden styles', () => {
    const { container } = render(
      <VisuallyHidden>
        <span>Hidden content</span>
      </VisuallyHidden>
    )
    
    const hiddenElement = container.querySelector('.visually-hidden')
    expect(hiddenElement).toBeInTheDocument()
    expect(hiddenElement).toHaveTextContent('Hidden content')
    
    // Verify visually hidden styles are applied
    const styles = window.getComputedStyle(hiddenElement!)
    expect(styles.position).toBe('absolute')
    expect(styles.width).toBe('1px')
    expect(styles.height).toBe('1px')
    expect(styles.overflow).toBe('hidden')
  })

  it('applies additional className when provided', () => {
    const { container } = render(
      <VisuallyHidden className="custom-class">
        <span>Content</span>
      </VisuallyHidden>
    )
    
    const hiddenElement = container.querySelector('.visually-hidden')
    expect(hiddenElement).toHaveClass('visually-hidden', 'custom-class')
  })
})
