'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  BarChart3,
  BookOpen,
  BrainCircuit,
  Calendar,
  ChevronDown,
  ChevronLeft,
  Layers,
  LayoutDashboard,
  ListChecks,
  Menu,
  MessagesSquare,
  PieChart,
  PlayCircle,
  Sparkles,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type NavItem = {
  label: string;
  href: string;
  icon: ReactNode;
  badge?: string;
  comingSoon?: boolean;
};

const mainNav: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Blog', href: '/admin/blog', icon: <BookOpen className="w-5 h-5" />, badge: 'Live' },
  { label: 'Lessons', href: '/admin/lesson', icon: <PlayCircle className="w-5 h-5" /> },
  { label: 'AI', href: '/admin/ai', icon: <BrainCircuit className="w-5 h-5" />, comingSoon: true },
];

const analyticsNav: NavItem[] = [
  { label: 'Charts', href: '/admin/charts', icon: <BarChart3 className="w-5 h-5" /> },
  { label: 'Activity', href: '/admin/activity', icon: <Activity className="w-5 h-5" /> },
  { label: 'Feedback', href: '/admin/testimonials', icon: <MessagesSquare className="w-5 h-5" /> },
];

interface Props {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

export default function AdminSidebar({ isOpen, isCollapsed, onClose, onToggleCollapse }: Props) {
  const pathname = usePathname();

  const renderNav = (items: NavItem[]) =>
    items.map((item) => {
      const active = pathname === item.href;
      return (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
            isCollapsed ? 'justify-center' : 'justify-start',
            'hover:bg-slate-800/70 hover:text-white',
            active ? 'bg-slate-800/80 text-white border border-slate-700' : 'text-slate-200/80'
          )}
          onClick={onClose}
        >
          <span
            className={cn(
              'flex items-center justify-center rounded-lg bg-slate-900/70 border border-slate-800 p-2',
              active && 'bg-indigo-500/10 text-indigo-400 border-indigo-500/40'
            )}
          >
            {item.icon}
          </span>
          {!isCollapsed && (
            <div className="flex-1 flex items-center gap-2">
              <span>{item.label}</span>
              {item.badge && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/20 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-100 border border-indigo-300/50 dark:border-indigo-500/30 font-medium">
                  {item.badge}
                </span>
              )}
              {item.comingSoon && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-200/70 border border-slate-700">
                  Soon
                </span>
              )}
            </div>
          )}
        </Link>
      );
    });

  return (
    <aside
      className={cn(
        'fixed z-50 lg:z-30 inset-y-0 left-0 bg-slate-950/95 border-r border-slate-900/80 shadow-xl backdrop-blur-xl transition-all duration-300',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        // Selalu lebar penuh di mobile, hanya collapse di layar besar
        isCollapsed ? 'w-72 lg:w-20' : 'w-72 lg:w-72'
      )}
    >
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 font-bold">
            TP
          </div>
          {!isCollapsed && (
            <div>
              <p className="text-sm text-slate-400 uppercase tracking-[0.2em]">Admin</p>
              <p className="font-semibold text-white">TradingPlatform</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isCollapsed && (
            <button
              className="hidden lg:inline-flex p-2 rounded-lg hover:bg-slate-800/80 text-slate-300"
              onClick={onToggleCollapse}
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <button
            className="p-2 rounded-lg hover:bg-slate-800/80 text-slate-300 lg:hidden"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <ChevronDown className="w-5 h-5 rotate-90" />
          </button>
        </div>
      </div>

      <div className="px-3 space-y-8 overflow-y-auto pb-6 custom-scrollbar">
        <div>
          {!isCollapsed && <p className="text-xs uppercase text-slate-500 px-2 mb-2">Menu</p>}
          <div className="space-y-1.5">{renderNav(mainNav)}</div>
        </div>

        <div>
          {!isCollapsed && <p className="text-xs uppercase text-slate-500 px-2 mb-2">Insights</p>}
          <div className="space-y-1.5">{renderNav(analyticsNav)}</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/15 border border-indigo-500/40 flex items-center justify-center">
              <PieChart className="w-5 h-5 text-indigo-200" />
            </div>
            {!isCollapsed && (
              <div>
                <p className="text-sm font-semibold text-white">Insight Mode</p>
                <p className="text-xs text-slate-400">Pantau kinerja admin panel.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

