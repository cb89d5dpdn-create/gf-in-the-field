import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { api } from '../lib/api'

function StatCard({ label, value }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value ?? '—'}</p>
    </div>
  )
}

function FSMRow({ fsm, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-4 text-left hover:border-gray-300 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-900">{fsm.name}</p>
          <p className="text-sm text-gray-500">{fsm.state} · {fsm.rsm_count} RSMs · {fsm.obs_count} observations</p>
          {fsm.last_activity && (
            <p className="text-xs text-gray-400 mt-0.5">
              Last active: {new Date(fsm.last_activity).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  )
}

function FSMDetail({ fsmId, onBack }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/api/admin/fsms/${fsmId}`).then(setData).finally(() => setLoading(false))
  }, [fsmId])

  if (loading) return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600" /></div>

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm text-red-600 hover:underline min-h-0">&larr; Back</button>
      <h2 className="text-lg font-bold text-gray-900">{data?.fsm?.name} — {data?.fsm?.state}</h2>
      <div className="space-y-2">
        {data?.rsms?.map((rsm) => (
          <div key={rsm.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3">
            <p className="font-semibold text-gray-900">{rsm.name}</p>
            <p className="text-sm text-gray-500">{rsm.obs_count} observation{rsm.obs_count !== 1 ? 's' : ''}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Admin() {
  const navigate = useNavigate()
  const [overview, setOverview] = useState(null)
  const [fsms, setFSMs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFSM, setSelectedFSM] = useState(null)

  useEffect(() => {
    Promise.all([api.get('/api/admin/overview'), api.get('/api/admin/fsms')])
      .then(([ov, fsmData]) => {
        setOverview(ov)
        setFSMs(fsmData.fsms || [])
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <Layout>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-800 min-h-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900">Admin Overview</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
        </div>
      ) : selectedFSM ? (
        <FSMDetail fsmId={selectedFSM} onBack={() => setSelectedFSM(null)} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <StatCard label="Total Visits" value={overview?.total_visits} />
            <StatCard label="Avg Score" value={overview?.avg_score != null ? Number(overview.avg_score).toFixed(1) : null} />
            <StatCard label="Most Active FSM" value={overview?.most_active_fsm} />
            <StatCard label="Total RSMs" value={overview?.total_rsms} />
          </div>

          <h2 className="text-base font-bold text-gray-900 mb-3">Field Sales Managers</h2>
          <div className="space-y-3">
            {fsms.map((fsm) => (
              <FSMRow key={fsm.id} fsm={fsm} onClick={() => setSelectedFSM(fsm.id)} />
            ))}
          </div>
        </>
      )}
    </Layout>
  )
}
