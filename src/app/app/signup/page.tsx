import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CustomerAuthForm } from '@/components/customer/customer-auth-form';

export const metadata: Metadata = { title: 'Créer mon compte' };

export default function CustomerSignupPage({ searchParams }: PageProps<'/app/signup'>) {
  return (
    <Suspense fallback={<CustomerAuthForm mode="signup" />}>
      <WithNext searchParams={searchParams} />
    </Suspense>
  );
}

async function WithNext({ searchParams }: Pick<PageProps<'/app/signup'>, 'searchParams'>) {
  const { next } = await searchParams;
  return <CustomerAuthForm mode="signup" next={typeof next === 'string' ? next : undefined} />;
}
