import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
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

  it('supports click cycling, right-click selection, and bulk duplicate action', async () => {
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

    const firstSticker = await screen.findByRole('button', { name: /sticker 01/i })
    expect(within(firstSticker).getByText(/missing/i)).toBeInTheDocument()

    await user.click(firstSticker)
    expect(await within(firstSticker).findByText(/collected/i)).toBeInTheDocument()

    await user.click(firstSticker)
    expect(await within(firstSticker).findByText(/dupes x2/i)).toBeInTheDocument()

    await user.click(firstSticker)
    expect(await within(firstSticker).findByText(/missing/i)).toBeInTheDocument()

    fireEvent.contextMenu(firstSticker)
    expect(firstSticker).toHaveClass('is-selected')
    fireEvent.contextMenu(firstSticker)
    expect(firstSticker).not.toHaveClass('is-selected')

    const bulkInput = screen.getByRole('textbox', { name: /bulk sticker list/i })
    await user.clear(bulkInput)
    await user.type(bulkInput, '1-2')
    await user.click(screen.getByRole('button', { name: /mark duplicate/i }))

    expect(await within(firstSticker).findByText(/dupes x2/i)).toBeInTheDocument()
    const secondSticker = screen.getByRole('button', { name: /sticker 02/i })
    expect(await within(secondSticker).findByText(/dupes x2/i)).toBeInTheDocument()
  })
})
