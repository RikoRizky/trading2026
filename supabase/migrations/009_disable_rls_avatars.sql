-- Temporarily disable RLS for avatars bucket to allow uploads
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Create avatars storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Keep RLS disabled for avatars bucket for now
-- This will be re-enabled with proper policies later
