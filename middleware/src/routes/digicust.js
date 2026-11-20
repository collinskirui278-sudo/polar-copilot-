// POST /api/digicust/upload - Client uploads PDFs, we send to Digicust
// POST /api/digicust/result/:id - Get Digicust result back
// POST /api/digicust/webhook - Digicust calls this when done
// Polar Copilot - Client files MANUALLY in iCMS. This file never files.

const express = require('express')
const multer = require('multer')
const router = express.Router()
const { sendToDigicust, getDigicustResult, toEAC_HS } = require('../services/digicust')

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })

router.post('/upload', upload.fields([
  { name: 'commercialInvoice', maxCount: 1 },
  { name: 'packingList', maxCount: 1 },
  { name: 'billOfLading', maxCount: 1 },
  { name: 'idf', maxCount: 1 },
  { name: 'certificateOfOrigin', maxCount: 1 },
  { name: 'insurance', maxCount: 1 },
]), async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ success: false, error: 'No documents uploaded' })
    }
    const fileId = req.body.fileId || `FILE-${Date.now()}`
    const type = req.body.type || 'import'
    const allFiles = Object.values(req.files).flat()
    console.log(`[DIGICUST] ${fileId} - Uploading ${allFiles.length} files`)
    const results = []
    for (const file of allFiles) {
      console.log(`[DIGICUST] ${fileId} - Sending ${file.fieldname}: ${file.originalname}`)
      const result = await sendToDigicust(file.buffer, file.originalname, fileId, type)
      if (!result.success) {
        return res.status(500).json({ success: false, fileId, file: file.originalname, error: result.error })
      }
      results.push({ fieldname: file.fieldname, originalname: file.originalname, declaration_id: result.declaration_id, status: result.status })
    }
    return res.json({ success: true, fileId, files: results, declaration_id: results[0]?.declaration_id, status: results[0]?.status, message: `Sent ${results.length} file(s) to Digicust - Poll /result/:id per file or wait for webhook in ~2 min` })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/result/:id', async (req, res) => {
  try {
    const result = await getDigicustResult(req.params.id)
    if (!result.success) {
      return res.status(500).json(result)
    }
    const hsCodes = (result.extracted.hsCodes || []).map(item => ({
      ...item,
      hsCodeEAC: toEAC_HS(item.hsCode),
      hsCodeOriginal: item.hsCode
    }))
    return res.json({ success: true, declaration_id: result.declaration_id, status: result.status, extracted: { ...result.extracted, hsCodes }, note: 'Client will file MANUALLY in iCMS after validation - Digicust does not file' })
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
