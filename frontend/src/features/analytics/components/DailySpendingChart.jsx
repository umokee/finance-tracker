import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useSettings } from '../../../contexts/SettingsContext'
import { formatCurrency, formatDateShort } from '../../../shared/utils/format'

export function DailySpendingChart({ data }) {
  const { currencySymbol } = useSettings()

  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        <div className="chart-title">Daily Spending</div>
        <div className="empty-state">
          <div className="empty-state__text">No spending data</div>
        </div>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          padding: '0.5rem 0.75rem',
          fontSize: '0.8rem'
        }}>
          <div>{formatDateShort(label)}</div>
          <div style={{ color: 'var(--expense)' }}>
            {formatCurrency(payload[0].value, currencySymbol)}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="chart-container">
      <div className="chart-title">Daily Spending</div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDateShort}
            stroke="var(--text-secondary)"
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="var(--text-secondary)"
            tick={{ fontSize: 10 }}
            tickFormatter={(v) => `${currencySymbol}${v}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="amount"
            fill="var(--expense)"
            maxBarSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
