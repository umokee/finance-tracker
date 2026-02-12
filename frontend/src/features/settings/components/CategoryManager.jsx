import { useState } from 'react'
import { useCategories } from '../hooks/useCategories'

export function CategoryManager() {
  const { categories, loading, error, add, update, remove } = useCategories()
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({ name: '', type: 'expense', icon: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const data = {
      name: formData.name,
      type: formData.type,
      icon: formData.icon || null
    }

    if (editingCategory) {
      await update(editingCategory.id, data)
    } else {
      await add(data)
    }

    setShowForm(false)
    setEditingCategory(null)
    setFormData({ name: '', type: 'expense', icon: '' })
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      type: category.type,
      icon: category.icon || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this category? This may affect existing transactions.')) {
      await remove(id)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingCategory(null)
    setFormData({ name: '', type: 'expense', icon: '' })
  }

  const incomeCategories = categories.filter(c => c.type === 'income')
  const expenseCategories = categories.filter(c => c.type === 'expense')

  if (loading) {
    return <div className="loading">Loading categories</div>
  }

  return (
    <div className="card">
      <div className="card__header">
        <h2 className="card__title">Categories</h2>
        {!showForm && (
          <button className="btn btn--primary btn--sm" onClick={() => setShowForm(true)}>
            + Add
          </button>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      {showForm && (
        <div className="mb-2" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
          <form className="form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
            </div>
            <div className="btn-group">
              <button type="button" className="btn btn--secondary btn--sm" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="btn btn--primary btn--sm">
                {editingCategory ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid-2">
        <div>
          <h3 className="text-muted mb-1" style={{ fontSize: '0.75rem' }}>EXPENSE CATEGORIES</h3>
          {expenseCategories.map(cat => (
            <div key={cat.id} className="flex-between mb-1">
              <span>{cat.name}</span>
              <div className="btn-group">
                <button className="btn btn--secondary btn--sm" onClick={() => handleEdit(cat)}>
                  Edit
                </button>
                <button className="btn btn--danger btn--sm" onClick={() => handleDelete(cat.id)}>
                  Del
                </button>
              </div>
            </div>
          ))}
        </div>
        <div>
          <h3 className="text-muted mb-1" style={{ fontSize: '0.75rem' }}>INCOME CATEGORIES</h3>
          {incomeCategories.map(cat => (
            <div key={cat.id} className="flex-between mb-1">
              <span>{cat.name}</span>
              <div className="btn-group">
                <button className="btn btn--secondary btn--sm" onClick={() => handleEdit(cat)}>
                  Edit
                </button>
                <button className="btn btn--danger btn--sm" onClick={() => handleDelete(cat.id)}>
                  Del
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
