import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import { SettingsProvider } from '../contexts/SettingsContext'
import { BalanceProvider } from '../contexts/BalanceContext'

export function AppProviders({ children }) {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <BalanceProvider>
            {children}
          </BalanceProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
