import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import { SettingsProvider } from '../contexts/SettingsContext'

export function AppProviders({ children }) {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          {children}
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
