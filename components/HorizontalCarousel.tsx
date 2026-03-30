'use client'

import { useRef, useState, useEffect, ReactNode } from 'react'

interface HorizontalCarouselProps {
  children: ReactNode
  title: string
  subtitle: string
  id?: string
  bgClass?: string
}

export default function HorizontalCarousel({ children, title, subtitle, id, bgClass = '' }: HorizontalCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [activeDotIndex, setActiveDotIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [dragDistance, setDragDistance] = useState(0)
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null)
  const isUserInteracting = useRef(false)
  const [isMobile, setIsMobile] = useState(false)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isHorizontalSwipe = useRef<boolean | null>(null)

  // Convert children to array for dot indicators
  const childArray = Array.isArray(children) ? children : [children]
  const totalCards = childArray.length

  // Detect mobile on client side only
  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Update active dot based on scroll position
  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    
    const container = scrollContainerRef.current
    const scrollPosition = container.scrollLeft
    const cardWidth = container.scrollWidth / totalCards
    const newIndex = Math.round(scrollPosition / cardWidth)
    
    setActiveDotIndex(Math.min(newIndex, totalCards - 1))
  }

  const startAutoScroll = () => {
    if (autoScrollRef.current) clearInterval(autoScrollRef.current)
    autoScrollRef.current = setInterval(() => {
      if (isUserInteracting.current) return
      if (!scrollContainerRef.current) return
      const container = scrollContainerRef.current
      const cardWidth = container.scrollWidth / totalCards
      const maxScroll = container.scrollWidth - container.offsetWidth
      const nextScroll = container.scrollLeft + cardWidth
      if (nextScroll >= maxScroll - 10) {
        container.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        container.scrollTo({ left: nextScroll, behavior: 'smooth' })
      }
    }, 3000)
  }

  useEffect(() => {
    if (window.innerWidth >= 768) return
    startAutoScroll()
    return () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current)
    }
  }, [])

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return
    
    setIsDragging(true)
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft)
    setScrollLeft(scrollContainerRef.current.scrollLeft)
    setDragDistance(0)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return
    
    e.preventDefault()
    const x = e.pageX - scrollContainerRef.current.offsetLeft
    const walk = (x - startX) * 2
    scrollContainerRef.current.scrollLeft = scrollLeft - walk
    setDragDistance(Math.abs(walk))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
  }

  // Prevent click when dragging
  const handleCardClick = (e: React.MouseEvent) => {
    if (dragDistance > 5) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  // Navigation arrow handlers
  const scrollToCard = (index: number) => {
    if (!scrollContainerRef.current) return
    
    const container = scrollContainerRef.current
    const cardWidth = container.scrollWidth / totalCards
    container.scrollTo({
      left: cardWidth * index,
      behavior: 'smooth'
    })
  }

  const handlePrevious = () => {
    const newIndex = Math.max(0, activeDotIndex - 1)
    scrollToCard(newIndex)
  }

  const handleNext = () => {
    const newIndex = Math.min(totalCards - 1, activeDotIndex + 1)
    scrollToCard(newIndex)
  }

  return (
    <section id={id} className={`py-10 sm:py-16 md:py-24 relative ${bgClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 gradient-text">
            {title}
          </h2>
          <p className="text-gray-400 text-lg">
            {subtitle}
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative carousel-outer">
          {/* Left Arrow - Hidden on mobile */}
          <button
            onClick={handlePrevious}
            disabled={activeDotIndex === 0}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center rounded-full bg-white/5 border border-white/10 backdrop-blur-md hover:bg-indigo-500/20 hover:border-indigo-500/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]"
            aria-label="Previous"
          >
            <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Right Arrow - Hidden on mobile */}
          <button
            onClick={handleNext}
            disabled={activeDotIndex === totalCards - 1}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center rounded-full bg-white/5 border border-white/10 backdrop-blur-md hover:bg-indigo-500/20 hover:border-indigo-500/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]"
            aria-label="Next"
          >
            <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Left Fade Gradient */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#050508] to-transparent z-10 pointer-events-none hidden md:block"></div>

          {/* Right Fade Gradient */}
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#050508] to-transparent z-10 pointer-events-none hidden md:block"></div>

          {/* Scroll Container */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onClick={handleCardClick}
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
                // Vertical swipe — prevent the carousel from scrolling horizontally
                // Do NOT call e.preventDefault() — let page scroll naturally
                if (scrollContainerRef.current) {
                  scrollContainerRef.current.style.overflowX = 'hidden'
                }
                return
              }

              if (isHorizontalSwipe.current === true) {
                // Horizontal swipe — restore horizontal scroll
                if (scrollContainerRef.current) {
                  scrollContainerRef.current.style.overflowX = 'auto'
                }
                e.stopPropagation()
              }
            }}
            onTouchEnd={() => {
              // Always restore horizontal scroll capability
              if (scrollContainerRef.current) {
                scrollContainerRef.current.style.overflowX = 'auto'
              }
              isHorizontalSwipe.current = null
              setTimeout(() => {
                isUserInteracting.current = false
                if (typeof window !== 'undefined' && window.innerWidth < 768) {
                  startAutoScroll()
                }
              }, 5000)
            }}
            className={`carousel-track flex gap-6 overflow-x-auto scroll-smooth px-4 md:px-12 ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{
              scrollSnapType: 'x proximity',
              WebkitOverflowScrolling: 'touch',
              overscrollBehaviorX: 'contain'
            }}
          >
            {childArray.map((child, index) => (
              <div
                key={index}
                className="flex-shrink-0 transition-all duration-300"
                style={{
                  scrollSnapAlign: 'start',
                  minWidth: isMobile ? '270px' : '300px',
                  maxWidth: '380px',
                  width: '100%',
                  opacity: Math.abs(activeDotIndex - index) <= 1 ? 1 : 0.7,
                  transform: Math.abs(activeDotIndex - index) <= 1 ? 'scale(1)' : 'scale(0.97)'
                }}
              >
                {child}
              </div>
            ))}
          </div>
        </div>

        {/* Dot Indicators */}
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: totalCards }).map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToCard(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === activeDotIndex
                  ? 'bg-indigo-500 w-8'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
              aria-label={`Go to card ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
