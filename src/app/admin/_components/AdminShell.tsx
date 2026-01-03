'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';
import './admin-theme.css';

interface AdminShellProps {
  children: ReactNode;
}

export default function AdminShell({ children }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Hydrate theme from localStorage / prefers-color-scheme
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('admin-theme') : null;
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
      return;
    }
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    setTheme(prefersLight ? 'light' : 'dark');
  }, []);

  // Sync theme to document for CSS overrides
  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.setAttribute('data-admin-theme', theme);
    localStorage.setItem('admin-theme', theme);
  }, [theme]);

  // Close sidebar on wide view
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const mainBackground = useMemo(
    () =>
      theme === 'dark'
        ? 'bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900'
        : 'bg-gradient-to-b from-slate-50 via-white to-slate-100',
    [theme],
  );

  return (
    <div
      className={cn(
        'min-h-screen transition-colors duration-300',
        theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900',
      )}
    >
      <div className="flex">
        <AdminSidebar
          isOpen={sidebarOpen}
          isCollapsed={sidebarCollapsed}
          onClose={() => setSidebarOpen(false)}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        />

        <div
          className={cn(
            'flex-1 min-h-screen transition-[margin] duration-300 ease-in-out',
            sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'
          )}
        >
          <AdminTopbar
            onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
            onCollapseSidebar={() => setSidebarCollapsed((prev) => !prev)}
            isCollapsed={sidebarCollapsed}
            theme={theme}
            onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
          />

          <main className={cn('admin-main p-4 md:p-6 lg:p-8 min-h-screen', mainBackground)}>
            {children}
          </main>
        </div>
      </div>

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

