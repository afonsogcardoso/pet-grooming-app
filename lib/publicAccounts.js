import { cache } from 'react'
import { supabaseAdmin } from './supabaseAdmin'

export const getPublicAccountBySlug = cache(async (slug) => {
  if (!slug) return null

  const normalized = slug.trim().toLowerCase()
  if (!normalized) return null

  const { data, error } = await supabaseAdmin
    .from('accounts')
    .select(
      'id, name, slug, logo_url, portal_image_url, support_email, support_phone, brand_primary, brand_primary_soft, brand_accent, brand_accent_soft, brand_background, brand_gradient'
    )
    .eq('slug', normalized)
    .maybeSingle()

  if (error) {
    console.error('getPublicAccountBySlug error', error)
    return null
  }

  return data
})
