import { useState, useEffect } from 'react'
import { useBudgets } from '../hooks/useBudgets'
import { BudgetCard } from './BudgetCard'
import { getCategories } from '../../../shared/api/endpoints'
import { getCurrentMonthYear, getMonthName } from '../../../shared/utils/format'

export function BudgetList() {
  const { month, year } = getCurrentMonthYear()
  const { budgets, loading, error, add, update, remove } = useBudgets(month, year)
  const [showForm, setShowForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)
  const [categories, setCategories] = useState([])
  const [formData, setFormData] = useState({ category_id: '', amount: '' })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const data = await getCategories()
      setCategories(data.filter(c => c.type === 'expense'))
    } catch (err) {
      console.error('Failed to load categories:', err)
    }
  }

  const availableCategories = categories.filter(
    c => !budgets.some(b => b.category_id === c.id) || editingBudget?.category_id === c.id
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    const data = {
      category_id: parseInt(formData.category_id),
      amount: parseFloat(formData.amount)
    }

    if (editingBudget) {
      await update(editingBudget.id, { amount: data.amount })
    } else {
      await add(data)
    }

    setShowForm(false)
    setEditingBudget(null)
    setFormData({ category_id: '', amount: '' })
  }

  const handleEdit = (budget) => {
    setEditingBudget(budget)
    setFormData({ category_id: budget.category_id.toString(), amount: budget.amount.toString() })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this budget?')) {
      await remove(id)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingBudget(null)
    setFormData({ category_id: '', amount: '' })
  }

  return (
    <div>
      <div className="page-header flex-between">
        <h1 className="page-title">[BUDGETS] - {getMonthName(month)} {year}</h1>
        {!showForm && (
          <button className="btn btn--primary" onClick={() => setShowForm(true)}>
            + Add Budget
          </button>
        )}
      </div>

      {showForm && (
        <div className="card mb-2">
          <div className="card__header">
            <h2 className="card__title">
              {editingBudget ? 'Edit Budget' : 'New Budget'}
            </h2>
          </div>
          <form className="form" onSubmit={handleSubmit}>
            {!editingBudget && (
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
                  {availableCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="amount">Budget Amount</label>
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

            <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn--secondary" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="btn btn--primary">
                {editingBudget ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      )}

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="loading">Loading budgets</div>
      ) : budgets.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state__text">No budgets set for this month</div>
          </div>
        </div>
      ) : (
        <div className="grid-2">
          {budgets.map(budget => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
