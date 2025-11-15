import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function findUserByEmail(email) {
  if (!email) return null
  const normalized = email.trim().toLowerCase()
  if (!normalized) return null

  const { data, error } = await supabaseAdmin.rpc('get_user_id_by_email', {
    email: normalized
  })

  if (error) {
    throw new Error(error.message)
  }

  const userId = Array.isArray(data) && data.length > 0 ? data[0]?.id : null
  if (!userId) {
    return null
  }

  const { data: userResult, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
  if (userError) {
    throw new Error(userError.message)
  }

  return userResult?.user || null
}
