import prisma from '../config/database.js'

// GET /spaces - Lista spazi con filtri
export const getSpaces = async (req, res) => {
  try {
    const { 
      type, 
      available, 
      minCapacity, 
      maxCapacity, 
      sortBy = 'name', 
      sortOrder = 'asc' 
    } = req.query

    const where = {
      organizationId: req.user.organizationId
    }

    if (type) {
      where.type = type
    }

    if (available === 'true') {
      where.isActive = true
    }

    if (minCapacity) {
      where.capacity = { ...where.capacity, gte: parseInt(minCapacity) }
    }

    if (maxCapacity) {
      where.capacity = { ...where.capacity, lte: parseInt(maxCapacity) }
    }

    const spaces = await prisma.space.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      include: {
        _count: {
          select: {
            bookings: true
          }
        }
      }
    })

    res.json(spaces)
  } catch (error) {
    console.error('Get spaces error:', error)
    res.status(500).json({ error: 'Failed to fetch spaces' })
  }
}

// GET /spaces/:id - Dettaglio spazio
export const getSpace = async (req, res) => {
  try {
    const { id } = req.params

    const space = await prisma.space.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId
      },
      include: {
        bookings: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            bookings: true
          }
        }
      }
    })

    if (!space) {
      return res.status(404).json({ error: 'Space not found' })
    }

    res.json(space)
  } catch (error) {
    console.error('Get space error:', error)
    res.status(500).json({ error: 'Failed to fetch space' })
  }
}

// POST /spaces - Crea nuovo spazio
export const createSpace = async (req, res) => {
  try {
    const {
      name,
      type,
      capacity,
      hourlyRate,
      dailyRate,
      monthlyRate,
      description,
      amenities = [],
      images = [],
      building,
      floor,
      room,
      minBookingHours = 1,
      maxBookingHours = 24,
      advanceBookingDays = 30,
      requiresApproval = false
    } = req.body

    if (!name || !type || !capacity || !hourlyRate) {
      return res.status(400).json({
        error: 'Name, type, capacity, and hourly rate are required'
      })
    }

    const space = await prisma.space.create({
      data: {
        name,
        type,
        capacity: parseInt(capacity),
        hourlyRate: parseFloat(hourlyRate),
        dailyRate: parseFloat(dailyRate || 0),
        monthlyRate: parseFloat(monthlyRate || 0),
        description,
        amenities: Array.isArray(amenities) ? amenities.join(',') : amenities,
        images: Array.isArray(images) ? images.join(',') : images,
        building,
        floor,
        room,
        minBookingHours: parseInt(minBookingHours),
        maxBookingHours: parseInt(maxBookingHours),
        advanceBookingDays: parseInt(advanceBookingDays),
        requiresApproval,
        organizationId: req.user.organizationId
      }
    })

    res.status(201).json(space)
  } catch (error) {
    console.error('Create space error:', error)
    res.status(500).json({ error: 'Failed to create space' })
  }
}

// PUT /spaces/:id - Aggiorna spazio
export const updateSpace = async (req, res) => {
  try {
    const { id } = req.params
    const {
      name,
      type,
      capacity,
      hourlyRate,
      dailyRate,
      monthlyRate,
      description,
      amenities,
      images,
      building,
      floor,
      room,
      minBookingHours,
      maxBookingHours,
      advanceBookingDays,
      requiresApproval,
      isActive
    } = req.body

    // Check if space exists and belongs to organization
    const existingSpace = await prisma.space.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    })

    if (!existingSpace) {
      return res.status(404).json({ error: 'Space not found' })
    }

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (type !== undefined) updateData.type = type
    if (capacity !== undefined) updateData.capacity = parseInt(capacity)
    if (hourlyRate !== undefined) updateData.hourlyRate = parseFloat(hourlyRate)
    if (dailyRate !== undefined) updateData.dailyRate = parseFloat(dailyRate)
    if (monthlyRate !== undefined) updateData.monthlyRate = parseFloat(monthlyRate)
    if (description !== undefined) updateData.description = description
    if (amenities !== undefined) updateData.amenities = Array.isArray(amenities) ? amenities.join(',') : amenities
    if (images !== undefined) updateData.images = Array.isArray(images) ? images.join(',') : images
    if (building !== undefined) updateData.building = building
    if (floor !== undefined) updateData.floor = floor
    if (room !== undefined) updateData.room = room
    if (minBookingHours !== undefined) updateData.minBookingHours = parseInt(minBookingHours)
    if (maxBookingHours !== undefined) updateData.maxBookingHours = parseInt(maxBookingHours)
    if (advanceBookingDays !== undefined) updateData.advanceBookingDays = parseInt(advanceBookingDays)
    if (requiresApproval !== undefined) updateData.requiresApproval = requiresApproval
    if (isActive !== undefined) updateData.isActive = isActive

    const space = await prisma.space.update({
      where: { id },
      data: updateData
    })

    res.json(space)
  } catch (error) {
    console.error('Update space error:', error)
    res.status(500).json({ error: 'Failed to update space' })
  }
}

// DELETE /spaces/:id - Elimina spazio
export const deleteSpace = async (req, res) => {
  try {
    const { id } = req.params

    // Check if space exists and belongs to organization
    const space = await prisma.space.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    })

    if (!space) {
      return res.status(404).json({ error: 'Space not found' })
    }

    // Check if space has active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        spaceId: id,
        status: { in: ['CONFIRMED', 'PENDING'] },
        endDate: { gte: new Date() }
      }
    })

    if (activeBookings > 0) {
      return res.status(400).json({
        error: 'Cannot delete space with active bookings'
      })
    }

    await prisma.space.delete({
      where: { id }
    })

    res.json({ message: 'Space deleted successfully' })
  } catch (error) {
    console.error('Delete space error:', error)
    res.status(500).json({ error: 'Failed to delete space' })
  }
}

// GET /spaces/:id/availability - Disponibilità spazio
export const getSpaceAvailability = async (req, res) => {
  try {
    const { id } = req.params
    const { startDate, endDate } = req.query

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Start date and end date are required'
      })
    }

    // Check if space exists and belongs to organization
    const space = await prisma.space.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    })

    if (!space) {
      return res.status(404).json({ error: 'Space not found' })
    }

    // Get existing bookings in the date range
    const bookings = await prisma.booking.findMany({
      where: {
        spaceId: id,
        status: { in: ['CONFIRMED', 'PENDING'] },
        OR: [
          {
            startDate: { lte: new Date(endDate) },
            endDate: { gte: new Date(startDate) }
          }
        ]
      },
      select: {
        startDate: true,
        endDate: true,
        status: true
      },
      orderBy: { startDate: 'asc' }
    })

    res.json({
      space: {
        id: space.id,
        name: space.name,
        type: space.type
      },
      bookings,
      available: bookings.length === 0
    })
  } catch (error) {
    console.error('Get space availability error:', error)
    res.status(500).json({ error: 'Failed to get space availability' })
  }
}

// GET /spaces/:id/stats - Statistiche spazio
export const getSpaceStats = async (req, res) => {
  try {
    const { id } = req.params

    // Check if space exists and belongs to organization
    const space = await prisma.space.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    })

    if (!space) {
      return res.status(404).json({ error: 'Space not found' })
    }

    const [
      totalBookings,
      totalRevenue,
      thisMonthBookings,
      thisMonthRevenue,
      averageBookingDuration
    ] = await Promise.all([
      prisma.booking.count({
        where: { spaceId: id }
      }),
      prisma.booking.aggregate({
        where: { spaceId: id },
        _sum: { totalAmount: true }
      }),
      prisma.booking.count({
        where: {
          spaceId: id,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      prisma.booking.aggregate({
        where: {
          spaceId: id,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: { totalAmount: true }
      }),
      prisma.booking.aggregate({
        where: { spaceId: id },
        _avg: {
          totalAmount: true
        }
      })
    ])

    res.json({
      totalBookings,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      thisMonthBookings,
      thisMonthRevenue: thisMonthRevenue._sum.totalAmount || 0,
      averageBookingValue: averageBookingDuration._avg.totalAmount || 0,
      utilizationRate: 0 // Would need more complex calculation
    })
  } catch (error) {
    console.error('Get space stats error:', error)
    res.status(500).json({ error: 'Failed to get space stats' })
  }
}

// GET /spaces/types - Tipi di spazio disponibili
export const getSpaceTypes = async (req, res) => {
  try {
    const types = [
      'OFFICE',
      'MEETING_ROOM', 
      'DESK',
      'PHONE_BOOTH',
      'EVENT_SPACE',
      'COMMON_AREA'
    ]

    res.json(types)
  } catch (error) {
    console.error('Get space types error:', error)
    res.status(500).json({ error: 'Failed to get space types' })
  }
}