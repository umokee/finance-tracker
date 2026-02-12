import { useState, useEffect } from 'react'
import { getAccounts, createAccount, updateAccount, deleteAccount, createTransfer } from '../../../shared/api/endpoints'
import { useSettings } from '../../../contexts/SettingsContext'
import { formatCurrency } from '../../../shared/utils/format'
import { useBalance } from '../../../contexts/BalanceContext'

const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'cash', label: 'Cash' },
]

export function AccountManager() {
  const { currencySymbol } = useSettings()
  const { refresh: refreshBalance } = useBalance()
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showTransferForm, setShowTransferForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({ name: '', type: 'checking' })
  const [transferData, setTransferData] = useState({ from_account_id: '', to_account_id: '', amount: '', note: '' })
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      const data = await getAccounts()
      setAccounts(data)
    } catch (err) {
      console.error('Failed to load accounts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (editing) {
        await updateAccount(editing.id, formData)
      } else {
        await createAccount(formData)
      }
      await loadAccounts()
      refreshBalance()
      setShowForm(false)
      setEditing(null)
      setFormData({ name: '', type: 'checking' })
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save account')
    } finally {
      setSaving(false)
    }
  }

  const handleTransfer = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await createTransfer({
        from_account_id: parseInt(transferData.from_account_id),
        to_account_id: parseInt(transferData.to_account_id),
        amount: parseFloat(transferData.amount),
        note: transferData.note || null
      })
      await loadAccounts()
      refreshBalance()
      setShowTransferForm(false)
      setTransferData({ from_account_id: '', to_account_id: '', amount: '', note: '' })
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create transfer')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (account) => {
    setEditing(account)
    setFormData({ name: account.name, type: account.type })
    setShowForm(true)
    setShowTransferForm(false)
  }

  const handleDelete = async (account) => {
    if (!window.confirm(`Delete account "${account.name}"?`)) return
    try {
      await deleteAccount(account.id)
      await loadAccounts()
      refreshBalance()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete account')
    }
  }

  const handleSetDefault = async (account) => {
    try {
      await updateAccount(account.id, { is_default: true })
      await loadAccounts()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to set default')
    }
  }

  const totalBalance = accounts.reduce((sum, a) => sum + parseFloat(a.balance), 0)

  if (loading) {
    return <div className="card"><div className="loading">Loading accounts...</div></div>
  }

  return (
    <div className="card">
      <div className="card__header">
        <h2 className="card__title">Accounts</h2>
        <div className="btn-group">
          {accounts.length >= 2 && (
            <button
              className="btn btn--secondary btn--sm"
              onClick={() => {
                setShowTransferForm(!showTransferForm)
                setShowForm(false)
                setError(null)
              }}
            >
              {showTransferForm ? 'Cancel' : 'Transfer'}
            </button>
          )}
          <button
            className="btn btn--primary btn--sm"
            onClick={() => {
              setShowForm(!showForm)
              setShowTransferForm(false)
              setEditing(null)
              setFormData({ name: '', type: 'checking' })
              setError(null)
            }}
          >
            {showForm ? 'Cancel' : 'Add Account'}
          </button>
        </div>
      </div>

      {error && <div className="error mb-1">{error}</div>}

      {showForm && (
        <form className="form mb-2" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Account Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Main Checking"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select
                className="form-select"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              >
                {ACCOUNT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? 'Saving...' : (editing ? 'Update' : 'Create')}
          </button>
        </form>
      )}

      {showTransferForm && (
        <form className="form mb-2" onSubmit={handleTransfer}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">From Account</label>
              <select
                className="form-select"
                value={transferData.from_account_id}
                onChange={(e) => setTransferData(prev => ({ ...prev, from_account_id: e.target.value }))}
                required
              >
                <option value="">Select account</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance, currencySymbol)})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">To Account</label>
              <select
                className="form-select"
                value={transferData.to_account_id}
                onChange={(e) => setTransferData(prev => ({ ...prev, to_account_id: e.target.value }))}
                required
              >
                <option value="">Select account</option>
                {accounts.filter(a => a.id.toString() !== transferData.from_account_id).map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Amount</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                value={transferData.amount}
                onChange={(e) => setTransferData(prev => ({ ...prev, amount: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Note (optional)</label>
              <input
                type="text"
                className="form-input"
                value={transferData.note}
                onChange={(e) => setTransferData(prev => ({ ...prev, note: e.target.value }))}
                placeholder="Transfer note"
              />
            </div>
          </div>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? 'Transferring...' : 'Transfer'}
          </button>
        </form>
      )}

      <div className="flex-between mb-1" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <span className="text-muted">TOTAL BALANCE</span>
        <span className={totalBalance >= 0 ? 'text-income' : 'text-expense'} style={{ fontWeight: 'bold' }}>
          {formatCurrency(totalBalance, currencySymbol)}
        </span>
      </div>

      {accounts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__text">No accounts yet</div>
        </div>
      ) : (
        <div className="account-list">
          {accounts.map(account => (
            <div key={account.id} className="account-item">
              <div className="account-item__info">
                <div className="account-item__name">
                  {account.name}
                  {account.is_default && <span className="badge badge--primary">DEFAULT</span>}
                </div>
                <div className="account-item__type">{account.type.toUpperCase()}</div>
              </div>
              <div className={`account-item__balance ${parseFloat(account.balance) >= 0 ? 'text-income' : 'text-expense'}`}>
                {formatCurrency(account.balance, currencySymbol)}
              </div>
              <div className="account-item__actions">
                {!account.is_default && (
                  <button
                    className="btn btn--secondary btn--sm"
                    onClick={() => handleSetDefault(account)}
                    title="Set as default"
                  >
                    Set Default
                  </button>
                )}
                <button
                  className="btn btn--secondary btn--sm"
                  onClick={() => handleEdit(account)}
                >
                  Edit
                </button>
                {!account.is_default && (
                  <button
                    className="btn btn--danger btn--sm"
                    onClick={() => handleDelete(account)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
