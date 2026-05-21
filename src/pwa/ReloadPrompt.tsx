import { ArrowUp, X, Zap } from 'lucide-react'
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
    <>
      <div className="pwa-toast" role="alert">
        <div className={`pwa-toast-inner ${offlineReady ? 'pwa-toast-inner--offline' : 'pwa-toast-inner--update'}`}>
          <span className="pwa-toast-icon" aria-hidden="true">
            {offlineReady ? <Zap size={16} /> : <ArrowUp size={16} />}
          </span>
          <span className="pwa-toast-msg">
            {offlineReady ? 'Ready offline' : 'Update available'}
          </span>
          {needRefresh && (
            <button
              type="button"
              className="pwa-toast-reload"
              onClick={() => updateServiceWorker(true)}
            >
              Reload
            </button>
          )}
          <button type="button" className="pwa-toast-close" onClick={close} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      </div>
    </>
  )
}
