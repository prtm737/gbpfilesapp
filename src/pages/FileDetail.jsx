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

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-400">Department:</span> <span className="font-medium">{file.department}</span></div>
          <div><span className="text-gray-400">Current Holder:</span> <span className="font-medium">{file.profiles?.full_name || 'N/A'}</span></div>
          <div><span className="text-gray-400">Created:</span> <span>{formatTime(file.created_at)}</span></div>
        </div>

        {/* QR Code display */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
          <p className="text-xs text-gray-500 mb-1">File ID for QR: <span className="font-mono text-blue-800 font-bold">{file.id}</span></p>
          <p className="text-xs text-gray-400">Print this ID as QR code sticker to affix on the physical file.</p>
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
              <label className="block text-xs font-medium text-gray-600 mb-1">Handover by Peon (optional)</label>
              <select value={dispatchPeon} onChange={e => setDispatchPeon(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
              >
                <option value="">No peon</option>
                {peons.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Remarks</label>
              <textarea value={dispatchRemarks} onChange={e => setDispatchRemarks(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" rows={2} />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-500">Dispatch</button>
              <button type="button" onClick={() => setShowDispatch(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Movement chain */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-700">Audit Trail / Chain of Custody</div>
        {movements.length === 0 ? (
          <p className="p-4 text-gray-400 text-sm">No movements recorded</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {movements.map((m, i) => (
              <div key={m.id} className="px-4 py-3 text-sm relative pl-10">
                <div className={`absolute left-3 top-3 w-3 h-3 rounded-full ${m.status === 'received' ? 'bg-green-400' : m.status === 'in_transit' ? 'bg-orange-400' : 'bg-blue-400'}`} />
                <p className="font-medium">
                  {m.status === 'received' ? '✅ Received by' : m.status === 'in_transit' ? '📦 In transit via' : '📤 Dispatched by'}{' '}
                  <span className="font-semibold">{m.sender?.full_name || 'System'}</span>
                  {m.receiver && <> → <span className="font-semibold">{m.receiver.full_name}</span></>}
                </p>
                <p className="text-xs text-gray-500">{formatTime(m.timestamp)}</p>
                {m.peon && <p className="text-xs text-gray-400">Carrier: {m.peon.full_name}</p>}
                {m.remarks && <p className="text-xs text-gray-400 italic">"{m.remarks}"</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {showScanner && <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />}
    </div>
  )
}