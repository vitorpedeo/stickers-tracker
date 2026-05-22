import { ArrowLeftRight, Home, Settings, Users } from 'lucide-react'
import type { ComponentType } from 'react'
import { NavLink, Outlet, ScrollRestoration } from 'react-router-dom'

type NavItem = {
  to: string
  label: string
  Icon: ComponentType<{ size?: number; strokeWidth?: number }>
  end: boolean
}

const navItems: NavItem[] = [
  { to: '/',         label: 'Home',     Icon: Home,           end: true  },
  { to: '/teams',    label: 'Teams',    Icon: Users,          end: false },
  { to: '/trade',    label: 'Doubles',  Icon: ArrowLeftRight, end: false },
  { to: '/settings', label: 'Settings', Icon: Settings,       end: false },
]

export function AppFrame() {
  return (
    <div className="app-shell">
      <ScrollRestoration />
      <div className="app-main">
        <div className="page-scroll">
          <Outlet />
        </div>
      </div>
      <nav className="bottom-nav" aria-label="Primary">
        {navItems.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              isActive ? 'nav-tab is-active' : 'nav-tab'
            }
          >
            <span className="nav-tab-ico">
              <Icon size={20} strokeWidth={2} />
            </span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
