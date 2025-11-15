import fs from 'fs/promises'
import path from 'path'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const BLUEPRINTS_DIR = path.join(process.cwd(), 'config', 'blueprints')

export async function runDefaultAccountSeed(account, template = 'basic') {
  if (!account?.id) {
    return { createdServices: 0, skipped: true }
  }

  const { count, error: countError } = await supabaseAdmin
    .from('services')
    .select('id', { count: 'exact', head: true })
    .eq('account_id', account.id)

  if (countError) {
    throw new Error(countError.message)
  }

  if ((count ?? 0) > 0) {
    return { createdServices: 0, skipped: true }
  }

  const blueprint = await loadBlueprint(template)
  if (!blueprint) {
    return { createdServices: 0, skipped: true }
  }

  if (blueprint.branding) {
    await supabaseAdmin
      .from('accounts')
      .update({
        brand_primary: blueprint.branding.brand_primary,
        brand_accent: blueprint.branding.brand_accent
      })
      .eq('id', account.id)
  }

  const services =
    blueprint.services?.map((service, index) => ({
      name: service.name,
      description: service.description || null,
      price: service.price ?? null,
      default_duration: service.duration ?? service.default_duration ?? 60,
      account_id: account.id,
      active: service.type !== 'package',
      type: service.type || 'service',
      order_index: index
    })) || []

  const servicesToInsert = services.map((service) => ({
    ...service,
    name: `${service.name} (${blueprint.label})`
  }))

  const { error } = servicesToInsert.length
    ? await supabaseAdmin.from('services').insert(servicesToInsert)
    : { error: null }

  if (error) {
    throw new Error(error.message)
  }

  return { createdServices: servicesToInsert.length, skipped: false }
}

async function loadBlueprint(template) {
  const fileName = getBlueprintFile(template)
  if (!fileName) return null

  try {
    const payload = await fs.readFile(path.join(BLUEPRINTS_DIR, fileName), 'utf8')
    return JSON.parse(payload)
  } catch (error) {
    console.error('Failed to load blueprint', error)
    return null
  }
}

function getBlueprintFile(template) {
  switch (template) {
    case 'grooming':
      return 'grooming.json'
    case 'vet':
      return 'veterinario.json'
    case 'fitness':
      return 'fitness.json'
    case 'coaching':
      return 'coaching.json'
    default:
      return null
  }
}
