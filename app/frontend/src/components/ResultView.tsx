import { memo } from 'react'
import type { LookupResult } from '../api/client.js'
import { Icon } from './Icon.js'
import { cn } from './cn.js'
import { verdictClass } from './helpers.js'
import { formatFullDateTime } from '../utils/date.js'

export const ResultView = memo(function ResultView({ result }: { result: LookupResult | null }) {
  if (!result) return null
  const v = result.verdict
  return (
    <section className="space-y-4">
      <div className={cn('card', verdictClass(v))}>
        <div className="flex items-center gap-3">
          {(v === 'VERIFIED_BUSINESS' || v === 'KNOWN_SCAM') && <Icon name={v === 'VERIFIED_BUSINESS' ? 'check' : 'report'} size={28} />}
          <span className="text-lg font-bold">{labelFor(v)}</span>
          {result.challenged && <span className="rounded bg-warn px-2 py-0.5 text-xs font-semibold text-white">DISPUTED</span>}
        </div>
        <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 text-sm text-text-muted md:grid-cols-2">
          <dt>Verdict</dt><dd>{result.verdict}</dd>
          <dt>Report count</dt><dd>{result.report_count}</dd>
          <dt>Distinct reporters</dt><dd>{result.distinct_reporters}</dd>
          <dt>First seen</dt><dd>{result.first_seen ? `${formatFullDateTime(result.first_seen).date} ${formatFullDateTime(result.first_seen).time}` : '—'}</dd>
          <dt>Last seen</dt><dd>{result.last_seen ? `${formatFullDateTime(result.last_seen).date} ${formatFullDateTime(result.last_seen).time}` : '—'}</dd>
          <dt>Scam type</dt><dd>{result.scam_type ?? '—'}</dd>
          <dt className="col-span-2">Display value</dt><dd className="font-mono text-base text-text-primary">{result.display_value}</dd>
        </dl>
      </div>

      {result.evidence.length > 0 && (
        <section className="card">
          <h4 className="mb-2 font-semibold text-text-primary">Evidence (latest 10)</h4>
          <ul className="divide-y divide-surface-border">
            {result.evidence.map((e, i) => {
              const dt = formatFullDateTime(e.occurred_at)
              return (
                <li key={i} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-1.5 pl-4 pr-2">
                  <span className="font-mono text-sm text-text-primary">{dt.date} {dt.time}</span>
                  <span className="text-sm text-text-secondary">{e.channel} · {e.scam_type}</span>
                  <span className="font-mono text-sm text-scam">{e.pincode}</span>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </section>
  )
})

function labelFor(v: string): string {
  switch (v) {
    case 'NO_REPORTS': return 'No reports found — nothing here yet'
    case 'SUSPICIOUS': return 'Suspicious activity'
    case 'KNOWN_SCAM': return 'Known scam'
    case 'VERIFIED_BUSINESS': return 'Verified business contact'
    default: return v
  }
}