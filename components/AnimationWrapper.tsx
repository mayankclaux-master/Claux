'use client'

import { useEffect } from 'react'

export default function AnimationWrapper() {
  useEffect(() => {
    // Counter animation for case study metrics
    const counters = document.querySelectorAll('.counter-animate')
    
    const animateCounter = (counter: Element) => {
      const target = parseInt(counter.getAttribute('data-target') || '0')
      const duration = 2000
      const increment = target / (duration / 16)
      let current = 0
      
      const updateCounter = () => {
        current += increment
        if (current < target) {
          counter.textContent = '+' + Math.ceil(current) + '%'
          requestAnimationFrame(updateCounter)
        } else {
          counter.textContent = '+' + target + '%'
        }
      }
      
      updateCounter()
    }

    // Intersection Observer for counter animation
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
          entry.target.classList.add('counted')
          animateCounter(entry.target)
        }
      })
    }, { threshold: 0.5 })

    counters.forEach(counter => observer.observe(counter))

    // Cleanup
    return () => {
      counters.forEach(counter => observer.unobserve(counter))
    }
  }, [])

  return null
}
