import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App.tsx'
import { ErrorBoundary } from './components/common'
import { AppProviders } from './contexts'
import { PostHogProvider } from 'posthog-js/react'
import './index.css'

const posthogOptions = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PostHogProvider 
      apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY} 
      options={posthogOptions}
    >
      <ErrorBoundary>
        <AppProviders>
          <App />
        </AppProviders>
      </ErrorBoundary>
    </PostHogProvider>
  </React.StrictMode>,
)