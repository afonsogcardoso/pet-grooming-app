const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null

const remotePatterns = [
  {
    protocol: 'https',
    hostname: '**.supabase.co',
    pathname: '/storage/v1/object/public/**'
  }
]

if (supabaseHost) {
  remotePatterns.push({
    protocol: 'https',
    hostname: supabaseHost,
    pathname: '/**'
  })
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns
  }
}

export default nextConfig;
