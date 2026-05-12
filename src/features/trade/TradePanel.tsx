type TradeItem = {
  stickerId: string
  label: string
  duplicateCount?: number
}

type TradePanelProps = {
  duplicates: TradeItem[]
  wanted: TradeItem[]
}

export function TradePanel({ duplicates, wanted }: TradePanelProps) {
  return (
    <section className="trade-panel">
      <h3>Duplicates</h3>
      {duplicates.length === 0 ? (
        <p>No duplicate stickers yet.</p>
      ) : (
        <ul>
          {duplicates.map((item) => (
            <li key={item.stickerId}>
              {item.label} x{item.duplicateCount ?? 0}
            </li>
          ))}
        </ul>
      )}

      <h3>Wanted</h3>
      {wanted.length === 0 ? (
        <p>You have completed this list.</p>
      ) : (
        <ul>
          {wanted.map((item) => (
            <li key={item.stickerId}>{item.label}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
