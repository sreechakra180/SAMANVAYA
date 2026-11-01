import { useState } from 'react'
import {
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  Shield,
  Volume2,
  VolumeX,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'
import { useTranslation } from '../i18n/index.js'
import { formatFullDateTime } from '../utils/date.js'

export interface VerdictBadgeProps {
  verdict: 'KNOWN_SCAM' | 'SUSPICIOUS' | 'VERIFIED_BUSINESS' | 'NO_REPORTS'
  displayValue: string
  reportCount?: number
  distinctReporters?: number
  scamType?: string | null
  evidence?: Array<{ timestamp?: string; channel?: string; scam_type?: string; weight?: number }>
  onDisputeClick?: () => void
  onReportClick?: () => void
}

export function VerdictBadge({
  verdict,
  displayValue,
  reportCount = 0,
  distinctReporters = 0,
  scamType = null,
  evidence = [],
  onDisputeClick,
  onReportClick,
}: VerdictBadgeProps) {
  const { t, lang } = useTranslation()
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [copied, setCopied] = useState(false)

  // Speech API accessibility read-aloud
  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) return
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }

    const verdictText = t.lookup.verdicts[verdict]
    const message = lang === 'hi'
      ? `समनवय सुरक्षा सूचना। पहचानकर्ता ${displayValue} का परिणाम है: ${verdictText.badge}। ${verdictText.summary} सलाह: ${verdictText.recommendation}`
      : `Samanvaya security advisory. For identifier ${displayValue}, verdict is ${verdictText.badge}. ${verdictText.summary}. Advisory: ${verdictText.recommendation}`

    const utterance = new SpeechSynthesisUtterance(message)
    utterance.rate = 0.95
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    setIsSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  const copyIdentifier = () => {
    navigator.clipboard.writeText(displayValue)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const verdictStyles = {
    KNOWN_SCAM: {
      border: 'border-[#BA1A1A]',
      bg: 'bg-[#FFF5F5]',
      badgeBg: 'bg-[#BA1A1A]',
      badgeText: 'text-white',
      icon: <ShieldAlert size={28} className="text-[#BA1A1A]" />,
      accentColor: '#BA1A1A',
    },
    SUSPICIOUS: {
      border: 'border-[#D97869]',
      bg: 'bg-[#FFF9F7]',
      badgeBg: 'bg-[#D97869]',
      badgeText: 'text-white',
      icon: <AlertTriangle size={28} className="text-[#D97869]" />,
      accentColor: '#D97869',
    },
    VERIFIED_BUSINESS: {
      border: 'border-[#CADFCC]',
      bg: 'bg-[#EAF3EA]',
      badgeBg: 'bg-[#24543B]',
      badgeText: 'text-white',
      icon: <ShieldCheck size={28} className="text-[#24543B]" />,
      accentColor: '#24543B',
    },
    NO_REPORTS: {
      border: 'border-[#DCE7DD]',
      bg: 'bg-[#F8FAF7]',
      badgeBg: 'bg-[#78877D]',
      badgeText: 'text-white',
      icon: <Shield size={28} className="text-[#78877D]" />,
      accentColor: '#78877D',
    },
  }[verdict]

  const vData = t.lookup.verdicts[verdict]

  return (
    <div className={`samanvaya-card p-6 sm:p-8 border-2 ${verdictStyles.border} ${verdictStyles.bg} space-y-6 shadow-sm`}>
      {/* Top Banner Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCE7DD]">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-[#DCE7DD] shadow-sm shrink-0">
            {verdictStyles.icon}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold tracking-wider ${verdictStyles.badgeBg} ${verdictStyles.badgeText}`}>
                {vData.badge}
              </span>
              {scamType && (
                <span className="text-[11px] font-mono text-[#78877D] bg-white px-2 py-0.5 rounded border border-[#DCE7DD]">
                  {scamType.replace('_', ' ').toUpperCase()}
                </span>
              )}
            </div>
            <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-[#193A2A]">
              {displayValue}
            </h3>
          </div>
        </div>

        {/* Action Controls: Copy & Audio */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSpeech}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              isSpeaking
                ? 'bg-[#24543B] text-white border-[#24543B]'
                : 'bg-white text-[#193A2A] border-[#DCE7DD] hover:bg-[#F1F4F0]'
            }`}
            title="Audio Read-Aloud (Accessibility)"
          >
            {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
            <span>{isSpeaking ? t.lookup.stopAudio : t.lookup.readAloud}</span>
          </button>

          <button
            onClick={copyIdentifier}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-white text-[#193A2A] border border-[#DCE7DD] hover:bg-[#F1F4F0] flex items-center gap-1.5 transition-colors"
            title="Copy identifier"
          >
            {copied ? <Check size={14} className="text-[#24543B]" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Meaning & Advisory Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 space-y-2">
          <h4 className="text-xs font-mono uppercase tracking-wider text-[#78877D]">
            EVIDENCE ASSESSMENT & MEANING
          </h4>
          <p className="text-sm text-[#193A2A] leading-relaxed font-medium">
            {vData.summary}
          </p>
          <div className="p-3.5 rounded-xl bg-white border border-[#DCE7DD] text-xs text-[#193A2A] leading-relaxed">
            <strong className="text-[#24543B] block mb-0.5">Advisory Action:</strong>
            {vData.recommendation}
          </div>
        </div>

        {/* Real Metrics Box */}
        <div className="md:col-span-4 bg-white p-4 rounded-xl border border-[#DCE7DD] space-y-3 font-mono text-xs">
          <h4 className="text-[10px] text-[#78877D] uppercase tracking-wider block border-b border-[#DCE7DD] pb-1.5">
            CORROBORATION METRICS
          </h4>
          <div className="flex justify-between items-center">
            <span className="text-[#78877D]">{t.lookup.reportCount}:</span>
            <span className="font-bold text-[#193A2A] text-sm">{reportCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#78877D]">{t.lookup.clusterCount}:</span>
            <span className="font-bold text-[#24543B] text-sm">{distinctReporters}</span>
          </div>
        </div>
      </div>

      {/* Evidence Breakdown (if present) */}
      {evidence && evidence.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-[#DCE7DD]">
          <h4 className="text-[11px] font-mono uppercase tracking-wider text-[#78877D]">
            {t.lookup.evidenceHeader}
          </h4>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {evidence.map((ev, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-white border border-[#DCE7DD]"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#BA1A1A]" />
                  <span className="font-mono text-[#193A2A] font-semibold">{ev.scam_type || 'Unspecified'}</span>
                  <span className="text-[#78877D]">via {ev.channel || 'direct'}</span>
                </div>
                <span className="font-mono text-[#78877D]">
                  {ev.timestamp ? formatFullDateTime(ev.timestamp).date : 'Recent'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Dispute Link & Report Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#DCE7DD] text-xs">
        {verdict !== 'VERIFIED_BUSINESS' && onDisputeClick && (
          <div className="flex items-center gap-1.5 text-[#78877D]">
            <span>{t.lookup.disputePrompt}</span>
            <button
              onClick={onDisputeClick}
              className="text-[#24543B] hover:underline font-semibold"
            >
              {t.lookup.disputeLink} →
            </button>
          </div>
        )}

        {onReportClick && (
          <button
            onClick={onReportClick}
            className="text-[#BA1A1A] hover:underline font-semibold text-right"
          >
            Have you been contacted by this identifier? Report it →
          </button>
        )}
      </div>
    </div>
  )
}

