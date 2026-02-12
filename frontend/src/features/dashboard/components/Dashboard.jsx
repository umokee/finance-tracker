import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSettings } from '../../../contexts/SettingsContext'
import { getOverview, getTransactions, getAccounts, getBudgets, getRecurringTransactions } from '../../../shared/api/endpoints'
import { formatCurrency, formatDate } from '../../../shared/utils/format'

export function Dashboard() {
  const { currencySymbol } = useSettings()
  const [overview, setOverview] = useState(null)
  const [recentTransactions, setRecentTransactions] = useState([])
  const [accounts, setAccounts] = useState([])
  const [budgets, setBudgets] = useState([])
  const [upcomingRecurring, setUpcomingRecurring] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const now = new Date()
      const [overviewData, transactionsData, accountsData, budgetsData, recurringData] = await Promise.all([
        getOverview(),
        getTransactions({ limit: 5 }),
        getAccounts(),
        getBudgets({ month: now.getMonth() + 1, year: now.getFullYear() }),
        getRecurringTransactions()
      ])
      setOverview(overviewData)
      setRecentTransactions(transactionsData)
      setAccounts(accountsData)
      setBudgets(budgetsData.slice(0, 4)) // Top 4 budgets
      // Filter active recurring and sort by next date
      const upcoming = recurringData
        .filter(r => r.is_active)
        .sort((a, b) => new Date(a.next_date) - new Date(b.next_date))
        .slice(0, 3)
      setUpcomingRecurring(upcoming)
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

      {/* Accounts Widget */}
      {accounts.length > 0 && (
        <div className="card mb-2">
          <div className="card__header">
            <h2 className="card__title">Accounts</h2>
            <Link to="/settings" className="btn btn--secondary btn--sm">Manage</Link>
          </div>
          <div className="account-widget">
            {accounts.map(acc => (
              <div key={acc.id} className={`account-widget__item account-widget__item--${acc.type}`}>
                <span className="account-widget__name">
                  {acc.name}
                  {acc.is_default && <span className="text-muted" style={{ fontSize: '0.7rem', marginLeft: '0.5rem' }}>(DEFAULT)</span>}
                </span>
                <span className={`account-widget__balance ${parseFloat(acc.balance) >= 0 ? 'text-income' : 'text-expense'}`}>
                  {formatCurrency(acc.balance, currencySymbol)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <div className="card__header">
            <h2 className="card__title">Recent Transactions</h2>
            <Link to="/transactions" className="btn btn--secondary btn--sm">View All</Link>
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

        <div className="card">
          <div className="card__header">
            <h2 className="card__title">Budget Status</h2>
            <Link to="/budgets" className="btn btn--secondary btn--sm">View All</Link>
          </div>
          {budgets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__text">No budgets set</div>
            </div>
          ) : (
            <div className="budget-widget">
              {budgets.map(b => {
                const percent = parseFloat(b.percent_used) || 0
                const isOver = percent > 100
                const isWarning = percent > 80 && percent <= 100
                return (
                  <div key={b.id} className="budget-widget__item">
                    <div className="budget-widget__header">
                      <span className="budget-widget__category">{b.category.name}</span>
                      <span className="budget-widget__amounts">
                        <span className={isOver ? 'text-expense' : ''}>{formatCurrency(b.spent, currencySymbol)}</span>
                        <span> / {formatCurrency(b.amount, currencySymbol)}</span>
                      </span>
                    </div>
                    <div className="budget-widget__progress progress">
                      <div
                        className={`progress__bar ${isOver ? 'progress__bar--danger' : isWarning ? 'progress__bar--warning' : ''}`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid-2 mt-2">
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
            <h2 className="card__title">Upcoming Recurring</h2>
            <Link to="/settings" className="btn btn--secondary btn--sm">Manage</Link>
          </div>
          {upcomingRecurring.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__text">No recurring transactions</div>
            </div>
          ) : (
            <div className="recurring-widget">
              {upcomingRecurring.map(r => (
                <div key={r.id} className="recurring-widget__item">
                  <div className="recurring-widget__info">
                    <span className="recurring-widget__name">{r.description || r.category.name}</span>
                    <span className="recurring-widget__date">Next: {formatDate(r.next_date)}</span>
                  </div>
                  <span className={r.type === 'income' ? 'text-income' : 'text-expense'}>
                    {r.type === 'income' ? '+' : '-'}{formatCurrency(r.amount, currencySymbol)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
