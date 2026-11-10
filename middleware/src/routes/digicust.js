// POST /api/digicust/upload - Client uploads PDF, we send to Digicust
// POST /api/digicust/result/:id - Get Digicust result back
// POST /api/digicust/webhook - Digicust calls this when done

const express = require('express')
const multer = require('multer')
const router = express.Router()
const { sendToDigicust, getDigicustResult, toEAC_HS } = require('../services/digicust')
const { validateForKRA } = require('../services/kra-validation')

// Store files in memory - we forward straight to Digicust, don't save
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })

// 1. UPLOAD - Frontend sends 1 PDF
router.post('/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No document uploaded - field name must be "document"' })
    }

    const fileId = req.body.fileId || `FILE-${Date.now()}`
    const type = req.body.type || 'import'

    console.log(`[DIGICUST] ${fileId} - Uploading ${req.file.originalname}`)

    const result = await sendToDigicust(req.file.buffer, req.file.originalname, type)

    if (!result.success) {
      return res.status(500).json({ success: false, fileId, error: result.error })
    }

    return res.json({
      success: true,
      fileId,
      declaration_id: result.declaration_id,
      status: result.status,
      message: 'Sent to Digicust - Poll /result/:id or wait for webhook in ~2 min'
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ success: false, error: err.message })
  }
})

// 2. GET RESULT - Frontend polls this
router.get('/result/:id', async (req, res) => {
  try {
    const result = await getDigicustResult(req.params.id)

    if (!result.success) {
      return res.status(500).json(result)
    }

    // Convert EU HS to EAC HS for Kenya
    const hsCodes = (result.extracted.hsCodes || []).map(item => ({
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

// 3. WEBHOOK - Digicust calls this when processing is done
router.post('/webhook', express.json(), async (req, res) => {
  try {
    const payload = req.body
    console.log(`[WEBHOOK] Digicust done: ${payload.declaration_id} - ${payload.status}`)

    // Here you would save to DB: declaration_id -> FILE-101
    // For now, just log and return OK so Digicust knows we got it

    // Optional: Auto-validate if payload has totals
    if (payload.total_amount) {
      const validation = validateForKRA({
        fileId: payload.fileId || payload.declaration_id,
        invoiceTotal: payload.total_amount,
        packingTotal: payload.total_amount,
        cif: payload.total_amount,
        idfFee: payload.total_amount * 0.025,
        rdl: payload.total_amount * 0.02,
        pin: payload.pin || 'A123456789B',
        hsCode: payload.hsCodes?.[0]?.hs_code || ''
      })
      console.log(`[WEBHOOK] Validation: ${validation.summary}`)
    }

    return res.json({ ok: true, received: payload.declaration_id })
  } catch (err) {
    console.error('Webhook error:', err)
    return res.status(500).json({ ok: false, error: err.message })
  }
})

module.exports = router
