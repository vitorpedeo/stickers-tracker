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
    <div>
      <header>
        <h1>World Cup Stickers Tracker</h1>
        <nav aria-label="Primary">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <section>
        <h2>{title}</h2>
        {children}
      </section>
    </div>
  )
}
