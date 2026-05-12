import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { DashboardPage } from '../DashboardPage'

describe('Dashboard layout', () => {
  it('renders the core stat ribbon cards', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    expect(screen.getByText(/collected/i)).toBeInTheDocument()
    expect(screen.getByText(/missing/i)).toBeInTheDocument()
    expect(screen.getByText(/duplicates/i)).toBeInTheDocument()
    expect(screen.getByText(/completion/i)).toBeInTheDocument()
  })
})
