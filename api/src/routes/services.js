import { Router } from 'express'
import { getSupabaseClientWithAuth } from '../authClient.js'

const router = Router()

router.get('/', async (req, res) => {
  const supabase = getSupabaseClientWithAuth(req)
  if (!supabase) return res.status(401).json({ error: 'Unauthorized' })

  const { data, error } = await supabase
    .from('services')
    .select('id,name,default_duration,price,active,description')
    .order('name', { ascending: true })
    .limit(200)

  if (error) {
    console.error('[api] services error', error)
    return res.status(500).json({ error: error.message })
  }

  res.json({ data })
})

router.post('/', async (req, res) => {
  const supabase = getSupabaseClientWithAuth(req)
  if (!supabase) return res.status(401).json({ error: 'Unauthorized' })
  const payload = req.body || {}
  // Map duration -> default_duration if provided
  const mapped = {
    ...payload,
    default_duration: payload.duration ?? payload.default_duration
  }

  const { data, error } = await supabase.from('services').insert([mapped]).select()

  if (error) {
    console.error('[api] create service error', error)
    return res.status(500).json({ error: error.message })
  }

  res.status(201).json({ data })
})

router.patch('/:id', async (req, res) => {
  const supabase = getSupabaseClientWithAuth(req)
  if (!supabase) return res.status(401).json({ error: 'Unauthorized' })
  const { id } = req.params
  const payload = req.body || {}

  // Support soft-delete via _delete flag
  const updatePayload = payload._delete
    ? { deleted_at: new Date().toISOString() }
    : {
        ...payload,
        default_duration: payload.duration ?? payload.default_duration
      }

  const { data, error } = await supabase.from('services').update(updatePayload).eq('id', id).select()

  if (error) {
    console.error('[api] update service error', error)
    return res.status(500).json({ error: error.message })
  }

  res.json({ data })
})

router.delete('/:id', async (req, res) => {
  const supabase = getSupabaseClientWithAuth(req)
  if (!supabase) return res.status(401).json({ error: 'Unauthorized' })
  const { id } = req.params

  const { error } = await supabase.from('services').delete().eq('id', id)

  if (error) {
    console.error('[api] delete service error', error)
    return res.status(500).json({ error: error.message })
  }

  res.json({ ok: true })
})

export default router
