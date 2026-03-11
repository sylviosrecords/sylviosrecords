import { useEffect } from 'react';
import { STORE_NAME, STORE_LOGO } from '../config';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
}

export function SEO({ title, description, image, url, type = 'website' }: SEOProps) {
  useEffect(() => {
    // 1. Title
    const finalTitle = title ? `${title} — ${STORE_NAME}` : STORE_NAME;
    document.title = finalTitle;

    // 2. Helper para setar Meta Tag
    const setMeta = (nameOrProperty: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${nameOrProperty}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, nameOrProperty);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // 3. Descrição padrão do Google
    if (description) setMeta('description', description);

    // 4. OpenGraph (Essencial para Zap, Insta, Twitter, etc)
    setMeta('og:title', finalTitle, true);
    if (description) setMeta('og:description', description, true);
    setMeta('og:image', image || STORE_LOGO, true);
    if (url) setMeta('og:url', url, true);
    setMeta('og:type', type, true);

    // 5. Canonical Link (Evita punição de página duplicada no Google)
    if (url) {
      let linkRaw = document.querySelector("link[rel='canonical']") as HTMLLinkElement;
      if (!linkRaw) {
        linkRaw = document.createElement('link');
        linkRaw.setAttribute('rel', 'canonical');
        document.head.appendChild(linkRaw);
      }
      linkRaw.setAttribute('href', url);
    }

  }, [title, description, image, url, type]);

  return null;
}
