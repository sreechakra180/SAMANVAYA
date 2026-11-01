import { useState } from 'react'
import { useTranslation } from '../i18n/index.js'
import { Menu, X, Globe, PhoneCall } from 'lucide-react'

export type PageId = 'home' | 'lookup' | 'scan' | 'radar' | 'alerts' | 'report'

interface NavigationProps {
  current: PageId
  onSelect: (page: PageId) => void
}

export function Navigation({ current, onSelect }: NavigationProps) {
  const { lang, t, toggleLang } = useTranslation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks: Array<{ id: PageId; label: string }> = [
    { id: 'home', label: t.nav.home },
    { id: 'lookup', label: t.nav.lookup },
    { id: 'scan', label: t.nav.scanner },
    { id: 'radar', label: t.nav.radar },
    { id: 'alerts', label: t.nav.alerts },
    { id: 'report', label: t.nav.report },
  ]

  const handleNavClick = (id: PageId) => {
    onSelect(id)
    setMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-[#F8FAF7]/90 backdrop-blur-md border-b border-[#DCE7DD] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: SAMANVAYA Custom Wordmark */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
            aria-label="Samanvaya Home"
          >
            {/* Subtle Minimalist Geometry Seal */}
            <div className="w-8 h-8 rounded-lg bg-[#24543B] flex items-center justify-center text-white font-bold text-sm tracking-widest shadow-sm">
              S
            </div>
            <div>
              <span className="font-heading font-extrabold text-lg tracking-tight text-[#193A2A] block leading-none">
                SAMANVAYA
              </span>
              <span className="text-[9px] font-mono tracking-widest text-[#78877D] uppercase block mt-0.5">
                {lang === 'hi' ? 'सामुदायिक आसूचना' : 'CYBER INTELLIGENCE'}
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 pl-4" aria-label="Main Navigation">
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  current === link.id
                    ? 'bg-[#EAF3EA] text-[#24543B] font-semibold'
                    : 'text-[#78877D] hover:text-[#193A2A] hover:bg-[#F1F4F0]'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right: Actions, Language Toggle, and Mobile Hamburger */}
        <div className="flex items-center gap-2.5">
          {/* Language Switcher */}
          <button
            onClick={toggleLang}
            className="px-2.5 py-1 rounded-full text-xs font-medium text-[#78877D] hover:text-[#193A2A] border border-[#DCE7DD] bg-white flex items-center gap-1.5 transition-colors"
            title="Switch Language / भाषा बदलें"
          >
            <Globe size={13} className="text-[#24543B]" />
            <span>{t.nav.languageToggle}</span>
          </button>

          {/* Primary Action Button */}
          <button
            onClick={() => handleNavClick('lookup')}
            className="hidden sm:inline-flex btn-primary !py-1.5 !px-3.5 !text-xs"
          >
            {t.nav.checkAction}
          </button>

          {/* Secondary Action Button */}
          <button
            onClick={() => handleNavClick('report')}
            className="hidden sm:inline-flex btn-secondary !py-1.5 !px-3.5 !text-xs"
          >
            {t.nav.reportAction}
          </button>

          {/* Official 1930 Helpline Anchor */}
          <a
            href="tel:1930"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EAF3EA] text-[#24543B] border border-[#CADFCC] text-xs font-mono font-medium hover:bg-[#CADFCC]/40 transition-colors"
            title="Official National Cybercrime Reporting Helpline"
          >
            <PhoneCall size={12} />
            <span>1930</span>
          </a>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-[#193A2A] rounded-lg hover:bg-[#EAF3EA]"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#DCE7DD] bg-white px-4 py-3 space-y-2 shadow-lg animate-fade-in">
          <div className="grid grid-cols-2 gap-2 pb-2 border-b border-[#DCE7DD]">
            <button
              onClick={() => handleNavClick('lookup')}
              className="btn-primary !py-2 !text-xs w-full justify-center"
            >
              {t.nav.checkAction}
            </button>
            <button
              onClick={() => handleNavClick('report')}
              className="btn-secondary !py-2 !text-xs w-full justify-center"
            >
              {t.nav.reportAction}
            </button>
          </div>

          <div className="space-y-1">
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  current === link.id
                    ? 'bg-[#EAF3EA] text-[#24543B] font-semibold'
                    : 'text-[#78877D] hover:bg-[#F1F4F0]'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}

