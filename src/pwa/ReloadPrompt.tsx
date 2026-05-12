import { useRegisterSW } from 'virtual:pwa-register/react'

export function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW()

  const close = () => {
    setNeedRefresh(false)
    setOfflineReady(false)
  }

  if (!needRefresh && !offlineReady) {
    return null
  }

  return (
    <aside role="alert">
      <p>
        {offlineReady
          ? 'App ready to work offline.'
          : 'New version available. Reload to update.'}
      </p>
      {needRefresh ? (
        <button type="button" onClick={() => updateServiceWorker(true)}>
          Reload
        </button>
      ) : null}
      <button type="button" onClick={close}>
        Close
      </button>
    </aside>
  )
}
