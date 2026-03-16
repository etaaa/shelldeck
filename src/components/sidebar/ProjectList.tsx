/**
 * ProjectList — renders each project with its terminal sessions.
 * Projects can be reordered via pointer-based drag-and-drop.
 * Double-click a project name to rename. Right-click for a context menu.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { useTerminalContext } from '@/context/terminal-context'
import { TerminalList } from './TerminalList'
import { useTerminalManager } from '@/hooks/use-terminal'
import { Plus, Folder, AlertTriangle, ChevronRight } from 'lucide-react'
import { pathExists } from '@/lib/api'
import { confirm } from '@tauri-apps/plugin-dialog'
import { open } from '@tauri-apps/plugin-shell'

interface ProjectListProps {
  terminalManager: ReturnType<typeof useTerminalManager>
}

export function ProjectList({ terminalManager }: ProjectListProps) {
  const { state, createSession, removeProject, reorderProjects, renameProject } =
    useTerminalContext()
  const [invalidPaths, setInvalidPaths] = useState<Set<string>>(new Set())
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  // Inline rename state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingId) {
      renameInputRef.current?.focus()
      renameInputRef.current?.select()
    }
  }, [editingId])

  const startRename = (projectId: string, currentName: string) => {
    setEditingId(projectId)
    setEditValue(currentName)
  }

  const commitRename = () => {
    if (editingId && editValue.trim()) {
      renameProject(editingId, editValue.trim())
    }
    setEditingId(null)
  }

  const cancelRename = () => {
    setEditingId(null)
  }

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    projectId: string
    projectName: string
    projectPath: string
  } | null>(null)

  useEffect(() => {
    if (!contextMenu) return
    const close = () => setContextMenu(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [contextMenu])

  const toggleCollapsed = (projectId: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(projectId)) next.delete(projectId)
      else next.add(projectId)
      return next
    })
  }

  // Drag state
  const [dragging, setDragging] = useState<number | null>(null)
  const [dropTarget, setDropTarget] = useState<number | null>(null)
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  const handleNewTerminal = async (projectId: string, projectPath: string) => {
    const exists = await pathExists(projectPath)
    if (!exists) {
      setInvalidPaths((prev) => new Set(prev).add(projectId))
      return
    }
    setInvalidPaths((prev) => {
      const next = new Set(prev)
      next.delete(projectId)
      return next
    })
    const sessionId = createSession(projectId)
    terminalManager.createTerminal(sessionId, projectPath)
  }

  const handleRemove = async (projectId: string, projectName: string) => {
    const ok = await confirm(`Remove "${projectName}" and all its terminals?`, {
      title: 'Remove Project',
      kind: 'warning'
    })
    if (ok) removeProject(projectId)
  }

  const findDropIndex = useCallback((clientY: number): number | null => {
    let closest: { index: number; distance: number } | null = null
    for (const [index, el] of itemRefs.current) {
      const rect = el.getBoundingClientRect()
      const mid = rect.top + rect.height / 2
      const distance = Math.abs(clientY - mid)
      if (!closest || distance < closest.distance) {
        closest = { index: clientY < mid ? index : index + 1, distance }
      }
    }
    return closest?.index ?? null
  }, [])

  useEffect(() => {
    if (dragging === null) return

    const onPointerMove = (e: PointerEvent) => {
      const target = findDropIndex(e.clientY)
      setDropTarget(target)
    }

    const onPointerUp = () => {
      if (dragging !== null && dropTarget !== null) {
        const to = dropTarget > dragging ? dropTarget - 1 : dropTarget
        if (to !== dragging) {
          reorderProjects(dragging, to)
        }
      }
      setDragging(null)
      setDropTarget(null)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [dragging, dropTarget, findDropIndex, reorderProjects])

  return (
    <div className="space-y-0.5">
      {state.projects.map((project, index) => {
        const sessions = state.sessions.filter((s) => s.projectId === project.id)
        const isInvalid = invalidPaths.has(project.id)
        const isCollapsed = collapsed.has(project.id)
        const isDragging = dragging === index
        const showIndicatorBefore = dropTarget === index && dragging !== null && dragging !== index
        const isEditing = editingId === project.id

        return (
          <div
            key={project.id}
            ref={(el) => {
              if (el) itemRefs.current.set(index, el)
              else itemRefs.current.delete(index)
            }}
          >
            {showIndicatorBefore && (
              <div className="h-0.5 bg-foreground/30 rounded-full mx-2 mb-0.5" />
            )}

            {/* Project header */}
            <div
              className={`flex items-center justify-between px-2 py-1.5 rounded-md group hover:bg-accent transition-colors cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-40' : ''}`}
              onPointerDown={(e) => {
                if (e.button !== 0 || (e.target as HTMLElement).closest('button, input')) return
                if (editingId) return
                e.preventDefault()
                setDragging(index)
              }}
              onContextMenu={(e) => {
                e.preventDefault()
                setContextMenu({
                  x: e.clientX,
                  y: e.clientY,
                  projectId: project.id,
                  projectName: project.name,
                  projectPath: project.path
                })
              }}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <button
                  className="h-6 w-6 -ml-0.5 flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground rounded"
                  onClick={() => toggleCollapsed(project.id)}
                >
                  <ChevronRight
                    className={`h-3.5 w-3.5 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                  />
                </button>
                <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
                {isEditing ? (
                  <input
                    ref={renameInputRef}
                    className="bg-background border border-border rounded px-2 py-0.5 text-sm text-foreground w-full outline-none"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename()
                      if (e.key === 'Escape') cancelRename()
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className="text-sm text-foreground truncate"
                    onDoubleClick={() => startRename(project.id, project.name)}
                  >
                    {project.name}
                  </span>
                )}
              </div>
              {!isEditing && (
                <button
                  className="h-6 w-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground hover:bg-secondary"
                  onClick={() => handleNewTerminal(project.id, project.path)}
                  title="New Terminal (⌘T)"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {isInvalid && (
              <div className="flex items-center gap-1.5 px-2 py-1 ml-6 text-xs text-yellow-500">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Path not found</span>
              </div>
            )}

            {!isCollapsed && <TerminalList sessions={sessions} terminalManager={terminalManager} />}

            {/* Show indicator after the last item if dropping at the end */}
            {dropTarget === state.projects.length &&
              index === state.projects.length - 1 &&
              dragging !== null &&
              dragging !== state.projects.length - 1 && (
                <div className="h-0.5 bg-foreground/30 rounded-full mx-2 mt-0.5" />
              )}
          </div>
        )
      })}

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 min-w-[160px] rounded-md border border-border bg-card py-1 shadow-lg"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            className="w-full px-3 py-1.5 text-left text-xs text-foreground hover:bg-accent"
            onClick={() => {
              startRename(contextMenu.projectId, contextMenu.projectName)
              setContextMenu(null)
            }}
          >
            Rename
          </button>
          <button
            className="w-full px-3 py-1.5 text-left text-xs text-foreground hover:bg-accent"
            onClick={() => {
              handleNewTerminal(contextMenu.projectId, contextMenu.projectPath)
              setContextMenu(null)
            }}
          >
            New Terminal
          </button>
          <button
            className="w-full px-3 py-1.5 text-left text-xs text-foreground hover:bg-accent"
            onClick={() => {
              open(contextMenu.projectPath)
              setContextMenu(null)
            }}
          >
            Open in Finder
          </button>
          <div className="border-t border-border my-1" />
          <button
            className="w-full px-3 py-1.5 text-left text-xs text-foreground hover:bg-accent hover:text-destructive"
            onClick={() => {
              handleRemove(contextMenu.projectId, contextMenu.projectName)
              setContextMenu(null)
            }}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  )
}
