import { useEffect, useState } from 'react'

type NeedNoteEditorProps = {
  value: string
  onChange: (next: string) => void
}

export function NeedNoteEditor({ value, onChange }: NeedNoteEditorProps) {
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  const commit = () => {
    if (draft !== value) {
      onChange(draft)
    }
  }

  return (
    <label className="need-note-editor">
      Trade note
      <input
        aria-label="Trade note"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            commit()
          }
        }}
      />
    </label>
  )
}
