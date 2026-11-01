import { useState } from 'react'
import {
  FileSearch,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Copy,
  Check,
  AlertCircle,
  Phone,
  User,
  Globe,
  Info,
} from 'lucide-react'
import { useTranslation } from '../i18n/index.js'
import { analyzeScamMessage, type AIScanResult } from '../services/resilientApi.js'

const SAMPLE_MESSAGES = [
  {
    label: 'Digital Arrest Threat',
    text: 'This is Inspector Sharma from CBI headquarters New Delhi. A parcel containing MDMA drugs was seized with your Aadhaar card. You are placed under digital arrest. Stay on Skype call or police will arrest you.',
  },
  {
    label: 'Electricity Power Disconnection',
    text: 'Dear consumer, your electricity power will be disconnected tonight at 9:30 PM from electric office because previous month bill was not updated. Immediately contact electricity officer at 9876543210.',
  },
  {
    label: 'Bank KYC Suspension',
    text: 'Dear SBI customer, your YONO account has been suspended today due to expired KYC. Please click link http://sbi-kyc-update.xyz to submit Aadhaar and PAN immediately.',
  },
  {
    label: 'Telegram Task Work-from-Home',
    text: 'Earn Rs 3000 to 8000 daily by working from home! Simple YouTube video liking task. Contact HR on WhatsApp 9811223344 or Telegram @task_mall.',
  },
  {
    label: 'Legitimate Bank Transaction',
    text: 'Your SBI account 1234 is credited with Rs 45,000 on 31-Oct-2026 by NEFT salary transfer. Avail balance Rs 54,230.',
  },
]

export function AIScamScanner({
  onLookupIdentifier,
  onReportIdentifier,
}: {
  onLookupIdentifier?: (type: string, value: string) => void
  onReportIdentifier?: (type: string, value: string, category: string) => void
}) {
  const { t, lang } = useTranslation()
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AIScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const handleScan = async (textToScan?: string) => {
    const text = (textToScan !== undefined ? textToScan : inputText).trim()
    if (!text) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const data = await analyzeScamMessage(text)
      setResult(data)
    } catch (err) {
      setError((err as Error).message || 'Failed to connect to the classification service.')
    } finally {
      setLoading(false)
    }
  }

  const copyVal = (val: string, key: string) => {
    navigator.clipboard.writeText(val)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Scanner Input Card */}
      <div className="samanvaya-card p-6 sm:p-8 space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EAF3EA] border border-[#CADFCC] text-[10px] font-mono uppercase tracking-wider text-[#24543B] font-bold mb-2">
            {t.scanner.badge}
          </div>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#193A2A]">
            {t.scanner.title}
          </h2>
          <p className="text-xs sm:text-sm text-[#78877D] mt-1">
            {t.scanner.subtitle}
          </p>
        </div>

        {/* Clear Advisory Disclaimer */}
        <div className="p-3.5 rounded-xl bg-[#F8FAF7] border border-[#DCE7DD] text-xs text-[#78877D] flex items-start gap-2.5">
          <Info size={15} className="text-[#24543B] shrink-0 mt-0.5" />
          <span>{t.scanner.disclaimer}</span>
        </div>

        {/* Text Area */}
        <div className="space-y-3">
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={t.scanner.inputPlaceholder}
            rows={4}
            className="input-editorial font-sans"
          />

          {/* Sample Prompts */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[#78877D] font-mono text-[11px]">{t.scanner.sampleLabel}</span>
            {SAMPLE_MESSAGES.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputText(sample.text)
                  handleScan(sample.text)
                }}
                className="px-2.5 py-1 rounded-full bg-[#EAF3EA] hover:bg-[#CADFCC]/40 border border-[#CADFCC] text-[11px] font-mono text-[#24543B] transition-colors"
              >
                {sample.label}
              </button>
            ))}
          </div>

          {/* Action Button */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => handleScan()}
              disabled={loading || !inputText.trim()}
              className="btn-primary !py-2 !px-5"
            >
              <FileSearch size={15} />
              <span>{loading ? t.scanner.scanning : t.scanner.scanBtn}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-[#FFF5F5] border border-[#BA1A1A]/30 text-[#BA1A1A] text-xs flex items-center gap-2">
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Classification Result Card */}
      {result && (
        <div className="samanvaya-card p-6 sm:p-8 space-y-6 animate-slide-up">
          {/* Header Assessment */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCE7DD]">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  result.is_scam
                    ? 'bg-[#FFF5F5] border-[#BA1A1A]/30 text-[#BA1A1A]'
                    : 'bg-[#EAF3EA] border-[#CADFCC] text-[#24543B]'
                }`}
              >
                {result.is_scam ? <AlertTriangle size={22} /> : <CheckCircle size={22} />}
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#78877D] block">
                  {t.scanner.resultsHeader}
                </span>
                <h3 className="font-heading font-bold text-lg text-[#193A2A]">
                  {result.is_scam ? t.scanner.intentDetected : t.scanner.intentClean}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                  result.is_scam ? 'bg-[#BA1A1A] text-white' : 'bg-[#24543B] text-white'
                }`}
              >
                {result.risk_level}
              </span>
              <span className="text-xs font-mono text-[#78877D] bg-[#F1F4F0] px-2.5 py-1 rounded-full border border-[#DCE7DD]">
                {result.predicted_category.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>

          {/* Extracted IOCs (Phone numbers, UPI, URLs) */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-[#78877D]">
              {t.scanner.extractedIocs}
            </h4>

            {result.extracted_iocs.phones.length === 0 &&
            result.extracted_iocs.upis.length === 0 &&
            result.extracted_iocs.urls.length === 0 ? (
              <p className="text-xs text-[#78877D] italic bg-[#F8FAF7] p-3 rounded-lg border border-[#DCE7DD]">
                {t.scanner.noIocs}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Phone Numbers */}
                {result.extracted_iocs.phones.map((phone, i) => (
                  <div
                    key={`p-${i}`}
                    className="p-3 rounded-xl bg-white border border-[#DCE7DD] space-y-2 text-xs"
                  >
                    <div className="flex items-center gap-1.5 text-[#24543B] font-mono">
                      <Phone size={13} />
                      <span className="font-bold">{phone}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-[#DCE7DD]">
                      <button
                        onClick={() => onLookupIdentifier?.('phone', phone)}
                        className="text-[#24543B] hover:underline font-semibold flex items-center gap-1 text-[11px]"
                      >
                        {t.scanner.verifyAction} →
                      </button>
                      <button
                        onClick={() => copyVal(phone, `p-${i}`)}
                        className="text-[#78877D] hover:text-[#193A2A]"
                      >
                        {copiedKey === `p-${i}` ? <Check size={12} className="text-[#24543B]" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                ))}

                {/* UPI Handles */}
                {result.extracted_iocs.upis.map((upi, i) => (
                  <div
                    key={`u-${i}`}
                    className="p-3 rounded-xl bg-white border border-[#DCE7DD] space-y-2 text-xs"
                  >
                    <div className="flex items-center gap-1.5 text-[#24543B] font-mono">
                      <User size={13} />
                      <span className="font-bold truncate">{upi}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-[#DCE7DD]">
                      <button
                        onClick={() => onLookupIdentifier?.('upi', upi)}
                        className="text-[#24543B] hover:underline font-semibold flex items-center gap-1 text-[11px]"
                      >
                        {t.scanner.verifyAction} →
                      </button>
                      <button
                        onClick={() => copyVal(upi, `u-${i}`)}
                        className="text-[#78877D] hover:text-[#193A2A]"
                      >
                        {copiedKey === `u-${i}` ? <Check size={12} className="text-[#24543B]" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                ))}

                {/* Phishing URLs */}
                {result.extracted_iocs.urls.map((url, i) => (
                  <div
                    key={`r-${i}`}
                    className="p-3 rounded-xl bg-white border border-[#DCE7DD] space-y-2 text-xs"
                  >
                    <div className="flex items-center gap-1.5 text-[#BA1A1A] font-mono">
                      <Globe size={13} />
                      <span className="font-bold truncate">{url}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-[#DCE7DD]">
                      <button
                        onClick={() => onLookupIdentifier?.('url', url)}
                        className="text-[#24543B] hover:underline font-semibold flex items-center gap-1 text-[11px]"
                      >
                        {t.scanner.verifyAction} →
                      </button>
                      <button
                        onClick={() => copyVal(url, `r-${i}`)}
                        className="text-[#78877D] hover:text-[#193A2A]"
                      >
                        {copiedKey === `r-${i}` ? <Check size={12} className="text-[#24543B]" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Trigger Signals */}
          {result.risk_signals.length > 0 && (
            <div className="pt-2 border-t border-[#DCE7DD] space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#78877D] block">
                {t.scanner.signalsDetected}:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {result.risk_signals.map((sig, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-0.5 rounded-full bg-[#EAF3EA] text-[#24543B] font-mono border border-[#CADFCC]"
                  >
                    #{sig}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
