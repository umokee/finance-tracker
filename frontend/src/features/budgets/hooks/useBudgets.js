import { useState, useEffect, useCallback } from 'react'
import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget
} from '../../../shared/api/endpoints'
import { getCurrentMonthYear } from '../../../shared/utils/format'

export function useBudgets(month, year) {
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const { month: currentMonth, year: currentYear } = getCurrentMonthYear()
  const targetMonth = month || currentMonth
  const targetYear = year || currentYear

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getBudgets({ month: targetMonth, year: targetYear })
      setBudgets(data)
    } catch (err) {
      setError('Failed to load budgets')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [targetMonth, targetYear])

  useEffect(() => {
    load()
  }, [load])

  const add = async (data) => {
    const created = await createBudget({
      ...data,
      month: targetMonth,
      year: targetYear
    })
    setBudgets(prev => [...prev, created])
    return created
  }

  const update = async (id, data) => {
    const updated = await updateBudget(id, data)
    setBudgets(prev => prev.map(b => b.id === id ? updated : b))
    return updated
  }

  const remove = async (id) => {
    await deleteBudget(id)
    setBudgets(prev => prev.filter(b => b.id !== id))
  }

  return {
    budgets,
    loading,
    error,
    reload: load,
    add,
    update,
    remove
  }
}
