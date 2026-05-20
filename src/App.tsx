import { useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import { ReloadPrompt } from './pwa/ReloadPrompt'

const SEEN_KEY = 'wc26-privacy-seen'

function FirstRunWarning() {
  const [visible, setVisible] = useState(() => !localStorage.getItem(SEEN_KEY))

  if (!visible) return null

  const dismiss = () => {
    localStorage.setItem(SEEN_KEY, '1')
    setVisible(false)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(11,11,15,0.6)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          background: '#F8F1DE',
          border: '3px solid #0B0B0F',
          borderRadius: 18,
          boxShadow: '8px 8px 0 #0B0B0F',
          padding: '28px 26px 24px',
          maxWidth: 420,
          width: '100%',
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: 'inline-block',
            padding: '4px 10px',
            background: '#FFD43A',
            border: '2px solid #0B0B0F',
            borderRadius: 6,
            fontWeight: 800,
            fontSize: 11,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: 14,
          }}
        >
          Before you start
        </div>

        <h2
          style={{
            fontFamily: "'Archivo Black', sans-serif",
            fontSize: 26,
            margin: '0 0 16px',
            letterSpacing: '-0.01em',
            lineHeight: 1.05,
          }}
        >
          Your data stays on this device
        </h2>

        <ul
          style={{
            margin: '0 0 24px',
            paddingLeft: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          <li>
            All sticker progress is stored <strong>locally in your browser</strong>. Nothing is sent to any server.
          </li>
          <li>
            <strong>Do not use this app on a shared or public device</strong> — anyone with access to this browser can see or reset your collection.
          </li>
        </ul>

        <button
          type="button"
          onClick={dismiss}
          style={{
            width: '100%',
            background: '#0B0B0F',
            color: '#FFD43A',
            border: '3px solid #0B0B0F',
            borderRadius: 12,
            boxShadow: '4px 4px 0 #0B0B0F',
            padding: '13px 18px',
            fontFamily: "'Archivo Black', sans-serif",
            fontSize: 15,
            cursor: 'pointer',
            letterSpacing: '0.02em',
          }}
        >
          Got it — let's track stickers
        </button>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <ReloadPrompt />
      <FirstRunWarning />
    </>
  )
}
