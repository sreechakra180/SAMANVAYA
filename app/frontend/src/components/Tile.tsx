import { memo } from 'react'
import type { ReactNode } from 'react'
import { cn } from './cn.js'

interface Props {
  icon: ReactNode; title: string; subtitle?: ReactNode; children?: ReactNode
}

export const Tile = memo(function Tile({ icon, title, subtitle, children }: Props) {
  return (
    <section className="card flex flex-col items-stretch p-4">
      {children && <div className="mb-2">{children}</div>}
      <div className="mb-3 flex items-start gap-3">
        {icon}
        <div>
          <h4 className="text-sm font-semibold text-text-primary">{title}</h4>
          {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
        </div>
      </div>
      {children && <p className="text-sm text-text-muted">{children}</p>}
    </section>
  )
})