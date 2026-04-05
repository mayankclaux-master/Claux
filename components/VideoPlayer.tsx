'use client'

import { useRef } from 'react'

const VIDEO_SRC =
  'https://res.cloudinary.com/des5qm4q8/video/upload/v1775368270/Claux_-_Your_Personal_SEO_and_GEO_Suite_qv68mh.mp4'

export default function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null)

  const skip = (delta: number) => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + delta))
  }

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden group"
      style={{
        aspectRatio: '16 / 9',
        boxShadow: '0 0 30px rgba(29,158,117,0.2), 0 0 0 1px rgba(29,158,117,0.12)',
      }}
    >
      {/* Teal accent top-edge gradient */}
      <div
        className="absolute top-0 left-0 right-0 h-px z-10 pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, #1D9E75 35%, #2DD4BF 65%, transparent 100%)',
        }}
      />

      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        playsInline
        preload="auto"
        style={{ display: 'block', background: '#091525' }}
      >
        <source src={VIDEO_SRC} type="video/mp4" />
        Your browser does not support HTML5 video.
      </video>

      {/* Custom skip controls — appear on hover, offset above native controls bar */}
      <div
        className="absolute inset-0 flex items-center justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem', paddingBottom: '3.5rem' }}
      >
        {/* Rewind 10s */}
        <button
          onClick={() => skip(-10)}
          className="pointer-events-auto flex flex-col items-center gap-1 rounded-full px-3.5 py-3 border transition-all"
          style={{
            background: 'rgba(9,21,37,0.72)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderColor: 'rgba(255,255,255,0.18)',
            color: '#ffffff',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(29,158,117,0.6)'
            e.currentTarget.style.background = 'rgba(29,158,117,0.12)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'
            e.currentTarget.style.background = 'rgba(9,21,37,0.72)'
          }}
          aria-label="Rewind 10 seconds"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"
            />
          </svg>
          <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.03em' }}>
            −10s
          </span>
        </button>

        {/* Fast-forward 10s */}
        <button
          onClick={() => skip(10)}
          className="pointer-events-auto flex flex-col items-center gap-1 rounded-full px-3.5 py-3 border transition-all"
          style={{
            background: 'rgba(9,21,37,0.72)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderColor: 'rgba(255,255,255,0.18)',
            color: '#ffffff',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(29,158,117,0.6)'
            e.currentTarget.style.background = 'rgba(29,158,117,0.12)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'
            e.currentTarget.style.background = 'rgba(9,21,37,0.72)'
          }}
          aria-label="Fast-forward 10 seconds"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"
            />
          </svg>
          <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.03em' }}>
            +10s
          </span>
        </button>
      </div>
    </div>
  )
}
