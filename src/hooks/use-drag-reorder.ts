/**
 * useDragReorder — pointer-based drag-to-reorder for vertical lists.
 * Used by WorkspaceList for reordering workspaces via drag-and-drop.
 */

import { useState, useRef, useEffect, useCallback } from 'react'

export function useDragReorder(onReorder: (fromIndex: number, toIndex: number) => void) {
  const [dragging, setDragging] = useState<number | null>(null)
  const [dropTarget, setDropTarget] = useState<number | null>(null)
  const dropTargetRef = useRef<number | null>(null)
  const itemRefs = useRef(new Map<number, HTMLElement>())

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
      dropTargetRef.current = target
      setDropTarget(target)
    }

    const onPointerUp = () => {
      const dt = dropTargetRef.current
      if (dragging !== null && dt !== null) {
        const to = dt > dragging ? dt - 1 : dt
        if (to !== dragging) onReorder(dragging, to)
      }
      setDragging(null)
      setDropTarget(null)
      dropTargetRef.current = null
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [dragging, findDropIndex, onReorder])

  const startDrag = useCallback((index: number) => setDragging(index), [])

  const registerRef = useCallback((index: number, el: HTMLElement | null) => {
    if (el) itemRefs.current.set(index, el)
    else itemRefs.current.delete(index)
  }, [])

  return { dragging, dropTarget, startDrag, registerRef }
}
