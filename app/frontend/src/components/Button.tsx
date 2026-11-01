import { memo, useEffect, useRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: ReactNode
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
}

export const Button = memo(function Button({ variant = 'primary', size = 'md', loading = false, children, className, ...rest }: Props) {
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => { ref.current?.focus() }, [ref])
  const style =
    variant === 'primary' ? 'btn-primary' :
    variant === 'danger' ? 'btn-danger' : 'btn-secondary'
  const sizeStyle = size === 'sm' ? 'px-3 py-1.5 text-sm' : size === 'lg' ? 'px-6 py-3 text-base' : 'px-4 py-2 text-sm'
  return (
    <button ref={ref} type="button" className={clsx(style, sizeStyle, className)} disabled={loading} {...rest}>
      {loading && <span className="animate-spin mr-1.5">⟳</span>}
      {children}
    </button>
  )
})