import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, getFileNumber, DEPARTMENTS } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function CreateFile() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [department, setDepartment] = useState('Admin')
  const [fileNumber, setFileNumber] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [remarks, setRemarks] = useState('')
  const [priority, setPriority] = useState('normal')
  const [currentHolderId, setCurrentHolderId] = useState('')
  const [users, setUsers] = useState([])
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  // Initialize file number and holder
  useEffect(() => {
    setFileNumber(getFileNumber(department))
  }, [department])

  useEffect(() => {
    if (profile?.id && !currentHolderId) {
      setCurrentHolderId(profile.id)
    }
    loadUsers()
  }, [profile])

  async function loadUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, role, department')
      .order('full_name', { ascending: true })
    if (data) setUsers(data)
  }

  function handleRegenerateNumber() {
    setFileNumber(getFileNumber(department))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!fileNumber.trim()) {
      setError('File number is required.')
      return
    }
    if (!title.trim()) {
      setError('File title is required.')
      return
    }

    setCreating(true)
    setError('')

    const holderId = currentHolderId || profile.id

    const insertPayload = {
      file_number: fileNumber.trim(),
      title: title.trim(),
      department,
      description: description.trim() || null,
      remarks: remarks.trim() || null,
      priority,
      current_holder_id: holderId,
      created_by: profile.id,
      status: 'active',
    }

    const { data, error: err } = await supabase
      .from('files')
      .insert(insertPayload)
      .select()
      .single()

    if (err) {
      setError(err.message)
      setCreating(false)
      return
    }

    // Log initial creation as a movement
    await supabase.from('file_movements').insert({
      file_id: data.id,
      from_officer_id: null,
      to_officer_id: holderId,
      status: 'received',
      remarks: remarks.trim() ? `File created. Initial remarks: ${remarks.trim()}` : 'File created in GBP system',
    })

    navigate(`/file/${data.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Create New File</h2>
          <p className="text-xs text-gray-500">Register a new physical file into Guwahati Biotech Park FTMS</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/files')}
          className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
        >
          ← Back to Files
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        {/* File Number */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-semibold text-gray-700">
              File Number <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={handleRegenerateNumber}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              title="Generate new standard file number"
            >
              🔄 Auto-Generate
            </button>
          </div>
          <input
            type="text"
            required
            value={fileNumber}
            onChange={e => setFileNumber(e.target.value)}
            className="w-full px-3.5 py-2 border border-gray-300 rounded-lg font-mono text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., GBP/2026/FIN/4082"
          />
          <p className="text-xs text-gray-400 mt-1">Unique physical identifier or auto-generated format.</p>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            File Subject / Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Grant Sanction Order - DBT Project Phase 2"
          />
        </div>

        {/* Department & Holder */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Department <span className="text-red-500">*</span>
            </label>
            <select
              value={department}
              onChange={e => setDepartment(e.target.value)}
              required
              className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {DEPARTMENTS.map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Initial Custodian / Holder</label>
            <select
              value={currentHolderId}
              onChange={e => setCurrentHolderId(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.full_name} {u.department ? `(${u.department})` : ''} {u.id === profile?.id ? '— (You)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Description / Summary</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Detailed description, background, key dates or contents of this physical file..."
          />
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Initial Remarks / Notes</label>
          <textarea
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            rows={2}
            className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Any immediate instructions, storage location (e.g. Cabinet A, Shelf 2), or handling notes..."
          />
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Priority Level</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'normal', label: 'Normal', color: 'border-blue-500 bg-blue-50 text-blue-800' },
              { id: 'urgent', label: 'Urgent', color: 'border-yellow-500 bg-yellow-50 text-yellow-800' },
              { id: 'immediate', label: 'Immediate', color: 'border-red-500 bg-red-50 text-red-800' },
            ].map(p => (
              <label
                key={p.id}
                className={`cursor-pointer rounded-lg border-2 px-3 py-2 text-center text-sm font-medium transition ${
                  priority === p.id ? p.color : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="priority"
                  value={p.id}
                  checked={priority === p.id}
                  onChange={e => setPriority(e.target.value)}
                  className="hidden"
                />
                {p.label}
              </label>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="pt-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={creating}
            className="flex-1 bg-blue-800 text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition shadow-sm flex items-center justify-center gap-2"
          >
            {creating ? 'Creating File...' : '💾 Create & Generate QR Code'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/files')}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}