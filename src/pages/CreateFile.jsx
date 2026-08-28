import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, getFileNumber } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function CreateFile() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [department, setDepartment] = useState('Admin')
  const [priority, setPriority] = useState('normal')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setCreating(true)
    setError('')

    const fileNumber = getFileNumber(department)

    const { data, error: err } = await supabase.from('files').insert({
      file_number: fileNumber,
      title,
      department,
      priority,
      current_holder_id: profile.id,
      created_by: profile.id,
    }).select().single()

    if (err) {
      setError(err.message)
      setCreating(false)
      return
    }

    // Log initial creation as a movement
    await supabase.from('file_movements').insert({
      file_id: data.id,
      from_officer_id: null,
      to_officer_id: profile.id,
      status: 'received',
      remarks: 'File created',
    })

    navigate(`/file/${data.id}`)
  }

  const departments = ['Biotech Incubation', 'Admin', 'Finance', 'Legal', 'R&D', 'HR']

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Create New File</h2>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">File Title *</label>
          <input
            type="text" required value={title} onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Grant Application - Phase 2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
          <select value={department} onChange={e => setDepartment(e.target.value)} required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          >
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <div className="flex gap-3">
            {['normal', 'urgent', 'immediate'].map(p => (
              <label key={p} className={`flex-1 cursor-pointer rounded-lg border-2 px-3 py-2 text-center text-sm font-medium ${
                priority === p ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'
              }`}>
                <input type="radio" name="priority" value={p} checked={priority === p} onChange={e => setPriority(e.target.value)} className="hidden" />
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </label>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-500">
          <p>Auto-generated file number: <span className="font-mono text-blue-800">{getFileNumber(department)}</span></p>
          <p className="text-xs mt-1">A QR code will be generated after creation.</p>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button type="submit" disabled={creating}
          className="w-full bg-blue-800 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {creating ? 'Creating...' : 'Create File'}
        </button>
      </form>
    </div>
  )
}