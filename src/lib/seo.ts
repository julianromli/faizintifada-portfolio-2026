import { SOCIAL_LINKS } from '../constants';

const DEFAULT_SITE_URL = 'https://faizintifada.com';

export const SEO = {
  siteName: 'Faiz Intifada',
  defaultTitle: 'Faiz Intifada — Design Engineer | Portfolio',
  titleTemplate: '%s | Faiz Intifada',
  defaultDescription:
    'Faiz Intifada is a design engineer based in Indonesia. Portfolio and case studies in product design, UI engineering, and polished digital experiences.',
  jobTitle: 'Design Engineer',
  locale: 'en_US',
  twitterHandle: '@faizintifada_',
} as const;

export function getSiteUrl(): string {
  const raw = import.meta.env.VITE_SITE_URL?.trim();
  if (!raw) return DEFAULT_SITE_URL;
  return raw.replace(/\/$/, '');
}

export function absoluteUrl(path = '/'): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}

/** Default Open Graph / Twitter card image (`public/og-image.png`). */
export function getDefaultOgImage(): string {
  return absoluteUrl('/og-image.png');
}

export function pageTitle(title?: string): string {
  if (!title) return SEO.defaultTitle;
  return `${title} | ${SEO.siteName}`;
}

export function truncateDescription(text: string, max = 160): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

export function personSchema() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        name: SEO.siteName,
        url: getSiteUrl(),
        jobTitle: SEO.jobTitle,
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'ID',
        },
        sameAs: SOCIAL_LINKS.map((link) => link.href),
      },
      {
        '@type': 'WebSite',
        name: `${SEO.siteName} Portfolio`,
        url: getSiteUrl(),
      },
    ],
  };
}

export function creativeWorkSchema(project: {
  title: string;
  description: string;
  image: string;
  slug: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    description: project.description,
    image: project.image,
    url: absoluteUrl(`/project/${project.slug}`),
    author: {
      '@type': 'Person',
      name: SEO.siteName,
      url: getSiteUrl(),
      jobTitle: SEO.jobTitle,
    },
  };
}
