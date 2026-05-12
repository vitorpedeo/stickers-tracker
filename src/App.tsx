import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import { ReloadPrompt } from './pwa/ReloadPrompt'

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <ReloadPrompt />
    </>
  )
}
