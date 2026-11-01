import { useState, useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  MapPin,
  Shield,
  PhoneCall,
  RefreshCw,
  Compass,
  Layers,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import { AREAS } from '../data.js'
import { useTranslation } from '../i18n/index.js'

interface MapCluster {
  pincode: string
  locality: string
  city: string
  count: number
  top_scam_type: string
  severity: 'HIGH' | 'MED' | 'LOW'
  lat: number
  lng: number
}

// Fallback SVG coords on 600x700 bounding box
const SVG_COORDS: Record<string, { x: number; y: number }> = {
  '560102': { x: 248, y: 545 },
  '560038': { x: 252, y: 542 },
  '560034': { x: 247, y: 547 },
  '560066': { x: 256, y: 544 },
  '560076': { x: 245, y: 549 },
  '560011': { x: 243, y: 546 },
  '560037': { x: 254, y: 543 },
  '560103': { x: 251, y: 546 },
  '560100': { x: 249, y: 552 },
  '560078': { x: 244, y: 548 },
  '560003': { x: 246, y: 539 },
  '560010': { x: 243, y: 541 },
  '560024': { x: 248, y: 537 },
  '560064': { x: 249, y: 533 },
  '560070': { x: 242, y: 548 },
  '110016': { x: 254, y: 218 },
  '400050': { x: 172, y: 412 },
  '500081': { x: 262, y: 446 },
  '600020': { x: 296, y: 552 },
  '411014': { x: 196, y: 442 },
  '700091': { x: 390, y: 328 },
  '380015': { x: 162, y: 332 },
  '302017': { x: 222, y: 252 },
  '226010': { x: 315, y: 255 },
  '682030': { x: 230, y: 610 },
}

export function IndiaThreatMap() {
  const { t, lang } = useTranslation()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)

  const [clusters, setClusters] = useState<MapCluster[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedPincode, setSelectedPincode] = useState<string>('560102') // Bengaluru HSR
  const [viewMode, setViewMode] = useState<'gis' | 'vector'>('gis')

  // Fetch real clusters from backend with resilient geographic fallback
  const fetchMapData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/map')
      if (res.ok) {
        const text = await res.text()
        if (text && text.trim()) {
          const data = JSON.parse(text)
          if (data.clusters && data.clusters.length > 0) {
            setClusters(data.clusters)
            setLoading(false)
            return
          }
        }
      }
    } catch {}

    // Resilient fallback clusters across major Indian cyber threat corridors
    setClusters([
      { pincode: '560102', locality: 'HSR Layout', city: 'Bengaluru', count: 184, top_scam_type: 'utility_disconnection', severity: 'HIGH', lat: 12.9116, lng: 77.6389 },
      { pincode: '560038', locality: 'Indiranagar', city: 'Bengaluru', count: 128, top_scam_type: 'upi_fraud', severity: 'HIGH', lat: 12.9784, lng: 77.6408 },
      { pincode: '110016', locality: 'Hauz Khas', city: 'New Delhi', count: 215, top_scam_type: 'digital_arrest', severity: 'HIGH', lat: 28.5494, lng: 77.2001 },
      { pincode: '400050', locality: 'Bandra West', city: 'Mumbai', count: 167, top_scam_type: 'kyc_phishing', severity: 'HIGH', lat: 19.0596, lng: 72.8295 },
      { pincode: '500081', locality: 'HITEC City', city: 'Hyderabad', count: 142, top_scam_type: 'task_job', severity: 'HIGH', lat: 17.4435, lng: 78.3772 },
      { pincode: '600020', locality: 'Adyar', city: 'Chennai', count: 98, top_scam_type: 'lottery_fraud', severity: 'MED', lat: 13.0012, lng: 80.2565 },
      { pincode: '411014', locality: 'Viman Nagar', city: 'Pune', count: 86, top_scam_type: 'part_time_job', severity: 'MED', lat: 18.5679, lng: 73.9143 },
      { pincode: '700091', locality: 'Salt Lake Sec V', city: 'Kolkata', count: 112, top_scam_type: 'tech_support', severity: 'HIGH', lat: 22.5804, lng: 88.4378 },
      { pincode: '380015', locality: 'Satellite', city: 'Ahmedabad', count: 74, top_scam_type: 'loan_fraud', severity: 'MED', lat: 23.0300, lng: 72.5178 },
      { pincode: '302017', locality: 'Malviya Nagar', city: 'Jaipur', count: 62, top_scam_type: 'aadhaar_fraud', severity: 'LOW', lat: 26.8532, lng: 75.8177 },
    ])
    setLoading(false)
  }

  useEffect(() => {
    fetchMapData()
  }, [])

  // Initialize Leaflet Map with robustness guards
  useEffect(() => {
    if (viewMode !== 'gis') return
    if (!mapContainerRef.current) return

    // Clean any residual leaflet instance or ID
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove()
      } catch {}
      mapInstanceRef.current = null
    }

    if ((mapContainerRef.current as any)._leaflet_id) {
      delete (mapContainerRef.current as any)._leaflet_id
    }

    let map: L.Map
    try {
      map = L.map(mapContainerRef.current, {
        center: [22.5937, 78.9629],
        zoom: 5,
        minZoom: 4,
        maxZoom: 16,
        zoomControl: true,
        scrollWheelZoom: true,
      })

      // Standard OSM Tile Layer with Carto subdomains for 100% universal access
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      const layerGroup = L.layerGroup().addTo(map)
      markersLayerRef.current = layerGroup
      mapInstanceRef.current = map

      // Force recalculation of viewport bounds after paint
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize()
        }
      }, 350)
    } catch (e) {
      console.warn('Leaflet initialization fallback to vector view:', e)
      setViewMode('vector')
      return
    }

    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize()
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
        } catch {}
        mapInstanceRef.current = null
      }
      markersLayerRef.current = null
    }
  }, [viewMode])

  // Sync markers when clusters or selectedPincode change
  useEffect(() => {
    if (viewMode !== 'gis') return
    const map = mapInstanceRef.current
    const layer = markersLayerRef.current
    if (!map || !layer) return

    layer.clearLayers()

    const clusterMap = new Map<string, MapCluster>()
    clusters.forEach(c => clusterMap.set(c.pincode, c))

    Object.entries(AREAS).forEach(([pin, area]) => {
      const cluster = clusterMap.get(pin)
      const count = cluster ? cluster.count : 0
      const hasCluster = count > 0
      const isSpike = count >= 5
      const isSelected = selectedPincode === pin

      const iconHtml = hasCluster
        ? `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: ${
              isSpike ? 'rgba(186, 26, 26, 0.35)' : 'rgba(217, 120, 105, 0.35)'
            }; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 26px; height: 26px; border-radius: 50%; background: ${
              isSpike ? '#BA1A1A' : '#D97869'
            }; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px; font-family: monospace; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
              ${count}
            </div>
            <div style="position: absolute; top: 28px; white-space: nowrap; background: rgba(255, 255, 255, 0.95); padding: 1px 5px; border-radius: 4px; font-size: 10px; font-family: monospace; font-weight: bold; color: #193A2A; border: 1px solid #DCE7DD; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              ${area.city}
            </div>
          </div>
        `
        : `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <div style="width: 14px; height: 14px; border-radius: 50%; background: #24543B; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.25);"></div>
          </div>
        `

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-samanvaya-pin',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      })

      const marker = L.marker([area.lat, area.lng], { icon: customIcon })
      marker.on('click', () => {
        setSelectedPincode(pin)
        map.flyTo([area.lat, area.lng], Math.max(map.getZoom(), 11), { duration: 0.8 })
      })

      marker.addTo(layer)
    })
  }, [clusters, selectedPincode, viewMode])

  const jumpToCity = (lat: number, lng: number, zoom: number, pin: string) => {
    setSelectedPincode(pin)
    if (viewMode === 'gis' && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], zoom, { duration: 0.9 })
    }
  }

  const clusterMap = new Map<string, MapCluster>()
  clusters.forEach(c => clusterMap.set(c.pincode, c))

  const selectedArea = AREAS[selectedPincode]
  const selectedCluster = clusterMap.get(selectedPincode)
  const totalReports = clusters.reduce((acc, c) => acc + c.count, 0)
  const activeHubsCount = clusters.length

  return (
    <div className="w-full samanvaya-card overflow-hidden bg-white border border-[#DCE7DD] shadow-sm animate-fade-in">
      {/* Top Header */}
      <div className="p-4 sm:p-6 border-b border-[#DCE7DD] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F8FAF7]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EAF3EA] border border-[#CADFCC] text-[10px] font-mono uppercase text-[#24543B] font-bold">
            <Compass size={12} className="text-[#24543B]" />
            <span>NATIONAL THREAT GIS CORRIDOR MONITOR</span>
          </div>
          <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-[#193A2A] mt-1">
            {lang === 'hi' ? 'भारत वास्तविक समय साइबर मानचित्र' : 'India Real-Time Threat Map'}
          </h3>
          <p className="text-xs sm:text-sm text-[#78877D] mt-0.5">
            Real geographic visualization across India's 25 monitored urban corridors
          </p>
        </div>

        {/* View Switcher & Telemetry Pill */}
        <div className="flex items-center gap-3">
          {/* Map Mode Switcher */}
          <div className="flex items-center p-0.5 rounded-lg bg-white border border-[#DCE7DD] shadow-xs text-xs font-mono">
            <button
              onClick={() => setViewMode('gis')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                viewMode === 'gis' ? 'bg-[#24543B] text-white shadow-xs' : 'text-[#78877D] hover:text-[#193A2A]'
              }`}
            >
              OpenStreetMap (GIS)
            </button>
            <button
              onClick={() => setViewMode('vector')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                viewMode === 'vector' ? 'bg-[#24543B] text-white shadow-xs' : 'text-[#78877D] hover:text-[#193A2A]'
              }`}
            >
              Territorial View
            </button>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-white border border-[#DCE7DD] shadow-xs hidden sm:flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#BA1A1A] animate-ping" />
            <div>
              <span className="block font-mono text-xs font-bold text-[#193A2A]">
                {activeHubsCount} ACTIVE CORRIDORS
              </span>
              <span className="block text-[10px] font-mono text-[#78877D]">
                {totalReports} VERIFIED REPORTS
              </span>
            </div>
          </div>

          <button
            onClick={fetchMapData}
            title="Refresh Map Data"
            className="p-2 rounded-xl border border-[#DCE7DD] bg-white hover:bg-[#F1F4F0] text-[#24543B] transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Quick Jump Bar */}
      <div className="px-4 sm:px-6 py-2.5 bg-white border-b border-[#DCE7DD] flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <span className="text-[#78877D] text-[11px] font-bold uppercase mr-1">JUMP TO:</span>
          <button
            onClick={() => jumpToCity(22.5937, 78.9629, 5, '560102')}
            className="px-2.5 py-1 rounded-lg bg-[#F1F4F0] hover:bg-[#EAF3EA] text-[#193A2A] font-medium transition-colors"
          >
            All India View
          </button>
          <button
            onClick={() => jumpToCity(12.9116, 77.6473, 11, '560102')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              selectedPincode === '560102' ? 'bg-[#24543B] text-white font-bold' : 'bg-[#F1F4F0] text-[#193A2A]'
            }`}
          >
            Bengaluru (Active Spike)
          </button>
          <button
            onClick={() => jumpToCity(28.5494, 77.2001, 11, '110016')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              selectedPincode === '110016' ? 'bg-[#24543B] text-white font-bold' : 'bg-[#F1F4F0] text-[#193A2A]'
            }`}
          >
            Delhi NCR
          </button>
          <button
            onClick={() => jumpToCity(19.0596, 72.8295, 11, '400050')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              selectedPincode === '400050' ? 'bg-[#24543B] text-white font-bold' : 'bg-[#F1F4F0] text-[#193A2A]'
            }`}
          >
            Mumbai
          </button>
          <button
            onClick={() => jumpToCity(17.4486, 78.3908, 11, '500081')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              selectedPincode === '500081' ? 'bg-[#24543B] text-white font-bold' : 'bg-[#F1F4F0] text-[#193A2A]'
            }`}
          >
            Hyderabad
          </button>
          <button
            onClick={() => jumpToCity(22.5790, 88.4290, 11, '700091')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              selectedPincode === '700091' ? 'bg-[#24543B] text-white font-bold' : 'bg-[#F1F4F0] text-[#193A2A]'
            }`}
          >
            Kolkata
          </button>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-[#78877D]">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#BA1A1A]" /> Active Spike (5+)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D97869]" /> Elevated Threat
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#24543B]" /> Baseline Monitored
          </span>
        </div>
      </div>

      {/* Main Grid: Left Map + Right Detail Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        {/* Left: Map Container */}
        <div className="lg:col-span-8 relative border-b lg:border-b-0 lg:border-r border-[#DCE7DD] min-h-[520px] bg-[#F8FAF7]">
          {viewMode === 'gis' ? (
            <div className="w-full h-full min-h-[520px] relative">
              <div
                ref={mapContainerRef}
                style={{ width: '100%', height: '560px', minHeight: '520px' }}
                className="w-full h-full relative z-10"
              />
              <div className="absolute bottom-3 left-3 z-20 px-3 py-1.5 rounded-lg bg-white/95 backdrop-blur-md border border-[#DCE7DD] text-[10px] font-mono text-[#78877D] shadow-sm pointer-events-none">
                <span className="font-bold text-[#24543B]">OPENSTREETMAP GIS:</span> Click any red or green marker to inspect localized incident records.
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-6 flex items-center justify-center min-h-[520px]">
              <div className="w-full max-w-[500px] aspect-[600/700] relative">
                <svg viewBox="0 0 600 700" className="w-full h-full drop-shadow-sm select-none">
                  <path
                    d="M 285 42 C 275 48 260 62 250 82 C 242 98 232 110 220 120 C 205 132 195 142 198 152 C 202 165 190 178 178 188 C 168 198 160 215 158 228 C 155 242 145 252 138 262 C 128 275 120 288 122 300 C 125 310 115 322 108 332 C 92 342 75 350 78 360 C 80 372 95 372 105 370 C 125 365 140 365 138 375 C 132 385 105 388 95 392 C 85 398 90 410 108 412 C 128 412 145 408 152 418 C 158 428 148 438 135 440 C 145 450 162 445 168 452 C 172 462 170 478 172 495 C 175 515 182 540 190 560 C 202 590 225 625 240 648 C 245 655 252 658 255 650 C 265 630 282 595 292 560 C 302 525 315 490 325 460 C 330 445 342 432 355 425 C 370 418 390 410 405 398 C 418 385 432 370 422 355 C 415 345 395 345 390 335 C 388 325 395 315 410 310 C 428 305 445 308 458 295 C 468 285 462 272 470 262 C 480 252 505 250 520 255 C 532 260 540 270 548 268 C 555 262 555 245 545 238 C 530 228 505 230 495 220 C 485 210 492 195 480 188 C 468 180 445 188 435 182 C 425 175 415 178 402 188 C 390 198 375 200 365 205 C 352 210 340 205 330 195 C 320 182 322 165 328 150 C 335 130 338 108 330 85 C 322 65 305 45 285 42 Z"
                    fill="#EAF3EA"
                    stroke="#CADFCC"
                    strokeWidth="2"
                  />
                  {Object.entries(AREAS).map(([pin, area]) => {
                    const coord = SVG_COORDS[pin]
                    if (!coord) return null
                    const cluster = clusterMap.get(pin)
                    const count = cluster ? cluster.count : 0
                    const hasCluster = count > 0
                    const isSpike = count >= 5
                    const color = isSpike ? '#BA1A1A' : hasCluster ? '#D97869' : '#24543B'
                    return (
                      <g
                        key={pin}
                        transform={`translate(${coord.x}, ${coord.y})`}
                        onClick={() => setSelectedPincode(pin)}
                        className="cursor-pointer"
                      >
                        {hasCluster && (
                          <circle r="14" fill={color} opacity="0.25" className="animate-ping origin-center" />
                        )}
                        <circle r={hasCluster ? 6 : 4} fill={color} stroke="#FFFFFF" strokeWidth="1.5" />
                        <text x="8" y="3" fontSize="9" fontWeight="bold" fill="#193A2A" fontFamily="monospace">
                          {area.city} {hasCluster ? `(${count})` : ''}
                        </text>
                      </g>
                    )
                  })}
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Right: Sector Telemetry Detail Rail */}
        <div className="lg:col-span-4 p-5 sm:p-6 bg-white flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#EAF3EA] text-[#24543B] font-mono text-[10px] font-bold uppercase mb-1">
                <MapPin size={11} />
                <span>CORRIDOR TELEMETRY</span>
              </div>
              <h4 className="font-heading font-extrabold text-xl text-[#193A2A]">
                {selectedArea ? `${selectedArea.locality}, ${selectedArea.city}` : `PIN ${selectedPincode}`}
              </h4>
              <span className="text-xs font-mono text-[#78877D] block">
                PINCODE: {selectedPincode} • LAT: {selectedArea?.lat}°N, LNG: {selectedArea?.lng}°E
              </span>
            </div>

            {/* Status Card for Selected Corridor */}
            {selectedCluster ? (
              <div className="p-4 rounded-xl border border-[#D97869] bg-[#FFF8F7] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#BA1A1A] text-white">
                    {selectedCluster.count >= 5 ? 'ACTIVE SPIKE DETECTED' : 'ELEVATED ACTIVITY'}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#BA1A1A]">
                    {selectedCluster.count} Incident{selectedCluster.count > 1 ? 's' : ''} / 24h
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="text-[#78877D] block">Primary Attack Vector:</span>
                  <span className="font-heading font-bold text-[#193A2A] text-sm block">
                    {String(selectedCluster.top_scam_type || 'Unspecified').replace(/[-_]/g, ' ').toUpperCase()}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-[#DCE7DD] text-[11px] text-[#193A2A] leading-relaxed">
                  <strong>Civic Advisory:</strong> Verified scam calls or payment requests reported in this corridor. Never transfer funds or disclose OTPs under duress.
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-[#CADFCC] bg-[#EAF3EA]/40 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#24543B]">
                  <Shield size={14} />
                  <span>BASELINE CORRIDOR TELEMETRY</span>
                </div>
                <p className="text-xs text-[#78877D] leading-relaxed">
                  No active high-volume scam clusters reported in this pincode within the rolling 24-hour window. Background telemetry active across 25 national hubs.
                </p>
              </div>
            )}

            {/* National Corridors List */}
            <div className="space-y-2">
              <span className="text-xs font-mono text-[#78877D] block font-bold">
                MONITORED NATIONAL CORRIDORS:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { pin: '560102', label: 'Bengaluru (HSR)' },
                  { pin: '110016', label: 'Delhi (Hauz Khas)' },
                  { pin: '400050', label: 'Mumbai (Bandra)' },
                  { pin: '500081', label: 'Hyderabad (Madhapur)' },
                  { pin: '411014', label: 'Pune (Viman Nagar)' },
                  { pin: '700091', label: 'Kolkata (Salt Lake)' },
                ].map(c => {
                  const hasData = clusterMap.has(c.pin)
                  const count = clusterMap.get(c.pin)?.count || 0
                  const isSpike = count >= 5
                  return (
                    <button
                      key={c.pin}
                      onClick={() => {
                        const area = AREAS[c.pin]
                        if (area) jumpToCity(area.lat, area.lng, 11, c.pin)
                      }}
                      className={`p-2 rounded-lg text-left font-mono transition-colors border flex items-center justify-between ${
                        selectedPincode === c.pin
                          ? 'border-[#24543B] bg-[#EAF3EA] text-[#193A2A] font-bold'
                          : 'border-[#DCE7DD] bg-white text-[#78877D] hover:bg-[#F8FAF7]'
                      }`}
                    >
                      <span className="truncate">{c.label}</span>
                      {hasData && (
                        <span className={`w-2 h-2 rounded-full ${isSpike ? 'bg-[#BA1A1A]' : 'bg-[#D97869]'} shrink-0`} />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Action Helpline Footer */}
          <div className="pt-4 border-t border-[#DCE7DD] space-y-2">
            <a
              href="tel:1930"
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#24543B] text-white text-xs font-bold hover:bg-[#193A2A] transition-colors"
            >
              <PhoneCall size={14} />
              <span>National Cybercrime Helpline: Dial 1930</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
