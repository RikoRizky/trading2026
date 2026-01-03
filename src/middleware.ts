import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session if expired
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/profile', '/mentorship', '/admin'];
  const adminRoutes = ['/admin'];

  const isProtectedRoute = protectedRoutes.some(route =>
    req.nextUrl.pathname.startsWith(route)
  );
  const isAdminRoute = adminRoutes.some(route =>
    req.nextUrl.pathname.startsWith(route)
  );

  const isInRecovery = req.cookies.get('recovery')?.value === '1';

  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && (!session || isInRecovery)) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // ---------- TAMBAHAN: cek expired membership + cek is_admin ----------
  if (session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('membership_type, membership_expires_at, is_admin')
      .eq('id', session.user.id)
      .single();

    // Jika premium tetapi sudah lewat waktu -> downgrade otomatis ke free
    if (profile?.membership_type === 'premium' && profile.membership_expires_at) {
      const now = new Date();
      const expiresAt = new Date(profile.membership_expires_at);

      if (expiresAt < now) {
        await supabase
          .from('profiles')
          .update({ membership_type: 'free', membership_expires_at: null })
          .eq('id', session.user.id);
      }
    }

    // --- ADMIN CHECK yang baru ---
    if (isAdminRoute) {

      // Admin valid jika is_admin = true
      const isAdmin = profile?.is_admin === true;

      // BONUS: Kamu tetap mempertahankan premium check jika admin juga harus premium
      const isPremium = profile?.membership_type === 'premium';

      // Jika admin harus premium → gunakan ini
      if (!isAdmin || !isPremium) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }

      // Jika admin TIDAK harus premium → komentari premium check di atas
      // if (!isAdmin) {
      //   return NextResponse.redirect(new URL('/dashboard', req.url));
      // }
    }
  }
  // --------------------------------------------------------------------

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
