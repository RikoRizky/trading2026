import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirectTo = requestUrl.searchParams.get('redirectTo') || '/dashboard';

  const supabase = createRouteHandlerClient({ cookies });

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${requestUrl.origin}/login`);
    }

    if (!user.email_confirmed_at) {
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
