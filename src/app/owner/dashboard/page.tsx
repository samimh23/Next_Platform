import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getMe } from '@/lib/backend/server';

export const metadata: Metadata = { title: 'Tableau de bord' };

export default function DashboardPage() {
  return (
    <div className="grid gap-6">
      <Suspense fallback={<div className="h-14 w-64 animate-pulse rounded bg-muted" aria-hidden />}>
        <Greeting />
      </Suspense>
      <Card>
        <CardHeader>
          <CardTitle>Ventes du jour</CardTitle>
          <CardDescription>Le tableau de bord arrive à la prochaine étape.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Prochaines étapes : associer une caisse, créer le menu, puis suivre les ventes en direct ici.
        </CardContent>
      </Card>
    </div>
  );
}

async function Greeting() {
  const me = await getMe();
  const branch = me.branches[0];
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Bonjour {me.user.name} 👋</h1>
      <p className="text-muted-foreground">
        {branch ? `${branch.name} · ` : ''}
        {me.user.role === 'owner' ? 'Propriétaire' : 'Gérant'}
      </p>
    </div>
  );
}
