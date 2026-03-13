/**
 * TerminalList — renders clickable terminal session entries under a project.
 * Clicking a session makes it the active (visible) terminal in the workspace.
 */

import { useTerminalContext } from '@/context/terminal-context'
import { useTerminalManager } from '@/hooks/use-terminal'
import { TerminalSession } from '../../../shared/types'
import { cn } from '@/lib/utils'
import { Terminal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TerminalListProps {
  sessions: TerminalSession[]
  projectPath: string
  terminalManager: ReturnType<typeof useTerminalManager>
}

export function TerminalList({ sessions, projectPath, terminalManager }: TerminalListProps) {
  const { state, setActiveTerminal, removeSession } = useTerminalContext()

  if (sessions.length === 0) return null

  const handleKill = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    terminalManager.destroyTerminal(sessionId)
    removeSession(sessionId)
  }

  return (
    <div className="ml-3 border-l border-border pl-2 space-y-0.5">
      {sessions.map((session) => {
        const isActive = state.activeTerminalId === session.id
        return (
          <div
            key={session.id}
            className={cn(
              'flex items-center justify-between px-2 py-1 rounded cursor-pointer group text-xs',
              isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
            )}
            onClick={() => setActiveTerminal(session.id)}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Terminal className="h-3 w-3 shrink-0" />
              <span className="truncate">{session.name}</span>
              {/* Status dot */}
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full shrink-0',
                  session.isRunning ? 'bg-green-500' : 'bg-zinc-500'
                )}
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              onClick={(e) => handleKill(session.id, e)}
              title="Kill Terminal"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )
      })}
    </div>
  )
}
