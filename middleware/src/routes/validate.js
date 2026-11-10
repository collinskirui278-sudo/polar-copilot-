// POST /api/validate - Run KRA checks for Manual Filing
// Frontend sends the extracted data, we return PASS / FAIL

const express = require('express')
const router = express.Router()
const { validateForKRA } = require('../services/kra-validation')

router.post('/', (req, res) => {
  try {
    const data = req.body

    // Frontend must send at least these
    if (!data.invoiceTotal && !data.cif) {
      return res.status(400).json({
        success: false,
        error: 'Missing invoiceTotal / cif - Frontend must send extracted data'
      })
    }

    const result = validateForKRA(data)

    // Log for tracking - FILE-101 etc
    console.log(`[VALIDATE] ${result.fileId} - Passed: ${result.passed} - Errors: ${result.errors.length}`)

    return res.json({
      success: true,
      ...result,
      nextStep: result.passed
        ? 'Download Validated Pack and file manually in iCMS'
        : 'Fix errors in Polar Copilot, then validate again'
    })
  } catch (err) {
    console.error('Validate error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/validate/test - Quick test without data
router.get('/test', (req, res) => {
  const sample = validateForKRA({
    fileId: 'FILE-TEST-001',
    invoiceTotal: 10000,
    packingTotal: 10000,
    cif: 10000,
    idfFee: 250,
    rdl: 200,
    pin: 'A123456789B',
    hsCode: '84713000'
  })
  res.json(sample)
})

module.exports = router
