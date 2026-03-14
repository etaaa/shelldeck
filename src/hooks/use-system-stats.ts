/**
 * useSystemStats — polls system resource stats from the Tauri backend.
 */

import { useState, useEffect } from 'react'
import { SystemStats } from '@/types'
import { getSystemStats } from '@/lib/api'

const defaultStats: SystemStats = {
  cpuUsage: 0,
  memoryUsage: 0,
  memoryUsedGB: 0,
  memoryTotalGB: 0
}

export function useSystemStats(): SystemStats {
  const [stats, setStats] = useState<SystemStats>(defaultStats)

  useEffect(() => {
    let active = true

    const poll = async () => {
      try {
        const s = await getSystemStats()
        if (active) {
          setStats((prev) =>
            prev.cpuUsage === s.cpuUsage &&
            prev.memoryUsage === s.memoryUsage &&
            prev.memoryUsedGB === s.memoryUsedGB &&
            prev.memoryTotalGB === s.memoryTotalGB
              ? prev
              : s
          )
        }
      } catch {
        // ignore
      }
    }

    poll()
    const interval = setInterval(poll, 2000)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  return stats
}
