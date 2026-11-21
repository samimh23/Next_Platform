import type { Metadata, Viewport } from 'next';
import { CustomerShell } from '@/components/customer/customer-shell';

export const metadata: Metadata = {
  title: { default: 'Mes points', template: '%s · Kahwti' },
  description: 'Vos points fidélité dans les cafés Kahwti',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = { themeColor: '#1c1917' };

/** Customer app: earn and follow loyalty points, find cafés. */
export default function CustomerLayout({ children }: LayoutProps<'/app'>) {
  return <CustomerShell>{children}</CustomerShell>;
}
