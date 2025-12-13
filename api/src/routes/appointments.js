import { Router } from 'express'
import { getSupabaseClientWithAuth, getSupabaseServiceRoleClient } from '../authClient.js'

const router = Router()

router.get('/', async (req, res) => {
  const accountId = req.accountId
  const supabase = accountId ? getSupabaseServiceRoleClient() : getSupabaseClientWithAuth(req)
  if (!supabase) return res.status(401).json({ error: 'Unauthorized' })

  const { date_from: dateFrom, date_to: dateTo, limit: limitParam, status, offset: offsetParam } = req.query
  const limit = Math.min(Math.max(Number(limitParam) || 50, 1), 500)
  const offset = Math.max(Number(offsetParam) || 0, 0)
  const start = offset
  const end = offset + limit - 1

  let query = supabase
    .from('appointments')
    .select(
      `
      id,
      appointment_date,
      appointment_time,
      duration,
      payment_status,
      status,
      customers ( id, name, phone, address ),
      services ( id, name, price ),
      pets ( id, name, breed, photo_url )
    `
    )
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true })
    .range(start, end)

  if (accountId) {
    query = query.eq('account_id', accountId)
  }

  if (dateFrom) {
    query = query.gte('appointment_date', dateFrom)
  }
  if (dateTo) {
    query = query.lte('appointment_date', dateTo)
  }
  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('[api] appointments error', error)
    return res.status(500).json({ error: error.message })
  }

  const nextOffset = data.length === limit ? offset + limit : null

  res.json({ data, meta: { nextOffset } })
})

router.post('/', async (req, res) => {
  const accountId = req.accountId
  const supabase = accountId ? getSupabaseServiceRoleClient() : getSupabaseClientWithAuth(req)
  if (!supabase) return res.status(401).json({ error: 'Unauthorized' })
  const payload = { ...(req.body || {}) }

  if (accountId) {
    payload.account_id = accountId
  }

  const { data, error } = await supabase.from('appointments').insert(payload).select()

  if (error) {
    console.error('[api] create appointment error', error)
    return res.status(500).json({ error: error.message })
  }

  res.status(201).json({ data })
})

router.patch('/:id/status', async (req, res) => {
  const accountId = req.accountId
  const supabase = accountId ? getSupabaseServiceRoleClient() : getSupabaseClientWithAuth(req)
  if (!supabase) return res.status(401).json({ error: 'Unauthorized' })
  const { id } = req.params
  const { status } = req.body || {}

  if (!status) {
    return res.status(400).json({ error: 'Missing status' })
  }

  let query = supabase.from('appointments').update({ status }).eq('id', id)
  if (accountId) {
    query = query.eq('account_id', accountId)
  }

  const { data, error } = await query.select()

  if (error) {
    console.error('[api] update appointment status error', error)
    return res.status(500).json({ error: error.message })
  }

  res.json({ data })
})

export default router
