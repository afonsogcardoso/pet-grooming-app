import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function writeAdminLog({ actorId, action, targetId = null, payload = null }) {
  if (!actorId || !action) return
  try {
    await supabaseAdmin.from('admin_logs').insert({
      actor_id: actorId,
      action,
      target_id: targetId,
      payload
    })
  } catch (error) {
    console.error('Failed to write admin log', error)
  }
}
