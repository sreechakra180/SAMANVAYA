import React, { type ReactNode } from 'react'
import { Navigation, type PageId } from './Navigation.js'
import { useTranslation } from '../i18n/index.js'
import { Shield } from 'lucide-react'

interface MainShellProps {
  current: PageId
  onSelect: (page: PageId) => void
  children: ReactNode
}

export function MainShell({ current, onSelect, children }: MainShellProps) {
  const { t, lang } = useTranslation()

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#193A2A] flex flex-col font-sans selection:bg-[#CADFCC] selection:text-[#193A2A]">
      {/* Top Main Navigation */}
      <Navigation current={current} onSelect={onSelect} />

      {/* Main Page Content */}
      <main className="flex-1 w-full pb-16">
        {children}
      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-[#DCE7DD] bg-white py-12 text-xs text-[#78877D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-[#24543B] flex items-center justify-center text-white font-bold text-xs tracking-wider">
                S
              </div>
              <span className="font-heading font-bold text-sm text-[#193A2A]">
                {t.brandName}
              </span>
              <span className="text-[#DCE7DD]">•</span>
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#78877D]">
                {t.brandDescriptor}
              </span>
            </div>

            <p className="font-mono text-[11px] text-[#78877D]">
              {t.footer.statutoryLinks}
            </p>
          </div>

          <div className="pt-4 border-t border-[#DCE7DD]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-[#78877D]">
            <span>{t.footer.copyright}</span>
            <span>Ed25519 Asymmetric Cryptographic License Protected</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
