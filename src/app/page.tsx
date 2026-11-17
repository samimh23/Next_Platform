import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Kahwti</h1>
      <p className="max-w-md text-muted-foreground">
        La caisse pour cafés et restaurants qui marche même sans internet. Suivez vos ventes en direct, depuis votre
        téléphone.
      </p>
      <div className="flex gap-3">
        <Link href="/signup" className={buttonVariants({ size: 'lg' })}>
          Créer mon café
        </Link>
        <Link href="/login" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
          Se connecter
        </Link>
      </div>
    </main>
  );
}
