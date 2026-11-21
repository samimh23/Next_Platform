import type { MetadataRoute } from 'next';

/** "Add to home screen": the customer app opens like an app, on "Mes points". */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kahwti — Mes points fidélité',
    short_name: 'Kahwti',
    description: 'Vos points fidélité dans les cafés Kahwti',
    start_url: '/app',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1c1917',
    lang: 'fr',
    icons: [{ src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' }],
  };
}
