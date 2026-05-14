import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../../App'
import { AppProviders } from '../providers'

describe('App bootstrap', () => {
  it('renders the app shell heading with app providers composition', async () => {
    window.history.pushState({}, '', '/')

    render(
      <AppProviders>
        <App />
      </AppProviders>,
    )

    expect(
      await screen.findByRole('heading', { name: /world cup 2026 sticker tracker/i }),
    ).toBeInTheDocument()
  })
})
