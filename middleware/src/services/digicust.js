// Digicust Service - Global Classification
// Polar Copilot uses Digicust ONLY for reading + HS classification
// Client files MANUALLY in iCMS after validation - Digicust never files

const axios = require('axios')
const FormData = require('form-data')

const DIGICUST_API_URL = 'https://api.digicust.com/v1/declarations'

// Send one document to Digicust for classification
async function sendToDigicust(fileBuffer, fileName, fileType = 'import') {
  if (!process.env.DIGICUST_API_KEY) {
    return {
      success: false,
      error: 'DIGICUST_API_KEY not set in .env - Get key from Digicust dashboard',
      mock: true
    }
  }

  try {
    const form = new FormData()
    form.append('document', fileBuffer, fileName)
    form.append('type', fileType)

    const res = await axios.post(DIGICUST_API_URL, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${process.env.DIGICUST_API_KEY}`
      },
      timeout: 60000 // 60 sec - Digicust can be slow on big PDFs
    })

    // Digicust returns: { declaration_id: "decl_123", status: "processing" }
    return {
      success: true,
      declaration_id: res.data.declaration_id,
      status: res.data.status || 'processing',
      estimated_completion: res.data.estimated_completion || '2min',
      raw: res.data
    }
  } catch (err) {
    console.error('Digicust error:', err.response?.data || err.message)
    return {
      success: false,
      error: err.response?.data?.message || err.message,
      status: err.response?.status
    }
  }
}

// Get result after Digicust finishes - called from webhook or polling
async function getDigicustResult(declarationId) {
  if (!process.env.DIGICUST_API_KEY) {
    return { success: false, error: 'No API key' }
  }

  try {
    const res = await axios.get(`${DIGICUST_API_URL}/${declarationId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.DIGICUST_API_KEY}`
      }
    })

    // Normalise Digicust response to Polar Copilot format
    const d = res.data
    return {
      success: true,
      declaration_id: declarationId,
      status: d.status,
      // Extract what we need for KRA validation
      extracted: {
        invoiceNo: d.invoice_number || d.invoice_no || null,
        supplier: d.supplier_name || d.sender_name || null,
        total: d.total_amount || d.invoice_total || null,
        currency: d.currency || 'USD',
        hsCodes: (d.line_items || []).map(item => ({
          description: item.description,
          hsCode: item.hs_code || item.tariff_code,
          confidence: item.confidence || null,
          qty: item.quantity,
          value: item.value
        })),
        errors: d.validation_errors || d.errors || [],
        warnings: d.warnings || []
      },
      raw: d
    }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// Convert Digicust HS (can be 10-11 digits EU) to EAC 8-digit for Kenya
function toEAC_HS(hsCode) {
  if (!hsCode) return null
  const clean = String(hsCode).replace(/\D/g,'').replace(/\s/g, '')
  // Take first 8 digits - first 6 are global WCO, next 2 are EAC
  return clean.substring(0, 8)
}

module.exports = { sendToDigicust, getDigicustResult, toEAC_HS }
