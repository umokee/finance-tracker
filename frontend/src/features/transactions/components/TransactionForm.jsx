import { useState, useEffect } from 'react'
import { getCategories, calculateAllocation, getAccounts } from '../../../shared/api/endpoints'
import { useSettings } from '../../../contexts/SettingsContext'
import { formatCurrency } from '../../../shared/utils/format'

export function TransactionForm({ transaction, onSubmit, onCancel }) {
  const { currencySymbol } = useSettings()
  const [categories, setCategories] = useState([])
  const [accounts, setAccounts] = useState([])
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense',
    description: '',
    date: new Date().toISOString().split('T')[0],
    category_id: '',
    account_id: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [allocations, setAllocations] = useState([])

  useEffect(() => {
    loadCategories()
    loadAccounts()
  }, [])

  useEffect(() => {
    if (transaction) {
      setFormData({
        amount: transaction.amount,
        type: transaction.type,
        description: transaction.description || '',
        date: transaction.date,
        category_id: transaction.category_id,
        account_id: transaction.account_id || ''
      })
    } else {
      // Reset form when switching from edit to add mode
      const expenseCategories = categories.filter(c => c.type === 'expense')
      const defaultAccount = accounts.find(a => a.is_default)
      setFormData({
        amount: '',
        type: 'expense',
        description: '',
        date: new Date().toISOString().split('T')[0],
        category_id: expenseCategories.length > 0 ? expenseCategories[0].id : '',
        account_id: defaultAccount ? defaultAccount.id : ''
      })
    }
  }, [transaction, categories, accounts])

  const loadCategories = async () => {
    try {
      const data = await getCategories()
      setCategories(data)
      if (!transaction && data.length > 0) {
        const expenseCategories = data.filter(c => c.type === 'expense')
        if (expenseCategories.length > 0) {
          setFormData(prev => ({ ...prev, category_id: expenseCategories[0].id }))
        }
      }
    } catch (err) {
      console.error('Failed to load categories:', err)
    }
  }

  const loadAccounts = async () => {
    try {
      const data = await getAccounts()
      setAccounts(data)
      if (!transaction && data.length > 0) {
        const defaultAccount = data.find(a => a.is_default)
        if (defaultAccount) {
          setFormData(prev => ({ ...prev, account_id: defaultAccount.id }))
        }
      }
    } catch (err) {
      console.error('Failed to load accounts:', err)
    }
  }

  const filteredCategories = categories.filter(c => c.type === formData.type)

  useEffect(() => {
    const loadAllocations = async () => {
      const amount = parseFloat(formData.amount)
      if (formData.type === 'income' && amount > 0) {
        try {
          const data = await calculateAllocation(amount)
          setAllocations(data)
        } catch (err) {
          console.error('Failed to load allocations:', err)
          setAllocations([])
        }
      } else {
        setAllocations([])
      }
    }

    const timer = setTimeout(loadAllocations, 100)
    return () => clearTimeout(timer)
  }, [formData.type, formData.amount])

  const handleTypeChange = (type) => {
    setFormData(prev => {
      const filtered = categories.filter(c => c.type === type)
      return {
        ...prev,
        type,
        category_id: filtered.length > 0 ? filtered[0].id : ''
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await onSubmit({
        ...formData,
        amount: parseFloat(formData.amount),
        category_id: parseInt(formData.category_id),
        account_id: formData.account_id ? parseInt(formData.account_id) : null
      })
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save transaction')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <div className="form-group">
        <label className="form-label">Type</label>
        <div className="btn-group">
          <button
            type="button"
            className={`btn ${formData.type === 'expense' ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => handleTypeChange('expense')}
          >
            Expense
          </button>
          <button
            type="button"
            className={`btn ${formData.type === 'income' ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => handleTypeChange('income')}
          >
            Income
          </button>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="amount">Amount</label>
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            className="form-input"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="date">Date</label>
          <input
            id="date"
            type="date"
            className="form-input"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="category">Category</label>
          <select
            id="category"
            className="form-select"
            value={formData.category_id}
            onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
            required
          >
            <option value="">Select category</option>
            {filteredCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="account">Account</label>
          <select
            id="account"
            className="form-select"
            value={formData.account_id}
            onChange={(e) => setFormData(prev => ({ ...prev, account_id: e.target.value }))}
          >
            <option value="">No account</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="description">Description</label>
        <input
          id="description"
          type="text"
          className="form-input"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Optional description"
        />
      </div>

      {formData.type === 'income' && allocations.length > 0 && (
        <div className="allocation-breakdown">
          <div className="allocation-breakdown__header">SUGGESTED ALLOCATION</div>
          <div className="allocation-breakdown__list">
            {allocations.map(alloc => (
              <div key={alloc.rule_id} className="allocation-breakdown__item">
                <span className="allocation-breakdown__percentage">{alloc.percentage}%</span>
                <span className="allocation-breakdown__arrow">→</span>
                <span className="allocation-breakdown__name">{alloc.target_name}</span>
                <span className="allocation-breakdown__amount">{formatCurrency(alloc.amount, currencySymbol)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn--secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary" disabled={loading}>
          {loading ? 'Saving...' : (transaction ? 'Update' : 'Add')}
        </button>
      </div>
    </form>
  )
}
