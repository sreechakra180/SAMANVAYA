import { memo } from 'react'

export const CheckIcon = memo(function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
    </svg>
  )
})

export const ClipboardListIcon = memo(function ClipboardListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect width="8" height="4" x="8" y="2" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <polyline points="8 10 12 14 16 10" />
    </svg>
  )
})

export const WarningIcon = memo(function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M10.29 3.41a1 1 0 0 1 1.41 0l11.02 11.02a1 1 0 0 1 0 1.41L12 21.41a1 1 0 0 1-1.41 0L.88 10.32a1 1 0 0 1 0-1.41z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <circle cx="12" cy="16" r=".5" />
    </svg>
  )
})

export const ErrorIcon = memo(function ErrorIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  )
})

export const AlertIcon = memo(function AlertIcon({ message, status = 'warn' }: { message: string; status?: 'warn' | 'error' }) {
  return (
    <div className={status === 'error' ? 'bg-scam/20 border-scam/40 text-scam' : 'bg-warn/20 border-warn/40 text-warn'} role="alert">
      <div className="flex items-start gap-2 px-4 py-3 rounded-lg border backdrop-blur-sm">
        {status === 'error' ? <ErrorIcon /> : <WarningIcon />}
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  )
})