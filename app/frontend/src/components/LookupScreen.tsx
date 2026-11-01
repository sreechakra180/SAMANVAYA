import { useState, useEffect } from 'react'
import { Search, Loader2, Phone, User, Globe, IdCard, AlertCircle, Sparkles } from 'lucide-react'
import { useTranslation } from '../i18n/index.js'
import { VerdictBadge } from './VerdictBadge.js'
import type { IdentifierType } from '../validation/schemas.js'
import { detectIdentifierType, getIdentifierLabel } from '../utils/detector.js'
import { lookupIdentifier, type LookupResult } from '../services/resilientApi.js'

interface LookupScreenProps {
  initialType?: IdentifierType
  initialValue?: string
  onDisputeTrigger?: () => void
  onReportTrigger?: (type: string, value: string) => void
}

export function LookupScreen({
  initialType = 'phone',
  initialValue = '',
  onDisputeTrigger,
  onReportTrigger,
}: LookupScreenProps) {
  const { t, lang } = useTranslation()
  const [type, setType] = useState<IdentifierType>(initialType)
  const [value, setValue] = useState(initialValue)
  const [autoDetected, setAutoDetected] = useState<IdentifierType | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any | null>(null)

  useEffect(() => {
    if (initialValue) {
      setValue(initialValue)
      setType(initialType)
      runLookup(initialType, initialValue)
    }
  }, [initialType, initialValue])

  // Intelligent real-time type detection on input
  const handleInputChange = (val: string) => {
    setValue(val)
    const detected = detectIdentifierType(val)
    if (detected) {
      setType(detected)
      setAutoDetected(detected)
    } else if (!val.trim()) {
      setAutoDetected(null)
    }
  }

  const runLookup = async (lookupType = type, lookupValue = value) => {
    const trimmed = lookupValue.trim()
    if (!trimmed) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const data = await lookupIdentifier(lookupType, trimmed)
      setResult(data)
    } catch (err) {
      setError((err as Error).message || 'Unable to connect to verification server.')
    } finally {
      setLoading(false)
    }
  }

  const SAMPLE_ITEMS = [
    { label: 'Cyber Helpline 1930', type: 'phone' as const, value: '1930' },
    { label: 'Sample Reported Phone', type: 'phone' as const, value: '+919876543210' },
    { label: 'Official Bank Header', type: 'sender_id' as const, value: 'HDFCBK' },
    { label: 'Suspicious UPI', type: 'upi' as const, value: 'quickrefund@axl' },
    { label: 'Phishing Portal', type: 'url' as const, value: 'sbi-kyc-verify.top' },
  ]

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header & Search Card */}
      <div className="samanvaya-card p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#193A2A]">
            {t.lookup.title}
          </h2>
          <p className="text-xs sm:text-sm text-[#78877D] mt-1">
            {t.lookup.subtitle}
          </p>
        </div>

        {/* Type Selector Tabs & Auto-detection Pill */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-[#F1F4F0] border border-[#DCE7DD] rounded-xl overflow-x-auto">
            {[
              { key: 'phone', label: t.lookup.types.phone, icon: <Phone size={13} /> },
              { key: 'upi', label: t.lookup.types.upi, icon: <User size={13} /> },
              { key: 'url', label: t.lookup.types.url, icon: <Globe size={13} /> },
              { key: 'sender_id', label: t.lookup.types.sender_id, icon: <IdCard size={13} /> },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => {
                  setType(tab.key as IdentifierType)
                  setAutoDetected(null)
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  type === tab.key
                    ? 'bg-white text-[#24543B] font-semibold shadow-sm'
                    : 'text-[#78877D] hover:text-[#193A2A]'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {autoDetected && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EAF3EA] border border-[#CADFCC] text-xs font-mono text-[#24543B] font-semibold animate-fade-in self-start sm:self-auto shadow-xs">
              <Sparkles size={13} className="text-[#24543B]" />
              <span>Auto-detected: <strong className="underline decoration-[#24543B]/40 underline-offset-2">{getIdentifierLabel(autoDetected)}</strong></span>
            </div>
          )}
        </div>

        {/* Search Bar Input */}
        <div className="relative">
          <div className="flex items-center gap-3 bg-white border border-[#DCE7DD] focus-within:border-[#24543B] focus-within:ring-2 focus-within:ring-[#24543B]/10 rounded-xl px-4 py-3 transition-all shadow-sm">
            <div className="flex items-center gap-1.5 text-[#24543B] shrink-0 bg-[#EAF3EA] px-2.5 py-1 rounded-lg border border-[#CADFCC]/60">
              {type === 'phone' && <Phone size={15} />}
              {type === 'upi' && <User size={15} />}
              {type === 'url' && <Globe size={15} />}
              {type === 'sender_id' && <IdCard size={15} />}
              <span className="text-[11px] font-mono uppercase font-bold hidden sm:inline">{getIdentifierLabel(type)}</span>
            </div>
            <input
              type="text"
              value={value}
              onChange={e => handleInputChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runLookup()}
              placeholder={t.lookup.placeholder[type]}
              className="w-full bg-transparent text-sm text-[#193A2A] placeholder-[#78877D] focus:outline-none font-mono"
            />
            {value && (
              <button
                onClick={() => {
                  setValue('')
                  setAutoDetected(null)
                }}
                className="text-xs text-[#78877D] hover:text-[#193A2A] font-mono px-2"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => runLookup()}
              disabled={loading || !value.trim()}
              className="btn-primary !py-2 !px-4 !text-xs shrink-0 disabled:opacity-50"
            >
              {loading && <Loader2 size={13} className="animate-spin" />}
              <span>{loading ? t.lookup.searching : t.lookup.searchBtn}</span>
            </button>
          </div>
        </div>

        {/* Quick Samples */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[#78877D] font-mono text-[11px]">{t.hero.quickTry}</span>
          {SAMPLE_ITEMS.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                setType(item.type)
                setValue(item.value)
                setAutoDetected(item.type)
                runLookup(item.type, item.value)
              }}
              className="px-2.5 py-1 rounded-full bg-[#EAF3EA] hover:bg-[#CADFCC]/40 border border-[#CADFCC] text-[11px] font-mono text-[#24543B] transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-[#FFF5F5] border border-[#BA1A1A]/30 text-[#BA1A1A] text-xs flex items-center gap-2">
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Verdict Result Component */}
      {result && (
        <div className="animate-slide-up">
          <VerdictBadge
            verdict={result.verdict || 'NO_REPORTS'}
            displayValue={result.display_value || value}
            reportCount={result.report_count || 0}
            distinctReporters={result.distinct_reporters || 0}
            scamType={result.scam_type || null}
            evidence={result.evidence || []}
            onDisputeClick={onDisputeTrigger}
            onReportClick={() => onReportTrigger?.(type, value)}
          />
        </div>
      )}
    </div>
  )
}
