import prisma from '../config/database.js'

const DEMO_LIMITS = {
  clients: { limit: 5, prismaModel: 'client' },
  spaces: { limit: 5, prismaModel: 'space' },
  bookings: { limit: 10, prismaModel: 'booking' },
  contracts: { limit: 5, prismaModel: 'contract' },
  invoices: { limit: 5, prismaModel: 'invoice' }
}

const READ_ONLY_EDIT = {
  error: 'DEMO_READ_ONLY',
  message: 'Editing is disabled in demo mode. Contact info@diasai.xyz for full access.'
}

const READ_ONLY_DELETE = {
  error: 'DEMO_READ_ONLY',
  message: 'Deleting is disabled in demo mode. Contact info@diasai.xyz for full access.'
}

function resolvePostEntity(req) {
  const base = req.baseUrl || ''
  const path = req.path || '/'

  if (base.endsWith('/clients')) return 'clients'
  if (base.endsWith('/spaces')) return 'spaces'
  if (base.endsWith('/bookings')) return 'bookings'
  if (base.endsWith('/contracts')) return 'contracts'
  if (base.endsWith('/billing')) {
    if (path === '/invoices' || path === '/generate-from-bookings') {
      return 'invoices'
    }
  }

  return null
}

export async function demoMode(req, res, next) {
  if (process.env.DEMO_MODE !== 'true') {
    return next()
  }

  const method = req.method.toUpperCase()

  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return next()
  }

  if (method === 'PUT' || method === 'PATCH') {
    return res.status(403).json(READ_ONLY_EDIT)
  }

  if (method === 'DELETE') {
    return res.status(403).json(READ_ONLY_DELETE)
  }

  if (method === 'POST') {
    const entity = resolvePostEntity(req)
    if (!entity) {
      return next()
    }

    const { limit, prismaModel } = DEMO_LIMITS[entity]
    const count = await prisma[prismaModel].count()

    if (count >= limit) {
      return res.status(403).json({
        error: 'DEMO_LIMIT_REACHED',
        message: `Demo limit reached: maximum ${limit} ${entity}. Contact info@diasai.xyz for full access.`,
        limit,
        entity
      })
    }
  }

  return next()
}
