'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/entry', label: 'New Entry', icon: '✏️' },
  { href: '/history', label: 'History', icon: '📋' },
  { href: '/trends', label: 'Trends', icon: '📈' },
  { href: '/alerts', label: 'Alerts', icon: '🔔', adminOnly: false },
  { href: '/reports', label: 'Reports', icon: '📊', adminOnly: true },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar({ user, alertCount = 0 }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  async function handleLogout() {
    setLoggingOut(true);
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <aside className="w-64 min-h-screen bg-cyan-900 text-cyan-100 flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-cyan-800">
        <Link href="/dashboard" className="flex items-center gap-2 text-white font-bold text-lg">
          <span className="text-2xl">💧</span>
          <span>FacilityH2O</span>
        </Link>
        {user && (
          <div className="mt-3">
            <p className="text-xs text-cyan-300 truncate">{user.name}</p>
            <p className="text-xs text-cyan-400 capitalize">{user.role}</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          if (item.adminOnly && !isAdmin) return null;
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-cyan-600 text-white'
                  : 'text-cyan-200 hover:bg-cyan-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {item.href === '/alerts' && alertCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {alertCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-6 border-t border-cyan-800 pt-4">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-cyan-300 hover:bg-cyan-800 hover:text-white transition-colors"
        >
          <span>🚪</span>
          <span>{loggingOut ? 'Logging out…' : 'Logout'}</span>
        </button>
      </div>
    </aside>
  );
}
