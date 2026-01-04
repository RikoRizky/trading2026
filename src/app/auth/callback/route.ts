import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type'); // 'recovery' for password reset
  const redirectTo = requestUrl.searchParams.get('redirectTo') || '/dashboard';

  const supabase = createRouteHandlerClient({ cookies });

  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Exchange code error:', exchangeError);
      return NextResponse.redirect(`${requestUrl.origin}/login?error=invalid_code`);
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Get user error:', userError);
      return NextResponse.redirect(`${requestUrl.origin}/login?error=no_user`);
    }

    // If this is a password reset flow (type=recovery), redirect to reset password page
    // Supabase adds type=recovery to the URL when it's a password reset
    if (type === 'recovery') {
      console.log('Recovery flow detected, redirecting to reset password page');
      return NextResponse.redirect(`${requestUrl.origin}/auth/reset-password`);
    }

    // For email verification, check if email is confirmed
    if (!user.email_confirmed_at) {
      // Redirect to login with error parameter for email verification
      return NextResponse.redirect(`${requestUrl.origin}/login?error=not_verified`);
    }

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, is_admin')
      .eq('id', user.id)
      .maybeSingle();

    if (!existingProfile) {
      await supabase.from('profiles').insert({
        id: user.id,
        full_name: user.user_metadata.full_name || '',
        membership_type: 'free',
        is_admin: false
      });
      // Redirect to home for new users
      return NextResponse.redirect(`${requestUrl.origin}/?login=success`);
    }

    // Redirect based on admin role
    if (existingProfile?.is_admin) {
      return NextResponse.redirect(`${requestUrl.origin}/admin?login=success`);
    }
    
    return NextResponse.redirect(`${requestUrl.origin}/?login=success`);
  }

  return NextResponse.redirect(`${requestUrl.origin}${redirectTo}`);
}
