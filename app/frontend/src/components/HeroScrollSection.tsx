import { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslation } from '../i18n/index.js'
import { ArrowRight, ChevronDown } from 'lucide-react'

interface HeroScrollSectionProps {
  onCheckClick: () => void
  onExploreClick: () => void
}

export function HeroScrollSection({ onCheckClick, onExploreClick }: HeroScrollSectionProps) {
  const { t } = useTranslation()
  const sectionRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const [videoDuration, setVideoDuration] = useState<number>(0)
  const [videoReady, setVideoReady] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isInView, setIsInView] = useState(true)

  // Animation refs for Apple-style buttery smooth LERP interpolation
  const targetProgressRef = useRef<number>(0)
  const currentProgressRef = useRef<number>(0)
  const rafIdRef = useRef<number | null>(null)

  // Track raw scroll position into targetProgressRef
  const handleScroll = useCallback(() => {
    if (!sectionRef.current) return

    const rect = sectionRef.current.getBoundingClientRect()
    const windowHeight = window.innerHeight
    const totalScrollableDistance = rect.height - windowHeight

    if (totalScrollableDistance <= 0) return

    const currentScroll = -rect.top
    const rawProgress = Math.min(1, Math.max(0, currentScroll / totalScrollableDistance))
    targetProgressRef.current = rawProgress
  }, [])

  // Continuous buttery smooth LERP loop in requestAnimationFrame
  useEffect(() => {
    let active = true

    const renderLoop = () => {
      if (!active) return

      if (videoRef.current && videoDuration > 0 && isInView) {
        // LERP dampening: 0.08 produces silky, luxurious momentum
        const diff = targetProgressRef.current - currentProgressRef.current
        currentProgressRef.current += diff * 0.08

        // Update progress state for UI fade transitions
        setScrollProgress(currentProgressRef.current)

        const targetTime = currentProgressRef.current * videoDuration
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

  // Pause updates when scrolled far past hero
  useEffect(() => {
    if (!sectionRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting)
      },
      { threshold: 0.02 }
    )
    observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  // Video metadata loader
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration
      if (dur && !isNaN(dur)) {
        setVideoDuration(dur)
        setVideoReady(true)
      }
    }
  }

  // Calculate smooth fade-out for initial title as user scrolls into the full-screen video
  // Headline is fully visible at top, gently fades out between 0% and 18% scroll
  const titleOpacity = Math.max(0, 1 - scrollProgress * 5)
  const titleTranslateY = scrollProgress * -40

  return (
    <section ref={sectionRef} className="relative w-full h-[320vh] bg-[#F8FAF7]">
      {/* Sticky Full-Screen Viewport */}
      <div className="sticky top-0 h-screen w-full flex flex-col justify-center items-center overflow-hidden">
        {/* Full-Screen Video Canvas */}
        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-[#F8FAF7]">
          <video
            ref={videoRef}
            src="/videos/samanvaya-hero.mp4"
            preload="metadata"
            muted
            playsInline
            onLoadedMetadata={handleLoadedMetadata}
            className="w-full h-full object-contain select-none pointer-events-none drop-shadow-sm transition-opacity duration-300"
            style={{ opacity: videoReady ? 1 : 0 }}
          />

          {!videoReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#F8FAF7] text-xs font-mono text-[#78877D]">
              Loading interactive intelligence presentation...
            </div>
          )}
        </div>

        {/* Floating Top Editorial Title & CTAs (Fades smoothly as you scroll into full video) */}
        <div
          className="absolute top-20 sm:top-24 left-0 right-0 z-30 px-4 sm:px-8 max-w-4xl mx-auto text-center pointer-events-auto transition-transform duration-75"
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleTranslateY}px)`,
            pointerEvents: titleOpacity < 0.1 ? 'none' : 'auto',
          }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF3EA]/90 backdrop-blur-md border border-[#CADFCC] text-[11px] font-mono text-[#24543B] font-semibold tracking-wider uppercase mb-3 shadow-xs">
            <span>{t.hero.badge}</span>
            <span className="text-[#A8C9AD]">•</span>
            <span>{t.brandDescriptor}</span>
          </div>

          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl lg:text-6xl text-[#193A2A] tracking-tight leading-[1.1] mb-3">
            {t.hero.headline}
          </h1>

          <p className="text-sm sm:text-base text-[#78877D] max-w-2xl mx-auto font-normal leading-relaxed mb-5">
            {t.hero.supportingText}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button onClick={onCheckClick} className="btn-primary shadow-md">
              <span>{t.hero.primaryCta}</span>
              <ArrowRight size={15} />
            </button>

            <button onClick={onExploreClick} className="btn-secondary bg-white/90 backdrop-blur-md">
              <span>{t.hero.secondaryCta}</span>
            </button>
          </div>
        </div>

        {/* Minimal Subtle Scroll Hint (Bottom) - Fades out on scroll */}
        <div
          className="absolute bottom-6 left-0 right-0 z-20 flex flex-col items-center justify-center text-xs text-[#78877D] font-mono transition-opacity duration-150 pointer-events-none"
          style={{ opacity: Math.max(0, 1 - scrollProgress * 6) }}
        >
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-[#DCE7DD] shadow-xs animate-bounce">
            <span className="text-[11px] font-bold text-[#24543B]">Scroll down to scrub animation</span>
            <ChevronDown size={14} className="text-[#24543B]" />
          </div>
        </div>
      </div>
    </section>
  )
}
