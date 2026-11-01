import { memo } from 'react'
import type { ReactNode } from 'react'
import { cn } from './cn.js'

interface Props {
  name: string; className?: string; size?: number
}

const ICONS: Record<string, string> = {
  phone: 'M6.6 10.8c1.4 2.8 3.7 5.1 6.6 6.6l2-2c.3-.3.7-.4 1-.4s.7.1 1 .4l2 2c.9-1.5 1.9-2.8 3-3.8V2H6v10.8z',
  sms: 'M22 2L11 13M2 22L11 13',
  qr: 'M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z',
  web: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zM2 5h20v14H2V5z',
  upi: 'M3 5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm2 3h6v8H5V8zm0 12h8v2H5v-2z',
  other: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16zm10-13a2 2 0 11-4 0 2 2 0 014 0zm-2 11.5a.5.5 0 01-.5.5h-5a.5.5 0 01-.5-.5V9a.5.5 0 01.5-.5h2.5V5.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v2.5h2.5a.5.5 0 01.5.5z',
  report: 'M12 22c1.1 0 2-.9 2-2h-4a2 2 0 002 2zm6-6v-5c0-3.1-1.5-5.6-4.5-6.3V4a1.5 1.5 0 10-3 0v.7C12.5 4.4 11 6 11 8v5l-2 2v2h6v-2z',
  check: 'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z',
  warn: 'M12 2L1 21h22L12 2zm-1 14H9V8h6v10z',
  clock: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16z',
  shield: 'M12 2 2 22h20L12 2zm0 5a3 3 0 100 6 3 3 0 000-6zm0 8a1.5 1.5 0 110-3 1.5 1.5 0 010 3z',
  alert: 'M1 21h22L12 1zm0-12h22L12 9zm2 6H1v-4h20v4z',
  empty: 'M12 2A10 10 0 1012 22 10 10 0 0012 2zm0 14a4 4 0 110-8 4 4 0 010 8zm0-6a2 2 0 100-4 2 2 0 000 4z',
  error: 'M12 2 2 22h20L12 2zm-1 15h2l1 3h-3l-2-2zm5 2l2 3h-3l-3-4z',
  offline: 'M12 2a10 10 0 100 20 10 10 0 000-20zm-1 5h-2l-2 3h3l-2-3z',
  license: 'M4 4h16v16H4V4zm2 2v8h12V6H6zm-3 9H7v-1h8v1zm1-4H8v-2h5v2zm0-3H8V7h5v1z',
}

export const Icon = memo(function Icon({ name, className, size = 20 }: Props) {
  const path = ICONS[name] ?? ICONS.circle
  const sz = `${size}px`
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      style={{ width: sz, height: sz }} className={cn('h-5 w-5 shrink-0', className)} aria-hidden="true">
    <path d={path} />
  </svg>
  )
})