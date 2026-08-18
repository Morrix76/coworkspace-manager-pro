import prisma from '../config/database.js'

const CONTRACT_TYPES = ['DOMICILIATION', 'VIRTUAL_OFFICE', 'LONG_TERM_RENTAL']
const CONTRACT_STATUSES = ['ACTIVE', 'EXPIRED', 'CANCELLED']

const buildContractData = (body) => {
  const { clientId, type, startDate, endDate, amount, status, content, signedDate } = body
  const data = {}

  if (clientId !== undefined) data.clientId = clientId
  if (type !== undefined) data.type = type
  if (startDate !== undefined) data.startDate = new Date(startDate)
  if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null
  if (amount !== undefined) data.amount = parseFloat(amount)
  if (status !== undefined) data.status = status
  if (content !== undefined) data.content = content
  if (signedDate !== undefined) data.signedDate = signedDate ? new Date(signedDate) : null

  return data
}

export const getContracts = async (req, res) => {
  try {
    const { status, clientId } = req.query
    
    const where = {}
    if (status) where.status = status
    if (clientId) where.clientId = clientId

    const contracts = await prisma.contract.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true, email: true, company: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    res.json(contracts)
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

export const getContract = async (req, res) => {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: req.params.id },
      include: {
        client: {
          select: { id: true, name: true, email: true, company: true, vatNumber: true, address: true }
        }
      }
    })
    
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' })
    }
    
    res.json(contract)
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

export const createContract = async (req, res) => {
  try {
    const { clientId, type, startDate, amount, content, status } = req.body

    if (!clientId || !type || !startDate || amount === undefined || !content) {
      return res.status(400).json({
        error: 'clientId, type, startDate, amount, and content are required'
      })
    }

    if (!CONTRACT_TYPES.includes(type)) {
      return res.status(400).json({
        error: `Invalid contract type. Allowed: ${CONTRACT_TYPES.join(', ')}`
      })
    }

    if (status && !CONTRACT_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Invalid contract status. Allowed: ${CONTRACT_STATUSES.join(', ')}`
      })
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId }
    })

    if (!client) {
      return res.status(404).json({ error: 'Client not found' })
    }

    const contract = await prisma.contract.create({
      data: buildContractData(req.body),
      include: {
        client: {
          select: { id: true, name: true, email: true, company: true }
        }
      }
    })
    res.status(201).json(contract)
  } catch (error) {
    console.error('Create contract error:', error)
    res.status(500).json({ error: 'Server error' })
  }
}

export const updateContract = async (req, res) => {
  try {
    const { type, status } = req.body

    if (type && !CONTRACT_TYPES.includes(type)) {
      return res.status(400).json({
        error: `Invalid contract type. Allowed: ${CONTRACT_TYPES.join(', ')}`
      })
    }

    if (status && !CONTRACT_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Invalid contract status. Allowed: ${CONTRACT_STATUSES.join(', ')}`
      })
    }

    const existing = await prisma.contract.findUnique({
      where: { id: req.params.id }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Contract not found' })
    }

    const contract = await prisma.contract.update({
      where: { id: req.params.id },
      data: buildContractData(req.body),
      include: {
        client: {
          select: { id: true, name: true, email: true, company: true }
        }
      }
    })
    res.json(contract)
  } catch (error) {
    console.error('Update contract error:', error)
    res.status(500).json({ error: 'Server error' })
  }
}

export const signContract = async (req, res) => {
  try {
    const contract = await prisma.contract.update({
      where: { id: req.params.id },
      data: { 
        signedDate: new Date(),
        status: 'ACTIVE'
      }
    })
    res.json(contract)
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}
