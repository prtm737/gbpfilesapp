import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, PRIORITY_COLORS, STATUS_COLORS } from '../lib/supabase'

export default function Files() {
  const [files, setFiles] = useState([])
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFiles()
  }, [department, status])

  async function loadFiles() {
    setLoading(true)
    let q = supabase.from('files').select('*, profiles!files_current_holder_id_fkey(full_name)')
    if (department) q = q.eq('department', department)
    if (status) q = q.eq('status', status)
    q = q.order('created_at', { ascending: false })
    const { data } = await q
    setFiles(data || [])
    setLoading(false)
  }

  const filtered = search
    ? files.filter(f => f.file_number.toLowerCase().includes(search.toLowerCase()) || f.title.toLowerCase().includes(search.toLowerCase()))
    : files

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">All Files</h2>
        <Link to="/create-file" className="bg-blue-800 text-white px-3 py-1.5 rounded-lg text-sm">+ New</Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text" placeholder="Search file number or title..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select value={department} onChange={e => setDepartment(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
          <option value="">All Departments</option>
          <option value="Biotech Incubation">Biotech Incubation</option>
          <option value="Admin">Admin</option>
          <option value="Finance">Finance</option>
          <option value="Legal">Legal</option>
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="in_transit">In Transit</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-gray-400">No files found</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(f => (
            <Link key={f.id} to={`/file/${f.id}`} className="block bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:border-blue-200 transition">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-blue-800">{f.file_number}</p>
                  <p className="text-sm text-gray-700 truncate">{f.title}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Dept: {f.department} · Holder: {f.profiles?.full_name || 'Unassigned'}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLORS[f.priority]}`}>{f.priority}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[f.status]}`}>{f.status}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}