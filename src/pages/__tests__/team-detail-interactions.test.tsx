import 'fake-indexeddb/auto'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { repository } from '../../data/repositorySingleton'
import { buildInitialCollection } from '../../domain/seed'
import { TeamDetailPage } from '../TeamDetailPage'

describe('Team detail interactions', () => {
  beforeEach(async () => {
    await repository.resetDatabase()
    await repository.seed(buildInitialCollection())
  })

  it('supports status toggle, duplicate increment, and note edit', async () => {
    const user = userEvent.setup()
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/teams/canada']}>
          <Routes>
            <Route path="/teams/:teamId" element={<TeamDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    const stickerTile = await screen.findByRole('article', { name: /sticker 01-01/i })

    await user.click(within(stickerTile).getByRole('button', { name: /set collected/i }))
    await user.click(within(stickerTile).getByRole('button', { name: /increase duplicates/i }))

    expect(await within(stickerTile).findByText(/duplicates: 1/i)).toBeInTheDocument()

    const noteField = within(stickerTile).getByLabelText(/trade note/i)
    await user.type(noteField, 'need for swap')
    expect(noteField).toHaveValue('need for swap')

    await user.click(within(stickerTile).getByRole('button', { name: /set missing/i }))

    expect(await within(stickerTile).findByText(/duplicates: 0/i)).toBeInTheDocument()
    expect(within(stickerTile).getByRole('button', { name: /increase duplicates/i })).toBeDisabled()
  })
})
