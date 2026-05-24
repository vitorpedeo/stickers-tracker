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
    expect(screen.getByText(/total stickers/i)).toBeInTheDocument()
    expect(screen.getByText(/^collected$/i)).toBeInTheDocument()
    expect(screen.getByText(/^missing$/i)).toBeInTheDocument()
    expect(screen.getByText(/duplicate copies/i)).toBeInTheDocument()
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
