/**
 * SystemMonitor — periodically samples CPU and memory usage
 * and pushes stats to the renderer via IPC.
 */

import { BrowserWindow } from 'electron'
import os from 'os'
import { IPC, SystemStats } from '../shared/types'

export class SystemMonitor {
  private interval: ReturnType<typeof setInterval> | null = null
  private previousCpuTimes: { idle: number; total: number } | null = null

  /**
   * Start polling system stats at the given interval.
   * @param window - The BrowserWindow to send stats to.
   * @param intervalMs - Polling interval in milliseconds (default 2s).
   */
  start(window: BrowserWindow, intervalMs = 2000): void {
    this.stop()

    this.interval = setInterval(() => {
      const stats = this.getStats()
      window.webContents.send(IPC.SYSTEM_STATS, stats)
    }, intervalMs)
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  private getStats(): SystemStats {
    // Memory
    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const usedMem = totalMem - freeMem
    const memoryUsage = Math.round((usedMem / totalMem) * 100)

    // CPU — compare idle time between two samples.
    const cpus = os.cpus()
    let idle = 0
    let total = 0
    for (const cpu of cpus) {
      idle += cpu.times.idle
      total += cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.irq + cpu.times.idle
    }

    let cpuUsage = 0
    if (this.previousCpuTimes) {
      const idleDelta = idle - this.previousCpuTimes.idle
      const totalDelta = total - this.previousCpuTimes.total
      cpuUsage = totalDelta > 0 ? Math.round(((totalDelta - idleDelta) / totalDelta) * 100) : 0
    }
    this.previousCpuTimes = { idle, total }

    return {
      cpuUsage,
      memoryUsage,
      memoryUsedGB: Math.round((usedMem / 1073741824) * 10) / 10,
      memoryTotalGB: Math.round((totalMem / 1073741824) * 10) / 10
    }
  }
}
