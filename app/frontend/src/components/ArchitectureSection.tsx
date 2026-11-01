import { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslation } from '../i18n/index.js'
import {
  FileText,
  CheckCircle2,
  Lock,
  Network,
  Scale,
  ShieldAlert,
  Database,
  Cpu,
} from 'lucide-react'

export function ArchitectureSection() {
  const { t, lang } = useTranslation()
  const sectionRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const [videoDuration, setVideoDuration] = useState<number>(0)
  const [videoReady, setVideoReady] = useState(false)
  const [activeStep, setActiveStep] = useState<number>(1)
  const [progress, setProgress] = useState<number>(0)
  const [isInView, setIsInView] = useState(false)

  // Smooth LERP momentum refs
  const targetProgressRef = useRef<number>(0)
  const currentProgressRef = useRef<number>(0)
  const rafIdRef = useRef<number | null>(null)

  const handleScroll = useCallback(() => {
    if (!sectionRef.current) return

    const rect = sectionRef.current.getBoundingClientRect()
    const windowHeight = window.innerHeight
    const totalDistance = rect.height - windowHeight

    if (totalDistance <= 0) return

    const currentScroll = -rect.top
    const p = Math.min(1, Math.max(0, currentScroll / totalDistance))
    targetProgressRef.current = p
  }, [])

  useEffect(() => {
    let active = true

    const renderLoop = () => {
      if (!active) return

      if (videoRef.current && videoDuration > 0 && isInView) {
        // LERP dampening: 0.08 produces buttery smooth gliding
        const diff = targetProgressRef.current - currentProgressRef.current
        currentProgressRef.current += diff * 0.08

        const p = currentProgressRef.current
        setProgress(p)

        const step = Math.min(8, Math.max(1, Math.floor(p * 8) + 1))
        setActiveStep(step)

        const targetTime = p * videoDuration
        const video = videoRef.current
        if (Math.abs(video.currentTime - targetTime) > 0.02 && !video.seeking) {
          video.currentTime = targetTime
        }
      }

      rafIdRef.current = requestAnimationFrame(renderLoop)
    }

    rafIdRef.current = requestAnimationFrame(renderLoop)

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })
    handleScroll()

    return () => {
      active = false
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [handleScroll, videoDuration, isInView])

  useEffect(() => {
    if (!sectionRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.05 }
    )
    observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  const handleMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration
      if (dur && !isNaN(dur)) {
        setVideoDuration(dur)
        setVideoReady(true)
        handleScroll()
      }
    }
  }

  const STEPS = [
    {
      num: 1,
      title: t.arch.steps[1].title,
      desc: t.arch.steps[1].desc,
      icon: <FileText size={18} />,
    },
    {
      num: 2,
      title: t.arch.steps[2].title,
      desc: t.arch.steps[2].desc,
      icon: <CheckCircle2 size={18} />,
    },
    {
      num: 3,
      title: t.arch.steps[3].title,
      desc: t.arch.steps[3].desc,
      icon: <Lock size={18} />,
    },
    {
      num: 4,
      title: t.arch.steps[4].title,
      desc: t.arch.steps[4].desc,
      icon: <Network size={18} />,
    },
    {
      num: 5,
      title: t.arch.steps[5].title,
      desc: t.arch.steps[5].desc,
      icon: <Scale size={18} />,
    },
    {
      num: 6,
      title: t.arch.steps[6].title,
      desc: t.arch.steps[6].desc,
      icon: <ShieldAlert size={18} />,
    },
    {
      num: 7,
      title: t.arch.steps[7].title,
      desc: t.arch.steps[7].desc,
      icon: <Database size={18} />,
    },
    {
      num: 8,
      title: t.arch.steps[8].title,
      desc: t.arch.steps[8].desc,
      icon: <Cpu size={18} />,
    },
  ]

  const currentStepData = STEPS[activeStep - 1]

  return (
    <section ref={sectionRef} className="relative w-full h-[320vh] bg-[#F1F4F0] border-y border-[#DCE7DD]">
      {/* Sticky Exploded Viewport */}
      <div className="sticky top-16 h-[calc(100vh-4rem)] w-full flex flex-col justify-between overflow-hidden px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="space-y-1.5 pb-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-[#DCE7DD] text-[10px] font-mono uppercase tracking-wider text-[#24543B] font-bold">
            {t.arch.sectionTag}
          </div>
          <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-[#193A2A] tracking-tight">
            {t.arch.title}
          </h2>
          <p className="text-xs sm:text-sm text-[#78877D] max-w-xl">
            {t.arch.subtitle}
          </p>
        </div>

        {/* Exploded Architecture: Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-auto items-center">
          {/* Left: Step Explanations (5 Columns) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="samanvaya-card p-6 border-[#CADFCC] bg-white shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#DCE7DD]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#EAF3EA] text-[#24543B] flex items-center justify-center">
                    {currentStepData.icon}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#78877D] block">
                      STAGE 0{currentStepData.num} / 08
                    </span>
                    <h3 className="font-heading font-bold text-base sm:text-lg text-[#193A2A]">
                      {currentStepData.title}
                    </h3>
                  </div>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#193A2A] leading-relaxed">
                {currentStepData.desc}
              </p>

              {/* Progress Indicator */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-[11px] font-mono text-[#78877D]">
                  <span>PIPELINE PROGRESS</span>
                  <span>{Math.round(progress * 100)}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#EAF3EA] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#24543B] transition-all duration-100"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Step Pills List */}
            <div className="hidden sm:grid grid-cols-4 gap-1.5">
              {STEPS.map(s => (
                <button
                  key={s.num}
                  onClick={() => {
                    const targetP = (s.num - 1) / 7.9
                    const rect = sectionRef.current?.getBoundingClientRect()
                    if (rect) {
                      const scrollY = window.scrollY + rect.top + targetP * (rect.height - window.innerHeight)
                      window.scrollTo({ top: scrollY, behavior: 'smooth' })
                    }
                  }}
                  className={`px-2 py-1.5 rounded-lg text-[10px] font-mono font-medium text-left truncate transition-colors ${
                    activeStep === s.num
                      ? 'bg-[#24543B] text-white font-bold'
                      : 'bg-white text-[#78877D] hover:bg-[#EAF3EA] border border-[#DCE7DD]'
                  }`}
                >
                  0{s.num}. {s.title.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Architecture Video Scrub Viewport (7 Columns) */}
          <div className="lg:col-span-7">
            <div className="relative w-full h-[40vh] sm:h-[48vh] rounded-2xl overflow-hidden border border-[#CADFCC] shadow-sm bg-white">
              <video
                ref={videoRef}
                src="/videos/samanvaya-architecture.mp4"
                preload="metadata"
                muted
                playsInline
                onLoadedMetadata={handleMetadata}
                className="w-full h-full object-cover select-none pointer-events-none"
              />

              {!videoReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-white text-xs font-mono text-[#78877D]">
                  Loading exploded architecture view...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section Closing Creed */}
        <div className="pt-2 border-t border-[#DCE7DD] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-[#78877D]">
          <span className="font-semibold text-[#193A2A]">
            &ldquo;{t.arch.closingStatement}&rdquo;
          </span>
          <span>Scroll down to explore verified operational intelligence</span>
        </div>
      </div>
    </section>
  )
}

