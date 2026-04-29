'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useTenant } from '@/contexts/TenantContext';


const navItems = [
  { label: 'Dashboard', href: '/dashboard' as Route, icon: '⊞' },
  { label: 'Agents', href: '/dashboard/agents' as Route, icon: '◈' },
  { label: 'Rankings', href: '/dashboard/rankings' as Route, icon: '↑' },
  { label: 'Tasks', href: '/dashboard/tasks' as Route, icon: '✓' },
  { label: 'Reports', href: '/dashboard/reports' as Route, icon: '◫' },
  { label: 'Settings', href: '/dashboard/settings' as Route, icon: '⚙' },
  { label: 'Billing', href: '/dashboard/billing' as Route, icon: '₹' }
];

export default function Sidebar() {
  const pathname = usePathname();
  const [userName, setUserName] = useState('');
  const { tenant, businessProfile, loading } = useTenant();

  useEffect(() => {
    async function loadIdentity() {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
      setUserName(profile?.full_name || user.email?.split('@')[0] || '');
    }
    loadIdentity();
  }, []);

  const displayName = businessProfile?.business_name || tenant?.name || 'My Workspace';
  const tenantStatus = tenant?.status || 'provisioning';
  const isActive = tenantStatus === 'active';

  return (
    <aside className="w-60 bg-claux-surface border-r border-claux-border flex flex-col">
      <div className="p-6 border-b border-claux-border">
        <Link href="/dashboard" className="text-lg font-semibold text-claux-text tracking-wide">
          Claux
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 w-full ${
              pathname === item.href || pathname.startsWith(`${item.href}/`)
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
          <div className="text-xs text-claux-muted mb-1">{userName || 'User'}</div>
          <div className="text-sm font-medium text-claux-text">{displayName}</div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="relative">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-claux-teal' : 'bg-yellow-500'}`}></div>
            {isActive && <div className="absolute inset-0 w-2 h-2 bg-claux-teal rounded-full animate-ping"></div>}
          </div>
          <span className="text-xs text-claux-muted">{isActive ? 'Active' : 'Provisioning'}</span>
        </div>
      </div>
    </aside>
  );
}
