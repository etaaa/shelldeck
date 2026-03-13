/**
 * useSystemStats — subscribes to system resource stats from the main process.
 */

import { useState, useEffect } from 'react'
import { SystemStats } from '../../shared/types'

const defaultStats: SystemStats = {
  cpuUsage: 0,
  memoryUsage: 0,
  memoryUsedGB: 0,
  memoryTotalGB: 0
}

export function useSystemStats(): SystemStats {
  const [stats, setStats] = useState<SystemStats>(defaultStats)

  useEffect(() => {
    const unsub = window.shellDeck.onSystemStats((incoming) => {
      setStats(incoming)
    })
    return unsub
  }, [])

  return stats
}
