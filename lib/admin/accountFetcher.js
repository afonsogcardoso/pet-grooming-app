import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function fetchAllActiveAccounts() {
  const { data, error } = await supabaseAdmin
    .from('accounts')
    .select('id, name, slug, plan, created_at, updated_at, logo_url, brand_primary, brand_primary_soft, brand_accent, brand_accent_soft, brand_background, brand_gradient')
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data || []).map((account) => ({
    id: `${account.id}-platform-admin`,
    account_id: account.id,
    role: 'platform_admin',
    status: 'accepted',
    created_at: account.created_at,
    account
  }))
}
