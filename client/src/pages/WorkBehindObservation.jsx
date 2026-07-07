import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { VoiceInput } from '../components/VoiceInput'
import { api } from '../lib/api'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

// ── Shared score button (same as NewObservation) ─────────────────────────────
const SCORE_LABELS = { 1: 'Needs Dev', 2: 'Developing', 3: 'Competent', 4: 'Proficient', 5: 'Expert' }

function ScoreButton({ value, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`flex-1 py-3 rounded-full text-sm font-medium border transition-colors ${
        selected
          ? 'bg-gf-teal text-white border-gf-teal'
          : 'bg-white text-gray-700 border-gray-300 hover:border-gf-teal'
      }`}
    >
      {value}
      <span className="block text-xs font-normal opacity-75">{SCORE_LABELS[value]}</span>
    </button>
  )
}

// ── Work Behind sections definition ─────────────────────────────────────────
const WB_SECTIONS = [
  {
    key: 'compliance',
    label: 'Compliance',
    description: 'Identifies compliance, ranging, stock and merchandising opportunities',
    subText: 'Planogram · Off Locations · Tickets · Campaigns',
    scoreKey: 'compliance_score',
    notesKey: 'compliance_notes',
  },
  {
    key: 'store_hygiene',
    label: 'Store Hygiene',
    description: 'Completes to required standards, activations and commitments',
    subText: 'POS Visuals · Product Placement · Stock Rotation',
    scoreKey: 'store_hygiene_score',
    notesKey: 'store_hygiene_notes',
  },
  {
    key: 'aob',
    label: 'Any Other Business',
    description: 'Captures any additional actions, follow-ups or escalations',
    subText: null,
    scoreKey: 'aob_score',
    notesKey: 'aob_notes',
  },
]

// ── Step 1: Select RSM ───────────────────────────────────────────────────────
function StepSelectRSM({ rsms, onSelect }) {
  const [search, setSearch] = useState('')
  const filtered = rsms.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold uppercase tracking-wider text-gf-teal bg-teal-50 px-2 py-1 rounded-full">
          Work Behind
        </span>
      </div>
      <h2 className="text-lg font-bold text-gray-900">Select RSM</h2>
      <input
        type="text"
        placeholder="Search by name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gf-teal"
      />
      <div className="space-y-2">
        {filtered.map((rsm) => (
          <button
            key={rsm.id}
            onClick={() => onSelect(rsm)}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-4 text-left hover:border-gf-teal transition-colors"
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

// ── Step 2: Date + Location ──────────────────────────────────────────────────
function StepDetails({ rsm, onNext }) {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [location, setLocation] = useState('')

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold uppercase tracking-wider text-gf-teal bg-teal-50 px-2 py-1 rounded-full">
          Work Behind
        </span>
      </div>
      <h2 className="text-lg font-bold text-gray-900">Visit Details</h2>
      <p className="text-sm text-gray-500">RSM: <span className="font-medium text-gray-900">{rsm.name}</span></p>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Visit Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gf-teal"
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
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gf-teal"
        />
      </div>
      <button
        onClick={() => onNext({ date, location })}
        disabled={!date}
        className="w-full bg-gf-teal text-white font-semibold py-4 rounded-xl hover:bg-gf-dark disabled:opacity-50 transition-colors"
      >
        Continue
      </button>
    </div>
  )
}

// ── Step 3: Scoring + Notes + Images ────────────────────────────────────────
function StepNotes({
  observationId, rsm,
  overallComments, onOverallComments,
  scores, onScore,
  notes, onNote,
  images, onAddImage, onDeleteImage,
  onNext, generating, onSaveDraft, saving,
}) {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const scoredCount = Object.values(scores).filter(Boolean).length
  const allScored = scoredCount === WB_SECTIONS.length

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    for (const file of files) {
      try {
        const ext = file.name.split('.').pop() || 'jpg'
        const path = `${observationId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { data, error } = await supabase.storage
          .from('work-behind-images')
          .upload(path, file, { contentType: file.type, upsert: false })
        if (error) throw error
        const { data: { publicUrl } } = supabase.storage.from('work-behind-images').getPublicUrl(data.path)
        const res = await api.post(`/api/work-behind/${observationId}/images`, {
          storage_path: data.path,
          public_url: publicUrl,
        })
        onAddImage({ id: res.image.id, public_url: publicUrl, storage_path: data.path })
        toast.success('Photo added')
      } catch (err) {
        toast.error('Failed to upload photo')
        console.error(err)
      }
    }
    setUploading(false)
    e.target.value = ''
  }

  const handleDeleteImage = async (image) => {
    try {
      await api.delete(`/api/work-behind/${observationId}/images/${image.id}`)
      onDeleteImage(image.id)
      toast.success('Photo removed')
    } catch (err) {
      toast.error('Failed to remove photo')
    }
  }

  return (
    <div className="space-y-6 pb-28">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gf-teal bg-teal-50 px-2 py-1 rounded-full">
            Work Behind
          </span>
          <span className="text-sm text-gray-500">{rsm.name}</span>
        </div>
        <span className="text-sm text-gray-500">{scoredCount} of {WB_SECTIONS.length} scored</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gf-teal rounded-full transition-all"
          style={{ width: `${(scoredCount / WB_SECTIONS.length) * 100}%` }}
        />
      </div>

      {/* Overall Visit Comments — same style as NewObservation */}
      <div className="bg-gray-50 border-l-4 border-gf-teal rounded-lg p-4">
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Overall Visit Comments
        </label>
        <VoiceInput
          value={overallComments}
          onChange={onOverallComments}
          placeholder="Overall observations from today's visit... Key themes, standout moments, patterns across stores..."
          rows={4}
        />
        <p className="text-xs text-gray-500 mt-2">
          💡 Tip: Tap to speak your comments, or type.
        </p>
      </div>

      {/* Three scored sections */}
      {WB_SECTIONS.map((section) => (
        <div key={section.key} className="space-y-2">
          <div>
            <p className="font-semibold text-gray-900">{section.label}</p>
            <p className="text-sm text-gray-500 mt-0.5">{section.description}</p>
            {section.subText && (
              <p className="text-xs text-gray-400 mt-0.5">{section.subText}</p>
            )}
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((v) => (
              <ScoreButton
                key={v}
                value={v}
                selected={scores[section.scoreKey] === v}
                onClick={(val) => onScore(section.scoreKey, val)}
              />
            ))}
          </div>
          <VoiceInput
            value={notes[section.notesKey] || ''}
            onChange={(text) => onNote(section.notesKey, text)}
            placeholder="Key observations / examples... (tap to speak or type)"
            rows={2}
            className="border-gray-200"
          />
        </div>
      ))}

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-300" />
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Photos</span>
        <div className="h-px flex-1 bg-gray-300" />
      </div>

      {/* Image Capture */}
      <div className="space-y-3">
        <p className="text-xs text-gray-500">Photos will be attached to your email</p>

        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {images.map((img) => (
              <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img src={img.public_url} alt="Observation photo" className="w-full h-full object-cover" />
                <button
                  onClick={() => handleDeleteImage(img)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-gray-300 rounded-xl py-4 flex flex-col items-center gap-2 hover:border-gf-teal text-gray-500 hover:text-gf-teal transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <>
              <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span className="text-sm font-medium">Uploading...</span>
            </>
          ) : (
            <>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium">
                {images.length > 0 ? 'Add more photos' : 'Take a photo'}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Sticky CTAs */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button
            onClick={onNext}
            disabled={!allScored || generating || saving}
            className="flex-1 bg-gf-teal text-white font-semibold py-4 rounded-xl hover:bg-gf-dark disabled:opacity-50 transition-colors text-sm"
          >
            {generating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Generating...
              </span>
            ) : allScored ? 'Generate Summary' : `Score all ${WB_SECTIONS.length} first`}
          </button>
          <button
            onClick={onSaveDraft}
            disabled={saving}
            className="flex-1 bg-white text-gf-teal border-2 border-gf-teal font-semibold py-4 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors text-sm"
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Step 4: Review + Send ────────────────────────────────────────────────────
function StepReview({ rsm, visitDate, location, scores, images, summary, onSummaryChange, onSend, sending }) {

  const formattedDate = new Date(visitDate).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const scoredValues = Object.values(scores).filter(Boolean)
  const avg = scoredValues.length
    ? (scoredValues.reduce((a, b) => a + b, 0) / scoredValues.length).toFixed(1)
    : null

  return (
    <div className="space-y-6 pb-28">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold uppercase tracking-wider text-gf-teal bg-teal-50 px-2 py-1 rounded-full">
          Work Behind
        </span>
      </div>
      <h2 className="text-lg font-bold text-gray-900">Review &amp; Send</h2>

      {/* Score table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {WB_SECTIONS.map((section) => (
              <tr key={section.key} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-3 text-gray-700">{section.label}</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">
                  {scores[section.scoreKey]
                    ? <>{scores[section.scoreKey]}/5{' '}<span className="ml-1 text-xs font-normal text-gray-400">{SCORE_LABELS[scores[section.scoreKey]]}</span></>
                    : <span className="text-gray-400 font-normal">—</span>
                  }
                </td>
              </tr>
            ))}
            {avg && (
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-gray-500 text-xs font-medium uppercase tracking-wide">Average</td>
                <td className="px-4 py-3 text-right font-bold text-gray-900">{avg}/5</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* AI Summary (editable) */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Observation Summary <span className="font-normal text-gray-400">(edit before sending)</span>
        </label>
        <textarea
          value={summary}
          onChange={(e) => onSummaryChange(e.target.value)}
          rows={10}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gf-teal resize-none"
        />
      </div>

      {/* Photos preview */}
      {images.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <p className="font-semibold text-gray-900 text-sm">
              📷 {images.length} Photo{images.length > 1 ? 's' : ''} (attached to email)
            </p>
          </div>
          <div className="p-3 grid grid-cols-4 gap-2">
            {images.map((img) => (
              <div key={img.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img src={img.public_url} alt="Observation photo" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={onSend}
            disabled={sending || !summary.trim()}
            className="w-full bg-gf-teal text-white font-semibold py-4 rounded-xl hover:bg-gf-dark disabled:opacity-50 transition-colors text-base"
          >
            {sending ? 'Sending...' : 'Send to My Email'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────
export function WorkBehindObservation() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [rsms, setRSMs] = useState([])
  const [selectedRSM, setSelectedRSM] = useState(null)
  const [details, setDetails] = useState(null)
  const [observationId, setObservationId] = useState(null)
  const [overallComments, setOverallComments] = useState('')
  const [scores, setScores] = useState({})
  const [notes, setNotes] = useState({})
  const [images, setImages] = useState([])
  const [summary, setSummary] = useState('')
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    api.get('/api/rsms').then((data) => setRSMs(data.rsms || [])).catch(console.error)
  }, [])

  const handleSelectRSM = (rsm) => { setSelectedRSM(rsm); setStep(2) }

  const handleDetails = async ({ date, location }) => {
    setDetails({ date, location })
    try {
      const res = await api.post('/api/work-behind', { rsm_id: selectedRSM.id, visit_date: date, location })
      setObservationId(res.observation.id)
      setStep(3)
    } catch (e) {
      toast.error(e.message)
    }
  }

  const handleSaveDraft = async () => {
    setSaving(true)
    try {
      await api.put(`/api/work-behind/${observationId}`, {
        overall_comments: overallComments,
        ...scores,
        ...notes,
      })
      toast.success('Draft saved!')
      navigate('/')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      // Save everything first
      await api.put(`/api/work-behind/${observationId}`, {
        overall_comments: overallComments,
        ...scores,
        ...notes,
      })
      // Generate AI summary
      const res = await api.post(`/api/work-behind/${observationId}/generate`, {})
      setSummary(res.summary || '')
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
      await api.post(`/api/work-behind/${observationId}/send`, { edited_summary: extraNotes })
      toast.success('Work Behind observation sent to your email!')
      navigate('/')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <Layout>
      <div className="flex gap-1 mb-6">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className={`flex-1 h-1 rounded-full ${s <= step ? 'bg-gf-teal' : 'bg-gray-200'}`} />
        ))}
      </div>

      {step === 1 && <StepSelectRSM rsms={rsms} onSelect={handleSelectRSM} />}
      {step === 2 && <StepDetails rsm={selectedRSM} onNext={handleDetails} />}
      {step === 3 && (
        <StepNotes
          observationId={observationId}
          rsm={selectedRSM}
          overallComments={overallComments}
          onOverallComments={setOverallComments}
          scores={scores}
          onScore={(key, val) => setScores((prev) => ({ ...prev, [key]: val }))}
          notes={notes}
          onNote={(key, val) => setNotes((prev) => ({ ...prev, [key]: val }))}
          images={images}
          onAddImage={(img) => setImages((prev) => [...prev, img])}
          onDeleteImage={(id) => setImages((prev) => prev.filter((i) => i.id !== id))}
          onNext={handleGenerate}
          generating={generating}
          onSaveDraft={handleSaveDraft}
          saving={saving}
        />
      )}
      {step === 4 && (
        <StepReview
          rsm={selectedRSM}
          visitDate={details.date}
          location={details.location}
          scores={scores}
          images={images}
          summary={summary}
          onSummaryChange={setSummary}
          onSend={handleSend}
          sending={sending}
        />
      )}
    </Layout>
  )
}
