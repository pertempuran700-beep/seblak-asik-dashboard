'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, clearSession } from '@/lib/auth';

export function useAuth({ redirectIfUnauthenticated = true } = {}) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      setLoading(false);
      if (redirectIfUnauthenticated) router.push('/');
      return;
    }
    setUser(session.user);
    setLoading(false);
  }, []);

  function logout() {
    clearSession();
    router.push('/');
  }

  return { user, loading, logout };
}
