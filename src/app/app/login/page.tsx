import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CustomerAuthForm } from '@/components/customer/customer-auth-form';

export const metadata: Metadata = { title: 'Se connecter' };

export default function CustomerLoginPage({ searchParams }: PageProps<'/app/login'>) {
  return (
    <Suspense fallback={<CustomerAuthForm mode="login" />}>
      <WithNext searchParams={searchParams} />
    </Suspense>
  );
}

async function WithNext({ searchParams }: Pick<PageProps<'/app/login'>, 'searchParams'>) {
  const { next } = await searchParams;
  return <CustomerAuthForm mode="login" next={typeof next === 'string' ? next : undefined} />;
}
