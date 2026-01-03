'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PropsWithChildren } from 'react';

/**
 * Simple client-side layout switcher so admin pages can use their own shell.
 */
export function ClientLayoutSwitch({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16 bg-gradient-to-r from-indigoSteel-dark via-indigoSteel-light to-indigoSteel-dark">
        {children}
      </main>
      <Footer />
    </div>
  );
}

