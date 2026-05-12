import { createBrowserRouter } from 'react-router-dom'
import { DashboardPage } from '../pages/DashboardPage'
import { SettingsPage } from '../pages/SettingsPage'
import { TeamDetailPage } from '../pages/TeamDetailPage'
import { TeamsPage } from '../pages/TeamsPage'
import { TradePage } from '../pages/TradePage'

export const router = createBrowserRouter([
  { path: '/', element: <DashboardPage /> },
  { path: '/teams', element: <TeamsPage /> },
  { path: '/teams/:teamId', element: <TeamDetailPage /> },
  { path: '/trade', element: <TradePage /> },
  { path: '/settings', element: <SettingsPage /> },
])
