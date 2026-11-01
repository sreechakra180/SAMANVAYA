import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

const tw = (...args: Array<string | false | null | undefined>) => twMerge(args.filter(Boolean).join(' '))

export function tone(className: string): string {
  return tw('text-scam font-semibold', className)
}

export function toneClass(level: 'ok' | 'warn' | 'danger'): string {
  switch (level) {
    case 'ok': return 'text-ok bg-ok-light'
    case 'warn': return 'text-warn bg-warn-light'
    default: return 'bg-scam-light text-scam'
  }
}

export function verdictClass(v: string): string {
  switch (v) {
    case 'NO_REPORTS': return 'bg-surface-raised text-text-muted border border-surface-border'
    case 'SUSPICIOUS': return 'bg-warn text-white'
    case 'KNOWN_SCAM': return 'bg-scam text-white'
    case 'VERIFIED_BUSINESS': return 'bg-ok text-white'
    default: return 'bg-surface-raised text-scam'
  }
}

export function initials(name: string): string {
  return name.slice(0, 2).toUpperCase()
}

export function pill(className: string, html: string): string {
  return tw(`badge ${className}`, html)
}