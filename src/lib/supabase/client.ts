import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

/**
 * Supabase client for client-side operations
 * Use this in React components and client-side code
 */
export const createClient = () => {
  return createClientComponentClient();
};
