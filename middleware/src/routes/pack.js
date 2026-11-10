// GET /api/pack/:fileId - Download Validated Pack for Manual Filing in iCMS
// Returns a clean JSON + CSV the client can copy-paste into iCMS
// Also acts as the source for the Excel in the frontend

const express = require('express')
const router = express.Router()
const { validateForKRA } = require('../services/kra-validation')

// In production, this comes from your DB. For now, frontend sends data via POST
router.post('/generate', (req, res) => {
  try {
    const data = req.body

    const validation = validateForKRA(data)

    if (!validation.passed) {
      return res.status(400).json({
        success: false,
        message: 'Cannot generate Pack - Fix errors first',
        ...validation
      })
    }

    const cif = Number(data.cif || data.invoiceTotal || 0)

    // Build the pack - these are the exact fields iCMS asks for
    const pack = {
      fileId: data.fileId || 'FILE-101',
      generatedAt: new Date().toISOString(),
      client: {
        name: data.clientName || '',
        pin: data.pin || '',
        idfNo: data.idfNo || '',
      },
      shipment: {
        supplier: data.supplier || '',
        invoiceNo: data.invoiceNo || '',
        invoiceTotal: Number(data.invoiceTotal || 0),
        packingTotal: Number(data.packingTotal || 0),
        currency: data.currency || 'USD',
        cifKES: data.cifKES || null,
        cifUSD: cif,
      },
      // KRA / iCMS exact fields
      icmsReady: {
        hsCode_EAC_8digit: String(data.hsCode || '').replace(/\./g, '').substring(0, 8),
        hsDescription: data.hsDescription || '',
        idfFee_2_5pct: +(cif * 0.025).toFixed(2),
        rdl_2pct: +(cif * 0.02).toFixed(2),
        vat_16pct_on_duty_paid: 'Calculate in iCMS after duty - VAT 16% on (CIF + Duty + IDF + RDL)',
        idfFeePaid: Number(data.idfFee || 0),
        rdlPaid: Number(data.rdl || 0),
      },
      checklistForManualFiling: [
        '1. Open iCMS -> New Declaration',
        '2. Copy PIN, IDF No, Invoice No from above',
        '3. Enter HS Code (8-digit EAC) exactly as above',
        '4. Enter CIF Value',
        '5. Verify IDF 2.5% and RDL 2% match above',
        '6. Attach Invoice + Packing List PDFs (originals)',
        '7. Submit in iCMS - Do NOT use Digicust to file',
        '8. Save Entry Number back in Polar Copilot'
      ],
      validation,
      disclaimer: 'Polar Copilot validates only. Client files manually in iCMS. Digicust used only for classification.'
    }

    // Also make a CSV version for copy-paste
    const csv = [
      'Field,Value',
      `File ID,${pack.fileId}`,
      `Client PIN,${pack.client.pin}`,
      `IDF No,${pack.client.idfNo}`,
      `Invoice No,${pack.shipment.invoiceNo}`,
      `Invoice Total,${pack.shipment.invoiceTotal}`,
      `CIF USD,${pack.shipment.cifUSD}`,
      `HS Code EAC,${pack.icmsReady.hsCode_EAC_8digit}`,
      `HS Description,${pack.icmsReady.hsDescription}`,
      `IDF Fee 2.5%,${pack.icmsReady.idfFee_2_5pct}`,
      `RDL 2%,${pack.icmsReady.rdl_2pct}`,
      `Validation,${validation.summary}`
    ].join('\n')

    return res.json({ success: true, pack, csv })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
