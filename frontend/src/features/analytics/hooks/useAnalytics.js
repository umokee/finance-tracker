import { useState, useEffect, useCallback } from 'react'
import {
  getOverview,
  getSpendingByCategory,
  getTrend,
  getDailySpending
} from '../../../shared/api/endpoints'

export function useAnalytics(days = 30) {
  const [overview, setOverview] = useState(null)
  const [categoryData, setCategoryData] = useState([])
  const [trendData, setTrendData] = useState([])
  const [dailySpending, setDailySpending] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [overviewRes, categoryRes, trendRes, dailyRes] = await Promise.all([
        getOverview(),
        getSpendingByCategory(),
        getTrend({ days }),
        getDailySpending({ days })
      ])
      setOverview(overviewRes)
      setCategoryData(categoryRes)
      setTrendData(trendRes)
      setDailySpending(dailyRes)
    } catch (err) {
      setError('Failed to load analytics data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    load()
  }, [load])

  return {
    overview,
    categoryData,
    trendData,
    dailySpending,
    loading,
    error,
    reload: load
  }
}
