import express from 'express'
import { 
  getDashboardStats, 
  getOverviewStats,
  getOccupancyReport, 
  getRevenueReport,
  getClientsReport,
  getSpacesReport,
  exportReport
} from '../controllers/reportsController.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = express.Router()

// Dashboard stats (accessible to all authenticated users)
router.get('/dashboard', authenticate, getDashboardStats)

// Detailed reports (restricted to admin/manager)
router.get('/overview', authenticate, authorize(['ADMIN', 'MANAGER']), getOverviewStats)
router.get('/revenue', authenticate, authorize(['ADMIN', 'MANAGER']), getRevenueReport)
router.get('/occupancy', authenticate, authorize(['ADMIN', 'MANAGER']), getOccupancyReport)
router.get('/clients', authenticate, authorize(['ADMIN', 'MANAGER']), getClientsReport)
router.get('/spaces', authenticate, authorize(['ADMIN', 'MANAGER']), getSpacesReport)

// Export functionality
router.get('/export', authenticate, authorize(['ADMIN', 'MANAGER']), exportReport)

export default router