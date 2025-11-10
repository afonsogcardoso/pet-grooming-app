// ============================================
// FILE: lib/serviceService.js
// Service catalog operations
// ============================================

import { supabase } from './supabase'
import { getCurrentAccountId } from './accountHelpers'

export async function loadServices({ includeInactive = false } = {}) {
  const accountId = await getCurrentAccountId()
  let query = supabase
    .from('services')
    .select('*')
    .eq('account_id', accountId)
    .order('name', { ascending: true })

  if (!includeInactive) {
    query = query.eq('active', true)
  }
  const { data, error } = await query

  return { data: data || [], error }
}

export async function createService(serviceData) {
  const accountId = await getCurrentAccountId()
  const payload = { ...serviceData, account_id: accountId }

  const { data, error } = await supabase.from('services').insert([payload]).select()

  return { data: data || [], error }
}

export async function updateService(id, serviceData) {
  const accountId = await getCurrentAccountId()
  const { data, error } = await supabase
    .from('services')
    .update(serviceData)
    .eq('account_id', accountId)
    .eq('id', id)
    .select()

  return { data, error }
}

export async function deleteService(id) {
  const accountId = await getCurrentAccountId()
  const { error } = await supabase.from('services').delete().eq('account_id', accountId).eq('id', id)
  return { error }
}
