/**
 * ProjectList — renders each project with its terminal sessions.
 * Provides controls to add new terminals and switch between existing ones.
 */

import { useTerminalContext } from '@/context/terminal-context'
import { TerminalList } from './TerminalList'
import { useTerminalManager } from '@/hooks/use-terminal'
import { Button } from '@/components/ui/button'
import { Plus, Folder, X } from 'lucide-react'

interface ProjectListProps {
  terminalManager: ReturnType<typeof useTerminalManager>
}

export function ProjectList({ terminalManager }: ProjectListProps) {
  const { state, createSession, removeProject } = useTerminalContext()

  const handleNewTerminal = (projectId: string, projectPath: string) => {
    const sessionId = createSession(projectId)
    terminalManager.createTerminal(sessionId, projectPath)
  }

  return (
    <div className="space-y-1">
      {state.projects.map((project) => {
        const sessions = state.sessions.filter((s) => s.projectId === project.id)

        return (
          <div key={project.id} className="rounded-md">
            {/* Project header */}
            <div className="flex items-center justify-between px-2 py-1.5 group">
              <div className="flex items-center gap-2 min-w-0">
                <Folder className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs font-medium text-foreground truncate">
                  {project.name}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleNewTerminal(project.id, project.path)}
                  title="New Terminal"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  onClick={() => removeProject(project.id)}
                  title="Remove Project"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Terminal sessions for this project */}
            <TerminalList
              sessions={sessions}
              projectPath={project.path}
              terminalManager={terminalManager}
            />
          </div>
        )
      })}
    </div>
  )
}
