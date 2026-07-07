import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Layout } from '../components/Layout'
import { api } from '../lib/api'

const USD_TO_AUD = 1.55

function fmt(aud) {
  if (aud < 0.01) return '<$0.01'
  return `$${aud.toFixed(2)}`
}

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function WeekBar({ label, costAud, maxAud }) {
  const pct = maxAud > 0 ? (costAud / maxAud) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-20 flex-shrink-0">{label}</span>
      <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gf-teal rounded-full transition-all"
          style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-14 text-right flex-shrink-0">
        {fmt(costAud)}
      </span>
    </div>
  )
}

export function AdminUsage() {
  const navigate = useNavigate()

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-usage'],
    queryFn: () => api.get('/api/admin/usage'),
    staleTime: 5 * 60 * 1000,
  })

  const maxWeekly = data ? Math.max(...data.weeklyTrend.map((w) => w.costAud), 0.001) : 1

  return (
    <Layout>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-800 min-h-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900">💰 AI Usage & Costs</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gf-teal" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error.message}
        </div>
      ) : (
        <div className="space-y-6">

          {/* Top stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="This Week"
              value={fmt(data.thisWeek.costAud)}
              sub={`${data.thisWeek.calls} AI call${data.thisWeek.calls !== 1 ? 's' : ''}`}
            />
            <StatCard
              label="All Time"
              value={fmt(data.allTime.costAud)}
              sub={`${data.allTime.calls} total calls`}
            />
          </div>

          <p className="text-xs text-gray-400 -mt-2">
            Prices in AUD (est.) · Claude Sonnet · Input $4.65/M · Output $23.25/M tokens
          </p>

          {/* Weekly trend */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-900">Weekly Trend</p>
            {data.weeklyTrend.map((w) => (
              <WeekBar key={w.label} label={w.label} costAud={w.costAud} maxAud={maxWeekly} />
            ))}
          </div>

          {/* By type */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">By Observation Type</p>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {[
                  { label: 'Regular Observation', key: 'observation' },
                  { label: 'Work Behind', key: 'work_behind' },
                  { label: 'Daily Summary', key: 'daily_summary' },
                ].map(({ label, key }) => (
                  <tr key={key} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 text-gray-700">{label}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {fmt(data.byType[key]?.costAud || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* By FSM */}
          {data.byFsm?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900">By FSM</p>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {data.byFsm.map((fsm) => (
                    <tr key={fsm.name} className="border-b border-gray-100 last:border-0">
                      <td className="px-4 py-3 text-gray-700">{fsm.name}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {fmt(fsm.costAud)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Projection */}
          <div className="bg-teal-50 border border-gf-teal rounded-xl px-4 py-4">
            <p className="text-sm font-semibold text-gray-900 mb-1">📈 Monthly Projection</p>
            <p className="text-2xl font-bold text-gf-teal">
              {fmt((data.thisWeek.costAud / 7) * 30)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Based on this week's average daily usage
            </p>
          </div>

        </div>
      )}
    </Layout>
  )
}
