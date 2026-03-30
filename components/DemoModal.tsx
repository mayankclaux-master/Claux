'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface DemoModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function DemoModal({ isOpen, onClose }: DemoModalProps) {
  const [showThankYou, setShowThankYou] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    whatsapp: '',
    city: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from('demo_leads')
        .insert([
          {
            name: formData.name,
            website: formData.website,
            whatsapp: formData.whatsapp,
            city: formData.city
          }
        ])

      if (error) {
        console.error('Error saving lead:', error)
        alert('Something went wrong. Please try again.')
        setIsSubmitting(false)
        return
      }

      setShowThankYou(true)
    } catch (error) {
      console.error('Error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setShowThankYou(false)
    setFormData({ name: '', website: '', whatsapp: '', city: '' })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-[#0D0D14] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl backdrop-blur-md">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors z-10 border border-white/10"
        >
          <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8 sm:p-12">
          {!showThankYou ? (
            <>
              {/* Form View */}
              <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-slate-100 gradient-text">See Claux In Action</h2>
              <p className="text-slate-400 mb-8">Enter your details to unlock the demo</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent backdrop-blur-sm"
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Business Website */}
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-slate-300 mb-2">
                    Business Website *
                  </label>
                  <input
                    type="url"
                    id="website"
                    required
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent backdrop-blur-sm"
                    placeholder="https://yourbusiness.com"
                  />
                </div>

                {/* WhatsApp Number */}
                <div>
                  <label htmlFor="whatsapp" className="block text-sm font-medium text-slate-300 mb-2">
                    WhatsApp Number *
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-4 bg-white/5 border border-r-0 border-white/10 rounded-l-lg text-slate-400 backdrop-blur-sm">
                      +91
                    </span>
                    <input
                      type="tel"
                      id="whatsapp"
                      required
                      pattern="[0-9]{10}"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-r-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent backdrop-blur-sm"
                      placeholder="9876543210"
                    />
                  </div>
                </div>

                {/* City */}
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-slate-300 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    id="city"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent backdrop-blur-sm"
                    placeholder="Mumbai, Delhi, Bangalore..."
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-8 py-4 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-lg font-semibold text-lg hover:from-indigo-400 hover:to-violet-500 transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Watch How It Works →'}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Thank You View */}
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-slate-100 gradient-text">Here's your exclusive demo!</h2>
                <p className="text-slate-400">Watch how Claux transforms SEO for Indian businesses</p>
              </div>

              {/* YouTube Embed */}
              <div className="relative aspect-video bg-white/5 rounded-xl overflow-hidden border border-white/10">
                {/* Replace with YouTube embed URL */}
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                  title="Claux Demo Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
