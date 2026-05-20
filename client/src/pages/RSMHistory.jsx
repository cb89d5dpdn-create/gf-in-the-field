import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { api } from '../lib/api'

const SCORE_LABELS = {
  1: 'Needs Dev',
  2: 'Developing',
  3: 'Competent',
  4: 'Proficient',
  5: 'Expert',
}

function ObservationDetail({ obs }) {
  const avg = obs.scores?.length
    ? (obs.scores.reduce((sum, s) => sum + s.score, 0) / obs.scores.length).toFixed(1)
    : null

  const grouped = obs.scores?.reduce((acc, s) => {
    if (!acc[s.group_name]) acc[s.group_name] = []
    acc[s.group_name].push(s)
    return acc
  }, {}) || {}

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{new Date(obs.visit_date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          {obs.location && <p className="text-sm text-gray-600">{obs.location}</p>}
        </div>
        {avg && (
          <div className="text-right">
            <span className="text-2xl font-bold text-gray-900">{avg}</span>
            <span className="text-sm text-gray-400">/5</span>
          </div>
        )}
      </div>

      {Object.entries(grouped).map(([group, scores]) => (
        <div key={group}>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{group}</p>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {scores.map((s) => (
                  <tr key={s.area_id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 text-gray-700">{s.area_label}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-gray-900">{s.score}/5</span>
                      <span className="ml-1 text-xs text-gray-400">{SCORE_LABELS[s.score]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {(obs.edited_summary || obs.ai_summary) && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Coaching Summary</p>
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-4 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {obs.edited_summary || obs.ai_summary}
          </div>
        </div>
      )}
    </div>
  )
}

export function RSMHistory() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedObs, setSelectedObs] = useState(null)

  useEffect(() => {
    api.get(`/api/rsms/${id}/history`)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <Layout>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/')}
          className="text-gray-500 hover:text-gray-800 min-h-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900">{data?.rsm?.name || 'RSM History'}</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gf-teal" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
      ) : selectedObs ? (
        <>
          <button
            onClick={() => setSelectedObs(null)}
            className="text-sm text-gf-teal hover:underline mb-4 min-h-0"
          >
            &larr; Back to history
          </button>
          <ObservationDetail obs={selectedObs} />
        </>
      ) : (
        <div className="space-y-3">
          {data?.observations?.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No observations yet.</p>
          ) : (
            data?.observations?.map((obs) => {
              const avg = obs.avg_score
              return (
                <button
                  key={obs.id}
                  onClick={() => setSelectedObs(obs)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-4 text-left hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {new Date(obs.visit_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">{obs.location || 'Location not recorded'}</p>
                    </div>
                    <div className="text-right">
                      {avg != null ? (
                        <>
                          <span className="text-lg font-bold text-gray-900">{Number(avg).toFixed(1)}</span>
                          <span className="text-xs text-gray-400">/5</span>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">Draft</span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      )}
    </Layout>
  )
}
