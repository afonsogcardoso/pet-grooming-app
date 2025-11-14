import { NextResponse } from 'next/server'

const DOMAIN_ROUTER_PATH = process.env.DOMAIN_ROUTER_PATH || '/api/domains'
const DOMAIN_ROUTER_TOKEN = process.env.DOMAIN_ROUTER_TOKEN
const CUSTOM_BASE_PATH = sanitizeBasePath(process.env.CUSTOM_DOMAIN_BASE_PATH || '/booking')
const PRIMARY_HOSTS = toSet(process.env.CUSTOM_DOMAIN_PRIMARY_HOSTS)
const SKIP_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', ...(process.env.CUSTOM_DOMAIN_SKIP_HOSTS || '').split(',').map((h) => h.trim().toLowerCase()).filter(Boolean)])
const CACHE_TTL_MS = Number(process.env.DOMAIN_ROUTER_CACHE_SECONDS || 60) * 1000
const CACHE_MISS_MS = Number(process.env.DOMAIN_ROUTER_CACHE_MISS_SECONDS || 10) * 1000

const domainCache = new Map()

function toSet(value) {
  if (!value) return new Set()
  return new Set(
    value
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
  )
}

function sanitizeBasePath(value) {
  if (!value) return '/booking'
  let base = value.trim()
  if (!base.startsWith('/')) {
    base = `/${base}`
  }
  if (base.length > 1 && base.endsWith('/')) {
    base = base.slice(0, -1)
  }
  return base
}

function normalizeHost(hostHeader) {
  if (!hostHeader) return ''
  return hostHeader.trim().toLowerCase().split(':')[0]
}

function shouldBypassPath(pathname) {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/robots')
  )
}

function getCachedDomain(host) {
  const cached = domainCache.get(host)
  if (!cached) return null
  if (cached.expiresAt < Date.now()) {
    domainCache.delete(host)
    return null
  }
  return cached.value
}

function setCachedDomain(host, value, ttlMs) {
  domainCache.set(host, {
    value,
    expiresAt: Date.now() + ttlMs
  })
}

async function fetchDomainForHost(host, request) {
  if (!DOMAIN_ROUTER_TOKEN) {
    return null
  }

  const cached = getCachedDomain(host)
  if (cached !== null) {
    return cached
  }

  const lookupUrl = new URL(DOMAIN_ROUTER_PATH, request.url)
  lookupUrl.searchParams.set('domain', host)

  try {
    const response = await fetch(lookupUrl, {
      headers: {
        'x-domain-resolver-token': DOMAIN_ROUTER_TOKEN
      },
      cache: 'no-store'
    })

    if (response.status === 404) {
      setCachedDomain(host, null, CACHE_MISS_MS)
      return null
    }

    if (!response.ok) {
      console.error('Domain lookup failed', response.status)
      setCachedDomain(host, null, CACHE_MISS_MS)
      return null
    }

    const payload = await response.json()
    const domain = payload?.domain || null
    setCachedDomain(host, domain, CACHE_TTL_MS)
    return domain
  } catch (error) {
    console.error('Domain lookup error', error)
    setCachedDomain(host, null, CACHE_MISS_MS)
    return null
  }
}

function buildRewritePath(pathname, slug) {
  if (pathname === '/') {
    return `${CUSTOM_BASE_PATH}/${slug}`
  }
  const suffix = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${CUSTOM_BASE_PATH}/${slug}${suffix}`
}

export async function middleware(request) {
  const hostHeader = request.headers.get('host')
  const hostname = normalizeHost(hostHeader)

  if (!hostname || SKIP_HOSTS.has(hostname) || PRIMARY_HOSTS.has(hostname)) {
    return NextResponse.next()
  }

  const pathname = request.nextUrl.pathname
  if (shouldBypassPath(pathname)) {
    return NextResponse.next()
  }

  const domain = await fetchDomainForHost(hostname, request)
  if (!domain || !domain.slug) {
    return NextResponse.next()
  }

  const slugPrefix = `${CUSTOM_BASE_PATH}/${domain.slug}`
  if (pathname.startsWith(slugPrefix)) {
    return NextResponse.next()
  }

  const rewriteUrl = request.nextUrl.clone()
  rewriteUrl.pathname = buildRewritePath(pathname, domain.slug)

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-custom-domain', hostname)
  requestHeaders.set('x-account-slug', domain.slug)

  const response = NextResponse.rewrite(rewriteUrl, {
    request: {
      headers: requestHeaders
    }
  })
  response.headers.set('x-custom-domain-slug', domain.slug)
  return response
}

export const config = {
  matcher: ['/((?!_next/|api/|favicon.ico|robots.txt).*)']
}
