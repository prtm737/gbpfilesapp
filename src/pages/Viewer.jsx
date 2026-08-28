import { useState } from 'react'
import { supabase, PRIORITY_COLORS, STATUS_COLORS } from '../lib/supabase'

export default function Viewer() {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSearch(e) {
    e.preventDefault()
    if (!search.trim()) return
    setLoading(true)
    setSearched(true)

    const { data } = await supabase
      .from('files')
      .select('*, profiles!files_current_holder_id_fkey(full_name)')
      .or(`file_number.ilike.%${search}%,title.ilike.%${search}%`)
      .limit(20)

    setResults(data || [])
    setLoading(false)
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-blue-800">GBP File Tracker</h2>
        <p className="text-sm text-gray-500">Public File Status Lookup</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by File Code, Title, Department..."
          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" className="bg-blue-800 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-blue-700">
          Search
        </button>
      </form>

      {loading && <div className="text-center py-8 text-gray-400">Searching...</div>}

      {!loading && searched && results.length === 0 && (
        <div className="text-center py-8 text-gray-400">No files found matching your search.</div>
      )}

      <div className="space-y-2">
        {results.map(f => (
          <div key={f.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-blue-800">{f.file_number}</p>
                <p className="text-sm text-gray-700 truncate">{f.title}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Dept: {f.department} · Current: {f.profiles?.full_name || 'Unassigned'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Created: {new Date(f.created_at).toLocaleDateString('en-IN')}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLORS[f.priority]}`}>{f.priority}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[f.status]}`}>{f.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}