import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useSettings } from '../../../contexts/SettingsContext'
import { formatCurrency, formatDateShort } from '../../../shared/utils/format'

export function TrendChart({ data }) {
  const { currencySymbol } = useSettings()

  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        <div className="chart-title">Income vs Expense Trend</div>
        <div className="empty-state">
          <div className="empty-state__text">No trend data</div>
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
          <div style={{ marginBottom: '0.25rem' }}>{formatDateShort(label)}</div>
          {payload.map(p => (
            <div key={p.dataKey} style={{ color: p.color }}>
              {p.name}: {formatCurrency(p.value, currencySymbol)}
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="chart-container">
      <div className="chart-title">Income vs Expense Trend</div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
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
          <Legend
            formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{value}</span>}
          />
          <Line
            type="monotone"
            dataKey="income"
            name="Income"
            stroke="var(--income)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="expense"
            name="Expense"
            stroke="var(--expense)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
