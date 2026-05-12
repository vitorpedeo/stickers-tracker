import { AppFrame } from '../components/AppFrame'

export function SettingsPage() {
  return (
    <AppFrame title="Settings">
      <section>
        <h3>Import and Export</h3>
        <button type="button">Export JSON</button>
        <label>
          Import JSON
          <input type="file" accept="application/json" />
        </label>
      </section>
      <section>
        <h3>Data reset</h3>
        <button type="button">Reset Local Data</button>
      </section>
    </AppFrame>
  )
}
