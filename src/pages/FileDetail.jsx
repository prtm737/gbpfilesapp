import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, PRIORITY_COLORS, STATUS_COLORS, formatTime } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import QRScanner from '../components/QRScanner'

export default function FileDetail() {
  const { id } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [movements, setMovements] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showScanner, setShowScanner] = useState(false)
  const [showDispatch, setShowDispatch] = useState(false)
  const [dispatchTo, setDispatchTo] = useState('')
  const [dispatchPeon, setDispatchPeon] = useState('')
  const [dispatchRemarks, setDispatchRemarks] = useState('')

  useEffect(() => {
    loadFile()
    loadUsers()
  }, [id])

  async function loadFile() {
    const { data } = await supabase
      .from('files')
      .select('*, profiles!files_current_holder_id_fkey(full_name, role)')
      .eq('id', id)
      .single()
    setFile(data)

    const { data: mov } = await supabase
      .from('file_movements')
      .select('*, sender:profiles!file_movements_from_officer_id_fkey(full_name), receiver:profiles!file_movements_to_officer_id_fkey(full_name), peon:profiles!file_movements_handled_by_peon_id_fkey(full_name)')
      .eq('file_id', id)
      .order('timestamp', { ascending: false })
    setMovements(mov || [])
    setLoading(false)
  }

  async function loadUsers() {
    const { data } = await supabase.from('profiles').select('*')
    setUsers(data || [])
  }

  async function handleDispatch(e) {
    e.preventDefault()
    if (!dispatchTo) return

    const { error } = await supabase.from('file_movements').insert({
      file_id: id,
      from_officer_id: profile.id,
      to_officer_id: dispatchTo,
      handled_by_peon_id: dispatchPeon || null,
      status: 'dispatched',
      remarks: dispatchRemarks,
    })

    if (error) {
      alert('Dispatch failed: ' + error.message)
      return
    }

    await supabase.from('files').update({ status: 'in_transit' }).eq('id', id)
    setShowDispatch(false)
    loadFile()
  }

  async function handleReceive() {
    const { error } = await supabase.from('file_movements').insert({
      file_id: id,
      from_officer_id: file.current_holder_id,
      to_officer_id: profile.id,
      status: 'received',
      remarks: 'Received and acknowledged',
    })

    if (error) {
      alert('Receive failed: ' + error.message)
      return
    }

    await supabase.from('files').update({ status: 'active', current_holder_id: profile.id }).eq('id', id)
    loadFile()
  }

  async function handleQRScan(decodedText) {
    setShowScanner(false)
    const scannedId = decodedText.trim()
    // Handle via scan route - re-fetch
    navigate(`/file/${scannedId}`)
    window.location.reload()
  }

  async function handleArchive() {
    if (!confirm('Archive this file?')) return
    await supabase.from('files').update({ status: 'archived' }).eq('id', id)
    loadFile()
  }

  const officers = users.filter(u => u.role === 'officer')
  const peons = users.filter(u => u.role === 'peon')

  if (loading) return <div className="text-center py-8 text-gray-400">Loading...</div>
  if (!file) return <div className="text-center py-8 text-gray-400">File not found</div>

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <button onClick={() => navigate('/files')} className="text-blue-600 text-sm hover:underline">← Back to Files</button>

      {/* File card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-blue-800">{file.file_number}</h2>
            <p className="text-gray-700 mt-1">{file.title}</p>
          </div>
          <div className="flex gap-1">
            <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLORS[file.priority]}`}>{file.priority}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[file.status]}`}>{file.status}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm border-t border-gray-100 pt-3 mt-3">
          <div><span className="text-gray-400">Department:</span> <span className="font-semibold text-gray-800">{file.department}</span></div>
          <div><span className="text-gray-400">Current Custodian:</span> <span className="font-semibold text-gray-800">{file.profiles?.full_name || 'N/A'}</span></div>
          <div><span className="text-gray-400">Created At:</span> <span className="text-gray-700">{formatTime(file.created_at)}</span></div>
          <div><span className="text-gray-400">Status:</span> <span className="font-medium text-gray-700 capitalize">{file.status.replace('_', ' ')}</span></div>
        </div>

        {file.description && (
          <div className="mt-3.5 pt-3 border-t border-gray-100 text-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description / Scope</p>
            <p className="text-gray-700 whitespace-pre-line bg-gray-50 p-2.5 rounded-lg text-xs leading-relaxed">{file.description}</p>
          </div>
        )}

        {file.remarks && (
          <div className="mt-2.5 text-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Initial Remarks / Notes</p>
            <p className="text-gray-600 italic bg-amber-50/60 p-2 rounded-lg text-xs border border-amber-100">{file.remarks}</p>
          </div>
        )}

        {/* QR Code display */}
        <div className="mt-4 p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl text-center">
          <p className="text-xs text-gray-600 mb-1 font-medium">Physical QR Sticker ID: <span className="font-mono text-blue-900 font-bold bg-white px-2 py-0.5 rounded border border-blue-200">{file.id}</span></p>
          <p className="text-[11px] text-gray-400">Scan this code or attach printed QR to physical file cover.</p>
        </div>
      </div>

      {/* Actions */}
      {file.status !== 'archived' && (
        <div className="flex flex-wrap gap-2">
          {profile.id === file.current_holder_id && (
            <button onClick={() => setShowDispatch(true)} className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-500">
              📤 Dispatch
            </button>
          )}
          {file.status === 'in_transit' && profile.id !== file.current_holder_id && (
            <button onClick={handleReceive} className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600">
              ✅ Receive & Acknowledge
            </button>
          )}
          {(profile.role === 'admin') && file.status !== 'archived' && (
            <button onClick={handleArchive} className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-500">
              📦 Archive
            </button>
          )}
          <button onClick={() => setShowScanner(true)} className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600">
            📷 Scan QR
          </button>
        </div>
      )}

      {/* Dispatch form */}
      {showDispatch && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-700 mb-3">Dispatch File</h3>
          <form onSubmit={handleDispatch} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">To Officer *</label>
              <select required value={dispatchTo} onChange={e => setDispatchTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
              >
                <option value="">Select officer...</option>
                {officers.map(o => <option key={o.id} value={o.id}>{o.full_name} ({o.department})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Handover via Dispatch / Carrier Staff (Optional)</label>
              <select value={dispatchPeon} onChange={e => setDispatchPeon(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white"
              >
                <option value="">Direct Handover (Self / In-person)</option>
                {users.map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.department || ROLE_LABELS[p.role]})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Dispatch Remarks / Instructions</label>
              <textarea value={dispatchRemarks} onChange={e => setDispatchRemarks(e.target.value)}
                placeholder="e.g. Urgent review requested by tomorrow..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" rows={2} />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-500 shadow-sm">Confirm Dispatch</button>
              <button type="button" onClick={() => setShowDispatch(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Movement chain */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 font-bold text-gray-700 text-sm">
          Audit Trail / Chain of Custody
        </div>
        {movements.length === 0 ? (
          <p className="p-6 text-gray-400 text-sm text-center">No custody movements recorded yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {movements.map((m, i) => (
              <div key={m.id} className="px-4 py-3.5 text-sm relative pl-10 hover:bg-gray-50/70 transition">
                <div className={`absolute left-3 top-4 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
                  m.status === 'received' ? 'bg-green-500' : m.status === 'in_transit' ? 'bg-orange-500' : 'bg-blue-500'
                }`} />
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-gray-900">
                    {m.status === 'received' ? '✅ Received by' : m.status === 'in_transit' ? '📦 In transit via' : '📤 Dispatched by'}{' '}
                    <span className="text-blue-900">{m.sender?.full_name || 'System'}</span>
                    {m.receiver && <> → <span className="text-blue-900">{m.receiver.full_name}</span></>}
                  </p>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${
                    m.status === 'received' ? 'bg-green-100 text-green-700' : m.status === 'in_transit' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {m.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{formatTime(m.timestamp)}</p>
                {m.peon && (
                  <p className="text-xs text-gray-600 mt-1 flex items-center gap-1 font-medium">
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

      {showScanner && <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />}
    </div>
  )
}