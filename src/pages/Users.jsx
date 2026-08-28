import { useEffect, useState } from 'react'
import { supabase, ROLE_LABELS, DEPARTMENTS } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function Users() {
  const { signUp } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  // Edit role modal / inline
  const [editingUser, setEditingUser] = useState(null)
  const [editRole, setEditRole] = useState('')
  const [editDept, setEditDept] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  // Add officer / user modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('officer')
  const [newDept, setNewDept] = useState('Admin')
  const [newPhone, setNewPhone] = useState('')
  const [addingUser, setAddingUser] = useState(false)
  const [addError, setAddError] = useState('')
  const [addSuccess, setAddSuccess] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true })
    if (data) setUsers(data)
    setLoading(false)
  }

  async function handleAddOfficer(e) {
    e.preventDefault()
    setAddError('')
    setAddSuccess('')

    if (!newName.trim() || !newEmail.trim() || !newPassword) {
      setAddError('Name, email, and password are required.')
      return
    }

    setAddingUser(true)
    try {
      await signUp(
        newEmail.trim(),
        newPassword,
        newName.trim(),
        newRole,
        newDept,
        newPhone.trim()
      )
      setAddSuccess(`Officer/User "${newName}" registered successfully!`)
      setNewName('')
      setNewEmail('')
      setNewPassword('')
      setNewPhone('')
      setNewRole('officer')
      setTimeout(() => {
        setShowAddModal(false)
        setAddSuccess('')
        loadUsers()
      }, 1500)
    } catch (err) {
      setAddError(err.message || 'Failed to create user.')
    } finally {
      setAddingUser(false)
    }
  }

  async function handleUpdateProfile(e) {
    e.preventDefault()
    if (!editingUser) return
    setSavingEdit(true)
    const { error } = await supabase
      .from('profiles')
      .update({ role: editRole, department: editDept })
      .eq('id', editingUser.id)

    if (error) {
      alert('Error updating user: ' + error.message)
    } else {
      setEditingUser(null)
      loadUsers()
    }
    setSavingEdit(false)
  }

  async function deleteUser(userId, name) {
    if (!confirm(`Are you sure you want to remove ${name || 'this user'} from the system?`)) return
    const { error } = await supabase.from('profiles').delete().eq('id', userId)
    if (error) {
      alert('Could not remove user: ' + error.message)
    } else {
      loadUsers()
    }
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.department?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">User & Officer Directory</h2>
          <p className="text-xs text-gray-500">
            Manage system users, register officers, and assign roles for Guwahati Biotech Park
          </p>
        </div>
        <button
          onClick={() => {
            setShowAddModal(true)
            setAddError('')
            setAddSuccess('')
          }}
          className="bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-2 shadow-sm shrink-0 self-start sm:self-auto"
        >
          <span>➕</span> Add Officer / User
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex-1 w-full relative">
          <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search by name, department, phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Users' },
            { id: 'officer', label: 'Officers' },
            { id: 'admin', label: 'Admins' },
            { id: 'peon', label: 'Dispatch Staff' },
            { id: 'viewer', label: 'Viewers' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                roleFilter === tab.id
                  ? 'bg-blue-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users List / Table */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100 text-gray-400">
          Loading directory...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500 space-y-2">
          <p className="text-3xl">👥</p>
          <p className="font-semibold text-gray-700">No users found</p>
          <p className="text-xs text-gray-400">Try adjusting your search query or role filter.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">User</th>
                  <th className="text-left px-4 py-3 font-semibold">Department</th>
                  <th className="text-left px-4 py-3 font-semibold">Role</th>
                  <th className="text-left px-4 py-3 font-semibold">Contact</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/80 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-sm shrink-0">
                          {u.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{u.full_name}</p>
                          <p className="text-xs text-gray-400 font-mono">{u.id?.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-medium">
                      {u.department ? (
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-700">
                          {u.department}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Not assigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-semibold ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : u.role === 'officer'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : u.role === 'peon'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}
                      >
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {u.phone ? <span>📞 {u.phone}</span> : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-1.5 justify-end">
                        <button
                          onClick={() => {
                            setEditingUser(u)
                            setEditRole(u.role || 'viewer')
                            setEditDept(u.department || 'Admin')
                          }}
                          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded font-medium transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteUser(u.id, u.full_name)}
                          className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1 rounded font-medium transition"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Officer / User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Add New Officer / User</h3>
                <p className="text-xs text-gray-500">Register account credentials & assign role</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddOfficer} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g., Dr. Ramesh Sharma"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="ramesh@guwahatibiotechpark.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewPassword(`GBP@${Math.floor(1000 + Math.random() * 9000)}!`)}
                    className="text-[11px] text-blue-600 hover:underline"
                  >
                    Generate Random
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter strong password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Role</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="officer">Officer</option>
                    <option value="admin">Administrator</option>
                    <option value="peon">Dispatch / Staff</option>
                    <option value="viewer">Viewer / Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Department</label>
                  <select
                    value={newDept}
                    onChange={e => setNewDept(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phone (Optional)</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {addError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                  {addError}
                </div>
              )}
              {addSuccess && (
                <div className="p-2.5 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs font-semibold">
                  {addSuccess}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={addingUser}
                  className="flex-1 bg-blue-800 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
                >
                  {addingUser ? 'Creating Officer...' : 'Create Officer'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role & Department Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-800">Edit User Details</h3>
                <p className="text-xs text-gray-500">{editingUser.full_name}</p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Role</label>
                <select
                  value={editRole}
                  onChange={e => setEditRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {Object.entries(ROLE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Department</label>
                <select
                  value={editDept}
                  onChange={e => setEditDept(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex-1 bg-blue-800 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}