import { createClient } from './supabase/client';
import { User } from '@supabase/supabase-js';
import { Profile } from './types';

/** Auth + Profile bundled type */
export interface AuthUser {
  user: User | null;
  profile: Profile | null;
}

/** Get authenticated user + profile */
export async function getCurrentUser(): Promise<AuthUser> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.auth.getUser();
    const user = data?.user;

    if (error || !user) {
      return { user: null, profile: null };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Failed to fetch profile:', profileError);
      return { user, profile: null };
    }

    return { user, profile };
  } catch (err) {
    console.error('getCurrentUser() failed:', err);
    return { user: null, profile: null };
  }
}

/** Sign up */
export async function signUp(email: string, password: string, fullName: string) {
  const supabase = createClient();

  const result = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      // Use correct URL for both local and production
      emailRedirectTo: typeof window !== 'undefined' 
        ? `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`
        : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  });

  // Create profile immediately if user was created (even if email not confirmed)
  if (result.data?.user && !result.error) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: result.data.user.id,
        full_name: fullName,
        membership_type: 'free',
        is_admin: false
      })
      .select()
      .single();

    // Ignore error if profile already exists (race condition)
    if (profileError && profileError.code !== '23505') {
      console.error('Failed to create profile:', profileError);
    }
  }

  return result;
}

/** Sign in */
export async function signIn(email: string, password: string) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // Handle Supabase auth errors with specific messages
  if (error) {
    const errorMsg = error.message?.toLowerCase() || '';
    
    if (errorMsg.includes('invalid login credentials') || 
        errorMsg.includes('invalid password') ||
        errorMsg.includes('wrong password')) {
      throw new Error("Email atau password salah. Pastikan email dan password yang Anda masukkan benar.");
    } else if (errorMsg.includes('user not found') || 
               errorMsg.includes('email not found')) {
      throw new Error("Email tidak terdaftar dalam sistem. Pastikan email yang Anda masukkan benar atau daftar terlebih dahulu.");
    } else if (errorMsg.includes('email not confirmed') ||
               errorMsg.includes('email belum diverifikasi')) {
      throw new Error("Email belum diverifikasi. Silakan cek inbox email Anda untuk link verifikasi.");
    }
    
    // Throw original error if no specific match
    throw error;
  }

  if (!data.user) {
    throw new Error("Login gagal. User tidak ditemukan.");
  }

  // AUTO-CONFIRM: Allow login even if email is not confirmed (for all accounts)
  // This enables auto-confirm functionality - users don't need to verify email
  if (data.user.email_confirmed_at === null) {
    // Check if profile exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', data.user.id)
      .single();

    // If no profile exists, this is a new account - allow login and create profile
    if (!profile) {
      // Create profile for new account
      try {
        await supabase.from('profiles').insert({
          id: data.user.id,
          full_name: data.user.user_metadata?.full_name || '',
          membership_type: 'free',
          is_admin: false
        });
      } catch (profileError: any) {
        // Ignore error if profile already exists (race condition)
        if (profileError.code !== '23505') {
          console.error('Failed to create profile during login:', profileError);
        }
      }
    }
    
    // Allow login for all accounts even without email confirmation (auto-confirm)
    console.log('Login allowed without email confirmation (auto-confirm enabled)');
  }

  // Ensure profile exists after successful login (with timeout to prevent stuck)
  // Don't block login if profile check fails
  try {
    const profilePromise = supabase
      .from('profiles')
      .select('id')
      .eq('id', data.user.id)
      .single();

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 3000)
    );

    const profileResult = await Promise.race([profilePromise, timeoutPromise]) as any;

    // If profile doesn't exist (error code PGRST116 = not found), create it
    if (profileResult.error && profileResult.error.code === 'PGRST116') {
      // Create profile if it doesn't exist (shouldn't happen, but safety check)
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            full_name: data.user.user_metadata?.full_name || '',
            membership_type: 'free',
            is_admin: false
          });

        if (profileError && profileError.code !== '23505') {
          console.error('Failed to create profile during login:', profileError);
        }
      } catch (insertErr) {
        // Don't block login if profile creation fails
        console.warn('Profile creation failed during login:', insertErr);
      }
    }
  } catch (profileErr) {
    // Don't block login if profile check fails, just log it
    console.warn('Profile check failed during login:', profileErr);
  }

  return data;
}

/** Sign in with Google */
export async function signInWithGoogle() {
  const supabase = createClient();

  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

/** Sign out */
export async function signOut() {
  const supabase = createClient();
  return await supabase.auth.signOut();
}

/** Update profile */
export async function updateProfile(updates: Partial<Profile>) {
  const supabase = createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData?.user;

  if (userError || !user) {
    return { error: userError || new Error('No authenticated user') };
  }

  return await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();
}

/** Update password */
export async function updatePassword(newPassword: string) {
  const supabase = createClient();

  return await supabase.auth.updateUser({
    password: newPassword,
  });
}

/** Request reset password email */
export async function resetPassword(email: string) {
  const supabase = createClient();

  // Get the correct origin URL for both local and production
  // Priority: NEXT_PUBLIC_SITE_URL > window.location.origin (client-side) > localhost
  let origin = 'http://localhost:3000';
  
  if (typeof window !== 'undefined') {
    // Client-side: prefer NEXT_PUBLIC_SITE_URL if set, otherwise use current origin
    origin = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
  } else {
    // Server-side: use environment variables
    origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  }

  // Supabase reset password email will contain code and type=recovery
  // The redirect URL should point to callback route which will handle code exchange
  const redirectUrl = `${origin}/auth/callback?type=recovery`;

  console.log('Sending reset password email to:', email);
  console.log('Redirect URL:', redirectUrl);

  const result = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });

  // Log for debugging
  if (result.error) {
    console.error('Reset password error:', result.error);
  } else {
    console.log('Reset password email sent successfully to:', email);
  }

  return result;
}

/** Premium membership checker */
export function hasPremiumMembership(profile: Profile | null): boolean {
  if (!profile) return false;
  if (profile.membership_type !== 'premium') return false;

  if (!profile.membership_expires_at) return true;

  return new Date(profile.membership_expires_at) > new Date();
}

/** Display name helper */
export function getUserDisplayName(user: User | null, profile: Profile | null) {
  return (
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Anonymous'
  );
}

/** Avatar URL helper */
export function getUserAvatarUrl(user: User | null, profile: Profile | null) {
  return profile?.avatar_url || user?.user_metadata?.avatar_url || null;
}

/** Admin checker */
export async function isAdmin(): Promise<boolean> {
  const { profile } = await getCurrentUser();
  return !!profile?.is_admin;
}

/** Permission checker */
export async function hasAdminPermission(permission: string): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    if (!user) return false;

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profile?.is_admin) return true;

    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('permissions')
      .eq('user_id', user.id)
      .single();

    return adminRole?.permissions?.[permission] === true;
  } catch (err) {
    console.error('Permission check failed:', err);
    return false;
  }
}

/** Make user admin */
export async function makeUserAdmin(userId: string) {
  const supabase = createClient();

  return await supabase
    .from('profiles')
    .update({ is_admin: true })
    .eq('id', userId);
}

/** Remove admin privilege */
export async function removeUserAdmin(userId: string) {
  const supabase = createClient();

  return await supabase
    .from('profiles')
    .update({ is_admin: false })
    .eq('id', userId);
}
