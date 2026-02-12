import { useSettings } from '../../../contexts/SettingsContext'
import { formatCurrency, formatPercent } from '../../../shared/utils/format'

export function BudgetCard({ budget, onEdit, onDelete }) {
  const { currencySymbol } = useSettings()
  const { id, category, amount, spent, percent_used } = budget

  const getProgressClass = () => {
    if (percent_used >= 100) return 'progress__bar--danger'
    if (percent_used >= 80) return 'progress__bar--warning'
    return ''
  }

  return (
    <div className="budget-card">
      <div className="budget-card__header">
        <span className="budget-card__category">{category.name}</span>
        <div className="btn-group">
          <button className="btn btn--secondary btn--sm" onClick={() => onEdit(budget)}>
            Edit
          </button>
          <button className="btn btn--danger btn--sm" onClick={() => onDelete(id)}>
            Del
          </button>
        </div>
      </div>
      <div className="budget-card__amount">
        <span className="budget-card__spent">{formatCurrency(spent, currencySymbol)}</span>
        <span className="budget-card__limit"> / {formatCurrency(amount, currencySymbol)}</span>
      </div>
      <div className="budget-card__progress">
        <div className="progress">
          <div
            className={`progress__bar ${getProgressClass()}`}
            style={{ width: `${Math.min(percent_used, 100)}%` }}
          />
        </div>
        <div className="budget-card__percent">{formatPercent(percent_used)}</div>
      </div>
    </div>
  )
}
