/** @type {import('next').NextConfig} */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseHost = undefined;

try {
  if (supabaseUrl) {
    supabaseHost = new URL(supabaseUrl).hostname;
  }
} catch (e) {
  // ignore invalid URL at build time
}

const nextConfig = {
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com'].concat(
      supabaseHost ? [supabaseHost] : [],
    ),
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY || '',
  },
};

module.exports = nextConfig;
