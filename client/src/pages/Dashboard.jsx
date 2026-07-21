import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Layout } from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import { SkeletonList } from '../components/Skeleton'

const SCORE_COLORS = {
  red: 'bg-gf-blue',
  yellow: 'bg-yellow-400',
  green: 'bg-green-500',
}

function scoreDot(avg) {
  if (avg === null || avg === undefined) return 'bg-gray-300'
  if (avg < 2.5) return SCORE_COLORS.red
  if (avg < 4.0) return SCORE_COLORS.yellow
  return SCORE_COLORS.green
}

function RSMCard({ rsm, onClick, isNested }) {
  const dot = scoreDot(rsm.avg_score)
  return (
    <button
      onClick={onClick}
      className={`w-full bg-white border border-gray-200 rounded-xl p-4 text-left flex items-center gap-4 hover:border-gray-300 active:bg-gray-50 transition-colors ${
        isNested ? 'ml-6' : ''
      }`}
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
      {rsm.avg_score != null && (
        <div className="text-right flex-shrink-0">
          <span className="text-lg font-bold text-gray-800">{rsm.avg_score.toFixed(1)}</span>
          <span className="text-xs text-gray-400">/5</span>
        </div>
      )}
      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}

function FSMCard({ fsm, expanded, onToggle, onRSMClick }) {
  const rsmCount = fsm.rsms?.length || 0
  
  return (
    <div className="space-y-2">
      <button
        onClick={onToggle}
        className="w-full bg-gray-50 border-2 border-gray-300 rounded-xl p-4 text-left flex items-center gap-4 hover:border-gf-teal transition-colors"
      >
        <svg
          className={`w-5 h-5 text-gray-600 flex-shrink-0 transition-transform ${
            expanded ? 'rotate-90' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900">{fsm.name}</p>
          <p className="text-sm text-gray-600">
            {fsm.state} · {rsmCount} RSM{rsmCount !== 1 ? 's' : ''} · YTD {fsm.ytd_count || 0} · MTD {fsm.mtd_count || 0} · WBO {fsm.wbo_count || 0}
          </p>
        </div>
      </button>
      
      {expanded && rsmCount > 0 && (
        <div className="space-y-2 pl-4">
          {fsm.rsms.map((rsm) => (
            <RSMCard
              key={rsm.id}
              rsm={rsm}
              isNested={true}
              onClick={() => onRSMClick(rsm.id)}
            />
          ))}
        </div>
      )}
      
      {expanded && rsmCount === 0 && (
        <p className="text-gray-500 text-sm pl-10 py-2">No RSMs assigned to this FSM yet.</p>
      )}
    </div>
  )
}

export function Dashboard() {
  const { profile, setProfile } = useAuth()
  const navigate = useNavigate()
  const [expandedFsms, setExpandedFsms] = useState(new Set())
  const [visitingState, setVisitingState] = useState(null)

  // Use React Query for caching
  const { data, isLoading: loading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await api.get('/api/dashboard')
      if (res.profile) setProfile(res.profile)
      return res
    },
  })

  // Visiting state RSMs query
  const { data: visitingData, isLoading: visitingLoading, error: visitingError } = useQuery({
    queryKey: ['rsms-by-state', visitingState],
    queryFn: () => api.get(`/api/rsms/by-state?state=${encodeURIComponent(visitingState)}`),
    enabled: !!visitingState,
  })

  // Calculate total RSM count for admin view
  const totalRsmCount = data?.fsms 
    ? data.fsms.reduce((sum, fsm) => sum + (fsm.rsms?.length || 0), 0)
    : data?.rsms?.length ?? 0

  // States to show in pill buttons — fetched from API (e.g. SA/NT, VIC/TAS)
  const otherStates = data?.otherStates || []

  return (
    <Layout>
      {loading ? (
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>
          <div className="h-12 bg-gray-200 rounded-xl animate-pulse mb-6"></div>
          <SkeletonList count={5} />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error.message || 'Failed to load dashboard'}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{data?.profile?.name}</h1>
              <p className="text-sm text-gray-500">
                {data?.profile?.role === 'admin' ? 'Admin' : data?.profile?.state} · {' '}
                {totalRsmCount} RSM{totalRsmCount !== 1 ? 's' : ''}
                {' '}· YTD {data?.profile?.ytd_count || 0} · MTD {data?.profile?.mtd_count || 0}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/observations/new')}
            className="w-full bg-gf-teal text-white font-semibold py-4 rounded-xl mb-3 hover:bg-gf-dark active:bg-gf-dark transition-colors text-base"
          >
            + Start New Observation
          </button>

          <button
            onClick={() => navigate('/work-behind/new')}
            className="w-full bg-white border-2 border-gf-teal text-gf-teal font-semibold py-4 rounded-xl mb-6 hover:bg-teal-50 active:bg-teal-50 transition-colors text-base"
          >
            + Start Work Behind Observation
          </button>

          <div className="space-y-3">
            {data?.fsms ? (
              // Admin view: grouped by FSM
              data.fsms.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No FSMs yet.</p>
              ) : (
                data.fsms.map((fsm) => (
                  <FSMCard
                    key={fsm.id}
                    fsm={fsm}
                    expanded={expandedFsms.has(fsm.id)}
                    onToggle={() => {
                      const newExpanded = new Set(expandedFsms)
                      if (newExpanded.has(fsm.id)) {
                        newExpanded.delete(fsm.id)
                      } else {
                        newExpanded.add(fsm.id)
                      }
                      setExpandedFsms(newExpanded)
                    }}
                    onRSMClick={(rsmId) => navigate(`/rsms/${rsmId}/history`)}
                  />
                ))
              )
            ) : (
              // Regular FSM view: flat RSM list
              data?.rsms?.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No RSMs assigned yet.</p>
              ) : (
                data?.rsms?.map((rsm) => (
                  <RSMCard
                    key={rsm.id}
                    rsm={rsm}
                    onClick={() => navigate(`/rsms/${rsm.id}/history`)}
                  />
                ))
              )
            )}
          </div>

          {/* Travelling FSM: state pill buttons — only for non-admin FSMs */}
          {!data?.fsms && data?.profile?.state && (
            <div className="mt-8">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Travelling to another state?</p>
              <div className="flex flex-wrap gap-2">
                {otherStates.map((s) => (
                  <button
                    key={s}
                    onClick={() => setVisitingState(visitingState === s ? null : s)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                      visitingState === s
                        ? 'bg-gf-teal text-white border-gf-teal'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-gf-teal hover:text-gf-teal'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {visitingState && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-bold text-gf-teal">✈️ Travelling to {visitingState}</span>
                    <span className="text-xs text-gray-400">· your sessions only</span>
                  </div>
                  {visitingLoading ? (
                    <SkeletonList count={3} />
                  ) : visitingError ? (
                    <p className="text-red-500 text-sm py-4">Error: {visitingError.message}</p>
                  ) : visitingData?.rsms?.length === 0 ? (
                    <p className="text-gray-500 text-sm py-4">No RSMs found in {visitingState}.</p>
                  ) : (
                    <div className="space-y-2">
                      {visitingData?.rsms?.map((rsm) => (
                        <RSMCard
                          key={rsm.id}
                          rsm={rsm}
                          onClick={() => navigate(`/rsms/${rsm.id}/history`, { state: { visiting: true, preselectedRsm: rsm } })}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ROGER branding footer */}
          <div className="mt-12 mb-6 flex justify-center">
            <img 
              src="/roger-logo.jpg" 
              alt="Powered by ROGER" 
              className="h-20 opacity-60 hover:opacity-100 transition-opacity"
            />
          </div>
        </>
      )}
    </Layout>
  )
}
