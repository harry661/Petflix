import { useEffect } from 'react';

interface MetaTags {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

export function useMetaTags({ title, description, image, url }: MetaTags) {
  useEffect(() => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const fullUrl = url ? `${baseUrl}${url}` : baseUrl;

    // Update or create title
    if (title) {
      document.title = `${title} | Petflix`;
    }

    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    if (description) {
      metaDescription.setAttribute('content', description);
    }

    // Update Open Graph tags
    const updateOGTag = (property: string, content: string) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    if (title) updateOGTag('og:title', title);
    if (description) updateOGTag('og:description', description);
    if (image) updateOGTag('og:image', image);
    updateOGTag('og:url', fullUrl);

    // Update Twitter tags
    const updateTwitterTag = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    if (title) updateTwitterTag('twitter:title', title);
    if (description) updateTwitterTag('twitter:description', description);
    if (image) updateTwitterTag('twitter:image', image);
    updateTwitterTag('twitter:url', fullUrl);

    // Cleanup function to restore defaults
    return () => {
      document.title = 'Petflix - Pet Videos';
      const defaultDesc = 'Discover, share, and engage with pet videos from YouTube';
      if (metaDescription) {
        metaDescription.setAttribute('content', defaultDesc);
      }
    };
  }, [title, description, image, url]);
}

