import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Supabase client for server-side operations
 * Use this in Server Components, API routes, and server actions
 */
export const createServerClient = () => {
  const cookieStore = cookies();
  return createServerComponentClient({ cookies: () => cookieStore });
};

/**
 * Supabase client with service role key for admin operations
 * Use this only in server-side code that needs elevated permissions
 */
export const createServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  return createServerComponentClient({ cookies: () => cookies() });
};

/**
 * Helper function to get current user from server-side
 */
export async function getServerUser() {
  const supabase = createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  
  return user;
}

/**
 * Helper function to get user profile from server-side
 */
export async function getServerProfile(userId: string) {
  const supabase = createServerClient();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error) {
    console.error('Error getting profile:', error);
    return null;
  }
  
  return profile;
}

/**
 * Helper function to check if user has premium access
 */
export async function hasPremiumAccess(userId?: string): Promise<boolean> {
  if (!userId) return false;
  
  const profile = await getServerProfile(userId);
  if (!profile) return false;
  
  if (profile.membership_type !== 'premium') return false;
  
  if (profile.membership_expires_at) {
    const expirationDate = new Date(profile.membership_expires_at);
    return expirationDate > new Date();
  }
  
  return true;
}
