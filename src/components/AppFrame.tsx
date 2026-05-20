import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

type AppFrameProps = {
  children: ReactNode
}

const navItems = [
  { to: '/',        label: 'Home',    ico: '■', end: true  },
  { to: '/teams',   label: 'Teams',   ico: '☰', end: false },
  { to: '/trade',   label: 'Doubles', ico: '⇆', end: false },
  { to: '/settings',label: 'Settings',ico: '⚙', end: false },
]

export function AppFrame({ children }: AppFrameProps) {
  return (
    <div className="app-shell">
      <div className="app-main">
        <div className="page-scroll">{children}</div>
      </div>
      <nav className="bottom-nav" aria-label="Primary">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              isActive ? 'nav-tab is-active' : 'nav-tab'
            }
          >
            <span className="nav-tab-ico">{item.ico}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
