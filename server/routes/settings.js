const router = require('express').Router()
const { requireAuth, requireAdmin } = require('../middleware/auth')
const { supabaseAdmin } = require('../lib/supabase')

router.use(requireAuth, requireAdmin)

// ─── Organisation ────────────────────────────────────────────────────────────

// GET /api/admin/settings/organisation
router.get('/organisation', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('organisations')
      .select('id, name')
      .eq('id', req.profile.org_id)
      .single()
    if (error) throw error
    res.json(data)
  } catch (err) { next(err) }
})

// PATCH /api/admin/settings/organisation
router.patch('/organisation', async (req, res, next) => {
  try {
    const { name } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' })
    const { data, error } = await supabaseAdmin
      .from('organisations')
      .update({ name: name.trim() })
      .eq('id', req.profile.org_id)
      .select('id, name')
      .single()
    if (error) throw error
    res.json(data)
  } catch (err) { next(err) }
})

// ─── Observation Areas ────────────────────────────────────────────────────────

// GET /api/admin/settings/observation-areas
router.get('/observation-areas', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('observation_areas')
      .select('*')
      .eq('org_id', req.profile.org_id)
      .order('order_index')
    if (error) throw error
    res.json(data)
  } catch (err) { next(err) }
})

// POST /api/admin/settings/observation-areas
router.post('/observation-areas', async (req, res, next) => {
  try {
    const { label, description, group_name } = req.body
    if (!label?.trim()) return res.status(400).json({ error: 'Label is required' })
    if (!group_name?.trim()) return res.status(400).json({ error: 'Group is required' })

    // Get next order_index
    const { data: existing } = await supabaseAdmin
      .from('observation_areas')
      .select('order_index')
      .eq('org_id', req.profile.org_id)
      .order('order_index', { ascending: false })
      .limit(1)

    const nextIndex = existing?.length ? (existing[0].order_index + 1) : 1

    const { data, error } = await supabaseAdmin
      .from('observation_areas')
      .insert({
        org_id: req.profile.org_id,
        order_index: nextIndex,
        group_name: group_name.trim(),
        label: label.trim(),
        description: (description || '').trim(),
        is_active: true,
      })
      .select()
      .single()
    if (error) throw error
    res.status(201).json(data)
  } catch (err) { next(err) }
})

// PATCH /api/admin/settings/observation-areas/:id
router.patch('/observation-areas/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const { label, description, group_name, is_active } = req.body

    const updates = {}
    if (label !== undefined) updates.label = label.trim()
    if (description !== undefined) updates.description = description.trim()
    if (group_name !== undefined) updates.group_name = group_name.trim()
    if (is_active !== undefined) updates.is_active = is_active

    if (!Object.keys(updates).length) return res.status(400).json({ error: 'No fields to update' })

    const { data, error } = await supabaseAdmin
      .from('observation_areas')
      .update(updates)
      .eq('id', id)
      .eq('org_id', req.profile.org_id)
      .select()
      .single()
    if (error) throw error
    res.json(data)
  } catch (err) { next(err) }
})

// POST /api/admin/settings/observation-areas/reorder
// Body: [{ id, order_index }, ...]
router.post('/observation-areas/reorder', async (req, res, next) => {
  try {
    const { items } = req.body
    if (!Array.isArray(items)) return res.status(400).json({ error: 'items array required' })

    await Promise.all(
      items.map(({ id, order_index }) =>
        supabaseAdmin
          .from('observation_areas')
          .update({ order_index })
          .eq('id', id)
          .eq('org_id', req.profile.org_id)
      )
    )
    res.json({ ok: true })
  } catch (err) { next(err) }
})

// DELETE /api/admin/settings/observation-areas/:id
// Soft delete — just deactivates
router.delete('/observation-areas/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const { data, error } = await supabaseAdmin
      .from('observation_areas')
      .update({ is_active: false })
      .eq('id', id)
      .eq('org_id', req.profile.org_id)
      .select()
      .single()
    if (error) throw error
    res.json(data)
  } catch (err) { next(err) }
})

// ─── Work Behind Sections ─────────────────────────────────────────────────────

// GET /api/admin/settings/work-behind-sections
router.get('/work-behind-sections', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('work_behind_sections')
      .select('*')
      .eq('org_id', req.profile.org_id)
      .order('order_index')
    if (error) throw error
    res.json(data)
  } catch (err) { next(err) }
})

// PATCH /api/admin/settings/work-behind-sections/:id
router.patch('/work-behind-sections/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const { label, description, is_active } = req.body
    const updates = {}
    if (label !== undefined) updates.label = label.trim()
    if (description !== undefined) updates.description = description.trim()
    if (is_active !== undefined) updates.is_active = is_active
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'No fields to update' })
    const { data, error } = await supabaseAdmin
      .from('work_behind_sections')
      .update(updates)
      .eq('id', id)
      .eq('org_id', req.profile.org_id)
      .select()
      .single()
    if (error) throw error
    res.json(data)
  } catch (err) { next(err) }
})

// POST /api/admin/settings/work-behind-sections/reorder
router.post('/work-behind-sections/reorder', async (req, res, next) => {
  try {
    const { items } = req.body
    if (!Array.isArray(items)) return res.status(400).json({ error: 'items array required' })
    await Promise.all(
      items.map(({ id, order_index }) =>
        supabaseAdmin
          .from('work_behind_sections')
          .update({ order_index })
          .eq('id', id)
          .eq('org_id', req.profile.org_id)
      )
    )
    res.json({ ok: true })
  } catch (err) { next(err) }
})

module.exports = router
