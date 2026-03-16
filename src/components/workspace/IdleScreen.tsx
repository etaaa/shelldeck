/**
 * IdleScreen — shown when no terminal session is active.
 * Displays the app name, a subtle terminal icon, and usage hints.
 */

import { Terminal, Plus, FolderOpen } from 'lucide-react'

const hints = [
  { icon: FolderOpen, label: 'Add or select a project', description: 'from the sidebar' },
  { icon: Plus, label: 'Open a terminal', description: 'to start working' }
]

export function IdleScreen() {
  return (
    <div className="flex-1 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-8 max-w-sm text-center">
        <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-zinc-800/50 border border-zinc-700/50">
          <Terminal className="w-10 h-10 text-zinc-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-foreground tracking-tight">shelldeck</h1>
          <p className="text-sm text-muted-foreground">No active terminal session.</p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          {hints.map((hint) => (
            <div
              key={hint.label}
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-zinc-800/30 border border-zinc-700/30"
            >
              <hint.icon className="w-4 h-4 text-zinc-500 shrink-0" />
              <span className="text-sm text-muted-foreground">
                <span className="text-foreground font-medium">{hint.label}</span> {hint.description}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
