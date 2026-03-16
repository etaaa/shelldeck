/**
 * IdleScreen — shown when no terminal session is active.
 * Displays the shelldeck logo, app name, and usage hints.
 */

import { Plus, FolderOpen } from 'lucide-react'

function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} fill="none">
      <path
        d="M 144 148 L 296 256 L 144 364"
        stroke="currentColor"
        strokeWidth="56"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-zinc-500"
      />
      <line
        x1="328"
        y1="364"
        x2="400"
        y2="364"
        stroke="currentColor"
        strokeWidth="56"
        strokeLinecap="round"
        className="text-emerald-500"
      />
    </svg>
  )
}

const hints = [
  { icon: FolderOpen, label: 'Add or select a project', description: 'from the sidebar' },
  { icon: Plus, label: 'Open a terminal', description: 'to start working' }
]

export function IdleScreen() {
  return (
    <div className="flex-1 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-8 max-w-sm text-center">
        <Logo className="w-20 h-20" />

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
