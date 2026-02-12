import { useSettings } from '../../../contexts/SettingsContext'
import { formatCurrency, formatDate } from '../../../shared/utils/format'

export function TransactionItem({ transaction, onEdit, onDelete }) {
  const { currencySymbol } = useSettings()
  const { id, amount, type, description, date, category, account } = transaction

  return (
    <div className="transaction-item">
      <div className="transaction-item__info">
        <div className="transaction-item__category">
          {category.name}
          {account && <span className="text-muted" style={{ marginLeft: '0.5rem', fontSize: '0.7rem' }}>({account.name})</span>}
        </div>
        <div className="transaction-item__description">
          {description || 'No description'}
        </div>
      </div>
      <div className="transaction-item__date">{formatDate(date)}</div>
      <div className={`transaction-item__amount ${
        type === 'income' ? 'text-income' : 'text-expense'
      }`}>
        {type === 'income' ? '+' : '-'}
        {formatCurrency(amount, currencySymbol)}
      </div>
      <div className="transaction-item__actions">
        <button className="btn btn--secondary btn--sm" onClick={() => onEdit(transaction)}>
          Edit
        </button>
        <button className="btn btn--danger btn--sm" onClick={() => onDelete(id)}>
          Del
        </button>
      </div>
    </div>
  )
}
