import { useState, useEffect } from 'react'
import { useSettings } from '../../../contexts/SettingsContext'
import { getOverview, getTransactions } from '../../../shared/api/endpoints'
import { formatCurrency, formatDate } from '../../../shared/utils/format'

export function Dashboard() {
  const { currencySymbol } = useSettings()
  const [overview, setOverview] = useState(null)
  const [recentTransactions, setRecentTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [overviewData, transactionsData] = await Promise.all([
        getOverview(),
        getTransactions({ limit: 5 })
      ])
      setOverview(overviewData)
      setRecentTransactions(transactionsData)
    } catch (err) {
      setError('Failed to load dashboard data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading dashboard</div>
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">[DASHBOARD]</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card__label">Total Income</div>
          <div className="stat-card__value stat-card__value--income">
            {formatCurrency(overview?.total_income || 0, currencySymbol)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Total Expenses</div>
          <div className="stat-card__value stat-card__value--expense">
            {formatCurrency(overview?.total_expense || 0, currencySymbol)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">In Goals</div>
          <div className="stat-card__value stat-card__value--neutral">
            {formatCurrency(overview?.total_in_goals || 0, currencySymbol)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Available</div>
          <div className={`stat-card__value ${
            (overview?.available_balance || 0) >= 0 ? 'stat-card__value--income' : 'stat-card__value--expense'
          }`}>
            {formatCurrency(overview?.available_balance || 0, currencySymbol)}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card__header">
            <h2 className="card__title">Quick Stats</h2>
          </div>
          <div>
            <div className="flex-between mb-1">
              <span className="text-muted">Balance (Income - Expenses)</span>
              <span className={(overview?.balance || 0) >= 0 ? 'text-income' : 'text-expense'}>
                {formatCurrency(overview?.balance || 0, currencySymbol)}
              </span>
            </div>
            <div className="flex-between mb-1">
              <span className="text-muted">Transactions</span>
              <span>{overview?.transaction_count || 0}</span>
            </div>
            <div className="flex-between mb-1">
              <span className="text-muted">Active Goals</span>
              <span>{overview?.active_goals || 0}</span>
            </div>
            <div className="flex-between">
              <span className="text-muted">Budgets Over Limit</span>
              <span className={overview?.budgets_over_limit > 0 ? 'text-expense' : ''}>
                {overview?.budgets_over_limit || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card__header">
            <h2 className="card__title">Recent Transactions</h2>
          </div>
          {recentTransactions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__text">No transactions yet</div>
            </div>
          ) : (
            <div>
              {recentTransactions.map(tx => (
                <div key={tx.id} className="transaction-item">
                  <div className="transaction-item__info">
                    <div className="transaction-item__category">{tx.category.name}</div>
                    <div className="transaction-item__description">
                      {tx.description || 'No description'}
                    </div>
                  </div>
                  <div className="transaction-item__date">{formatDate(tx.date)}</div>
                  <div className={`transaction-item__amount ${
                    tx.type === 'income' ? 'text-income' : 'text-expense'
                  }`}>
                    {tx.type === 'income' ? '+' : '-'}
                    {formatCurrency(tx.amount, currencySymbol)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
