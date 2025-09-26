import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'

import authRoutes from './routes/auth.js'
import spacesRoutes from './routes/spaces.js'
import bookingsRoutes from './routes/bookings.js'
import clientsRoutes from './routes/clients.js'
import contractsRoutes from './routes/contracts.js'
import billingRoutes from './routes/billing.js'
import reportsRoutes from './routes/reports.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(helmet())
app.use(cors())
app.use(express.json())

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
})
app.use(limiter)

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Server OK' })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/spaces', spacesRoutes)
app.use('/api/bookings', bookingsRoutes)
app.use('/api/clients', clientsRoutes)
app.use('/api/contracts', contractsRoutes)
app.use('/api/billing', billingRoutes)
app.use('/api/reports', reportsRoutes)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})