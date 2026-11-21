import Link from 'next/link';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { logoutAction } from '@/lib/actions/auth';
import { getMe } from '@/lib/backend/server';

const NAV = [
  { href: '/owner/dashboard', label: 'Tableau de bord' },
  { href: '/owner/sales', label: 'Ventes' },
  { href: '/owner/cash', label: 'Clôtures' },
  { href: '/owner/menu', label: 'Menu' },
  { href: '/owner/floor', label: 'Salle & tables' },
  { href: '/owner/staff', label: 'Personnel' },
  { href: '/owner/loyalty', label: 'Fidélité' },
  { href: '/owner/devices', label: 'Caisses' },
  { href: '/owner/settings', label: 'Établissement' },
];

/**
 * Owner area. Navigation is static (renders instantly); the café/user name
 * reads the session, so it streams in behind Suspense.
 */
export default function OwnerLayout({ children }: LayoutProps<'/owner'>) {
  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="border-b md:w-60 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between gap-2 px-4 py-3 md:block">
          <Suspense fallback={<IdentitySkeleton />}>
            <Identity />
          </Suspense>
          <form action={logoutAction} className="md:mt-3">
            <Button type="submit" variant="outline" size="sm">
              Déconnexion
            </Button>
          </form>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:pb-0" aria-label="Navigation principale">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}

async function Identity() {
  const me = await getMe();
  return (
    <div>
      <p className="font-semibold leading-tight">{me.tenant.name}</p>
      <p className="text-sm text-muted-foreground">{me.user.name}</p>
    </div>
  );
}

function IdentitySkeleton() {
  return (
    <div className="grid gap-1.5" aria-hidden>
      <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      <div className="h-3 w-20 animate-pulse rounded bg-muted" />
    </div>
  );
}
