import { useState, useEffect, useCallback } from 'react'
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction
} from '../../../shared/api/endpoints'

const PAGE_SIZE = 50

export function useTransactions(initialFilters = {}) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState(initialFilters)
  const [hasMore, setHasMore] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getTransactions({ ...filters, limit: PAGE_SIZE, offset: 0 })
      setTransactions(data)
      setHasMore(data.length === PAGE_SIZE)
    } catch (err) {
      setError('Failed to load transactions')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  const loadMore = async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const data = await getTransactions({ ...filters, limit: PAGE_SIZE, offset: transactions.length })
      setTransactions(prev => [...prev, ...data])
      setHasMore(data.length === PAGE_SIZE)
    } catch (err) {
      setError('Failed to load more transactions')
    } finally {
      setLoadingMore(false)
    }
  }

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
    loadingMore,
    hasMore,
    error,
    filters,
    setFilters,
    reload: load,
    loadMore,
    add,
    update,
    remove
  }
}
