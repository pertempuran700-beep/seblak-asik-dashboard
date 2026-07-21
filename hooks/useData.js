'use client';
import { useEffect, useState, useCallback } from 'react';

/**
 * useData — fetch data dari fungsi async (biasanya api.xxx), dengan
 * state loading/error, dan `refetch` untuk refresh manual setelah
 * mutasi (mis. setelah createSale).
 */
export function useData(fetchFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
}
