require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')

const app = express()

// Security headers
app.use(helmet())

// Rate limiting
// Global: 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
})
app.use('/api/', globalLimiter)

// Stricter limit on auth endpoints: 10 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later.' },
})
app.use('/api/auth/', authLimiter)

// CORS — allow frontend origin
const allowedOrigins = [
  'http://localhost:5173',
  'https://gfinthefield.com.au',
  'https://www.gfinthefield.com.au',
]
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error('CORS not allowed'))
  },
  credentials: true,
}))

app.use(express.json())

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/dashboard', require('./routes/dashboard'))
app.use('/api/rsms', require('./routes/rsms'))
app.use('/api/observations', require('./routes/observations'))
app.use('/api/areas', require('./routes/areas'))
app.use('/api/admin', require('./routes/admin'))
app.use('/api/login-tracking', require('./routes/login-tracking'))
app.use('/api/work-behind', require('./routes/workBehind'))
app.use('/api/admin/settings', require('./routes/settings'))
app.use('/api/admin', require('./routes/analytics'))

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }))

// 404
app.use((_req, res) => res.status(404).json({ error: 'Not found' }))

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`GF In The Field server running on port ${PORT}`)
})
