import { useState, useEffect } from 'react'
import {
  BellRing,
  AlertTriangle,
  Building2,
  FileCheck,
  CheckCircle,
  ExternalLink,
  Info,
  PhoneCall,
  Loader2,
  MapPin,
  Filter,
  Radio,
  ArrowRight,
  ShieldAlert,
  Flame,
  Phone,
  User,
  Globe,
  IdCard,
} from 'lucide-react'
import { useTranslation } from '../i18n/index.js'
import { AREAS } from '../data.js'
import { detectIdentifierType } from '../utils/detector.js'

interface AlertsScreenProps {
  initialPincode?: string
  onLookupIdentifier?: (type: string, value: string) => void
}

export function AlertsScreen({
  initialPincode = 'all',
  onLookupIdentifier,
}: AlertsScreenProps) {
  const { t, lang } = useTranslation()
  const [alerts, setAlerts] = useState<any[]>([])
  const [recentReports, setRecentReports] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState<'alerts' | 'dispute'>('alerts')
  const [selectedPincode, setSelectedPincode] = useState<string>(initialPincode)
  const [alertSubFilter, setAlertSubFilter] = useState<'all' | 'live' | 'surge'>('all')

  // Merchant dispute form state
  const [disputeIdType, setDisputeIdType] = useState('phone')
  const [disputeValue, setDisputeValue] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [reason, setReason] = useState('')
  const [disputeSuccess, setDisputeSuccess] = useState<boolean>(false)
  const [disputeLoading, setDisputeLoading] = useState<boolean>(false)
  const [disputeError, setDisputeError] = useState<string | null>(null)

  // Fetch real alerts and recent locality reports from backend with no-cache guarantee
  useEffect(() => {
    let cancelled = false
    async function loadAlerts() {
      setLoading(true)
      try {
        const queryParams = new URLSearchParams()
        if (selectedPincode !== 'all') {
          queryParams.append('pincode', selectedPincode)
        }
        queryParams.append('_t', Date.now().toString())

        const res = await fetch(`/api/alerts?${queryParams.toString()}`, {
          cache: 'no-store',
          headers: { 'Pragma': 'no-cache' },
        })
        if (res.ok) {
          const data = await res.json()
          if (!cancelled) {
            setAlerts(data.alerts || [])
            setRecentReports(data.recent_reports || [])
          }
        }
      } catch {
        // network failure handled
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadAlerts()
    return () => { cancelled = true }
  }, [selectedPincode])

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!disputeValue.trim() || !businessName.trim() || !contactEmail.trim()) {
      setDisputeError('Please provide all mandatory verification details.')
      return
    }

    setDisputeLoading(true)
    setDisputeError(null)

    try {
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier_type: disputeIdType,
          identifier_value: disputeValue.trim(),
          business_name: businessName.trim(),
          contact_email: contactEmail.trim(),
          reason: reason.trim() || 'Official commercial entity challenge',
        }),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.detail || `HTTP ${res.status}: Challenge submission failed`)
      }

      setDisputeSuccess(true)
    } catch (err) {
      setDisputeError((err as Error).message || 'Unable to submit dispute.')
    } finally {
      setDisputeLoading(false)
    }
  }

  const liveAlerts = alerts.filter(a => a.type === 'LIVE_REPORT')
  const surgeAlerts = alerts.filter(a => a.type === 'SPIKE' || a.type === 'NEW_TYPE')

  const displayedAlerts = alertSubFilter === 'live' 
    ? liveAlerts 
    : alertSubFilter === 'surge' 
    ? surgeAlerts 
    : alerts

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Top Banner Card */}
      <div className="samanvaya-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EAF3EA] border border-[#CADFCC] text-[10px] font-mono uppercase tracking-wider text-[#24543B] font-bold mb-2">
            <BellRing size={12} />
            <span>{t.alerts.badge}</span>
          </div>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#193A2A]">
            {t.alerts.title}
          </h2>
          <p className="text-xs sm:text-sm text-[#78877D] mt-1">
            {t.alerts.subtitle}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-[#F1F4F0] border border-[#DCE7DD] rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'alerts'
                ? 'bg-white text-[#24543B] shadow-sm'
                : 'text-[#78877D] hover:text-[#193A2A]'
            }`}
          >
            <span>Threat Alerts</span>
            <span className="px-1.5 py-0.2 rounded-full bg-[#EAF3EA] text-[10px] font-mono font-bold text-[#24543B]">
              {alerts.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('dispute')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'dispute'
                ? 'bg-white text-[#24543B] shadow-sm'
                : 'text-[#78877D] hover:text-[#193A2A]'
            }`}
          >
            Merchant Dispute
          </button>
        </div>
      </div>

      {/* TAB 1: Real Community Alerts */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {/* Corridor & Sub-Filter Bar */}
          <div className="p-4 bg-white border border-[#DCE7DD] rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-mono text-[#78877D]">
                <Filter size={14} className="text-[#24543B]" />
                <span className="font-semibold text-[#193A2A]">CORRIDOR:</span>
              </div>
              <select
                value={selectedPincode}
                onChange={e => setSelectedPincode(e.target.value)}
                className="input-editorial font-mono text-xs max-w-sm !py-1.5"
              >
                <option value="all">All 25 Monitored Corridors (National)</option>
                {Object.entries(AREAS).map(([pin, a]) => (
                  <option key={pin} value={pin}>
                    {a.locality}, {a.city} ({pin})
                  </option>
                ))}
              </select>
            </div>

            {/* Alert Category Filter Pills */}
            <div className="flex items-center gap-1.5 pt-2 border-t border-[#DCE7DD] overflow-x-auto text-xs">
              <button
                onClick={() => setAlertSubFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                  alertSubFilter === 'all'
                    ? 'bg-[#24543B] text-white shadow-xs'
                    : 'bg-[#F1F4F0] text-[#78877D] hover:text-[#193A2A]'
                }`}
              >
                All Threat Feeds ({alerts.length})
              </button>
              <button
                onClick={() => setAlertSubFilter('live')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                  alertSubFilter === 'live'
                    ? 'bg-[#BA1A1A] text-white shadow-xs'
                    : 'bg-[#FFF5F5] text-[#BA1A1A] hover:bg-[#FFE5E5]'
                }`}
              >
                <Radio size={12} className="animate-pulse" />
                <span>Live Citizen Reports ({liveAlerts.length})</span>
              </button>
              <button
                onClick={() => setAlertSubFilter('surge')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                  alertSubFilter === 'surge'
                    ? 'bg-[#24543B] text-white shadow-xs'
                    : 'bg-[#F1F4F0] text-[#78877D] hover:text-[#193A2A]'
                }`}
              >
                <Flame size={12} />
                <span>Surge Spikes ({surgeAlerts.length})</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="samanvaya-card p-12 text-center text-xs font-mono text-[#78877D]">
              <Loader2 size={18} className="animate-spin mx-auto mb-2 text-[#24543B]" />
              Refreshing active regional scam telemetry...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Part 1: Algorithmic Critical Alerts & Live Reports */}
              {displayedAlerts.length === 0 ? (
                <div className="samanvaya-card p-8 text-center space-y-3 bg-white">
                  <div className="w-12 h-12 rounded-full bg-[#EAF3EA] text-[#24543B] mx-auto flex items-center justify-center">
                    <CheckCircle size={24} />
                  </div>
                  <h3 className="font-heading font-bold text-lg text-[#193A2A]">
                    {t.alerts.emptyTitle}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#78877D] max-w-md mx-auto">
                    {t.alerts.emptyDesc}
                  </p>
                  {selectedPincode !== 'all' && (
                    <button
                      onClick={() => setSelectedPincode('all')}
                      className="btn-secondary !py-1.5 !px-3 !text-xs mt-2"
                    >
                      View All National Corridors
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayedAlerts.map((alt, idx) => {
                    const area = AREAS[alt.pincode]
                    const areaLabel = area ? `${area.locality}, ${area.city}` : `PIN ${alt.pincode}`
                    const isLive = alt.type === 'LIVE_REPORT'

                    return (
                      <div
                        key={alt.report_id || idx}
                        className={`samanvaya-card p-6 border-l-4 space-y-4 bg-white transition-all shadow-sm ${
                          isLive ? 'border-l-[#BA1A1A] ring-1 ring-[#BA1A1A]/10' : 'border-l-[#D97869]'
                        }`}
                      >
                        {/* Header Badge */}
                        <div className="flex items-center justify-between pb-3 border-b border-[#DCE7DD]">
                          {isLive ? (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FFF5F5] text-[#BA1A1A] border border-[#BA1A1A]/30">
                              <Radio size={11} className="animate-pulse" />
                              LIVE CITIZEN THREAT ALERT
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#FFF5F5] text-[#BA1A1A] border border-[#BA1A1A]/30">
                              {alt.type === 'SPIKE' ? t.alerts.spikeAlert : t.alerts.newTypeAlert}
                            </span>
                          )}
                          <span className="text-xs font-mono text-[#78877D]">
                            PIN {alt.pincode}
                          </span>
                        </div>

                        {/* Location and Vector */}
                        <div>
                          <h4 className="font-heading font-bold text-base text-[#193A2A]">
                            {areaLabel}
                          </h4>
                          <span className="text-xs font-mono text-[#24543B] block mt-0.5 font-bold">
                            VECTOR: {String(alt.scam_type || 'Unspecified').replace(/[-_]/g, ' ').toUpperCase()}
                          </span>
                        </div>

                        {/* Target Identifier Box for Live Reports */}
                        {isLive && alt.identifier_value && (
                          <div className="p-3 rounded-xl bg-[#F8FAF7] border border-[#DCE7DD] flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <span className="text-[10px] font-mono uppercase text-[#78877D] block">
                                Target Identifier ({alt.identifier_type || 'Phone'})
                              </span>
                              <span className="font-mono font-bold text-xs sm:text-sm text-[#193A2A] truncate block">
                                {alt.identifier_value}
                              </span>
                            </div>
                            <button
                              onClick={() => onLookupIdentifier?.(alt.identifier_type || 'phone', alt.identifier_value)}
                              className="btn-primary !py-1 !px-2.5 !text-[11px] font-mono shrink-0 flex items-center gap-1"
                            >
                              <span>Verify</span>
                              <ArrowRight size={11} />
                            </button>
                          </div>
                        )}

                        {/* Advisory Content */}
                        <div className="p-3 rounded-xl bg-[#F8FAF7] border border-[#DCE7DD] text-xs text-[#193A2A] leading-relaxed">
                          <strong className="block text-[#BA1A1A] mb-0.5 font-mono">{t.alerts.advisoryHeader}:</strong>
                          {alt.advice || (alt.type === 'SPIKE'
                            ? `Sudden surge of ${alt.count || 'multiple'} reports detected in the last 24h across ${alt.net_diversity || 'independent'} network segments. Exercise extreme caution.`
                            : `Novel attack vector '${String(alt.scam_type || '').replace(/[-_]/g, ' ')}' recently observed in this jurisdiction with zero prior history in 30 days.`
                          )}
                        </div>

                        {/* Bottom Metadata */}
                        <div className="flex items-center justify-between text-[11px] font-mono text-[#78877D] pt-2 border-t border-[#DCE7DD]">
                          <span>
                            {isLive
                              ? (alt.occurred_at ? `Reported ${new Date(alt.occurred_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Just Now')
                              : (alt.type === 'SPIKE' ? `24h Volume: ${alt.count} (vs ${alt.baseline_per_day}/day)` : 'Novel Threat Category')}
                          </span>
                          <a href="tel:1930" className="text-[#24543B] hover:underline font-semibold flex items-center gap-1">
                            <PhoneCall size={11} /> Dial 1930
                          </a>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Part 2: Verified Community Incidents by Locality */}
              <div className="space-y-3 pt-6 border-t border-[#DCE7DD]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading font-bold text-lg text-[#193A2A]">
                      {selectedPincode === 'all'
                        ? 'Recent Community Incidents (All 25 Corridors)'
                        : `Verified Community Incidents in ${AREAS[selectedPincode]?.locality || selectedPincode}`}
                    </h3>
                    <span className="text-xs font-mono text-[#78877D]">
                      {recentReports.length} incident{recentReports.length !== 1 ? 's' : ''} logged in active monitoring window
                    </span>
                  </div>
                </div>

                {recentReports.length === 0 ? (
                  <div className="p-6 rounded-xl bg-white border border-[#DCE7DD] text-center text-xs font-mono text-[#78877D]">
                    No recent incident reports recorded for this specific corridor.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentReports.map((rep, idx) => {
                      const area = AREAS[rep.pincode]
                      const locLabel = area ? `${area.locality}, ${area.city}` : `PIN ${rep.pincode}`
                      return (
                        <div
                          key={rep.report_id || idx}
                          className="p-3.5 sm:p-4 rounded-xl bg-white border border-[#DCE7DD] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#CADFCC] transition-colors shadow-2xs"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#EAF3EA] text-[#24543B] border border-[#CADFCC]">
                                {String(rep.scam_type || 'INCIDENT').replace(/[-_]/g, ' ').toUpperCase()}
                              </span>
                              <span className="text-xs font-bold text-[#193A2A] truncate">
                                {locLabel}
                              </span>
                              <span className="text-[10px] font-mono text-[#78877D]">
                                PIN {rep.pincode}
                              </span>
                            </div>
                            
                            {/* Target Identifier Line */}
                            {rep.identifier_value && (
                              <div className="flex items-center gap-2 text-xs font-mono">
                                <span className="text-[#78877D]">Target:</span>
                                <span className="font-bold text-[#193A2A]">{rep.identifier_value}</span>
                                {onLookupIdentifier && (
                                  <button
                                    onClick={() => onLookupIdentifier(rep.identifier_type || 'phone', rep.identifier_value)}
                                    className="text-[11px] text-[#24543B] hover:underline font-semibold"
                                  >
                                    Verify →
                                  </button>
                                )}
                              </div>
                            )}

                            <div className="flex items-center gap-2 text-xs text-[#78877D]">
                              <span>Reported via {rep.channel || 'Phone call'}</span>
                              {rep.has_screenshot && (
                                <span className="text-[10px] font-mono text-[#24543B] font-semibold bg-[#EAF3EA] px-1.5 py-0.2 rounded">
                                  ✓ Corroborated Evidence
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-left sm:text-right shrink-0">
                            <span className="text-[11px] font-mono text-[#78877D] block">
                              {rep.occurred_at ? new Date(rep.occurred_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                            </span>
                            <span className="text-[10px] font-mono text-[#24543B] font-bold">
                              STATUS: LOGGED &amp; VERIFIED
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Merchant Dispute Challenge Portal */}
      {activeTab === 'dispute' && (
        <div className="samanvaya-card p-6 sm:p-8 space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EAF3EA] border border-[#CADFCC] text-[10px] font-mono uppercase tracking-wider text-[#24543B] font-bold mb-2">
              <Building2 size={12} />
              <span>STATUTORY DISPUTE PROTOCOL</span>
            </div>
            <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-[#193A2A]">
              {t.dispute.title}
            </h3>
            <p className="text-xs sm:text-sm text-[#78877D] mt-1">
              {t.dispute.subtitle}
            </p>
          </div>

          {disputeSuccess ? (
            <div className="p-6 rounded-xl bg-[#EAF3EA] border border-[#CADFCC] text-center space-y-3">
              <CheckCircle size={28} className="text-[#24543B] mx-auto" />
              <h4 className="font-bold text-[#193A2A] text-sm">Dispute Application Submitted</h4>
              <p className="text-xs text-[#78877D] max-w-md mx-auto">
                Your statutory business dispute has been recorded. The flagged identifier has entered conditional review with immediate operational hold.
              </p>
              <button
                onClick={() => {
                  setDisputeSuccess(false)
                  setDisputeValue('')
                  setBusinessName('')
                  setContactEmail('')
                  setReason('')
                }}
                className="btn-secondary !py-1.5 !px-3 !text-xs"
              >
                File Another Dispute
              </button>
            </div>
          ) : (
            <form onSubmit={handleDisputeSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-[#78877D] block">Identifier Type</label>
                  <select
                    value={disputeIdType}
                    onChange={e => setDisputeIdType(e.target.value)}
                    className="input-editorial font-mono text-xs"
                  >
                    <option value="phone">Phone Number</option>
                    <option value="upi">UPI ID</option>
                    <option value="url">Website URL</option>
                    <option value="sender_id">SMS Sender ID</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-[#78877D] block">Challenged Identifier Value</label>
                  <input
                    type="text"
                    value={disputeValue}
                    onChange={e => {
                      const val = e.target.value
                      setDisputeValue(val)
                      const detected = detectIdentifierType(val)
                      if (detected) setDisputeIdType(detected)
                    }}
                    placeholder="e.g. +91 98450 12044, payment@merchant, or scam.top"
                    className="input-editorial font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-[#78877D] block">{t.dispute.businessName}</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    placeholder="Legal Commercial Entity Name"
                    className="input-editorial font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-[#78877D] block">{t.dispute.contactEmail}</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                    placeholder="official.compliance@company.com"
                    className="input-editorial font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-[#78877D] block">{t.dispute.reason}</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Explain why this commercial identifier is legitimate and authorized..."
                  className="input-editorial font-mono text-xs resize-none"
                />
              </div>

              {disputeError && (
                <div className="p-3 rounded-lg bg-[#FFF5F5] border border-[#BA1A1A]/30 text-[#BA1A1A] text-xs">
                  {disputeError}
                </div>
              )}

              <button
                type="submit"
                disabled={disputeLoading}
                className="btn-primary !py-2 !px-4 !text-xs disabled:opacity-50"
              >
                {disputeLoading ? 'Registering Dispute...' : t.dispute.submitBtn}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
