import { memo } from 'react'
import type { ReactNode } from 'react'
import { cn } from '../utils/cn.js'

interface Props {
  message?: string
  icon?: ReactNode
}

export const EmptyState = memo(function EmptyState({ message = 'No reports yet.', icon }: Props) {
  return (
    <div className="card p-10 text-center" role="status">
      {icon ? (
        <div className="w-16 h-16 mx-auto mb-3 text-text-muted">{icon}</div>
      ) : (
        <svg className="w-16 h-16 mx-auto mb-3 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      )}
      <p className="text-sm text-text-muted">{message}</p>
    </div>
  )
})