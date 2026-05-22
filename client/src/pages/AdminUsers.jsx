import { useEffect, useState } from 'react'
import { Layout } from '../components/Layout'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

export function AdminUsers() {
  const [tab, setTab] = useState('admin') // 'admin', 'fsm', or 'rsm'
  const [admins, setAdmins] = useState([])
  const [fsms, setFsms] = useState([])
  const [rsms, setRsms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [adding, setAdding] = useState(false)

  // Admin form state
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [showAdminPassword, setShowAdminPassword] = useState(false)

  // FSM form state
  const [fsmName, setFsmName] = useState('')
  const [fsmEmail, setFsmEmail] = useState('')
  const [fsmState, setFsmState] = useState('NSW')
  const [fsmPassword, setFsmPassword] = useState('')
  const [showFsmPassword, setShowFsmPassword] = useState(false)

  // RSM form state
  const [rsmName, setRsmName] = useState('')
  const [rsmEmail, setRsmEmail] = useState('')
  const [rsmState, setRsmState] = useState('NSW')
  const [rsmFsmId, setRsmFsmId] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await api.get('/api/admin/users')
      // Separate admins from FSMs
      const allUsers = data.fsms || []
      setAdmins(allUsers.filter(u => u.role === 'admin'))
      setFsms(allUsers.filter(u => u.role === 'fsm'))
      setRsms(data.rsms || [])
      const actualFsms = (data.fsms || []).filter(u => u.role === 'fsm')
      if (actualFsms.length && !rsmFsmId) {
        setRsmFsmId(actualFsms[0].id)
      }
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddAdmin = async (e) => {
    e.preventDefault()
    if (adminPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setAdding(true)
    try {
      await api.post('/api/admin/admins', {
        name: adminName,
        email: adminEmail,
        password: adminPassword,
      })
      toast.success('Admin added successfully')
      setShowAddModal(false)
      setAdminName('')
      setAdminEmail('')
      setAdminPassword('')
      loadData()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setAdding(false)
    }
  }

  const handleAddFSM = async (e) => {
    e.preventDefault()
    if (fsmPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setAdding(true)
    try {
      await api.post('/api/admin/fsms', {
        name: fsmName,
        email: fsmEmail,
        state: fsmState,
        password: fsmPassword,
      })
      toast.success('FSM added successfully')
      setShowAddModal(false)
      setFsmName('')
      setFsmEmail('')
      setFsmState('NSW')
      setFsmPassword('')
      loadData()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setAdding(false)
    }
  }

  const handleAddRSM = async (e) => {
    e.preventDefault()
    setAdding(true)
    try {
      await api.post('/api/admin/rsms', {
        name: rsmName,
        email: rsmEmail || null,
        state: rsmState,
        fsm_id: rsmFsmId,
      })
      toast.success('RSM added successfully')
      setShowAddModal(false)
      setRsmName('')
      setRsmEmail('')
      setRsmState('NSW')
      loadData()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteAdmin = async (id, name) => {
    if (!confirm(`Delete admin ${name}? This will also delete their auth account.`)) return
    try {
      await api.delete(`/api/admin/admins/${id}`)
      toast.success('Admin deleted')
      loadData()
    } catch (e) {
      toast.error(e.message)
    }
  }

  const handleDeleteFSM = async (id, name) => {
    if (!confirm(`Delete ${name}? This will also delete their auth account.`)) return
    try {
      await api.delete(`/api/admin/fsms/${id}`)
      toast.success('FSM deleted')
      loadData()
    } catch (e) {
      toast.error(e.message)
    }
  }

  const handleDeleteRSM = async (id, name) => {
    if (!confirm(`Delete ${name}?`)) return
    try {
      await api.delete(`/api/admin/rsms/${id}`)
      toast.success('RSM deleted')
      loadData()
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <Layout>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Manage Users</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setTab('admin')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            tab === 'admin' 
              ? 'border-gf-teal text-gf-teal' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Admins
        </button>
        <button
          onClick={() => setTab('fsm')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            tab === 'fsm' 
              ? 'border-gf-teal text-gf-teal' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          FSMs
        </button>
        <button
          onClick={() => setTab('rsm')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            tab === 'rsm' 
              ? 'border-gf-teal text-gf-teal' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          RSMs
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gf-teal" />
        </div>
      ) : (
        <>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full bg-gf-teal text-white font-semibold py-3 rounded-xl mb-6 hover:bg-gf-dark transition-colors"
          >
            + Add {tab === 'admin' ? 'Admin' : tab === 'fsm' ? 'FSM' : 'RSM'}
          </button>

          {tab === 'admin' && (
            <div className="space-y-3">
              {admins.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No admins yet.</p>
              ) : (
                admins.map((admin) => (
                  <div
                    key={admin.id}
                    className="bg-white border border-gray-200 rounded-xl px-4 py-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{admin.name}</p>
                        <p className="text-sm text-gray-500">{admin.email}</p>
                        <p className="text-xs text-gray-400 mt-1">Admin</p>
                      </div>
                      <button
                        onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                        className="text-red-600 text-sm hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'fsm' && (
            <div className="space-y-3">
              {fsms.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No FSMs yet.</p>
              ) : (
                fsms.map((fsm) => (
                  <div
                    key={fsm.id}
                    className="bg-white border border-gray-200 rounded-xl px-4 py-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{fsm.name}</p>
                        <p className="text-sm text-gray-500">{fsm.email}</p>
                        <p className="text-xs text-gray-400 mt-1">{fsm.state}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteFSM(fsm.id, fsm.name)}
                        className="text-red-600 text-sm hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'rsm' && (
            <div className="space-y-3">
              {rsms.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No RSMs yet.</p>
              ) : (
                rsms.map((rsm) => (
                  <div
                    key={rsm.id}
                    className="bg-white border border-gray-200 rounded-xl px-4 py-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{rsm.name}</p>
                        <p className="text-sm text-gray-500">{rsm.email || 'No email'}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {rsm.state} · Managed by {rsm.fsm_name || 'Unassigned'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteRSM(rsm.id, rsm.name)}
                        className="text-red-600 text-sm hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Add {tab === 'admin' ? 'Admin' : tab === 'fsm' ? 'FSM' : 'RSM'}
            </h2>

            {tab === 'admin' ? (
              <form onSubmit={handleAddAdmin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gf-teal"
                    placeholder="John Smith"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gf-teal"
                    placeholder="john@goodmanfielder.com.au"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Password
                  </label>
                  <div className="relative">
                    <input
                      type={showAdminPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-gf-teal"
                      placeholder="Min 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showAdminPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adding}
                    className="flex-1 bg-gf-teal text-white font-semibold py-3 rounded-lg hover:bg-gf-dark disabled:opacity-50 transition-colors"
                  >
                    {adding ? 'Adding...' : 'Add Admin'}
                  </button>
                </div>
              </form>
            ) : tab === 'fsm' ? (
              <form onSubmit={handleAddFSM} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fsmName}
                    onChange={(e) => setFsmName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gf-teal"
                    placeholder="John Smith"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={fsmEmail}
                    onChange={(e) => setFsmEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gf-teal"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <select
                    value={fsmState}
                    onChange={(e) => setFsmState(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gf-teal"
                  >
                    <option value="NSW">NSW</option>
                    <option value="VIC/TAS">VIC/TAS</option>
                    <option value="QLD">QLD</option>
                    <option value="WA">WA</option>
                    <option value="SA/NT">SA/NT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Password
                  </label>
                  <div className="relative">
                    <input
                      type={showFsmPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={fsmPassword}
                      onChange={(e) => setFsmPassword(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-gf-teal"
                      placeholder="Min 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowFsmPassword(!showFsmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showFsmPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adding}
                    className="flex-1 bg-gf-teal text-white font-semibold py-3 rounded-lg hover:bg-gf-dark disabled:opacity-50 transition-colors"
                  >
                    {adding ? 'Adding...' : 'Add FSM'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddRSM} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={rsmName}
                    onChange={(e) => setRsmName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gf-teal"
                    placeholder="Jane Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="email"
                    value={rsmEmail}
                    onChange={(e) => setRsmEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gf-teal"
                    placeholder="jane@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <select
                    value={rsmState}
                    onChange={(e) => setRsmState(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gf-teal"
                  >
                    <option value="NSW">NSW</option>
                    <option value="VIC/TAS">VIC/TAS</option>
                    <option value="QLD">QLD</option>
                    <option value="WA">WA</option>
                    <option value="SA/NT">SA/NT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign to FSM
                  </label>
                  <select
                    value={rsmFsmId}
                    onChange={(e) => setRsmFsmId(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gf-teal"
                  >
                    {fsms.map((fsm) => (
                      <option key={fsm.id} value={fsm.id}>
                        {fsm.name} ({fsm.state})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adding}
                    className="flex-1 bg-gf-teal text-white font-semibold py-3 rounded-lg hover:bg-gf-dark disabled:opacity-50 transition-colors"
                  >
                    {adding ? 'Adding...' : 'Add RSM'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </Layout>
  )
}
