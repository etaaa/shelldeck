/**
 * TerminalSettings — settings panel for terminal appearance and behavior.
 */

import { useState, useRef, useEffect } from 'react'
import { useSettings, defaultSettings } from '@/context/settings-context'
import { ALargeSmall, ScrollText, ChevronDown } from 'lucide-react'

const scrollbackOptions = [
  { label: '500', value: 500 },
  { label: '1,000', value: 1_000 },
  { label: '5,000', value: 5_000 },
  { label: '10,000', value: 10_000 },
  { label: '50,000', value: 50_000 },
  { label: '100,000', value: 100_000 }
]

export function TerminalSettings() {
  const { settings, updateSetting } = useSettings()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentOption =
    scrollbackOptions.find((o) => o.value === settings.scrollback) ?? scrollbackOptions[1]

  useEffect(() => {
    if (!dropdownOpen) return
    const close = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [dropdownOpen])

  return (
    <div>
      <h2 className="text-lg font-medium text-foreground mb-6">Terminal</h2>

      <div className="space-y-4">
        {/* Font Size */}
        <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-card border border-border">
          <div className="flex gap-3">
            <ALargeSmall className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Font size</p>
              <p className="text-sm text-muted-foreground mt-1">
                Terminal text size in pixels (10–24).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="h-7 w-7 flex items-center justify-center rounded border border-border text-sm text-foreground hover:bg-accent transition-colors"
              onClick={() => updateSetting('fontSize', Math.max(10, settings.fontSize - 1))}
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-medium text-foreground">
              {settings.fontSize}
            </span>
            <button
              className="h-7 w-7 flex items-center justify-center rounded border border-border text-sm text-foreground hover:bg-accent transition-colors"
              onClick={() => updateSetting('fontSize', Math.min(24, settings.fontSize + 1))}
            >
              +
            </button>
          </div>
        </div>

        {/* Scrollback */}
        <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-card border border-border">
          <div className="flex gap-3">
            <ScrollText className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Scrollback buffer</p>
              <p className="text-sm text-muted-foreground mt-1">
                Maximum number of lines kept in terminal history.
              </p>
            </div>
          </div>
          <div className="relative" ref={dropdownRef}>
            <button
              className="flex items-center gap-2 px-3 py-1.5 rounded border border-border text-sm text-foreground hover:bg-accent transition-colors"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {currentOption.label}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 min-w-[120px] rounded-md border border-border bg-card py-1 shadow-lg">
                {scrollbackOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`w-full px-3 py-1.5 text-left text-sm hover:bg-accent transition-colors ${
                      option.value === settings.scrollback
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }`}
                    onClick={() => {
                      updateSetting('scrollback', option.value)
                      setDropdownOpen(false)
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        className="mt-6 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors"
        onClick={() => {
          updateSetting('fontSize', defaultSettings.fontSize)
          updateSetting('scrollback', defaultSettings.scrollback)
        }}
      >
        Restore defaults
      </button>
    </div>
  )
}
