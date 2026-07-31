import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Layout } from '../components/Layout'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

const GROUPS = ['Visit Prep & Data', 'In-Store']
const TABS = ['Observation Areas', 'Work Behind', 'Organisation']

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconChevron({ dir }) {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d={dir === 'up' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
    </svg>
  )
}

function IconEdit() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  )
}

// ─── Observation Areas Tab ────────────────────────────────────────────────────

function ObservationAreasTab() {
  const qc = useQueryClient()
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [adding, setAdding] = useState(false)
  const [newArea, setNewArea] = useState({ label: '', description: '', group_name: GROUPS[0] })

  const { data: areas = [], isLoading } = useQuery({
    queryKey: ['settings-areas'],
    queryFn: () => api.get('/api/admin/settings/observation-areas'),
  })

  const patchArea = useMutation({
    mutationFn: ({ id, ...updates }) => api.patch(`/api/admin/settings/observation-areas/${id}`, updates),
    onSuccess: () => { qc.invalidateQueries(['settings-areas']); qc.invalidateQueries(['areas']) },
  })

  const createArea = useMutation({
    mutationFn: (body) => api.post('/api/admin/settings/observation-areas', body),
    onSuccess: () => { qc.invalidateQueries(['settings-areas']); qc.invalidateQueries(['areas']) },
  })

  const reorder = useMutation({
    mutationFn: (items) => api.post('/api/admin/settings/observation-areas/reorder', { items }),
    onSuccess: () => qc.invalidateQueries(['settings-areas']),
  })

  const startEdit = (area) => {
    setEditingId(area.id)
    setEditForm({ label: area.label, description: area.description, group_name: area.group_name })
  }

  const saveEdit = async () => {
    await patchArea.mutateAsync({ id: editingId, ...editForm })
    toast.success('Saved')
    setEditingId(null)
  }

  const toggleActive = async (area) => {
    await patchArea.mutateAsync({ id: area.id, is_active: !area.is_active })
    toast.success(area.is_active ? 'Area hidden' : 'Area shown')
  }

  const moveArea = async (index, dir) => {
    const sorted = [...areas].sort((a, b) => a.order_index - b.order_index)
    const swapIndex = dir === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= sorted.length) return
    const updated = sorted.map((a, i) => {
      if (i === index) return { id: a.id, order_index: sorted[swapIndex].order_index }
      if (i === swapIndex) return { id: a.id, order_index: sorted[index].order_index }
      return { id: a.id, order_index: a.order_index }
    })
    await reorder.mutateAsync(updated)
  }

  const saveNew = async () => {
    if (!newArea.label.trim()) { toast.error('Label is required'); return }
    await createArea.mutateAsync(newArea)
    toast.success('Area added')
    setAdding(false)
    setNewArea({ label: '', description: '', group_name: GROUPS[0] })
  }

  const sorted = [...areas].sort((a, b) => a.order_index - b.order_index)

  if (isLoading) return <div className="text-sm text-gray-400 py-8 text-center">Loading...</div>

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        These are the coaching dimensions scored during observations. Toggle, reorder, rename, or add new ones — changes apply instantly for all users.
      </p>

      {sorted.map((area, index) => (
        <div key={area.id} className={`border rounded-xl p-4 transition-opacity ${area.is_active ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
          {editingId === area.id ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Label</label>
                  <input
                    type="text"
                    value={editForm.label}
                    onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gf-teal"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Group</label>
                  <select
                    value={editForm.group_name}
                    onChange={(e) => setEditForm({ ...editForm, group_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gf-teal"
                  >
                    {GROUPS.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gf-teal resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={saveEdit}
                  className="flex-1 bg-gf-teal text-white text-sm font-semibold py-2 rounded-lg hover:bg-gf-dark transition-colors">
                  Save
                </button>
                <button onClick={() => setEditingId(null)}
                  className="flex-1 border border-gray-200 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              {/* Reorder */}
              <div className="flex flex-col gap-0.5 pt-0.5">
                <button onClick={() => moveArea(index, 'up')} disabled={index === 0}
                  className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-20">
                  <IconChevron dir="up" />
                </button>
                <button onClick={() => moveArea(index, 'down')} disabled={index === sorted.length - 1}
                  className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-20">
                  <IconChevron dir="down" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900">{area.label}</span>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{area.group_name}</span>
                  {!area.is_active && <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">Hidden</span>}
                </div>
                {area.description && (
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{area.description}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => startEdit(area)}
                  className="p-1.5 text-gray-400 hover:text-gf-teal hover:bg-gf-teal/10 rounded-lg transition-colors">
                  <IconEdit />
                </button>
                {/* Toggle switch */}
                <button
                  onClick={() => toggleActive(area)}
                  title={area.is_active ? 'Hide from users' : 'Show to users'}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    area.is_active ? 'bg-gf-teal' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    area.is_active ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add new */}
      {adding ? (
        <div className="border-2 border-dashed border-gf-teal/40 rounded-xl p-4 bg-gf-teal/5 space-y-3">
          <p className="text-sm font-semibold text-gf-teal">New Observation Area</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Label *</label>
              <input type="text" value={newArea.label}
                onChange={(e) => setNewArea({ ...newArea, label: e.target.value })}
                placeholder="e.g. Commercial Insight"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gf-teal"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Group *</label>
              <select value={newArea.group_name}
                onChange={(e) => setNewArea({ ...newArea, group_name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gf-teal">
                {GROUPS.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Description</label>
            <textarea value={newArea.description}
              onChange={(e) => setNewArea({ ...newArea, description: e.target.value })}
              rows={2} placeholder="What does this area assess?"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gf-teal resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={saveNew}
              className="flex-1 bg-gf-teal text-white text-sm font-semibold py-2 rounded-lg hover:bg-gf-dark transition-colors">
              Add Area
            </button>
            <button onClick={() => { setAdding(false); setNewArea({ label: '', description: '', group_name: GROUPS[0] }) }}
              className="flex-1 border border-gray-200 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm text-gray-400 hover:border-gf-teal hover:text-gf-teal transition-colors flex items-center justify-center gap-2">
          <IconPlus /> Add Observation Area
        </button>
      )}
    </div>
  )
}

// ─── Work Behind Tab ────────────────────────────────────────────────────────

function WorkBehindTab() {
  const qc = useQueryClient()
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ['settings-wb-sections'],
    queryFn: () => api.get('/api/admin/settings/work-behind-sections'),
  })

  const patchSection = useMutation({
    mutationFn: ({ id, ...updates }) => api.patch(`/api/admin/settings/work-behind-sections/${id}`, updates),
    onSuccess: () => qc.invalidateQueries(['settings-wb-sections']),
  })

  const reorder = useMutation({
    mutationFn: (items) => api.post('/api/admin/settings/work-behind-sections/reorder', { items }),
    onSuccess: () => qc.invalidateQueries(['settings-wb-sections']),
  })

  const toggleActive = async (section) => {
    await patchSection.mutateAsync({ id: section.id, is_active: !section.is_active })
    toast.success(section.is_active ? 'Section hidden' : 'Section shown')
  }

  const saveEdit = async () => {
    await patchSection.mutateAsync({ id: editingId, ...editForm })
    toast.success('Saved')
    setEditingId(null)
  }

  const moveSection = async (index, dir) => {
    const sorted = [...sections].sort((a, b) => a.order_index - b.order_index)
    const swapIndex = dir === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= sorted.length) return
    const updated = sorted.map((s, i) => {
      if (i === index) return { id: s.id, order_index: sorted[swapIndex].order_index }
      if (i === swapIndex) return { id: s.id, order_index: sorted[index].order_index }
      return { id: s.id, order_index: s.order_index }
    })
    await reorder.mutateAsync(updated)
  }

  const sorted = [...sections].sort((a, b) => a.order_index - b.order_index)

  if (isLoading) return <div className="text-sm text-gray-400 py-8 text-center">Loading...</div>

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        The three sections that appear in Work Behind observations. Rename, reorder, or hide sections — changes apply immediately.
      </p>

      {sorted.map((section, index) => (
        <div key={section.id} className={`border rounded-xl p-4 transition-opacity ${
          section.is_active ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'
        }`}>
          {editingId === section.id ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Section Label</label>
                <input type="text" value={editForm.label}
                  onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gf-teal"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Description</label>
                <textarea value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gf-teal resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={saveEdit}
                  className="flex-1 bg-gf-teal text-white text-sm font-semibold py-2 rounded-lg hover:bg-gf-dark transition-colors">
                  Save
                </button>
                <button onClick={() => setEditingId(null)}
                  className="flex-1 border border-gray-200 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <div className="flex flex-col gap-0.5 pt-0.5">
                <button onClick={() => moveSection(index, 'up')} disabled={index === 0}
                  className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-20">
                  <IconChevron dir="up" />
                </button>
                <button onClick={() => moveSection(index, 'down')} disabled={index === sorted.length - 1}
                  className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-20">
                  <IconChevron dir="down" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900">{section.label}</span>
                  {!section.is_active && <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">Hidden</span>}
                </div>
                {section.description && (
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{section.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => { setEditingId(section.id); setEditForm({ label: section.label, description: section.description }) }}
                  className="p-1.5 text-gray-400 hover:text-gf-teal hover:bg-gf-teal/10 rounded-lg transition-colors">
                  <IconEdit />
                </button>
                <button
                  onClick={() => toggleActive(section)}
                  title={section.is_active ? 'Hide section' : 'Show section'}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    section.is_active ? 'bg-gf-teal' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    section.is_active ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-xs font-medium text-blue-800 mb-1">Note</p>
        <p className="text-xs text-blue-700">
          Work Behind has 3 fixed sections (Compliance, Store Hygiene, AOB). You can rename and reorder them. Adding or removing sections is on the roadmap.
        </p>
      </div>
    </div>
  )
}

// ─── Organisation Tab ─────────────────────────────────────────────────────────

function OrganisationTab() {
  const qc = useQueryClient()
  const { data: org, isLoading } = useQuery({
    queryKey: ['settings-org'],
    queryFn: () => api.get('/api/admin/settings/organisation'),
  })
  const [name, setName] = useState('')
  const [editing, setEditing] = useState(false)

  const patch = useMutation({
    mutationFn: (body) => api.patch('/api/admin/settings/organisation', body),
    onSuccess: (data) => {
      qc.invalidateQueries(['settings-org'])
      setEditing(false)
      toast.success('Organisation updated')
    },
  })

  if (isLoading) return <div className="text-sm text-gray-400 py-8 text-center">Loading...</div>

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Organisation details used across the platform.
      </p>
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <label className="text-sm font-medium text-gray-700 block">Organisation Name</label>
        {editing ? (
          <div className="space-y-2">
            <input type="text" value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gf-teal"
            />
            <div className="flex gap-2">
              <button onClick={() => patch.mutate({ name })} disabled={!name.trim()}
                className="flex-1 bg-gf-teal text-white text-sm font-semibold py-2 rounded-lg hover:bg-gf-dark disabled:opacity-50 transition-colors">
                Save
              </button>
              <button onClick={() => setEditing(false)}
                className="flex-1 border border-gray-200 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-gray-900 font-semibold">{org?.name}</span>
            <button onClick={() => { setName(org?.name || ''); setEditing(true) }}
              className="p-1.5 text-gray-400 hover:text-gf-teal hover:bg-gf-teal/10 rounded-lg transition-colors">
              <IconEdit />
            </button>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-xs font-medium text-blue-800 mb-1">Coming soon</p>
        <p className="text-xs text-blue-700">
          Logo upload and brand colour customisation — useful when white-labelling for other organisations.
        </p>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function AdminSettings() {
  const [activeTab, setActiveTab] = useState(TABS[0])

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Platform Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Admin only — changes apply immediately for all users</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 text-sm font-medium py-2 px-3 rounded-lg transition-colors ${
                activeTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Observation Areas' && <ObservationAreasTab />}
        {activeTab === 'Work Behind' && <WorkBehindTab />}
        {activeTab === 'Organisation' && <OrganisationTab />}
      </div>
    </Layout>
  )
}
