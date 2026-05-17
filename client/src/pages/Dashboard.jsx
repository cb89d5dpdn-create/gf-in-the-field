import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'

const SCORE_COLORS = {
  red: 'bg-red-500',
  yellow: 'bg-yellow-400',
  green: 'bg-green-500',
}

function scoreDot(avg) {
  if (avg === null || avg === undefined) return 'bg-gray-300'
  if (avg < 2.5) return SCORE_COLORS.red
  if (avg < 4.0) return SCORE_COLORS.yellow
  return SCORE_COLORS.green
}

function RSMCard({ rsm, onClick }) {
  const dot = scoreDot(rsm.last_avg_score)
  return (
    <button
      onClick={onClick}
      className="w-full bg-white border border-gray-200 rounded-xl p-4 text-left flex items-center gap-4 hover:border-gray-300 active:bg-gray-50 transition-colors"
    >
      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${dot}`} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">{rsm.name}</p>
        <p className="text-sm text-gray-500 mt-0.5">
          {rsm.total_visits === 0
            ? 'No observations yet'
            : `${rsm.total_visits} visit${rsm.total_visits > 1 ? 's' : ''} · Last: ${rsm.last_visit_date ? new Date(rsm.last_visit_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : '—'}`}
        </p>
      </div>
      {rsm.last_avg_score != null && (
        <div className="text-right flex-shrink-0">
          <span className="text-lg font-bold text-gray-800">{rsm.last_avg_score.toFixed(1)}</span>
          <span className="text-xs text-gray-400">/5</span>
        </div>
      )}
      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}

export function Dashboard() {
  const { profile, setProfile } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/api/dashboard')
      .then((res) => {
        setData(res)
        if (res.profile) setProfile(res.profile)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [setProfile])

  return (
    <Layout>
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{data?.profile?.name}</h1>
              <p className="text-sm text-gray-500">{data?.profile?.state} · {data?.rsms?.length ?? 0} RSMs</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/observations/new')}
            className="w-full bg-red-600 text-white font-semibold py-4 rounded-xl mb-6 hover:bg-red-700 active:bg-red-800 transition-colors text-base"
          >
            + Start New Observation
          </button>

          <div className="space-y-3">
            {data?.rsms?.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No RSMs assigned yet.</p>
            ) : (
              data?.rsms?.map((rsm) => (
                <RSMCard
                  key={rsm.id}
                  rsm={rsm}
                  onClick={() => navigate(`/rsms/${rsm.id}/history`)}
                />
              ))
            )}
          </div>
        </>
      )}
    </Layout>
  )
}
