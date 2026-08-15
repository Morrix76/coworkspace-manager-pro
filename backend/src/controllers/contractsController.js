import prisma from '../config/database.js'

export const getContracts = async (req, res) => {
  try {
    const { status, clientId } = req.query
    
    const where = {}
    if (status) where.status = status
    if (clientId) where.clientId = clientId

    const contracts = await prisma.contract.findMany({
      where,
      include: { client: true },
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
      include: { client: true }
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
    const contract = await prisma.contract.create({
      data: req.body,
      include: { client: true }
    })
    res.status(201).json(contract)
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

export const updateContract = async (req, res) => {
  try {
    const contract = await prisma.contract.update({
      where: { id: req.params.id },
      data: req.body,
      include: { client: true }
    })
    res.json(contract)
  } catch (error) {
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