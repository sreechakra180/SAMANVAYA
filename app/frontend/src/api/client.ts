const API_BASE = '/api'

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}: ${await res.text()}`)
  return res.json() as Promise<T>
}

export interface ReportEvidenceRow {
  occurred_at: string
  channel: string
  scam_type: string
  pincode: string
}

export interface LookupResult {
  verdict: 'NO_REPORTS' | 'SUSPICIOUS' | 'KNOWN_SCAM' | 'VERIFIED_BUSINESS'
  report_count: number
  distinct_reporters: number
  first_seen: string | null
  last_seen: string | null
  scam_type: string | null
  display_value: string
  evidence: ReportEvidenceRow[]
  challenged: boolean
}

export interface SubmitReportResponse {
  report_id: string
  case_id: string
  merged: boolean
}

export const api = {
  lookup: (type: string, value: string) =>
    jsonFetch<LookupResult>(`/lookup?type=${encodeURIComponent(type)}&value=${encodeURIComponent(value)}`),
  submitReport: (data: unknown) =>
    jsonFetch<SubmitReportResponse>(`/reports`, { method: 'POST', body: JSON.stringify(data) }),
}
