import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export function LoginScreen() {
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!key.trim()) {
      setError('API key is required')
      return
    }
    setError('')
    login(key.trim())
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">[FINANCE_TRACKER]</h1>
        <p className="login-subtitle">Enter your API key to continue</p>

        {error && <div className="error">{error}</div>}

        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="apiKey">API Key</label>
            <input
              id="apiKey"
              type="password"
              className="form-input"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="finance-api-key"
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn--primary" style={{ width: '100%' }}>
            Login
          </button>
        </form>
      </div>
    </div>
  )
}
