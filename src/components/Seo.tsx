import { Helmet } from 'react-helmet-async';
import { SEO, absoluteUrl, pageTitle, truncateDescription } from '../lib/seo';

type SeoProps = {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

export function Seo({
  title,
  description = SEO.defaultDescription,
  path = '/',
  image = SEO.defaultOgImage,
  type = 'website',
  noIndex = false,
  jsonLd,
}: SeoProps) {
  const resolvedTitle = title ? pageTitle(title) : SEO.defaultTitle;
  const canonical = absoluteUrl(path);
  const metaDescription = truncateDescription(description);
  const jsonLdPayload = jsonLd
    ? Array.isArray(jsonLd)
      ? jsonLd
      : [jsonLd]
    : [];

  return (
    <Helmet>
      <html lang="en" />
      <title>{resolvedTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={canonical} />
      {noIndex ? <meta name="robots" content="noindex,nofollow" /> : null}

      <meta property="og:site_name" content={SEO.siteName} />
      <meta property="og:title" content={resolvedTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content={SEO.locale} />
      <meta property="og:image" content={image} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={SEO.twitterHandle} />
      <meta name="twitter:title" content={resolvedTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={image} />

      {jsonLdPayload.map((entry, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(entry)}
        </script>
      ))}
    </Helmet>
  );
}
