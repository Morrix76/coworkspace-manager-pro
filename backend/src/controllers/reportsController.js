import prisma from '../config/database.js'

export const getOverviewStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    
    const dateFilter = startDate && endDate ? {
      gte: new Date(startDate),
      lte: new Date(endDate)
    } : undefined

    const [
      totalRevenue,
      totalBookings,
      activeClients,
      totalSpaces,
      occupancyData
    ] = await Promise.all([
      prisma.booking.aggregate({
        where: {
          status: { notIn: ['CANCELLED'] },
          ...(dateFilter && { startDateTime: dateFilter })
        },
        _sum: { totalAmount: true }
      }),
      prisma.booking.count({
        where: {
          status: { notIn: ['CANCELLED'] },
          ...(dateFilter && { startDateTime: dateFilter })
        }
      }),
      prisma.client.count({ where: { active: true } }),
      prisma.space.count({ where: { active: true } }),
      getOccupancyRate(dateFilter)
    ])

    res.json({
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      totalBookings,
      activeClients,
      totalSpaces,
      occupancyRate: occupancyData
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
}

export const getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    
    const bookings = await prisma.booking.findMany({
      where: {
        startDateTime: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        },
        status: { notIn: ['CANCELLED'] }
      },
      select: {
        startDateTime: true,
        totalAmount: true,
        space: { select: { type: true } }
      },
      orderBy: { startDateTime: 'asc' }
    })
    
    // Group by day
    const dailyRevenue = {}
    
    bookings.forEach(booking => {
      const date = new Date(booking.startDateTime).toISOString().split('T')[0]
      
      if (!dailyRevenue[date]) {
        dailyRevenue[date] = { date, revenue: 0 }
      }
      
      dailyRevenue[date].revenue += booking.totalAmount
    })
    
    const daily = Object.values(dailyRevenue).sort((a, b) => new Date(a.date) - new Date(b.date))
    
    // Group by space type
    const byType = {}
    bookings.forEach(booking => {
      const type = booking.space.type
      if (!byType[type]) byType[type] = 0
      byType[type] += booking.totalAmount
    })

    res.json({
      daily,
      byType,
      total: bookings.reduce((sum, b) => sum + b.totalAmount, 0)
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
}

export const getOccupancyReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    
    const bookings = await prisma.booking.findMany({
      where: {
        startDateTime: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        },
        status: { notIn: ['CANCELLED'] }
      },
      include: { space: true }
    })
    
    // Calculate daily occupancy
    const dailyOccupancy = {}
    const spaces = await prisma.space.findMany({ where: { active: true } })
    const totalSpaces = spaces.length
    
    // Initialize all days with 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0]
      dailyOccupancy[dateKey] = { date: dateKey, occupancyRate: 0, bookings: 0 }
    }
    
    bookings.forEach(booking => {
      const date = new Date(booking.startDateTime).toISOString().split('T')[0]
      if (dailyOccupancy[date]) {
        dailyOccupancy[date].bookings++
      }
    })
    
    // Calculate occupancy rate (simplified: bookings per day / total spaces * 100)
    Object.values(dailyOccupancy).forEach(day => {
      day.occupancyRate = totalSpaces > 0 ? (day.bookings / totalSpaces) * 100 : 0
      if (day.occupancyRate > 100) day.occupancyRate = 100 // Cap at 100%
    })
    
    const daily = Object.values(dailyOccupancy).sort((a, b) => new Date(a.date) - new Date(b.date))

    res.json({
      daily,
      averageOccupancy: daily.reduce((sum, d) => sum + d.occupancyRate, 0) / daily.length || 0
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
}

export const getClientsReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    
    // Client segments
    const segments = await prisma.client.groupBy({
      by: ['segment'],
      where: { active: true },
      _count: { segment: true }
    })
    
    const segmentData = segments.map(s => ({
      name: s.segment,
      count: s._count.segment
    }))
    
    // Top clients by revenue
    const topClients = await prisma.client.findMany({
      where: { active: true },
      include: {
        bookings: {
          where: {
            status: { notIn: ['CANCELLED'] },
            ...(startDate && endDate && {
              startDateTime: {
                gte: new Date(startDate),
                lte: new Date(endDate)
              }
            })
          }
        }
      }
    })
    
    const clientStats = topClients.map(client => ({
      id: client.id,
      name: client.name,
      company: client.company,
      bookingsCount: client.bookings.length,
      totalRevenue: client.bookings.reduce((sum, b) => sum + b.totalAmount, 0)
    }))
    .filter(c => c.totalRevenue > 0)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10)

    res.json({
      segments: segmentData,
      topClients: clientStats,
      totalClients: topClients.length
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
}

export const getSpacesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    
    // Space types distribution
    const types = await prisma.space.groupBy({
      by: ['type'],
      where: { active: true },
      _count: { type: true }
    })
    
    // Space usage stats
    const spaces = await prisma.space.findMany({
      where: { active: true },
      include: {
        bookings: {
          where: {
            status: { notIn: ['CANCELLED'] },
            ...(startDate && endDate && {
              startDateTime: {
                gte: new Date(startDate),
                lte: new Date(endDate)
              }
            })
          }
        }
      }
    })
    
    const spaceStats = spaces.map(space => {
      const totalHours = space.bookings.reduce((sum, booking) => {
        const hours = (new Date(booking.endDateTime) - new Date(booking.startDateTime)) / (1000 * 60 * 60)
        return sum + hours
      }, 0)
      
      return {
        id: space.id,
        name: space.name,
        type: space.type,
        bookingsCount: space.bookings.length,
        totalHours: Math.round(totalHours * 10) / 10,
        revenue: space.bookings.reduce((sum, b) => sum + b.totalAmount, 0)
      }
    })
    .sort((a, b) => b.bookingsCount - a.bookingsCount)
    .slice(0, 10)
    
    // Bookings by space type
    const typeBookings = {}
    spaces.forEach(space => {
      if (!typeBookings[space.type]) {
        typeBookings[space.type] = 0
      }
      typeBookings[space.type] += space.bookings.length
    })
    
    const typeData = Object.entries(typeBookings).map(([type, bookings]) => ({
      name: type,
      bookings
    }))

    res.json({
      types: typeData,
      topSpaces: spaceStats,
      totalSpaces: spaces.length
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
}

export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
    
    const [
      totalSpaces,
      totalClients,
      todayBookings,
      todayRevenue,
      activeContracts,
      pendingInvoices
    ] = await Promise.all([
      prisma.space.count({ where: { active: true } }),
      prisma.client.count({ where: { active: true } }),
      prisma.booking.count({
        where: {
          startDateTime: { gte: startOfDay, lt: endOfDay },
          status: { not: 'CANCELLED' }
        }
      }),
      prisma.booking.aggregate({
        where: {
          startDateTime: { gte: startOfDay, lt: endOfDay },
          status: { not: 'CANCELLED' }
        },
        _sum: { totalAmount: true }
      }),
      prisma.contract.count({ where: { status: 'ACTIVE' } }),
      prisma.invoice.count({ where: { status: 'PENDING' } })
    ])

    res.json({
      totalSpaces,
      totalClients,
      todayBookings,
      todayRevenue: todayRevenue._sum.totalAmount || 0,
      activeContracts,
      pendingInvoices
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
}

export const exportReport = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query
    
    let data = []
    let filename = `report_${type}`
    
    switch (type) {
      case 'revenue':
        const revenueReport = await getRevenueData(startDate, endDate)
        data = revenueReport.daily
        filename = 'revenue_report'
        break
        
      case 'occupancy':
        const occupancyReport = await getOccupancyData(startDate, endDate)
        data = occupancyReport.daily
        filename = 'occupancy_report'
        break
        
      case 'clients':
        const clientsData = await getClientsData(startDate, endDate)
        data = clientsData.topClients
        filename = 'clients_report'
        break
        
      case 'spaces':
        const spacesData = await getSpacesData(startDate, endDate)
        data = spacesData.topSpaces
        filename = 'spaces_report'
        break
        
      default:
        const overviewData = await getOverviewData(startDate, endDate)
        data = [overviewData]
        filename = 'overview_report'
    }
    
    // Generate CSV
    const csv = generateCSV(data)
    
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}_${startDate}_${endDate}.csv"`)
    res.send(csv)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
}

// Helper functions
async function getOccupancyRate(dateFilter) {
  const bookings = await prisma.booking.count({
    where: {
      status: { notIn: ['CANCELLED'] },
      ...(dateFilter && { startDateTime: dateFilter })
    }
  })
  
  const totalSpaces = await prisma.space.count({ where: { active: true } })
  
  if (totalSpaces === 0) return 0
  
  const days = dateFilter ? 
    Math.ceil((new Date(dateFilter.lte) - new Date(dateFilter.gte)) / (1000 * 60 * 60 * 24)) : 30
  
  const maxPossibleBookings = totalSpaces * days
  return maxPossibleBookings > 0 ? (bookings / maxPossibleBookings) * 100 : 0
}

async function getRevenueData(startDate, endDate) {
  // Reuse logic from getRevenueReport
  return { daily: [] } // Simplified
}

async function getOccupancyData(startDate, endDate) {
  return { daily: [] } // Simplified
}

async function getClientsData(startDate, endDate) {
  return { topClients: [] } // Simplified
}

async function getSpacesData(startDate, endDate) {
  return { topSpaces: [] } // Simplified
}

async function getOverviewData(startDate, endDate) {
  return {} // Simplified
}

function generateCSV(data) {
  if (!data || data.length === 0) return ''
  
  const headers = Object.keys(data[0]).join(',')
  const rows = data.map(row => 
    Object.values(row).map(value => 
      typeof value === 'string' ? `"${value}"` : value
    ).join(',')
  )
  
  return [headers, ...rows].join('\n')
}