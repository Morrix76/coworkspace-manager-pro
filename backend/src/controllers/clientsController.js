import prisma from '../config/database.js'

const resolveClientName = ({ name, firstName, lastName }) => {
  if (name) return name
  const parts = [firstName, lastName].filter(Boolean)
  return parts.length ? parts.join(' ') : undefined
}

// GET /clients - Lista clienti con filtri e paginazione
export const getClients = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    const where = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { vatNumber: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              bookings: true,
              contracts: true,
              invoices: true
            }
          }
        }
      }),
      prisma.client.count({ where })
    ])

    res.json({
      clients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Get clients error:', error)
    res.status(500).json({ error: 'Failed to fetch clients' })
  }
}

// GET /clients/:id - Dettaglio cliente
export const getClient = async (req, res) => {
  try {
    const { id } = req.params

    const client = await prisma.client.findFirst({
      where: { id },
      include: {
        bookings: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { space: true }
        },
        contracts: {
          take: 3,
          orderBy: { createdAt: 'desc' }
        },
        invoices: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            bookings: true,
            contracts: true,
            invoices: true
          }
        }
      }
    })

    if (!client) {
      return res.status(404).json({ error: 'Client not found' })
    }

    res.json(client)
  } catch (error) {
    console.error('Get client error:', error)
    res.status(500).json({ error: 'Failed to fetch client' })
  }
}

// POST /clients - Crea nuovo cliente
export const createClient = async (req, res) => {
  try {
    const {
      email,
      phone,
      company,
      vatNumber,
      address,
      notes,
      active
    } = req.body

    const name = resolveClientName(req.body)

    if (!name || !email) {
      return res.status(400).json({ 
        error: 'Name and email are required' 
      })
    }

    const existingClient = await prisma.client.findUnique({
      where: { email }
    })

    if (existingClient) {
      return res.status(409).json({ 
        error: 'A client with this email already exists' 
      })
    }

    const client = await prisma.client.create({
      data: {
        name,
        email,
        phone: phone || null,
        company: company || null,
        vatNumber: vatNumber || null,
        address: address || null,
        notes: notes || null,
        ...(active !== undefined && { active: Boolean(active) })
      }
    })

    res.status(201).json(client)
  } catch (error) {
    console.error('Create client error:', error)
    res.status(500).json({ error: 'Failed to create client' })
  }
}

// PUT /clients/:id - Aggiorna cliente
export const updateClient = async (req, res) => {
  try {
    const { id } = req.params
    const {
      email,
      phone,
      company,
      vatNumber,
      address,
      notes,
      active
    } = req.body

    const name = resolveClientName(req.body)

    const existingClient = await prisma.client.findUnique({
      where: { id }
    })

    if (!existingClient) {
      return res.status(404).json({ error: 'Client not found' })
    }

    if (email && email !== existingClient.email) {
      const emailExists = await prisma.client.findFirst({
        where: {
          email,
          id: { not: id }
        }
      })

      if (emailExists) {
        return res.status(409).json({ 
          error: 'A client with this email already exists' 
        })
      }
    }

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (company !== undefined) updateData.company = company
    if (vatNumber !== undefined) updateData.vatNumber = vatNumber
    if (address !== undefined) updateData.address = address
    if (notes !== undefined) updateData.notes = notes
    if (active !== undefined) updateData.active = Boolean(active)

    const client = await prisma.client.update({
      where: { id },
      data: updateData
    })

    res.json(client)
  } catch (error) {
    console.error('Update client error:', error)
    res.status(500).json({ error: 'Failed to update client' })
  }
}

// DELETE /clients/:id - Elimina cliente
export const deleteClient = async (req, res) => {
  try {
    const { id } = req.params

    const client = await prisma.client.findUnique({
      where: { id }
    })

    if (!client) {
      return res.status(404).json({ error: 'Client not found' })
    }

    const activeRelations = await prisma.client.findFirst({
      where: { id },
      include: {
        bookings: {
          where: {
            status: { in: ['CONFIRMED', 'CHECKED_IN'] }
          }
        },
        contracts: {
          where: {
            status: 'ACTIVE'
          }
        }
      }
    })

    if (activeRelations.bookings.length > 0 || activeRelations.contracts.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete client with active bookings or contracts' 
      })
    }

    await prisma.client.delete({
      where: { id }
    })

    res.json({ message: 'Client deleted successfully' })
  } catch (error) {
    console.error('Delete client error:', error)
    res.status(500).json({ error: 'Failed to delete client' })
  }
}

// GET /clients/search - Ricerca clienti
export const searchClients = async (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' })
    }

    const clients = await prisma.client.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { company: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
          { vatNumber: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: parseInt(limit),
      select: {
        id: true,
        name: true,
        email: true,
        company: true
      }
    })

    res.json(clients)
  } catch (error) {
    console.error('Search clients error:', error)
    res.status(500).json({ error: 'Failed to search clients' })
  }
}

// GET /clients/:id/stats - Statistiche cliente
export const getClientStats = async (req, res) => {
  try {
    const { id } = req.params

    const client = await prisma.client.findUnique({
      where: { id }
    })

    if (!client) {
      return res.status(404).json({ error: 'Client not found' })
    }

    const [
      totalBookings,
      totalSpent,
      activeContracts,
      lastBooking
    ] = await Promise.all([
      prisma.booking.count({
        where: { clientId: id }
      }),
      prisma.booking.aggregate({
        where: { clientId: id },
        _sum: { totalAmount: true }
      }),
      prisma.contract.count({
        where: { 
          clientId: id,
          status: 'ACTIVE'
        }
      }),
      prisma.booking.findFirst({
        where: { clientId: id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true, status: true }
      })
    ])

    res.json({
      totalBookings,
      totalSpent: totalSpent._sum.totalAmount || 0,
      activeContracts,
      lastBooking: lastBooking?.createdAt || null,
      lastBookingStatus: lastBooking?.status || null
    })
  } catch (error) {
    console.error('Get client stats error:', error)
    res.status(500).json({ error: 'Failed to fetch client stats' })
  }
}

// GET /clients/export - Esporta clienti 
export const exportClients = async (req, res) => {
  try {
    const { format = 'csv' } = req.query

    const clients = await prisma.client.findMany({
      select: {
        name: true,
        email: true,
        phone: true,
        company: true,
        vatNumber: true,
        address: true,
        notes: true,
        active: true,
        createdAt: true
      }
    })

    if (format === 'csv') {
      const csvHeader = 'Name,Email,Phone,Company,VAT Number,Address,Notes,Active,Created At\n'
      const csvData = clients.map(client => 
        `"${client.name}","${client.email}","${client.phone || ''}","${client.company || ''}","${client.vatNumber || ''}","${client.address || ''}","${client.notes || ''}","${client.active}","${client.createdAt}"`
      ).join('\n')

      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', 'attachment; filename="clients.csv"')
      res.send(csvHeader + csvData)
    } else {
      res.json(clients)
    }
  } catch (error) {
    console.error('Export clients error:', error)
    res.status(500).json({ error: 'Failed to export clients' })
  }
}

// POST /clients/import - Importa clienti
export const importClients = async (req, res) => {
  try {
    res.status(501).json({ error: 'Import functionality not implemented yet' })
  } catch (error) {
    console.error('Import clients error:', error)
    res.status(500).json({ error: 'Failed to import clients' })
  }
}

// GET /clients/template - Template per import
export const getImportTemplate = async (req, res) => {
  try {
    const csvHeader = 'Name,Email,Phone,Company,VAT Number,Address,Notes\n'
    const csvExample = '"John Doe","john@example.com","555-1234","Acme Corp","IT123456789","123 Main St","VIP client"\n'
    
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="clients_template.csv"')
    res.send(csvHeader + csvExample)
  } catch (error) {
    console.error('Get template error:', error)
    res.status(500).json({ error: 'Failed to get template' })
  }
}

// GET /clients/:id/bookings - Prenotazioni cliente
export const getClientBookings = async (req, res) => {
  try {
    const { id } = req.params
    const { limit = 10, status } = req.query

    const where = { clientId: id }

    if (status) {
      where.status = status
    }

    const bookings = await prisma.booking.findMany({
      where,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        space: {
          select: { id: true, name: true, type: true }
        }
      }
    })

    res.json(bookings)
  } catch (error) {
    console.error('Get client bookings error:', error)
    res.status(500).json({ error: 'Failed to fetch client bookings' })
  }
}

// GET /clients/:id/contracts - Contratti cliente
export const getClientContracts = async (req, res) => {
  try {
    const { id } = req.params

    const contracts = await prisma.contract.findMany({
      where: { clientId: id },
      orderBy: { createdAt: 'desc' }
    })

    res.json(contracts)
  } catch (error) {
    console.error('Get client contracts error:', error)
    res.status(500).json({ error: 'Failed to fetch client contracts' })
  }
}

// GET /clients/:id/invoices - Fatture cliente
export const getClientInvoices = async (req, res) => {
  try {
    const { id } = req.params
    const { limit = 10, status } = req.query

    const where = { clientId: id }

    if (status) {
      where.status = status
    }

    const invoices = await prisma.invoice.findMany({
      where,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    })

    res.json(invoices)
  } catch (error) {
    console.error('Get client invoices error:', error)
    res.status(500).json({ error: 'Failed to fetch client invoices' })
  }
}
