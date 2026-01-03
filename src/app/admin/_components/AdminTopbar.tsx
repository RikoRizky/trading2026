'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { getUserAvatarUrl, getUserDisplayName, signOut } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Bell, ChevronDown, Menu, Moon, Search, Sparkles, SunMedium, User, LogOut } from 'lucide-react';
import Image from 'next/image';
import { useMemo, useRef, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { showSuccess, showError } from '@/lib/swal';

interface Props {
  onToggleSidebar: () => void;
  onCollapseSidebar: () => void;
  isCollapsed: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export default function AdminTopbar({ onToggleSidebar, onCollapseSidebar, isCollapsed, theme, onToggleTheme }: Props) {
  const { user, profile, loading: authLoading } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [openProfile, setOpenProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();
  const router = useRouter();

  // Wait for profile to load, but show fallback if it takes too long
  const displayName = useMemo(() => {
    if (authLoading && !profile && !user) {
      return 'Loading...';
    }
    const name = getUserDisplayName(user, profile);
    // If still showing "Anonymous User" after a delay, try to refresh profile
    if (name === 'Anonymous User' && user && !authLoading) {
      // Profile might not be loaded yet, return user email as fallback
      return user.email?.split('@')[0] || 'User';
    }
    return name;
  }, [user, profile, authLoading]);
  
  const avatarUrl = useMemo(() => getUserAvatarUrl(user, profile), [user, profile]);

  // Handle search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Store search query in sessionStorage so pages can access it
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('adminSearchQuery', query);
      // Trigger custom event for pages to listen to
      window.dispatchEvent(new CustomEvent('adminSearch', { detail: query }));
    }
  };

  // Handle keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-900/70 bg-slate-950/80 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4 px-4 py-3 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (window.innerWidth < 1024) {
                onToggleSidebar();
              } else {
                onCollapseSidebar();
              }
            }}
            className="inline-flex items-center justify-center h-11 w-11 rounded-xl border border-slate-800 bg-slate-900/70 text-slate-200 hover:bg-slate-800/70"
            aria-label="Toggle sidebar"
          >
            <Menu className={cn('w-5 h-5 transition-transform', isCollapsed && 'lg:-rotate-90')} />
          </button>

          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Cari di halaman ini..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-[320px] lg:w-[420px] h-11 rounded-xl bg-slate-900/80 border border-slate-800 pl-10 pr-16 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900/80 px-2 py-1 text-[11px] text-slate-400">
              <span>⌘</span>
              <span>K</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={onToggleTheme}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-slate-200 hover:bg-slate-800/70"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <SunMedium className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <div className="relative">
            <button
              onClick={() => setOpenProfile((prev) => !prev)}
              className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 hover:bg-slate-800/80"
            >
              <div className="relative h-10 w-10 rounded-lg bg-slate-800 overflow-hidden">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt={displayName} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-300 font-semibold">
                    {displayName.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="hidden md:block leading-tight text-left">
                <p className="text-sm font-semibold text-white">{displayName}</p>
                <p className="text-xs text-slate-400">{profile?.is_admin ? 'Admin' : 'User'}</p>
              </div>
              <ChevronDown
                className={cn(
                  'hidden md:block h-4 w-4 text-slate-400 transition-transform',
                  openProfile && 'rotate-180',
                )}
              />
            </button>

            {openProfile && (
              <div className="absolute right-0 z-40 mt-2 w-64 rounded-2xl border border-slate-800 bg-slate-950/95 p-4 shadow-xl shadow-slate-950/40">
                <div className="mb-3 border-b border-slate-800 pb-3">
                  <p className="text-sm font-semibold text-white">{displayName}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
                <div className="space-y-1 text-sm">
                  <button
                    className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-slate-200 hover:bg-slate-900 transition-colors"
                    onClick={() => {
                      setOpenProfile(false);
                      window.location.href = '/admin/profile';
                    }}
                  >
                    <User className="h-4 w-4" />
                    <span>Edit profile</span>
                  </button>
                  <button
                    className="mt-1 flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-red-200 hover:bg-red-500/10"
                    onClick={async () => {
                      setOpenProfile(false);
                      try {
                        await signOut();
                        await showSuccess("Berhasil log out!");
                        setTimeout(() => {
                          window.location.href = "/";
                        }, 1500);
                      } catch (error) {
                        console.error('Error signing out:', error);
                        await showError("Gagal log out");
                      }
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

