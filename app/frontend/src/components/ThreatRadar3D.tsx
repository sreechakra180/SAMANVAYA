import { useEffect, useRef, useState } from 'react'
import { AREAS } from '../data.js'
import { RotateCcw, ZoomIn, ZoomOut, Compass, Info, MapPin } from 'lucide-react'
import { useTranslation } from '../i18n/index.js'

interface MapCluster {
  pincode: string
  locality: string
  city: string
  count: number
  top_scam_type?: string | null
  severity?: string
  lat: number
  lng: number
}

interface ThreatRadar3DProps {
  onSelectCluster?: (cluster: MapCluster) => void
  selectedPincode?: string | null
  days?: number
}

export function ThreatRadar3D({ onSelectCluster, selectedPincode, days = 7 }: ThreatRadar3DProps) {
  const { t, lang } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [clusters, setClusters] = useState<MapCluster[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [hoveredCluster, setHoveredCluster] = useState<MapCluster | null>(null)
  const [selectedCluster, setSelectedCluster] = useState<MapCluster | null>(null)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [lastMouse, setLastMouse] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  // 3D Camera Angles: Calm isometric orientation
  const rotationRef = useRef({ yaw: 0.12, pitch: 0.68, zoom: 1.0 })
  const sweepAngleRef = useRef(0)

  // Fetch genuine backend map data
  useEffect(() => {
    let cancelled = false
    async function loadMapData() {
      setLoading(true)
      try {
        const res = await fetch(`/api/map?days=${days}`)
        if (res.ok) {
          const data = await res.json()
          if (!cancelled) {
            setClusters(data.clusters || [])
          }
        }
      } catch {
        // network error handled gracefully
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadMapData()
    return () => { cancelled = true }
  }, [days])

  // Aggregate all 25 supported areas with real backend counts
  const allNodes: MapCluster[] = Object.entries(AREAS).map(([pin, info]) => {
    const liveMatch = clusters.find(c => c.pincode === pin)
    return {
      pincode: pin,
      locality: info.locality,
      city: info.city,
      lat: info.lat,
      lng: info.lng,
      count: liveMatch ? liveMatch.count : 0,
      top_scam_type: liveMatch ? liveMatch.top_scam_type : null,
      severity: liveMatch ? liveMatch.severity : 'BASELINE',
    }
  })

  // Set selected cluster if prop provided
  useEffect(() => {
    if (selectedPincode) {
      const match = allNodes.find(n => n.pincode === selectedPincode)
      if (match) setSelectedCluster(match)
    }
  }, [selectedPincode])

  // Canvas 3D Render Loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animFrame: number
    const centerLat = 20.5937
    const centerLng = 78.9629

    function render() {
      if (!canvas || !ctx) return
      const width = canvas.width
      const height = canvas.height
      ctx.clearRect(0, 0, width, height)

      sweepAngleRef.current += 0.015
      const sweepAngle = sweepAngleRef.current

      // Auto-orbit slowly when not dragging
      if (!isDragging) {
        rotationRef.current.yaw += 0.001
      }

      const { yaw, pitch, zoom } = rotationRef.current
      const scale = Math.min(width, height) * 0.42 * zoom
      const centerX = width / 2
      const centerY = height / 2 + 25

      // 3D Isometric projection
      function project(lat: number, lng: number, alt: number = 0) {
        const rawX = (lng - centerLng) * 1.8
        const rawY = -(lat - centerLat) * 2.1
        const rawZ = alt

        const cosY = Math.cos(yaw)
        const sinY = Math.sin(yaw)
        const x1 = rawX * cosY - rawZ * sinY
        const z1 = rawX * sinY + rawZ * cosY

        const cosP = Math.cos(pitch)
        const sinP = Math.sin(pitch)
        const y2 = rawY * cosP - z1 * sinP
        const z2 = rawY * sinP + z1 * cosP

        const cameraDist = 48
        const perspective = cameraDist / (cameraDist + z2)
        const screenX = centerX + x1 * scale * 0.08 * perspective
        const screenY = centerY + y2 * scale * 0.08 * perspective

        return { x: screenX, y: screenY, z: z2, perspective }
      }

      // 1. Draw Editorial Spatial Coordinate Grid Plane
      ctx.save()
      ctx.strokeStyle = '#DCE7DD'
      ctx.lineWidth = 1
      const gridSize = 14
      const step = 2.8
      for (let i = -gridSize; i <= gridSize; i += 2) {
        const p1 = project(centerLat + i * step, centerLng - gridSize * step, -2)
        const p2 = project(centerLat + i * step, centerLng + gridSize * step, -2)
        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.stroke()

        const q1 = project(centerLat - gridSize * step, centerLng + i * step, -2)
        const q2 = project(centerLat + gridSize * step, centerLng + i * step, -2)
        ctx.beginPath()
        ctx.moveTo(q1.x, q1.y)
        ctx.lineTo(q2.x, q2.y)
        ctx.stroke()
      }
      ctx.restore()

      // 2. Rotating Radar Sweep Plane
      ctx.save()
      const radarCenter = project(centerLat, centerLng, -2)
      const sweepRadius = 180 * zoom
      const sweepEnd = {
        x: radarCenter.x + Math.cos(sweepAngle) * sweepRadius,
        y: radarCenter.y + Math.sin(sweepAngle) * (sweepRadius * 0.65), // foreshortened
      }
      ctx.beginPath()
      ctx.moveTo(radarCenter.x, radarCenter.y)
      ctx.lineTo(sweepEnd.x, sweepEnd.y)
      ctx.strokeStyle = 'rgba(36, 84, 59, 0.25)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Soft Sweep Cone
      ctx.beginPath()
      ctx.moveTo(radarCenter.x, radarCenter.y)
      ctx.arc(radarCenter.x, radarCenter.y, sweepRadius, sweepAngle - 0.35, sweepAngle)
      ctx.fillStyle = 'rgba(202, 223, 204, 0.12)'
      ctx.fill()
      ctx.restore()

      // 3. Sort nodes by Z-depth
      const projectedNodes = allNodes.map(node => {
        const hasActivity = node.count > 0
        const elevation = hasActivity ? Math.min(24, 6 + node.count * 1.5) : 2
        const base = project(node.lat, node.lng, -2)
        const top = project(node.lat, node.lng, elevation)
        return { node, base, top, hasActivity }
      }).sort((a, b) => b.top.z - a.top.z)

      // 4. Render Nodes
      projectedNodes.forEach(({ node, base, top, hasActivity }) => {
        const isHovered = hoveredCluster?.pincode === node.pincode
        const isSelected = selectedCluster?.pincode === node.pincode
        const isCritical = node.count >= 10

        // Vertical elevation laser stem
        ctx.beginPath()
        ctx.moveTo(base.x, base.y)
        ctx.lineTo(top.x, top.y)
        ctx.strokeStyle = isCritical
          ? 'rgba(186, 26, 26, 0.5)'
          : hasActivity
          ? 'rgba(217, 120, 105, 0.45)'
          : 'rgba(36, 84, 59, 0.2)'
        ctx.lineWidth = isHovered || isSelected ? 2.5 : hasActivity ? 1.5 : 1
        ctx.stroke()

        // Base ground footprint
        ctx.beginPath()
        ctx.ellipse(base.x, base.y, 5 * top.perspective, 2.5 * top.perspective, 0, 0, Math.PI * 2)
        ctx.fillStyle = hasActivity ? 'rgba(217, 120, 105, 0.15)' : 'rgba(202, 223, 204, 0.25)'
        ctx.fill()

        // Pulsing circle for active nodes
        if (hasActivity) {
          const pulseR = (6 + Math.sin(sweepAngle * 2 + node.lat) * 3) * top.perspective
          ctx.beginPath()
          ctx.arc(top.x, top.y, Math.max(pulseR, 4), 0, Math.PI * 2)
          ctx.strokeStyle = isCritical ? 'rgba(186, 26, 26, 0.35)' : 'rgba(217, 120, 105, 0.3)'
          ctx.stroke()
        }

        // Top Sphere
        const r = (isHovered || isSelected ? 6 : hasActivity ? 4.5 : 3) * top.perspective
        ctx.beginPath()
        ctx.arc(top.x, top.y, Math.max(r, 2.5), 0, Math.PI * 2)
        ctx.fillStyle = isCritical
          ? '#BA1A1A'
          : hasActivity
          ? '#D97869'
          : isHovered
          ? '#24543B'
          : '#A8C9AD'
        ctx.fill()
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 1
        ctx.stroke()

        // City Label on hover, selection, or active reports
        if (isHovered || isSelected || (hasActivity && top.perspective > 0.9)) {
          ctx.font = `${isHovered || isSelected ? '600 11px' : '500 10px'} Inter, sans-serif`
          ctx.fillStyle = '#193A2A'
          ctx.fillText(node.city, top.x + 8, top.y + 3)
          if (hasActivity) {
            ctx.font = '10px JetBrains Mono, monospace'
            ctx.fillStyle = '#78877D'
            ctx.fillText(`${node.count} reports`, top.x + 8, top.y + 15)
          }
        }
      })

      animFrame = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animFrame)
    }
  }, [allNodes, isDragging, hoveredCluster, selectedCluster])

  // Mouse drag orbit controls
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true)
    setLastMouse({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    if (isDragging) {
      const dx = e.clientX - lastMouse.x
      const dy = e.clientY - lastMouse.y
      rotationRef.current.yaw += dx * 0.007
      rotationRef.current.pitch = Math.max(0.25, Math.min(1.3, rotationRef.current.pitch + dy * 0.005))
      setLastMouse({ x: e.clientX, y: e.clientY })
      return
    }

    // Hover detection
    const centerLat = 20.5937
    const centerLng = 78.9629
    const { yaw, pitch, zoom } = rotationRef.current
    const scale = Math.min(canvas.width, canvas.height) * 0.42 * zoom
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2 + 25

    let found: MapCluster | null = null
    let minDist = 16

    allNodes.forEach(node => {
      const rawX = (node.lng - centerLng) * 1.8
      const rawY = -(node.lat - centerLat) * 2.1
      const rawZ = node.count > 0 ? Math.min(24, 6 + node.count * 1.5) : 2
      const cosY = Math.cos(yaw)
      const sinY = Math.sin(yaw)
      const x1 = rawX * cosY - rawZ * sinY
      const z1 = rawX * sinY + rawZ * cosY
      const cosP = Math.cos(pitch)
      const sinP = Math.sin(pitch)
      const y2 = rawY * cosP - z1 * sinP
      const z2 = rawY * sinP + z1 * cosP
      const perspective = 48 / (48 + z2)
      const sx = centerX + x1 * scale * 0.08 * perspective
      const sy = centerY + y2 * scale * 0.08 * perspective

      const dist = Math.hypot(mouseX - sx, mouseY - sy)
      if (dist < minDist) {
        minDist = dist
        found = node
      }
    })

    setHoveredCluster(found)
  }

  const handleMouseUp = () => setIsDragging(false)

  const handleClick = () => {
    if (hoveredCluster) {
      setSelectedCluster(hoveredCluster)
      onSelectCluster?.(hoveredCluster)
    }
  }

  const resetCamera = () => {
    rotationRef.current = { yaw: 0.12, pitch: 0.68, zoom: 1.0 }
  }

  const zoomIn = () => {
    rotationRef.current.zoom = Math.min(1.7, rotationRef.current.zoom + 0.15)
  }

  const zoomOut = () => {
    rotationRef.current.zoom = Math.max(0.7, rotationRef.current.zoom - 0.15)
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-white border border-[#DCE7DD] shadow-sm">
      {/* Top HUD Controls */}
      <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#DCE7DD] shadow-sm text-xs font-mono text-[#193A2A]">
          <span className="w-2 h-2 rounded-full bg-[#24543B]" />
          <span className="font-semibold tracking-wider uppercase">25 Supported National Hubs</span>
          <span className="text-[#DCE7DD]">•</span>
          <span className="text-[#78877D]">{clusters.length} active mapped areas</span>
        </div>

        {/* Orbit Camera Buttons */}
        <div className="pointer-events-auto flex items-center gap-1 bg-white/90 backdrop-blur-md border border-[#DCE7DD] p-1 rounded-lg shadow-sm">
          <button
            onClick={resetCamera}
            className="p-1.5 text-[#78877D] hover:text-[#24543B] hover:bg-[#F1F4F0] rounded"
            title="Reset Perspective"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={zoomIn}
            className="p-1.5 text-[#78877D] hover:text-[#24543B] hover:bg-[#F1F4F0] rounded"
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={zoomOut}
            className="p-1.5 text-[#78877D] hover:text-[#24543B] hover:bg-[#F1F4F0] rounded"
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
        </div>
      </div>

      {/* Main 3D Canvas */}
      <canvas
        ref={canvasRef}
        width={960}
        height={500}
        className="w-full h-[400px] sm:h-[480px] cursor-grab active:cursor-grabbing block"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
      />

      {/* Selected / Hovered Cluster Details Card */}
      {(hoveredCluster || selectedCluster) && (
        <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-80 z-20 samanvaya-card p-4 bg-white/95 backdrop-blur-md border-[#CADFCC] shadow-lg animate-fade-in">
          {(() => {
            const active = hoveredCluster || selectedCluster!
            return (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#DCE7DD]">
                  <div>
                    <h4 className="font-heading font-bold text-sm text-[#193A2A]">
                      {active.locality}, {active.city}
                    </h4>
                    <span className="font-mono text-[11px] text-[#78877D]">
                      PIN: {active.pincode}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    active.count > 0 ? 'bg-[#EAF3EA] text-[#24543B]' : 'bg-[#F1F4F0] text-[#78877D]'
                  }`}>
                    {active.count > 0 ? `${active.count} Reports` : 'Baseline'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono text-[11px] pt-1">
                  <div>
                    <span className="text-[#78877D] block">INCIDENT TOTAL</span>
                    <span className="font-bold text-[#193A2A]">{active.count} verified cases</span>
                  </div>
                  <div>
                    <span className="text-[#78877D] block">PRIMARY VECTOR</span>
                    <span className="font-bold text-[#24543B] truncate block">
                      {active.top_scam_type ? active.top_scam_type.replace('_', ' ') : 'None'}
                    </span>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* Bottom Legend */}
      <div className="absolute bottom-3 right-4 hidden sm:flex items-center gap-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#DCE7DD] text-[11px] font-mono text-[#78877D] pointer-events-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#BA1A1A]" />
          <span>High Volume</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#D97869]" />
          <span>Reported Area</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#A8C9AD]" />
          <span>Baseline Monitoring</span>
        </div>
      </div>
    </div>
  )
}
