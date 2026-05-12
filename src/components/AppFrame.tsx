import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

type AppFrameProps = {
  title: string
  children: ReactNode
}

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/teams', label: 'Teams' },
  { to: '/trade', label: 'Trade' },
  { to: '/settings', label: 'Settings' },
]

export function AppFrame({ title, children }: AppFrameProps) {
  return (
    <div className="app-frame">
      <header className="app-header">
        <h1 className="app-title">World Cup Stickers Tracker</h1>
        <nav className="app-nav" aria-label="Primary">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? 'app-nav-link app-nav-link-active' : 'app-nav-link'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <section className="app-content">
        <h2 className="page-title">{title}</h2>
        {children}
      </section>
    </div>
  )
}
