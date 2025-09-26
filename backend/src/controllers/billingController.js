import prisma from '../config/database.js'

export const getInvoices = async (req, res) => {
  try {
    const { 
      status, 
      clientId, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 50 
    } = req.query
    
    const where = {}
    if (status) where.status = status
    if (clientId) where.clientId = clientId
    
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const skip = (page - 1) * limit
    const take = parseInt(limit)

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take,
        include: {
          client: { select: { id: true, name: true, email: true, company: true } },
          booking: { 
            include: { 
              space: { select: { id: true, name: true, type: true } } 
            } 
          },
          payments: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.invoice.count({ where })
    ])
    
    res.json({
      data: invoices,
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

export const getInvoice = async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        client: true,
        booking: { include: { space: true } },
        payments: true
      }
    })
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' })
    }
    
    res.json(invoice)
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

export const createInvoice = async (req, res) => {
  try {
    const { clientId, bookingId, amount, taxAmount, dueDate, notes } = req.body
    
    // Generate invoice number
    const invoiceCount = await prisma.invoice.count()
    const invoiceNumber = `INV-${new Date().getFullYear()}-${(invoiceCount + 1).toString().padStart(4, '0')}`
    
    // Validate client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    })
    
    if (!client) {
      return res.status(404).json({ error: 'Cliente non trovato' })
    }
    
    // Validate booking if provided
    if (bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId }
      })
      
      if (!booking) {
        return res.status(404).json({ error: 'Prenotazione non trovata' })
      }
      
      if (booking.clientId !== clientId) {
        return res.status(400).json({ error: 'Prenotazione non appartiene al cliente' })
      }
    }
    
    const invoice = await prisma.invoice.create({
      data: {
        number: invoiceNumber,
        clientId,
        bookingId: bookingId || null,
        amount: parseFloat(amount),
        taxAmount: parseFloat(taxAmount) || 0,
        dueDate: new Date(dueDate),
        notes: notes || null,
        status: 'PENDING'
      },
      include: {
        client: { select: { id: true, name: true, email: true, company: true } },
        booking: { 
          include: { 
            space: { select: { id: true, name: true, type: true } } 
          } 
        }
      }
    })
    
    res.status(201).json(invoice)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
}

export const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params
    const { amount, taxAmount, dueDate, notes } = req.body
    
    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        amount: amount ? parseFloat(amount) : undefined,
        taxAmount: taxAmount ? parseFloat(taxAmount) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        notes: notes !== undefined ? notes : undefined
      },
      include: {
        client: { select: { id: true, name: true, email: true, company: true } },
        booking: { 
          include: { 
            space: { select: { id: true, name: true, type: true } } 
          } 
        }
      }
    })
    
    res.json(invoice)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
}

export const markAsPaid = async (req, res) => {
  try {
    const { id } = req.params
    
    const invoice = await prisma.invoice.findUnique({
      where: { id }
    })
    
    if (!invoice) {
      return res.status(404).json({ error: 'Fattura non trovata' })
    }
    
    if (invoice.status === 'PAID') {
      return res.status(400).json({ error: 'Fattura già pagata' })
    }
    
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: 'PAID',
        paidDate: new Date()
      },
      include: {
        client: { select: { id: true, name: true, email: true, company: true } }
      }
    })
    
    res.json(updatedInvoice)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
}

export const generateFromBookings = async (req, res) => {
  try {
    // Find completed bookings without invoices
    const bookingsWithoutInvoices = await prisma.booking.findMany({
      where: {
        status: 'CHECKED_OUT',
        invoice: null
      },
      include: {
        client: true,
        space: true
      }
    })
    
    let generated = 0
    
    for (const booking of bookingsWithoutInvoices) {
      try {
        const invoiceCount = await prisma.invoice.count()
        const invoiceNumber = `INV-${new Date().getFullYear()}-${(invoiceCount + 1).toString().padStart(4, '0')}`
        
        await prisma.invoice.create({
          data: {
            number: invoiceNumber,
            clientId: booking.clientId,
            bookingId: booking.id,
            amount: booking.totalAmount,
            taxAmount: Math.round(booking.totalAmount * 0.22 * 100) / 100, // 22% IVA
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 giorni
            status: 'PENDING'
          }
        })
        
        generated++
      } catch (error) {
        console.error(`Error generating invoice for booking ${booking.id}:`, error)
      }
    }
    
    res.json({ 
      message: `Generate ${generated} fatture`,
      count: generated,
      total: bookingsWithoutInvoices.length
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
}

export const getInvoicePDF = async (req, res) => {
  try {
    const { id } = req.params
    
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        booking: { include: { space: true } }
      }
    })
    
    if (!invoice) {
      return res.status(404).json({ error: 'Fattura non trovata' })
    }
    
    // Qui dovresti integrare una libreria PDF come puppeteer o jsPDF
    // Per ora restituisco un placeholder
    const pdfContent = generateInvoicePDF(invoice)
    
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="fattura_${invoice.number}.pdf"`)
    res.send(pdfContent)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
}

export const sendInvoiceEmail = async (req, res) => {
  try {
    const { id } = req.params
    
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        booking: { include: { space: true } }
      }
    })
    
    if (!invoice) {
      return res.status(404).json({ error: 'Fattura non trovata' })
    }
    
    // Qui dovresti integrare un servizio email come SendGrid o Nodemailer
    // Per ora simulo l'invio
    await simulateEmailSend(invoice)
    
    res.json({ message: 'Email inviata con successo' })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
}

export const getBillingStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    
    const where = {}
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }
    
    const [
      totalInvoices,
      pendingInvoices,
      paidInvoices,
      overdueInvoices,
      totalRevenue,
      pendingAmount,
      paidAmount
    ] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.count({ where: { ...where, status: 'PENDING' } }),
      prisma.invoice.count({ where: { ...where, status: 'PAID' } }),
      prisma.invoice.count({ 
        where: { 
          ...where, 
          status: 'PENDING',
          dueDate: { lt: new Date() }
        } 
      }),
      prisma.invoice.aggregate({
        where,
        _sum: { amount: true, taxAmount: true }
      }),
      prisma.invoice.aggregate({
        where: { ...where, status: 'PENDING' },
        _sum: { amount: true, taxAmount: true }
      }),
      prisma.invoice.aggregate({
        where: { ...where, status: 'PAID' },
        _sum: { amount: true, taxAmount: true }
      })
    ])
    
    res.json({
      totalInvoices,
      pendingInvoices,
      paidInvoices,
      overdueCount: overdueInvoices,
      totalRevenue: (totalRevenue._sum.amount || 0) + (totalRevenue._sum.taxAmount || 0),
      pendingAmount: (pendingAmount._sum.amount || 0) + (pendingAmount._sum.taxAmount || 0),
      paidAmount: (paidAmount._sum.amount || 0) + (paidAmount._sum.taxAmount || 0),
      collectionRate: totalInvoices > 0 ? ((paidInvoices / totalInvoices) * 100).toFixed(1) : 0
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
}

export const getPayments = async (req, res) => {
  try {
    const { invoiceId, status } = req.query
    
    const where = {}
    if (invoiceId) where.invoiceId = invoiceId
    if (status) where.status = status
    
    const payments = await prisma.payment.findMany({
      where,
      include: {
        invoice: { 
          include: { 
            client: { select: { id: true, name: true, email: true } } 
          } 
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    res.json(payments)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
}

export const createPayment = async (req, res) => {
  try {
    const { invoiceId, amount, method, stripeId } = req.body
    
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId }
    })
    
    if (!invoice) {
      return res.status(404).json({ error: 'Fattura non trovata' })
    }
    
    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        amount: parseFloat(amount),
        method,
        stripeId: stripeId || null,
        status: 'COMPLETED'
      },
      include: { 
        invoice: { 
          include: { 
            client: { select: { id: true, name: true, email: true } } 
          } 
        } 
      }
    })
    
    // Check if invoice is fully paid
    const totalPaid = await prisma.payment.aggregate({
      where: { invoiceId, status: 'COMPLETED' },
      _sum: { amount: true }
    })
    
    const totalDue = invoice.amount + invoice.taxAmount
    
    if ((totalPaid._sum.amount || 0) >= totalDue) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { 
          status: 'PAID',
          paidDate: new Date()
        }
      })
    }
    
    res.status(201).json(payment)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
}

// Helper functions (da implementare con librerie reali)
function generateInvoicePDF(invoice) {
  // Placeholder - integrare con puppeteer, jsPDF o simili
  return Buffer.from(`PDF Placeholder for Invoice ${invoice.number}`)
}

async function simulateEmailSend(invoice) {
  // Placeholder - integrare con SendGrid, Nodemailer o simili
  console.log(`Simulating email send for invoice ${invoice.number} to ${invoice.client.email}`)
  return true
}