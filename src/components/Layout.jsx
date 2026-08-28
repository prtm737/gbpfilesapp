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

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Top Navbar */}
      <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white shadow-md sticky top-0 z-40 border-b border-blue-700/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Brand + Menu Toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-lg text-blue-200 hover:text-white hover:bg-blue-800/80 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                aria-label="Toggle navigation menu"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <Link to="/dashboard" className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-inner border border-blue-400/40">
                  GBP
                </div>
                <div className="hidden sm:block">
                  <div className="font-bold text-base tracking-tight leading-none text-white">GBP-FTMS</div>
                  <div className="text-[11px] text-blue-200 font-medium leading-tight">Guwahati Biotech Park</div>
                </div>
              </Link>
            </div>

            {/* Middle Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {allowed.map(item => {
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                      isActive
                        ? 'bg-white/20 text-white shadow-inner'
                        : 'text-blue-100 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Right User Badge & Logout */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2.5 bg-blue-950/40 px-2.5 py-1.5 rounded-xl border border-blue-700/40">
                <div className="w-7 h-7 rounded-full bg-blue-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {initials}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold text-white leading-tight truncate max-w-[120px]">
                    {profile?.full_name || 'Officer'}
                  </p>
                  <span className="text-[10px] text-blue-200 font-medium block">
                    {ROLE_LABELS[profile?.role] || 'Staff'}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-1.5 bg-red-600/90 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs focus:ring-2 focus:ring-red-400 outline-none"
                title="Sign out of your account"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile / Slide Sidebar Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-white shadow-2xl transform transition-transform duration-200 ease-in-out flex flex-col ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-sm border border-blue-400/40">
              GBP
            </div>
            <div>
              <h2 className="font-bold text-sm leading-tight">GBP-FTMS</h2>
              <p className="text-[10px] text-blue-200">File Tracking & Movement</p>
            </div>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            className="p-1 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 text-xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* User Profile Card in Drawer */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-800 text-white font-bold text-sm flex items-center justify-center shadow-xs">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm text-slate-900 truncate">{profile?.full_name || 'User'}</p>
              <p className="text-xs text-slate-500 truncate">{profile?.department || 'Guwahati Biotech Park'}</p>
              <span className="inline-block mt-1 bg-blue-100 text-blue-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                {ROLE_LABELS[profile?.role] || 'Staff'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="p-3 flex-1 overflow-y-auto space-y-1">
          {allowed.map(item => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-800 border border-blue-200 shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Drawer Footer with Logout */}
        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 font-semibold px-4 py-2.5 rounded-xl text-sm transition border border-red-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">{children}</main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-3 text-center text-xs text-slate-400">
        GBP Physical File Tracking & Movement System · Guwahati Biotech Park
      </footer>
    </div>
  )
}