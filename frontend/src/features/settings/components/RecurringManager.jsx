import { useState, useEffect } from 'react'
import { useRecurring } from '../../recurring/hooks/useRecurring'
import { getCategories } from '../../../shared/api/endpoints'
import { useSettings } from '../../../contexts/SettingsContext'
import { formatCurrency, formatDate } from '../../../shared/utils/format'

export function RecurringManager() {
  const { currencySymbol } = useSettings()
  const { recurring, loading, error, add, update, remove, process } = useRecurring()
  const [categories, setCategories] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingRecurring, setEditingRecurring] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense',
    description: '',
    category_id: '',
    interval: 'monthly',
    next_date: ''
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (err) {
      console.error('Failed to load categories:', err)
    }
  }

  const filteredCategories = categories.filter(c => c.type === formData.type)

  const handleTypeChange = (type) => {
    const filtered = categories.filter(c => c.type === type)
    setFormData(prev => ({
      ...prev,
      type,
      category_id: filtered.length > 0 ? filtered[0].id.toString() : ''
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const data = {
      amount: parseFloat(formData.amount),
      type: formData.type,
      description: formData.description || null,
      category_id: parseInt(formData.category_id),
      interval: formData.interval,
      next_date: formData.next_date
    }

    if (editingRecurring) {
      await update(editingRecurring.id, data)
    } else {
      await add(data)
    }

    setShowForm(false)
    setEditingRecurring(null)
    setFormData({
      amount: '',
      type: 'expense',
      description: '',
      category_id: '',
      interval: 'monthly',
      next_date: ''
    })
  }

  const handleEdit = (item) => {
    setEditingRecurring(item)
    setFormData({
      amount: item.amount.toString(),
      type: item.type,
      description: item.description || '',
      category_id: item.category_id.toString(),
      interval: item.interval,
      next_date: item.next_date
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this recurring transaction?')) {
      await remove(id)
    }
  }

  const handleProcess = async () => {
    setProcessing(true)
    try {
      const result = await process()
      alert(`Processed ${result.processed} recurring transactions, created ${result.transactions_created} new transactions.`)
    } catch (err) {
      console.error('Failed to process:', err)
    } finally {
      setProcessing(false)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingRecurring(null)
    setFormData({
      amount: '',
      type: 'expense',
      description: '',
      category_id: '',
      interval: 'monthly',
      next_date: ''
    })
  }

  const toggleActive = async (item) => {
    await update(item.id, { is_active: !item.is_active })
  }

  if (loading) {
    return <div className="loading">Loading recurring transactions</div>
  }

  return (
    <div className="card">
      <div className="card__header">
        <h2 className="card__title">Recurring Transactions</h2>
        <div className="btn-group">
          <button
            className="btn btn--secondary btn--sm"
            onClick={handleProcess}
            disabled={processing}
          >
            {processing ? 'Processing...' : 'Process Due'}
          </button>
          {!showForm && (
            <button className="btn btn--primary btn--sm" onClick={() => setShowForm(true)}>
              + Add
            </button>
          )}
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {showForm && (
        <div className="mb-2" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
          <form className="form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Type</label>
              <div className="btn-group">
                <button
                  type="button"
                  className={`btn btn--sm ${formData.type === 'expense' ? 'btn--primary' : 'btn--secondary'}`}
                  onClick={() => handleTypeChange('expense')}
                >
                  Expense
                </button>
                <button
                  type="button"
                  className={`btn btn--sm ${formData.type === 'income' ? 'btn--primary' : 'btn--secondary'}`}
                  onClick={() => handleTypeChange('income')}
                >
                  Income
                </button>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={formData.category_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                  required
                >
                  <option value="">Select</option>
                  {filteredCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Interval</label>
                <select
                  className="form-select"
                  value={formData.interval}
                  onChange={(e) => setFormData(prev => ({ ...prev, interval: e.target.value }))}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Next Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.next_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, next_date: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <input
                type="text"
                className="form-input"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional"
              />
            </div>

            <div className="btn-group">
              <button type="button" className="btn btn--secondary btn--sm" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="btn btn--primary btn--sm">
                {editingRecurring ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      )}

      {recurring.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__text">No recurring transactions</div>
        </div>
      ) : (
        <div>
          {recurring.map(item => (
            <div key={item.id} className="transaction-item">
              <div className="transaction-item__info">
                <div className="transaction-item__category">
                  {item.category.name} - {item.interval}
                  {!item.is_active && ' (paused)'}
                </div>
                <div className="transaction-item__description">
                  {item.description || 'No description'}
                </div>
              </div>
              <div className="transaction-item__date">
                Next: {formatDate(item.next_date)}
              </div>
              <div className={`transaction-item__amount ${
                item.type === 'income' ? 'text-income' : 'text-expense'
              }`}>
                {item.type === 'income' ? '+' : '-'}
                {formatCurrency(item.amount, currencySymbol)}
              </div>
              <div className="transaction-item__actions">
                <button
                  className="btn btn--secondary btn--sm"
                  onClick={() => toggleActive(item)}
                >
                  {item.is_active ? 'Pause' : 'Resume'}
                </button>
                <button className="btn btn--secondary btn--sm" onClick={() => handleEdit(item)}>
                  Edit
                </button>
                <button className="btn btn--danger btn--sm" onClick={() => handleDelete(item.id)}>
                  Del
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
