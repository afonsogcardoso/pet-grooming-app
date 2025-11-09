// ============================================
// FILE: lib/serviceService.js
// Service catalog operations
// ============================================

import { supabase } from './supabase'

export async function loadServices({ includeInactive = false } = {}) {
  let query = supabase.from('services').select('*').order('name', { ascending: true })
  if (!includeInactive) {
    query = query.eq('active', true)
  }
  const { data, error } = await query

  return { data: data || [], error }
}

export async function createService(serviceData) {
  const { data, error } = await supabase
    .from('services')
    .insert([serviceData])
    .select()

  return { data: data || [], error }
}

export async function updateService(id, serviceData) {
  const { data, error } = await supabase
    .from('services')
    .update(serviceData)
    .eq('id', id)
    .select()

  return { data, error }
}

export async function deleteService(id) {
  const { error } = await supabase.from('services').delete().eq('id', id)
  return { error }
}
