// Pure design-token vocabulary — copy into package.json Tailwind dark mode layer later.
export const TOKENS = {
  spacing: ['0', '0.25rem', '0.5rem', '0.75rem', '1rem', '1.25rem', '1.5rem', '2rem', '2.5rem', '3rem', '4rem'],
  radii:  ['0.25rem', '0.375rem', '0.5rem', '0.625rem', '0.75rem', '1rem', '1.25rem', '1.5rem', '1.75rem'],
  zIndex:  ['0', '10', '20', '30', '40', '50', '60', '70', '80', '90'],
  colors: {
    primary: '#2563eb',
    textPrimary: '#0f172a',
    textMuted: '#64748b',
    border: '#e2e8f0',
    scam: '#dc2626',
    danger: '#dc2626',
    ok: '#10b981',
    warn: '#f59e0b',
    surface: '#ffffff',
    surfaceMuted: '#f8fafc',
  },
  shadows: {
    sm: '0 1px 2px rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },
} as const
