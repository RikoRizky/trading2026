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

  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      // FIX: handle redirect di client-side
      emailRedirectTo: `${location.origin}/auth/callback`,
    },
  });
}

/** Sign in */
export async function signIn(email: string, password: string) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  if (data.user && data.user.email_confirmed_at === null) {
    throw new Error("Email belum diverifikasi. Silakan cek inbox.");
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

  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
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
