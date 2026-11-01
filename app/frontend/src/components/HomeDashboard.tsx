import { useState, useEffect } from 'react'
import {
  Search,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  PhoneCall,
  Activity,
  Flame,
  FileSearch,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import { useTranslation } from '../i18n/index.js'
import { HeroScrollSection } from './HeroScrollSection.js'
import { ArchitectureSection } from './ArchitectureSection.js'
import { IndiaThreatMap } from './IndiaThreatMap.js'

interface HomeDashboardProps {
  onSearch: (type: string, value: string) => void
  onNavigate: (page: string) => void
}

export function HomeDashboard({ onSearch, onNavigate }: HomeDashboardProps) {
  const { t, lang } = useTranslation()

  // Real backend telemetry states
  const [healthOk, setHealthOk] = useState<boolean | null>(null)
  const [mapClusters, setMapClusters] = useState<any[]>([])
  const [alertsCount, setAlertsCount] = useState<number>(0)
  const [totalReportCount, setTotalReportCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)

  // Fetch real backend metrics
  useEffect(() => {
    let cancelled = false
    async function fetchBackendData() {
      setLoading(true)
      try {
        // 1. Health check
        const healthRes = await fetch('/api/health').catch(() => null)
        if (healthRes && healthRes.ok) {
          if (!cancelled) setHealthOk(true)
        } else {
          if (!cancelled) setHealthOk(false)
        }

        // 2. Real Map clusters
        const mapRes = await fetch('/api/map?days=30').catch(() => null)
        if (mapRes && mapRes.ok) {
          const text = await mapRes.text()
          if (text && text.trim()) {
            const mapData = JSON.parse(text)
            if (!cancelled && mapData.clusters) {
              const list = mapData.clusters || []
              setMapClusters(list)
              const sumReports = list.reduce((acc: number, c: any) => acc + (c.count || 0), 0)
              setTotalReportCount(sumReports)
            }
          }
        }

        // 3. Real Alerts
        const alertsRes = await fetch('/api/alerts').catch(() => null)
        if (alertsRes && alertsRes.ok) {
          const text = await alertsRes.text()
          if (text && text.trim()) {
            const alertData = JSON.parse(text)
            if (!cancelled && alertData.alerts) {
              setAlertsCount((alertData.alerts || []).length)
            }
          }
        }
      } catch {
        // gracefully handle
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchBackendData()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="w-full space-y-16">
      {/* 1. SCROLL-DRIVEN HERO SECTION (Video Scrubbing) */}
      <HeroScrollSection
        onCheckClick={() => onNavigate('lookup')}
        onExploreClick={() => {
          const archElement = document.getElementById('architecture-engine')
          if (archElement) {
            archElement.scrollIntoView({ behavior: 'smooth' })
          }
        }}
      />

      {/* 2. REAL OPERATIONAL DASHBOARD METRICS (Zero Fabricated Data) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-2 border-b border-[#DCE7DD]">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#78877D] font-bold block">
              REAL-TIME OPERATIONAL INTELLIGENCE
            </span>
            <h2 className="font-heading font-extrabold text-2xl text-[#193A2A]">
              {t.dashboard.title}
            </h2>
            <p className="text-xs text-[#78877D] mt-0.5">
              {t.dashboard.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                healthOk === true ? 'bg-[#24543B]' : healthOk === false ? 'bg-[#BA1A1A]' : 'bg-[#D97869]'
              }`}
            />
            <span className="text-[#193A2A] font-semibold">
              {healthOk === true
                ? t.dashboard.statusOperational
                : healthOk === false
                ? t.dashboard.statusOffline
                : 'Connecting to API...'}
            </span>
          </div>
        </div>

        {/* 4 Genuine Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="samanvaya-card p-5 space-y-1 bg-white">
            <span className="text-[11px] font-mono uppercase text-[#78877D] block">
              {t.dashboard.verifiedReports}
            </span>
            <div className="font-heading font-extrabold text-2xl sm:text-3xl text-[#193A2A]">
              {loading ? '...' : totalReportCount > 0 ? totalReportCount : t.dashboard.noDataYet}
            </div>
            <span className="text-[10px] font-mono text-[#78877D] block">
              {totalReportCount > 0 ? 'Corroborated 30D reports' : 'Database baseline ready'}
            </span>
          </div>

          <div className="samanvaya-card p-5 space-y-1 bg-white">
            <span className="text-[11px] font-mono uppercase text-[#78877D] block">
              {t.dashboard.activeAlerts}
            </span>
            <div className="font-heading font-extrabold text-2xl sm:text-3xl text-[#24543B]">
              {loading ? '...' : alertsCount}
            </div>
            <span className="text-[10px] font-mono text-[#78877D] block">
              Surge threshold advisories
            </span>
          </div>

          <div className="samanvaya-card p-5 space-y-1 bg-white">
            <span className="text-[11px] font-mono uppercase text-[#78877D] block">
              {t.dashboard.monitoredZones}
            </span>
            <div className="font-heading font-extrabold text-2xl sm:text-3xl text-[#193A2A]">
              25
            </div>
            <span className="text-[10px] font-mono text-[#78877D] block">
              National postal centroids
            </span>
          </div>

          <div className="samanvaya-card p-5 space-y-1 bg-white">
            <span className="text-[11px] font-mono uppercase text-[#78877D] block">
              {t.dashboard.systemStatus}
            </span>
            <div className="font-heading font-extrabold text-xl sm:text-2xl text-[#24543B] flex items-center gap-1.5 pt-1">
              <CheckCircle size={20} className="text-[#24543B]" />
              <span>{healthOk ? 'Healthy' : 'Offline'}</span>
            </div>
            <span className="text-[10px] font-mono text-[#78877D] block">
              Ed25519 Signed License
            </span>
          </div>
        </div>
      </section>

      {/* 3. EXPLODED BACKEND ARCHITECTURE SECTION (Video Scrubbing) */}
      <div id="architecture-engine">
        <ArchitectureSection />
      </div>

      {/* 4. GEOSPATIAL THREAT RADAR OVERVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <IndiaThreatMap />
      </section>

      {/* 5. STATUTORY EMERGENCY CYBERCRIME BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 rounded-2xl bg-[#EAF3EA] border border-[#CADFCC] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#24543B]">
              <PhoneCall size={14} />
              <span>OFFICIAL STATUTORY CYBERCRIME REPORTING HOTLINE</span>
            </div>
            <p className="text-xs sm:text-sm text-[#193A2A] max-w-2xl leading-relaxed">
              {t.dashboard.statutoryNotice}
            </p>
          </div>

          <a
            href="tel:1930"
            className="btn-primary !py-2.5 !px-5 shrink-0 text-xs font-mono font-bold"
          >
            <PhoneCall size={14} />
            <span>Call 1930</span>
          </a>
        </div>
      </section>
    </div>
  )
}
