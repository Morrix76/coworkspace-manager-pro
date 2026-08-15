import express from 'express'
import { 
  getBookings, 
  getBooking, 
  createBooking, 
  updateBooking, 
  deleteBooking,
  checkIn, 
  checkOut,
  getAvailability,
  getBookingStats
} from '../controllers/bookingsController.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = express.Router()

// Stats and utilities
router.get('/stats', authenticate, getBookingStats)
router.get('/availability', authenticate, getAvailability)

// CRUD
router.get('/', authenticate, getBookings)
router.get('/:id', authenticate, getBooking)
router.post('/', authenticate, createBooking)
router.put('/:id', authenticate, updateBooking)
router.delete('/:id', authenticate, authorize(['ADMIN', 'MANAGER']), deleteBooking)

// Check-in/out
router.patch('/:id/checkin', authenticate, checkIn)
router.patch('/:id/checkout', authenticate, checkOut)

export default router