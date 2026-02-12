import { useState, useEffect, useCallback } from 'react'
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  contributeToGoal
} from '../../../shared/api/endpoints'

export function useGoals() {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getGoals()
      setGoals(data)
    } catch (err) {
      setError('Failed to load goals')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const add = async (data) => {
    const created = await createGoal(data)
    setGoals(prev => [created, ...prev])
    return created
  }

  const update = async (id, data) => {
    const updated = await updateGoal(id, data)
    setGoals(prev => prev.map(g => g.id === id ? updated : g))
    return updated
  }

  const remove = async (id) => {
    await deleteGoal(id)
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  const contribute = async (id, amount, note) => {
    const updated = await contributeToGoal(id, { amount, note })
    setGoals(prev => prev.map(g => g.id === id ? updated : g))
    return updated
  }

  return {
    goals,
    loading,
    error,
    reload: load,
    add,
    update,
    remove,
    contribute
  }
}
