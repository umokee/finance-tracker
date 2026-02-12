import { useState, useEffect, useCallback } from 'react'
import {
  getAllocationRules,
  createAllocationRule,
  updateAllocationRule,
  deleteAllocationRule,
  getGoals,
  getCategories
} from '../../../shared/api/endpoints'

export function AllocationManager() {
  const [rules, setRules] = useState([])
  const [goals, setGoals] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    percentage: '',
    target_type: 'goal',
    target_id: ''
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [rulesData, goalsData, categoriesData] = await Promise.all([
        getAllocationRules(),
        getGoals(),
        getCategories()
      ])
      setRules(rulesData)
      setGoals(goalsData)
      setCategories(categoriesData)
    } catch (err) {
      setError('Failed to load allocation rules')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const totalPercentage = rules.reduce((sum, r) => sum + r.percentage, 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const data = {
      name: formData.name,
      percentage: parseInt(formData.percentage, 10),
      target_type: formData.target_type,
      target_id: parseInt(formData.target_id, 10)
    }

    try {
      if (editingRule) {
        const updated = await updateAllocationRule(editingRule.id, data)
        setRules(prev => prev.map(r => r.id === editingRule.id ? updated : r))
      } else {
        const created = await createAllocationRule(data)
        setRules(prev => [...prev, created])
      }
      handleCancel()
    } catch (err) {
      setError('Failed to save allocation rule')
      console.error(err)
    }
  }

  const handleEdit = (rule) => {
    setEditingRule(rule)
    setFormData({
      name: rule.name,
      percentage: rule.percentage.toString(),
      target_type: rule.target_type,
      target_id: rule.target_id.toString()
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this allocation rule?')) {
      try {
        await deleteAllocationRule(id)
        setRules(prev => prev.filter(r => r.id !== id))
      } catch (err) {
        setError('Failed to delete allocation rule')
        console.error(err)
      }
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingRule(null)
    setFormData({
      name: '',
      percentage: '',
      target_type: 'goal',
      target_id: ''
    })
  }

  const getTargetOptions = () => {
    if (formData.target_type === 'goal') {
      return goals.filter(g => !g.completed)
    }
    return categories
  }

  if (loading) {
    return <div className="loading">Loading allocation rules</div>
  }

  return (
    <div className="card">
      <div className="card__header">
        <h2 className="card__title">[ALLOCATION RULES]</h2>
        {!showForm && (
          <button className="btn btn--primary btn--sm" onClick={() => setShowForm(true)}>
            + Add
          </button>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      <p className="text-muted mb-1" style={{ fontSize: '0.75rem' }}>
        Configure how income should be allocated. These are suggestions shown when adding income.
      </p>

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
                  placeholder="e.g., Savings"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Percentage</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.percentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, percentage: e.target.value }))}
                  min="1"
                  max="100"
                  placeholder="20"
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Target Type</label>
                <select
                  className="form-select"
                  value={formData.target_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, target_type: e.target.value, target_id: '' }))}
                >
                  <option value="goal">Goal</option>
                  <option value="category">Category</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Target</label>
                <select
                  className="form-select"
                  value={formData.target_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, target_id: e.target.value }))}
                  required
                >
                  <option value="">Select {formData.target_type}</option>
                  {getTargetOptions().map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="btn-group">
              <button type="button" className="btn btn--secondary btn--sm" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="btn btn--primary btn--sm">
                {editingRule ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      )}

      {rules.length === 0 ? (
        <div className="text-muted" style={{ textAlign: 'center', padding: '1rem' }}>
          No allocation rules configured
        </div>
      ) : (
        <>
          <div className="allocation-rules-list">
            {rules.map(rule => (
              <div key={rule.id} className="allocation-rule-item">
                <div className="allocation-rule-info">
                  <span className="allocation-rule-percentage">{rule.percentage}%</span>
                  <span className="allocation-rule-arrow">→</span>
                  <span className="allocation-rule-name">{rule.name}</span>
                  <span className="allocation-rule-target">({rule.target_name})</span>
                </div>
                <div className="btn-group">
                  <button className="btn btn--secondary btn--sm" onClick={() => handleEdit(rule)}>
                    Edit
                  </button>
                  <button className="btn btn--danger btn--sm" onClick={() => handleDelete(rule.id)}>
                    Del
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="allocation-total" style={{ marginTop: '0.5rem' }}>
            <span className={totalPercentage > 100 ? 'text-danger' : 'text-muted'}>
              Total: {totalPercentage}%
              {totalPercentage > 100 && ' (exceeds 100%)'}
            </span>
          </div>
        </>
      )}
    </div>
  )
}
