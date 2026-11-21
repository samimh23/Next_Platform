import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { publicFetch } from '@/lib/backend/customer-server';
import type { CafeSummary } from '@/lib/backend/types';

export const metadata: Metadata = { title: 'Cafés' };

/** Find a café (name or city). No account needed. */
export default function CafesPage({ searchParams }: PageProps<'/app/cafes'>) {
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Cafés</h1>
      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-muted" aria-hidden />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Results({ searchParams }: Pick<PageProps<'/app/cafes'>, 'searchParams'>) {
  const { q } = await searchParams;
  const query = typeof q === 'string' ? q.slice(0, 60) : '';
  const cafes = await publicFetch<CafeSummary[]>(`/v1/public/cafes${query ? `?q=${encodeURIComponent(query)}` : ''}`);
  return (
    <>
      <form className="flex gap-2" role="search">
        <Input name="q" defaultValue={query} placeholder="Nom du café ou ville" aria-label="Rechercher un café" />
        <Button type="submit">Rechercher</Button>
      </form>
      {cafes.length === 0 ? (
        <p className="text-center text-muted-foreground">
          {query ? `Aucun café trouvé pour « ${query} ».` : 'Aucun café pour le moment.'}
        </p>
      ) : (
        <ul className="grid gap-3">
          {cafes.map((c) => (
            <li key={c.id}>
              <Link href={`/app/cafes/${c.id}`} className="block rounded-xl border p-4 hover:bg-accent">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{c.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {[c.city, c.address].filter(Boolean).join(' · ') || c.businessName}
                    </p>
                  </div>
                  {c.loyalty && <Badge variant="secondary">Fidélité</Badge>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
