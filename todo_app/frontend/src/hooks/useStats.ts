import { useCallback, useEffect, useState } from 'react'
import { fetchStats } from '@/api'
import type { Stats } from '@/types'

export function useStats(refreshKey = 0) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setStats(await fetchStats())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load, refreshKey])

  return { stats, loading, refresh: load }
}