import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ROLE_LABELS } from '../lib/supabase'

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['admin', 'officer', 'peon', 'viewer'] },
  { path: '/files', label: 'All Files', icon: '📁', roles: ['admin', 'officer', 'peon', 'viewer'] },
  { path: '/create-file', label: 'New File', icon: '➕', roles: ['admin', 'officer', 'peon'] },
  { path: '/scan', label: 'Scan QR', icon: '📷', roles: ['admin', 'officer', 'peon'] },
  { path: '/movements', label: 'Handovers', icon: '🔄', roles: ['admin', 'officer', 'peon'] },
  { path: '/users', label: 'Users', icon: '👥', roles: ['admin'] },
  { path: '/viewer', label: 'Public View', icon: '🔍', roles: ['admin', 'officer', 'peon', 'viewer'] },
]

export default function Layout({ children }) {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const allowed = NAV_ITEMS.filter(item => item.roles.includes(profile?.role))

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-blue-800 text-white shadow-lg sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => setMenuOpen(!menuOpen)} className="text-2xl leading-none p-1">
            ☰
          </button>
          <h1 className="text-lg font-bold truncate mx-2">GBP File Tracking</h1>
          <div className="flex items-center gap-2 text-sm">
            <span className="hidden sm:inline">{profile?.full_name}</span>
            <span className="bg-blue-600 px-2 py-0.5 rounded text-xs">{ROLE_LABELS[profile?.role]}</span>
            <button onClick={handleSignOut} className="text-white/80 hover:text-white text-xl leading-none">
              ⏻
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-xl transform transition-transform duration-200 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="bg-blue-800 text-white p-4 font-bold text-lg">GBP-FTMS</div>
        <nav className="p-2">
          {allowed.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 text-sm ${
                location.pathname === item.path
                  ? 'bg-blue-100 text-blue-800 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="p-4 max-w-5xl mx-auto">{children}</main>
    </div>
  )
}