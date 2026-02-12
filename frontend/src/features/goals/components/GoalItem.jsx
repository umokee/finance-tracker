import { useState } from 'react'
import { useSettings } from '../../../contexts/SettingsContext'
import { formatCurrency, formatDate, formatPercent } from '../../../shared/utils/format'

export function GoalItem({ goal, onContribute, onEdit, onDelete }) {
  const { currencySymbol } = useSettings()
  const [showContribute, setShowContribute] = useState(false)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  const { id, name, target_amount, current_amount, deadline, completed, progress_percent } = goal

  const handleContribute = (e) => {
    e.preventDefault()
    if (parseFloat(amount) > 0) {
      onContribute(id, parseFloat(amount), note)
      setAmount('')
      setNote('')
      setShowContribute(false)
    }
  }

  const getProgressClass = () => {
    if (completed) return ''
    if (progress_percent >= 75) return ''
    if (progress_percent >= 50) return 'progress__bar--warning'
    return ''
  }

  return (
    <div className="goal-item">
      <div className="goal-item__header">
        <div>
          <div className="goal-item__name">
            {completed && '[DONE] '}{name}
          </div>
          {deadline && (
            <div className="goal-item__deadline">
              Due: {formatDate(deadline)}
            </div>
          )}
        </div>
        <div className="btn-group">
          {!completed && (
            <button
              className="btn btn--primary btn--sm"
              onClick={() => setShowContribute(!showContribute)}
            >
              + Add
            </button>
          )}
          <button className="btn btn--secondary btn--sm" onClick={() => onEdit(goal)}>
            Edit
          </button>
          <button className="btn btn--danger btn--sm" onClick={() => onDelete(id)}>
            Del
          </button>
        </div>
      </div>

      <div className="goal-item__progress">
        <div className="progress">
          <div
            className={`progress__bar ${getProgressClass()}`}
            style={{ width: `${progress_percent}%` }}
          />
        </div>
        <div className="goal-item__amounts">
          <span className="goal-item__current">
            {formatCurrency(current_amount, currencySymbol)}
          </span>
          <span className="goal-item__target">
            {formatPercent(progress_percent)} of {formatCurrency(target_amount, currencySymbol)}
          </span>
        </div>
      </div>

      {showContribute && (
        <form className="form mt-2" onSubmit={handleContribute}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Note (optional)</label>
              <input
                type="text"
                className="form-input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Contribution note"
              />
            </div>
          </div>
          <div className="btn-group">
            <button type="button" className="btn btn--secondary" onClick={() => setShowContribute(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary">
              Contribute
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
