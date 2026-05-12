import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../../App'
import { AppProviders } from '../providers'

describe('App bootstrap', () => {
  it('renders the app shell heading', () => {
    render(
      <AppProviders>
        <App />
      </AppProviders>,
    )
    expect(
      screen.getByRole('heading', { name: /world cup stickers tracker/i }),
    ).toBeInTheDocument()
  })
})
