// Polar Copilot Middleware - Main Entry
// KRA Validation + Digicust Classification
// Client files MANUALLY in iCMS

const express = require('express')
const cors = require('cors')
require('dotenv').config()

const validateRoute = require('./routes/validate')
const digicustRoute = require('./routes/digicust')
const packRoute = require('./routes/pack')

const app = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
  res.json({
    status: 'Polar Copilot Middleware Running',
    version: '1.0.0',
    mode: 'Manual Filing - Client files in iCMS',
    endpoints: [
      'POST /api/validate',
      'GET /api/validate/test',
      'POST /api/digicust/upload',
      'GET /api/digicust/result/:id',
      'POST /api/digicust/webhook',
      'POST /api/pack/generate'
    ]
  })
})

app.use('/api/validate', validateRoute)
app.use('/api/digicust', digicustRoute)
app.use('/api/pack', packRoute)

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found: ' + req.path })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Polar Copilot Middleware running on port ${PORT}`)
})
