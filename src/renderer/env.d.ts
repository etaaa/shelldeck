/// <reference types="vite/client" />

import type { ShellDeckAPI } from '../preload/index'

declare global {
  interface Window {
    shellDeck: ShellDeckAPI
  }
}
