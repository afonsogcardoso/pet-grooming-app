import { Router } from 'express'
import { getSupabaseClientWithAuth, getSupabaseServiceRoleClient } from '../authClient.js'

const router = Router()

router.get('/', async (req, res) => {
  const accountId = req.accountId
  const supabase = accountId ? getSupabaseServiceRoleClient() : getSupabaseClientWithAuth(req)
  if (!supabase) return res.status(401).json({ error: 'Unauthorized' })

  let query = supabase.from('customers').select('id,name,phone,email,address').order('name', {
    ascending: true
  })

  if (accountId) {
    query = query.eq('account_id', accountId)
  }

  const { data, error } = await query.limit(200)

  if (error) {
    console.error('[api] customers error', error)
    return res.status(500).json({ error: error.message })
  }

  res.json({ data })
})

router.post('/', async (req, res) => {
  const accountId = req.accountId
  const supabase = accountId ? getSupabaseServiceRoleClient() : getSupabaseClientWithAuth(req)
  if (!supabase) return res.status(401).json({ error: 'Unauthorized' })
  const payload = { ...(req.body || {}) }
  if (accountId) {
    payload.account_id = accountId
  }

  const { data, error } = await supabase.from('customers').insert([payload]).select()

  if (error) {
    console.error('[api] create customer error', error)
    return res.status(500).json({ error: error.message })
  }

  res.status(201).json({ data })
})

router.patch('/:id', async (req, res) => {
  const accountId = req.accountId
  const supabase = accountId ? getSupabaseServiceRoleClient() : getSupabaseClientWithAuth(req)
  if (!supabase) return res.status(401).json({ error: 'Unauthorized' })
  const { id } = req.params
  const payload = req.body || {}

  let query = supabase.from('customers').update(payload).eq('id', id)
  if (accountId) {
    query = query.eq('account_id', accountId)
  }

  const { data, error } = await query.select()

  if (error) {
    console.error('[api] update customer error', error)
    return res.status(500).json({ error: error.message })
  }

  res.json({ data })
})

router.delete('/:id', async (req, res) => {
  const accountId = req.accountId
  const supabase = accountId ? getSupabaseServiceRoleClient() : getSupabaseClientWithAuth(req)
  if (!supabase) return res.status(401).json({ error: 'Unauthorized' })
  const { id } = req.params

  let query = supabase.from('customers').delete().eq('id', id)
  if (accountId) {
    query = query.eq('account_id', accountId)
  }

  const { error } = await query

  if (error) {
    console.error('[api] delete customer error', error)
    return res.status(500).json({ error: error.message })
  }

  res.json({ ok: true })
})

export default router
