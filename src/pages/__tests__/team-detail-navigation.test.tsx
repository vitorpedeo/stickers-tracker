import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { repository } from '../../data/repositorySingleton'
import { buildInitialCollection } from '../../domain/seed'
import { TeamDetailPage } from '../TeamDetailPage'

function SourceHistoryProbe() {
  const location = useLocation()
  return (
    <h1>
      {location.search === '?from=source'
        ? 'Previous source entry'
        : 'Fresh source entry'}
    </h1>
  )
}

function TeamsFallbackProbe() {
  return <h1>Teams fallback entry</h1>
}

describe('Team detail navigation', () => {
  beforeEach(async () => {
    await repository.resetDatabase()
    await repository.seed(buildInitialCollection())
  })

  it('returns to the previous history entry without requiring route state', async () => {
    window.history.replaceState({ idx: 1 }, '', window.location.href)

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
            '/source?from=source',
            '/teams/CAN',
          ]}
          initialIndex={1}
        >
          <Routes>
            <Route path="/source" element={<SourceHistoryProbe />} />
            <Route path="/teams" element={<TeamsFallbackProbe />} />
            <Route path="/teams/:teamId" element={<TeamDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    fireEvent.click(await screen.findByRole('button', { name: /back to teams/i }))

    expect(
      await screen.findByRole('heading', { name: /previous source entry/i }),
    ).toBeInTheDocument()
  })

  it('falls back to teams when there is no previous history entry', async () => {
    window.history.replaceState({ idx: 0 }, '', window.location.href)

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/teams/CAN']}>
          <Routes>
            <Route path="/teams" element={<TeamsFallbackProbe />} />
            <Route path="/teams/:teamId" element={<TeamDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    fireEvent.click(await screen.findByRole('button', { name: /back to teams/i }))

    expect(
      await screen.findByRole('heading', { name: /teams fallback entry/i }),
    ).toBeInTheDocument()
  })
})
