import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('apiKey') || '')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('apiKey', apiKey)
      setIsAuthenticated(true)
    } else {
      localStorage.removeItem('apiKey')
      setIsAuthenticated(false)
    }
  }, [apiKey])

  const login = (key) => {
    setApiKey(key)
  }

  const logout = () => {
    setApiKey('')
  }

  return (
    <AuthContext.Provider value={{ apiKey, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
