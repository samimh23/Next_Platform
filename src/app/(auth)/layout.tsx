import Link from 'next/link';

/** Centered card layout for login / sign-up. */
export default function AuthLayout({ children }: LayoutProps<'/'>) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-10">
      <Link href="/" className="text-2xl font-bold tracking-tight">
        Kahwti
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
