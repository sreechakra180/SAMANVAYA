import { lookupIdentifier, submitReportWithFallback, type LookupResult, type ReportEvidenceRow } from '../services/resilientApi.js'

export interface SubmitReportResponse {
  report_id: string
  case_id: string
  merged: boolean
}

export type { LookupResult, ReportEvidenceRow }

export const api = {
  lookup: (type: string, value: string) => lookupIdentifier(type, value),
  submitReport: (data: any) => submitReportWithFallback(data),
}
