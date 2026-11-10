// KRA Validation for Manual Filing
// Polar Copilot - Client files manually in iCMS after this passes

function validateForKRA(data) {
  const errors = []
  const checks = []
  const warnings = []

  const invoiceTotal = Number(data.invoiceTotal || 0)
  const packingTotal = Number(data.packingTotal || 0)
  const cif = Number(data.cif || invoiceTotal)
  const idfFee = Number(data.idfFee || 0)
  const rdl = Number(data.rdl || 0)
  const pin = String(data.pin || '').trim().toUpperCase()

  // 1. Invoice vs Packing List
  if (invoiceTotal !== packingTotal) {
    errors.push(`Invoice $${invoiceTotal} != Packing List $${packingTotal} - Totals must match before filing`)
  } else {
    checks.push(`Invoice = Packing Total: $${invoiceTotal}`)
  }

  // 2. IDF Fee = 2.5% of CIF - KRA rule
  const expectedIDF = cif * 0.025
  if (Math.abs(idfFee - expectedIDF) > 1) {
    errors.push(`IDF Fee should be $${expectedIDF.toFixed(2)} (2.5% of CIF $${cif}), you have $${idfFee}`)
  } else {
    checks.push(`IDF Fee correct: $${idfFee} (2.5% of CIF)`)
  }

  // 3. RDL = 2% of CIF
  const expectedRDL = cif * 0.02
  if (Math.abs(rdl - expectedRDL) > 1) {
    errors.push(`RDL should be $${expectedRDL.toFixed(2)} (2% of CIF), you have $${rdl}`)
  } else {
    checks.push(`RDL correct: $${rdl} (2% of CIF)`)
  }

  // 4. PIN Format: A + 9 digits + Letter, e.g. A123456789B
  if (!/^[A-Z]\d{9}[A-Z]$/.test(pin)) {
    errors.push(`PIN format invalid: ${pin} - Should be like A123456789B`)
  } else {
    checks.push(`PIN format OK: ${pin}`)
  }

  // 5. HS Code must be 8 digits for EAC CET
  const hs = String(data.hsCode || '').replace(/\./g, '')
  if (hs.length !== 8) {
    warnings.push(`HS Code ${data.hsCode} is ${hs.length} digits - EAC needs 8 digits for iCMS`)
  } else {
    checks.push(`HS Code OK for EAC: ${hs}`)
  }

  // 6. CIF must be > 0
  if (cif <= 0) {
    errors.push('CIF Value is 0 or missing - Cannot file')
  }

  return {
    fileId: data.fileId || 'FILE-101',
    passed: errors.length === 0,
    canFileManually: errors.length === 0,
    checks,
    warnings,
    errors,
    summary: errors.length === 0 
      ? 'READY TO FILE MANUALLY - Download Validated Pack and file in iCMS' 
      : `DO NOT FILE YET - Fix ${errors.length} error(s) first`
  }
}

module.exports = { validateForKRA }
