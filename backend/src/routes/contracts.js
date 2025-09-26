import express from 'express'
import { getContracts, getContract, createContract, updateContract, signContract } from '../controllers/contractsController.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = express.Router()

router.get('/', authenticate, getContracts)
router.get('/:id', authenticate, getContract)
router.post('/', authenticate, authorize(['ADMIN', 'MANAGER']), createContract)
router.put('/:id', authenticate, authorize(['ADMIN', 'MANAGER']), updateContract)
router.patch('/:id/sign', authenticate, signContract)

export default router