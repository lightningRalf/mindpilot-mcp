import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App.tsx'
import { ErrorBoundary } from './components/common'
import { AppProviders } from './contexts'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppProviders>
        <App />
      </AppProviders>
    </ErrorBoundary>
  </React.StrictMode>,
)