'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from "next/image";
import { useAuth } from '@/components/providers/AuthProvider';
import {
  Bars3Icon,
  XMarkIcon,
  UserIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  UsersIcon,
  BookOpenIcon,
  ArrowUpIcon
} from '@heroicons/react/24/outline';
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { showSuccess, showError } from '@/lib/swal';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, profile, loading, signOut } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [dashboardRoute, setDashboardRoute] = useState("/");
  const pathname = usePathname();
  const router = useRouter();

  // User status function
  const getUserStatus = () => {
    if (profile?.is_admin) return "Admin";
    if (profile?.membership_type === "premium") return "Premium";
    return "Gratis";
  };

  // Navigate dashboard according to role
  const handleDashboard = () => {
    if (!profile) return;

    if (profile.is_admin) {
      router.push('/admin');
    } else {
      router.push('/');
    }
  };

  // Scroll effect
  useEffect(() => {
    try {
      const hasRecovery = document.cookie
        .split(';')
        .map(v => v.trim())
        .some(v => v.startsWith('recovery='));
      setIsRecovery(hasRecovery);
    } catch {}

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

   useEffect(() => {
    async function loadRole() {
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (data?.is_admin) {
        setDashboardRoute("/admin");     // admin dashboard
      } else {
        setDashboardRoute("/"); // user dashboard
      }
    }

    loadRole();
  }, [user]);

  // Navigation items
  const navigation = [
    { name: 'Dashboard',href: dashboardRoute, icon: BookOpenIcon },
    { name: 'Blog', href: '/blog', icon: BookOpenIcon },
    { name: 'Lessons', href: '/lessons', icon: BookOpenIcon },
    { name: 'Community', href: '/community', icon: UsersIcon },
    { name: 'AI', href: '/ai', icon: UsersIcon },
  ];

  // Sign out
  const handleSignOut = async () => {
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
  };

  return (
    <nav
      className={`
        fixed top-0 left-0 w-full z-50 transition-all duration-500
        ${isScrolled 
          ? 'backdrop-blur-sm bg-black/40 shadow-md' 
          : 'bg-transparent'
        }
      `}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-28">

          {/* LOGO */}
          <Link href="/" className="flex items-center">
            <Image 
              src="/TP_name-removebg-preview.png"
              alt="Logo"
              width={125}
              height={95}
              className="transition-all duration-300"
            />
          </Link>

          {/* DESKTOP NAV */}
          <div className="hidden md:flex ml-40 space-x-8">
            {navigation.map((item) => {
              const active = pathname === item.href || (item.href === '/dashboard' && pathname.startsWith('/dashboard'));
              return (
                <button
                  key={item.name}
                  onClick={() => router.push(item.href)}
                  className={`
                    text-lg font-medium transition-all duration-200 relative
                    ${active ? 'text-white font-semibold' : 'text-gray-300'}
                    hover:text-white
                  `}
                >
                  {item.name}
                  {active && (
                    <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>

          {/* DESKTOP AUTH */}
          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <div className="bg-gray-300 h-8 w-20 rounded animate-pulse"></div>
            ) : user && !isRecovery ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 text-gray-100">
                  <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        className="h-9 w-9 rounded-full"
                        alt="Avatar"
                      />
                    ) : (
                      <UserIcon className="h-5 w-5" />
                    )}
                  </div>

                  <div className="flex flex-col items-start">
                    <span>{profile?.full_name || 'User'}</span>
                    <span className="text-xs text-gray-300">{getUserStatus()}</span>
                  </div>
                </button>

                {/* DROPDOWN */}
                <div className="
                  absolute right-0 mt-2 w-48 bg-black/80 backdrop-blur-sm rounded-md shadow-lg py-1 border border-white/10
                  opacity-0 invisible group-hover:opacity-100 group-hover:visible
                  transition-all duration-200
                ">
                  {profile?.is_admin && (
                    <button
                      onClick={handleDashboard}
                      className="flex px-4 py-2 w-full text-left hover:bg-white/10 text-gray-200"
                    >
                      <CogIcon className="h-4 w-4 mr-2" /> Dashboard
                    </button>
                  )}

                  {getUserStatus() === "Gratis" && !profile?.is_admin && (
                    <Link href="/upgrade" className="flex px-4 py-2 hover:bg-white/10 text-gray-200">
                      <ArrowUpIcon className="h-4 w-4 mr-2" /> Upgrade
                    </Link>
                  )}

                  <Link href="/profile" className="flex px-4 py-2 hover:bg-white/10 text-gray-200">
                    <UserIcon className="h-4 w-4 mr-2" /> Profile
                  </Link>

                  <button
                    onClick={handleSignOut}
                    className="flex w-full px-4 py-2 hover:bg-white/10 text-gray-200"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login" className="btn btn-ghost btn-sm text-white">
                  Sign In
                </Link>
                <Link href="/register" className="btn btn-primary btn-sm">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* MOBILE MENU BUTTON */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="btn btn-ghost p-1 text-white">
              {isOpen ? <XMarkIcon className="h-7 w-7" /> : <Bars3Icon className="h-7 w-7" />}
            </button>
          </div>
        </div>

        {/* MOBILE NAV */}
        {isOpen && (
          <div className="md:hidden bg-black/40 backdrop-blur-sm pb-4 pt-2 px-3 space-y-1 border-t border-white/10">
            {navigation.map((item) => {
              const active = pathname === item.href || (item.href === '/dashboard' && pathname.startsWith('/dashboard'));
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    setIsOpen(false);
                    router.push(item.href);
                  }}
                  className={`
                    block w-full text-left px-3 py-3 rounded-md transition-all duration-200
                    ${active ? 'bg-white/20 text-white font-semibold' : 'text-gray-200 hover:bg-white/10'}
                  `}
                >
                  {item.name}
                </button>
              );
            })}

            {/* MOBILE AUTH */}
            <div className="pt-3 border-t border-white/20">
              {loading ? (
                <div className="bg-white/20 h-10 w-full rounded animate-pulse"></div>
              ) : user ? (
                <div className="space-y-2 text-white">
                  <div className="flex items-center px-2 py-2 space-x-3">
                    <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} className="h-10 w-10 rounded-full" />
                      ) : (
                        <UserIcon className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold">{profile?.full_name}</div>
                      <div className="text-sm text-gray-300">{getUserStatus()}</div>
                    </div>
                  </div>

                  {profile?.is_admin && (
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        handleDashboard();
                      }}
                      className="block w-full text-left px-3 py-3 rounded-md hover:bg-white/10"
                    >
                      Dashboard
                    </button>
                  )}

                  {getUserStatus() === "Gratis" && !profile?.is_admin && (
                    <Link href="/upgrade" className="block px-3 py-3 rounded-md hover:bg-white/10">
                      Upgrade
                    </Link>
                  )}

                  <Link href="/profile" className="block px-3 py-3 rounded-md hover:bg-white/10">
                    Profile
                  </Link>

                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsOpen(false);
                    }}
                    className="block w-full text-left px-3 py-3 rounded-md hover:bg-white/10"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link href="/login" className="block px-3 py-3 rounded-md text-white hover:bg-white/10">
                    Sign In
                  </Link>
                  <Link href="/register" className="block px-3 py-3 rounded-md bg-primary-600 text-white">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
