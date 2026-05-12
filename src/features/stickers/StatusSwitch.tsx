import type { StickerStatus } from '../../domain/types'

type StatusSwitchProps = {
  status: StickerStatus
  onChange: (next: StickerStatus) => void
}

export function StatusSwitch({ status, onChange }: StatusSwitchProps) {
  const nextStatus: StickerStatus = status === 'missing' ? 'collected' : 'missing'

  return (
    <button
      type="button"
      className="status-switch"
      onClick={() => onChange(nextStatus)}
      aria-label={status === 'missing' ? 'Set collected' : 'Set missing'}
    >
      {status === 'missing' ? 'Missing' : 'Collected'}
    </button>
  )
}
