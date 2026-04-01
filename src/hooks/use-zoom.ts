import { useEffect } from 'react'
import { listen } from '@tauri-apps/api/event'
import { getCurrentWebview } from '@tauri-apps/api/webview'
import { useSettings } from '@/context/settings-context'

const ZOOM_STEP = 0.1
const MIN_ZOOM = 0.5
const MAX_ZOOM = 2.0

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function useZoom() {
  const { settings, updateSetting } = useSettings()

  // Apply zoom level on mount and when it changes.
  useEffect(() => {
    getCurrentWebview().setZoom(settings.zoomLevel)
  }, [settings.zoomLevel])

  // Listen for zoom menu events.
  useEffect(() => {
    const unlisten = listen<string>('zoom', (event) => {
      updateSetting(
        'zoomLevel',
        event.payload === 'reset'
          ? 1.0
          : clamp(
              settings.zoomLevel + (event.payload === 'in' ? ZOOM_STEP : -ZOOM_STEP),
              MIN_ZOOM,
              MAX_ZOOM
            )
      )
    })

    return () => {
      unlisten.then((fn) => fn())
    }
  }, [settings.zoomLevel, updateSetting])
}
