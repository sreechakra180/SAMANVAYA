/**
 * Universal UTC and Timezone Date Utilities for SAMANVAYA
 * Handles ISO strings with or without trailing 'Z' (SQLite UTC naive datetime defense)
 * and formats accurately in Indian Standard Time (IST / en-IN).
 */

export function parseIsoDate(isoString?: string | null): Date {
  if (!isoString) return new Date()
  let s = String(isoString).trim().replace(' ', 'T')
  // If the ISO string doesn't include timezone information ('Z' or '+' or '-' offset), append 'Z'
  // SQLite stores UTC timestamps without timezone offset, so we explicitly treat naive strings as UTC.
  if (!s.endsWith('Z') && !/[+-]\d{2}(:\d{2})?$/.test(s)) {
    s += 'Z'
  }
  const d = new Date(s)
  return isNaN(d.getTime()) ? new Date(isoString) : d
}

export function formatFullDateTime(isoString?: string | null): {
  date: string
  time: string
  relative: string
} {
  if (!isoString) {
    const now = new Date()
    return {
      date: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      relative: 'Just Now',
    }
  }

  const d = parseIsoDate(isoString)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  let relative = 'Just Now'
  if (diffMins > 0 && diffMins < 60) {
    relative = `${diffMins}m ago`
  } else if (diffMins >= 60 && diffMins < 1440) {
    relative = `${Math.floor(diffMins / 60)}h ago`
  } else if (diffMins >= 1440) {
    relative = `${Math.floor(diffMins / 1440)}d ago`
  } else {
    relative = 'Just Now'
  }

  return {
    date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    relative,
  }
}
