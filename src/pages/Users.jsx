import { useEffect, useState } from 'react'
import { supabase, ROLE_LABELS } from '../lib/supabase'

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editRole, setEditRole] = useState('')

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  async function updateRole(userId, role) {
    await supabase.from('profiles').update({ role }).eq('id', userId)
    setEditingId(null)
    loadUsers()
  }

  async function deleteUser(userId) {
    if (!confirm('Remove this user from the system?')) return
    await supabase.from('profiles').delete().eq('id', userId)
    // Note: auth.users deletion requires admin-level access
    loadUsers()
  }

  if (loading) return <div className="text-center py-8 text-gray-400">Loading...</div>

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">User Management</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Department</th>
              <th className="text-left px-4 py-3 font-medium">Role</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{u.full_name}</td>
                <td className="px-4 py-3 text-gray-500">{u.id?.substring(0, 8)}...</td>
                <td className="px-4 py-3 text-gray-500">{u.department || '-'}</td>
                <td className="px-4 py-3">
                  {editingId === u.id ? (
                    <select value={editRole} onChange={e => setEditRole(e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-xs outline-none"
                    >
                      {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  ) : (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      u.role === 'officer' ? 'bg-blue-100 text-blue-700' :
                      u.role === 'peon' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {editingId === u.id ? (
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => updateRole(u.id, editRole)} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-xs bg-gray-200 px-2 py-1 rounded">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => { setEditingId(u.id); setEditRole(u.role) }} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200">
                        Edit Role
                      </button>
                      <button onClick={() => deleteUser(u.id)} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100">
                        Remove
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}