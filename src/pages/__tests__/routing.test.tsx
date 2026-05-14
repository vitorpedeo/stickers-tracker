import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

type RouteCase = {
  path: string
  heading: RegExp
}

const routeCases: RouteCase[] = [
  { path: '/', heading: /world cup 2026 sticker tracker/i },
  { path: '/teams', heading: /^teams$/i },
  { path: '/teams/argentina', heading: /argentina/i },
  { path: '/settings', heading: /settings\s*&\s*export/i },
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

    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument()
  })
})
