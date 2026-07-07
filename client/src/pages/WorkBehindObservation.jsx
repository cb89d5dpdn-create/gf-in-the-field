import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { VoiceInput } from '../components/VoiceInput'
import { api } from '../lib/api'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

// ── Step 1: Select RSM ──────────────────────────────────────────────────────
function StepSelectRSM({ rsms, onSelect }) {
  const [search, setSearch] = useState('')
  const filtered = rsms.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
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

// ── Step 2: Date + Location ─────────────────────────────────────────────────
function StepDetails({ rsm, onNext }) {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [location, setLocation] = useState('')

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-gf-teal bg-teal-50 px-2 py-1 rounded-full">
          Work Behind
        </span>
      </div>
      <h2 className="text-lg font-bold text-gray-900">Visit Details</h2>
      <p className="text-sm text-gray-500">
        RSM: <span className="font-medium text-gray-900">{rsm.name}</span>
      </p>
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

// ── Step 3: Sections + Image Capture ────────────────────────────────────────
function StepNotes({ observationId, rsm, compliance, storeHygiene, aob, images,
  onCompliance, onStoreHygiene, onAob, onAddImage, onDeleteImage, onNext, onSaveDraft, saving }) {

  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

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

        const { data: { publicUrl } } = supabase.storage
          .from('work-behind-images')
          .getPublicUrl(data.path)

        // Save image record to DB via server
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
    // Reset so same file can be re-selected
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
    <div className="space-y-6 pb-32">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-gf-teal bg-teal-50 px-2 py-1 rounded-full">
          Work Behind
        </span>
        <span className="text-sm text-gray-500">{rsm.name}</span>
      </div>
      <h2 className="text-lg font-bold text-gray-900">Observation Notes</h2>

      {/* Section 1: Compliance */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <p className="font-bold text-gray-900">1. Compliance</p>
          <p className="text-xs text-gray-500 mt-0.5">Planogram · Off Locations · Tickets · Campaigns</p>
        </div>
        <div className="p-4">
          <VoiceInput
            value={compliance}
            onChange={onCompliance}
            placeholder="Notes on planogram compliance, off locations, ticketing, campaign execution... (tap to speak or type)"
            rows={4}
          />
        </div>
      </div>

      {/* Section 2: Store Hygiene */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <p className="font-bold text-gray-900">2. Store Hygiene</p>
          <p className="text-xs text-gray-500 mt-0.5">POS Visuals · Product Placement · Stock Rotation</p>
        </div>
        <div className="p-4">
          <VoiceInput
            value={storeHygiene}
            onChange={onStoreHygiene}
            placeholder="Notes on POS visuals, product placement, stock rotation... (tap to speak or type)"
            rows={4}
          />
        </div>
      </div>

      {/* Section 3: Any Other Business */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <p className="font-bold text-gray-900">3. Any Other Business</p>
        </div>
        <div className="p-4">
          <VoiceInput
            value={aob}
            onChange={onAob}
            placeholder="Any other observations, actions, or follow-ups... (tap to speak or type)"
            rows={3}
          />
        </div>
      </div>

      {/* Image Capture */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <p className="font-bold text-gray-900">📷 Photos</p>
          <p className="text-xs text-gray-500 mt-0.5">Photos will be attached to your email</p>
        </div>
        <div className="p-4 space-y-3">
          {/* Image thumbnails */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {images.map((img) => (
                <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={img.public_url}
                    alt="Observation photo"
                    className="w-full h-full object-cover"
                  />
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

          {/* Camera button */}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-medium">
                  {images.length > 0 ? 'Add more photos' : 'Take a photo'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sticky CTAs */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button
            onClick={onNext}
            className="flex-1 bg-gf-teal text-white font-semibold py-4 rounded-xl hover:bg-gf-dark transition-colors text-sm"
          >
            Review &amp; Send
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

// ── Step 4: Review + Send ───────────────────────────────────────────────────
function StepReview({ rsm, visitDate, location, compliance, storeHygiene, aob, images,
  extraNotes, onExtraNotesChange, onSend, sending }) {

  const formattedDate = new Date(visitDate).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="space-y-6 pb-28">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-gf-teal bg-teal-50 px-2 py-1 rounded-full">
          Work Behind
        </span>
      </div>
      <h2 className="text-lg font-bold text-gray-900">Review &amp; Send</h2>

      {/* Summary card */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
        <div className="px-4 py-3">
          <p className="text-xs text-gray-500">RSM</p>
          <p className="font-semibold text-gray-900">{rsm.name}</p>
        </div>
        <div className="px-4 py-3">
          <p className="text-xs text-gray-500">Date</p>
          <p className="font-semibold text-gray-900">{formattedDate}</p>
        </div>
        {location && (
          <div className="px-4 py-3">
            <p className="text-xs text-gray-500">Location</p>
            <p className="font-semibold text-gray-900">{location}</p>
          </div>
        )}
      </div>

      {/* Section previews */}
      {[
        { label: '1. Compliance', sub: 'Planogram · Off Locations · Tickets · Campaigns', notes: compliance },
        { label: '2. Store Hygiene', sub: 'POS Visuals · Product Placement · Stock Rotation', notes: storeHygiene },
        { label: '3. Any Other Business', sub: null, notes: aob },
      ].map(({ label, sub, notes }) => (
        <div key={label} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <p className="font-semibold text-gray-900 text-sm">{label}</p>
            {sub && <p className="text-xs text-gray-400">{sub}</p>}
          </div>
          <div className="px-4 py-3">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {notes || <span className="text-gray-400 italic">No notes</span>}
            </p>
          </div>
        </div>
      ))}

      {/* Photos preview */}
      {images.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <p className="font-semibold text-gray-900 text-sm">
              📷 {images.length} Photo{images.length > 1 ? 's' : ''} (will be attached to email)
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

      {/* Additional notes (optional) */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Additional Notes <span className="font-normal text-gray-400">(optional — edit before sending)</span>
        </label>
        <textarea
          value={extraNotes}
          onChange={(e) => onExtraNotesChange(e.target.value)}
          rows={4}
          placeholder="Any additional context to include in the email..."
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gf-teal resize-none"
        />
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={onSend}
            disabled={sending}
            className="w-full bg-gf-teal text-white font-semibold py-4 rounded-xl hover:bg-gf-dark disabled:opacity-50 transition-colors text-base"
          >
            {sending ? 'Sending...' : 'Send to My Email'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────
export function WorkBehindObservation() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [rsms, setRSMs] = useState([])
  const [selectedRSM, setSelectedRSM] = useState(null)
  const [details, setDetails] = useState(null)
  const [observationId, setObservationId] = useState(null)
  const [compliance, setCompliance] = useState('')
  const [storeHygiene, setStoreHygiene] = useState('')
  const [aob, setAob] = useState('')
  const [images, setImages] = useState([])
  const [extraNotes, setExtraNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    api.get('/api/rsms').then((data) => setRSMs(data.rsms || [])).catch(console.error)
  }, [])

  const handleSelectRSM = (rsm) => {
    setSelectedRSM(rsm)
    setStep(2)
  }

  const handleDetails = async ({ date, location }) => {
    setDetails({ date, location })
    try {
      const res = await api.post('/api/work-behind', {
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

  const handleSaveDraft = async () => {
    setSaving(true)
    try {
      await api.put(`/api/work-behind/${observationId}`, {
        compliance_notes: compliance,
        store_hygiene_notes: storeHygiene,
        aob_notes: aob,
      })
      toast.success('Draft saved!')
      navigate('/')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleProceedToReview = async () => {
    // Auto-save notes before reviewing
    try {
      await api.put(`/api/work-behind/${observationId}`, {
        compliance_notes: compliance,
        store_hygiene_notes: storeHygiene,
        aob_notes: aob,
      })
    } catch (e) {
      console.error('Auto-save failed:', e)
    }
    setStep(4)
  }

  const handleSend = async () => {
    setSending(true)
    try {
      await api.post(`/api/work-behind/${observationId}/send`, {
        edited_summary: extraNotes,
      })
      toast.success('Work Behind observation sent to your email!')
      navigate('/')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSending(false)
    }
  }

  const totalSteps = 4

  return (
    <Layout>
      {/* Step indicator */}
      <div className="flex gap-1 mb-6">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1 rounded-full ${i + 1 <= step ? 'bg-gf-teal' : 'bg-gray-200'}`}
          />
        ))}
      </div>

      {step === 1 && <StepSelectRSM rsms={rsms} onSelect={handleSelectRSM} />}

      {step === 2 && (
        <StepDetails rsm={selectedRSM} onNext={handleDetails} />
      )}

      {step === 3 && (
        <StepNotes
          observationId={observationId}
          rsm={selectedRSM}
          compliance={compliance}
          storeHygiene={storeHygiene}
          aob={aob}
          images={images}
          onCompliance={setCompliance}
          onStoreHygiene={setStoreHygiene}
          onAob={setAob}
          onAddImage={(img) => setImages((prev) => [...prev, img])}
          onDeleteImage={(id) => setImages((prev) => prev.filter((i) => i.id !== id))}
          onNext={handleProceedToReview}
          onSaveDraft={handleSaveDraft}
          saving={saving}
        />
      )}

      {step === 4 && (
        <StepReview
          rsm={selectedRSM}
          visitDate={details.date}
          location={details.location}
          compliance={compliance}
          storeHygiene={storeHygiene}
          aob={aob}
          images={images}
          extraNotes={extraNotes}
          onExtraNotesChange={setExtraNotes}
          onSend={handleSend}
          sending={sending}
        />
      )}
    </Layout>
  )
}
