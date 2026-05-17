import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

const SCORE_LABELS = {
  1: 'Needs Dev',
  2: 'Developing',
  3: 'Competent',
  4: 'Proficient',
  5: 'Expert',
}

function ScoreButton({ value, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`flex-1 py-3 rounded-full text-sm font-medium border transition-colors ${
        selected
          ? 'bg-red-600 text-white border-red-600'
          : 'bg-white text-gray-700 border-gray-300 hover:border-red-400'
      }`}
    >
      {value}
      <span className="block text-xs font-normal opacity-75">{SCORE_LABELS[value]}</span>
    </button>
  )
}

// Step 1: Select RSM
function StepSelectRSM({ rsms, onSelect }) {
  const [search, setSearch] = useState('')
  const filtered = rsms.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">Select RSM</h2>
      <input
        type="text"
        placeholder="Search by name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
      />
      <div className="space-y-2">
        {filtered.map((rsm) => (
          <button
            key={rsm.id}
            onClick={() => onSelect(rsm)}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-4 text-left hover:border-red-400 transition-colors"
          >
            <p className="font-semibold text-gray-900">{rsm.name}</p>
            <p className="text-sm text-gray-500">{rsm.state}</p>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-6">No RSMs found.</p>
        )}
      </div>
    </div>
  )
}

// Step 2: Date + Location
function StepDetails({ rsm, onNext }) {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [location, setLocation] = useState('')

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">Visit Details</h2>
      <p className="text-sm text-gray-500">RSM: <span className="font-medium text-gray-900">{rsm.name}</span></p>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Visit Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Location / Store Name <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Woolworths Parramatta"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>
      <button
        onClick={() => onNext({ date, location })}
        disabled={!date}
        className="w-full bg-red-600 text-white font-semibold py-4 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
      >
        Continue
      </button>
    </div>
  )
}

// Step 3: Score all 9 areas
function StepScoring({ areas, scores, comments, onChange, onComment, onGenerate, generating }) {
  const scored = Object.keys(scores).length
  const total = areas.length
  const allScored = scored === total

  const grouped = areas.reduce((acc, area) => {
    if (!acc[area.group_name]) acc[area.group_name] = []
    acc[area.group_name].push(area)
    return acc
  }, {})

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Observation</h2>
        <span className="text-sm text-gray-500">{scored} of {total} scored</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-red-600 rounded-full transition-all"
          style={{ width: `${(scored / total) * 100}%` }}
        />
      </div>

      {Object.entries(grouped).map(([groupName, groupAreas]) => (
        <div key={groupName}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-gray-300" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{groupName}</span>
            <div className="h-px flex-1 bg-gray-300" />
          </div>

          <div className="space-y-6">
            {groupAreas.map((area) => (
              <div key={area.id} className="space-y-2">
                <div>
                  <p className="font-semibold text-gray-900">{area.label}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{area.description}</p>
                </div>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <ScoreButton
                      key={v}
                      value={v}
                      selected={scores[area.id] === v}
                      onClick={(val) => onChange(area.id, val)}
                    />
                  ))}
                </div>
                <textarea
                  value={comments[area.id] || ''}
                  onChange={(e) => onComment(area.id, e.target.value)}
                  placeholder="Key observations / examples... (optional)"
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={onGenerate}
            disabled={!allScored || generating}
            className="w-full bg-red-600 text-white font-semibold py-4 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors text-base"
          >
            {generating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Generating summary...
              </span>
            ) : allScored ? 'Generate Report' : `Score all ${total} areas to continue`}
          </button>
        </div>
      </div>
    </div>
  )
}

// Step 4: Review + Edit Summary
function StepReview({ observation, summary, onSummaryChange, onSend, sending }) {
  return (
    <div className="space-y-6 pb-24">
      <h2 className="text-lg font-bold text-gray-900">Review &amp; Send</h2>

      {/* Score table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {observation.scores?.map((s) => (
              <tr key={s.area_id} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-3 text-gray-700">{s.area_label}</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">
                  {s.score}/5
                  <span className="ml-1 text-xs font-normal text-gray-400">{SCORE_LABELS[s.score]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AI Summary (editable) */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Coaching Summary <span className="font-normal text-gray-400">(edit before sending)</span>
        </label>
        <textarea
          value={summary}
          onChange={(e) => onSummaryChange(e.target.value)}
          rows={12}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
        />
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={onSend}
            disabled={sending || !summary.trim()}
            className="w-full bg-red-600 text-white font-semibold py-4 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors text-base"
          >
            {sending ? 'Sending...' : 'Send to My Email'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function NewObservation() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [rsms, setRSMs] = useState([])
  const [areas, setAreas] = useState([])
  const [selectedRSM, setSelectedRSM] = useState(null)
  const [details, setDetails] = useState(null)
  const [observationId, setObservationId] = useState(null)
  const [scores, setScores] = useState({})
  const [comments, setComments] = useState({})
  const [summary, setSummary] = useState('')
  const [observation, setObservation] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    Promise.all([api.get('/api/rsms'), api.get('/api/areas')])
      .then(([rsmData, areaData]) => {
        setRSMs(rsmData.rsms || [])
        setAreas(areaData.areas || [])
      })
      .catch((e) => toast.error(e.message))
  }, [])

  const handleSelectRSM = (rsm) => {
    setSelectedRSM(rsm)
    setStep(2)
  }

  const handleDetails = async ({ date, location }) => {
    setDetails({ date, location })
    try {
      const res = await api.post('/api/observations', {
        rsm_id: selectedRSM.id,
        visit_date: date,
        location,
      })
      setObservationId(res.observation.id)
      setStep(3)
    } catch (e) {
      toast.error(e.message)
    }
  }

  const handleScore = (areaId, value) => {
    setScores((prev) => ({ ...prev, [areaId]: value }))
  }

  const handleComment = (areaId, value) => {
    setComments((prev) => ({ ...prev, [areaId]: value }))
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      // Save all scores first
      await api.put(`/api/observations/${observationId}`, {
        scores: areas.map((a) => ({
          area_id: a.id,
          score: scores[a.id],
          comments: comments[a.id] || '',
        })),
      })
      // Trigger AI generation
      const res = await api.post(`/api/observations/${observationId}/generate`, {})
      setSummary(res.summary || '')
      setObservation(res.observation)
      setStep(4)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleSend = async () => {
    setSending(true)
    try {
      await api.post(`/api/observations/${observationId}/send`, {
        edited_summary: summary,
      })
      toast.success('Coaching summary sent to your email!')
      navigate('/')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <Layout>
      {/* Step indicator */}
      <div className="flex gap-1 mb-6">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`flex-1 h-1 rounded-full ${s <= step ? 'bg-red-600' : 'bg-gray-200'}`}
          />
        ))}
      </div>

      {step === 1 && <StepSelectRSM rsms={rsms} onSelect={handleSelectRSM} />}
      {step === 2 && <StepDetails rsm={selectedRSM} onNext={handleDetails} />}
      {step === 3 && (
        <StepScoring
          areas={areas}
          scores={scores}
          comments={comments}
          onChange={handleScore}
          onComment={handleComment}
          onGenerate={handleGenerate}
          generating={generating}
        />
      )}
      {step === 4 && (
        <StepReview
          observation={observation || {}}
          summary={summary}
          onSummaryChange={setSummary}
          onSend={handleSend}
          sending={sending}
        />
      )}
    </Layout>
  )
}
