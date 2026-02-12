import { Routes, Route, NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
import { useBalance } from '../contexts/BalanceContext'
import { formatCurrency } from '../shared/utils/format'
import { Dashboard } from '../features/dashboard/components/Dashboard'
import { TransactionList } from '../features/transactions/components/TransactionList'
import { BudgetList } from '../features/budgets/components/BudgetList'
import { GoalsList } from '../features/goals/components/GoalsList'
import { AnalyticsDashboard } from '../features/analytics/components/AnalyticsDashboard'
import { Settings } from '../features/settings/components/Settings'
import { LoginScreen } from './LoginScreen'

function CommandBar() {
  const { logout } = useAuth()
  const { currencySymbol } = useSettings()
  const { balance, loading } = useBalance()

  return (
    <header className="command-bar">
      <div className="command-bar__logo">[FINANCE_TRACKER]</div>
      <nav className="command-bar__nav">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `command-bar__link ${isActive ? 'command-bar__link--active' : ''}`
          }
          end
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/transactions"
          className={({ isActive }) =>
            `command-bar__link ${isActive ? 'command-bar__link--active' : ''}`
          }
        >
          Transactions
        </NavLink>
        <NavLink
          to="/budgets"
          className={({ isActive }) =>
            `command-bar__link ${isActive ? 'command-bar__link--active' : ''}`
          }
        >
          Budgets
        </NavLink>
        <NavLink
          to="/goals"
          className={({ isActive }) =>
            `command-bar__link ${isActive ? 'command-bar__link--active' : ''}`
          }
        >
          Goals
        </NavLink>
        <NavLink
          to="/analytics"
          className={({ isActive }) =>
            `command-bar__link ${isActive ? 'command-bar__link--active' : ''}`
          }
        >
          Analytics
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `command-bar__link ${isActive ? 'command-bar__link--active' : ''}`
          }
        >
          Settings
        </NavLink>
        <button className="command-bar__link" onClick={logout}>
          Logout
        </button>
      </nav>
      <div className="command-bar__balance">
        {loading ? '...' : (
          <span className={balance >= 0 ? 'text-income' : 'text-expense'}>
            {formatCurrency(balance || 0, currencySymbol)}
          </span>
        )}
      </div>
    </header>
  )
}

export function App() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <LoginScreen />
  }

  return (
    <div className="app-container">
      <CommandBar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<TransactionList />} />
          <Route path="/budgets" element={<BudgetList />} />
          <Route path="/goals" element={<GoalsList />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  )
}
