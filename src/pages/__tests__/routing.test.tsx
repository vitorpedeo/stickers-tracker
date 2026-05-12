import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

type RouteCase = {
  path: string
  heading: RegExp
}

const routeCases: RouteCase[] = [
  { path: '/', heading: /dashboard/i },
  { path: '/teams', heading: /teams/i },
  { path: '/teams/argentina', heading: /^team$/i },
  { path: '/trade', heading: /trade/i },
  { path: '/settings', heading: /settings/i },
]

describe('Routing', () => {
  it.each(routeCases)('shows route content for $path', async ({ path, heading }) => {
    window.history.pushState({}, '', path)
    vi.resetModules()

    const [{ default: App }, { AppProviders }] = await Promise.all([
      import('../../App'),
      import('../../app/providers'),
    ])

    render(
      <AppProviders>
        <App />
      </AppProviders>,
    )

    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
  })
})
