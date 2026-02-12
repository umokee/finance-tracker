import { useState, useEffect, useCallback } from 'react'
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction
} from '../../../shared/api/endpoints'

export function useTransactions(initialFilters = {}) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState(initialFilters)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getTransactions(filters)
      setTransactions(data)
    } catch (err) {
      setError('Failed to load transactions')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    load()
  }, [load])

  const add = async (data) => {
    const created = await createTransaction(data)
    setTransactions(prev => [created, ...prev])
    return created
  }

  const update = async (id, data) => {
    const updated = await updateTransaction(id, data)
    setTransactions(prev => prev.map(t => t.id === id ? updated : t))
    return updated
  }

  const remove = async (id) => {
    await deleteTransaction(id)
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  return {
    transactions,
    loading,
    error,
    filters,
    setFilters,
    reload: load,
    add,
    update,
    remove
  }
}
