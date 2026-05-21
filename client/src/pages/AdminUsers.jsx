import { useEffect, useState } from 'react'
import { Layout } from '../components/Layout'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

export function AdminUsers() {
  const [tab, setTab] = useState('fsm') // 'fsm' or 'rsm'
  const [fsms, setFsms] = useState([])
  const [rsms, setRsms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await api.get('/api/admin/users')
      setFsms(data.fsms || [])
      setRsms(data.rsms || [])
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Manage Users</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
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
            + Add {tab === 'fsm' ? 'FSM' : 'RSM'}
          </button>

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
                        onClick={() => {
                          if (confirm(`Delete ${fsm.name}?`)) {
                            // TODO: implement delete
                            toast.success('Delete coming soon')
                          }
                        }}
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
                        onClick={() => {
                          if (confirm(`Delete ${rsm.name}?`)) {
                            // TODO: implement delete
                            toast.success('Delete coming soon')
                          }
                        }}
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

      {/* Add Modal - TODO: implement full form */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Add {tab === 'fsm' ? 'FSM' : 'RSM'}
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Coming soon! This will allow you to add new {tab === 'fsm' ? 'FSMs' : 'RSMs'}.
            </p>
            <button
              onClick={() => setShowAddModal(false)}
              className="w-full bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Layout>
  )
}
