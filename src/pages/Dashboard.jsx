import { useEffect, useState } from 'react'
import { supabase, PRIORITY_COLORS, STATUS_COLORS, ROLE_LABELS } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ total: 0, active: 0, inTransit: 0, archived: 0 })
  const [recentFiles, setRecentFiles] = useState([])
  const [recentMovements, setRecentMovements] = useState([])

  useEffect(() => {
    loadStats()
    loadRecentFiles()
    loadRecentMovements()
  }, [])

  async function loadStats() {
    const { count: total } = await supabase.from('files').select('*', { count: 'exact', head: true })
    const { count: active } = await supabase.from('files').select('*', { count: 'exact', head: true }).eq('status', 'active')
    const { count: inTransit } = await supabase.from('files').select('*', { count: 'exact', head: true }).eq('status', 'in_transit')
    const { count: archived } = await supabase.from('files').select('*', { count: 'exact', head: true }).eq('status', 'archived')
    setStats({ total: total || 0, active: active || 0, inTransit: inTransit || 0, archived: archived || 0 })
  }

  async function loadRecentFiles() {
    const { data } = await supabase.from('files').select('*, profiles!files_current_holder_id_fkey(full_name)').order('created_at', { ascending: false }).limit(5)
    setRecentFiles(data || [])
  }

  async function loadRecentMovements() {
    const { data } = await supabase
      .from('file_movements')
      .select('*, files!inner(file_number, title), sender:profiles!file_movements_from_officer_id_fkey(full_name), receiver:profiles!file_movements_to_officer_id_fkey(full_name), peon:profiles!file_movements_handled_by_peon_id_fkey(full_name)')
      .order('timestamp', { ascending: false }).limit(5)
    setRecentMovements(data || [])
  }

  const statCards = [
    { label: 'Total Files', value: stats.total, color: 'bg-blue-500' },
    { label: 'Active (At Desk)', value: stats.active, color: 'bg-green-500' },
    { label: 'In Transit', value: stats.inTransit, color: 'bg-orange-500' },
    { label: 'Archived', value: stats.archived, color: 'bg-gray-500' },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Dashboard</h2>
      <p className="text-sm text-gray-500">Welcome, {profile?.full_name} ({ROLE_LABELS[profile?.role]})</p>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className={`w-3 h-3 rounded-full ${s.color} mb-2`}></div>
            <p className="text-2xl font-bold text-gray-800">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 flex-wrap">
        <Link to="/create-file" className="bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          ➕ New File
        </Link>
        <Link to="/scan" className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600">
          📷 Scan QR
        </Link>
        <Link to="/files" className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300">
          📁 View All Files
        </Link>
      </div>

      {/* Recent Files */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-700">Recent Files</div>
        {recentFiles.length === 0 ? (
          <p className="p-4 text-gray-400 text-sm">No files created yet</p>
        ) : (
          recentFiles.map(f => (
            <Link key={f.id} to={`/file/${f.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0">
              <div>
                <p className="font-medium text-sm">{f.file_number}</p>
                <p className="text-xs text-gray-500 truncate max-w-[200px]">{f.title}</p>
              </div>
              <div className="flex gap-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLORS[f.priority]}`}>{f.priority}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[f.status]}`}>{f.status}</span>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Recent Movements */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-700">Recent Movements</div>
        {recentMovements.length === 0 ? (
          <p className="p-4 text-gray-400 text-sm">No movements recorded</p>
        ) : (
          recentMovements.map(m => (
            <div key={m.id} className="px-4 py-3 border-b border-gray-50 last:border-0 text-sm">
              <p className="font-medium">
                {m.sender?.full_name} → {m.receiver?.full_name}
              </p>
              <p className="text-xs text-gray-500">
                {m.files?.file_number} · {m.status} · {new Date(m.timestamp).toLocaleString('en-IN')}
              </p>
              {m.peon && <p className="text-xs text-gray-400">Carrier: {m.peon.full_name}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  )
}