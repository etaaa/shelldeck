/**
 * useKeyboardShortcuts — registers global keyboard shortcuts for terminal management.
 *
 * Shortcuts (Cmd on macOS, Ctrl on other platforms):
 *   Mod+T          — New terminal in active/first workspace (or quick terminal if none)
 *   Mod+Shift+T    — New quick terminal
 *   Mod+W          — Kill active terminal
 *   Mod+Shift+[    — Switch to previous terminal
 *   Mod+Shift+]    — Switch to next terminal
 *   Mod+1-9        — Switch to terminal by index
 */

import { useEffect } from 'react'
import { useTerminalContext } from '@/context/terminal-context'
import { useTerminalManager } from '@/context/terminal-manager'
import { getHomeDir } from '@/lib/api'

export function useKeyboardShortcuts() {
  const { state, createSession, createQuickSession, removeSession, setActiveTerminal } =
    useTerminalContext()
  const terminalManager = useTerminalManager()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey

      if (!mod) return

      // Cmd+Shift+T — new quick terminal.
      if (e.key === 't' && e.shiftKey) {
        e.preventDefault()
        getHomeDir().then((home) => {
          const sessionId = createQuickSession()
          terminalManager.createTerminal(sessionId, home)
        })
        return
      }

      // Cmd+T — new terminal in the active session's workspace, or the first workspace.
      // Falls back to a quick terminal if no workspaces exist.
      if (e.key === 't' && !e.shiftKey) {
        e.preventDefault()
        const activeSession = state.sessions.find((s) => s.id === state.activeTerminalId)
        const workspace = activeSession?.workspaceId
          ? state.workspaces.find((w) => w.id === activeSession.workspaceId)
          : state.workspaces[0]
        if (workspace) {
          const sessionId = createSession(workspace.id)
          terminalManager.createTerminal(sessionId, workspace.path)
        } else {
          getHomeDir().then((home) => {
            const sessionId = createQuickSession()
            terminalManager.createTerminal(sessionId, home)
          })
        }
        return
      }

      // Cmd+W — kill active terminal.
      if (e.key === 'w' && !e.shiftKey) {
        e.preventDefault()
        if (!state.activeTerminalId) return
        terminalManager.destroyTerminal(state.activeTerminalId)
        removeSession(state.activeTerminalId)
        return
      }

      // Cmd+Shift+[ — previous terminal.
      if (e.key === '[' && e.shiftKey) {
        e.preventDefault()
        if (state.sessions.length === 0) return
        const idx = state.sessions.findIndex((s) => s.id === state.activeTerminalId)
        const prev = idx <= 0 ? state.sessions.length - 1 : idx - 1
        setActiveTerminal(state.sessions[prev].id)
        return
      }

      // Cmd+Shift+] — next terminal.
      if (e.key === ']' && e.shiftKey) {
        e.preventDefault()
        if (state.sessions.length === 0) return
        const idx = state.sessions.findIndex((s) => s.id === state.activeTerminalId)
        const next = idx >= state.sessions.length - 1 ? 0 : idx + 1
        setActiveTerminal(state.sessions[next].id)
        return
      }

      // Cmd+1-9 — switch to terminal by index.
      const num = parseInt(e.key, 10)
      if (num >= 1 && num <= 9 && !e.shiftKey) {
        e.preventDefault()
        const session = state.sessions[num - 1]
        if (session) setActiveTerminal(session.id)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    state.sessions,
    state.activeTerminalId,
    state.workspaces,
    createSession,
    createQuickSession,
    removeSession,
    setActiveTerminal,
    terminalManager
  ])
}
