import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

type AppFrameProps = {
  children: ReactNode
}

const navItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/teams', label: 'Teams' },
  { to: '/settings', label: 'Settings' },
]

export function AppFrame({ children }: AppFrameProps) {
  return (
    <div className="app-shell">
      <div className="bg-glow bg-glow-a" aria-hidden="true" />
      <div className="bg-glow bg-glow-b" aria-hidden="true" />
      <main className="app-main">{children}</main>
      <nav className="bottom-nav" aria-label="Primary">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              isActive ? 'bottom-nav-link is-active' : 'bottom-nav-link'
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
