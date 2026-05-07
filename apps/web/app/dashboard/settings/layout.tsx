'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen">
      <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
        <div className="p-6">
          <h1 className="text-xl font-bold mb-6">Settings</h1>
          <nav className="space-y-1">
            <NavItem name="General" href="/dashboard/settings/general" pathname={pathname} />
            <NavItem name="Integrations" href="/dashboard/settings/integrations" pathname={pathname} />
            <NavItem name="Publishing" href="/dashboard/settings/publishing" pathname={pathname} />
            <NavItem name="Team" href="/dashboard/settings/team" pathname={pathname} />
            <NavItem name="Billing" href="/dashboard/settings/billing" pathname={pathname} />
          </nav>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">{children}</div>
      </div>
    </div>
  );
}

function NavItem({ name, href, pathname }: { name: string; href: string; pathname: string }) {
  const isActive = pathname === href;

  return (
    <Link
      href={href as any}
      className={cn(
        'block px-3 py-2 rounded-md text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary text-white'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
      )}
    >
      {name}
    </Link>
  );
}
