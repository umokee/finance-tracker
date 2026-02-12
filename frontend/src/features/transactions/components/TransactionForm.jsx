import { useState, useEffect } from 'react'
import { getCategories } from '../../../shared/api/endpoints'

export function TransactionForm({ transaction, onSubmit, onCancel }) {
  const [categories, setCategories] = useState([])
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense',
    description: '',
    date: new Date().toISOString().split('T')[0],
    category_id: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    if (transaction) {
      setFormData({
        amount: transaction.amount,
        type: transaction.type,
        description: transaction.description || '',
        date: transaction.date,
        category_id: transaction.category_id
      })
    } else {
      // Reset form when switching from edit to add mode
      const expenseCategories = categories.filter(c => c.type === 'expense')
      setFormData({
        amount: '',
        type: 'expense',
        description: '',
        date: new Date().toISOString().split('T')[0],
        category_id: expenseCategories.length > 0 ? expenseCategories[0].id : ''
      })
    }
  }, [transaction, categories])

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

  const filteredCategories = categories.filter(c => c.type === formData.type)

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
    try {
      await onSubmit({
        ...formData,
        amount: parseFloat(formData.amount),
        category_id: parseInt(formData.category_id)
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
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
            min="0"
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
