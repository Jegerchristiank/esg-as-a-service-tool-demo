/**
 * Next.js konfiguration for webappen.
 * @type {import('next').NextConfig}
 */
const config = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  },
  transpilePackages: ['@org/shared']
}

export default config
