import express from 'express'
import { 
  getInvoices, 
  getInvoice, 
  createInvoice, 
  updateInvoice,
  markAsPaid,
  generateFromBookings,
  getInvoicePDF,
  sendInvoiceEmail,
  getBillingStats,
  getPayments, 
  createPayment 
} from '../controllers/billingController.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = express.Router()

// Stats
router.get('/stats', authenticate, getBillingStats)

// Auto-generation
router.post('/generate-from-bookings', authenticate, authorize(['ADMIN', 'MANAGER']), generateFromBookings)

// Invoices CRUD
router.get('/invoices', authenticate, getInvoices)
router.get('/invoices/:id', authenticate, getInvoice)
router.post('/invoices', authenticate, authorize(['ADMIN', 'MANAGER']), createInvoice)
router.put('/invoices/:id', authenticate, authorize(['ADMIN', 'MANAGER']), updateInvoice)

// Invoice actions
router.patch('/invoices/:id/pay', authenticate, markAsPaid)
router.get('/invoices/:id/pdf', authenticate, getInvoicePDF)
router.post('/invoices/:id/send', authenticate, authorize(['ADMIN', 'MANAGER']), sendInvoiceEmail)

// Payments
router.get('/payments', authenticate, getPayments)
router.post('/payments', authenticate, createPayment)

export default router