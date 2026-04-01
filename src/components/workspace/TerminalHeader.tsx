/**
 * TerminalHeader — displays the terminal name above the active terminal view.
 */

import { useTerminalManager } from '@/context/terminal-manager'
import type { TerminalSession } from '@/types'

interface TerminalHeaderProps {
  session: TerminalSession
}

export function TerminalHeader({ session }: TerminalHeaderProps) {
  const terminalManager = useTerminalManager()

  return (
    <div
      className="flex items-center px-4 h-12 border-b border-border bg-card shrink-0"
      data-tauri-drag-region
    >
      <span className="text-sm font-medium text-foreground truncate pointer-events-none">
        {terminalManager.terminalTitles[session.id] || session.name}
      </span>
    </div>
  )
}
