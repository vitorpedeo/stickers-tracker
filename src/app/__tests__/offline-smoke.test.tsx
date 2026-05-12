import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../../App'
import { AppProviders } from '../providers'

describe('offline smoke', () => {
  it('mounts application shell without runtime fetch dependency', () => {
    window.history.pushState({}, '', '/')

    const { container } = render(
      <AppProviders>
        <App />
      </AppProviders>,
    )

    expect(container).toBeTruthy()
  })
})
