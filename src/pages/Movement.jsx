import { useEffect, useState } from 'react'
import { supabase, formatTime } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function Movement() {
  const { profile } = useAuth()
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    loadMovements()
  }, [])

  async function loadMovements() {
    const { data } = await supabase
      .from('file_movements')
      .select('*, files!inner(file_number, title), sender:profiles!file_movements_from_officer_id_fkey(full_name), receiver:profiles!file_movements_to_officer_id_fkey(full_name), peon:profiles!file_movements_handled_by_peon_id_fkey(full_name)')
      .order('timestamp', { ascending: false })
      .limit(50)
    setMovements(data || [])
    setLoading(false)
  }

  const filtered = filter
    ? movements.filter(m =>
        m.files?.file_number?.toLowerCase().includes(filter.toLowerCase()) ||
        m.sender?.full_name?.toLowerCase().includes(filter.toLowerCase()) ||
        m.receiver?.full_name?.toLowerCase().includes(filter.toLowerCase())
      )
    : movements

  const statusIcon = { dispatched: '📤', in_transit: '📦', received: '✅' }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">File Movements / Handovers</h2>

      <input
        type="text" placeholder="Search by file number or name..."
        value={filter} onChange={e => setFilter(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
      />

      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-gray-400">No movements found</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(m => (
            <div key={m.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-800">{m.files?.file_number}</p>
                  <p className="text-xs text-gray-500 truncate">{m.files?.title}</p>
                  <p className="text-sm mt-1">
                    {statusIcon[m.status]}
                    <span className="font-semibold">{m.sender?.full_name || 'System'}</span>
                    {' → '}
                    <span className="font-semibold">{m.receiver?.full_name || 'Unknown'}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatTime(m.timestamp)}</p>
                </div>
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    m.status === 'received' ? 'bg-green-100 text-green-700' :
                    m.status === 'in_transit' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {m.status}
                  </span>
                </div>
              </div>
              {m.peon && (
                <p className="text-xs text-gray-600 mt-1 font-medium flex items-center gap-1">
                  <span>🚶 Handled by carrier:</span>
                  <span className="text-gray-900 font-semibold">{m.peon.full_name}</span>
                </p>
              )}
              {m.remarks && <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded mt-1.5 italic">"{m.remarks}"</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}