import Link from 'next/link';
import { Suspense } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { customerLogoutAction } from '@/lib/actions/customer';
import { getCustomer } from '@/lib/backend/customer-server';

/**
 * The customer app frame, made for phones: brand + account on top, two tabs.
 * The account part reads the session, so it streams in behind Suspense.
 */
export function CustomerShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col">
      <header className="flex items-center justify-between gap-3 px-4 py-3">
        <Link href="/app" className="text-xl font-bold tracking-tight">
          Kahwti
        </Link>
        <Suspense fallback={<div className="h-8 w-24 animate-pulse rounded bg-muted" aria-hidden />}>
          <Account />
        </Suspense>
      </header>
      <nav className="grid grid-cols-2 gap-1 border-b px-4 pb-2" aria-label="Navigation">
        <Link href="/app" className="rounded-md px-3 py-2 text-center text-sm font-medium hover:bg-accent">
          Mes points
        </Link>
        <Link href="/app/cafes" className="rounded-md px-3 py-2 text-center text-sm font-medium hover:bg-accent">
          Cafés
        </Link>
      </nav>
      <main className="flex-1 px-4 py-6">{children}</main>
    </div>
  );
}

async function Account() {
  const me = await getCustomer();
  if (!me) {
    return (
      <Link href="/app/login" className={buttonVariants({ size: 'sm', variant: 'outline' })}>
        Se connecter
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <span className="max-w-32 truncate text-sm text-muted-foreground">{me.name}</span>
      <form action={customerLogoutAction}>
        <Button type="submit" variant="outline" size="sm">
          Déconnexion
        </Button>
      </form>
    </div>
  );
}
