import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../../App'

describe('Routing', () => {
  it('shows dashboard route content', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument()
  })
})
