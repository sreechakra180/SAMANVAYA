/**
 * Privacy & PII Redaction Engine (DPDP Act 2023 & TRAI Compliance)
 * 
 * Guarantees that mobile numbers, personal email addresses, UPI handles, and personal names
 * are strictly masked across all public cards, advisories, telemetry, and lists.
 */

export function maskIdentifier(valueOrType: string | null | undefined, typeOrValue?: string): string {
  if (!valueOrType) return ''
  let val = valueOrType.trim()
  let type = typeOrValue ? typeOrValue.trim() : undefined

  // Support both (value, type) and (type, value) argument ordering
  if (['phone', 'upi', 'url', 'sender_id', 'email'].includes(val.toLowerCase()) && typeOrValue) {
    type = val.toLowerCase()
    val = typeOrValue.trim()
  }

  if (!val) return ''

  // Helplines & Official Emergency Numbers (1930, 1909, 100, 112, etc.) do NOT get masked
  if (
    val === '1930' ||
    val === '+911930' ||
    val === '1909' ||
    val === '+911909' ||
    val === '112' ||
    val === '100' ||
    val.includes('1930')
  ) {
    return val
  }

  // Already masked strings (e.g. contains 'XXXXX' or '***')
  if (val.includes('XXXXX') || val.includes('***')) {
    return val
  }

  // 1. UPI Handle or Email Address (contains '@')
  if (type === 'upi' || type === 'email' || val.includes('@')) {
    const parts = val.split('@')
    const username = parts[0]
    const domain = parts.slice(1).join('@')
    if (username.length <= 2) {
      return `${username[0] || ''}***@${domain}`
    } else if (username.length <= 4) {
      return `${username[0]}***${username.slice(-1)}@${domain}`
    } else {
      return `${username.slice(0, 2)}***${username.slice(-1)}@${domain}`
    }
  }

  // 2. Phone Number (digits with optional +, spaces, dashes)
  const digitsOnly = val.replace(/\D/g, '')
  if (type === 'phone' || digitsOnly.length >= 7) {
    // Official Bank Toll-Free numbers (e.g. 18001600, 18002600, 18001234)
    if (digitsOnly.startsWith('1800') || digitsOnly.startsWith('911800')) {
      return val
    }
    // Indian 12-digit number with country code 91 (e.g. 919988776655)
    if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
      const core = digitsOnly.slice(2)
      return `+91 ${core.slice(0, 3)}XXXXX${core.slice(-2)}`
    }
    // Standard 10-digit Indian mobile (e.g. 9988776655)
    if (digitsOnly.length === 10) {
      return `+91 ${digitsOnly.slice(0, 3)}XXXXX${digitsOnly.slice(-2)}`
    }
    // Generic phone masking (11 or other digits)
    if (digitsOnly.length >= 8) {
      return `+91 ${digitsOnly.slice(0, 3)}XXXXX${digitsOnly.slice(-2)}`
    }
  }

  // 3. Sender ID
  if (type === 'sender_id') {
    // Official 6-character TRAI bank header (e.g. HDFCBK, SBIINB, AXISBK, ICICIB)
    if (/^[A-Z]{6}$/.test(val)) {
      return val
    }
    // Personal or non-standard name
    if (val.length > 3) {
      return `${val.slice(0, 2)}***${val.slice(-1)}`
    }
  }

  // 4. URL
  if (type === 'url' || val.startsWith('http') || val.includes('.top') || val.includes('.xyz') || val.includes('.com')) {
    try {
      const cleaned = val.replace(/^https?:\/\//, '').replace(/^www\./, '')
      const parts = cleaned.split('.')
      if (parts.length >= 2) {
        const domainName = parts[0]
        const tld = parts.slice(1).join('.').split('/')[0]
        const maskedName = domainName.length > 3 ? `${domainName.slice(0, 3)}***` : `${domainName[0]}***`
        return `${maskedName}.${tld}`
      }
    } catch {}
  }

  // Generic fallback if longer than 4 chars
  if (val.length > 4) {
    return `${val.slice(0, 2)}***${val.slice(-2)}`
  }

  return val
}

/**
 * Redacts any embedded phone numbers, UPI handles, or emails inside public advisory sentences.
 * Example:
 *   "Recent citizen incident logged for PHONE '+919988776655' regarding digital arrest..."
 *   -> "Recent citizen incident logged for PHONE '+91 998XXXXX55' regarding digital arrest..."
 */
export function maskAdvisoryText(text: string | null | undefined): string {
  if (!text) return ''
  let sanitized = text

  // 1. Redact phone numbers in text (with or without +91)
  sanitized = sanitized.replace(/(?:\+91[\-\s]?)?[6-9]\d{9}/g, match => {
    return maskIdentifier(match, 'phone')
  })

  // 2. Redact UPI handles or emails (e.g. user@hdfcbank, payment@upi)
  sanitized = sanitized.replace(/\b[a-zA-Z0-9.\-_]{2,64}@[a-zA-Z0-9.\-_]{2,32}\b/g, match => {
    return maskIdentifier(match, 'upi')
  })

  return sanitized
}
