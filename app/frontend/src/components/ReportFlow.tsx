import { useState, useEffect } from 'react'
import {
  PhoneCall,
  MessageSquare,
  QrCode,
  Globe,
  Smartphone,
  Send,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Shield,
  FileCheck,
  Sparkles,
  BellRing,
  Phone,
  User,
  IdCard,
} from 'lucide-react'
import { AREAS, SCAM_TYPE_OPTIONS } from '../data.js'
import { useTranslation } from '../i18n/index.js'
import type { IdentifierType } from '../validation/schemas.js'
import { detectIdentifierType, getIdentifierLabel } from '../utils/detector.js'

interface ReportFlowProps {
  initialType?: IdentifierType
  initialValue?: string
  initialCategory?: string
  onDone?: () => void
  onViewLookup?: (type: string, value: string) => void
  onViewAlerts?: (pincode?: string) => void
  onResetInitial?: () => void
}

const CHANNEL_MAPPING: Record<string, string> = {
  phone: 'Phone call',
  sms: 'SMS or WhatsApp',
  qr: 'QR code',
  url: 'Fake website',
  apk: 'Something else',
  telegram: 'Something else',
}

export function ReportFlow({
  initialType = 'phone',
  initialValue = '',
  initialCategory = 'digital-arrest',
  onDone,
  onViewLookup,
  onViewAlerts,
  onResetInitial,
}: ReportFlowProps) {
  const { t, lang } = useTranslation()
  const [channel, setChannel] = useState<string>('phone')
  const [identifierType, setIdentifierType] = useState<IdentifierType>(initialType)
  const [identifierValue, setIdentifierValue] = useState<string>(initialValue)
  const [autoDetected, setAutoDetected] = useState<IdentifierType | null>(null)
  const [timeBucket, setTimeBucket] = useState<string>('t1h')
  const [scamType, setScamType] = useState<string>(initialCategory)
  const [pincode, setPincode] = useState<string>('560102')
  const [note, setNote] = useState<string>('')
  const [hasEvidence, setHasEvidence] = useState<boolean>(true)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<any | null>(null)

  useEffect(() => {
    if (initialValue) {
      setIdentifierValue(initialValue)
      const detected = detectIdentifierType(initialValue)
      if (detected) {
        setIdentifierType(detected)
        setAutoDetected(detected)
      } else if (initialType) {
        setIdentifierType(initialType)
      }
    }
  }, [initialValue, initialType])

  const handleIdentifierChange = (val: string) => {
    setIdentifierValue(val)
    const detected = detectIdentifierType(val)
    if (detected) {
      setIdentifierType(detected)
      setAutoDetected(detected)
    } else if (!val.trim()) {
      setAutoDetected(null)
    }
  }

  const CHANNELS = [
    { key: 'phone', label: 'Voice Call', desc: 'Direct fraud phone call', icon: <PhoneCall size={18} /> },
    { key: 'sms', label: 'SMS / WhatsApp', desc: 'Text or messaging app', icon: <MessageSquare size={18} /> },
    { key: 'qr', label: 'QR Code', desc: 'Reverse UPI payment QR', icon: <QrCode size={18} /> },
    { key: 'url', label: 'Phishing Web', desc: 'Fraudulent website / link', icon: <Globe size={18} /> },
    { key: 'apk', label: 'Malicious App', desc: 'Fake banking or loan APK', icon: <Smartphone size={18} /> },
    { key: 'telegram', label: 'Task Group', desc: 'Telegram task / crypto', icon: <Send size={18} /> },
  ]

  const TIME_OPTIONS = [
    { key: 't1h', label: 'Past 1 Hour', badge: 'Golden Hour' },
    { key: 't24h', label: 'Past 24 Hours', badge: 'Active Wave' },
    { key: 't7d', label: 'Past 7 Days', badge: 'Recent' },
    { key: 'tolder', label: 'Older Incident', badge: 'Historical' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifierValue.trim()) {
      setError('Please provide the phone number, UPI ID, or URL of the scammer.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Calculate occurred_at timestamp based on time bucket
      const now = Date.now()
      let deltaMs = 30 * 60 * 1000 // default 30 mins ago
      if (timeBucket === 't24h') deltaMs = 4 * 3600 * 1000
      else if (timeBucket === 't7d') deltaMs = 48 * 3600 * 1000
      else if (timeBucket === 'tolder') deltaMs = 10 * 86400 * 1000

      const occurredAt = new Date(now - deltaMs).toISOString()
      const reportedAt = new Date(now).toISOString()

      const clientUuid = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID().replace(/-/g, '')
        : Math.random().toString(36).slice(2) + Date.now().toString(36)

      const payload = {
        report_id: `rep_${clientUuid.slice(0, 12)}`,
        reporter_id: `usr_${clientUuid.slice(12, 20)}`,
        ip_prefix: '192.168.1.0/24',
        occurred_at: occurredAt,
        reported_at: reportedAt,
        identifier_type: identifierType,
        identifier_value: identifierValue.trim(),
        channel: CHANNEL_MAPPING[channel] || 'Phone call',
        scam_type: scamType.replace(/_/g, '-'),
        pincode: pincode,
        note: note.trim() || undefined,
        has_screenshot: hasEvidence,
        amount_lost_inr: 0,
      }

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        let msg = 'Submission failed'
        if (typeof errJson.detail === 'string') {
          msg = errJson.detail
        } else if (Array.isArray(errJson.detail)) {
          msg = errJson.detail
            .map((item: any) => {
              if (typeof item === 'string') return item
              const field = item.loc ? item.loc.slice(-1)[0] : 'field'
              return `${field}: ${item.msg || 'invalid'}`
            })
            .join(' • ')
        } else if (errJson.detail) {
          msg = JSON.stringify(errJson.detail)
        }
        throw new Error(msg)
      }

      const data = await res.json()
      const reportedPincode = pincode

      // Clear identifier value and reset form so it doesn't persist
      setIdentifierValue('')
      setAutoDetected(null)
      onResetInitial?.()

      // Automatically navigate directly to Alerts tab with the reported corridor!
      onViewAlerts?.(reportedPincode)
    } catch (err) {
      setError((err as Error).message || 'Failed to submit report.')
    } finally {
      setLoading(false)
    }
  }

  // Success Screen
  if (successData) {
    return (
      <div className="w-full max-w-2xl mx-auto samanvaya-card p-8 text-center space-y-6 animate-slide-up bg-white">
        <div className="w-14 h-14 rounded-full bg-[#EAF3EA] text-[#24543B] mx-auto flex items-center justify-center border border-[#CADFCC]">
          <CheckCircle size={28} />
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#24543B] font-bold">
            CONFIDENTIAL CIVIC INGESTION
          </span>
          <h2 className="font-heading font-extrabold text-2xl text-[#193A2A]">
            {t.report.successTitle}
          </h2>
          <p className="text-xs sm:text-sm text-[#78877D] max-w-md mx-auto">
            {t.report.successDesc}
          </p>
        </div>

        {/* Cryptographic Case Summary */}
        <div className="p-4 rounded-xl bg-[#F8FAF7] border border-[#DCE7DD] text-left font-mono space-y-2 text-xs">
          <div className="flex justify-between text-[#78877D]">
            <span>{t.report.reportId}:</span>
            <span className="font-bold text-[#193A2A]">{String(successData.report_id || 'rep_live')}</span>
          </div>
          <div className="flex justify-between text-[#78877D]">
            <span>Target Identifier:</span>
            <span className="font-bold text-[#24543B]">{successData.targetValue || 'Reported Entity'}</span>
          </div>
          <div className="flex justify-between text-[#78877D]">
            <span>Pipeline Status:</span>
            <span className="text-[#193A2A]">
              {successData.merged ? 'Correlated into Existing Cluster' : 'New Cluster Record Initialized'}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={() => {
              const pin = pincode
              setSuccessData(null)
              onViewAlerts?.(pin)
            }}
            className="btn-primary !py-2 !px-5 flex items-center justify-center gap-2"
          >
            <BellRing size={14} />
            <span>View in Community Alerts</span>
          </button>
          <button
            onClick={() => {
              const t = successData.targetType || 'phone'
              const v = successData.targetValue || ''
              setSuccessData(null)
              onViewLookup?.(t, v)
            }}
            className="btn-secondary !py-2 !px-5 flex items-center justify-center gap-2"
          >
            <span>Verify in Threat Lookup</span>
            <ArrowRight size={14} />
          </button>
          <button
            onClick={() => {
              setSuccessData(null)
              setIdentifierValue('')
              setAutoDetected(null)
              setNote('')
            }}
            className="btn-secondary !py-2 !px-4 !text-xs"
          >
            {t.report.anotherReportBtn}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div className="samanvaya-card p-6 sm:p-8 space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EAF3EA] border border-[#CADFCC] text-[10px] font-mono uppercase tracking-wider text-[#24543B] font-bold mb-2">
            {t.report.badge}
          </div>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#193A2A]">
            {t.report.title}
          </h2>
          <p className="text-xs sm:text-sm text-[#78877D] mt-1">
            {t.report.subtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Channel Selector (6 tactile cards) */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-[#78877D] block font-semibold">
              {t.report.channelLabel}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {CHANNELS.map(ch => (
                <button
                  type="button"
                  key={ch.key}
                  onClick={() => setChannel(ch.key)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    channel === ch.key
                      ? 'bg-[#EAF3EA] border-[#24543B] text-[#193A2A] shadow-sm'
                      : 'bg-white border-[#DCE7DD] text-[#78877D] hover:border-[#CADFCC]'
                  }`}
                >
                  <div className={`mb-1.5 ${channel === ch.key ? 'text-[#24543B]' : 'text-[#78877D]'}`}>
                    {ch.icon}
                  </div>
                  <span className="text-xs font-bold block text-[#193A2A]">{ch.label}</span>
                  <span className="text-[10px] text-[#78877D] block truncate">{ch.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Identifier Type & Value */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
              <label className="text-xs font-mono uppercase tracking-wider text-[#78877D] font-semibold">
                {t.report.identifierTypeLabel} &amp; Value
              </label>

              {autoDetected && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF3EA] border border-[#CADFCC] text-xs font-mono text-[#24543B] font-semibold animate-fade-in self-start sm:self-auto shadow-xs">
                  <Sparkles size={12} className="text-[#24543B]" />
                  <span>Auto-detected: <strong className="underline decoration-[#24543B]/40 underline-offset-2">{getIdentifierLabel(autoDetected)}</strong></span>
                </div>
              )}
            </div>

            {/* Type Selector Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-[#F1F4F0] border border-[#DCE7DD] rounded-xl overflow-x-auto">
              {[
                { key: 'phone', label: 'Phone Number', icon: <Phone size={13} /> },
                { key: 'upi', label: 'UPI VPA', icon: <User size={13} /> },
                { key: 'url', label: 'Website / Link', icon: <Globe size={13} /> },
                { key: 'sender_id', label: 'SMS Sender ID', icon: <IdCard size={13} /> },
              ].map(tab => (
                <button
                  type="button"
                  key={tab.key}
                  onClick={() => {
                    setIdentifierType(tab.key as IdentifierType)
                    setAutoDetected(null)
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    identifierType === tab.key
                      ? 'bg-white text-[#24543B] font-bold shadow-sm'
                      : 'text-[#78877D] hover:text-[#193A2A]'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Search / Value Input */}
            <div className="relative">
              <div className="flex items-center gap-2.5 bg-white border border-[#DCE7DD] focus-within:border-[#24543B] focus-within:ring-2 focus-within:ring-[#24543B]/10 rounded-xl px-3.5 py-2.5 transition-all shadow-sm">
                <div className="flex items-center gap-1.5 text-[#24543B] shrink-0 bg-[#EAF3EA] px-2.5 py-1 rounded-lg border border-[#CADFCC]/60">
                  {identifierType === 'phone' && <Phone size={15} />}
                  {identifierType === 'upi' && <User size={15} />}
                  {identifierType === 'url' && <Globe size={15} />}
                  {identifierType === 'sender_id' && <IdCard size={15} />}
                  <span className="text-[11px] font-mono uppercase font-bold hidden sm:inline">
                    {getIdentifierLabel(identifierType)}
                  </span>
                </div>
                <input
                  type="text"
                  value={identifierValue}
                  onChange={e => handleIdentifierChange(e.target.value)}
                  placeholder={
                    identifierType === 'phone'
                      ? 'Enter phone number (e.g. +91 98765 43210 or 1930)...'
                      : identifierType === 'upi'
                      ? 'Enter UPI ID (e.g. fraud@okhdfcbank or 9876543210@paytm)...'
                      : identifierType === 'url'
                      ? 'Enter website or phishing link (e.g. sbi-kyc-verify.top)...'
                      : 'Enter 6-char TRAI SMS header (e.g. VK-HDFCBK or HDFCBK)...'
                  }
                  className="w-full bg-transparent text-sm text-[#193A2A] placeholder-[#78877D] focus:outline-none font-mono"
                />
                {identifierValue && (
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifierValue('')
                      setAutoDetected(null)
                    }}
                    className="text-xs text-[#78877D] hover:text-[#193A2A] font-mono px-2 shrink-0"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 3. Incident Recency */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-[#78877D] block font-semibold">
              {t.report.timeBucketLabel}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TIME_OPTIONS.map(opt => (
                <button
                  type="button"
                  key={opt.key}
                  onClick={() => setTimeBucket(opt.key)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    timeBucket === opt.key
                      ? 'bg-[#EAF3EA] border-[#24543B] text-[#193A2A] font-semibold'
                      : 'bg-white border-[#DCE7DD] text-[#78877D]'
                  }`}
                >
                  <span className="text-xs block">{opt.label}</span>
                  <span className="text-[10px] font-mono text-[#24543B] block">{opt.badge}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Scam Category & Pincode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-[#78877D] block font-semibold">
                {t.report.scamTypeLabel}
              </label>
              <select
                value={scamType}
                onChange={e => setScamType(e.target.value)}
                className="input-editorial text-xs font-mono"
              >
                {SCAM_TYPE_OPTIONS.map(st => (
                  <option key={st.key} value={st.key}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-[#78877D] block font-semibold">
                {t.report.pincodeLabel}
              </label>
              <select
                value={pincode}
                onChange={e => setPincode(e.target.value)}
                className="input-editorial text-xs font-mono"
              >
                {Object.entries(AREAS).map(([pin, info]) => (
                  <option key={pin} value={pin}>
                    {pin} — {info.locality}, {info.city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 5. Incident Context Note */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-[#78877D]">
              <label className="font-mono uppercase tracking-wider font-semibold">
                {t.report.noteLabel}
              </label>
              <span className="font-mono text-[11px]">{note.length}/2000</span>
            </div>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              maxLength={2000}
              placeholder="Describe what occurred without sharing your own sensitive financial details..."
              rows={3}
              className="input-editorial text-xs font-sans resize-none"
            />
          </div>

          {/* Evidence Checkbox */}
          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F8FAF7] border border-[#DCE7DD] cursor-pointer hover:bg-[#F1F4F0] transition-colors">
            <input
              type="checkbox"
              checked={hasEvidence}
              onChange={e => setHasEvidence(e.target.checked)}
              className="w-4 h-4 rounded text-[#24543B] accent-[#24543B]"
            />
            <span className="text-xs text-[#193A2A]">
              {t.report.evidenceLabel}
            </span>
          </label>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-[#FFF5F5] border border-[#BA1A1A]/30 text-[#BA1A1A] text-xs flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading || !identifierValue.trim()}
            className="btn-primary w-full !py-3 !text-sm"
          >
            <FileCheck size={16} />
            <span>{loading ? t.report.submitting : t.report.submitBtn}</span>
          </button>
        </form>
      </div>
    </div>
  )
}
