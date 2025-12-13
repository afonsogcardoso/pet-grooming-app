import { Router } from 'express'
import { getSupabaseServiceRoleClient } from '../authClient.js'

const router = Router()

const DEFAULT_BRANDING = {
  account_name: 'Pet Grooming',
  brand_primary: '#22c55e',
  brand_primary_soft: '#22c55e1a',
  brand_accent: '#f97316',
  brand_accent_soft: '#f973161a',
  brand_background: '#0f172a',
  brand_gradient: null,
  logo_url: null,
  portal_image_url: null,
  support_email: null,
  support_phone: null
}

function getBearer(req) {
  const auth = req.headers.authorization || ''
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
    return auth.slice('Bearer '.length)
  }
  return null
}

async function resolveAccountId(req, supabaseAdmin) {
  if (req.accountId) return req.accountId
  if (!supabaseAdmin) return req.query.accountId || null

  const token = getBearer(req)
  if (!token) return req.query.accountId || null

  const { data: userData } = await supabaseAdmin.auth.getUser(token)
  const userId = userData?.user?.id
  if (!userId) return req.query.accountId || null

  const { data: membership } = await supabaseAdmin
    .from('account_members')
    .select('account_id')
    .eq('user_id', userId)
    .eq('status', 'accepted')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (membership?.account_id) return membership.account_id
  return req.query.accountId || null
}

router.get('/', async (req, res) => {
  const supabase = getSupabaseServiceRoleClient()
  const accountId = await resolveAccountId(req, supabase)

  if (!supabase || !accountId) {
    return res.json({ data: DEFAULT_BRANDING })
  }

  const { data, error } = await supabase
    .from('accounts')
    .select(
      `
      id,
      name,
      brand_primary,
      brand_primary_soft,
      brand_accent,
      brand_accent_soft,
      brand_background,
      brand_gradient,
      logo_url,
      portal_image_url,
      support_email,
      support_phone
    `
    )
    .eq('id', accountId)
    .maybeSingle()

  if (error) {
    console.error('[api] branding error', error)
    return res.json({ data: DEFAULT_BRANDING })
  }

  if (!data) {
    return res.json({ data: DEFAULT_BRANDING })
  }

  return res.json({
    data: {
      ...DEFAULT_BRANDING,
      account_name: data.name || DEFAULT_BRANDING.account_name,
      brand_primary: data.brand_primary || DEFAULT_BRANDING.brand_primary,
      brand_primary_soft: data.brand_primary_soft || DEFAULT_BRANDING.brand_primary_soft,
      brand_accent: data.brand_accent || DEFAULT_BRANDING.brand_accent,
      brand_accent_soft: data.brand_accent_soft || DEFAULT_BRANDING.brand_accent_soft,
      brand_background: data.brand_background || DEFAULT_BRANDING.brand_background,
      brand_gradient: data.brand_gradient || DEFAULT_BRANDING.brand_gradient,
      logo_url: data.logo_url || DEFAULT_BRANDING.logo_url,
      portal_image_url: data.portal_image_url || DEFAULT_BRANDING.portal_image_url,
      support_email: data.support_email || DEFAULT_BRANDING.support_email,
      support_phone: data.support_phone || DEFAULT_BRANDING.support_phone
    }
  })
})

export default router
