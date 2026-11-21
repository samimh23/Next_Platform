import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { previewReceiptCode } from '@/lib/auth/customer';
import { hasCustomerSession } from '@/lib/backend/customer-server';
import { formatDateTimeTunis } from '@/lib/dates';
import { formatDT } from '@/lib/money';
import { ClaimButton } from './claim-button';

export const metadata: Metadata = { title: 'Mes points', robots: { index: false } };

/**
 * Opened by the phone camera from the receipt QR. Shows the ticket, then
 * "Récupérer mes points" (a button, not on page load: opening a link never changes anything).
 */
export default function ReceiptPage({ params }: PageProps<'/r/[code]'>) {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" aria-hidden />}>
      <Receipt params={params} />
    </Suspense>
  );
}

async function Receipt({ params }: Pick<PageProps<'/r/[code]'>, 'params'>) {
  const code = decodeURIComponent((await params).code);
  const preview = previewReceiptCode(code);
  if (!preview) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          Ce code n’est pas un ticket Kahwti valide.
        </CardContent>
      </Card>
    );
  }
  const loggedIn = await hasCustomerSession();
  const next = encodeURIComponent(`/r/${code}`);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ticket {preview.receiptNumber}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {formatDateTimeTunis(preview.at.toISOString())} · {formatDT(preview.total)}
        </p>
      </CardHeader>
      <CardContent className="grid gap-3">
        {loggedIn ? (
          <ClaimButton code={code} />
        ) : (
          <>
            <p className="text-sm">Créez votre compte gratuit pour gagner les points de ce ticket.</p>
            <Link href={`/app/signup?next=${next}`} className={buttonVariants({ size: 'lg' })}>
              Créer mon compte
            </Link>
            <Link href={`/app/login?next=${next}`} className={buttonVariants({ variant: 'outline', size: 'lg' })}>
              J’ai déjà un compte
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
