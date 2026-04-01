/**
 * IdleScreen — shown when no terminal session is active.
 * Actionable cards to get started quickly.
 */

import { useTerminalContext } from '@/context/terminal-context'
import { useTerminalManager } from '@/context/terminal-manager'
import { openFolderDialog, getHomeDir } from '@/lib/api'
import { FolderOpen, Terminal } from 'lucide-react'

export function IdleScreen() {
  const { addWorkspace, createSession } = useTerminalContext()
  const terminalManager = useTerminalManager()

  const handleAddWorkspace = async () => {
    const folderPath = await openFolderDialog()
    if (!folderPath) return
    const name = folderPath.split('/').pop() || folderPath
    addWorkspace(name, folderPath)
  }

  const handleNewTerminal = async () => {
    const home = await getHomeDir()
    const sessionId = createSession(null)
    terminalManager.createTerminal(sessionId, home)
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-8 max-w-xs w-full">
        <div className="flex flex-col items-center gap-2">
          <svg viewBox="0 0 512 512" className="w-16 h-16" fill="none">
            <path
              d="M 144 148 L 296 256 L 144 364"
              stroke="currentColor"
              className="text-foreground"
              strokeWidth="56"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="328"
              y1="364"
              x2="400"
              y2="364"
              stroke="#34d399"
              strokeWidth="56"
              strokeLinecap="round"
            />
          </svg>
          <p className="text-sm font-medium text-foreground">shelldeck</p>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <button
            className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border text-left hover:bg-accent/50 transition-colors"
            onClick={handleAddWorkspace}
          >
            <FolderOpen className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <span className="text-sm font-medium text-foreground">Add a workspace</span>
              <span className="block text-xs text-muted-foreground">Open a project folder</span>
            </div>
          </button>
          <button
            className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border text-left hover:bg-accent/50 transition-colors"
            onClick={handleNewTerminal}
          >
            <Terminal className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <span className="text-sm font-medium text-foreground">Quick terminal</span>
              <span className="block text-xs text-muted-foreground">Open a terminal in ~</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
