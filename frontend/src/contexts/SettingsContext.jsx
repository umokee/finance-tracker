import { createContext, useContext, useState, useEffect } from 'react'
import { getSettings } from '../shared/api/endpoints'
import { useAuth } from './AuthContext'

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [currency, setCurrency] = useState('USD')
  const [currencySymbol, setCurrencySymbol] = useState('$')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      loadSettings()
    }
  }, [isAuthenticated])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const settings = await getSettings()
      settings.forEach(s => {
        if (s.key === 'currency') setCurrency(s.value)
        if (s.key === 'currency_symbol') setCurrencySymbol(s.value)
      })
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = (newCurrency, newSymbol) => {
    setCurrency(newCurrency)
    setCurrencySymbol(newSymbol)
  }

  return (
    <SettingsContext.Provider value={{ currency, currencySymbol, loading, updateSettings, loadSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
