'use client'

import React, { useRef, useState, useEffect } from 'react'

export default function MobileScrollRow({ children, dotCount }: { children: React.ReactNode, dotCount: number }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null)
  const isUserInteracting = useRef(false)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isHorizontalSwipe = useRef<boolean | null>(null)

  const handleScroll = () => {
    if (!scrollRef.current) return
    const index = Math.round(scrollRef.current.scrollLeft / (scrollRef.current.offsetWidth * 0.78))
    setActiveIndex(index)
  }

  const startAutoScroll = () => {
    if (autoScrollRef.current) clearInterval(autoScrollRef.current)
    autoScrollRef.current = setInterval(() => {
      if (isUserInteracting.current) return
      if (!scrollRef.current) return
      const container = scrollRef.current
      const cardWidth = container.offsetWidth * 0.78
      const maxScroll = container.scrollWidth - container.offsetWidth
      const nextScroll = container.scrollLeft + cardWidth + 16
      if (nextScroll >= maxScroll - 10) {
        container.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        container.scrollTo({ left: nextScroll, behavior: 'smooth' })
      }
    }, 3000)
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) return
    startAutoScroll()
    return () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current)
    }
  }, [])

  return (
    <div className="block md:hidden relative mobile-scroll-outer">
      {/* Swipe hint */}
      <div className="flex md:hidden items-center justify-end gap-1 mb-2 pr-2">
        <span className="text-xs text-slate-500 font-medium">swipe</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-slate-500">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX
          touchStartY.current = e.touches[0].clientY
          isHorizontalSwipe.current = null
          isUserInteracting.current = true
          if (autoScrollRef.current) clearInterval(autoScrollRef.current)
        }}
        onTouchMove={(e) => {
          const deltaX = Math.abs(e.touches[0].clientX - touchStartX.current)
          const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current)

          if (isHorizontalSwipe.current === null && (deltaX > 5 || deltaY > 5)) {
            isHorizontalSwipe.current = deltaX > deltaY
          }

          if (isHorizontalSwipe.current === false) {
            if (scrollRef.current) {
              scrollRef.current.style.overflowX = 'hidden'
            }
            return
          }

          if (isHorizontalSwipe.current === true) {
            if (scrollRef.current) {
              scrollRef.current.style.overflowX = 'auto'
            }
            e.stopPropagation()
          }
        }}
        onTouchEnd={() => {
          if (scrollRef.current) {
            scrollRef.current.style.overflowX = 'auto'
          }
          isHorizontalSwipe.current = null
          setTimeout(() => {
            isUserInteracting.current = false
            if (typeof window !== 'undefined' && window.innerWidth < 768) {
              startAutoScroll()
            }
          }, 5000)
        }}
        className="mobile-scroll-row flex flex-row overflow-x-auto gap-4 pb-4 px-5"
        style={{ 
          scrollSnapType: 'x proximity', 
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorX: 'contain'
        }}
      >
        {React.Children.map(children, (child) => (
          <div
            className="flex-shrink-0"
            style={{ 
              width: '78vw', 
              maxWidth: '360px', 
              scrollSnapAlign: 'start'
            }}
          >
            {child}
          </div>
        ))}
      </div>
      {/* Right fade */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-full w-12"
        style={{ background: 'linear-gradient(90deg, transparent, #050508)', zIndex: 10 }}
      />
      {/* Dots */}
      <div className="flex justify-center gap-2 mt-3">
        {Array.from({ length: dotCount }).map((_, i) => (
          <div
            key={i}
            style={{
              width: i === activeIndex ? '16px' : '8px',
              height: '8px',
              borderRadius: '9999px',
              background: i === activeIndex ? '#6366F1' : '#374151',
              transition: 'all 0.3s ease'
            }}
          />
        ))}
      </div>
    </div>
  )
}
