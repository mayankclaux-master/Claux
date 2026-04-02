'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: '⊞' },
  { label: 'Agents', href: '/dashboard/agents', icon: '◈' },
  { label: 'Rankings', href: '/dashboard/rankings', icon: '↑' },
  { label: 'Tasks', href: '/dashboard/tasks', icon: '✓' },
  { label: 'Reports', href: '/dashboard/reports', icon: '◫' },
  { label: 'Billing', href: '/dashboard/billing', icon: '₹' },
]

export default function DemoSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 bg-claux-surface border-r border-claux-border flex flex-col">
      <div className="p-6 border-b border-claux-border">
        <Link href="/">
          <Image
            src="/claux-logo.png"
            alt="Claux"
            width={110}
            height={36}
            className="object-contain"
            style={{
              width: '110px',
              height: '36px',
              minWidth: '110px',
              objectFit: 'contain',
              objectPosition: 'left center'
            }}
            priority
          />
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 w-full
      ${pathname === item.href || pathname.startsWith(item.href + '/')
        ? 'bg-[#7F77DD]/20 text-[#7F77DD] font-medium border border-[#7F77DD]/30'
        : 'text-[#8892A4] hover:text-[#F0F2F8] hover:bg-white/5'
      }`}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-claux-border space-y-3">
        <div className="px-4 py-3 bg-claux-border/30 rounded-lg">
          <div className="text-xs text-claux-muted mb-1">Client</div>
          <div className="text-sm font-medium">Sharma Dental Clinic</div>
          <div className="text-xs text-claux-muted">Mumbai</div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="relative">
            <div className="w-2 h-2 bg-claux-teal rounded-full"></div>
            <div className="absolute inset-0 w-2 h-2 bg-claux-teal rounded-full animate-ping"></div>
          </div>
          <span className="text-xs text-claux-muted">9 Agents Active</span>
        </div>
      </div>
    </aside>
  )
}
