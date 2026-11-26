
// POST /api/digicust/import - EAC Imports
// POST /api/digicust/export - EAC Exports
// POST /api/digicust/upload - Legacy / general upload
// POST /api/digicust/result/:id - Get Digicust result back
// POST /api/digicust/webhook - Digicust calls this when done
// Polar Copilot - Client files MANUALLY in iCMS / EAC customs portals. This file never files.

const express = require('express')
const multer = require('multer')
const router = express.Router()
const { sendToDigicust, getDigicustResult, toEAC_HS } = require('../services/digicust')

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })

const EAC_PARTNER_STATES = [
  'Burundi',
  'Democratic Republic of Congo (DRC)',
  'Kenya',
  'Rwanda',
  'Somalia',
  'South Sudan',
  'Tanzania',
  'Uganda'
]

const EAC_CODE_MAP = {
  BI: 'Burundi',
  CD: 'Democratic Republic of Congo (DRC)',
  DRC: 'Democratic Republic of Congo (DRC)',
  KE: 'Kenya',
  RW: 'Rwanda',
  SO: 'Somalia',
  SS: 'South Sudan',
  TZ: 'Tanzania',
  UG: 'Uganda'
}

const EAC_VAT_RATES = {
  Burundi: 0.18,
  'Democratic Republic of Congo (DRC)': 0.16,
  Kenya: 0.16,
  Rwanda: 0.18,
  Somalia: 0.05,
  'South Sudan': 0.18,
  Tanzania: 0.18,
  Uganda: 0.18
}

function normalizeEacCountry(input) {
  if (!input) return null
  const trimmed = String(input).trim()
  const upper = trimmed.toUpperCase()
  if (EAC_CODE_MAP[upper]) return EAC_CODE_MAP[upper]
  return EAC_PARTNER_STATES.find((c) => c.toLowerCase() === trimmed.toLowerCase()) || null
}

const uploadFields = upload.fields([
  { name: 'commercialInvoice', maxCount: 1 },
  { name: 'packingList', maxCount: 1 },
  { name: 'billOfLading', maxCount: 1 },
  { name: 'idf', maxCount: 1 },
  { name: 'exportDeclaration', maxCount: 1 },
  { name: 'certificateOfOrigin', maxCount: 1 },
  { name: 'insurance', maxCount: 1 },
])

async function handleDigicustSubmission(req, res, forcedType = null) {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ success: false, error: 'No documents uploaded' })
    }

    const type = (forcedType || req.body.type || 'import').toLowerCase()
    const tradeType = type === 'export' ? 'Export' : 'Import'

    // Validate Origin & Destination (8 EAC Partner States only)
    const rawOrigin = req.body.origin
    const rawDestination = req.body.destination
    let origin = null
    let destination = null

    if (rawOrigin || rawDestination) {
      origin = normalizeEacCountry(rawOrigin)
      destination = normalizeEacCountry(rawDestination)

      if (!origin || !destination) {
        return res.status(400).json({
          success: false,
          error: 'Only the 8 EAC Partner States are supported (Burundi, DRC, Kenya, Rwanda, Somalia, South Sudan, Tanzania, Uganda).'
        })
      }

      if (origin === destination) {
        return res.status(400).json({
          success: false,
          error: 'Origin and Destination must be different'
        })
      }
    }

    const hasEacCertificate =
      req.body.hasEacCertificate === true ||
      req.body.hasEacCertificate === 'true' ||
      req.body.hasEacCertificate === 'on' ||
      Boolean(req.files.certificateOfOrigin)

    const customsValue = Number(req.body.cif || req.body.invoiceTotal || 0)
    const dutyRate = hasEacCertificate ? 0 : 0.25 // 0% under EAC CoO, else 25% standard EAC CET
    const vatRate = destination ? (EAC_VAT_RATES[destination] || 0.16) : 0.16

    const duty = Number((customsValue * dutyRate).toFixed(2))
    const vat = Number(((customsValue + duty) * vatRate).toFixed(2))

    const fileId = req.body.fileId || `FILE-${Date.now()}`
    const allFiles = Object.values(req.files).flat()
    console.log(`[DIGICUST] ${fileId} (${tradeType}) - Uploading ${allFiles.length} files`)

    const results = []
    for (const file of allFiles) {
      console.log(`[DIGICUST] ${fileId} - Sending ${file.fieldname}: ${file.originalname}`)
      const result = await sendToDigicust(file.buffer, file.originalname, type)
      if (!result.success) {
        return res.status(500).json({ success: false, fileId, file: file.originalname, error: result.error })
      }
      results.push({
        fieldname: file.fieldname,
        originalname: file.originalname,
        declaration_id: result.declaration_id,
        status: result.status
      })
    }

    const documentsProcessed = results.map((r) => `${r.fieldname} (${r.originalname})`)

    return res.json({
      success: true,
      fileId,
      tradeType,
      origin: origin || 'EAC',
      destination: destination || 'EAC',
      hasEacCertificate,
      duty,
      vat,
      documentsProcessed,
      files: results,
      declaration_id: results[0]?.declaration_id,
      status: results[0]?.status,
      message: `Sent ${results.length} file(s) to Digicust (${tradeType}) - Poll /result/:id per file or wait for webhook in ~2 min`
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ success: false, error: err.message })
  }
}

router.post('/import', uploadFields, (req, res) => handleDigicustSubmission(req, res, 'import'))
router.post('/export', uploadFields, (req, res) => handleDigicustSubmission(req, res, 'export'))
router.post('/upload', uploadFields, (req, res) => handleDigicustSubmission(req, res, null))

router.get('/result/:id', async (req, res) => {
  try {
    const result = await getDigicustResult(req.params.id)
    if (!result.success) {
      return res.status(500).json(result)
    }
    const hsCodes = (result.extracted.hsCodes || []).map((item) => ({
      ...item,
      hsCodeEAC: toEAC_HS(item.hsCode),
      hsCodeOriginal: item.hsCode
    }))
    return res.json({
      success: true,
      declaration_id: result.declaration_id,
      status: result.status,
      extracted: { ...result.extracted, hsCodes },
      note: 'Client will file MANUALLY in iCMS after validation - Digicust does not file'
    })
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/webhook', express.json(), async (req, res) => {
  try {
    const payload = req.body
    console.log(`[WEBHOOK] Digicust done: ${payload.declaration_id} - ${payload.status}`)
    return res.json({ ok: true, received: payload.declaration_id })
  } catch (err) {
    console.error('Webhook error:', err)
    return res.status(500).json({ ok: false, error: err.message })
  }
})

module.exports = router
      
