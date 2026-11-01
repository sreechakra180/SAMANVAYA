import type { IdentifierType } from '../validation/schemas.js'

/**
 * High-accuracy heuristic identifier category detector for Indian cyber crime intelligence.
 * Detects whether a raw input string is:
 * - 'phone'     : Mobile number, toll-free, cyber helpline (1930), landline
 * - 'upi'       : UPI Virtual Payment Address (e.g. name@bank, phone@upi)
 * - 'url'       : Website domain, phishing link, short URL
 * - 'sender_id' : TRAI SMS header (e.g. VK-HDFCBK, HDFCBK, AD-SBIINB)
 */
export function detectIdentifierType(raw: string): IdentifierType | null {
  const val = raw.trim()
  if (!val) return null

  // 1. UPI VPA: contains '@' (e.g. fraud@paytm, 9876543210@axl, support@icici)
  if (val.includes('@')) {
    return 'upi'
  }

  // 2. Website URL / Link:
  // Starts with protocol or www, contains slashes, or matches top phishing/standard TLDs
  const isUrlProtocol = /^(https?:\/\/|www\.)/i.test(val)
  const hasUrlPath = /[a-zA-Z0-9-]+\.[a-zA-Z]{2,}\/[^\s]*/i.test(val)
  const hasDomainTld =
    /\.(com|in|org|net|xyz|top|online|site|co|info|app|link|live|shop|club|biz|tech|gov|edu|me|cc|vip|io|icu|ru|cn|click|store|page|trade|fun|co\.in|org\.in|gov\.in)(\/|$|\?|#|:)/i.test(
      val
    )
  const isShortLinkDomain = /^(bit\.ly|t\.me|tinyurl\.com|cutt\.ly|is\.gd|rb\.gy)\//i.test(val)

  if (isUrlProtocol || hasUrlPath || hasDomainTld || isShortLinkDomain) {
    return 'url'
  }

  // 3. SMS Sender ID (TRAI Telecom Alpha Header):
  // Format: 2-letter prefix + hyphen/space + 6-char header (e.g. VK-HDFCBK, AD-SBIINB, JM-AIRTEL)
  // Or standalone 6-character alpha header (e.g. HDFCBK, SBIINB, AXISBK, PAYTMB, KOTAKB, AMAZON)
  const cleanVal = val.toUpperCase().replace(/\s+/g, '')
  const isTraiHeaderWithPrefix = /^[A-Z]{2}[-\s]?[A-Z0-9]{6}$/.test(cleanVal)
  const isStandaloneHeader = /^[A-Z]{5,8}$/.test(cleanVal) && !val.includes('.')

  if (isTraiHeaderWithPrefix || isStandaloneHeader) {
    return 'sender_id'
  }

  // 4. Phone Number:
  // Helplines: 1930, 1909, 112, 100, 108
  // Toll-free: 1800..., 1860...
  // Mobile / Landline: 7 to 13 digits, optional + or +91 or 0 prefix, spaces or hyphens
  const digitsOnly = val.replace(/[\s\-().+]/g, '')
  const hasOnlyPhoneChars = /^[+\d\s\-().]+$/.test(val)

  if (
    val === '1930' ||
    val === '1909' ||
    val === '112' ||
    val === '100' ||
    val.startsWith('1800') ||
    val.startsWith('1860')
  ) {
    return 'phone'
  }

  if (hasOnlyPhoneChars && digitsOnly.length >= 3) {
    return 'phone'
  }

  // Fallback: If contains mostly digits with standard phone pattern
  if (/^\+?(\d[\s-]?){7,13}$/.test(val)) {
    return 'phone'
  }

  return null
}

export function getIdentifierLabel(type: IdentifierType): string {
  switch (type) {
    case 'phone':
      return 'Phone Number'
    case 'upi':
      return 'UPI VPA'
    case 'url':
      return 'Website / Link'
    case 'sender_id':
      return 'SMS Sender ID'
    default:
      return 'Identifier'
  }
}

