import { useState, useEffect, useCallback } from 'react'
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../../../shared/api/endpoints'

export function useCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (err) {
      setError('Failed to load categories')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const add = async (data) => {
    const created = await createCategory(data)
    setCategories(prev => [...prev, created])
    return created
  }

  const update = async (id, data) => {
    const updated = await updateCategory(id, data)
    setCategories(prev => prev.map(c => c.id === id ? updated : c))
    return updated
  }

  const remove = async (id) => {
    await deleteCategory(id)
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  return {
    categories,
    loading,
    error,
    reload: load,
    add,
    update,
    remove
  }
}
