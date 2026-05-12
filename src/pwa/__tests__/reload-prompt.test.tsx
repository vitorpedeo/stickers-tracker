import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ReloadPrompt } from '../ReloadPrompt'

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [false, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  }),
}))

describe('ReloadPrompt', () => {
  it('renders nothing by default', () => {
    render(<ReloadPrompt />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
