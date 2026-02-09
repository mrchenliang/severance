/** @type {import('next').NextConfig} */
// For GitHub Pages: Set GITHUB_PAGES=true and GITHUB_PAGES_BASE_PATH=/repo-name
const isGitHubPages = process.env.GITHUB_PAGES === 'true'
const basePath = process.env.GITHUB_PAGES_BASE_PATH || ''

const nextConfig = {
  reactStrictMode: true,
  // GitHub Pages requires static export
  ...(isGitHubPages ? {
    output: 'export',
    basePath: basePath || undefined,
    assetPrefix: basePath || undefined,
    images: {
      unoptimized: true,
    },
    // Ensure CSS and JS are loaded from correct paths
    distDir: 'out',
  } : {}),
  // Ensure proper handling of static assets
  trailingSlash: false,
}

module.exports = nextConfig
