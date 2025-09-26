import express from 'express'
import multer from 'multer'
import { 
  getClients, 
  getClient, 
  createClient, 
  updateClient, 
  deleteClient,
  getClientBookings,
  getClientContracts,
  getClientInvoices,
  searchClients,
  importClients,
  exportClients,
  getImportTemplate
} from '../controllers/clientsController.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = express.Router()

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true)
    } else {
      cb(new Error('Solo file CSV sono permessi'), false)
    }
  }
})

// Basic CRUD
router.get('/', authenticate, getClients)
router.get('/search', authenticate, searchClients)
router.get('/export', authenticate, authorize(['ADMIN', 'MANAGER']), exportClients)
router.get('/template', authenticate, authorize(['ADMIN', 'MANAGER']), getImportTemplate)
router.post('/', authenticate, createClient)
router.post('/import', authenticate, authorize(['ADMIN', 'MANAGER']), upload.single('file'), importClients)

// Client details
router.get('/:id', authenticate, getClient)
router.get('/:id/bookings', authenticate, getClientBookings)
router.get('/:id/contracts', authenticate, getClientContracts)
router.get('/:id/invoices', authenticate, getClientInvoices)

// Update/Delete
router.put('/:id', authenticate, updateClient)
router.delete('/:id', authenticate, authorize(['ADMIN', 'MANAGER']), deleteClient)

export default router