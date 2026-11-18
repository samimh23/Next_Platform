import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="text-5xl font-semibold">404</p>
      <p className="text-muted-foreground">Cette page ou ce ticket est introuvable.</p>
      <Link href="/owner/dashboard" className={buttonVariants({ variant: 'outline' })}>
        Retour au tableau de bord
      </Link>
    </main>
  );
}
