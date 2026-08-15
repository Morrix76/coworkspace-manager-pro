import express from 'express'
import { getSpaces, getSpace, createSpace, updateSpace, deleteSpace } from '../controllers/spacesController.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = express.Router()

// Test endpoint senza auth
router.get('/test', async (req, res) => {
  res.json([
    { id: '1', name: 'Test Space', type: 'OFFICE', capacity: 1, hourlyRate: 15 }
  ])
})

// Routes autenticate
router.get('/', authenticate, getSpaces)
router.get('/:id', authenticate, getSpace)
router.post('/', authenticate, authorize(['ADMIN', 'MANAGER']), createSpace)
router.put('/:id', authenticate, authorize(['ADMIN', 'MANAGER']), updateSpace)
router.delete('/:id', authenticate, authorize(['ADMIN', 'MANAGER']), deleteSpace)

export default router