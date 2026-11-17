import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Se connecter' };

/**
 * The form is static (instant). Only reading `?next=` needs the request,
 * so that part streams in behind Suspense (Cache Components rule).
 */
export default function LoginPage({ searchParams }: PageProps<'/login'>) {
  return (
    <Suspense fallback={<LoginForm />}>
      <LoginWithNext searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginWithNext({ searchParams }: Pick<PageProps<'/login'>, 'searchParams'>) {
  const { next } = await searchParams;
  return <LoginForm next={typeof next === 'string' ? next : undefined} />;
}
