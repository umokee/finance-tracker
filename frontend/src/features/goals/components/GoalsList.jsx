import { useState } from 'react'
import { useGoals } from '../hooks/useGoals'
import { GoalItem } from './GoalItem'

export function GoalsList() {
  const { goals, loading, error, add, update, remove, contribute } = useGoals()
  const [showForm, setShowForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    deadline: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const data = {
      name: formData.name,
      target_amount: parseFloat(formData.target_amount),
      deadline: formData.deadline || null
    }

    if (editingGoal) {
      await update(editingGoal.id, data)
    } else {
      await add(data)
    }

    setShowForm(false)
    setEditingGoal(null)
    setFormData({ name: '', target_amount: '', deadline: '' })
  }

  const handleEdit = (goal) => {
    setEditingGoal(goal)
    setFormData({
      name: goal.name,
      target_amount: goal.target_amount.toString(),
      deadline: goal.deadline || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this goal?')) {
      await remove(id)
    }
  }

  const handleContribute = async (id, amount, note) => {
    await contribute(id, amount, note)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingGoal(null)
    setFormData({ name: '', target_amount: '', deadline: '' })
  }

  const activeGoals = goals.filter(g => !g.completed)
  const completedGoals = goals.filter(g => g.completed)

  return (
    <div>
      <div className="page-header flex-between">
        <h1 className="page-title">[GOALS]</h1>
        {!showForm && (
          <button className="btn btn--primary" onClick={() => setShowForm(true)}>
            + Add Goal
          </button>
        )}
      </div>

      {showForm && (
        <div className="card mb-2">
          <div className="card__header">
            <h2 className="card__title">
              {editingGoal ? 'Edit Goal' : 'New Goal'}
            </h2>
          </div>
          <form className="form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="name">Goal Name</label>
              <input
                id="name"
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Emergency Fund"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="target">Target Amount</label>
                <input
                  id="target"
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  value={formData.target_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, target_amount: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="deadline">Deadline (optional)</label>
                <input
                  id="deadline"
                  type="date"
                  className="form-input"
                  value={formData.deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                />
              </div>
            </div>

            <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn--secondary" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="btn btn--primary">
                {editingGoal ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      )}

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="loading">Loading goals</div>
      ) : goals.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state__text">No goals yet. Start by creating one.</div>
          </div>
        </div>
      ) : (
        <>
          {activeGoals.length > 0 && (
            <div className="mb-2">
              <h2 className="card__title mb-1">Active Goals ({activeGoals.length})</h2>
              {activeGoals.map(goal => (
                <GoalItem
                  key={goal.id}
                  goal={goal}
                  onContribute={handleContribute}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {completedGoals.length > 0 && (
            <div>
              <h2 className="card__title mb-1">Completed Goals ({completedGoals.length})</h2>
              {completedGoals.map(goal => (
                <GoalItem
                  key={goal.id}
                  goal={goal}
                  onContribute={handleContribute}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
