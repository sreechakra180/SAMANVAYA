import { Button } from './Button'
import type { ReactNode } from 'react'

interface Props {
  icon: ReactNode
  label: string
  href: string
}

export function NavLink({ icon, label, href }: Props) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-raised hover:text-text-primary transition-colors"
    >
      {icon}
      {label}
    </a>
  )
}

export function PrimaryButton({ children, onClick, className, disabled, loading }: {
  children: ReactNode; onClick?: () => void; className?: string; disabled?: boolean; loading?: boolean
}) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      className={className}
    >
      {loading ? <span className="animate-spin">⟳</span> : null}
      {children}
    </Button>
  )
}

export function SectionCard({ title, children, className }: {
  title: string; children: ReactNode; className?: string
}) {
  return (
    <section className={`card p-5 ${className ?? ''}`}>
      <h3 className="mb-3 font-semibold text-text-primary">{title}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  )
}
