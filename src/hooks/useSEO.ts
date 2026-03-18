import { useEffect } from 'react';

const SITE_URL = 'https://sylviosrecords.com.br';

export function useSEO(opts: {
  title?: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
}) {
  useEffect(() => {
    // Title
    if (opts.title) {
      document.title = `${opts.title} | Sylvios Records`;
    }

    // Description
    let descEl = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (opts.description && descEl) {
      descEl.content = opts.description;
    }

    // Canonical
    const canonicalUrl = opts.canonical
      ? `${SITE_URL}${opts.canonical.startsWith('/') ? opts.canonical : `/${opts.canonical}`}`
      : `${SITE_URL}${window.location.pathname}`;

    let canonicalEl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.rel = 'canonical';
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.href = canonicalUrl;

    // Robots
    let robotsEl = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robotsEl) {
      robotsEl = document.createElement('meta');
      robotsEl.name = 'robots';
      document.head.appendChild(robotsEl);
    }
    robotsEl.content = opts.noindex ? 'noindex, nofollow' : 'index, follow';

    // OG URL sync
    let ogUrlEl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');
    if (ogUrlEl) ogUrlEl.content = canonicalUrl;

  }, [opts.title, opts.description, opts.canonical, opts.noindex]);
}
