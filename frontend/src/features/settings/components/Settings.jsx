import { useState } from 'react'
import { useSettings } from '../../../contexts/SettingsContext'
import { updateSetting } from '../../../shared/api/endpoints'
import { CategoryManager } from './CategoryManager'
import { RecurringManager } from './RecurringManager'
import { AllocationManager } from './AllocationManager'

const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '\u20AC' },
  { code: 'GBP', symbol: '\u00A3' },
  { code: 'JPY', symbol: '\u00A5' },
  { code: 'RUB', symbol: '\u20BD' },
  { code: 'CNY', symbol: '\u00A5' },
  { code: 'INR', symbol: '\u20B9' },
  { code: 'BRL', symbol: 'R$' },
]

export function Settings() {
  const { currency, currencySymbol, updateSettings, loadSettings } = useSettings()
  const [saving, setSaving] = useState(false)

  const handleCurrencyChange = async (e) => {
    const selected = CURRENCIES.find(c => c.code === e.target.value)
    if (!selected) return

    setSaving(true)
    try {
      await updateSetting('currency', selected.code)
      await updateSetting('currency_symbol', selected.symbol)
      updateSettings(selected.code, selected.symbol)
    } catch (err) {
      console.error('Failed to update currency:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">[SETTINGS]</h1>
      </div>

      <div className="card mb-2">
        <div className="card__header">
          <h2 className="card__title">Currency</h2>
        </div>
        <div className="form-group">
          <label className="form-label">Default Currency</label>
          <select
            className="form-select"
            value={currency}
            onChange={handleCurrencyChange}
            disabled={saving}
            style={{ maxWidth: '200px' }}
          >
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>
                {c.symbol} {c.code}
              </option>
            ))}
          </select>
          {saving && <span className="text-muted" style={{ marginLeft: '0.5rem' }}>Saving...</span>}
        </div>
      </div>

      <CategoryManager />

      <div className="mt-2">
        <RecurringManager />
      </div>

      <div className="mt-2">
        <AllocationManager />
      </div>
    </div>
  )
}
