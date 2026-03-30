'use client'

import { useState } from 'react'
import DemoModal from './DemoModal'

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Add click event listener to all demo buttons
  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const button = target.closest('[data-demo-trigger]')
    if (button) {
      e.preventDefault()
      setIsModalOpen(true)
    }
  }

  return (
    <div onClick={handleClick}>
      {children}
      <DemoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
