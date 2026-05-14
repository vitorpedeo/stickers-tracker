import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppProviders } from '../../app/providers'
import { TeamsPage } from '../TeamsPage'

describe('TeamsPage', () => {
  it('renders seeded teams and links to team pages', async () => {
    render(
      <MemoryRouter>
        <AppProviders>
          <TeamsPage />
        </AppProviders>
      </MemoryRouter>,
    )

    expect(await screen.findByPlaceholderText(/search by team name/i)).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /canada/i })).toHaveAttribute(
      'href',
      '/teams/canada',
    )
    expect(screen.getByRole('link', { name: /argentina/i })).toHaveAttribute(
      'href',
      '/teams/argentina',
    )
  })
})
