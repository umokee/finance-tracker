import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useSettings } from '../../../contexts/SettingsContext'
import { formatCurrency } from '../../../shared/utils/format'

const COLORS = ['#00ff88', '#00cc6a', '#009950', '#006633', '#004422', '#002211']

export function CategoryChart({ data }) {
  const { currencySymbol } = useSettings()

  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        <div className="chart-title">Spending by Category</div>
        <div className="empty-state">
          <div className="empty-state__text">No spending data</div>
        </div>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload
      return (
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          padding: '0.5rem 0.75rem',
          fontSize: '0.8rem'
        }}>
          <div>{item.category_name}</div>
          <div style={{ color: 'var(--accent)' }}>
            {formatCurrency(item.total, currencySymbol)} ({item.percent.toFixed(1)}%)
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="chart-container">
      <div className="chart-title">Spending by Category</div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="category_name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell key={entry.category_id} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
