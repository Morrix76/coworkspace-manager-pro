import jwt from 'jsonwebtoken'
import prisma from '../config/database.js'

export const authenticate = async (req, res, next) => {
  try {
    console.log('=== AUTH DEBUG START ===')
    console.log('Headers:', req.headers.authorization)
    
    const token = req.header('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      console.log('No token provided')
      return res.status(401).json({ error: 'Access denied' })
    }

    console.log('Token found:', token.substring(0, 20) + '...')
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET)
    console.log('JWT_SECRET preview:', process.env.JWT_SECRET?.substring(0, 10) + '...')

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    console.log('Token decoded successfully:', decoded)

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { 
        id: true, 
        email: true, 
        firstName: true, 
        lastName: true, 
        role: true,
        organizationId: true
      }
    })

    console.log('Database query result:', user)

    if (!user) {
      console.log('User not found in database')
      return res.status(401).json({ error: 'User not found' })
    }

    console.log('Auth successful for user:', user.email)
    console.log('=== AUTH DEBUG END ===')
    
    req.user = user
    next()
  } catch (error) {
    console.log('Auth error:', error.message)
    console.log('Error details:', error)
    console.log('=== AUTH DEBUG END ===')
    res.status(401).json({ error: 'Invalid token' })
  }
}

export const authorize = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    next()
  }
}