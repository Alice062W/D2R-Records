import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// GitHub Pages serves this repo under /<repo-name>/, so the basePath is only
// needed when building in that Actions workflow — local dev and other hosts stay at "/".
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const basePath = process.env.GITHUB_ACTIONS === 'true' && repoName ? `/${repoName}` : '';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
};

export default withNextIntl(nextConfig);
