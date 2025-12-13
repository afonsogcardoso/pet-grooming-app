import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import { apiKeyAuth } from './apiKeyAuth.js'
import appointmentsRouter from './routes/appointments.js'
import customersRouter from './routes/customers.js'
import servicesRouter from './routes/services.js'
import authRouter from './routes/auth.js'

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
      cacheDomain(hostname, false)
      return false
    }

    const allowed = Boolean(data)
    cacheDomain(hostname, allowed)
    return allowed
  } catch {
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
        return callback(new Error('Not allowed by CORS'))
      }
    }
  })
)

app.use(express.json())
app.use(apiKeyAuth)

// OpenAPI / Swagger setup (served at /docs and /docs.json)
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Pet Grooming API',
    version: '1.0.0',
    description: 'Endpoints for appointments, customers and services'
  },
  servers: [
    {
      url: `${(process.env.API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '')}/api/v1`
    }
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key'
      }
    },
    schemas: {
      Appointment: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          appointment_date: { type: 'string', format: 'date' },
          appointment_time: { type: 'string', example: '14:30' },
          duration: { type: 'integer' },
          payment_status: { type: 'string', enum: ['paid', 'unpaid'] },
          status: { type: 'string' },
          customers: { type: 'object' },
          services: { type: 'object' },
          pets: { type: 'object' }
        }
      },
      Customer: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          phone: { type: 'string' },
          address: { type: 'string' }
        }
      },
      Service: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          default_duration: { type: 'integer' },
          price: { type: 'number' },
          active: { type: 'boolean' },
          description: { type: 'string' }
        }
      }
    }
  },
  paths: {
    '/appointments': {
      get: {
        summary: 'List appointments',
        security: [{ ApiKeyAuth: [] }],
        responses: {
          200: {
            description: 'Array of appointments',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Appointment' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create appointment',
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Appointment' }
            }
          }
        },
        responses: {
          201: {
            description: 'Created appointment',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Appointment' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/appointments/{id}/status': {
      patch: {
        summary: 'Update appointment status',
        security: [{ ApiKeyAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { status: { type: 'string' } }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Updated appointment',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Appointment' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/customers': {
      get: {
        summary: 'List customers',
        security: [{ ApiKeyAuth: [] }],
        responses: {
          200: {
            description: 'Array of customers',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Customer' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create customer',
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Customer' }
            }
          }
        },
        responses: {
          201: {
            description: 'Created customer'
          }
        }
      }
    },
    '/customers/{id}': {
      patch: {
        summary: 'Update customer',
        security: [{ ApiKeyAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Customer' }
            }
          }
        },
        responses: { 200: { description: 'Updated customer' } }
      },
      delete: {
        summary: 'Delete customer',
        security: [{ ApiKeyAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } }
        ],
        responses: { 200: { description: 'Deleted' } }
      }
    },
    '/services': {
      get: {
        summary: 'List services',
        security: [{ ApiKeyAuth: [] }],
        responses: {
          200: {
            description: 'Array of services',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Service' } }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create service',
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Service' }
            }
          }
        },
        responses: { 201: { description: 'Created service' } }
      }
    },
    '/services/{id}': {
      patch: {
        summary: 'Update service',
        security: [{ ApiKeyAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Service' }
            }
          }
        },
        responses: { 200: { description: 'Updated service' } }
      },
      delete: {
        summary: 'Delete service',
        security: [{ ApiKeyAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } }
        ],
        responses: { 200: { description: 'Deleted service' } }
      }
    }
  }
}

const swaggerOptions = {
  definition: swaggerDefinition,
  apis: [] // could be extended with JSDoc annotations for auto-generation
}

const swaggerSpec = swaggerJsdoc(swaggerOptions)
// Serve Swagger under the API prefix so proxies that forward `/api/*` also expose the docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec))
// Backwards compatibility: old /docs path now redirects to /api/docs
app.get('/docs', (_req, res) => res.redirect(301, '/api/docs'))
app.get('/docs.json', (_req, res) => res.redirect(301, '/api/docs.json'))

// Versioned routes (add /api/v2 later if needed)
app.get('/api/v1/health', (_req, res) => res.json({ ok: true }))
app.use('/api/v1', authRouter)
app.use('/api/v1/appointments', appointmentsRouter)
app.use('/api/v1/customers', customersRouter)
app.use('/api/v1/services', servicesRouter)

export default app
