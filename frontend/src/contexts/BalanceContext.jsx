import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getAccounts } from '../shared/api/endpoints'

const BalanceContext = createContext()

export function BalanceProvider({ children }) {
  const [balance, setBalance] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const accountsData = await getAccounts()
      setAccounts(accountsData)
      // Calculate total balance from all accounts
      const total = accountsData.reduce((sum, acc) => sum + parseFloat(acc.balance), 0)
      setBalance(total)
    } catch (err) {
      console.error('Failed to load balance:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <BalanceContext.Provider value={{ balance, accounts, loading, refresh }}>
      {children}
    </BalanceContext.Provider>
  )
}

export function useBalance() {
  const context = useContext(BalanceContext)
  if (!context) {
    throw new Error('useBalance must be used within BalanceProvider')
  }
  return context
}
