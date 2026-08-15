import prisma from '../config/database.js'

export const getBookings = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      spaceId, 
      status, 
      clientId,
      page = 1, 
      limit = 50 
    } = req.query
    
    const where = {}
    
    if (startDate && endDate) {
      where.OR = [
        {
          startDateTime: {
            gte: new Date(startDate),
            lt: new Date(endDate)
          }
        },
        {
          endDateTime: {
            gt: new Date(startDate),
            lte: new Date(endDate)
          }
        },
        {
          startDateTime: { lte: new Date(startDate) },
          endDateTime: { gte: new Date(endDate) }
        }
      ]
    }
    
    if (spaceId) where.spaceId = spaceId
    if (status) where.status = status
    if (clientId) where.clientId = clientId

    const skip = (page - 1) * limit
    const take = parseInt(limit)

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take,
        include: {
          space: { select: { id: true, name: true, type: true } },
          client: { select: { id: true, name: true, email: true, company: true } },
          invoice: { select: { id: true, number: true, status: true, amount: true } }
        },
        orderBy: { startDateTime: 'asc' }
      }),
      prisma.booking.count({ where })
    ])
    
    res.json({
      data: bookings,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take)
      }
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
}

export const getBooking = async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        space: true,
        client: true,
        invoice: true
      }
    })
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }
    
    res.json(booking)
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

export const createBooking = async (req, res) => {
  try {
    const { spaceId, clientId, startDateTime, endDateTime, notes } = req.body
    
    // Validate dates
    const start = new Date(startDateTime)
    const end = new Date(endDateTime)
    
    if (start >= end) {
      return res.status(400).json({ error: 'Data di fine deve essere successiva alla data di inizio' })
    }
    
    if (start < new Date()) {
      return res.status(400).json({ error: 'Non puoi creare prenotazioni nel passato' })
    }
    
    // Check space availability
    const conflict = await prisma.booking.findFirst({
      where: {
        spaceId,
        status: { notIn: ['CANCELLED', 'CHECKED_OUT'] },
        OR: [
          {
            startDateTime: { lt: end },
            endDateTime: { gt: start }
          }
        ]
      }
    })
    
    if (conflict) {
      return res.status(400).json({ 
        error: 'Spazio non disponibile in questo orario',
        conflictingBooking: {
          id: conflict.id,
          start: conflict.startDateTime,
          end: conflict.endDateTime
        }
      })
    }
    
    // Get space and calculate amount
    const space = await prisma.space.findUnique({ where: { id: spaceId } })
    if (!space) {
      return res.status(404).json({ error: 'Spazio non trovato' })
    }
    
    const hours = (end - start) / (1000 * 60 * 60)
    const totalAmount = Math.round(hours * space.hourlyRate * 100) / 100
    
    const booking = await prisma.booking.create({
      data: {
        spaceId,
        clientId,
        startDateTime: start,
        endDateTime: end,
        totalAmount,
        notes: notes || null,
        status: 'CONFIRMED'
      },
      include: {
        space: { select: { id: true, name: true, type: true } },
        client: { select: { id: true, name: true, email: true } }
      }
    })
    
    res.status(201).json(booking)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
}

export const updateBooking = async (req, res) => {
  try {
    const { id } = req.params
    const { spaceId, clientId, startDateTime, endDateTime, notes } = req.body
    
    // Get current booking
    const currentBooking = await prisma.booking.findUnique({
      where: { id }
    })
    
    if (!currentBooking) {
      return res.status(404).json({ error: 'Prenotazione non trovata' })
    }
    
    // Validate dates if provided
    if (startDateTime && endDateTime) {
      const start = new Date(startDateTime)
      const end = new Date(endDateTime)
      
      if (start >= end) {
        return res.status(400).json({ error: 'Data di fine deve essere successiva alla data di inizio' })
      }
      
      // Check for conflicts (exclude current booking)
      const conflict = await prisma.booking.findFirst({
        where: {
          id: { not: id },
          spaceId: spaceId || currentBooking.spaceId,
          status: { notIn: ['CANCELLED', 'CHECKED_OUT'] },
          OR: [
            {
              startDateTime: { lt: end },
              endDateTime: { gt: start }
            }
          ]
        }
      })
      
      if (conflict) {
        return res.status(400).json({ error: 'Spazio non disponibile in questo orario' })
      }
    }
    
    // Recalculate amount if times changed
    let updateData = { ...req.body }
    
    if (startDateTime && endDateTime) {
      const space = await prisma.space.findUnique({ 
        where: { id: spaceId || currentBooking.spaceId } 
      })
      const hours = (new Date(endDateTime) - new Date(startDateTime)) / (1000 * 60 * 60)
      updateData.totalAmount = Math.round(hours * space.hourlyRate * 100) / 100
    }
    
    const booking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        space: { select: { id: true, name: true, type: true } },
        client: { select: { id: true, name: true, email: true } }
      }
    })
    
    res.json(booking)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
}

export const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params
    
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { invoice: true }
    })
    
    if (!booking) {
      return res.status(404).json({ error: 'Prenotazione non trovata' })
    }
    
    // Check if can be deleted
    if (booking.status === 'CHECKED_IN') {
      return res.status(400).json({ error: 'Non puoi eliminare una prenotazione in corso' })
    }
    
    if (booking.invoice && booking.invoice.status === 'PAID') {
      return res.status(400).json({ error: 'Non puoi eliminare una prenotazione con fattura pagata' })
    }
    
    // Soft delete by setting status to cancelled
    await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' }
    })
    
    res.json({ message: 'Prenotazione cancellata' })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
}

export const checkIn = async (req, res) => {
  try {
    const { id } = req.params
    
    const booking = await prisma.booking.findUnique({
      where: { id }
    })
    
    if (!booking) {
      return res.status(404).json({ error: 'Prenotazione non trovata' })
    }
    
    if (booking.status !== 'CONFIRMED') {
      return res.status(400).json({ error: 'Solo prenotazioni confermate possono fare check-in' })
    }
    
    const now = new Date()
    const startTime = new Date(booking.startDateTime)
    
    // Allow check-in 15 minutes before start time
    if (now < new Date(startTime.getTime() - 15 * 60 * 1000)) {
      return res.status(400).json({ error: 'Check-in troppo presto' })
    }
    
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { 
        status: 'CHECKED_IN',
        updatedAt: now
      },
      include: {
        space: { select: { id: true, name: true, type: true } },
        client: { select: { id: true, name: true, email: true } }
      }
    })
    
    res.json(updatedBooking)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
}

export const checkOut = async (req, res) => {
  try {
    const { id } = req.params
    
    const booking = await prisma.booking.findUnique({
      where: { id }
    })
    
    if (!booking) {
      return res.status(404).json({ error: 'Prenotazione non trovata' })
    }
    
    if (booking.status !== 'CHECKED_IN') {
      return res.status(400).json({ error: 'Solo prenotazioni con check-in possono fare check-out' })
    }
    
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { 
        status: 'CHECKED_OUT',
        updatedAt: new Date()
      },
      include: {
        space: { select: { id: true, name: true, type: true } },
        client: { select: { id: true, name: true, email: true } }
      }
    })
    
    res.json(updatedBooking)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
}

export const getAvailability = async (req, res) => {
  try {
    const { spaceId, date } = req.query
    
    if (!spaceId || !date) {
      return res.status(400).json({ error: 'spaceId e date sono obbligatori' })
    }
    
    const targetDate = new Date(date)
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0))
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999))
    
    const bookings = await prisma.booking.findMany({
      where: {
        spaceId,
        status: { notIn: ['CANCELLED'] },
        OR: [
          {
            startDateTime: { gte: startOfDay, lt: endOfDay }
          },
          {
            endDateTime: { gt: startOfDay, lte: endOfDay }
          },
          {
            startDateTime: { lt: startOfDay },
            endDateTime: { gt: endOfDay }
          }
        ]
      },
      select: {
        startDateTime: true,
        endDateTime: true,
        status: true
      },
      orderBy: { startDateTime: 'asc' }
    })
    
    res.json({
      date: date,
      spaceId,
      bookings: bookings.map(booking => ({
        start: booking.startDateTime,
        end: booking.endDateTime,
        status: booking.status
      }))
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
}

export const getBookingStats = async (req, res) => {
  try {
    const { startDate, endDate, spaceId } = req.query
    
    const where = {}
    
    if (startDate && endDate) {
      where.startDateTime = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }
    
    if (spaceId) where.spaceId = spaceId
    
    const [
      totalBookings,
      confirmedBookings,
      checkedInBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue
    ] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.count({ where: { ...where, status: 'CONFIRMED' } }),
      prisma.booking.count({ where: { ...where, status: 'CHECKED_IN' } }),
      prisma.booking.count({ where: { ...where, status: 'CHECKED_OUT' } }),
      prisma.booking.count({ where: { ...where, status: 'CANCELLED' } }),
      prisma.booking.aggregate({
        where: { ...where, status: { notIn: ['CANCELLED'] } },
        _sum: { totalAmount: true }
      })
    ])
    
    res.json({
      totalBookings,
      confirmedBookings,
      checkedInBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      occupancyRate: totalBookings > 0 ? ((totalBookings - cancelledBookings) / totalBookings * 100).toFixed(1) : 0
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
}