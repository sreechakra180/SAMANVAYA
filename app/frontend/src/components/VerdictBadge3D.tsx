import { useState, useRef, useEffect } from 'react'
import { ShieldCheck, ShieldAlert, AlertTriangle, Shield, Volume2, VolumeX, Copy, Check } from 'lucide-react'

export interface VerdictProps {
  verdict: 'KNOWN_SCAM' | 'SUSPICIOUS' | 'VERIFIED_BUSINESS' | 'NO_REPORTS'
  displayValue: string
  reportCount?: number
  distinctReporters?: number
  scamType?: string | null
  confidenceScore?: number
  evidence?: Array<{ timestamp?: string; channel?: string; scam_type?: string; weight?: number }>
  onDispute?: () => void
}

export function VerdictBadge3D({
  verdict,
  displayValue,
  reportCount = 0,
  distinctReporters = 0,
  scamType = null,
  confidenceScore = 0.88,
  evidence = [],
  onDispute,
}: VerdictProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [copied, setCopied] = useState(false)

  // 3D Tilt calculation on mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = ((y - centerY) / centerY) * -10
    const rotateY = ((x - centerX) / centerX) * 10
    setTilt({ x: rotateX, y: rotateY })
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setTilt({ x: 0, y: 0 })
  }

  // Web Speech API text-to-speech for accessibility (audio read-aloud)
  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) return
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }

    let message = ''
    if (verdict === 'KNOWN_SCAM') {
      message = `Warning! SatarkSetu Security Alert. The identifier ${displayValue} is a confirmed known scam with ${reportCount} independent reports. Do not send money, OTP, or personal details.`
    } else if (verdict === 'SUSPICIOUS') {
      message = `Caution. The identifier ${displayValue} has ${reportCount} suspicious reports and is under investigation. Verify before paying.`
    } else if (verdict === 'VERIFIED_BUSINESS') {
      message = `Verified entity. The identifier ${displayValue} is a confirmed legitimate organization or official helpline.`
    } else {
      message = `No reports found for ${displayValue}. Stay cautious when dealing with unknown parties.`
    }

    const utterance = new SpeechSynthesisUtterance(message)
    utterance.rate = 0.95
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    setIsSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  // Copy identifier to clipboard
  const copyValue = () => {
    navigator.clipboard.writeText(displayValue)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const config = {
    KNOWN_SCAM: {
      title: 'CONFIRMED KNOWN SCAM',
      subtitle: 'High-density multi-party scam wave confirmed by network telemetry.',
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
      borderClass: 'border-rose-500/40 hover:border-rose-500/70',
      glowClass: 'shadow-[0_0_50px_rgba(239,68,68,0.25)]',
      bgGradient: 'from-rose-950/40 via-[#0e111a] to-[#0a0d14]',
      icon: <ShieldAlert size={36} className="text-rose-400 animate-pulse" />,
      accentColor: '#ef4444',
      statusTag: 'CRITICAL THREAT',
    },
    SUSPICIOUS: {
      title: 'SUSPICIOUS ACTIVITY FLAGGED',
      subtitle: 'Uncorroborated victim reports detected. Under active corridor clustering.',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
      borderClass: 'border-amber-500/40 hover:border-amber-500/70',
      glowClass: 'shadow-[0_0_50px_rgba(245,158,11,0.2)]',
      bgGradient: 'from-amber-950/30 via-[#0e111a] to-[#0a0d14]',
      icon: <AlertTriangle size={36} className="text-amber-400" />,
      accentColor: '#f59e0b',
      statusTag: 'ELEVATED RISK',
    },
    VERIFIED_BUSINESS: {
      title: 'VERIFIED OFFICIAL ENTITY',
      subtitle: 'Whitelisted public institution or official banking / national emergency helpline.',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
      borderClass: 'border-emerald-500/40 hover:border-emerald-500/70',
      glowClass: 'shadow-[0_0_50px_rgba(16,185,129,0.25)]',
      bgGradient: 'from-emerald-950/30 via-[#0e111a] to-[#0a0d14]',
      icon: <ShieldCheck size={36} className="text-emerald-400" />,
      accentColor: '#10b981',
      statusTag: 'OFFICIALLY VERIFIED',
    },
    NO_REPORTS: {
      title: 'NO ACTIVE REPORTS ON FILE',
      subtitle: 'This identifier currently has 0 recorded complaints in the telemetry database.',
      badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      borderClass: 'border-cyan-500/30 hover:border-cyan-500/60',
      glowClass: 'shadow-[0_0_30px_rgba(6,182,212,0.15)]',
      bgGradient: 'from-cyan-950/20 via-[#0e111a] to-[#0a0d14]',
      icon: <Shield size={36} className="text-cyan-400" />,
      accentColor: '#06b6d4',
      statusTag: 'CLEAR BASELINE',
    },
  }[verdict]

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(${isHovered ? 1.015 : 1}, ${isHovered ? 1.015 : 1}, 1)`,
        transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
      }}
      className={`relative w-full rounded-2xl p-6 sm:p-8 bg-gradient-to-b ${config.bgGradient} border ${config.borderClass} ${config.glowClass} backdrop-blur-xl transition-all duration-300`}
    >
      {/* 3D Dynamic Specular Gloss Highlight */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-20 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${50 + tilt.y * 3}% ${50 - tilt.x * 3}%, ${config.accentColor}, transparent 65%)`,
        }}
      />

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="relative p-3 rounded-xl bg-white/5 border border-white/10 shadow-lg">
            {config.icon}
            {/* Pulsing beacon glow */}
            <span
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-ping"
              style={{ backgroundColor: config.accentColor }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[11px] font-mono font-bold tracking-wider px-2.5 py-0.5 rounded border ${config.badgeClass}`}>
                {config.statusTag}
              </span>
              {scamType && (
                <span className="text-[11px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                  {scamType.replace('_', ' ').toUpperCase()}
                </span>
              )}
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {config.title}
            </h3>
          </div>
        </div>

        {/* Action Buttons: Audio Read-Aloud & Copy */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={toggleSpeech}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              isSpeaking
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 animate-pulse'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
            }`}
            title="Listen to verdict audio"
          >
            {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
            <span>{isSpeaking ? 'Stop Audio' : 'Read Verdict'}</span>
          </button>

          <button
            onClick={copyValue}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
            title="Copy identifier"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Center Identifier Showcase */}
      <div className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-1">
            TARGET IDENTIFIER
          </span>
          <span className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-wider">
            {displayValue}
          </span>
          <p className="text-sm text-slate-400 mt-2 max-w-xl">
            {config.subtitle}
          </p>
        </div>

        {/* Tactical Telemetry Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <span className="text-[10px] text-slate-400 block">REPORTS</span>
            <span className="text-xl font-bold text-white">{reportCount}</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <span className="text-[10px] text-slate-400 block">CLUSTERS</span>
            <span className="text-xl font-bold text-cyan-400">{distinctReporters}</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 block">TRUST SCORE</span>
            <span
              className="text-xl font-bold"
              style={{ color: config.accentColor }}
            >
              {verdict === 'VERIFIED_BUSINESS' ? '1.00' : verdict === 'NO_REPORTS' ? '0.00' : (confidenceScore * 100).toFixed(0) + '%'}
            </span>
          </div>
        </div>
      </div>

      {/* Evidence Timeline (if available) */}
      {evidence && evidence.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-3">
            CORROBORATED TELEMETRY EVIDENCE
          </span>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
            {evidence.map((ev, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs bg-white/5 p-2.5 rounded-lg border border-white/5"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                  <span className="font-mono text-slate-300">{ev.scam_type || 'unclassified'}</span>
                  <span className="text-slate-500">via</span>
                  <span className="text-slate-400 font-medium">{ev.channel || 'direct'}</span>
                </div>
                <span className="font-mono text-slate-500">{ev.timestamp ? new Date(ev.timestamp).toLocaleDateString() : 'recent'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Dispute / Challenge Trigger */}
      {onDispute && verdict !== 'VERIFIED_BUSINESS' && (
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Is this your legitimate business or merchant handle?
          </span>
          <button
            onClick={onDispute}
            className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 transition-colors"
          >
            Submit Formal Challenge →
          </button>
        </div>
      )}
    </div>
  )
}

