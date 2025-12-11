import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import appointmentsRouter from './routes/appointments.js'
import customersRouter from './routes/customers.js'
import servicesRouter from './routes/services.js'

dotenv.config()

const app = express()

const allowedOrigins =
  process.env.ALLOWED_ORIGINS?.split(',').map((entry) => entry.trim()).filter(Boolean) || []
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const corsDomainCacheSeconds = Number(process.env.CORS_DOMAIN_CACHE_SECONDS || 300)
const corsCache = new Map()

const supabaseAdmin =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      })
    : null

function cacheDomain(hostname, allowed) {
  if (!hostname) return
  const ttl = corsDomainCacheSeconds > 0 ? corsDomainCacheSeconds * 1000 : 0
  const expiresAt = ttl > 0 ? Date.now() + ttl : Date.now()
  corsCache.set(hostname, { allowed, expiresAt })
}

function readCachedDomain(hostname) {
  const entry = corsCache.get(hostname)
  if (!entry) return null
  if (entry.expiresAt && entry.expiresAt < Date.now()) {
    corsCache.delete(hostname)
    return null
  }
  return entry.allowed
}

async function isDomainAllowedInDb(hostname) {
  if (!supabaseAdmin || !hostname) return false

  const cached = readCachedDomain(hostname)
  if (cached !== null) {
    return cached
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('custom_domains')
      .select('id')
      .eq('domain', hostname)
      .eq('status', 'active')
      .maybeSingle()

    if (error) {
      console.error('[cors] domain lookup error', error)
      cacheDomain(hostname, false)
      return false
    }

    const allowed = Boolean(data)
    cacheDomain(hostname, allowed)
    return allowed
  } catch (err) {
    console.error('[cors] domain lookup exception', err)
    cacheDomain(hostname, false)
    return false
  }
}

function matchesAllowedList(origin) {
  // Allow everything if '*' is configured (useful for tunnels/dev)
  if (allowedOrigins.includes('*')) return true
  if (!origin) return true

  let hostname = ''
  try {
    hostname = new URL(origin).hostname
  } catch {
    hostname = origin
  }

  return allowedOrigins.some((entry) => {
    if (!entry) return false
    if (entry.startsWith('*.')) {
      // Wildcard subdomains: *.example.com matches foo.example.com
      const suffix = entry.slice(1)
      return hostname.endsWith(suffix)
    }
    return entry === origin || entry === hostname
  })
}

async function isOriginAllowed(origin) {
  if (matchesAllowedList(origin)) {
    return true
  }

  let hostname = ''
  try {
    hostname = new URL(origin).hostname
  } catch {
    hostname = origin
  }

  return isDomainAllowedInDb(hostname)
}

app.use(
  cors({
    origin: async (origin, callback) => {
      try {
        const allowed = await isOriginAllowed(origin)
        if (allowed) {
          return callback(null, true)
        }
        return callback(new Error('Not allowed by CORS'))
      } catch (error) {
        console.error('[cors] unexpected error', error)
        return callback(new Error('Not allowed by CORS'))
      }
    }
  })
)

app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true }))
app.use('/appointments', appointmentsRouter)
app.use('/customers', customersRouter)
app.use('/services', servicesRouter)

export default app
