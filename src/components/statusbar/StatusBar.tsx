/**
 * StatusBar — global bottom bar showing system resource usage and app version.
 */

import { useState, useEffect } from 'react'
import { getVersion } from '@tauri-apps/api/app'
import { useSystemStats } from '@/hooks/use-system-stats'
import { Cpu, MemoryStick } from 'lucide-react'

export function StatusBar() {
  const stats = useSystemStats()
  const [version, setVersion] = useState('')

  useEffect(() => {
    getVersion().then(setVersion)
  }, [])

  return (
    <footer className="flex items-center justify-between px-4 py-1.5 border-t border-border bg-card text-xs text-muted-foreground">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <Cpu className="h-3.5 w-3.5" />
          {stats.cpuUsage}%
        </span>
        <span className="flex items-center gap-1.5">
          <MemoryStick className="h-3.5 w-3.5" />
          {stats.memoryUsedGB}GB / {stats.memoryTotalGB}GB ({stats.memoryUsage}%)
        </span>
      </div>
      {version && <span>v{version}</span>}
    </footer>
  )
}
