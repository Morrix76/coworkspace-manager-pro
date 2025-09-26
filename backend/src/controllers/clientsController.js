import prisma from '../config/database.js'

// GET /clients - Lista clienti con filtri e paginazione
export const getClients = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      segment, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    const where = {
      organizationId: req.user.organizationId
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } }
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
      where: { 
        id,
        organizationId: req.user.organizationId
      },
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
      firstName,
      lastName,
      email,
      phone,
      company,
      address,
      city,
      state,
      zipCode,
      country,
      notes,
      tags = [],
      preferredContact,
      marketingOptIn = false,
      creditLimit,
      paymentTerms = 30
    } = req.body

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ 
        error: 'First name, last name, and email are required' 
      })
    }

    // Check if email already exists in organization
    const existingClient = await prisma.client.findFirst({
      where: {
        email,
        organizationId: req.user.organizationId
      }
    })

    if (existingClient) {
      return res.status(409).json({ 
        error: 'A client with this email already exists' 
      })
    }

    const client = await prisma.client.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        company,
        address,
        city,
        state,
        zipCode,
        country,
        notes,
        tags: Array.isArray(tags) ? tags.join(',') : tags,
        preferredContact,
        marketingOptIn,
        creditLimit: creditLimit ? parseFloat(creditLimit) : null,
        paymentTerms: parseInt(paymentTerms),
        organizationId: req.user.organizationId
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
      firstName,
      lastName,
      email,
      phone,
      company,
      address,
      city,
      state,
      zipCode,
      country,
      notes,
      tags,
      preferredContact,
      marketingOptIn,
      creditLimit,
      paymentTerms
    } = req.body

    // Check if client exists and belongs to organization
    const existingClient = await prisma.client.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    })

    if (!existingClient) {
      return res.status(404).json({ error: 'Client not found' })
    }

    // Check email uniqueness if email is being changed
    if (email && email !== existingClient.email) {
      const emailExists = await prisma.client.findFirst({
        where: {
          email,
          organizationId: req.user.organizationId,
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
    if (firstName !== undefined) updateData.firstName = firstName
    if (lastName !== undefined) updateData.lastName = lastName
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (company !== undefined) updateData.company = company
    if (address !== undefined) updateData.address = address
    if (city !== undefined) updateData.city = city
    if (state !== undefined) updateData.state = state
    if (zipCode !== undefined) updateData.zipCode = zipCode
    if (country !== undefined) updateData.country = country
    if (notes !== undefined) updateData.notes = notes
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags.join(',') : tags
    if (preferredContact !== undefined) updateData.preferredContact = preferredContact
    if (marketingOptIn !== undefined) updateData.marketingOptIn = marketingOptIn
    if (creditLimit !== undefined) updateData.creditLimit = creditLimit ? parseFloat(creditLimit) : null
    if (paymentTerms !== undefined) updateData.paymentTerms = parseInt(paymentTerms)

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

    // Check if client exists and belongs to organization
    const client = await prisma.client.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    })

    if (!client) {
      return res.status(404).json({ error: 'Client not found' })
    }

    // Check if client has active bookings or contracts
    const activeRelations = await prisma.client.findFirst({
      where: { id },
      include: {
        bookings: {
          where: {
            status: { in: ['CONFIRMED', 'PENDING'] }
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
        organizationId: req.user.organizationId,
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { company: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: parseInt(limit),
      select: {
        id: true,
        firstName: true,
        lastName: true,
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

    const client = await prisma.client.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId
      }
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
      where: {
        organizationId: req.user.organizationId
      },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        company: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        createdAt: true
      }
    })

    if (format === 'csv') {
      const csvHeader = 'First Name,Last Name,Email,Phone,Company,Address,City,State,ZIP,Country,Created At\n'
      const csvData = clients.map(client => 
        `"${client.firstName}","${client.lastName}","${client.email}","${client.phone || ''}","${client.company || ''}","${client.address || ''}","${client.city || ''}","${client.state || ''}","${client.zipCode || ''}","${client.country || ''}","${client.createdAt}"`
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
    const csvHeader = 'First Name,Last Name,Email,Phone,Company,Address,City,State,ZIP,Country\n'
    const csvExample = '"John","Doe","john@example.com","555-1234","Acme Corp","123 Main St","New York","NY","10001","USA"\n'
    
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

    const where = {
      clientId: id,
      organizationId: req.user.organizationId
    }

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
      where: {
        clientId: id,
        organizationId: req.user.organizationId
      },
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

    const where = {
      clientId: id,
      organizationId: req.user.organizationId
    }

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