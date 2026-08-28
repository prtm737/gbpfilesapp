import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import App from './App'
import './index.css'

const rawBase = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/'
const basename = rawBase.endsWith('/') && rawBase.length > 1
  ? rawBase.slice(0, -1)
  : (window.location.hostname.includes('github.io') || window.location.pathname.startsWith('/gbpfilesapp'))
    ? '/gbpfilesapp'
    : ''

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)

// Service worker is handled by vite-plugin-pwa (autoUpdate); do not double-register here