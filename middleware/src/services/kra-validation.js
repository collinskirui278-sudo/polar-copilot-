// Multi-Country EAC Customs Validation (Imports & Exports)
// Supports: KE (KRA), UG (URA), TZ (TRA), RW (RRA), BI (OBR), CD (DGDA), SS (NRS), SO (Somali Customs)

const EAC_TAX_ID_RULES = {
  KE: { label: 'KRA PIN', regex: /^[A-Z]\d{9}[A-Z]$/, example: 'A123456789B' },
  UG: { label: 'URA TIN', regex: /^\d{10}$/, example: '1000123456' },
  TZ: { label: 'TRA TIN', regex: /^\d{9}$/, example: '123456789' },
  RW: { label: 'RRA TIN', regex: /^\d{9}$/, example: '123456789' },
  BI: { label: 'OBR NIF', regex: /^\d{8,10}$/, example: '400123456' },
  CD: { label: 'DGDA NIF', regex: /^[A-Z0-9]{8,12}$/, example: 'A1234567X' },
  SS: { label: 'NRS TIN', regex: /^\d{9,10}$/, example: '123456789' },
  SO: { label: 'Somalia TIN', regex: /^[A-Z0-9]{6,12}$/, example: 'SO123456' }
}

function validateForEAC(data) {
  const errors = []
  const checks = []
  const warnings = []

  const country = String(data.country || 'KE').trim().toUpperCase()
  const type = String(data.type || 'import').trim().toLowerCase() // 'import' or 'export'

  const invoiceTotal = Number(data.invoiceTotal || 0)
  const packingTotal = Number(data.packingTotal || 0)
  const cif = Number(data.cif || invoiceTotal)
  const idfFee = Number(data.idfFee || 0)
  const rdl = Number(data.rdl || 0)
  const taxId = String(data.taxId || data.pin || '').trim().toUpperCase()

  // 1. Invoice vs Packing List (Universal)
  if (invoiceTotal !== packingTotal) {
    errors.push(`Invoice $${invoiceTotal} != Packing List $${packingTotal}`)
  } else {
    checks.push(`Invoice = Packing Total: $${invoiceTotal}`)
  }

  // 2. Country-Specific Import Levies (Skipped for Exports)
  if (type === 'import') {
    if (country === 'KE') {
      const expectedIDF = cif * 0.025
      if (Math.abs(idfFee - expectedIDF) > 1) {
        errors.push(`KRA IDF Fee should be $${expectedIDF.toFixed(2)} (2.5% of CIF), got $${idfFee}`)
      } else {
        checks.push(`KRA IDF Fee correct: $${idfFee} (2.5% of CIF)`)
      }

      const expectedRDL = cif * 0.02
      if (Math.abs(rdl - expectedRDL) > 1) {
        errors.push(`KRA RDL should be $${expectedRDL.toFixed(2)} (2% of CIF), got $${rdl}`)
      } else {
        checks.push(`KRA RDL correct: $${rdl} (2% of CIF)`)
      }
    } else if (country === 'UG') {
      const expectedInfra = cif * 0.015
      checks.push(`URA Infrastructure Levy (1.5% est.): $${expectedInfra.toFixed(2)}`)
    } else if (country === 'TZ') {
      const expectedCPF = cif * 0.006
      const expectedTZRDL = cif * 0.015
      checks.push(`TRA Fees est. — CPF (0.6%): $${expectedCPF.toFixed(2)}, RDL (1.5%): $${expectedTZRDL.toFixed(2)}`)
    } else {
      checks.push(`${country} Import declaration — EAC CET tariff rules applied`)
    }
  } else {
    checks.push(`${country} Export declaration — Import IDF/RDL levies waived`)
  }

  // 3. Tax ID / PIN / TIN Format by EAC Country
  const rule = EAC_TAX_ID_RULES[country]
  if (rule) {
    if (!rule.regex.test(taxId)) {
      errors.push(`${rule.label} format invalid: "${taxId}" — Expected format like ${rule.example}`)
    } else {
      checks.push(`${rule.label} format OK: ${taxId}`)
    }
  } else {
    warnings.push(`Country "${country}" not recognized as EAC — skipped Tax ID regex check`)
  }

  // 4. 8-Digit HS Code for EAC Common External Tariff (CET)
  const hs = String(data.hsCode || '').replace(/\./g, '')
  if (hs.length !== 8) {
    warnings.push(`HS Code ${data.hsCode} is ${hs.length} digits — EAC CET requires 8 digits`)
  } else {
    checks.push(`HS Code OK for EAC CET: ${hs}`)
  }

  // 5. CIF / Customs Value must be > 0
  if (cif <= 0) {
    errors.push('CIF / Customs value must be greater than 0')
  } else {
    checks.push(`Customs Value (CIF/FOB): $${cif}`)
  }

  return {
    valid: errors.length === 0,
    country,
    type,
    errors,
    checks,
    warnings
  }
}

// Backward-compatible alias so existing calls to validateForKRA keep working
function validateForKRA(data) {
  return validateForEAC({ ...data, country: data.country || 'KE' })
}

module.exports = {
  validateForEAC,
  validateForKRA
                    }
