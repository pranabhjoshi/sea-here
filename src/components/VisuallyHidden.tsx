import { type ReactNode } from 'react'

interface VisuallyHiddenProps {
  children: ReactNode
  className?: string
}

export function VisuallyHidden({ children, className = '' }: VisuallyHiddenProps) {
  return (
    <div
      className={`visually-hidden ${className}`}
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {children}
    </div>
  )
}
