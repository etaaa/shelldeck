import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { TerminalProvider } from './context/terminal-context'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TerminalProvider>
      <App />
    </TerminalProvider>
  </React.StrictMode>
)
