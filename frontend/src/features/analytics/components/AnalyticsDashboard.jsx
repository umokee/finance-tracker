import { useSettings } from '../../../contexts/SettingsContext'
import { useAnalytics } from '../hooks/useAnalytics'
import { CategoryChart } from './CategoryChart'
import { TrendChart } from './TrendChart'
import { DailySpendingChart } from './DailySpendingChart'
import { formatCurrency } from '../../../shared/utils/format'

export function AnalyticsDashboard() {
  const { currencySymbol } = useSettings()
  const { overview, categoryData, trendData, dailySpending, loading, error } = useAnalytics(30)

  if (loading) {
    return <div className="loading">Loading analytics</div>
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">[ANALYTICS]</h1>
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
          <div className="stat-card__label">Net Balance</div>
          <div className={`stat-card__value ${
            (overview?.balance || 0) >= 0 ? 'stat-card__value--income' : 'stat-card__value--expense'
          }`}>
            {formatCurrency(overview?.balance || 0, currencySymbol)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Transactions</div>
          <div className="stat-card__value stat-card__value--neutral">
            {overview?.transaction_count || 0}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <CategoryChart data={categoryData} />
        <TrendChart data={trendData} />
      </div>

      <DailySpendingChart data={dailySpending} />
    </div>
  )
}
