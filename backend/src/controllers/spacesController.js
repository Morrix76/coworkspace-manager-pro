import prisma from '../config/database.js'

const SPACE_TYPES = ['OFFICE', 'MEETING_ROOM', 'COWORKING', 'EVENT_SPACE']

const normalizeAmenities = (amenities) => {
  if (amenities == null) return undefined
  if (Array.isArray(amenities)) return amenities
  if (typeof amenities === 'string') {
    return amenities.split(',').map((item) => item.trim()).filter(Boolean)
  }
  return []
}

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

    const where = {}

    if (type) {
      where.type = type
    }

    if (available === 'true') {
      where.active = true
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

    const space = await prisma.space.findUnique({
      where: { id },
      include: {
        bookings: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            client: {
              select: {
                id: true,
                name: true,
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
      active,
      isActive
    } = req.body

    if (!name || !type || capacity === undefined || hourlyRate === undefined) {
      return res.status(400).json({
        error: 'Name, type, capacity, and hourly rate are required'
      })
    }

    if (!SPACE_TYPES.includes(type)) {
      return res.status(400).json({
        error: `Invalid space type. Allowed: ${SPACE_TYPES.join(', ')}`
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
        description: description || null,
        amenities: normalizeAmenities(amenities) ?? [],
        ...((active !== undefined || isActive !== undefined) && {
          active: Boolean(active !== undefined ? active : isActive)
        })
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
      active,
      isActive
    } = req.body

    const existingSpace = await prisma.space.findUnique({
      where: { id }
    })

    if (!existingSpace) {
      return res.status(404).json({ error: 'Space not found' })
    }

    if (type !== undefined && !SPACE_TYPES.includes(type)) {
      return res.status(400).json({
        error: `Invalid space type. Allowed: ${SPACE_TYPES.join(', ')}`
      })
    }

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (type !== undefined) updateData.type = type
    if (capacity !== undefined) updateData.capacity = parseInt(capacity)
    if (hourlyRate !== undefined) updateData.hourlyRate = parseFloat(hourlyRate)
    if (dailyRate !== undefined) updateData.dailyRate = parseFloat(dailyRate)
    if (monthlyRate !== undefined) updateData.monthlyRate = parseFloat(monthlyRate)
    if (description !== undefined) updateData.description = description
    if (amenities !== undefined) updateData.amenities = normalizeAmenities(amenities)
    if (active !== undefined) updateData.active = Boolean(active)
    else if (isActive !== undefined) updateData.active = Boolean(isActive)

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

    const space = await prisma.space.findUnique({
      where: { id }
    })

    if (!space) {
      return res.status(404).json({ error: 'Space not found' })
    }

    const activeBookings = await prisma.booking.count({
      where: {
        spaceId: id,
        status: { in: ['CONFIRMED', 'CHECKED_IN'] },
        endDateTime: { gte: new Date() }
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

    const space = await prisma.space.findUnique({
      where: { id }
    })

    if (!space) {
      return res.status(404).json({ error: 'Space not found' })
    }

    const rangeStart = new Date(startDate)
    const rangeEnd = new Date(endDate)

    const bookings = await prisma.booking.findMany({
      where: {
        spaceId: id,
        status: { in: ['CONFIRMED', 'CHECKED_IN'] },
        startDateTime: { lt: rangeEnd },
        endDateTime: { gt: rangeStart }
      },
      select: {
        startDateTime: true,
        endDateTime: true,
        status: true
      },
      orderBy: { startDateTime: 'asc' }
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

    const space = await prisma.space.findUnique({
      where: { id }
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
      utilizationRate: 0
    })
  } catch (error) {
    console.error('Get space stats error:', error)
    res.status(500).json({ error: 'Failed to get space stats' })
  }
}

// GET /spaces/types - Tipi di spazio disponibili
export const getSpaceTypes = async (req, res) => {
  try {
    res.json(SPACE_TYPES)
  } catch (error) {
    console.error('Get space types error:', error)
    res.status(500).json({ error: 'Failed to get space types' })
  }
}
