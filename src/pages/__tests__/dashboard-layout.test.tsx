import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppProviders } from '../../app/providers'
import { DashboardPage } from '../DashboardPage'

describe('Dashboard layout', () => {
  it('renders the core dashboard KPI cards', async () => {
    render(
      <AppProviders>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </AppProviders>,
    )

    expect(await screen.findByText(/album completion/i)).toBeInTheDocument()
    expect(screen.getByText(/\d+ got/i)).toBeInTheDocument()
    expect(screen.getByText(/\d+ missing/i)).toBeInTheDocument()
    expect(screen.getByText(/\d+ dupes/i)).toBeInTheDocument()
  })

  it('renders a download pdf button', async () => {
    render(
      <AppProviders>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </AppProviders>,
    )

    expect(await screen.findByRole('button', { name: /download pdf/i })).toBeInTheDocument()
  })
})
