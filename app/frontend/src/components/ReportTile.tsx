import { memo } from 'react'
import type { ReactNode } from 'react'
import { cn } from './cn.js'

export const ReportTile = memo(function ReportTile({
  icon, title, onTap, className
}: {
  icon: ReactNode; title: string; onTap?: () => void; className?: string
}) {
  return (
    <button type="button"
      onClick={onTap}
      aria-label={`Report ${title}`}
      className={cn('bg-scam-light text-scam w-full rounded-xl border border-scam/30 px-5 py-6 text-left transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0', className)}
    >
      <div className="mb-2 flex items-start gap-3">
        {icon}
        <span className="mt-1 font-medium text-scam">{title}</span>
      </div>
      {onTap ? null : <p className="text-sm text-text-muted">Tap to report this identifier as a scam.</p>}
    </button>
  )
})