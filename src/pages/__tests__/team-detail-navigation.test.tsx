import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { repository } from '../../data/repositorySingleton'
import { buildInitialCollection } from '../../domain/seed'
import { TeamDetailPage } from '../TeamDetailPage'

function TeamsHistoryProbe() {
  const location = useLocation()
  return (
    <h1>
      {location.search === '?from=list'
        ? 'Previous teams entry'
        : 'Fresh teams entry'}
    </h1>
  )
}

describe('Team detail navigation', () => {
  beforeEach(async () => {
    await repository.resetDatabase()
    await repository.seed(buildInitialCollection())
  })

  it('returns to the previous teams history entry when opened from teams', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter
          initialEntries={[
            '/teams?from=list',
            { pathname: '/teams/CAN', state: { fromTeamsPage: true } },
          ]}
          initialIndex={1}
        >
          <Routes>
            <Route path="/teams" element={<TeamsHistoryProbe />} />
            <Route path="/teams/:teamId" element={<TeamDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    fireEvent.click(await screen.findByRole('button', { name: /back to teams/i }))

    expect(
      await screen.findByRole('heading', { name: /previous teams entry/i }),
    ).toBeInTheDocument()
  })
})
