/**
 * App — root layout component.
 * Three-panel layout: Sidebar | Workspace | StatusBar (bottom).
 */

import { Sidebar } from '@/components/sidebar/Sidebar'
import { Workspace } from '@/components/workspace/Workspace'
import { StatusBar } from '@/components/statusbar/StatusBar'
import { useTerminalManager } from '@/hooks/use-terminal'

export function App() {
  // Single terminal manager instance shared across all components.
  const terminalManager = useTerminalManager()

  return (
    <div className="h-screen flex flex-col">
      <div className="flex flex-1 min-h-0">
        <Sidebar terminalManager={terminalManager} />
        <Workspace terminalManager={terminalManager} />
      </div>
      <StatusBar />
    </div>
  )
}
