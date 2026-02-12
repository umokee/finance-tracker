import { useState, useEffect, useCallback } from 'react'
import {
  getRecurringTransactions,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  processRecurringTransactions
} from '../../../shared/api/endpoints'

export function useRecurring() {
  const [recurring, setRecurring] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getRecurringTransactions()
      setRecurring(data)
    } catch (err) {
      setError('Failed to load recurring transactions')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const add = async (data) => {
    const created = await createRecurringTransaction(data)
    setRecurring(prev => [...prev, created])
    return created
  }

  const update = async (id, data) => {
    const updated = await updateRecurringTransaction(id, data)
    setRecurring(prev => prev.map(r => r.id === id ? updated : r))
    return updated
  }

  const remove = async (id) => {
    await deleteRecurringTransaction(id)
    setRecurring(prev => prev.filter(r => r.id !== id))
  }

  const process = async () => {
    const result = await processRecurringTransactions()
    await load()
    return result
  }

  return {
    recurring,
    loading,
    error,
    reload: load,
    add,
    update,
    remove,
    process
  }
}
