'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** Re-renders the server data every few seconds while the tab is visible. */
export function AutoRefresh({ everyMs }: { everyMs: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, everyMs);
    return () => clearInterval(id);
  }, [router, everyMs]);
  return null;
}
