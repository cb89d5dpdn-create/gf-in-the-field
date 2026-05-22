import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Layout } from '../components/Layout'
import { api } from '../lib/api'
import toast from 'react-hot-toast'
import { SkeletonList } from '../components/Skeleton'

const SCORE_LABELS = {
  1: 'Needs Dev',
  2: 'Developing',
  3: 'Competent',
  4: 'Proficient',
  5: 'Expert',
}

function ObservationDetail({ obs, onSent }) {
  const [summary, setSummary] = useState(obs.edited_summary || obs.ai_summary || '')
  const [sending, setSending] = useState(false)
  const isEditable = obs.status === 'generated'

  const avg = obs.scores?.length
    ? (obs.scores.reduce((sum, s) => sum + s.score, 0) / obs.scores.length).toFixed(1)
    : null

  const grouped = obs.scores?.reduce((acc, s) => {
    if (!acc[s.group_name]) acc[s.group_name] = []
    acc[s.group_name].push(s)
    return acc
  }, {}) || {}

  const handleSend = async () => {
    setSending(true)
    try {
      await api.post(`/api/observations/${obs.id}/send`, {
        edited_summary: summary,
      })
      toast.success('Coaching summary sent to your email!')
      if (onSent) onSent()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4 pb-24">
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
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Coaching Summary {isEditable && <span className="font-normal text-gray-400">(edit before sending)</span>}
          </p>
          {isEditable ? (
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={12}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gf-teal resize-none"
            />
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-4 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {obs.edited_summary || obs.ai_summary}
            </div>
          )}
        </div>
      )}

      {isEditable && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handleSend}
              disabled={sending || !summary.trim()}
              className="w-full bg-gf-teal text-white font-semibold py-4 rounded-xl hover:bg-gf-dark disabled:opacity-50 transition-colors text-base"
            >
              {sending ? 'Sending...' : 'Send to My Email'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function SwipeableObservation({ obs, isDraft, onDelete, onClick }) {
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const touchStart = useRef(0)
  const containerRef = useRef(null)

  const handleTouchStart = (e) => {
    touchStart.current = e.touches[0].clientX
    setIsSwiping(true)
  }

  const handleTouchMove = (e) => {
    if (!isSwiping) return
    const currentTouch = e.touches[0].clientX
    const diff = touchStart.current - currentTouch
    
    // Only allow left swipe (positive diff), cap at 100px
    if (diff > 0) {
      setSwipeOffset(Math.min(diff, 100))
    } else {
      setSwipeOffset(0)
    }
  }

  const handleTouchEnd = () => {
    setIsSwiping(false)
    
    // If swiped more than 50px, lock to 80px and show delete
    if (swipeOffset > 50) {
      setSwipeOffset(80)
      setShowDeleteConfirm(true)
    } else {
      setSwipeOffset(0)
      setShowDeleteConfirm(false)
    }
  }

  const handleDelete = () => {
    if (confirm(`Delete this ${isDraft ? 'draft' : 'observation'}?`)) {
      onDelete(obs.id)
      setSwipeOffset(0)
      setShowDeleteConfirm(false)
    }
  }

  const handleClick = () => {
    if (swipeOffset > 0) {
      // Reset swipe if already swiped
      setSwipeOffset(0)
      setShowDeleteConfirm(false)
    } else {
      onClick()
    }
  }

  const avg = obs.avg_score

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      style={{ touchAction: 'pan-y' }}
    >
      {/* Delete button background */}
      <div className="absolute inset-0 bg-red-500 flex items-center justify-end px-6">
        <button
          onClick={handleDelete}
          className="text-white font-semibold text-sm"
        >
          Delete
        </button>
      </div>

      {/* Swipeable content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
        style={{
          transform: `translateX(-${swipeOffset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s ease'
        }}
        className={`border rounded-xl px-4 py-4 cursor-pointer ${
          isDraft
            ? 'bg-gray-50 border-gray-300 border-dashed'
            : 'bg-white border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={`font-semibold ${
              isDraft ? 'text-gray-600' : 'text-gray-900'
            }`}>
              {new Date(obs.visit_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">{obs.location || 'Location not recorded'}</p>
          </div>
          <div className="text-right flex flex-col items-end gap-1">
            {isDraft && (
              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full font-medium">📋 Draft</span>
            )}
            {obs.status === 'generated' && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">Ready to send</span>
            )}
            {!isDraft && avg != null && (
              <div>
                <span className="text-lg font-bold text-gray-900">{Number(avg).toFixed(1)}</span>
                <span className="text-xs text-gray-400">/5</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function RSMHistory() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedObs, setSelectedObs] = useState(null)

  const { data, isLoading: loading, error } = useQuery({
    queryKey: ['rsm-history', id],
    queryFn: () => api.get(`/api/rsms/${id}/history`),
  })

  const refreshHistory = () => {
    queryClient.invalidateQueries({ queryKey: ['rsm-history', id] })
  }

  const handleSent = () => {
    setSelectedObs(null)
    refreshHistory()
  }

  const handleDelete = async (obsId) => {
    try {
      await api.delete(`/api/observations/${obsId}`)
      toast.success('Observation deleted')
      refreshHistory()
    } catch (e) {
      toast.error(e.message)
    }
  }

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
        <SkeletonList count={5} />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error.message || 'Failed to load history'}</div>
      ) : selectedObs ? (
        <>
          <button
            onClick={() => setSelectedObs(null)}
            className="text-sm text-gf-teal hover:underline mb-4 min-h-0"
          >
            &larr; Back to history
          </button>
          <ObservationDetail obs={selectedObs} onSent={handleSent} />
        </>
      ) : (
        <div className="space-y-3">
          {data?.observations?.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No observations yet.</p>
          ) : (
            data?.observations?.map((obs) => {
              const isDraft = obs.status === 'draft'
              return (
                <SwipeableObservation
                  key={obs.id}
                  obs={obs}
                  isDraft={isDraft}
                  onDelete={handleDelete}
                  onClick={() => {
                    if (isDraft) {
                      navigate(`/observations/${obs.id}/continue`)
                    } else {
                      setSelectedObs(obs)
                    }
                  }}
                />
              )
            })
          )}
        </div>
      )}
    </Layout>
  )
}
